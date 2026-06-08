const db = require('../config/db');

// Helper to generate slug
const generateSlug = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

exports.getAllCategories = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT c1.*, c2.name as parent_name 
            FROM categories c1
            LEFT JOIN categories c2 ON c1.parent_id = c2.id
            ORDER BY c1.sort_order ASC, c1.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }
        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createCategory = async (req, res) => {
    try {
        const { name, description, image, parent_id, is_active, sort_order } = req.body;

        // Check if name already exists
        const [existing] = await db.query('SELECT id FROM categories WHERE name = ?', [name]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại' });
        }

        const slug = generateSlug(name) + '-' + Date.now();

        const [result] = await db.query(`
            INSERT INTO categories (name, slug, description, image, parent_id, is_active, sort_order)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [name, slug, description, image, parent_id || null, is_active || 1, sort_order || 0]);

        res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Thêm danh mục thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, image, parent_id, is_active, sort_order } = req.body;

        // Check if name already exists in another category
        const [existing] = await db.query('SELECT id FROM categories WHERE name = ? AND id != ?', [name, id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại' });
        }

        await db.query(`
            UPDATE categories SET name=?, description=?, image=?, parent_id=?, is_active=?, sort_order=?
            WHERE id=?
        `, [name, description, image, parent_id || null, is_active, sort_order, id]);

        res.json({ success: true, message: 'Cập nhật danh mục thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if has children
        const [children] = await db.query('SELECT id FROM categories WHERE parent_id = ?', [id]);
        if (children.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa danh mục có chứa danh mục con' });
        }

        // Check if has products linked to this category
        const [books] = await db.query('SELECT id FROM books WHERE category_id = ?', [id]);
        if (books.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa danh mục đang có sản phẩm liên kết' });
        }

        await db.query('DELETE FROM categories WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
