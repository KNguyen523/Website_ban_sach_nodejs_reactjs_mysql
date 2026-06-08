import React, { useState, useEffect } from 'react';
import { X, Ticket, Copy, Check, Gift } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './VoucherPopup.css';

const VoucherPopup = () => {
  const [open, setOpen] = useState(false);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState('');

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        const res = await api.get('/public/vouchers/active');
        if (res.data.success && res.data.data.length > 0) {
          setVouchers(res.data.data);
          setOpen(true);
        }
      } catch (error) {
        console.error('Error fetching vouchers:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchVouchers();
  }, []);

  const formatPrice = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const formatDate = (d) =>
    new Date(d).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const handleCopy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast.success(`Đã sao chép mã ${code}`);
      setTimeout(() => setCopiedCode(''), 2000);
    } catch (err) {
      toast.error('Không thể sao chép mã');
    }
  };

  const renderDiscountLabel = (v) => {
    if (v.type === 'percent') {
      const pct = Number(v.value);
      const cap = v.max_discount ? ` (tối đa ${formatPrice(v.max_discount)})` : '';
      return `Giảm ${pct}%${cap}`;
    }
    return `Giảm ${formatPrice(v.value)}`;
  };

  if (loading || !open || vouchers.length === 0) return null;

  return (
    <div className="voucher-popup-overlay" onClick={() => setOpen(false)}>
      <div className="voucher-popup" onClick={(e) => e.stopPropagation()}>
        <button className="voucher-popup-close" onClick={() => setOpen(false)} aria-label="Đóng">
          <X size={20} />
        </button>

        <div className="voucher-popup-header">
          <div className="voucher-popup-header-icon">
            <Gift size={28} />
          </div>
          <h2 className="voucher-popup-title">Ưu đãi dành cho bạn</h2>
          <p className="voucher-popup-subtitle">
            Sao chép mã và áp dụng khi thanh toán để nhận ưu đãi hấp dẫn!
          </p>
        </div>

        <div className="voucher-popup-list">
          {vouchers.map((v) => (
            <div key={v.id} className="voucher-card">
              <div className="voucher-card-left">
                <Ticket size={28} className="text-emerald-500" />
                <div className="voucher-discount-value">{renderDiscountLabel(v)}</div>
              </div>

              <div className="voucher-card-divider" />

              <div className="voucher-card-body">
                <div className="voucher-code-row">
                  <span className="voucher-code">{v.code}</span>
                  <button
                    type="button"
                    className="voucher-copy-btn"
                    onClick={() => handleCopy(v.code)}
                  >
                    {copiedCode === v.code ? <Check size={14} /> : <Copy size={14} />}
                    {copiedCode === v.code ? 'Đã copy' : 'Sao chép'}
                  </button>
                </div>
                <div className="voucher-meta">
                  {Number(v.min_order_amount) > 0 && (
                    <span>Đơn tối thiểu {formatPrice(v.min_order_amount)}</span>
                  )}
                  <span>HSD: {formatDate(v.end_date)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="voucher-popup-footer">
          <button className="voucher-popup-close-btn" onClick={() => setOpen(false)}>
            Tiếp tục mua sắm
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoucherPopup;
