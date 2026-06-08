const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const folders = ['books', 'banners', 'users'];
folders.forEach(folder => {
    const dir = path.join(__dirname, '../public/uploads/', folder);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Decide folder based on route or fieldname
        let folder = 'books';
        if (req.originalUrl.includes('banner')) folder = 'banners';
        if (req.originalUrl.includes('user') || req.originalUrl.includes('profile')) folder = 'users';
        
        const dest = path.join(__dirname, '../public/uploads/', folder);
        cb(null, dest);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Some browsers/clients send empty file (size 0) when a field is left blank;
    // multer still invokes the filter with an empty originalname → skip such cases.
    if (!file || !file.originalname) {
        return cb(null, false);
    }

    const allowedExt = /\.(jpe?g|png|webp|gif|bmp|svg)$/i;
    const extOk = allowedExt.test(file.originalname);
    const mimeOk = (file.mimetype || '').toLowerCase().startsWith('image/');

    // Accept if at least one signal says it's an image (handles browsers that
    // report 'application/octet-stream' or uncommon mime types for image files)
    if (extOk || mimeOk) {
        return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file ảnh (jpg, jpeg, png, webp, gif, bmp, svg)!'));
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: fileFilter
});

module.exports = upload;
