import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';

const CategoryModal = ({ isOpen, onClose, category, categories, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        image: '',
        parent_id: '',
        sort_order: 0,
        is_active: 1
    });

    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setFormData({
                    ...category,
                    parent_id: category.parent_id || ''
                });
            } else {
                setFormData({
                    name: '',
                    description: '',
                    image: '',
                    parent_id: '',
                    sort_order: 0,
                    is_active: 1
                });
            }
        }
    }, [isOpen, category]);

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
            if (category) {
                res = await api.put(`/categories/${category.id}`, formData);
            } else {
                res = await api.post('/categories', formData);
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
                    <h2>{category ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form className="admin-form" onSubmit={(e) => { e.preventDefault(); setIsConfirmOpen(true); }}>
                    <div className="form-group">
                        <label>Tên danh mục *</label>
                        <input 
                            type="text" name="name" value={formData.name} 
                            onChange={handleChange} required placeholder="Vd: Văn học, Kinh tế..." 
                        />
                    </div>

                    <div className="form-group">
                        <label>Danh mục cha</label>
                        <select name="parent_id" value={formData.parent_id} onChange={handleChange}>
                            <option value="">-- Là danh mục gốc --</option>
                            {categories
                                .filter(c => !category || c.id !== category.id) // Không cho chọn chính nó làm cha
                                .map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))
                            }
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Thứ tự sắp xếp</label>
                        <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} />
                    </div>

                    <div className="form-group">
                        <label>Mô tả</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows="3"></textarea>
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
                                <><Save size={18} /> {category ? 'Lưu thay đổi' : 'Thêm mới'}</>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xác nhận lưu"
                message="Bạn có chắc chắn muốn lưu thông tin danh mục này không?"
                onConfirm={handleSubmit}
                onCancel={() => setIsConfirmOpen(false)}
                type="info"
            />
        </div>
    );
};

export default CategoryModal;
