const db = require('../config/db');

exports.getSettings = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM settings');
        const settingsObj = {};
        rows.forEach(item => {
            settingsObj[item.setting_key] = item.setting_value;
        });
        res.json({ success: true, data: settingsObj });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const settings = req.body; // Expects object: { site_name: '...', ... }
        
        for (const [key, value] of Object.entries(settings)) {
            // Check if exists
            const [exists] = await db.query('SELECT id FROM settings WHERE setting_key = ?', [key]);
            if (exists.length > 0) {
                await db.query('UPDATE settings SET setting_value = ? WHERE setting_key = ?', [value, key]);
            } else {
                await db.query('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, value]);
            }
        }

        res.json({ success: true, message: 'Cập nhật cài đặt thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
