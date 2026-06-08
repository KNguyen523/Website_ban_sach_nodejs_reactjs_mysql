const db = require('../config/db');

exports.getProductReviews = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT r.*, u.full_name as user_name, u.avatar as user_avatar
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.book_id = ? AND r.is_approved = 1
            ORDER BY r.created_at DESC
        `, [id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkReviewEligibility = async (req, res) => {
    try {
        const { bookId } = req.params;
        const user_id = req.user.id;

        // Check if user already reviewed this book
        const [existing] = await db.query('SELECT id FROM reviews WHERE user_id = ? AND book_id = ?', [user_id, bookId]);
        if (existing.length > 0) {
            return res.json({ success: true, eligible: false, alreadyReviewed: true, message: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }

        // Check if user has a completed order with this book
        const [hasCompletedOrder] = await db.query(`
            SELECT o.id 
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ? AND oi.book_id = ? AND o.status = 'completed'
            LIMIT 1
        `, [user_id, bookId]);

        if (hasCompletedOrder.length === 0) {
            return res.json({ success: true, eligible: false, alreadyReviewed: false, message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng chứa sản phẩm này được giao thành công.' });
        }

        res.json({ success: true, eligible: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addReview = async (req, res) => {
    try {
        const { book_id, rating, comment } = req.body;
        const user_id = req.user.id;

        // Check if user already reviewed this book
        const [existing] = await db.query('SELECT id FROM reviews WHERE user_id = ? AND book_id = ?', [user_id, book_id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sách này rồi' });
        }

        // Check if user has a completed order with this book
        const [hasCompletedOrder] = await db.query(`
            SELECT o.id 
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ? AND oi.book_id = ? AND o.status = 'completed'
            LIMIT 1
        `, [user_id, book_id]);

        if (hasCompletedOrder.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng chứa sản phẩm này được giao thành công.' 
            });
        }

        const [result] = await db.query(`
            INSERT INTO reviews (user_id, book_id, rating, comment, is_approved)
            VALUES (?, ?, ?, ?, 1)
        `, [user_id, book_id, rating, comment]);

        // Update book's average rating and review count
        const [stats] = await db.query(`
            SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
            FROM reviews 
            WHERE book_id = ? AND is_approved = 1
        `, [book_id]);

        await db.query('UPDATE books SET avg_rating = ?, review_count = ? WHERE id = ?', 
            [stats[0].avg_rating || 0, stats[0].review_count || 0, book_id]);

        res.status(201).json({ success: true, message: 'Cảm ơn bạn đã đánh giá!' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u.full_name as user_name, b.title as book_title
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            LEFT JOIN books b ON r.book_id = b.id
            ORDER BY r.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateReviewStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_approved } = req.body;
        await db.query('UPDATE reviews SET is_approved = ? WHERE id = ?', [is_approved, id]);
        
        // Recalculate book rating after status change
        const [review] = await db.query('SELECT book_id FROM reviews WHERE id = ?', [id]);
        if (review.length > 0) {
            const book_id = review[0].book_id;
            const [stats] = await db.query(`
                SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
                FROM reviews 
                WHERE book_id = ? AND is_approved = 1
            `, [book_id]);
            await db.query('UPDATE books SET avg_rating = ?, review_count = ? WHERE id = ?', 
                [stats[0].avg_rating || 0, stats[0].review_count || 0, book_id]);
        }

        res.json({ success: true, message: 'Cập nhật trạng thái đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { id } = req.params;
        const [review] = await db.query('SELECT book_id FROM reviews WHERE id = ?', [id]);
        
        await db.query('DELETE FROM reviews WHERE id = ?', [id]);

        // Recalculate book rating after deletion
        if (review.length > 0) {
            const book_id = review[0].book_id;
            const [stats] = await db.query(`
                SELECT AVG(rating) as avg_rating, COUNT(*) as review_count 
                FROM reviews 
                WHERE book_id = ? AND is_approved = 1
            `, [book_id]);
            await db.query('UPDATE books SET avg_rating = ?, review_count = ? WHERE id = ?', 
                [stats[0].avg_rating || 0, stats[0].review_count || 0, book_id]);
        }

        res.json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
