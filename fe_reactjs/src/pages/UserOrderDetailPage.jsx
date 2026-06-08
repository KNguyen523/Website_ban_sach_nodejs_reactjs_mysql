import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, MapPin, CreditCard, Clock, CheckCircle2, 
  Truck, PackageCheck, Star, XCircle 
} from 'lucide-react';
import api, { getServerUrl } from '../utils/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ConfirmModal from '../components/common/ConfirmModal';
import { toast } from 'react-toastify';
import './UserOrderDetailPage.css';

const UserOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [cancelModal, setCancelModal] = useState({ show: false, reason: '' });
  const [cancelling, setCancelling] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  useEffect(() => {
    fetchOrderDetails();
  }, [id]);

  const fetchOrderDetails = async () => {
    try {
      const res = await api.get(`/user-orders/${id}`);
      if (res.data.success) {
        setOrder(res.data.data);
      }
    } catch (error) {
      toast.error('Không thể tải chi tiết đơn hàng');
      navigate('/my-orders');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceived = async () => {
    setConfirming(true);
    try {
      const res = await api.put(`/user-orders/${id}/confirm-received`);
      if (res.data.success) {
        toast.success('Xác nhận đã nhận hàng thành công. Cảm ơn bạn!');
        fetchOrderDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể xác nhận đơn hàng');
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModal.reason.trim()) {
      toast.error('Vui lòng nhập lý do hủy đơn');
      return;
    }
    setCancelling(true);
    try {
      const res = await api.put(`/user-orders/${id}/cancel`, { reason: cancelModal.reason });
      if (res.data.success) {
        toast.success('Đã hủy đơn hàng');
        setCancelModal({ show: false, reason: '' });
        fetchOrderDetails();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể hủy đơn hàng');
    } finally {
      setCancelling(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const steps = [
    { key: 'pending', label: 'Chờ xử lý', icon: <Clock size={24} /> },
    { key: 'confirmed', label: 'Đã xác nhận', icon: <CheckCircle2 size={24} /> },
    { key: 'shipping', label: 'Đang giao', icon: <Truck size={24} /> },
    { key: 'delivered', label: 'Đã giao', icon: <PackageCheck size={24} /> },
    { key: 'completed', label: 'Hoàn thành', icon: <Star size={24} /> }
  ];

  const getStepStatus = (stepKey) => {
    if (!order || order.status === 'cancelled') return '';
    const statusOrder = ['pending', 'confirmed', 'shipping', 'delivered', 'completed'];
    const currentIdx = statusOrder.indexOf(order.status);
    const stepIdx = statusOrder.indexOf(stepKey);

    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return '';
  };

  if (loading) return null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="order-detail-page">
        <div className="container">
          <div className="order-detail-container">
            <button 
              onClick={() => navigate('/my-orders')}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 font-bold mb-6 transition"
            >
              <ArrowLeft size={18} />
              Quay lại danh sách đơn hàng
            </button>

            {/* Order Status Header */}
            <div className="detail-header">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-black text-gray-800 uppercase">Đơn hàng #{order.order_code}</h1>
                  <p className="text-gray-500">Đặt ngày {new Date(order.created_at).toLocaleString('vi-VN')}</p>
                </div>
                {order.status === 'cancelled' && (
                  <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-2 rounded-xl font-bold border border-red-100">
                    <XCircle size={20} />
                    ĐÃ HỦY
                  </div>
                )}
              </div>

              {order.status !== 'cancelled' ? (
                <div className="order-timeline">
                  {steps.map((step) => (
                    <div key={step.key} className={`timeline-step ${getStepStatus(step.key)}`}>
                      <div className="step-icon">
                        {step.icon}
                      </div>
                      <span className="step-label">{step.label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-red-700 mb-8">
                  <p className="font-bold">Lý do hủy:</p>
                  <p>{order.cancelled_reason || 'Không có lý do cụ thể'}</p>
                </div>
              )}

              <div className="info-grid">
                <div className="info-box">
                  <h3 className="info-box-title">
                    <MapPin size={18} className="text-emerald-500" />
                    Địa chỉ nhận hàng
                  </h3>
                  <p className="font-bold text-gray-800 mb-1">{order.receiver_name}</p>
                  <p className="text-gray-600 mb-2">{order.receiver_phone}</p>
                  <p className="text-gray-600 text-sm">
                    {order.shipping_address}, {order.shipping_ward}, {order.shipping_district}, {order.shipping_province}
                  </p>
                </div>
                <div className="info-box">
                  <h3 className="info-box-title">
                    <CreditCard size={18} className="text-emerald-500" />
                    Hình thức thanh toán
                  </h3>
                  <p className="text-gray-600 uppercase font-bold">{order.payment_method}</p>
                  <p className={`mt-2 text-sm font-bold ${order.payment_status === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>
                    Trạng thái: {order.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                  </p>
                  {order.note && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-1">Ghi chú:</p>
                      <p className="text-gray-600 italic text-sm">"{order.note}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="order-items-card">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                Danh sách sản phẩm
              </h2>
              
              <div className="items-list">
                {order.items?.map((item) => (
                  <div key={item.id} className="item-row">
                    <img src={`${getServerUrl()}${item.book_thumbnail}`} alt={item.book_title} className="item-img" />
                    <div className="item-name">
                      <p className="text-lg">{item.book_title}</p>
                      <p className="text-gray-400 text-sm">Số lượng: x{item.quantity}</p>
                    </div>
                    <div className="item-price-qty">
                      <p className="font-bold text-emerald-600">{formatPrice(item.price_at_purchase)}</p>
                      <p className="text-xs text-gray-400">Thành tiền: {formatPrice(item.price_at_purchase * item.quantity)}</p>
                    </div>
                    {order.status === 'completed' && item.book_id && (
                      <button
                        type="button"
                        className="item-review-btn"
                        onClick={() => navigate(`/product/${item.book_id}?review=1`)}
                      >
                        <Star size={16} />
                        Đánh giá
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="summary-details">
                <div className="summary-item">
                  <span>Tạm tính</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="summary-item">
                  <span>Phí vận chuyển</span>
                  <span>{formatPrice(order.shipping_fee)}</span>
                </div>
                <div className="summary-item text-red-500">
                  <span>Giảm giá</span>
                  <span>- {formatPrice(order.discount_amount)}</span>
                </div>
                <div className="summary-item grand-total">
                  <span>Tổng tiền</span>
                  <span className="text-emerald-500">{formatPrice(order.final_amount)}</span>
                </div>
              </div>

              {order.status === 'delivered' && (
                <div className="order-action-row">
                  <p className="order-action-hint">
                    Vui lòng kiểm tra hàng và xác nhận để hoàn tất đơn hàng.
                  </p>
                  <button
                    onClick={() => setIsConfirmOpen(true)}
                    disabled={confirming}
                    className="btn-confirm-order"
                  >
                    <PackageCheck size={18} />
                    {confirming ? 'Đang xử lý...' : 'Xác nhận đã nhận hàng'}
                  </button>
                </div>
              )}

              {order.status === 'pending' && (
                <div className="order-action-row">
                  <p className="order-action-hint">
                    Bạn có thể hủy đơn hàng khi đơn vẫn đang chờ xử lý.
                  </p>
                  <button
                    onClick={() => setCancelModal({ show: true, reason: '' })}
                    className="btn-cancel-order"
                  >
                    <XCircle size={18} />
                    Hủy đơn hàng
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {cancelModal.show && (
        <div
          className="modal-overlay"
          onClick={() => setCancelModal({ show: false, reason: '' })}
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
                onClick={() => setCancelModal({ show: false, reason: '' })}
                disabled={cancelling}
              >
                Đóng
              </button>
              <button
                className="cancel-modal-btn cancel-modal-btn-confirm"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={isConfirmOpen}
        title="Xác nhận nhận hàng"
        message="Bạn đã nhận được hàng và kiểm tra hàng hóa? Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái Hoàn thành."
        onConfirm={handleConfirmReceived}
        onCancel={() => setIsConfirmOpen(false)}
        type="info"
      />

      <Footer />
    </div>
  );
};

export default UserOrderDetailPage;
