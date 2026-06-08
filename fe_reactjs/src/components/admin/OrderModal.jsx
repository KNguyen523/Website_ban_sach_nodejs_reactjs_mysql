import React, { useState, useEffect } from 'react';
import { X, Package, Truck, CheckCircle, XCircle, Clock, MapPin, Phone, User, CreditCard, Calendar, Hash } from 'lucide-react';
import api from '../../utils/api';
import './AdminLayout.css';

const OrderModal = ({ isOpen, onClose, orderId }) => {
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && orderId) {
            fetchOrderDetails();
        }
    }, [isOpen, orderId]);

    const fetchOrderDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/orders/${orderId}`);
            if (res.data.success) {
                setOrder(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải chi tiết đơn hàng:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'pending': return { label: 'Chờ duyệt', icon: <Clock size={20} />, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' };
            case 'confirmed': return { label: 'Đã xác nhận', icon: <CheckCircle size={20} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'shipping': return { label: 'Đang giao', icon: <Truck size={20} />, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' };
            case 'delivered': return { label: 'Đã giao', icon: <CheckCircle size={20} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'completed': return { label: 'Hoàn thành', icon: <CheckCircle size={20} />, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' };
            case 'cancelled': return { label: 'Đã hủy', icon: <XCircle size={20} />, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)' };
            default: return { label: status, icon: <Package size={20} />, color: '#94a3b8', bg: 'rgba(255, 255, 255, 0.05)' };
        }
    };

    if (!isOpen) return null;

    const statusInfo = order ? getStatusInfo(order.status) : null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass admin-modal" style={{ width: '800px', maxHeight: '85vh' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '12px', color: '#3b82f6' }}>
                            <Package size={24} />
                        </div>
                        <div>
                            <h2 style={{ marginBottom: '2px' }}>Chi tiết đơn hàng</h2>
                            <p style={{ fontSize: '13px', color: '#94a3b8' }}>Mã đơn: #{order?.order_code}</p>
                        </div>
                    </div>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <div className="modal-body" style={{ padding: '2rem', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Đang tải dữ liệu...</div>
                    ) : order ? (
                        <div className="order-details-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem' }}>
                            {/* Cột trái: Sản phẩm và Tổng tiền */}
                            <div>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Package size={18} color="#3b82f6" /> Danh sách sản phẩm
                                </h3>
                                <div className="order-items-list" style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1rem' }}>
                                    {order.items?.map((item, index) => (
                                        <div key={index} style={{ 
                                            display: 'flex', gap: '1rem', padding: '12px 0', 
                                            borderBottom: index < order.items.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' 
                                        }}>
                                            <div style={{ width: '60px', height: '80px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                                                <img src={item.book_thumbnail?.startsWith('http') ? item.book_thumbnail : `${api.defaults.baseURL.replace('/api', '')}${item.book_thumbnail}`} 
                                                     alt={item.book_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '14px' }}>{item.book_title}</div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Số lượng: {item.quantity} x {formatPrice(item.price_at_purchase)}</div>
                                            </div>
                                            <div style={{ fontWeight: '600', color: '#3b82f6' }}>{formatPrice(item.quantity * item.price_at_purchase)}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="order-summary" style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                        <span style={{ color: '#94a3b8' }}>Tạm tính:</span>
                                        <span>{formatPrice(order.total_amount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                        <span style={{ color: '#94a3b8' }}>Giảm giá:</span>
                                        <span style={{ color: '#ef4444' }}>-{formatPrice(order.discount_amount)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                                        <span style={{ color: '#94a3b8' }}>Phí vận chuyển:</span>
                                        <span>{formatPrice(order.shipping_fee || 0)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontWeight: '700', fontSize: '1.1rem' }}>
                                        <span>Tổng thanh toán:</span>
                                        <span style={{ color: '#3b82f6' }}>{formatPrice(order.final_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cột phải: Thông tin khách hàng & Giao hàng */}
                            <div>
                                <div className="info-section" style={{ marginBottom: '2rem' }}>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Truck size={18} color="#3b82f6" /> Thông tin giao hàng
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <User size={16} style={{ marginTop: '3px', color: '#94a3b8' }} />
                                            <div>
                                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{order.receiver_name}</div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>{order.receiver_phone}</div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                            <MapPin size={16} style={{ marginTop: '3px', color: '#94a3b8' }} />
                                            <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                                                {order.shipping_address}, {order.shipping_ward}, {order.shipping_district}, {order.shipping_province}
                                            </div>
                                        </div>
                                        {order.note && (
                                            <div style={{ fontSize: '13px', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', color: '#cbd5e1', borderLeft: '3px solid #3b82f6' }}>
                                                " {order.note} "
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="info-section">
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <CreditCard size={18} color="#3b82f6" /> Trạng thái & Thanh toán
                                    </h3>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', padding: '1rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Trạng thái đơn:</span>
                                            <div style={{ 
                                                display: 'flex', alignItems: 'center', gap: '6px', 
                                                padding: '4px 12px', borderRadius: '20px', 
                                                background: statusInfo.bg, color: statusInfo.color,
                                                fontSize: '12px', fontWeight: '600'
                                            }}>
                                                {statusInfo.icon} {statusInfo.label}
                                            </div>
                                        </div>
                                        {order.status === 'cancelled' && (
                                            <div style={{ 
                                                display: 'flex', 
                                                flexDirection: 'column', 
                                                gap: '6px', 
                                                marginTop: '4px', 
                                                padding: '10px 12px', 
                                                background: 'rgba(239, 68, 68, 0.08)', 
                                                borderRadius: '10px', 
                                                borderLeft: '3px solid #ef4444',
                                                alignItems: 'flex-start'
                                            }}>
                                                <span style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444' }}>Lý do hủy đơn:</span>
                                                <span style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4' }}>{order.cancelled_reason || 'Không có lý do cụ thể'}</span>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Hình thức thanh toán:</span>
                                            <span style={{ fontSize: '13px', fontWeight: '600' }}>
                                                {order.payment_method === 'cod' ? 'COD (Thanh toán khi nhận)' : 'Chuyển khoản'}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Trạng thái thanh toán:</span>
                                            <div style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '12px',
                                                fontWeight: '600',
                                                color: order.payment_status === 'paid' ? '#10b981' : '#f59e0b',
                                                background: order.payment_status === 'paid' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)'
                                            }}>
                                                {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '13px', color: '#94a3b8' }}>Ngày đặt:</span>
                                            <span style={{ fontSize: '13px' }}>{new Date(order.created_at).toLocaleString('vi-VN')}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>Không tìm thấy thông tin đơn hàng</div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn" onClick={onClose} style={{ width: '100%' }}>Đóng</button>
                </div>
            </div>
        </div>
    );
};

export default OrderModal;
