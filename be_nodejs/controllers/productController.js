const db = require('../config/db');

const normalizeIsbn = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    const normalized = String(value).trim().replace(/[\s-]+/g, '');
    if (!normalized || ['null', 'undefined'].includes(normalized.toLowerCase())) {
        return null;
    }

    return normalized;
};

const findDuplicateIsbn = async (isbn, excludeId = null) => {
    const params = [isbn];
    let query = `
        SELECT id
        FROM books
        WHERE isbn IS NOT NULL
          AND LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(isbn), '-', ''), ' ', ''), CHAR(9), ''), CHAR(10), ''), CHAR(13), '')) = LOWER(?)
    `;

    if (excludeId) {
        query += ' AND id != ?';
        params.push(excludeId);
    }

    const [rows] = await db.query(query, params);
    return rows;
};

const isDuplicateIsbnError = (error) => {
    return error?.code === 'ER_DUP_ENTRY' && String(error.message || '').toLowerCase().includes('isbn');
};

const parseJsonArray = (value, fallback = []) => {
    if (value === undefined || value === null || value === '') {
        return fallback;
    }

    if (Array.isArray(value)) {
        return value;
    }

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : fallback;
    } catch {
        return fallback;
    }
};

const normalizeIdList = (ids) => {
    return ids
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0);
};

// Storefront visibility: book active, category active (or no category), no inactive author
const INACTIVE_AUTHOR_SUBQUERY = `
    b.id NOT IN (
        SELECT ba2.book_id FROM book_authors ba2
        JOIN authors a2 ON ba2.author_id = a2.id
        WHERE a2.is_active = 0
    )
`;
const PUBLIC_BOOK_FILTER = `b.is_active = 1 AND (c.id IS NULL OR c.is_active = 1) AND ${INACTIVE_AUTHOR_SUBQUERY}`;

const getActiveCategoryAndDescendantIds = async (categoryId) => {
    const rootId = Number(categoryId);
    if (!Number.isInteger(rootId) || rootId <= 0) {
        return [];
    }

    const [categories] = await db.query('SELECT id, parent_id FROM categories WHERE is_active = 1');
    const hasRoot = categories.some(category => Number(category.id) === rootId);

    if (!hasRoot) {
        return [];
    }

    const childrenByParent = categories.reduce((acc, category) => {
        const parentKey = category.parent_id === null ? 'root' : String(category.parent_id);
        if (!acc[parentKey]) acc[parentKey] = [];
        acc[parentKey].push(Number(category.id));
        return acc;
    }, {});

    const ids = [];
    const stack = [rootId];
    const visited = new Set();

    while (stack.length > 0) {
        const currentId = stack.pop();
        if (visited.has(currentId)) {
            continue;
        }

        visited.add(currentId);
        ids.push(currentId);

        const children = childrenByParent[String(currentId)] || [];

        children.forEach(childId => {
            if (!visited.has(childId)) {
                stack.push(childId);
            }
        });
    }

    return ids;
};

// Helper to generate slug from title
const generateSlug = (text) => {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
};

