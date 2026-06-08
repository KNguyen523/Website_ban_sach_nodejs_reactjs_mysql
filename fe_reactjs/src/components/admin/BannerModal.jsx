import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save } from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';

const BannerModal = ({ isOpen, onClose, banner, onSave }) => {
    const [formData, setFormData] = useState({
        title: '',
        link: '',
        sort_order: 0,
        is_active: 1
    });
    const [imageFile, setImageFile] = useState(null);
    const [preview, setPreview] = useState('');
    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const fileInputRef = useRef(null);


    useEffect(() => {
        if (isOpen) {
            if (banner) {
                setFormData(banner);
                setPreview(banner.image_url ? (banner.image_url.startsWith('http') ? banner.image_url : `${getServerUrl()}${banner.image_url}`) : '');
            } else {
                setFormData({ title: '', link: '', sort_order: 0, is_active: 1 });
                setPreview('');
                setImageFile(null);
            }
        }
    }, [isOpen, banner]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setPreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (imageFile) data.append('image', imageFile);

        try {
            let res;
            if (banner) {
                res = await api.put(`/banners/${banner.id}`, data);
            } else {
                res = await api.post('/banners', data);
            }

            if (res.data.success) {
                toast.success(res.data.message);
                onSave();
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi lưu banner');
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
                    <h2>{banner ? 'Sửa Banner' : 'Thêm Banner mới'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setIsConfirmOpen(true); }}>
                    <div className="form-group">
                        <label>Ảnh Banner *</label>
                        <div className="upload-container" onClick={() => fileInputRef.current.click()} style={{ height: '150px' }}>
                            {preview ? (
                                <div className="preview-main">
                                    <img src={preview} alt="preview" style={{ objectFit: 'cover' }} />
                                    <div className="change-overlay"><Upload size={20} /> Thay đổi</div>
                                </div>
                            ) : (
                                <div className="upload-placeholder">
                                    <Upload size={30} />
                                    <span>Chọn ảnh cho banner</span>
                                </div>
                            )}
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tiêu đề</label>
                        <input type="text" name="title" value={formData.title} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Liên kết (Link)</label>
                        <input type="text" name="link" value={formData.link} onChange={handleChange} placeholder="/products/..." />
                    </div>

                    <div className="form-group">
                        <label>Thứ tự sắp xếp</label>
                        <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} />
                    </div>

                    <div className="form-checkboxes">
                        <label className="checkbox-item">
                            <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} />
                            <span>Hiển thị</span>
                        </label>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>Hủy</button>
                        <button type="submit" className="submit-btn" disabled={loading}>
                            {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu banner</>}
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xác nhận lưu"
                message="Bạn có chắc chắn muốn lưu thông tin banner này không?"
                onConfirm={handleSubmit}
                onCancel={() => setIsConfirmOpen(false)}
                type="info"
            />
        </div>
    );
};

export default BannerModal;
