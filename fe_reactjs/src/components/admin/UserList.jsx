import React, { useState, useEffect } from 'react';
import {
    Search,
    RefreshCw,
    User,
    Shield,
    Mail,
    Phone,
    UserCheck,
    UserX,
    UserPlus,
    Eye,
    X
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';
import { useAuth } from '../../context/AuthContext';
import './AdminLayout.css';
import './ProductList.css';

const EMPTY_NEW_USER = {
    full_name: '',
    email: '',
    phone: '',
    password: '',
    role: 'staff',
    is_active: 1
};

const UserList = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [confirmAction, setConfirmAction] = useState(null); // 'toggle'
    const [lockModal, setLockModal] = useState({ open: false, user: null, reason: '' });
    const [reasonModal, setReasonModal] = useState({ open: false, user: null });
    const [createOpen, setCreateOpen] = useState(false);
    const [newUser, setNewUser] = useState(EMPTY_NEW_USER);
    const [creating, setCreating] = useState(false);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/users');
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleRoleChange = async (newRole, id) => {
        try {
            const res = await api.put(`/users/${id}/role`, { role: newRole });
            if (res.data.success) {
                toast.success('Đã cập nhật quyền hạn');
                fetchUsers();
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật quyền hạn');
        }
    };

    const handleToggleClick = (user) => {
        if (user.is_active) {
            setLockModal({ open: true, user, reason: '' });
            return;
        }

        setDeleteId(user);
        setConfirmAction('toggle');
        setIsConfirmOpen(true);
    };

    const handleConfirmAction = async () => {
        if (confirmAction === 'toggle') {
            const user = deleteId;
            try {
                const res = await api.put(`/users/${user.id}/status`, {
                    is_active: 1,
                    blocked_reason: null
                });
                if (res.data.success) {
                    toast.success('Đã cập nhật trạng thái');
                    fetchUsers();
                }
            } catch (error) {
                toast.error('Lỗi khi cập nhật');
            }
        }
    };

    const handleLockUser = async () => {
        const reason = lockModal.reason.trim();
        if (!reason) {
            toast.error('Vui lòng nhập lý do khóa tài khoản');
            return;
        }

        try {
            const res = await api.put(`/users/${lockModal.user.id}/status`, {
                is_active: 0,
                blocked_reason: reason
            });
            if (res.data.success) {
                toast.success('Đã khóa tài khoản');
                setLockModal({ open: false, user: null, reason: '' });
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi khóa tài khoản');
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        const payload = {
            ...newUser,
            full_name: newUser.full_name.trim(),
            email: newUser.email.trim(),
            phone: newUser.phone.trim()
        };
        if (!payload.full_name || !payload.email || !payload.password) {
            toast.error('Vui lòng nhập đủ họ tên, email và mật khẩu');
            return;
        }
        if (payload.password.length < 6) {
            toast.error('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }
        if (payload.phone && !/^0[0-9]{9}$/.test(payload.phone)) {
            toast.error('Số điện thoại phải có 10 chữ số và bắt đầu bằng số 0');
            return;
        }
        setCreating(true);
        try {
            const res = await api.post('/users', payload);
            if (res.data.success) {
                toast.success(res.data.message || 'Tạo tài khoản thành công');
                setCreateOpen(false);
                setNewUser(EMPTY_NEW_USER);
                fetchUsers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi tạo tài khoản');
        } finally {
            setCreating(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý khách hàng</h1>
                    <p>Danh sách tài khoản người dùng đăng ký trên hệ thống.</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {currentUser?.role === 'admin' && (
                        <button
                            type="button"
                            className="add-user-btn"
                            onClick={() => { setNewUser(EMPTY_NEW_USER); setCreateOpen(true); }}
                        >
                            <UserPlus size={18} />
                            Thêm tài khoản
                        </button>
                    )}
                    <button className="refresh-btn" onClick={fetchUsers}>
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên hoặc email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-wrapper glass">
                {loading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Khách hàng</th>
                                <th>Liên hệ</th>
                                <th>Vai trò</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => {
                                const isSelf = currentUser && Number(currentUser.id) === Number(user.id);
                                return (
                                <tr key={user.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className="avatar-square" style={{ borderRadius: '50%', background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)' }}>
                                                <User size={20} color={user.role === 'admin' ? '#ef4444' : '#3b82f6'} />
                                            </div>
                                            <div className="product-info">
                                                <span className="product-title">
                                                    {user.full_name}
                                                    {isSelf && <span style={{ marginLeft: 8, fontSize: 11, color: '#3b82f6', fontWeight: 600 }}>(Bạn)</span>}
                                                </span>
                                                <span className="product-id">ID: #{user.id}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                <Mail size={12} color="#94a3b8" /> {user.email}
                                            </div>
                                            {user.phone && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                                                    <Phone size={12} color="#94a3b8" /> {user.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <select
                                            className={`role-select ${user.role}`}
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(e.target.value, user.id)}
                                            disabled={isSelf}
                                            title={isSelf ? 'Không thể tự đổi quyền hạn của chính mình' : ''}
                                            style={{
                                                background: user.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                                                color: user.role === 'admin' ? '#ef4444' : '#3b82f6',
                                                border: 'none',
                                                borderRadius: '8px',
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                cursor: isSelf ? 'not-allowed' : 'pointer',
                                                opacity: isSelf ? 0.6 : 1
                                            }}
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="staff">Staff</option>
                                            <option value="customer">Customer</option>
                                        </select>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${user.is_active ? 'active' : 'warning'}`}>
                                            {user.is_active ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            {!isSelf && (
                                                <button
                                                    className={`action-btn ${user.is_active ? 'edit' : 'view'}`}
                                                    title={user.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                                                    onClick={() => handleToggleClick(user)}
                                                >
                                                    {user.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                                                </button>
                                            )}

                                            {!user.is_active && (
                                                <button
                                                    className="action-btn view"
                                                    title="Xem lý do khóa"
                                                    onClick={() => setReasonModal({ open: true, user })}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}

                                            {isSelf && (
                                                <span style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>
                                                    Tài khoản của bạn
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">Không tìm thấy người dùng nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Mở khóa tài khoản"
                message="Bạn có chắc chắn muốn mở khóa tài khoản này?"
                onConfirm={handleConfirmAction}
                onCancel={() => setIsConfirmOpen(false)}
                type="warning"
            />

            {lockModal.open && (
                <div className="modal-overlay" onClick={() => setLockModal({ open: false, user: null, reason: '' })}>
                    <div className="modal-content admin-modal" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Khóa tài khoản</h2>
                            <button type="button" className="close-btn" onClick={() => setLockModal({ open: false, user: null, reason: '' })}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="admin-form">
                            <div className="form-group">
                                <label>Lý do khóa <span className="required">*</span></label>
                                <textarea
                                    rows="4"
                                    value={lockModal.reason}
                                    onChange={(e) => setLockModal({ ...lockModal, reason: e.target.value })}
                                    placeholder="Nhập lý do để người dùng biết khi đăng nhập lại..."
                                    autoFocus
                                />
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setLockModal({ open: false, user: null, reason: '' })}
                                >
                                    Hủy
                                </button>
                                <button type="button" className="submit-btn" onClick={handleLockUser}>
                                    <UserX size={18} />
                                    Khóa tài khoản
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {reasonModal.open && (
                <div className="modal-overlay" onClick={() => setReasonModal({ open: false, user: null })}>
                    <div className="modal-content admin-modal" style={{ width: '520px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Lý do khóa tài khoản</h2>
                            <button type="button" className="close-btn" onClick={() => setReasonModal({ open: false, user: null })}>
                                <X size={22} />
                            </button>
                        </div>

                        <div className="admin-form">
                            <div className="form-group">
                                <label>Tài khoản</label>
                                <div style={{ color: '#e2e8f0', fontWeight: 600 }}>
                                    {reasonModal.user?.full_name} - {reasonModal.user?.email}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Lý do</label>
                                <div style={{
                                    minHeight: 96,
                                    padding: '12px 14px',
                                    borderRadius: 8,
                                    background: 'rgba(15, 23, 42, 0.55)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    color: '#cbd5e1',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {reasonModal.user?.blocked_reason || 'Chưa có lý do khóa.'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {createOpen && (
                <div className="modal-overlay" onClick={() => !creating && setCreateOpen(false)}>
                    <div className="modal-content admin-modal" style={{ width: '560px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Thêm tài khoản mới</h2>
                            <button type="button" className="close-btn" onClick={() => !creating && setCreateOpen(false)}>
                                <X size={22} />
                            </button>
                        </div>

                        <form className="admin-form" onSubmit={handleCreateUser}>
                            <div className="form-group">
                                <label>Họ và tên <span className="required">*</span></label>
                                <input
                                    type="text"
                                    value={newUser.full_name}
                                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                                    placeholder="Nguyễn Văn A"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Email <span className="required">*</span></label>
                                    <input
                                        type="email"
                                        value={newUser.email}
                                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        placeholder="user@example.com"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Số điện thoại</label>
                                    <input
                                        type="text"
                                        value={newUser.phone}
                                        onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                                        placeholder="0987654321"
                                        maxLength={10}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Mật khẩu <span className="required">*</span></label>
                                    <input
                                        type="password"
                                        value={newUser.password}
                                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        placeholder="Ít nhất 6 ký tự"
                                        minLength={6}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Vai trò</label>
                                    <select
                                        value={newUser.role}
                                        onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    >
                                        <option value="staff">Staff (Nhân viên)</option>
                                        <option value="admin">Admin</option>
                                        <option value="customer">Customer (Khách)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-checkboxes">
                                <label className="checkbox-item">
                                    <input
                                        type="checkbox"
                                        checked={newUser.is_active === 1}
                                        onChange={(e) => setNewUser({ ...newUser, is_active: e.target.checked ? 1 : 0 })}
                                    />
                                    <span>Kích hoạt tài khoản ngay</span>
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="cancel-btn"
                                    onClick={() => setCreateOpen(false)}
                                    disabled={creating}
                                >
                                    Hủy
                                </button>
                                <button type="submit" className="submit-btn" disabled={creating}>
                                    <UserPlus size={18} />
                                    {creating ? 'Đang tạo...' : 'Tạo tài khoản'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserList;
