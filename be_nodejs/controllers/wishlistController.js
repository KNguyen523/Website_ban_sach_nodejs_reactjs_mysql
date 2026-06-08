const db = require('../config/db');

exports.getWishlist = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [rows] = await db.query(`
            SELECT w.id as wishlist_id, b.*, c.name as category_name
            FROM wishlists w
            JOIN books b ON w.book_id = b.id
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE w.user_id = ?
        `, [user_id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addToWishlist = async (req, res) => {
    try {
        const { book_id } = req.body;
        const user_id = req.user.id;

        // Check if already in wishlist
        const [existing] = await db.query('SELECT id FROM wishlists WHERE user_id = ? AND book_id = ?', [user_id, book_id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Sách này đã có trong danh sách yêu thích' });
        }

        await db.query('INSERT INTO wishlists (user_id, book_id) VALUES (?, ?)', [user_id, book_id]);
        res.status(201).json({ success: true, message: 'Đã thêm vào danh sách yêu thích' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeFromWishlist = async (req, res) => {
    try {
        const { id } = req.params; // id of the book or wishlist? usually book_id for convenience
        const user_id = req.user.id;

        await db.query('DELETE FROM wishlists WHERE user_id = ? AND book_id = ?', [user_id, id]);
        res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.checkWishlistStatus = async (req, res) => {
    try {
        const { id } = req.params; // book_id
        const user_id = req.user.id;

        const [rows] = await db.query('SELECT id FROM wishlists WHERE user_id = ? AND book_id = ?', [user_id, id]);
        res.json({ success: true, isFavorite: rows.length > 0 });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
