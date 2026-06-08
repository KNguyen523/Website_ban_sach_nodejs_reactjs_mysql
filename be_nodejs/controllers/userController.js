const db = require('../config/db');
const bcrypt = require('bcrypt');

exports.getAllUsers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, full_name, email, phone, role, is_active, blocked_reason, is_verified, created_at 
            FROM users 
            ORDER BY created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateMe = async (req, res) => {
    try {
        const userId = req.user.id;
        const { full_name, phone } = req.body;
        let avatar = req.body.avatar;

        if (req.file) {
            avatar = `/public/uploads/users/${req.file.filename}`;
        }

        await db.query(
            'UPDATE users SET full_name = ?, phone = ?, avatar = ? WHERE id = ?',
            [full_name, phone, avatar, userId]
        );

        const [updated] = await db.query('SELECT id, full_name, email, phone, role, avatar FROM users WHERE id = ?', [userId]);

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            data: updated[0]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
        const user = users[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ success: true, message: 'Đổi mật khẩu thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active, blocked_reason } = req.body;

        if (Number(req.user.id) === Number(id)) {
            return res.status(403).json({ success: false, message: 'Không thể tự thay đổi trạng thái tài khoản của chính mình' });
        }

        const nextActive = Number(is_active) === 1 ? 1 : 0;
        const reason = typeof blocked_reason === 'string' ? blocked_reason.trim() : '';

        if (!nextActive && !reason) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập lý do khóa tài khoản' });
        }

        await db.query(
            'UPDATE users SET is_active = ?, blocked_reason = ? WHERE id = ?',
            [nextActive, nextActive ? null : reason, id]
        );
        res.json({ success: true, message: 'Cập nhật trạng thái người dùng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (Number(req.user.id) === Number(id)) {
            return res.status(403).json({ success: false, message: 'Không thể tự thay đổi quyền hạn của chính mình' });
        }

        await db.query('UPDATE users SET role = ? WHERE id = ?', [role, id]);
        res.json({ success: true, message: 'Cập nhật quyền hạn thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { full_name, email, phone, password, role, is_active } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập đủ họ tên, email và mật khẩu' });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
        }

        if (String(password).length < 6) {
            return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        }

        if (phone) {
            const phoneRegex = /^0[0-9]{9}$/;
            if (!phoneRegex.test(phone)) {
                return res.status(400).json({ success: false, message: 'Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0' });
            }
        }

        const validRoles = ['admin', 'staff', 'customer'];
        const finalRole = validRoles.includes(role) ? role : 'customer';

        // Only admin can create admin/staff accounts
        if ((finalRole === 'admin' || finalRole === 'staff') && req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Chỉ Admin mới có thể tạo tài khoản nhân viên' });
        }

        // Check email exists
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email này đã được sử dụng' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const [result] = await db.query(
            `INSERT INTO users (full_name, email, phone, password, role, is_active, is_verified)
             VALUES (?, ?, ?, ?, ?, ?, 1)`,
            [full_name.trim(), email.trim(), phone || null, hashedPassword, finalRole, is_active === 0 ? 0 : 1]
        );

        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản thành công',
            data: { id: result.insertId }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Optional: Check if admin
        const [user] = await db.query('SELECT role FROM users WHERE id = ?', [id]);
        if (user[0]?.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Không thể xóa tài khoản Admin' });
        }

        await db.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa người dùng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
