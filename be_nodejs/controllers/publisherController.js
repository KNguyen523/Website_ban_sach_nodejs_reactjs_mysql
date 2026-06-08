const db = require('../config/db');

const generateSlug = (text) => {
    return text.toString().toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'd')
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
};

exports.getAllPublishers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT p.id, p.name, p.slug, p.logo, p.description, p.created_at, p.updated_at,
                   COUNT(b.id) AS book_count
            FROM publishers p
            LEFT JOIN books b ON b.publisher_id = p.id
            GROUP BY p.id, p.name, p.slug, p.logo, p.description, p.created_at, p.updated_at
            ORDER BY p.name ASC
        `);

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getPublisherById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM publishers WHERE id = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhà xuất bản' });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createPublisher = async (req, res) => {
    try {
        const { name, logo, description } = req.body;
        const publisherName = name?.trim();

        if (!publisherName) {
            return res.status(400).json({ success: false, message: 'Tên nhà xuất bản là bắt buộc' });
        }

        const [existing] = await db.query('SELECT id FROM publishers WHERE name = ?', [publisherName]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên nhà xuất bản này đã tồn tại' });
        }

        const slug = `${generateSlug(publisherName)}-${Date.now()}`;
        const [result] = await db.query(
            'INSERT INTO publishers (name, slug, logo, description) VALUES (?, ?, ?, ?)',
            [publisherName, slug, logo || null, description || null]
        );

        res.status(201).json({
            success: true,
            data: { id: result.insertId },
            message: 'Thêm nhà xuất bản thành công'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePublisher = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, logo, description } = req.body;
        const publisherName = name?.trim();

        if (!publisherName) {
            return res.status(400).json({ success: false, message: 'Tên nhà xuất bản là bắt buộc' });
        }

        const [existing] = await db.query('SELECT id FROM publishers WHERE name = ? AND id != ?', [publisherName, id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên nhà xuất bản này đã tồn tại' });
        }

        const [result] = await db.query(
            'UPDATE publishers SET name = ?, logo = ?, description = ? WHERE id = ?',
            [publisherName, logo || null, description || null, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhà xuất bản' });
        }

        res.json({ success: true, message: 'Cập nhật nhà xuất bản thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deletePublisher = async (req, res) => {
    try {
        const { id } = req.params;
        const [books] = await db.query('SELECT id FROM books WHERE publisher_id = ? LIMIT 1', [id]);

        if (books.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa nhà xuất bản đang có sách liên kết'
            });
        }

        const [result] = await db.query('DELETE FROM publishers WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy nhà xuất bản' });
        }

        res.json({ success: true, message: 'Xóa nhà xuất bản thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
