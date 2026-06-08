const db = require('../config/db');

exports.getAllBanners = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM banners ORDER BY sort_order ASC, created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createBanner = async (req, res) => {
    try {
        const { title, link, sort_order, is_active } = req.body;
        let image_url = '';

        if (req.file) {
            image_url = `/public/uploads/banners/${req.file.filename}`;
        }

        const [result] = await db.query(`
            INSERT INTO banners (title, image_url, link, sort_order, is_active)
            VALUES (?, ?, ?, ?, ?)
        `, [title, image_url, link, sort_order || 0, is_active || 1]);

        res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Thêm banner thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, link, sort_order, is_active } = req.body;
        
        let query = 'UPDATE banners SET title=?, link=?, sort_order=?, is_active=?';
        const params = [title, link, sort_order, is_active];

        if (req.file) {
            query += ', image_url=?';
            params.push(`/public/uploads/banners/${req.file.filename}`);
        }

        query += ' WHERE id=?';
        params.push(id);

        await db.query(query, params);
        res.json({ success: true, message: 'Cập nhật banner thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM banners WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa banner thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