exports.getAllProducts = async (req, res) => {
    try {
        const { 
            search, category_id, publisher_id, author_id, 
            minPrice, maxPrice, minRating, 
            sort, page = 1, limit = 12 
        } = req.query;

        let query = `
            SELECT DISTINCT b.*, c.name as category_name, p.name as publisher_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN publishers p ON b.publisher_id = p.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
        `;

        let countQuery = `
            SELECT COUNT(DISTINCT b.id) as total
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN book_authors ba ON b.id = ba.book_id
        `;

        const queryParams = [];
        const whereClauses = [PUBLIC_BOOK_FILTER];

        if (search) {
            whereClauses.push('(b.title LIKE ? OR b.description LIKE ?)');
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        if (category_id) {
            const categoryIds = await getActiveCategoryAndDescendantIds(category_id);

            if (categoryIds.length === 0) {
                whereClauses.push('1 = 0');
            } else {
                whereClauses.push(`b.category_id IN (${categoryIds.map(() => '?').join(', ')})`);
                queryParams.push(...categoryIds);
            }
        }

        if (publisher_id) {
            whereClauses.push('b.publisher_id = ?');
            queryParams.push(publisher_id);
        }

        if (author_id) {
            whereClauses.push('ba.author_id = ?');
            queryParams.push(author_id);
        }

        if (minPrice) {
            whereClauses.push('b.price >= ?');
            queryParams.push(minPrice);
        }

        if (maxPrice) {
            whereClauses.push('b.price <= ?');
            queryParams.push(maxPrice);
        }

        if (minRating) {
            whereClauses.push('b.avg_rating >= ?');
            queryParams.push(minRating);
        }

        if (whereClauses.length > 0) {
            const whereString = ' WHERE ' + whereClauses.join(' AND ');
            query += whereString;
            countQuery += whereString;
        }

        // Sorting
        switch (sort) {
            case 'price_asc':
                query += ' ORDER BY b.price ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY b.price DESC';
                break;
            case 'sold':
                query += ' ORDER BY b.sold_count DESC';
                break;
            case 'rating':
                query += ' ORDER BY b.avg_rating DESC';
                break;
            case 'newest':
            default:
                query += ' ORDER BY b.created_at DESC';
                break;
        }

        // Pagination
        const offset = (page - 1) * limit;
        query += ' LIMIT ? OFFSET ?';
        queryParams.push(Number(limit), Number(offset));

        const [rows] = await db.query(query, queryParams);
        const [totalRows] = await db.query(countQuery, queryParams.slice(0, -2));

        const total = totalRows[0].total;

        res.json({ 
            success: true, 
            data: rows,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminProducts = async (req, res) => {
    try {
        const { search, page = 1, limit = 12 } = req.query;
        const currentPage = Math.max(Number(page) || 1, 1);
        const perPage = Math.max(Number(limit) || 12, 1);
        const offset = (currentPage - 1) * perPage;

        let query = `
            SELECT DISTINCT b.*, c.name as category_name, p.name as publisher_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN publishers p ON b.publisher_id = p.id
        `;

        let countQuery = `
            SELECT COUNT(DISTINCT b.id) as total
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN publishers p ON b.publisher_id = p.id
        `;

        const queryParams = [];
        const whereClauses = [];

        if (search) {
            whereClauses.push(`(
                b.title LIKE ?
                OR b.description LIKE ?
                OR b.isbn LIKE ?
                OR c.name LIKE ?
                OR p.name LIKE ?
            )`);
            const keyword = `%${search}%`;
            queryParams.push(keyword, keyword, keyword, keyword, keyword);
        }

        if (whereClauses.length > 0) {
            const whereString = ' WHERE ' + whereClauses.join(' AND ');
            query += whereString;
            countQuery += whereString;
        }

        query += ' ORDER BY b.created_at DESC LIMIT ? OFFSET ?';

        const [rows] = await db.query(query, [...queryParams, perPage, offset]);
        const [totalRows] = await db.query(countQuery, queryParams);
        const total = totalRows[0]?.total || 0;

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page: currentPage,
                limit: perPage,
                totalPages: Math.ceil(total / perPage)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getAdminProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT b.*, c.name as category_name, c.is_active as category_active, p.name as publisher_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN publishers p ON b.publisher_id = p.id
            WHERE b.id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'KhÃ´ng tÃ¬m tháº¥y sÃ¡ch' });
        }

        const [authors] = await db.query(`
            SELECT a.id, a.name
            FROM authors a
            JOIN book_authors ba ON a.id = ba.author_id
            WHERE ba.book_id = ?
        `, [id]);

        const [images] = await db.query('SELECT id, image_url FROM book_images WHERE book_id = ? ORDER BY sort_order', [id]);

        res.json({ success: true, data: { ...rows[0], authors, images } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT b.*, c.name as category_name, c.is_active as category_active, p.name as publisher_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            LEFT JOIN publishers p ON b.publisher_id = p.id
            WHERE b.id = ? AND ${PUBLIC_BOOK_FILTER}
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
        }

        // Get authors (only active ones for display)
        const [authors] = await db.query(`
            SELECT a.id, a.name
            FROM authors a
            JOIN book_authors ba ON a.id = ba.author_id
            WHERE ba.book_id = ? AND a.is_active = 1
        `, [id]);

        // Get galleries
        const [images] = await db.query('SELECT id, image_url FROM book_images WHERE book_id = ? ORDER BY sort_order', [id]);

        res.json({ success: true, data: { ...rows[0], authors, images } });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getRelatedProducts = async (req, res) => {
    try {
        const { id } = req.params;
        // Get the category of current book
        const [currentBook] = await db.query('SELECT category_id FROM books WHERE id = ?', [id]);
        
        if (currentBook.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sách' });
        }

        const categoryId = currentBook[0].category_id;

        // Get related books in the same category
        const [rows] = await db.query(`
            SELECT b.*, c.name as category_name
            FROM books b
            LEFT JOIN categories c ON b.category_id = c.id
            WHERE b.category_id = ? AND b.id != ? AND ${PUBLIC_BOOK_FILTER}
            LIMIT 6
        `, [categoryId, id]);

        res.json({ success: true, data: rows });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { 
            title, description, detail, price, discount_percent, 
            stock_quantity, publish_year, category_id, 
            publisher_id, is_active, is_featured, author_ids,
            isbn, page_count, language, cover_type, weight, dimensions
        } = req.body;

        const normalizedIsbn = normalizeIsbn(isbn);

        // Check ISBN duplicate (book code must be unique)
        if (normalizedIsbn) {
            const dup = await findDuplicateIsbn(normalizedIsbn);
            if (dup.length > 0) {
                return res.status(400).json({ success: false, message: 'Mã sách (ISBN) đã tồn tại' });
            }
        }

        // Handle thumbnail file
        let thumbnail = req.body.thumbnail;
        if (req.files && req.files.thumbnail) {
            thumbnail = `/public/uploads/books/${req.files.thumbnail[0].filename}`;
        }

        const slug = generateSlug(title) + '-' + Date.now();

        const [result] = await db.query(`
            INSERT INTO books (
                title, slug, description, detail, price, discount_percent, 
                stock_quantity, publish_year, thumbnail, category_id, 
                publisher_id, is_active, is_featured, isbn, page_count,
                language, cover_type, weight, dimensions
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            title, slug, description, detail || null, price, discount_percent || 0, 
            stock_quantity, publish_year || null, thumbnail, category_id || null, 
            publisher_id || null, is_active || 1, is_featured || 0,
            normalizedIsbn, page_count || null, language || 'Tiếng Việt', 
            cover_type || 'Bìa mềm', weight || null, dimensions || null
        ]);

        const bookId = result.insertId;

        // Add authors
        if (author_ids) {
            const authors = parseJsonArray(author_ids);
            if (Array.isArray(authors)) {
                for (const authorId of authors) {
                    await db.query('INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)', [bookId, authorId]);
                }
            }
        }

        // Add galleries
        if (req.files && req.files.images) {
            for (const file of req.files.images) {
                const imgUrl = `/public/uploads/books/${file.filename}`;
                await db.query('INSERT INTO book_images (book_id, image_url) VALUES (?, ?)', [bookId, imgUrl]);
            }
        }

        res.status(201).json({ success: true, data: { id: bookId }, message: 'Thêm sách thành công' });
    } catch (error) {
        if (isDuplicateIsbnError(error)) {
            return res.status(400).json({ success: false, message: 'Mã sách (ISBN) đã tồn tại' });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title, description, detail, price, discount_percent,
            stock_quantity, publish_year, category_id,
            publisher_id, is_active, is_featured, author_ids,
            isbn, page_count, language, cover_type, weight, dimensions
        } = req.body;

        const normalizedIsbn = normalizeIsbn(isbn);

        // Check ISBN duplicate against OTHER books
        if (normalizedIsbn) {
            const dup = await findDuplicateIsbn(normalizedIsbn, id);
            if (dup.length > 0) {
                return res.status(400).json({ success: false, message: 'Mã sách (ISBN) đã tồn tại ở sản phẩm khác' });
            }
        }

        const [existingBooks] = await db.query('SELECT thumbnail FROM books WHERE id = ?', [id]);

        if (existingBooks.length === 0) {
            return res.status(404).json({ success: false, message: 'KhÃ´ng tÃ¬m tháº¥y sÃ¡ch' });
        }

        // Keep the current cover image unless a new cover is uploaded or explicitly submitted.
        let thumbnail = existingBooks[0].thumbnail;
        if (Object.prototype.hasOwnProperty.call(req.body, 'thumbnail')) {
            thumbnail = req.body.thumbnail || null;
        }
        if (req.files && req.files.thumbnail) {
            thumbnail = `/public/uploads/books/${req.files.thumbnail[0].filename}`;
        }

        await db.query(`
            UPDATE books SET 
                title=?, description=?, detail=?, price=?, discount_percent=?, 
                stock_quantity=?, publish_year=?, thumbnail=?, category_id=?, 
                publisher_id=?, is_active=?, is_featured=?, isbn=?, page_count=?,
                language=?, cover_type=?, weight=?, dimensions=?
            WHERE id=?
        `, [
            title, description, detail || null, price, discount_percent || 0, 
            stock_quantity, publish_year || null, thumbnail, category_id || null, 
            publisher_id || null, is_active, is_featured,
            normalizedIsbn, page_count || null, language || 'Tiếng Việt', 
            cover_type || 'Bìa mềm', weight || null, dimensions || null, id
        ]);

        // Update authors
        if (author_ids) {
            const authors = parseJsonArray(author_ids);
            if (Array.isArray(authors)) {
                await db.query('DELETE FROM book_authors WHERE book_id = ?', [id]);
                for (const authorId of authors) {
                    await db.query('INSERT INTO book_authors (book_id, author_id) VALUES (?, ?)', [id, authorId]);
                }
            }
        }

        if (req.body.existing_image_ids !== undefined) {
            const existingImageIds = normalizeIdList(parseJsonArray(req.body.existing_image_ids));

            if (existingImageIds.length > 0) {
                await db.query(
                    `DELETE FROM book_images
                     WHERE book_id = ? AND id NOT IN (${existingImageIds.map(() => '?').join(', ')})`,
                    [id, ...existingImageIds]
                );
            } else {
                await db.query('DELETE FROM book_images WHERE book_id = ?', [id]);
            }
        }

        // Handle new galleries
        if (req.files && req.files.images) {
            for (const file of req.files.images) {
                const imgUrl = `/public/uploads/books/${file.filename}`;
                await db.query('INSERT INTO book_images (book_id, image_url) VALUES (?, ?)', [id, imgUrl]);
            }
        }

        res.json({ success: true, message: 'Cập nhật sách thành công' });
    } catch (error) {
        if (isDuplicateIsbnError(error)) {
            return res.status(400).json({ success: false, message: 'Mã sách (ISBN) đã tồn tại ở sản phẩm khác' });
        }

        res.status(500).json({ success: false, message: error.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('DELETE FROM books WHERE id = ?', [id]);
        res.json({ success: true, message: 'Xóa sách thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Helper data for selects
exports.getFormData = async (req, res) => {
    try {
        const [categories] = await db.query('SELECT id, name, parent_id, sort_order FROM categories WHERE is_active = 1 ORDER BY sort_order ASC, name ASC');
        const [authors] = await db.query('SELECT id, name FROM authors');
        const [publishers] = await db.query('SELECT id, name FROM publishers');
        
        res.json({ 
            success: true, 
            data: { categories, authors, publishers } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
