const db = require('../config/db');

// Books visible on storefront: book active AND category active (or no category) AND no inactive author
const PUBLIC_BOOK_FILTER = `
    b.is_active = 1
    AND (c.id IS NULL OR c.is_active = 1)
    AND b.id NOT IN (
        SELECT ba.book_id FROM book_authors ba
        JOIN authors a ON ba.author_id = a.id
        WHERE a.is_active = 0
    )
`;

exports.getHomeData = async (req, res) => {
    try {
        // 1. Banners
        const [banners] = await db.query('SELECT * FROM banners WHERE is_active = 1 ORDER BY sort_order ASC');

        // 2. Categories with image (Featured Categories)
        const [categories] = await db.query('SELECT * FROM categories WHERE is_active = 1 AND image IS NOT NULL ORDER BY sort_order ASC LIMIT 8');

        // 3. Flash Sale (Highest discount)
        const [flashSale] = await db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE ${PUBLIC_BOOK_FILTER} AND b.discount_percent > 0
            ORDER BY b.discount_percent DESC LIMIT 10
        `);

        // 4. Best Sellers
        const [bestSellers] = await db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE ${PUBLIC_BOOK_FILTER}
            ORDER BY b.sold_count DESC LIMIT 10
        `);

        // 5. New Arrivals
        const [newArrivals] = await db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE ${PUBLIC_BOOK_FILTER}
            ORDER BY b.created_at DESC LIMIT 10
        `);

        // 6. Featured Books
        const [featured] = await db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE ${PUBLIC_BOOK_FILTER} AND b.is_featured = 1
            ORDER BY b.updated_at DESC LIMIT 10
        `);

        res.json({
            success: true,
            data: {
                banners,
                featuredCategories: categories,
                sections: [
                    { title: 'Flash Sale', type: 'flash_sale', books: flashSale },
                    { title: 'Sách Nổi Bật', type: 'featured', books: featured },
                    { title: 'Bán Chạy Nhất', type: 'best_seller', books: bestSellers },
                    { title: 'Sách Mới Về', type: 'new_arrival', books: newArrivals }
                ]
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
