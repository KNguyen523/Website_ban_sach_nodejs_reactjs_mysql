import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Auth & Context
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { SettingsProvider } from './context/SettingsContext';
import AdminLayout from './components/admin/AdminLayout';
import Dashboard from './components/admin/Dashboard';
import ProductList from './components/admin/ProductList';
import CategoryList from './components/admin/CategoryList';
import OrderList from './components/admin/OrderList';
import UserList from './components/admin/UserList';
import BannerList from './components/admin/BannerList';
import AuthorList from './components/admin/AuthorList';
import PublisherList from './components/admin/PublisherList';
import ReviewList from './components/admin/ReviewList';
import Settings from './components/admin/Settings';
import VoucherList from './components/admin/VoucherList';

// Core Components
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import HomePage from './pages/HomePage';
import ProductListPage from './pages/ProductListPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import MyOrdersPage from './pages/MyOrdersPage';
import UserOrderDetailPage from './pages/UserOrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';

// Route guard for customer-facing pages (redirects admin & staff to admin dashboard)
const CustomerRouteLayout = () => {
  const { user, loading } = useAuth();
  
  if (loading) return null;
  
  if (user && (user.role === 'admin' || user.role === 'staff')) {
    return <Navigate to="/admin" replace />;
  }
  
  return <Outlet />;
};

function App() {
  return (
      <AuthProvider>
        <SettingsProvider>
        <CartProvider>
          <WishlistProvider>
          <Router>
            <Routes>
              {/* Customer Routes (Protected from Admin/Staff access) */}
              <Route element={<CustomerRouteLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/products" element={<ProductListPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/order-success/:code" element={<OrderSuccessPage />} />
                <Route path="/order-success" element={<OrderSuccessPage />} />
                <Route path="/my-orders" element={<MyOrdersPage />} />
                <Route path="/my-orders/:id" element={<UserOrderDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/blog" element={<BlogPage />} />
                <Route path="/blog/:slug" element={<BlogPostPage />} />
              </Route>
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductList />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="users" element={<UserList />} />
                <Route path="banners" element={<BannerList />} />
                <Route path="authors" element={<AuthorList />} />
                <Route path="publishers" element={<PublisherList />} />
                <Route path="reviews" element={<ReviewList />} />
                <Route path="settings" element={<Settings />} />
                <Route path="vouchers" element={<VoucherList />} />
              </Route>

              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
            <ToastContainer 
              position="top-right" 
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="colored"
            />
          </Router>
          </WishlistProvider>
        </CartProvider>
        </SettingsProvider>
      </AuthProvider>
  );
}

export default App;
