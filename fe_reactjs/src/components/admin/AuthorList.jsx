import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, RefreshCw, UserCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import AuthorModal from './AuthorModal';
import ConfirmModal from '../common/ConfirmModal';
import './ProductList.css';

const AuthorList = () => {
    const [authors, setAuthors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isIdModalOpen, setIsModalOpen] = useState(false);
    const [selectedAuthor, setSelectedAuthor] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetchAuthors = async () => {
        setLoading(true);
        try {
            const res = await api.get('/authors');
            if (res.data.success) {
                setAuthors(res.data.data);
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách tác giả');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAuthors();
    }, []);

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const res = await api.delete(`/authors/${deleteId}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchAuthors();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa');
        }
    };

    const filteredAuthors = authors.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý Tác giả</h1>
                    <p>Danh sách các tác giả có sách trong hệ thống.</p>
                </div>
                <div className="header-btns">
                    <button className="refresh-btn" onClick={fetchAuthors}><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                    <button className="add-btn" onClick={() => { setSelectedAuthor(null); setIsModalOpen(true); }}><Plus size={20} /> Thêm Tác giả</button>
                </div>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Tìm tên tác giả..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="table-wrapper glass">
                {loading ? <div className="loading-state">Đang tải...</div> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Tác giả</th>
                                <th>Tiểu sử</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredAuthors.map(author => (
                                <tr key={author.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className="avatar-square"><UserCircle size={20} /></div>
                                            <span className="product-title">{author.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '400px' }}><p className="line-clamp-2">{author.biography || '-'}</p></td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn edit" onClick={() => { setSelectedAuthor(author); setIsModalOpen(true); }}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" onClick={() => handleDeleteClick(author.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <AuthorModal isOpen={isIdModalOpen} onClose={() => setIsModalOpen(false)} author={selectedAuthor} onSave={fetchAuthors} />
            
            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xóa tác giả"
                message="Bạn có chắc chắn muốn xóa tác giả này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default AuthorList;
