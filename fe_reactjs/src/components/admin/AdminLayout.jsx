import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Search, Bell, User } from 'lucide-react';
import './AdminLayout.css';

const STAFF_ALLOWED_PATHS = ['/admin/orders', '/admin/banners', '/admin/reviews', '/admin/vouchers'];

const AdminLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) return <div>Loading...</div>;

    // Auth check
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        return <Navigate to="/login" replace />;
    }

    // Staff: only allowed to access orders / banners / reviews
    if (user.role === 'staff') {
        const isAllowed = STAFF_ALLOWED_PATHS.some(
            p => location.pathname === p || location.pathname.startsWith(p + '/')
        );
        if (!isAllowed) {
            return <Navigate to="/admin/orders" replace />;
        }
    }

    const roleLabel = user.role === 'admin' ? 'Administrator' : 'Staff';

    return (
        <div className="admin-layout">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            
            <main className="admin-main">
                <header className="admin-header glass">
                    <div className="header-left">
                    </div>
                    
                    <div className="header-right">
                        <button className="icon-btn">
                            <Bell size={20} />
                            <span className="badge"></span>
                        </button>
                        <div className="user-profile">
                            <div className="user-info">
                                <span className="user-name">{user.full_name}</span>
                                <span className="user-role">{roleLabel}</span>
                            </div>
                            <div className="avatar-square">
                                {user.avatar ? <img src={user.avatar} alt="avatar" /> : <User size={20} />}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="admin-content">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
