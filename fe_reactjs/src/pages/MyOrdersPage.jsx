import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Calendar, CreditCard, ChevronRight, Search, XCircle, PackageCheck } from 'lucide-react';
import api from '../utils/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import './MyOrdersPage.css';

const MyOrdersPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelModal, setCancelModal] = useState({ show: false, orderId: null, reason: '' });
  const [confirmModal, setConfirmModal] = useState({ show: false, orderId: null });

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/user-orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Không thể tải danh sách đơn hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    try {
      const res = await api.put(`/user-orders/${confirmModal.orderId}/confirm-received`);
      if (res.data.success) {
        toast.success('Đã xác nhận nhận hàng. Cảm ơn bạn đã mua sắm!');
        setConfirmModal({ show: false, orderId: null });
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận đơn hàng');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal.reason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }

    try {
      const res = await api.put(`/user-orders/${cancelModal.orderId}/cancel`, 
        { reason: cancelModal.reason }
      );

      if (res.data.success) {
        toast.success('Đã hủy đơn hàng');
        setCancelModal({ show: false, orderId: null, reason: '' });
        fetchOrders();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy đơn hàng');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Chờ xử lý',
      confirmed: 'Đã xác nhận',
      shipping: 'Đang giao hàng',
      delivered: 'Đã giao hàng',
      completed: 'Hoàn thành',
      cancelled: 'Đã hủy'
    };
    return labels[status] || status;
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="my-orders-page">
        <div className="container">
          <div className="orders-container">
            <h1 className="text-3xl font-extrabold text-gray-800 mb-8 flex items-center gap-3">
              <Package size={32} className="text-emerald-500" />
              Đơn hàng của tôi
            </h1>

            {orders.length > 0 ? (
              orders.map((order) => (
                <div key={order.id} className="order-card">
                  <div className="order-card-header">
                    <div className="order-id">
                      Mã đơn: <span className="text-emerald-600">{order.order_code}</span>
                    </div>
                    <span className={`order-status-badge status-${order.status}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>

                  <div className="order-card-body">
                    <div className="flex gap-8">
                      <div className="order-info-item">
                        <span className="info-label flex items-center gap-1">
                          <Calendar size={14} /> Ngày đặt
                        </span>
                        <span className="info-value">
                          {new Date(order.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div className="order-info-item">
                        <span className="info-label flex items-center gap-1">
                          <CreditCard size={14} /> Thanh toán
                        </span>
                        <span className="info-value uppercase">
                          {order.payment_method}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="info-label block mb-1">Tổng tiền</span>
                      <span className="order-total">{formatPrice(order.final_amount)}</span>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    {order.status === 'pending' && (
                      <button
                        className="btn-cancel"
                        onClick={() => setCancelModal({ show: true, orderId: order.id, reason: '' })}
                      >
                        Hủy đơn
                      </button>
                    )}
                    {order.status === 'delivered' && (
                      <button
                        className="btn-confirm-received"
                        onClick={() => setConfirmModal({ show: true, orderId: order.id })}
                      >
                        <PackageCheck size={16} />
                        Đã nhận hàng
                      </button>
                    )}
                    <button
                      className="btn-detail flex items-center gap-1"
                      onClick={() => navigate(`/my-orders/${order.id}`)}
                    >
                      Chi tiết <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl shadow-sm">
                <Search size={64} className="mx-auto text-gray-200 mb-4" />
                <h2 className="text-xl font-bold text-gray-600">Bạn chưa có đơn hàng nào</h2>
                <button 
                  className="mt-6 px-6 py-2 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition"
                  onClick={() => navigate('/products')}
                >
                  Mua sắm ngay
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {cancelModal.show && (
        <div
          className="modal-overlay"
          onClick={() => setCancelModal({ show: false, orderId: null, reason: '' })}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-modal-icon">
                <XCircle size={24} />
              </div>
              <h3 className="cancel-modal-title">Hủy đơn hàng</h3>
            </div>

            <div className="cancel-modal-body">
              <p className="cancel-modal-desc">
                Bạn có chắc chắn muốn hủy đơn hàng này không? Vui lòng cho biết lý do:
              </p>
              <textarea
                className="cancel-modal-textarea"
                rows="3"
                placeholder="Nhập lý do hủy..."
                value={cancelModal.reason}
                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
              ></textarea>
            </div>

            <div className="cancel-modal-footer">
              <button
                className="cancel-modal-btn cancel-modal-btn-close"
                onClick={() => setCancelModal({ show: false, orderId: null, reason: '' })}
              >
                Đóng
              </button>
              <button
                className="cancel-modal-btn cancel-modal-btn-confirm"
                onClick={handleCancelOrder}
              >
                Xác nhận hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Received Modal */}
      {confirmModal.show && (
        <div
          className="modal-overlay"
          onClick={() => setConfirmModal({ show: false, orderId: null })}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cancel-modal-header">
              <div className="cancel-modal-icon" style={{ background: '#d1fae5', color: '#10b981' }}>
                <PackageCheck size={24} />
              </div>
              <h3 className="cancel-modal-title">Xác nhận đã nhận hàng</h3>
            </div>

            <div className="cancel-modal-body">
              <p className="cancel-modal-desc">
                Bạn đã nhận được hàng và kiểm tra hàng hóa? Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái Hoàn thành.
              </p>
            </div>

            <div className="cancel-modal-footer">
              <button
                className="cancel-modal-btn cancel-modal-btn-close"
                onClick={() => setConfirmModal({ show: false, orderId: null })}
              >
                Đóng
              </button>
              <button
                className="cancel-modal-btn cancel-modal-btn-confirm"
                style={{ background: '#10b981' }}
                onClick={handleConfirmReceived}
              >
                Xác nhận đã nhận
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default MyOrdersPage;
