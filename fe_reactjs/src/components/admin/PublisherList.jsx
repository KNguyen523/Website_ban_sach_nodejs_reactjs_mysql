import React, { useEffect, useState } from 'react';
import { Building2, Edit2, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import PublisherModal from './PublisherModal';
import ConfirmModal from '../common/ConfirmModal';
import './ProductList.css';

const PublisherList = () => {
    const [publishers, setPublishers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPublisher, setSelectedPublisher] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetchPublishers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/publishers');
            if (res.data.success) {
                setPublishers(res.data.data);
            }
        } catch {
            toast.error('Không thể tải danh sách nhà xuất bản');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPublishers();
    }, []);

    const handleAdd = () => {
        setSelectedPublisher(null);
        setIsModalOpen(true);
    };

    const handleEdit = (publisher) => {
        setSelectedPublisher(publisher);
        setIsModalOpen(true);
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const res = await api.delete(`/publishers/${deleteId}`);
            if (res.data.success) {
                toast.success(res.data.message);
                fetchPublishers();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi xóa nhà xuất bản');
        } finally {
            setIsConfirmOpen(false);
            setDeleteId(null);
        }
    };

    const filteredPublishers = publishers.filter(publisher => {
        const keyword = searchTerm.toLowerCase();
        return (
            publisher.name?.toLowerCase().includes(keyword) ||
            publisher.slug?.toLowerCase().includes(keyword)
        );
    });

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý nhà xuất bản</h1>
                    <p>Danh sách nhà xuất bản được gán cho sách trong hệ thống.</p>
                </div>
                <div className="header-btns">
                    <button className="refresh-btn" onClick={fetchPublishers} title="Làm mới">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="add-btn" onClick={handleAdd}>
                        <Plus size={20} />
                        Thêm nhà xuất bản
                    </button>
                </div>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Tìm tên hoặc slug nhà xuất bản..."
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
                                <th>Nhà xuất bản</th>
                                <th>Mô tả</th>
                                <th>Số sách</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPublishers.length > 0 ? filteredPublishers.map((publisher) => (
                                <tr key={publisher.id}>
                                    <td>
                                        <div className="product-cell">
                                            {publisher.logo ? (
                                                <div className="product-img" style={{ width: '48px', height: '48px' }}>
                                                    <img src={publisher.logo} alt={publisher.name} />
                                                </div>
                                            ) : (
                                                <div className="avatar-square"><Building2 size={20} /></div>
                                            )}
                                            <div className="product-info">
                                                <span className="product-title">{publisher.name}</span>
                                                <span className="product-id">Slug: {publisher.slug}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td style={{ maxWidth: '420px' }}>
                                        <p className="line-clamp-2">{publisher.description || '-'}</p>
                                    </td>
                                    <td>{publisher.book_count || 0}</td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn edit" title="Sửa" onClick={() => handleEdit(publisher)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="action-btn delete" title="Xóa" onClick={() => handleDeleteClick(publisher.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="text-center py-8">Không tìm thấy nhà xuất bản nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <PublisherModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                publisher={selectedPublisher}
                onSave={fetchPublishers}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Xóa nhà xuất bản"
                message="Bạn có chắc chắn muốn xóa nhà xuất bản này không? Nhà xuất bản đang có sách liên kết sẽ không thể xóa."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default PublisherList;
