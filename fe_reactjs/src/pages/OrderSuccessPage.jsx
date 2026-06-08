import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, ArrowRight, ShoppingBag, XCircle } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useCart } from '../context/CartContext';
import api from '../utils/api';
import './OrderSuccessPage.css';

const OrderSuccessPage = () => {
  const { code: codeFromUrl } = useParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const vnpResponseCode = searchParams.get('vnp_ResponseCode');
  const isVnPay = vnpResponseCode !== null;

  const [verifying, setVerifying] = useState(isVnPay);
  const [isSuccess, setIsSuccess] = useState(!isVnPay);
  const [orderCode, setOrderCode] = useState(codeFromUrl || null);
  const [showSuccessPopup, setShowSuccessPopup] = useState(!isVnPay);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (!isVnPay) return;

    const verifyVnPayPayment = async () => {
      try {
        const params = Object.fromEntries(searchParams.entries());
        const res = await api.get('/vnpay/vnpay_return', { params });

        if (res.data.success) {
          setIsSuccess(true);
          setShowSuccessPopup(true);
          if (res.data.order_code) setOrderCode(res.data.order_code);
          clearCart();
        } else {
          setIsSuccess(false);
          if (res.data.order_code) setOrderCode(res.data.order_code);
        }
      } catch (error) {
        console.error('Error verifying VNPAY payment:', error);
        setIsSuccess(false);
      } finally {
        setVerifying(false);
      }
    };

    verifyVnPayPayment();
  }, [isVnPay, searchParams, clearCart]);

  useEffect(() => {
    if (!showSuccessPopup) return;

    const tick = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    const redirect = setTimeout(() => {
      navigate('/my-orders');
    }, 3000);

    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [showSuccessPopup, navigate]);

  if (verifying) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <Header />
        <main className="py-20">
          <div className="container max-w-2xl mx-auto text-center bg-white p-12 rounded-3xl shadow-xl">
            <h2 className="text-2xl font-bold text-gray-700">Đang xác nhận thanh toán...</h2>
            <p className="text-gray-500 mt-2">Vui lòng đợi trong giây lát.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />

      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup-card">
            <div className="success-popup-icon">
              <CheckCircle size={56} strokeWidth={2.5} />
            </div>
            <h2 className="success-popup-title">Thanh toán thành công!</h2>
            <p className="success-popup-desc">
              Đơn hàng của bạn đã được ghi nhận. Cảm ơn bạn đã mua sắm tại Bookstore.
            </p>

            {orderCode && (
              <div className="success-popup-code">
                <span className="success-popup-code-label">Mã đơn hàng</span>
                <span className="success-popup-code-value">{orderCode}</span>
              </div>
            )}

            <div className="success-popup-countdown">
              Tự động chuyển sang trang đơn hàng sau <strong>{countdown}</strong> giây...
            </div>

            <div className="success-popup-progress">
              <div className="success-popup-progress-bar"></div>
            </div>

            <button
              className="success-popup-skip"
              onClick={() => navigate('/my-orders')}
            >
              Đến trang đơn hàng ngay
            </button>
          </div>
        </div>
      )}

      <main className="py-20">
        <div className="container max-w-2xl mx-auto text-center bg-white p-12 rounded-3xl shadow-xl">
          {isSuccess ? (
            <>
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center">
                  <CheckCircle size={56} />
                </div>
              </div>

              <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Đặt hàng thành công!</h1>
              <p className="text-gray-500 mb-8 text-lg">
                Cảm ơn bạn đã tin tưởng mua sắm tại Bookstore. {orderCode && `Mã đơn hàng của bạn là:`}
              </p>

              {orderCode && (
                <div className="bg-gray-50 p-6 rounded-2xl border-2 border-dashed border-emerald-200 mb-10">
                  <span className="text-3xl font-black text-emerald-600 tracking-wider">{orderCode}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/products')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition"
                >
                  <ShoppingBag size={20} />
                  Tiếp tục mua sắm
                </button>
                <button
                  onClick={() => navigate('/my-orders')}
                  className="flex items-center justify-center gap-2 px-8 py-4 bg-emerald-500 text-white font-bold rounded-2xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200"
                >
                  <Package size={20} />
                  Xem đơn hàng
                  <ArrowRight size={20} />
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-center mb-8">
                <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center">
                  <XCircle size={56} />
                </div>
              </div>

              <h1 className="text-4xl font-extrabold text-gray-800 mb-4">Thanh toán thất bại</h1>
              <p className="text-gray-500 mb-10 text-lg">
                Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán trực tuyến.
                Vui lòng kiểm tra lại số dư hoặc thử lại sau.
              </p>

              <div className="failed-actions">
                <button
                  type="button"
                  onClick={() => navigate('/my-orders')}
                  className="failed-btn failed-btn-primary"
                >
                  <Package size={18} />
                  Kiểm tra đơn hàng của tôi
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/products')}
                  className="failed-btn failed-btn-ghost"
                >
                  <ShoppingBag size={18} />
                  Quay lại mua sắm
                </button>
              </div>
            </>
          )}

          <p className="mt-12 text-sm text-gray-400">
            {isSuccess
              ? "Hệ thống sẽ gửi thông tin xác nhận đơn hàng qua email của bạn trong ít phút nữa."
              : "Nếu bạn đã bị trừ tiền nhưng đơn hàng chưa cập nhật, vui lòng liên hệ hotline: 1900 xxxx"}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default OrderSuccessPage;
