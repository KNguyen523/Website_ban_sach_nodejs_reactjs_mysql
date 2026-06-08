import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    RefreshCw,
    FolderTree,
    Folder
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import CategoryModal from './CategoryModal';
import ConfirmModal from '../common/ConfirmModal';
import './ProductList.css'; // Reusing table styles

const CategoryList = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const res = await api.get('/categories');
            if (res.data.success) {
                setCategories(res.data.data);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const res = await api.delete(`/categories/${deleteId}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchCategories();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa danh mục');
        }
    };

    const handleEdit = (category) => {
        setSelectedCategory(category);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedCategory(null);
        setIsModalOpen(true);
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý danh mục</h1>
                    <p>Cấu trúc phân loại sách trong hệ thống.</p>
                </div>
                <div className="header-btns">
                    <button className="refresh-btn" onClick={fetchCategories} title="Làm mới">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="add-btn" onClick={handleAdd}>
                        <Plus size={20} />
                        Thêm danh mục
                    </button>
                </div>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm danh mục..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-wrapper glass">
                {loading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Danh mục</th>
                                <th>Danh mục cha</th>
                                <th>Thứ tự</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCategories.length > 0 ? filteredCategories.map((cat) => (
                                <tr key={cat.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className={`icon-box-small ${cat.parent_id ? 'child' : 'parent'}`} style={{ 
                                                width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: cat.parent_id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                                                borderRadius: '8px', color: cat.parent_id ? '#3b82f6' : '#8b5cf6'
                                            }}>
                                                {cat.parent_id ? <Folder size={20} /> : <FolderTree size={20} />}
                                            </div>
                                            <div className="product-info">
                                                <span className="product-title">{cat.name}</span>
                                                <span className="product-id">Slug: {cat.slug}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        {cat.parent_name ? (
                                            <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '12px', fontSize: '13px' }}>
                                                {cat.parent_name}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#64748b', fontSize: '13px' }}>Gốc</span>
                                        )}
                                    </td>
                                    <td>{cat.sort_order}</td>
                                    <td>
                                        <span className={`status-badge ${cat.is_active ? 'active' : 'error'}`}>
                                            {cat.is_active ? 'Hoạt động' : 'Tạm khóa'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn edit" title="Sửa" onClick={() => handleEdit(cat)}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" title="Xóa" onClick={() => handleDeleteClick(cat.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">Không tìm thấy danh mục nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <CategoryModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                category={selectedCategory}
                categories={categories}
                onSave={fetchCategories}
            />

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xóa danh mục"
                message="Bạn có chắc chắn muốn xóa danh mục này? Tất cả các sách thuộc danh mục này sẽ bị mất phân loại."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default CategoryList;
