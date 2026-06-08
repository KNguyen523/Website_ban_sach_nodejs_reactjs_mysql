import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Edit2, 
    Trash2, 
    RefreshCw,
    ExternalLink,
    Image as ImageIcon
} from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';
import { toast } from 'react-toastify';
import BannerModal from './BannerModal';
import ConfirmModal from '../common/ConfirmModal';
import './ProductList.css'; 

const BannerList = () => {
    const [banners, setBanners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isIdModalOpen, setIsModalOpen] = useState(false);
    const [selectedBanner, setSelectedBanner] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);



    const fetchBanners = async () => {
        setLoading(true);
        try {
            const res = await api.get('/banners');
            if (res.data.success) {
                setBanners(res.data.data);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách banner');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/banners/${deleteId}`);
            toast.success('Đã xóa banner');
            fetchBanners();
        } catch (error) {
            toast.error('Lỗi khi xóa');
        }
    };

    const handleEdit = (banner) => {
        setSelectedBanner(banner);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedBanner(null);
        setIsModalOpen(true);
    };

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý Banner</h1>
                    <p>Cập nhật hình ảnh quảng cáo trên trang chủ.</p>
                </div>
                <div className="header-btns">
                    <button className="refresh-btn" onClick={fetchBanners}>
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="add-btn" onClick={handleAdd}>
                        <Plus size={20} /> Thêm Banner
                    </button>
                </div>
            </div>

            <div className="table-wrapper glass mt-6">
                {loading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Banner</th>
                                <th>Thứ tự</th>
                                <th>Link</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {banners.length > 0 ? banners.map((banner) => (
                                <tr key={banner.id}>
                                    <td style={{ minWidth: '300px' }}>
                                        <div className="product-cell">
                                            <div className="banner-preview-cell" style={{ 
                                                width: '120px', height: '60px', borderRadius: '8px', 
                                                overflow: 'hidden', background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                <img 
                                                    src={banner.image_url.startsWith('http') ? banner.image_url : `${getServerUrl()}${banner.image_url}`} 
                                                    alt="banner" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div className="product-info">
                                                <span className="product-title">{banner.title || 'Không có tiêu đề'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{banner.sort_order}</td>
                                    <td>
                                        {banner.link ? (
                                            <a href={banner.link} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                                Xem link <ExternalLink size={12} />
                                            </a>
                                        ) : '-'}
                                    </td>
                                    <td>
                                        <span className={`status-badge ${banner.is_active ? 'active' : 'warning'}`}>
                                            {banner.is_active ? 'Đang hiện' : 'Đang ẩn'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn edit" onClick={() => handleEdit(banner)}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" onClick={() => handleDeleteClick(banner.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-8">Chưa có banner nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <BannerModal 
                isOpen={isIdModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                banner={selectedBanner}
                onSave={fetchBanners}
            />

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xóa Banner"
                message="Bạn có chắc chắn muốn xóa banner này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default BannerList;
