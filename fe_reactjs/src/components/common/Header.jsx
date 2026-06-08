import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Heart, Phone, Mail, Menu, X, ChevronDown, LogOut, BookOpen } from 'lucide-react';
import './Header.css';
import AuthModal from '../auth/AuthModal';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useSettings } from '../../context/SettingsContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const siteName = settings.site_name || 'HANOI BOOKSTORE';
  const [siteNameFirst, ...siteNameRest] = siteName.split(' ');
  const siteNameSecond = siteNameRest.join(' ');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <header className="header">
      {/* Main Header */}
      <div className="main-header">
        <div className="container flex justify-between items-center py-4">
          <Link to="/" className="logo flex items-center gap-2">
            <BookOpen size={32} className="text-emerald-500" />
            <h1 className="brand-name">
              {siteNameFirst}{siteNameSecond && <> <span className="highlight">{siteNameSecond}</span></>}
            </h1>
          </Link>

          <form className="search-bar flex flex-1 mx-8" onSubmit={handleSearch}>
            <input 
              type="text" 
              placeholder="Tìm kiếm sách, tác giả..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-btn"><Search size={20} /></button>
          </form>

          <div className="header-actions">
            <div className="action-item cursor-pointer" onClick={() => user ? navigate('/profile') : setIsAuthModalOpen(true)}>
              <div className="icon-badge">
                <User size={24} />
              </div>
              <span className="text-xs">{user?.full_name ? user.full_name.split(' ')[0] : 'Tài khoản'}</span>
            </div>
            
            {user && (
              <div className="action-item cursor-pointer" onClick={logout} title="Đăng xuất">
                <div className="icon-badge">
                  <LogOut size={24} color="#ef4444" />
                </div>
                <span className="text-xs" style={{ color: '#ef4444' }}>Đăng xuất</span>
              </div>
            )}

            <div className="action-item cursor-pointer" onClick={() => user ? navigate('/profile?tab=wishlist') : setIsAuthModalOpen(true)}>
              <div className="icon-badge">
                <Heart size={24} />
                {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
              </div>
              <span className="text-xs">Yêu thích</span>
            </div>
            <div className="action-item cursor-pointer" onClick={() => navigate('/cart')}>
              <div className="icon-badge">
                <ShoppingCart size={24} />
                {cartCount > 0 && <span className="badge">{cartCount}</span>}
              </div>
              <span className="text-xs">Giỏ hàng</span>
            </div>
          </div>

          <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Navbar */}
      <nav className={`nav-bar ${isMenuOpen ? 'open' : ''}`}>
        <div className="container">
          <ul className="nav-links flex gap-8">
            <li className={window.location.pathname === '/' ? 'active' : ''}>
              <Link to="/">Trang chủ</Link>
            </li>
            <li>
              <Link to="/products" className="flex items-center gap-1">Tất cả sách</Link>
            </li>
            <li>
              <Link to="/products?sort=newest">Sách mới</Link>
            </li>
            <li>
              <Link to="/products?sort=sold">Sách bán chạy</Link>
            </li>
            <li>
              <Link to="/products?maxPrice=100000">Flash Sale</Link>
            </li>
            <li><Link to="/about">Giới thiệu</Link></li>
            <li><Link to="/contact">Liên hệ</Link></li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
