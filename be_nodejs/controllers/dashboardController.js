const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const { range = 'all' } = req.query;
        let timeClause = '';
        let queryParams = [];

        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        
        switch (range) {
            case 'today':
                timeClause = ' AND created_at >= ?';
                queryParams.push(startOfDay);
                break;
            case '7days':
                const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                timeClause = ' AND created_at >= ?';
                queryParams.push(sevenDaysAgo);
                break;
            case '30days':
                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                timeClause = ' AND created_at >= ?';
                queryParams.push(thirtyDaysAgo);
                break;
            case 'thisMonth':
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                timeClause = ' AND created_at >= ?';
                queryParams.push(firstDayOfMonth);
                break;
            default:
                timeClause = '';
        }

        // 1. Total Orders
        const [orderCountRows] = await db.query(`SELECT COUNT(*) as total FROM orders WHERE 1=1 ${timeClause}`, queryParams);
        const totalOrders = orderCountRows[0].total;

        // 2. Total Products Sold (Sum quantity from order_items for non-cancelled orders)
        // Note: We join with orders to filter by date
        const [soldRows] = await db.query(`
            SELECT SUM(oi.quantity) as total 
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled' ${timeClause.replace('created_at', 'o.created_at')}
        `, queryParams);
        const totalSold = soldRows[0].total || 0;

        // 3. Total Stock (Always current stock, not time-based)
        const [stockRows] = await db.query('SELECT SUM(stock_quantity) as total FROM books');
        const totalStock = stockRows[0].total || 0;

        // 4. Total Revenue
        const [revenueRows] = await db.query(`
            SELECT SUM(final_amount) as total 
            FROM orders 
            WHERE status != "cancelled" ${timeClause}
        `, queryParams);
        const totalRevenue = revenueRows[0].total || 0;

        // 5. Top selling products for Pie Chart
        const [topProducts] = await db.query(`
            SELECT oi.book_title as name, CAST(SUM(oi.quantity) AS UNSIGNED) as value 
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE o.status != 'cancelled' ${timeClause.replace('created_at', 'o.created_at')}
            GROUP BY oi.book_id, oi.book_title
            ORDER BY value DESC 
            LIMIT 5
        `, queryParams);

        // 6. Recent Orders
        const [recentOrders] = await db.query(`
            SELECT o.*, u.full_name as user_name
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            WHERE 1=1 ${timeClause.replace('created_at', 'o.created_at')}
            ORDER BY o.created_at DESC
            LIMIT 5
        `, queryParams);

        // 7. Completed orders count + profit (revenue from completed orders)
        const [completedRows] = await db.query(`
            SELECT
                COUNT(*) AS completed_count,
                COALESCE(SUM(final_amount - shipping_fee), 0) AS profit
            FROM orders
            WHERE status = 'completed' ${timeClause}
        `, queryParams);
        const completedOrders = Number(completedRows[0].completed_count) || 0;
        const profit = Number(completedRows[0].profit) || 0;

        // 8. Top 5 customers with most completed orders
        const [topCustomers] = await db.query(`
            SELECT
                u.id, u.full_name, u.email, u.avatar,
                COUNT(o.id) AS completed_orders,
                COALESCE(SUM(o.final_amount), 0) AS total_spent
            FROM orders o
            JOIN users u ON o.user_id = u.id
            WHERE o.status = 'completed' ${timeClause.replace('created_at', 'o.created_at')}
            GROUP BY u.id, u.full_name, u.email, u.avatar
            ORDER BY completed_orders DESC, total_spent DESC
            LIMIT 5
        `, queryParams);

        // 9. Underperforming products: active books that have never appeared in a non-cancelled order
        const [coldProducts] = await db.query(`
            SELECT b.id, b.title, b.price, b.thumbnail, b.stock_quantity, b.created_at
            FROM books b
            WHERE b.is_active = 1
              AND b.id NOT IN (
                  SELECT oi.book_id
                  FROM order_items oi
                  JOIN orders o ON oi.order_id = o.id
                  WHERE o.status != 'cancelled' AND oi.book_id IS NOT NULL
              )
            ORDER BY b.created_at DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                totalOrders: Number(totalOrders),
                totalSold: Number(totalSold),
                totalStock: Number(totalStock),
                totalRevenue: Number(totalRevenue),
                completedOrders,
                profit,
                topProducts: topProducts.map(p => ({ ...p, value: Number(p.value) })),
                recentOrders,
                topCustomers: topCustomers.map(c => ({
                    ...c,
                    completed_orders: Number(c.completed_orders),
                    total_spent: Number(c.total_spent)
                })),
                coldProducts: coldProducts.map(p => ({
                    ...p,
                    price: Number(p.price),
                    stock_quantity: Number(p.stock_quantity)
                }))
            }
        });
    } catch (error) {
        console.error('[Dashboard stats] Error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
