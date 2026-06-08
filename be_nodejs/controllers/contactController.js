const db = require('../config/db');

exports.submitContact = async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ thông tin' });
        }

        await db.query(
            'INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)',
            [name, email, subject, message]
        );

        res.status(201).json({ success: true, message: 'Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllContacts = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM contacts ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
