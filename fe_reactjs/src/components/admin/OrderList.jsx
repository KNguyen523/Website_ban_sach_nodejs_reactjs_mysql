import React, { useState, useEffect } from 'react';
import { 
    Search, 
    Filter, 
    Eye, 
    Trash2, 
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    Package,
    Truck,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './ProductList.css'; 

import OrderModal from './OrderModal';
import ConfirmModal from '../common/ConfirmModal';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [cancelModal, setCancelModal] = useState({ open: false, orderId: null, reason: '' });
    const [cancelSubmitting, setCancelSubmitting] = useState(false);

    const fetchOrders = async () => {
        // ... (existing code)
        setLoading(true);
        try {
            const res = await api.get('/orders');
            if (res.data.success) {
                setOrders(res.data.data);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách đơn hàng');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleStatusChange = async (id, newStatus) => {
        if (newStatus === 'cancelled') {
            setCancelModal({ open: true, orderId: id, reason: '' });
            fetchOrders(); // revert the select visually until confirm
            return;
        }

        try {
            const res = await api.put(`/orders/${id}/status`, {
                status: newStatus,
                cancelled_reason: null
            });
            if (res.data.success) {
                toast.success('Đã cập nhật trạng thái');
                fetchOrders();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
            fetchOrders();
        }
    };

    const submitCancelOrder = async () => {
        const reason = cancelModal.reason.trim();
        if (!reason) {
            toast.error('Lý do hủy đơn hàng không được để trống!');
            return;
        }
        setCancelSubmitting(true);
        try {
            const res = await api.put(`/orders/${cancelModal.orderId}/status`, {
                status: 'cancelled',
                cancelled_reason: reason
            });
            if (res.data.success) {
                toast.success('Đã hủy đơn hàng');
                setCancelModal({ open: false, orderId: null, reason: '' });
                fetchOrders();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi hủy đơn hàng');
        } finally {
            setCancelSubmitting(false);
        }
    };

    const handlePaymentStatusChange = async (id, currentPaymentStatus, newPaymentStatus) => {
        if (currentPaymentStatus === 'paid') {
            toast.info('Đơn hàng đã thanh toán, không thể đổi lại trạng thái thanh toán');
            return;
        }

        if (newPaymentStatus === currentPaymentStatus) {
            return;
        }

        if (newPaymentStatus !== 'paid') {
            toast.error('Chỉ có thể cập nhật từ chưa thanh toán sang đã thanh toán');
            fetchOrders();
            return;
        }

        try {
            const res = await api.put(`/orders/${id}/status`, {
                payment_status: newPaymentStatus
            });
            if (res.data.success) {
                toast.success('Đã cập nhật trạng thái thanh toán');
                fetchOrders();
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật trạng thái thanh toán');
        }
    };

    const handleView = (id) => {
        setSelectedOrderId(id);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/orders/${deleteId}`);
            toast.success('Đã xóa đơn hàng');
            fetchOrders();
        } catch (error) {
            toast.error('Lỗi khi xóa');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const filteredOrders = orders.filter(o => 
        (o.order_code.toLowerCase().includes(searchTerm.toLowerCase()) || 
         o.receiver_name.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (statusFilter === 'all' || o.status === statusFilter)
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý đơn hàng</h1>
                    <p>Theo dõi và xử lý các đơn đặt hàng từ khách hàng.</p>
                </div>
                <button className="refresh-btn" onClick={fetchOrders}>
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm theo mã đơn hoặc tên khách..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-actions">
                    <select 
                        className="filter-select glass" 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{ padding: '0.6rem 1rem', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        <option value="all">Tất cả trạng thái</option>
                        <option value="pending">Chờ duyệt</option>
                        <option value="confirmed">Đã xác nhận</option>
                        <option value="shipping">Đang giao</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>
            </div>

            <div className="table-wrapper glass">
                {loading ? (
                    <div className="loading-state">Đang tải đơn hàng...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã đơn</th>
                                <th>Khách hàng</th>
                                <th>Tổng tiền</th>
                                <th>Thanh toán</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                                <tr key={order.id}>
                                    <td>
                                        <span className="font-bold text-blue-400">#{order.order_code}</span>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                                            {new Date(order.created_at).toLocaleString('vi-VN')}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="product-info">
                                            <span className="product-title" style={{ fontSize: '14px' }}>{order.receiver_name}</span>
                                            <span className="product-id">{order.receiver_phone}</span>
                                        </div>
                                    </td>
                                    <td className="font-bold text-primary">{formatPrice(order.final_amount)}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                                                {order.payment_method === 'cod' ? 'COD' : 'Chuyển khoản'}
                                            </span>
                                            <select
                                                value={order.payment_status || 'unpaid'}
                                                onChange={(e) => handlePaymentStatusChange(order.id, order.payment_status || 'unpaid', e.target.value)}
                                                disabled={order.payment_status === 'paid'}
                                                style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '12px',
                                                    fontSize: '11px',
                                                    fontWeight: '600',
                                                    border: 'none',
                                                    cursor: order.payment_status === 'paid' ? 'not-allowed' : 'pointer',
                                                    color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                                                    background: order.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                                                }}
                                            >
                                                <option value="unpaid">Chưa thanh toán</option>
                                                <option value="paid">Đã thanh toán</option>
                                            </select>
                                        </div>
                                    </td>
                                    <td>
                                        <select 
                                            className={`status-select-badge ${order.status}`}
                                            value={order.status}
                                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                            disabled={order.status === 'cancelled' || order.status === 'completed'}
                                            style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                border: 'none',
                                                cursor: order.status === 'cancelled' || order.status === 'completed' ? 'not-allowed' : 'pointer',
                                                width: 'auto',
                                                minWidth: '120px'
                                            }}
                                        >
                                            <option value="pending" disabled={['confirmed', 'shipping', 'delivered', 'completed', 'cancelled'].includes(order.status)}>Chờ duyệt</option>
                                            <option value="confirmed" disabled={['shipping', 'delivered', 'completed', 'cancelled'].includes(order.status)}>Đã xác nhận</option>
                                            <option value="shipping" disabled={['delivered', 'completed', 'cancelled'].includes(order.status)}>Đang giao</option>
                                            <option value="delivered" disabled={['completed', 'cancelled'].includes(order.status)}>Đã giao</option>
                                            <option value="completed" disabled={['cancelled'].includes(order.status)}>Hoàn thành</option>
                                            <option value="cancelled" disabled={['delivered', 'completed', 'cancelled'].includes(order.status)}>Đã hủy</option>
                                        </select>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn view" title="Xem chi tiết" onClick={() => handleView(order.id)}><Eye size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">Không có đơn hàng nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <OrderModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                orderId={selectedOrderId}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Xóa Đơn hàng"
                message="Bạn có chắc chắn muốn xóa đơn hàng này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />

            {cancelModal.open && (
                <div
                    className="modal-overlay"
                    onClick={() => !cancelSubmitting && setCancelModal({ open: false, orderId: null, reason: '' })}
                >
                    <div
                        className="admin-cancel-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="admin-cancel-modal-header">
                            <div className="admin-cancel-modal-icon">
                                <XCircle size={22} />
                            </div>
                            <h3>Hủy đơn hàng</h3>
                        </div>
                        <div className="admin-cancel-modal-body">
                            <p>Vui lòng nhập lý do hủy đơn hàng. Khách hàng sẽ thấy thông tin này trong chi tiết đơn.</p>
                            <textarea
                                rows="4"
                                placeholder="Nhập lý do hủy..."
                                value={cancelModal.reason}
                                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                                autoFocus
                            />
                        </div>
                        <div className="admin-cancel-modal-footer">
                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={() => setCancelModal({ open: false, orderId: null, reason: '' })}
                                disabled={cancelSubmitting}
                            >
                                Đóng
                            </button>
                            <button
                                type="button"
                                className="admin-cancel-confirm-btn"
                                onClick={submitCancelOrder}
                                disabled={cancelSubmitting}
                            >
                                {cancelSubmitting ? 'Đang xử lý...' : 'Xác nhận hủy'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderList;
