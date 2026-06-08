import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, CreditCard, ShoppingBag, Truck, ChevronRight, 
  AlertCircle, CheckCircle2 
} from 'lucide-react';
import api, { getServerUrl } from '../utils/api';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
  fetchProvinces,
  fetchDistrictsByProvinceCode,
  fetchWardsByDistrictCode,
  findAddressCodes
} from '../utils/vietnamAddressApi';
import './CheckoutPage.css';

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    receiver_name: '',
    receiver_phone: '',
    shipping_province: '',
    shipping_district: '',
    shipping_ward: '',
    shipping_address: '',
    note: '',
    payment_method: 'cod'
  });

  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingConfig, setShippingConfig] = useState({ shipping_fee: 0, free_shipping_threshold: 0 });
  const [availableVouchers, setAvailableVouchers] = useState([]);

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // Vietnam administrative units
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
  const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
  const [selectedWardCode, setSelectedWardCode] = useState('');

  useEffect(() => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để thanh toán');
      navigate('/');
      return;
    }
    if (cartItems.length === 0) {
      navigate('/cart');
      return;
    }

    fetchSavedAddresses();
    loadProvinces();
    fetchShippingConfig();
    fetchAvailableVouchers();
    setFormData(prev => ({
      ...prev,
      receiver_name: user?.full_name || '',
      receiver_phone: user?.phone || ''
    }));
  }, [user, cartItems]);

  const fetchAvailableVouchers = async () => {
    try {
      const res = await api.get('/public/vouchers/active');
      if (res.data.success) {
        setAvailableVouchers(res.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    }
  };

  const fetchShippingConfig = async () => {
    try {
      const res = await api.get('/public/settings');
      if (res.data.success) {
        const s = res.data.data || {};
        setShippingConfig({
          shipping_fee: Number(s.shipping_fee) || 0,
          free_shipping_threshold:
            Number(s.free_shipping_threshold) || Number(s.free_ship_min) || 0
        });
      }
    } catch (error) {
      console.error('Error fetching shipping config:', error);
    }
  };

  const loadProvinces = async () => {
    try {
      const data = await fetchProvinces();
      setProvinces(data || []);
    } catch (error) {
      console.error('Error fetching provinces:', error);
    }
  };

  const handleProvinceChange = async (e) => {
    const code = e.target.value;
    const provinceName = e.target.options[e.target.selectedIndex].text;
    setSelectedProvinceCode(code);
    setSelectedDistrictCode('');
    setSelectedWardCode('');
    setDistricts([]);
    setWards([]);
    setFormData(prev => ({
      ...prev,
      shipping_province: code ? provinceName : '',
      shipping_district: '',
      shipping_ward: ''
    }));
    if (!code) return;
    try {
      const districtList = await fetchDistrictsByProvinceCode(code);
      setDistricts(districtList);
    } catch (error) {
      console.error('Error fetching districts:', error);
    }
  };

  const handleDistrictChange = async (e) => {
    const code = e.target.value;
    const districtName = e.target.options[e.target.selectedIndex].text;
    setSelectedDistrictCode(code);
    setSelectedWardCode('');
    setWards([]);
    setFormData(prev => ({
      ...prev,
      shipping_district: code ? districtName : '',
      shipping_ward: ''
    }));
    if (!code) return;
    try {
      const wardList = await fetchWardsByDistrictCode(code);
      setWards(wardList);
    } catch (error) {
      console.error('Error fetching wards:', error);
    }
  };

  const handleWardChange = (e) => {
    const code = e.target.value;
    const wardName = e.target.options[e.target.selectedIndex].text;
    setSelectedWardCode(code);
    setFormData(prev => ({
      ...prev,
      shipping_ward: code ? wardName : ''
    }));
  };

  const fetchSavedAddresses = async () => {
    try {
      const res = await api.get('/addresses');
      if (res.data.success) {
        setSavedAddresses(res.data.data);
        // Auto select default address
        const defaultAddr = res.data.data.find(a => a.is_default);
        if (defaultAddr) {
          handleSelectAddress(defaultAddr);
        }
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const handleSelectAddress = async (addr) => {
    setSelectedAddressId(addr.id);
    setFormData({
      ...formData,
      receiver_name: addr.receiver_name,
      receiver_phone: addr.receiver_phone,
      shipping_province: addr.province,
      shipping_district: addr.district,
      shipping_ward: addr.ward,
      shipping_address: addr.street_address
    });

    // Try to sync the dropdowns with the saved address values
    try {
      const matched = await findAddressCodes({
        province: addr.province,
        district: addr.district,
        ward: addr.ward
      }, provinces);

      setProvinces(matched.provinces || []);
      setDistricts(matched.districts);
      setWards(matched.wards);
      setSelectedProvinceCode(matched.provinceCode);
      setSelectedDistrictCode(matched.districtCode);
      setSelectedWardCode(matched.wardCode);
    } catch (error) {
      console.error('Error syncing address dropdowns:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async () => {
    if (!couponCode) return;
    try {
      const res = await api.post('/coupons/apply', {
        code: couponCode,
        subtotal: cartTotal
      });
      if (res.data.success) {
        const amount = Number(res.data.data?.discount_amount) || 0;
        setDiscount(amount);
        setAppliedCoupon(res.data.data?.code || couponCode);
        toast.success(res.data.message);
      }
    } catch (error) {
      setDiscount(0);
      setAppliedCoupon(null);
      toast.error(error.response?.data?.message || 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const phoneRegex = /^0[0-9]{9}$/;
    if (!phoneRegex.test(formData.receiver_phone)) {
      toast.error('Số điện thoại nhận hàng phải có đúng 10 chữ số và bắt đầu bằng số 0');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/user-orders', {
        ...formData,
        coupon_code: couponCode || null
      });

      if (res.data.success) {
        if (formData.payment_method === 'vnpay') {
          // Get VNPay URL
          const vnpRes = await api.post('/vnpay/create_payment_url', {
            orderId: res.data.order_id,
            amount: finalTotal,
            bankCode: '' // Default all
          });

          if (vnpRes.data.success) {
            window.location.href = vnpRes.data.paymentUrl;
            return;
          }
        }

        toast.success('Đặt hàng thành công!');
        clearCart();
        navigate(`/order-success/${res.data.order_code}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đặt hàng');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const subtotal = Number(cartTotal) || 0;
  const discountAmount = Number(discount) || 0;
  const shippingFee =
    shippingConfig.free_shipping_threshold > 0 &&
    subtotal >= shippingConfig.free_shipping_threshold
      ? 0
      : shippingConfig.shipping_fee;
  const finalTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="checkout-page">
        <div className="container">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
            <span className="cursor-pointer hover:text-emerald-500" onClick={() => navigate('/cart')}>Giỏ hàng</span>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">Thanh toán</span>
          </div>

          <form onSubmit={handleSubmit} className="checkout-container">
            {/* Left: Shipping & Payment */}
            <div className="checkout-left">
              <section className="checkout-section">
                <h2 className="checkout-section-title">
                  <MapPin className="text-emerald-500" />
                  Thông tin giao hàng
                </h2>

                {savedAddresses.length > 0 && (
                  <div className="saved-addresses-selector mb-6">
                    <p className="text-sm font-bold text-gray-700 mb-3">Chọn địa chỉ đã lưu:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {savedAddresses.map(addr => (
                        <div 
                          key={addr.id} 
                          className={`saved-address-card ${selectedAddressId === addr.id ? 'active' : ''}`}
                          onClick={() => handleSelectAddress(addr)}
                        >
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-sm">{addr.receiver_name}</p>
                            {addr.is_default === 1 && <span className="default-badge">Mặc định</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{addr.receiver_phone}</p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {`${addr.street_address}, ${addr.ward}, ${addr.district}, ${addr.province}`}
                          </p>
                        </div>
                      ))}
                      <div
                        className={`saved-address-card flex items-center justify-center border-dashed ${!selectedAddressId ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedAddressId(null);
                          setFormData({
                            ...formData,
                            receiver_name: user?.full_name || '',
                            receiver_phone: user?.phone || '',
                            shipping_province: '',
                            shipping_district: '',
                            shipping_ward: '',
                            shipping_address: ''
                          });
                          setSelectedProvinceCode('');
                          setSelectedDistrictCode('');
                          setSelectedWardCode('');
                          setDistricts([]);
                          setWards([]);
                        }}
                      >
                        <p className="text-xs font-bold text-emerald-500">+ Nhập địa chỉ mới</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="checkout-form">
                  <div className="form-group">
                    <label>Họ tên người nhận</label>
                    <input 
                      type="text" 
                      name="receiver_name" 
                      value={formData.receiver_name}
                      onChange={handleInputChange}
                      placeholder="Nhập họ tên" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại</label>
                    <input 
                      type="tel" 
                      name="receiver_phone" 
                      value={formData.receiver_phone}
                      onChange={handleInputChange}
                      placeholder="Nhập số điện thoại" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label>Tỉnh / Thành phố</label>
                    <select
                      name="shipping_province"
                      value={selectedProvinceCode}
                      onChange={handleProvinceChange}
                      required
                    >
                      <option value="">-- Chọn Tỉnh/Thành --</option>
                      {provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Quận / Huyện</label>
                    <select
                      name="shipping_district"
                      value={selectedDistrictCode}
                      onChange={handleDistrictChange}
                      disabled={!selectedProvinceCode}
                      required
                    >
                      <option value="">-- Chọn Quận/Huyện --</option>
                      {districts.map(d => (
                        <option key={d.code} value={d.code}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Phường / Xã</label>
                    <select
                      name="shipping_ward"
                      value={selectedWardCode}
                      onChange={handleWardChange}
                      disabled={!selectedDistrictCode}
                      required
                    >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {wards.map(w => (
                        <option key={w.code} value={w.code}>{w.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Địa chỉ chi tiết</label>
                    <input 
                      type="text" 
                      name="shipping_address" 
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      placeholder="Số nhà, tên đường..." 
                      required 
                    />
                  </div>
                  <div className="form-group full-width">
                    <label>Ghi chú (tùy chọn)</label>
                    <textarea 
                      name="note" 
                      rows="3" 
                      value={formData.note}
                      onChange={handleInputChange}
                      placeholder="Ghi chú về đơn hàng, ví dụ: giao giờ hành chính..."
                    ></textarea>
                  </div>
                </div>
              </section>

              <section className="checkout-section">
                <h2 className="checkout-section-title">
                  <CreditCard className="text-emerald-500" />
                  Phương thức thanh toán
                </h2>
                <div className="payment-methods">
                  <label className={`payment-method-item ${formData.payment_method === 'cod' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="cod" 
                      checked={formData.payment_method === 'cod'}
                      onChange={handleInputChange}
                    />
                    <div className="flex flex-col">
                      <span className="font-bold">Thanh toán khi nhận hàng (COD)</span>
                      <span className="text-xs text-gray-500">Thanh toán bằng tiền mặt khi nhận hàng</span>
                    </div>
                  </label>
                  <label className={`payment-method-item ${formData.payment_method === 'vnpay' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="payment_method" 
                      value="vnpay" 
                      checked={formData.payment_method === 'vnpay'}
                      onChange={handleInputChange}
                    />
                    <div className="flex flex-col">
                      <span className="font-bold">Thanh toán online qua VNPay</span>
                      <span className="text-xs text-gray-500">Thanh toán an toàn qua cổng VNPay (Visa, Mastercard, ATM...)</span>
                    </div>
                  </label>
                </div>
              </section>
            </div>

            {/* Right: Summary */}
            <aside className="checkout-right">
              <div className="order-summary-card">
                <h2 className="text-xl font-extrabold mb-6 flex items-center gap-2">
                  <ShoppingBag size={20} />
                  Đơn hàng ({cartItems.length})
                </h2>
                
                <div className="max-h-[300px] overflow-y-auto mb-6 pr-2 custom-scrollbar">
                  {cartItems.map(item => (
                    <div key={item.cart_item_id} className="item-mini">
                      <img src={`${getServerUrl()}${item.thumbnail}`} alt={item.title} />
                      <div className="item-mini-info">
                        <p className="item-mini-title line-clamp-2">{item.title}</p>
                        <div className="flex justify-between items-center text-gray-500">
                          <span>Số lượng: {item.quantity}</span>
                          <span className="font-bold text-gray-800">
                            {formatPrice(item.price * (1 - (item.discount_percent || 0) / 100))}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="coupon-section">
                  <select
                    className="coupon-input"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      if (!e.target.value) {
                        setDiscount(0);
                        setAppliedCoupon(null);
                      }
                    }}
                  >
                    <option value="">-- Chọn mã giảm giá --</option>
                    {availableVouchers.map((v) => {
                      const maxDiscount = Number(v.max_discount) || 0;
                      const minOrder = Number(v.min_order_amount) || 0;
                      const discountLabel = v.type === 'percent'
                        ? `${Number(v.value)}%${maxDiscount > 0 ? ` (≤ ${formatPrice(maxDiscount)})` : ''}`
                        : formatPrice(v.value);
                      const minOrderLabel = minOrder > 0 ? ` • Đơn ≥ ${formatPrice(minOrder)}` : '';
                      return (
                        <option key={v.id} value={v.code}>
                          {v.code} — {discountLabel}{minOrderLabel}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    className="apply-coupon-btn"
                    onClick={handleApplyCoupon}
                    disabled={!couponCode}
                  >
                    Áp dụng
                  </button>
                </div>
                {appliedCoupon && (
                  <div className="applied-coupon-note">
                    Đã áp dụng mã <strong>{appliedCoupon}</strong>
                  </div>
                )}

                <div className="space-y-3 py-4 border-t border-b border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Tạm tính</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phí vận chuyển</span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-500 font-bold">Miễn phí</span>
                    ) : (
                      <span>{formatPrice(shippingFee)}</span>
                    )}
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Giảm giá
                      {appliedCoupon && (
                        <span className="text-xs text-emerald-600 ml-1">({appliedCoupon})</span>
                      )}
                    </span>
                    <span className={discountAmount > 0 ? 'text-emerald-600 font-bold' : ''}>
                      - {formatPrice(discountAmount)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-6 mb-8">
                  <span className="text-lg font-bold">Tổng thanh toán</span>
                  <span className="text-2xl font-extrabold text-emerald-500">
                    {formatPrice(finalTotal)}
                  </span>
                </div>

                <button 
                  type="submit" 
                  className="place-order-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG NGAY'}
                </button>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl flex items-start gap-3">
                  <Truck size={18} className="text-emerald-500 shrink-0" />
                  <p className="text-xs text-gray-500">
                    Thời gian giao hàng dự kiến từ 2-4 ngày làm việc. Quý khách vui lòng kiểm tra hàng trước khi thanh toán.
                  </p>
                </div>
              </div>
            </aside>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CheckoutPage;
