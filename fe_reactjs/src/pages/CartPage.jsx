import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ConfirmModal from '../components/common/ConfirmModal';
import { useCart } from '../context/CartContext';
import api, { getServerUrl } from '../utils/api';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [freeShipThreshold, setFreeShipThreshold] = useState(0);

  useEffect(() => {
    const fetchShippingConfig = async () => {
      try {
        const res = await api.get('/public/settings');
        if (res.data.success) {
          const s = res.data.data || {};
          setFreeShipThreshold(
            Number(s.free_shipping_threshold) || Number(s.free_ship_min) || 0
          );
        }
      } catch (err) {
        console.error('Error fetching shipping config:', err);
      }
    };
    fetchShippingConfig();
  }, []);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="cart-page">
        <div className="container">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-3xl font-extrabold text-gray-800">Giỏ hàng của bạn</h1>
            <span className="bg-emerald-100 text-emerald-600 px-3 py-1 rounded-full text-sm font-bold">
              {cartItems.length} sản phẩm
            </span>
          </div>

          {cartItems.length > 0 ? (
            <div className="cart-container">
              {/* Items List */}
              <div className="cart-items-section">
                {cartItems.map((item) => {
                  const currentPrice = item.price * (1 - (item.discount_percent || 0) / 100);
                  return (
                    <div key={item.cart_item_id} className="cart-item">
                      <img 
                        src={`${getServerUrl()}${item.thumbnail}`} 
                        alt={item.title} 
                        className="cart-item-img"
                        onClick={() => navigate(`/product/${item.id}`)}
                      />
                      
                      <div className="cart-item-info">
                        <Link to={`/product/${item.id}`} className="cart-item-title hover:text-emerald-500 transition">
                          {item.title}
                        </Link>
                        <p className="cart-item-author">{item.category_name}</p>
                        <div className="cart-item-price">
                          <span className="item-current-price">{formatPrice(currentPrice)}</span>
                          {item.discount_percent > 0 && (
                            <span className="item-old-price">{formatPrice(item.price)}</span>
                          )}
                        </div>
                      </div>

                      <div className="cart-item-actions">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-10">
                          <button 
                            className="px-3 hover:bg-gray-100 transition"
                            onClick={() => updateQuantity(item.cart_item_id, Math.max(1, item.quantity - 1))}
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-4 font-bold w-12 text-center">{item.quantity}</span>
                          <button 
                            className="px-3 hover:bg-gray-100 transition"
                            onClick={() => updateQuantity(item.cart_item_id, item.quantity + 1)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        
                        <div
                          className="remove-btn"
                          onClick={() => setConfirmRemoveId(item.cart_item_id)}
                        >
                          <Trash2 size={20} />
                        </div>
                      </div>
                    </div>
                  );
                })}

                <div className="mt-6">
                  <button 
                    className="flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700 transition"
                    onClick={() => navigate('/products')}
                  >
                    <ArrowLeft size={18} />
                    Tiếp tục mua sắm
                  </button>
                </div>
              </div>

              {/* Summary */}
              <aside className="cart-summary">
                <h2 className="summary-title">Tổng cộng</h2>
                <div className="summary-row">
                  <span>Tạm tính</span>
                  <span>{formatPrice(cartTotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Phí vận chuyển</span>
                  <span className="text-emerald-500 font-bold">Miễn phí</span>
                </div>
                <div className="summary-row">
                  <span>Giảm giá</span>
                  <span>- 0₫</span>
                </div>
                
                <div className="summary-row total">
                  <span>Tổng tiền</span>
                  <span className="total-amount">{formatPrice(cartTotal)}</span>
                </div>

                <p className="text-xs text-gray-400 mt-4 text-center">
                  (Đã bao gồm thuế VAT nếu có)
                </p>

                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                >
                  THANH TOÁN NGAY
                </button>
                
                {freeShipThreshold > 0 && (
                  <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <p className="text-xs text-emerald-700 flex items-center gap-2">
                      <ShoppingBag size={14} />
                      Miễn phí vận chuyển cho đơn hàng từ {formatPrice(freeShipThreshold)}
                    </p>
                  </div>
                )}
              </aside>
            </div>
          ) : (
            <div className="empty-cart bg-white rounded-2xl shadow-sm">
              <div className="flex flex-col items-center">
                <img src="https://cdni.iconscout.com/illustration/premium/thumb/empty-cart-5521508-4610092.png" alt="Empty Cart" />
                <h2 className="text-2xl font-bold text-gray-700 mb-2">Giỏ hàng của bạn đang trống</h2>
                <p className="text-gray-500 mb-8">Hãy chọn cho mình những quyển sách hay nhất nhé!</p>
                <button 
                  className="px-8 py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-200"
                  onClick={() => navigate('/products')}
                >
                  MUA SẮM NGAY
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />

      <ConfirmModal
        isOpen={confirmRemoveId !== null}
        title="Xóa sản phẩm"
        message="Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?"
        onConfirm={() => removeFromCart(confirmRemoveId)}
        onCancel={() => setConfirmRemoveId(null)}
        type="danger"
      />
    </div>
  );
};

export default CartPage;
