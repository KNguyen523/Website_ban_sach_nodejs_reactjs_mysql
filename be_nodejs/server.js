require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/public', express.static('public'));

// Disable Caching for all routes
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

// Basic route
app.get('/', (req, res) => {
    res.send('Bookstore API is running...');
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const authorRoutes = require('./routes/authorRoutes');
const publisherRoutes = require('./routes/publisherRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const publicRoutes = require('./routes/publicRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const cartRoutes = require('./routes/cartRoutes');
const customerOrderRoutes = require('./routes/customerOrderRoutes');
const vnpayRoutes = require('./routes/vnpayRoutes');
const addressRoutes = require('./routes/addressRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const { protect, restrictTo } = require('./middleware/authMiddleware');
const voucherController = require('./controllers/voucherController');

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.post('/api/coupons/apply', voucherController.applyCoupon);

// Customer Routes (Protected)
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/user-orders', customerOrderRoutes);
app.use('/api/vnpay', vnpayRoutes);
app.use('/api/addresses', addressRoutes);

// Protected Admin Routes
// Staff role can ONLY access: orders, banners, reviews, vouchers
app.use('/api/dashboard', protect, restrictTo('admin'), dashboardRoutes);
app.use('/api/products', protect, restrictTo('admin'), productRoutes);
app.use('/api/categories', protect, restrictTo('admin'), categoryRoutes);
app.use('/api/orders', protect, restrictTo('admin', 'staff'), orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/banners', protect, restrictTo('admin', 'staff'), bannerRoutes);
app.use('/api/authors', protect, restrictTo('admin'), authorRoutes);
app.use('/api/publishers', protect, restrictTo('admin'), publisherRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/settings', protect, restrictTo('admin'), settingsRoutes);
app.use('/api/vouchers', protect, restrictTo('admin', 'staff'), voucherRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
