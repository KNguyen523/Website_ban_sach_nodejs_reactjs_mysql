import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, 
    Book, 
    Users, 
    ShoppingCart, 
    Tags, 
    Image, 
    Settings, 
    LogOut,
    ChevronLeft,
    PenTool,
    Building2,
    MessageSquare,
    Ticket
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmModal from '../common/ConfirmModal';
import './Sidebar.css';

const STAFF_ALLOWED_PATHS = ['/admin/orders', '/admin/banners', '/admin/reviews', '/admin/vouchers'];

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = React.useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };
    const allMenuItems = [
        { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/admin' },
        { icon: <Book size={20} />, label: 'Sản phẩm', path: '/admin/products' },
        { icon: <Tags size={20} />, label: 'Danh mục', path: '/admin/categories' },
        { icon: <ShoppingCart size={20} />, label: 'Đơn hàng', path: '/admin/orders' },
        { icon: <Users size={20} />, label: 'Khách hàng', path: '/admin/users' },
        { icon: <Ticket size={20} />, label: 'Mã giảm giá', path: '/admin/vouchers' },
        { icon: <Image size={20} />, label: 'Banner', path: '/admin/banners' },
        { icon: <PenTool size={20} />, label: 'Tác giả', path: '/admin/authors' },
        { icon: <Building2 size={20} />, label: 'Nhà xuất bản', path: '/admin/publishers' },
        { icon: <MessageSquare size={20} />, label: 'Đánh giá', path: '/admin/reviews' },
        { icon: <Settings size={20} />, label: 'Cài đặt', path: '/admin/settings' },
    ];

    const menuItems = user?.role === 'staff'
        ? allMenuItems.filter(item => STAFF_ALLOWED_PATHS.includes(item.path))
        : allMenuItems;

    return (
        <aside className={`admin-sidebar ${isOpen ? 'open' : 'closed'} glass`}>
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-square">H</div>
                    {isOpen && <span className="logo-text">{user?.role === 'staff' ? 'STAFF CP' : 'ADMIN CP'}</span>}
                </div>
                <button className="collapse-btn" onClick={toggleSidebar}>
                    <ChevronLeft size={20} style={{ transform: isOpen ? 'rotate(0)' : 'rotate(180deg)' }} />
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item, index) => (
                    <NavLink 
                        key={index} 
                        to={item.path} 
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        end={item.path === '/admin'}
                    >
                        <span className="nav-icon">{item.icon}</span>
                        {isOpen && <span className="nav-label">{item.label}</span>}
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button className="logout-btn" onClick={() => setIsLogoutConfirmOpen(true)}>
                    <LogOut size={20} />
                    {isOpen && <span>Đăng xuất</span>}
                </button>
            </div>

            <ConfirmModal 
                isOpen={isLogoutConfirmOpen}
                title="Đăng xuất tài khoản"
                message="Bạn có chắc chắn muốn thoát khỏi hệ thống quản trị không?"
                onConfirm={handleLogout}
                onCancel={() => setIsLogoutConfirmOpen(false)}
                type="danger"
            />
        </aside>
    );
};

export default Sidebar;
