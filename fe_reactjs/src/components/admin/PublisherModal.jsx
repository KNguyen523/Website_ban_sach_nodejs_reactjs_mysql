import React, { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';

const PublisherModal = ({ isOpen, onClose, publisher, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        logo: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (publisher) {
                setFormData({
                    name: publisher.name || '',
                    logo: publisher.logo || '',
                    description: publisher.description || ''
                });
            } else {
                setFormData({
                    name: '',
                    logo: '',
                    description: ''
                });
            }
        }
    }, [isOpen, publisher]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        try {
            let res;
            if (publisher) {
                res = await api.put(`/publishers/${publisher.id}`, formData);
            } else {
                res = await api.post('/publishers', formData);
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
            <div className="modal-content glass admin-modal" style={{ maxWidth: '520px' }}>
                <div className="modal-header">
                    <h2>{publisher ? 'Sửa nhà xuất bản' : 'Thêm nhà xuất bản mới'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setIsConfirmOpen(true); }}>
                    <div className="form-group">
                        <label>Tên nhà xuất bản *</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Vd: NXB Trẻ, NXB Kim Đồng..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Logo URL</label>
                        <input
                            type="text"
                            name="logo"
                            value={formData.logo}
                            onChange={handleChange}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="4"
                        />
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Hủy</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Đang lưu...' : (
                                <><Save size={18} /> {publisher ? 'Lưu thay đổi' : 'Thêm mới'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Xác nhận lưu"
                message="Bạn có chắc chắn muốn lưu thông tin nhà xuất bản này không?"
                onConfirm={handleSubmit}
                onCancel={() => setIsConfirmOpen(false)}
                type="info"
            />
        </div>
    );
};

export default PublisherModal;
