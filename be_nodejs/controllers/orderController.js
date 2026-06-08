const db = require('../config/db');

exports.createOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const user_id = req.user.id;
        const { 
            receiver_name, receiver_phone, 
            shipping_province, shipping_district, shipping_ward, shipping_address,
            note, payment_method, coupon_code 
        } = req.body;

        await connection.beginTransaction();

        // 1. Get cart items
        const [cartItems] = await connection.query(`
            SELECT ci.*, b.title, b.thumbnail, b.price, b.discount_percent, b.stock_quantity 
            FROM cart_items ci
            JOIN books b ON ci.book_id = b.id
            JOIN carts c ON ci.cart_id = c.id
            WHERE c.user_id = ?
        `, [user_id]);

        if (cartItems.length === 0) {
            throw new Error('Giỏ hàng trống');
        }

        // 2. Calculate totals and check stock
        let total_amount = 0;
        for (const item of cartItems) {
            if (item.stock_quantity < item.quantity) {
                throw new Error(`Sách "${item.title}" không đủ số lượng trong kho`);
            }
            const currentPrice = item.price * (1 - (item.discount_percent || 0) / 100);
            total_amount += currentPrice * item.quantity;
        }

        // 3. Handle Coupon
        let discount_amount = 0;
        let coupon_id = null;
        if (coupon_code) {
            const [coupons] = await connection.query(
                'SELECT * FROM coupons WHERE code = ? AND is_active = 1 AND start_date <= NOW() AND end_date >= NOW()',
                [coupon_code]
            );
            if (coupons.length > 0) {
                const coupon = coupons[0];
                if (total_amount >= coupon.min_order_amount) {
                    // Atomic increment with usage_limit check (race-safe)
                    const [updateRes] = await connection.query(
                        'UPDATE coupons SET usage_count = usage_count + 1 WHERE id = ? AND (usage_limit IS NULL OR usage_count < usage_limit)',
                        [coupon.id]
                    );
                    if (updateRes.affectedRows === 0) {
                        throw new Error('Mã giảm giá đã hết lượt sử dụng');
                    }

                    if (coupon.type === 'percent') {
                        discount_amount = (total_amount * coupon.value) / 100;
                        if (coupon.max_discount) {
                            discount_amount = Math.min(discount_amount, coupon.max_discount);
                        }
                    } else {
                        discount_amount = coupon.value;
                    }
                    coupon_id = coupon.id;
                }
            }
        }

        // Read shipping config from settings table
        const [settingRows] = await connection.query(
            "SELECT setting_key, setting_value FROM settings WHERE setting_key IN ('shipping_fee', 'free_shipping_threshold', 'free_ship_min')"
        );
        const settingsMap = {};
        settingRows.forEach(r => { settingsMap[r.setting_key] = r.setting_value; });
        const baseShippingFee = Number(settingsMap.shipping_fee) || 0;
        const freeShipMin =
            Number(settingsMap.free_shipping_threshold) ||
            Number(settingsMap.free_ship_min) || 0;
        const shipping_fee =
            freeShipMin > 0 && total_amount >= freeShipMin ? 0 : baseShippingFee;
        const final_amount = Math.max(0, total_amount - discount_amount + shipping_fee);

        // 4. Create Order
        const order_code = 'DH' + Date.now().toString().slice(-10);
        const [orderResult] = await connection.query(`
            INSERT INTO orders (
                order_code, user_id, receiver_name, receiver_phone, 
                shipping_province, shipping_district, shipping_ward, shipping_address,
                total_amount, discount_amount, shipping_fee, final_amount,
                coupon_id, coupon_code, note, payment_method, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [
            order_code, user_id, receiver_name, receiver_phone,
            shipping_province, shipping_district, shipping_ward, shipping_address,
            total_amount, discount_amount, shipping_fee, final_amount,
            coupon_id, coupon_code, note, payment_method
        ]);

        const order_id = orderResult.insertId;

        // 5. Create Order Items & Update Stock
        for (const item of cartItems) {
            const price_at_purchase = item.price * (1 - (item.discount_percent || 0) / 100);
            await connection.query(`
                INSERT INTO order_items (order_id, book_id, book_title, book_thumbnail, quantity, price_at_purchase)
                VALUES (?, ?, ?, ?, ?, ?)
            `, [order_id, item.book_id, item.title, item.thumbnail, item.quantity, price_at_purchase]);

            await connection.query('UPDATE books SET stock_quantity = stock_quantity - ?, sold_count = sold_count + ? WHERE id = ?', 
                [item.quantity, item.quantity, item.book_id]);
        }

        // 6. Clear Cart
        const [cart] = await connection.query('SELECT id FROM carts WHERE user_id = ?', [user_id]);
        if (cart.length > 0) {
            await connection.query('DELETE FROM cart_items WHERE cart_id = ?', [cart[0].id]);
        }

        // 7. Save address for future use (if not already exists)
        try {
            const [existingAddresses] = await connection.query(
                'SELECT id FROM addresses WHERE user_id = ? AND province = ? AND district = ? AND ward = ? AND street_address = ?',
                [user_id, shipping_province, shipping_district, shipping_ward, shipping_address]
            );

            if (existingAddresses.length === 0) {
                const [defaultAddr] = await connection.query('SELECT id FROM addresses WHERE user_id = ? AND is_default = 1', [user_id]);
                const isFirst = defaultAddr.length === 0;

                await connection.query(
                    'INSERT INTO addresses (user_id, receiver_name, receiver_phone, province, district, ward, street_address, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [user_id, receiver_name, receiver_phone, shipping_province, shipping_district, shipping_ward, shipping_address, isFirst ? 1 : 0]
                );
            }
        } catch (addrError) {
            console.error('Error saving address:', addrError);
            // Don't throw error here to not rollback the order
        }

        await connection.commit();
        res.status(201).json({ success: true, message: 'Đặt hàng thành công', order_id, order_code });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const user_id = req.user.id;
        const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [user_id]);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getUserOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        const [order] = await db.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, user_id]);
        
        if (order.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

        res.json({ success: true, data: { ...order[0], items } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.cancelOrder = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const user_id = req.user.id;

        await connection.beginTransaction();

        const [order] = await connection.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [id, user_id]);
        if (order.length === 0) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        if (order[0].status !== 'pending') {
            throw new Error('Chỉ có thể hủy đơn hàng ở trạng thái chờ xử lý');
        }

        // Restore stock
        const [items] = await connection.query('SELECT book_id, quantity FROM order_items WHERE order_id = ?', [id]);
        for (const item of items) {
            if (item.book_id) {
                await connection.query('UPDATE books SET stock_quantity = stock_quantity + ?, sold_count = sold_count - ? WHERE id = ?',
                    [item.quantity, item.quantity, item.book_id]);
            }
        }

        // Restore coupon usage if any
        if (order[0].coupon_id) {
            await connection.query(
                'UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE id = ?',
                [order[0].coupon_id]
            );
        }

        await connection.query('UPDATE orders SET status = "cancelled", cancelled_reason = ? WHERE id = ?', [reason, id]);

        await connection.commit();
        res.json({ success: true, message: 'Hủy đơn hàng thành công' });
    } catch (error) {
        await connection.rollback();
        res.status(500).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.confirmReceived = async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;

        const [order] = await db.query('SELECT status FROM orders WHERE id = ? AND user_id = ?', [id, user_id]);
        if (order.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        if (order[0].status !== 'delivered') {
            return res.status(400).json({ success: false, message: 'Chỉ có thể xác nhận khi đơn hàng đã được giao' });
        }

        await db.query('UPDATE orders SET status = "completed", payment_status = "paid" WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xác nhận đã nhận hàng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT o.*, u.full_name as user_name, u.email as user_email
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            ORDER BY o.created_at DESC
        `);
        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;
        const [order] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
        
        if (order.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [id]);

        res.json({ 
            success: true, 
            data: { 
                ...order[0], 
                items 
            } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const connection = await db.getConnection();
    try {
        const { id } = req.params;
        const { status, payment_status, cancelled_reason } = req.body;
        const hasStatusUpdate = Object.prototype.hasOwnProperty.call(req.body, 'status');
        const hasPaymentStatusUpdate = Object.prototype.hasOwnProperty.call(req.body, 'payment_status');

        if (!hasStatusUpdate && !hasPaymentStatusUpdate) {
            throw new Error('Không có thông tin cập nhật');
        }

        await connection.beginTransaction();

        // Get old status to check if we are changing TO cancelled
        const [oldOrder] = await connection.query('SELECT status, payment_status, coupon_id FROM orders WHERE id = ?', [id]);
        if (oldOrder.length === 0) {
            throw new Error('Không tìm thấy đơn hàng');
        }

        const oldStatus = oldOrder[0].status;
        const isOrderStatusNoop = hasStatusUpdate && status === oldStatus;
        const oldPaymentStatus = oldOrder[0].payment_status || 'unpaid';
        const oldCouponId = oldOrder[0].coupon_id;

        if (hasPaymentStatusUpdate) {
            if (!['unpaid', 'paid'].includes(payment_status)) {
                throw new Error('Trạng thái thanh toán không hợp lệ');
            }
            if (oldPaymentStatus === 'paid') {
                throw new Error('Đơn hàng đã thanh toán, không thể cập nhật lại trạng thái thanh toán');
            }
            if (payment_status !== 'paid') {
                throw new Error('Chỉ có thể cập nhật từ chưa thanh toán sang đã thanh toán');
            }
        }

        if (hasStatusUpdate && !isOrderStatusNoop) {
        // Strict order status flow: pending -> confirmed -> shipping -> delivered -> completed
        const statusOrder = ['pending', 'confirmed', 'shipping', 'delivered', 'completed'];
        const oldIndex = statusOrder.indexOf(oldStatus);
        const newIndex = statusOrder.indexOf(status);

        if (oldStatus === 'cancelled') {
            throw new Error('Đơn hàng đã bị hủy, không thể thay đổi trạng thái');
        }
        if (oldStatus === 'completed') {
            throw new Error('Đơn hàng đã hoàn thành, không thể thay đổi trạng thái');
        }

        if (status === 'cancelled') {
            if (oldStatus === 'delivered') {
                throw new Error('Đơn hàng đã được giao, không thể hủy');
            }
            if (!cancelled_reason || !cancelled_reason.trim()) {
                throw new Error('Hủy đơn hàng yêu cầu lý do hủy');
            }
        } else {
            if (newIndex === -1) {
                throw new Error('Trạng thái mới không hợp lệ');
            }
            if (oldIndex === -1) {
                throw new Error('Trạng thái hiện tại không hợp lệ');
            }
            if (newIndex <= oldIndex) {
                throw new Error('Không thể quay lại trạng thái trước đó');
            }
        }

        }

        // If changing status TO cancelled and it wasn't already cancelled
        if (status === 'cancelled' && oldStatus !== 'cancelled') {
            const [items] = await connection.query('SELECT book_id, quantity FROM order_items WHERE order_id = ?', [id]);
            for (const item of items) {
                if (item.book_id) {
                    await connection.query('UPDATE books SET stock_quantity = stock_quantity + ?, sold_count = sold_count + 0 WHERE id = ?',
                        [item.quantity, item.book_id]);
                    await connection.query('UPDATE books SET sold_count = GREATEST(0, sold_count - ?) WHERE id = ?', [item.quantity, item.book_id]);
                }
            }

            // Restore coupon usage if any
            if (oldCouponId) {
                await connection.query(
                    'UPDATE coupons SET usage_count = GREATEST(0, usage_count - 1) WHERE id = ?',
                    [oldCouponId]
                );
            }
        }

        const updateFields = [];
        const params = [];

        if (hasStatusUpdate && !isOrderStatusNoop) {
            updateFields.push('status = ?');
            params.push(status);
        }

        if (hasPaymentStatusUpdate) {
            updateFields.push('payment_status = ?');
            params.push(payment_status);
        }

        if (status === 'cancelled') {
            updateFields.push('cancelled_reason = ?');
            params.push(cancelled_reason.trim());
        }

        if (updateFields.length === 0) {
            throw new Error('Không có thay đổi nào để cập nhật');
        }

        const query = `UPDATE orders SET ${updateFields.join(', ')} WHERE id = ?`;
        params.push(id);

        await connection.query(query, params);
        await connection.commit();

        res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (error) {
        await connection.rollback();
        res.status(400).json({ success: false, message: error.message });
    } finally {
        connection.release();
    }
};

exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM orders WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa đơn hàng thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
