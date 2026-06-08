const moment = require('moment');
const crypto = require('crypto');
const qs = require('qs');
const db = require('../config/db');

exports.createPaymentUrl = async (req, res) => {
    try {
        const { orderId, amount, bankCode } = req.body;
        const ipAddr = req.headers['x-forwarded-for'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.connection.socket.remoteAddress;

        const tmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        let vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const orderId_vnp = moment(date).format('HHmmss'); // Simplified for sandbox

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId_vnp + '_' + orderId; // Combine to keep track
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma don hang: ' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        
        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

        res.json({ success: true, paymentUrl: vnpUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.vnpayReturn = async (req, res) => {
    try {
        // Clone req.query into a plain object (req.query can be a frozen getter result in some setups)
        let vnp_Params = { ...req.query };
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        // Decode txnRef BEFORE sortObject re-encodes values
        const rawTxnRef = vnp_Params['vnp_TxnRef'] || '';
        const responseCode = vnp_Params['vnp_ResponseCode'];

        vnp_Params = sortObject(vnp_Params);

        const secretKey = process.env.VNP_HASH_SECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

        if (secureHash !== signed) {
            console.warn('[VNPAY return] Invalid signature', { received: secureHash, computed: signed });
            return res.status(400).json({ success: false, message: 'Chữ ký không hợp lệ' });
        }

        const orderId = rawTxnRef.split('_')[1];
        if (!orderId) {
            return res.status(400).json({ success: false, message: 'Mã đơn hàng không hợp lệ' });
        }

        let orderCode = null;
        try {
            const [orderRows] = await db.query('SELECT id, order_code FROM orders WHERE id = ?', [orderId]);
            orderCode = orderRows?.[0]?.order_code || null;
        } catch (dbErr) {
            console.error('[VNPAY return] Failed to load order:', dbErr.message);
        }

        if (responseCode === '00') {
            await db.query('UPDATE orders SET payment_status = "paid" WHERE id = ?', [orderId]);
            return res.json({ success: true, message: 'Thanh toán thành công', code: responseCode, order_code: orderCode });
        }

        return res.json({ success: false, message: 'Thanh toán thất bại', code: responseCode, order_code: orderCode });
    } catch (error) {
        console.error('[VNPAY return] Unexpected error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.vnpayIpn = async (req, res) => {
    try {
        let vnp_Params = req.query;
        const secureHash = vnp_Params['vnp_SecureHash'];

        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNP_HASH_SECRET;
        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderInfo = vnp_Params['vnp_TxnRef'];
            const orderId = orderInfo.split('_')[1];
            const responseCode = vnp_Params['vnp_ResponseCode'];

            if (responseCode === '00') {
                await db.query('UPDATE orders SET payment_status = "paid" WHERE id = ?', [orderId]);
                res.status(200).json({ RspCode: '00', Message: 'Success' });
            } else {
                res.status(200).json({ RspCode: '00', Message: 'Success' });
            }
        } else {
            res.status(200).json({ RspCode: '97', Message: 'Fail checksum' });
        }
    } catch (error) {
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}
