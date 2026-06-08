const db = require('../config/db');

exports.getAddresses = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.addAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { receiver_name, receiver_phone, province, district, ward, street_address, is_default } = req.body;

        if (is_default) {
            await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        const [result] = await db.query(
            'INSERT INTO addresses (user_id, receiver_name, receiver_phone, province, district, ward, street_address, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [userId, receiver_name, receiver_phone, province, district, ward, street_address, is_default ? 1 : 0]
        );

        res.status(201).json({ success: true, message: 'Thêm địa chỉ thành công', id: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { receiver_name, receiver_phone, province, district, ward, street_address, is_default } = req.body;

        if (is_default) {
            await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        }

        await db.query(
            'UPDATE addresses SET receiver_name = ?, receiver_phone = ?, province = ?, district = ?, ward = ?, street_address = ?, is_default = ? WHERE id = ? AND user_id = ?',
            [receiver_name, receiver_phone, province, district, ward, street_address, is_default ? 1 : 0, id, userId]
        );

        res.json({ success: true, message: 'Cập nhật địa chỉ thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await db.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [id, userId]);
        res.json({ success: true, message: 'Xóa địa chỉ thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.setDefaultAddress = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [userId]);
        await db.query('UPDATE addresses SET is_default = 1 WHERE id = ? AND user_id = ?', [id, userId]);

        res.json({ success: true, message: 'Đã đặt làm địa chỉ mặc định' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
