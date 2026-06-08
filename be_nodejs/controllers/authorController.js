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

exports.getAllAuthors = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, name, bio as biography, slug, avatar, is_active FROM authors ORDER BY name ASC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createAuthor = async (req, res) => {
    try {
        const { name, biography, is_active } = req.body;
        const slug = generateSlug(name) + '-' + Date.now();
        console.log('Creating author:', { name, biography, slug, is_active });
        const isActiveVal = is_active !== undefined ? is_active : 1;
        const [result] = await db.query('INSERT INTO authors (name, bio, slug, is_active) VALUES (?, ?, ?, ?)', [name, biography || '', slug, isActiveVal]);
        res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Thêm tác giả thành công' });
    } catch (error) {
        console.error('Create author error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, biography, is_active } = req.body;
        console.log('Updating author:', { id, name, biography, is_active });
        const isActiveVal = is_active !== undefined ? is_active : 1;
        await db.query('UPDATE authors SET name = ?, bio = ?, is_active = ? WHERE id = ?', [name, biography || '', isActiveVal, id]);
        res.json({ success: true, message: 'Cập nhật tác giả thành công' });
    } catch (error) {
        console.error('Update author error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAuthor = async (req, res) => {
    try {
        const { id } = req.params;
        // Check if author has books
        const [books] = await db.query('SELECT book_id FROM book_authors WHERE author_id = ?', [id]);
        if (books.length > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tác giả đã có sách trong hệ thống' });
        }
        await db.query('DELETE FROM authors WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa tác giả thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
