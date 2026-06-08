import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    User, 
    Lock, 
    MapPin, 
    Heart, 
    ShoppingBag, 
    LogOut, 
    ChevronRight,
    Camera
} from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ProfileInfo from '../components/profile/ProfileInfo';
import ChangePassword from '../components/profile/ChangePassword';
import AddressBook from '../components/profile/AddressBook';
import Wishlist from '../components/profile/Wishlist';
import api, { getServerUrl } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './ProfilePage.css';

const ProfilePage = () => {
    const { user, setUser, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Get active tab from URL query or default to 'info'
    const queryParams = new URLSearchParams(location.search);
    const [activeTab, setActiveTab] = useState(queryParams.get('tab') || 'info');

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        const tab = queryParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [location.search]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        navigate(`/profile?tab=${tab}`);
    };

    const handleLogout = async () => {
        const success = await logout();
        if (success) {
            toast.success('Đã đăng xuất');
            navigate('/');
        }
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'info':
                return <ProfileInfo user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />;
            case 'password':
                return <ChangePassword />;
            case 'address':
                return <AddressBook />;
            case 'wishlist':
                return <Wishlist />;
            default:
                return <ProfileInfo user={user} onUpdate={(updatedUser) => setUser(updatedUser)} />;
        }
    };

    if (!user) return null;

    return (
        <div className="app-container">
            <Header />
            <main className="profile-container">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="profile-layout">
                        {/* Sidebar */}
                        <aside className="profile-sidebar">
                            <div className="user-summary glass">
                                <div className="summary-avatar">
                                    <img 
                                        src={user.avatar ? (user.avatar.startsWith('http') ? user.avatar : `${getServerUrl()}${user.avatar}`) : 'https://via.placeholder.com/100'} 
                                        alt={user.full_name} 
                                    />
                                </div>
                                <h3>{user.full_name}</h3>
                                <p>{user.email}</p>
                            </div>

                            <nav className="profile-nav glass p-4 rounded-2xl">
                                <button 
                                    className={`nav-item ${activeTab === 'info' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('info')}
                                >
                                    <User size={20} />
                                    <span>Thông tin cá nhân</span>
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                </button>
                                <button 
                                    className={`nav-item ${activeTab === 'password' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('password')}
                                >
                                    <Lock size={20} />
                                    <span>Đổi mật khẩu</span>
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                </button>
                                <button 
                                    className={`nav-item ${activeTab === 'address' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('address')}
                                >
                                    <MapPin size={20} />
                                    <span>Sổ địa chỉ</span>
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                </button>
                                <button 
                                    className={`nav-item ${activeTab === 'wishlist' ? 'active' : ''}`}
                                    onClick={() => handleTabChange('wishlist')}
                                >
                                    <Heart size={20} />
                                    <span>Sách yêu thích</span>
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                </button>
                                <button 
                                    className="nav-item"
                                    onClick={() => navigate('/my-orders')}
                                >
                                    <ShoppingBag size={20} />
                                    <span>Đơn hàng của tôi</span>
                                    <ChevronRight size={16} className="ml-auto opacity-50" />
                                </button>
                                <div className="h-px bg-slate-100 my-2"></div>
                                <button 
                                    className="nav-item text-red-500 hover:bg-red-50 hover:text-red-600"
                                    onClick={handleLogout}
                                >
                                    <LogOut size={20} />
                                    <span>Đăng xuất</span>
                                </button>
                            </nav>
                        </aside>

                        {/* Main Content */}
                        <div className="profile-content">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ProfilePage;
