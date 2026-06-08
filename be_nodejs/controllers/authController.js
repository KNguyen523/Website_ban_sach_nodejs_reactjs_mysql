const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/emailService');

// Helper to generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email và mật khẩu' });
        }

        const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (users.length === 0) {
            return res.status(401).json({ status: 'error', message: 'Email hoặc mật khẩu không chính xác' });
        }

        const user = users[0];

        if (!user.is_active) {
            const reason = user.blocked_reason ? ` Lý do: ${user.blocked_reason}` : '';
            return res.status(403).json({
                status: 'error',
                message: `Tài khoản của bạn đã bị khóa.${reason}`,
                blocked: true,
                blocked_reason: user.blocked_reason || null
            });
        }

        if (!user.is_verified) {
            return res.status(403).json({ status: 'error', message: 'Tài khoản chưa được xác thực email', unverified: true, email: user.email });
        }

        console.log('--- DEBUG LOGIN ---');
        console.log('Email:', email);
        console.log('Raw Password input:', password);
        console.log('Hash in Database:', user.password);
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Is Match:', isMatch);
        console.log('-------------------');

        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Email hoặc mật khẩu không chính xác' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        // Remove password from response
        delete user.password;

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 1 day
        });

        res.status(200).json({
            status: 'success',
            message: 'Đăng nhập thành công',
            data: {
                user,
                token
            }
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
};

exports.logout = (req, res) => {
    res.clearCookie('token');
    res.status(200).json({ status: 'success', message: 'Đăng xuất thành công' });
};

exports.getMe = async (req, res) => {
    try {
        const [users] = await db.execute('SELECT id, full_name, email, phone, role, avatar FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });
        }
        res.status(200).json({ status: 'success', data: users[0] });
    } catch (err) {
        res.status(500).json({ status: 'error', message: 'Lỗi server' });
    }
};

exports.register = async (req, res) => {
    try {
        const { full_name, email, password, phone } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin' });
        }

        // Check if user exists
        const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ status: 'error', message: 'Email đã được sử dụng' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Insert user (is_verified: 0)
        const [result] = await db.execute(
            'INSERT INTO users (full_name, email, password, phone, role, is_active, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [full_name, email, hashedPassword, phone || null, 'customer', 1, 0]
        );

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        await db.execute(
            'INSERT INTO otp_verifications (email, otp_code, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, otp, 'register', expiresAt]
        );

        // Send OTP via Email
        try {
            await sendEmail({
                email,
                subject: 'Xác thực tài khoản BookStore',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                        <h2 style="color: #2c3e50; text-align: center;">Xác thực tài khoản</h2>
                        <p>Chào <strong>${full_name}</strong>,</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản tại BookStore. Mã OTP của bạn là:</p>
                        <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #e74c3c; border-radius: 5px; margin: 20px 0;">
                            ${otp}
                        </div>
                        <p>Mã này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #7f8c8d; text-align: center;">Đây là email tự động, vui lòng không phản hồi.</p>
                    </div>
                `
            });
        } catch (mailErr) {
            console.error('Mail error:', mailErr);
            // Even if mail fails, user is created, but they might need to resend OTP
        }

        res.status(201).json({
            status: 'success',
            message: 'Đăng ký thành công! Vui lòng kiểm tra email để nhận mã xác thực.',
            email
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi đăng ký' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp email và mã OTP' });
        }

        // Find latest valid OTP
        const [otps] = await db.execute(
            'SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND is_used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (otps.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Mã OTP không chính xác hoặc đã hết hạn' });
        }

        // Mark OTP as used
        await db.execute('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [otps[0].id]);

        // Update user status
        await db.execute('UPDATE users SET is_verified = 1 WHERE email = ?', [email]);

        res.status(200).json({
            status: 'success',
            message: 'Xác thực tài khoản thành công! Bạn có thể đăng nhập.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi xác thực' });
    }
};

exports.resendOTP = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Email không hợp lệ' });
        }

        // Check if user is already verified
        const [users] = await db.execute('SELECT full_name, is_verified FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });
        }

        if (users[0].is_verified) {
            return res.status(400).json({ status: 'error', message: 'Tài khoản này đã được xác thực trước đó' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.execute(
            'INSERT INTO otp_verifications (email, otp_code, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, otp, 'register', expiresAt]
        );

        // Send Email
        await sendEmail({
            email,
            subject: 'Mã OTP mới - BookStore',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2c3e50; text-align: center;">Mã xác thực mới</h2>
                    <p>Chào <strong>${users[0].full_name}</strong>,</p>
                    <p>Bạn đã yêu cầu gửi lại mã xác thực. Mã OTP mới của bạn là:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #e74c3c; border-radius: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>Mã này có hiệu lực trong <strong>5 phút</strong>.</p>
                </div>
            `
        });

        res.status(200).json({
            status: 'success',
            message: 'Đã gửi mã OTP mới vào email của bạn.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi gửi lại mã' });
    }
};

exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email' });
        }

        const [users] = await db.execute('SELECT full_name FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ status: 'error', message: 'Email này không tồn tại trên hệ thống' });
        }

        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        await db.execute(
            'INSERT INTO otp_verifications (email, otp_code, type, expires_at) VALUES (?, ?, ?, ?)',
            [email, otp, 'reset_password', expiresAt]
        );

        await sendEmail({
            email,
            subject: 'Đặt lại mật khẩu BookStore',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <h2 style="color: #2c3e50; text-align: center;">Quên mật khẩu?</h2>
                    <p>Chào <strong>${users[0].full_name}</strong>,</p>
                    <p>Bạn đã yêu cầu đặt lại mật khẩu. Mã OTP xác thực của bạn là:</p>
                    <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #e74c3c; border-radius: 5px; margin: 20px 0;">
                        ${otp}
                    </div>
                    <p>Mã này có hiệu lực trong <strong>5 phút</strong>. Nếu bạn không yêu cầu điều này, hãy bỏ qua email này.</p>
                </div>
            `
        });

        res.status(200).json({
            status: 'success',
            message: 'Mã xác thực đã được gửi đến email của bạn.'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi xử lý quên mật khẩu' });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({ status: 'error', message: 'Thiếu thông tin cần thiết' });
        }

        // Verify OTP
        const [otps] = await db.execute(
            'SELECT * FROM otp_verifications WHERE email = ? AND otp_code = ? AND type = "reset_password" AND is_used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (otps.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Mã OTP không chính xác hoặc đã hết hạn' });
        }

        // Mark OTP as used
        await db.execute('UPDATE otp_verifications SET is_used = 1 WHERE id = ?', [otps[0].id]);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update user password
        await db.execute('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);

        res.status(200).json({
            status: 'success',
            message: 'Mật khẩu đã được cập nhật thành công!'
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'error', message: 'Lỗi server khi đặt lại mật khẩu' });
    }
};
