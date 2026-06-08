import React, { useState, useEffect } from 'react';
import { Search, Trash2, RefreshCw, Star, CheckCircle, XCircle } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';
import './ProductList.css';

const ReviewList = () => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [statusReview, setStatusReview] = useState(null);



    const fetchReviews = async () => {
        setLoading(true);
        try {
            const res = await api.get('/reviews');
            if (res.data.success) {
                setReviews(res.data.data);
            }
        } catch (error) {
            toast.error('Lỗi khi tải đánh giá');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleStatusClick = (review) => {
        setStatusReview(review);
    };

    const handleConfirmStatus = async () => {
        if (!statusReview) return;

        const review = statusReview;
        try {
            const res = await api.put(`/reviews/${review.id}/status`, { 
                is_approved: review.is_approved ? 0 : 1 
            });
            if (res.data.success) {
                toast.success('Đã cập nhật trạng thái');
                fetchReviews();
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật');
        }
    };

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/reviews/${deleteId}`);
            toast.success('Đã xóa đánh giá');
            fetchReviews();
        } catch (error) {
            toast.error('Lỗi khi xóa');
        }
    };

    const renderStars = (rating) => {
        return [...Array(5)].map((_, i) => (
            <Star key={i} size={12} fill={i < rating ? "#f59e0b" : "transparent"} color={i < rating ? "#f59e0b" : "#94a3b8"} />
        ));
    };

    const filteredReviews = (reviews || []).filter(r => 
        (r.book_title && r.book_title.toLowerCase().includes(searchTerm.toLowerCase())) || 
        (r.comment && r.comment.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.user_name && r.user_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý Đánh giá</h1>
                    <p>Kiểm duyệt phản hồi từ khách hàng về sản phẩm.</p>
                </div>
                <button className="refresh-btn" onClick={fetchReviews}><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Tìm theo tên sách, người dùng hoặc nội dung..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="table-wrapper glass">
                {loading ? <div className="loading-state">Đang tải...</div> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Khách hàng</th>
                                <th>Sách</th>
                                <th>Đánh giá</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredReviews.map(review => (
                                <tr key={review.id}>
                                    <td><span className="product-title" style={{ fontSize: '13px' }}>{review.user_name || 'Người dùng ẩn'}</span></td>
                                    <td><span className="product-title" style={{ fontSize: '13px', color: '#3b82f6' }}>{review.book_title || 'Sản phẩm đã bị xóa'}</span></td>
                                    <td style={{ maxWidth: '350px' }}>
                                        <div style={{ display: 'flex', gap: '2px', marginBottom: '4px' }}>{renderStars(review.rating)}</div>
                                        <p style={{ fontSize: '13px', color: '#cbd5e1' }}>{review.comment}</p>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${review.is_approved ? 'active' : 'warning'}`}>
                                            {review.is_approved ? 'Công khai' : 'Đang ẩn'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button 
                                                className={`action-btn ${review.is_approved ? 'edit' : 'view'}`} 
                                                title={review.is_approved ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                                                onClick={() => handleStatusClick(review)}
                                            >
                                                {review.is_approved ? <XCircle size={16} /> : <CheckCircle size={16} />}
                                            </button>
                                            <button className="action-btn delete" onClick={() => handleDeleteClick(review.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xóa đánh giá"
                message="Bạn có chắc chắn muốn xóa đánh giá này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setDeleteId(null);
                }}
                type="danger"
            />

            <ConfirmModal
                isOpen={statusReview !== null}
                title={statusReview?.is_approved ? 'Ẩn đánh giá' : 'Hiện đánh giá'}
                message={
                    statusReview?.is_approved
                        ? 'Bạn có chắc chắn muốn ẩn đánh giá này khỏi trang sản phẩm không?'
                        : 'Bạn có chắc chắn muốn công khai đánh giá này trên trang sản phẩm không?'
                }
                onConfirm={handleConfirmStatus}
                onCancel={() => setStatusReview(null)}
                type={statusReview?.is_approved ? 'warning' : 'info'}
            />
        </div>
    );
};

export default ReviewList;
