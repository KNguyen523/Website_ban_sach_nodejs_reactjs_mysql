import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';

const VoucherModal = ({ isOpen, onClose, voucher, onSave }) => {
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percent',
        discount_value: 0,
        min_order_value: 0,
        max_discount_amount: 0,
        usage_limit: 1,
        start_date: '',
        end_date: '',
        is_active: 1
    });

    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (voucher) {
                // Format dates for input[type="date"] using local timezone (avoid UTC -1 day shift)
                const formatDate = (dateStr) => {
                    if (!dateStr) return '';
                    const d = new Date(dateStr);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const day = String(d.getDate()).padStart(2, '0');
                    return `${y}-${m}-${day}`;
                };

                // Map DB column names -> form field names
                setFormData({
                    code: voucher.code || '',
                    discount_type: voucher.type || 'percent',
                    discount_value: voucher.value ?? 0,
                    min_order_value: voucher.min_order_amount ?? 0,
                    max_discount_value: voucher.max_discount ?? 0,
                    usage_limit: voucher.usage_limit ?? 1,
                    start_date: formatDate(voucher.start_date),
                    end_date: formatDate(voucher.end_date),
                    is_active: voucher.is_active ?? 1
                });
            } else {
                setFormData({
                    code: '',
                    discount_type: 'percent',
                    discount_value: 0,
                    min_order_value: 0,
                    max_discount_value: 0,
                    usage_limit: 1,
                    start_date: '',
                    end_date: '',
                    is_active: 1
                });
            }
        }
    }, [isOpen, voucher]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            let res;
            if (voucher) {
                res = await api.put(`/vouchers/${voucher.id}`, formData);
            } else {
                res = await api.post('/vouchers', formData);
            }

            if (res.data.success) {
                toast.success(res.data.message);
                onSave();
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
            setIsConfirmOpen(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content glass admin-modal voucher-modal">
                <div className="modal-header">
                    <h2>{voucher ? 'Sửa Voucher' : 'Thêm Voucher mới'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setIsConfirmOpen(true); }}>
                    <div className="form-group">
                        <label>Mã Voucher <span className="required">*</span></label>
                        <input
                            type="text" name="code" value={formData.code}
                            onChange={handleChange} required placeholder="VD: GIAMGIA10, WELCOME..."
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Loại giảm giá</label>
                            <select name="discount_type" value={formData.discount_type} onChange={handleChange}>
                                <option value="percent">Phần trăm (%)</option>
                                <option value="fixed">Số tiền cố định (VNĐ)</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Giá trị giảm <span className="required">*</span></label>
                            <input
                                type="number" name="discount_value" value={formData.discount_value}
                                onChange={handleChange} required min="0"
                                placeholder={formData.discount_type === 'percent' ? 'VD: 10' : 'VD: 50000'}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Đơn hàng tối thiểu</label>
                            <input
                                type="number" name="min_order_value" value={formData.min_order_value}
                                onChange={handleChange} min="0" placeholder="VD: 100000"
                            />
                        </div>
                        <div className="form-group">
                            <label>Mức giảm tối đa</label>
                            <input
                                type="number" name="max_discount_value" value={formData.max_discount_value}
                                onChange={handleChange} min="0" placeholder="VD: 50000"
                                disabled={formData.discount_type !== 'percent'}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Ngày bắt đầu</label>
                            <input
                                type="date" name="start_date" value={formData.start_date}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Ngày kết thúc</label>
                            <input
                                type="date" name="end_date" value={formData.end_date}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Giới hạn lượt dùng</label>
                        <input
                            type="number" name="usage_limit" value={formData.usage_limit}
                            onChange={handleChange} min="1" placeholder="VD: 100"
                        />
                    </div>

                    <div className="form-checkboxes">
                        <label className="checkbox-item">
                            <input
                                type="checkbox" name="is_active"
                                checked={formData.is_active === 1} onChange={handleChange}
                            />
                            <span>Đang hoạt động</span>
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Hủy</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Đang lưu...' : (
                                <><Save size={18} /> {voucher ? 'Lưu thay đổi' : 'Thêm mới'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xác nhận lưu"
                message="Bạn có chắc chắn muốn lưu thông tin voucher này không?"
                onConfirm={handleSubmit}
                onCancel={() => setIsConfirmOpen(false)}
                type="info"
            />
        </div>
    );
};

export default VoucherModal;
