const db = require('../config/db');

exports.getAllPosts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT id, title, slug, summary, thumbnail, created_at FROM posts WHERE is_published = 1 ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPostBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const [rows] = await db.query('SELECT * FROM posts WHERE slug = ? AND is_published = 1', [slug]);
        
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
        }

        // Increase view count
        await db.query('UPDATE posts SET view_count = view_count + 1 WHERE id = ?', [rows[0].id]);

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
