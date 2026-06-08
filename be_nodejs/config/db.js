const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test connection and migrate schema if needed
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('Database connected successfully.');
        
        // Auto-migration: Ensure authors table has is_active column (which is missing from default database.sql)
        try {
            const [columns] = await connection.query("SHOW COLUMNS FROM authors LIKE 'is_active'");
            if (columns.length === 0) {
                console.log("Column 'is_active' is missing from 'authors' table. Adding it now...");
                await connection.query("ALTER TABLE authors ADD COLUMN is_active TINYINT(1) DEFAULT 1");
                console.log("Column 'is_active' successfully added to 'authors' table.");
            }
        } catch (migErr) {
            console.error('Auto-migration failed for authors table:', migErr.message);
        }

        // Auto-migration: Store the reason when an admin locks a user account.
        try {
            const [columns] = await connection.query("SHOW COLUMNS FROM users LIKE 'blocked_reason'");
            if (columns.length === 0) {
                console.log("Column 'blocked_reason' is missing from 'users' table. Adding it now...");
                await connection.query("ALTER TABLE users ADD COLUMN blocked_reason VARCHAR(500) DEFAULT NULL AFTER is_active");
                console.log("Column 'blocked_reason' successfully added to 'users' table.");
            }
        } catch (migErr) {
            console.error('Auto-migration failed for users.blocked_reason:', migErr.message);
        }

        // Auto-migration: ISBN must stay unique in the live database too.
        try {
            const [indexes] = await connection.query("SHOW INDEX FROM books WHERE Column_name = 'isbn' AND Non_unique = 0");
            if (indexes.length === 0) {
                const [duplicates] = await connection.query(`
                    SELECT LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(TRIM(isbn), '-', ''), ' ', ''), CHAR(9), ''), CHAR(10), ''), CHAR(13), '')) AS normalized_isbn, COUNT(*) AS total
                    FROM books
                    WHERE isbn IS NOT NULL
                      AND TRIM(isbn) != ''
                      AND LOWER(TRIM(isbn)) NOT IN ('null', 'undefined')
                    GROUP BY normalized_isbn
                    HAVING total > 1
                    LIMIT 5
                `);

                if (duplicates.length > 0) {
                    console.warn("Cannot add unique index to books.isbn because duplicate ISBN values already exist.");
                } else {
                    console.log("Unique index for 'books.isbn' is missing. Adding it now...");
                    await connection.query("ALTER TABLE books ADD UNIQUE KEY uk_books_isbn (isbn)");
                    console.log("Unique index for 'books.isbn' successfully added.");
                }
            }
        } catch (migErr) {
            console.error('Auto-migration failed for books.isbn unique index:', migErr.message);
        }

        connection.release();
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
})();

module.exports = pool;
