import React, { useState, useEffect, useRef } from 'react';
import { X, Upload, Save, Trash2, Image as ImageIcon, Plus } from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';
import './AdminLayout.css';

const ProductModal = ({ isOpen, onClose, product, onSave, isReadOnly = false }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        detail: '',
        price: 0,
        discount_percent: 0,
        stock_quantity: 0,
        page_count: '',
        publish_year: new Date().getFullYear(),
        isbn: '',
        language: 'Tiếng Việt',
        cover_type: 'Bìa mềm',
        category_id: '',
        publisher_id: '',
        author_ids: [],
        thumbnail: '',
        is_active: 1,
        is_featured: 0
    });

    // ... (rest of states)
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [galleryFiles, setGalleryFiles] = useState([]);
    const [previews, setPreviews] = useState({
        thumbnail: '',
        gallery: []
    });

    const [options, setOptions] = useState({
        categories: [],
        authors: [],
        publishers: []
    });

    const [loading, setLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [authorSearch, setAuthorSearch] = useState('');
    const thumbnailInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            fetchOptions();
            if (product) {
                setThumbnailFile(null);
                setGalleryFiles([]);
                setFormData({
                    ...product,
                    category_id: product.category_id || '',
                    publisher_id: product.publisher_id || '',
                    author_ids: product.authors ? product.authors.map(a => Number(a.id)) : []
                });
                setPreviews({
                    thumbnail: product.thumbnail ? (product.thumbnail.startsWith('http') ? product.thumbnail : `${getServerUrl()}${product.thumbnail}`) : '',
                    gallery: product.images ? product.images.map(img => ({
                        id: img.id,
                        url: img.image_url.startsWith('http') ? img.image_url : `${getServerUrl()}${img.image_url}`
                    })) : []
                });
            } else {
                resetForm();
            }
        }
    }, [isOpen, product]);

    const resetForm = () => {
        setFormData({
            title: '', description: '', detail: '', price: 0, discount_percent: 0,
            stock_quantity: 0, page_count: '', publish_year: new Date().getFullYear(),
            isbn: '', language: 'Tiếng Việt', cover_type: 'Bìa mềm', category_id: '',
            publisher_id: '', author_ids: [], thumbnail: '', is_active: 1, is_featured: 0
        });
        setThumbnailFile(null);
        setGalleryFiles([]);
        setPreviews({ thumbnail: '', gallery: [] });
    };

    const fetchOptions = async () => {
        try {
            const res = await api.get('/products/form-data');
            if (res.data.success) {
                setOptions(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu form:', error);
        }
    };

    const handleChange = (e) => {
        if (isReadOnly) return;
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? (checked ? 1 : 0) : value
        }));
    };

    const handleAuthorChange = (e) => {
        if (isReadOnly) return;
        const options = e.target.options;
        const selectedIds = [];
        for (let i = 0; i < options.length; i++) {
            if (options[i].selected) {
                selectedIds.push(parseInt(options[i].value));
            }
        }
        setFormData(prev => ({ ...prev, author_ids: selectedIds }));
    };

    const handleThumbnailChange = (e) => {
        if (isReadOnly) return;
        const file = e.target.files[0];
        if (file) {
            setThumbnailFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({ ...prev, thumbnail: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGalleryChange = (e) => {
        if (isReadOnly) return;
        const files = Array.from(e.target.files);

        files.forEach(file => {
            const clientId = `${Date.now()}-${file.name}-${Math.random().toString(36).slice(2)}`;
            setGalleryFiles(prev => [...prev, { clientId, file }]);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviews(prev => ({
                    ...prev,
                    gallery: [...prev.gallery, { isNew: true, clientId, url: reader.result }]
                }));
            };
            reader.readAsDataURL(file);
        });

        e.target.value = '';
    };

    const removeGalleryItem = (index, img) => {
        if (isReadOnly) return;
        setPreviews(prev => ({
            ...prev,
            gallery: prev.gallery.filter((_, i) => i !== index)
        }));

        if (img?.isNew && img.clientId) {
            setGalleryFiles(prev => prev.filter(item => item.clientId !== img.clientId));
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        if (isReadOnly) {
            onClose();
            return;
        }
        setLoading(true);

        const data = new FormData();
        Object.keys(formData).forEach(key => {
            if (key === 'author_ids') {
                data.append(key, JSON.stringify(formData[key]));
            } else if (key === 'isbn') {
                data.append(key, String(formData[key] || '').trim().replace(/[\s-]+/g, ''));
            } else if (key !== 'authors' && key !== 'images' && key !== 'thumbnail') {
                data.append(key, formData[key]);
            }
        });

        if (product) {
            const existingImageIds = previews.gallery
                .filter(img => !img.isNew && img.id)
                .map(img => img.id);
            data.append('existing_image_ids', JSON.stringify(existingImageIds));
        }

        if (thumbnailFile) {
            data.append('thumbnail', thumbnailFile);
        }
        
        galleryFiles.forEach(({ file }) => {
            data.append('images', file);
        });

        try {
            let res;
            if (product) {
                res = await api.put(`/products/${product.id}`, data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            } else {
                res = await api.post('/products', data, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
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
            <div className="modal-content glass admin-modal" style={{ width: '1000px' }}>
                <div className="modal-header">
                    <h2>{isReadOnly ? 'Chi tiết sách' : (product ? 'Chỉnh sửa sách' : 'Thêm sách mới')}</h2>
                    <button className="close-btn" onClick={onClose}><X size={24} /></button>
                </div>

                <form className="admin-form" onSubmit={(e) => { e.preventDefault(); if (!isReadOnly) setIsConfirmOpen(true); }}>
                    <div className="form-grid">
                        {/* Cột 1: Thông tin cơ bản */}
                        <div className="form-column">
                            <div className="form-group">
                                <label>Tiêu đề sách *</label>
                                <input type="text" name="title" value={formData.title} onChange={handleChange} required disabled={isReadOnly} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Giá bán (VNĐ) *</label>
                                    <input type="number" name="price" value={formData.price} onChange={handleChange} required disabled={isReadOnly} />
                                </div>
                                <div className="form-group">
                                    <label>Giảm giá (%)</label>
                                    <input type="number" name="discount_percent" value={formData.discount_percent} onChange={handleChange} disabled={isReadOnly} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tồn kho *</label>
                                    <input type="number" name="stock_quantity" value={formData.stock_quantity} onChange={handleChange} required disabled={isReadOnly} />
                                </div>
                                <div className="form-group">
                                    <label>Năm XB</label>
                                    <input type="number" name="publish_year" value={formData.publish_year} onChange={handleChange} disabled={isReadOnly} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                     <label>Mã sách (ISBN)</label>
                                     <input type="text" name="isbn" value={formData.isbn || ''} onChange={handleChange} disabled={isReadOnly} />
                                 </div>
                                 <div className="form-group">
                                     <label>Số trang</label>
                                     <input type="number" name="page_count" value={formData.page_count || ''} onChange={handleChange} disabled={isReadOnly} />
                                 </div>
                             </div>

                             <div className="form-row">
                                 <div className="form-group">
                                     <label>Ngôn ngữ</label>
                                     <input type="text" name="language" value={formData.language || 'Tiếng Việt'} onChange={handleChange} disabled={isReadOnly} />
                                 </div>
                                 <div className="form-group">
                                     <label>Loại bìa</label>
                                     <select name="cover_type" value={formData.cover_type || 'Bìa mềm'} onChange={handleChange} disabled={isReadOnly}>
                                         <option value="Bìa mềm">Bìa mềm</option>
                                         <option value="Bìa cứng">Bìa cứng</option>
                                     </select>
                                 </div>
                             </div>

                             <div className="form-row">
                                 <div className="form-group">
                                     <label>Trọng lượng (g)</label>
                                     <input type="number" name="weight" value={formData.weight || ''} onChange={handleChange} disabled={isReadOnly} />
                                 </div>
                                 <div className="form-group">
                                     <label>Kích thước (cm)</label>
                                     <input type="text" name="dimensions" value={formData.dimensions || ''} onChange={handleChange} placeholder="VD: 13 x 20.5 cm" disabled={isReadOnly} />
                                 </div>
                             </div>

                            <div className="form-group">
                                <label>Tác giả {isReadOnly ? '' : '(Giữ Ctrl để chọn nhiều) *'}</label>
                                <div className="select-search-wrapper">
                                    {!isReadOnly && (
                                        <input 
                                            type="text" 
                                            placeholder="Tìm tên tác giả..." 
                                            className="select-search-input"
                                            value={authorSearch}
                                            onChange={(e) => setAuthorSearch(e.target.value)}
                                        />
                                    )}
                                    <select 
                                        multiple name="author_ids" value={formData.author_ids} 
                                        onChange={handleAuthorChange} required style={{ height: '120px' }}
                                        disabled={isReadOnly}
                                    >
                                        {options.authors
                                            .filter(a => a.name.toLowerCase().includes(authorSearch.toLowerCase()))
                                            .map(author => (
                                                <option key={author.id} value={author.id}>{author.name}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>

                            <div className="form-checkboxes">
                                <label className="checkbox-item">
                                    <input type="checkbox" name="is_active" checked={formData.is_active === 1} onChange={handleChange} disabled={isReadOnly} />
                                    <span>Hiển thị trên web</span>
                                </label>
                                <label className="checkbox-item">
                                    <input type="checkbox" name="is_featured" checked={formData.is_featured === 1} onChange={handleChange} disabled={isReadOnly} />
                                    <span>Sách nổi bật</span>
                                </label>
                            </div>
                        </div>

                        {/* Cột 2: Ảnh & Chi tiết */}
                        <div className="form-column">
                            <div className="form-group">
                                <label>Ảnh bìa chính *</label>
                                <div className={`upload-container ${isReadOnly ? 'readonly' : ''}`} onClick={() => !isReadOnly && thumbnailInputRef.current.click()}>
                                    {previews.thumbnail ? (
                                        <div className="preview-main">
                                            <img src={previews.thumbnail} alt="thumbnail" />
                                            {!isReadOnly && <div className="change-overlay"><Upload size={20} /> Thay đổi</div>}
                                        </div>
                                    ) : (
                                        <div className="upload-placeholder">
                                            <Upload size={30} />
                                            <span>Chọn ảnh bìa</span>
                                        </div>
                                    )}
                                    <input 
                                        type="file" ref={thumbnailInputRef} hidden accept="image/*" 
                                        onChange={handleThumbnailChange} 
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Ảnh chi tiết (Gallery)</label>
                                <div className="gallery-upload-wrapper">
                                    <div className="gallery-previews">
                                        {previews.gallery.map((img, index) => (
                                            <div key={img.id || img.clientId || index} className="gallery-item">
                                                <img src={img.url} alt="gallery" />
                                                {!isReadOnly && (
                                                    <button type="button" className="remove-img" onClick={() => removeGalleryItem(index, img)}>
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        {!isReadOnly && (
                                            <button type="button" className="add-gallery-btn" onClick={() => galleryInputRef.current.click()}>
                                                <Plus size={20} />
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="file" ref={galleryInputRef} hidden multiple accept="image/*" 
                                        onChange={handleGalleryChange} 
                                    />
                                </div>
                            </div>

                             <div className="form-row">
                                 <div className="form-group">
                                     <label>Nhà xuất bản *</label>
                                     <select name="publisher_id" value={formData.publisher_id} onChange={handleChange} required disabled={isReadOnly}>
                                         <option value="">-- Chọn NXB --</option>
                                         {options.publishers.map(pub => <option key={pub.id} value={pub.id}>{pub.name}</option>)}
                                     </select>
                                 </div>
                                 <div className="form-group">
                                     <label>Danh mục *</label>
                                     <select name="category_id" value={formData.category_id} onChange={handleChange} required disabled={isReadOnly}>
                                         <option value="">-- Chọn danh mục --</option>
                                         {options.categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                     </select>
                                 </div>
                             </div>

                             <div className="form-group">
                                 <label>Mô tả ngắn</label>
                                 <textarea name="description" value={formData.description} onChange={handleChange} rows="2" disabled={isReadOnly}></textarea>
                             </div>

                             <div className="form-group">
                                 <label>Chi tiết nội dung</label>
                                 <textarea name="detail" value={formData.detail || ''} onChange={handleChange} rows="4" placeholder={isReadOnly ? '' : 'Nội dung chi tiết giới thiệu sách...'} disabled={isReadOnly}></textarea>
                             </div>
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button type="button" className="cancel-btn" onClick={onClose}>{isReadOnly ? 'Đóng' : 'Hủy'}</button>
                        {!isReadOnly && (
                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? 'Đang lưu...' : <><Save size={18} /> Lưu dữ liệu</>}
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xác nhận lưu"
                message="Bạn có chắc chắn muốn lưu các thay đổi này không?"
                onConfirm={handleSubmit}
                onCancel={() => setIsConfirmOpen(false)}
                type="info"
            />
        </div>
    );
};

export default ProductModal;
