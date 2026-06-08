import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';

const AuthorModal = ({ isOpen, onClose, author, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        biography: '',
        is_active: 1
    });

    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (author) {
                setFormData({
                    name: author.name || '',
                    biography: author.biography || '',
                    is_active: (author.is_active === 1 || author.is_active === true || author.is_active === undefined) ? 1 : 0
                });
            } else {
                setFormData({
                    name: '',
                    biography: '',
                    is_active: 1
                });
            }
        }
    }, [isOpen, author]);

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
            if (author) {
                res = await api.put(`/authors/${author.id}`, formData);
            } else {
                res = await api.post('/authors', formData);
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
            <div className="modal-content glass admin-modal" style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>{author ? 'Sửa tác giả' : 'Thêm tác giả mới'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setIsConfirmOpen(true); }}>
                    <div className="form-group">
                        <label>Tên tác giả *</label>
                        <input 
                            type="text" name="name" value={formData.name} 
                            onChange={handleChange} required placeholder="Vd: Nguyễn Nhật Ánh..." 
                        />
                    </div>

                    <div className="form-group">
                        <label>Tiểu sử</label>
                        <textarea name="biography" value={formData.biography} onChange={handleChange} rows="4"></textarea>
                    </div>

                    <div className="form-checkboxes">
                        <label className="checkbox-item">
                            <input 
                                type="checkbox" name="is_active" 
                                checked={formData.is_active === 1 || formData.is_active === true} onChange={handleChange} 
                            />
                            <span>Đang hoạt động</span>
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Hủy</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Đang lưu...' : (
                                <><Save size={18} /> {author ? 'Lưu thay đổi' : 'Thêm mới'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xác nhận lưu"
                message="Bạn có chắc chắn muốn lưu thông tin tác giả này không?"
                onConfirm={handleSubmit}
                onCancel={() => setIsConfirmOpen(false)}
                type="info"
            />
        </div>
    );
};

export default AuthorModal;
