const db = require('../config/db');

// Helper to get or create cart
const getOrCreateCart = async (user_id) => {
    let [carts] = await db.query('SELECT id FROM carts WHERE user_id = ?', [user_id]);
    if (carts.length === 0) {
        const [result] = await db.query('INSERT INTO carts (user_id) VALUES (?)', [user_id]);
        return result.insertId;
    }
    return carts[0].id;
};

exports.getCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const cartId = await getOrCreateCart(user_id);

        const [items] = await db.query(`
            SELECT ci.id as cart_item_id, ci.quantity, b.*, c.name as category_name
            FROM cart_items ci
            JOIN books b ON ci.book_id = b.id
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE ci.cart_id = ?
        `, [cartId]);

        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { book_id, quantity = 1 } = req.body;
        const user_id = req.user.id;

        // Check stock + storefront visibility (book active, category active, no inactive author)
        const [book] = await db.query(`
            SELECT b.stock_quantity, b.title, b.is_active,
                   COALESCE(c.is_active, 1) AS category_active,
                   (
                     SELECT COUNT(*) FROM book_authors ba
                     JOIN authors a ON ba.author_id = a.id
                     WHERE ba.book_id = b.id AND a.is_active = 0
                   ) AS inactive_author_count
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.id = ?
        `, [book_id]);
        if (book.length === 0) {
            return res.status(404).json({ success: false, message: 'Sách không tồn tại' });
        }

        if (!book[0].is_active || !book[0].category_active || Number(book[0].inactive_author_count) > 0) {
            return res.status(400).json({ success: false, message: 'Sách hiện không còn bán' });
        }

        if (book[0].stock_quantity < quantity) {
            return res.status(400).json({ success: false, message: `Sách "${book[0].title}" chỉ còn ${book[0].stock_quantity} sản phẩm` });
        }

        const cartId = await getOrCreateCart(user_id);

        // Check if item already in cart
        const [existing] = await db.query('SELECT id, quantity FROM cart_items WHERE cart_id = ? AND book_id = ?', [cartId, book_id]);

        if (existing.length > 0) {
            const newQuantity = existing[0].quantity + Number(quantity);
            if (book[0].stock_quantity < newQuantity) {
                return res.status(400).json({ success: false, message: 'Số lượng trong giỏ hàng vượt quá tồn kho' });
            }
            await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQuantity, existing[0].id]);
        } else {
            await db.query('INSERT INTO cart_items (cart_id, book_id, quantity) VALUES (?, ?, ?)', [cartId, book_id, quantity]);
        }

        res.json({ success: true, message: 'Đã thêm vào giỏ hàng' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { id } = req.params; // cart_item_id
        const { quantity } = req.body;
        const user_id = req.user.id;

        // Verify ownership and check stock
        const [item] = await db.query(`
            SELECT ci.*, b.stock_quantity 
            FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            JOIN books b ON ci.book_id = b.id
            WHERE ci.id = ? AND c.user_id = ?
        `, [id, user_id]);

        if (item.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ hàng' });
        }

        if (item[0].stock_quantity < quantity) {
            return res.status(400).json({ success: false, message: 'Số lượng vượt quá tồn kho' });
        }

        if (quantity <= 0) {
            await db.query('DELETE FROM cart_items WHERE id = ?', [id]);
            return res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
        }

        await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantity, id]);
        res.json({ success: true, message: 'Cập nhật số lượng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.removeCartItem = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        // Verify ownership before delete
        const [item] = await db.query(`
            SELECT ci.id FROM cart_items ci
            JOIN carts c ON ci.cart_id = c.id
            WHERE ci.id = ? AND c.user_id = ?
        `, [id, user_id]);

        if (item.length === 0) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không có trong giỏ hàng của bạn' });
        }

        await db.query('DELETE FROM cart_items WHERE id = ?', [id]);
        res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [cart] = await db.query('SELECT id FROM carts WHERE user_id = ?', [user_id]);
        
        if (cart.length > 0) {
            await db.query('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id]);
        }

        res.json({ success: true, message: 'Đã làm trống giỏ hàng' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
