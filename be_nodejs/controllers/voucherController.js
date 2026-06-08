const db = require('../config/db');

exports.getAllVouchers = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM coupons ORDER BY created_at DESC');
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createVoucher = async (req, res) => {
    try {
        const { 
            code, discount_type, discount_value, min_order_value, 
            max_discount_value, usage_limit, start_date, end_date, is_active 
        } = req.body;

        const [result] = await db.query(`
            INSERT INTO coupons (
                code, type, value, min_order_amount, 
                max_discount, usage_limit, start_date, end_date, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            code.toUpperCase(), discount_type, discount_value, min_order_value || 0, 
            max_discount_value || null, usage_limit || null, start_date, end_date, is_active || 1
        ]);

        res.status(201).json({ success: true, data: { id: result.insertId }, message: 'Thêm mã khuyến mãi thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            code, discount_type, discount_value, min_order_value, 
            max_discount_value, usage_limit, start_date, end_date, is_active 
        } = req.body;

        await db.query(`
            UPDATE coupons SET 
                code=?, type=?, value=?, min_order_amount=?, 
                max_discount=?, usage_limit=?, start_date=?, end_date=?, is_active=?
            WHERE id=?
        `, [
            code.toUpperCase(), discount_type, discount_value, min_order_value, 
            max_discount_value, usage_limit, start_date, end_date, is_active, id
        ]);

        res.json({ success: true, message: 'Cập nhật mã khuyến mãi thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM coupons WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa mã khuyến mãi thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getActiveVouchers = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT id, code, type, value, min_order_amount, max_discount,
                   usage_limit, usage_count, start_date, end_date
            FROM coupons
            WHERE is_active = 1
              AND start_date <= NOW()
              AND end_date >= NOW()
              AND (usage_limit IS NULL OR usage_count < usage_limit)
            ORDER BY end_date ASC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.applyCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
        }

        const [rows] = await db.query(
            'SELECT *, NOW() AS db_now FROM coupons WHERE code = ?',
            [String(code).toUpperCase()]
        );

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Mã giảm giá không tồn tại' });
        }

        const coupon = rows[0];

        if (!coupon.is_active) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đang tạm ngừng' });
        }

        const now = new Date(coupon.db_now);
        if (new Date(coupon.start_date) > now) {
            const startStr = new Date(coupon.start_date).toLocaleDateString('vi-VN');
            return res.status(400).json({ success: false, message: `Mã giảm giá chưa được kích hoạt (bắt đầu từ ${startStr})` });
        }

        if (new Date(coupon.end_date) < now) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết hạn' });
        }

        if (coupon.usage_limit !== null && coupon.usage_count >= coupon.usage_limit) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã hết lượt sử dụng' });
        }

        const orderTotal = Number(subtotal) || 0;
        const minOrder = Number(coupon.min_order_amount) || 0;
        if (orderTotal < minOrder) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng tối thiểu ${minOrder.toLocaleString('vi-VN')}đ để áp dụng mã này`
            });
        }

        let discount_amount = 0;
        if (coupon.type === 'percent') {
            discount_amount = (orderTotal * Number(coupon.value)) / 100;
            if (coupon.max_discount) {
                discount_amount = Math.min(discount_amount, Number(coupon.max_discount));
            }
        } else {
            discount_amount = Number(coupon.value);
        }
        discount_amount = Math.min(discount_amount, orderTotal);

        res.json({
            success: true,
            data: {
                code: coupon.code,
                type: coupon.type,
                value: Number(coupon.value),
                discount_amount: Math.floor(discount_amount)
            },
            message: 'Áp dụng mã giảm giá thành công'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
