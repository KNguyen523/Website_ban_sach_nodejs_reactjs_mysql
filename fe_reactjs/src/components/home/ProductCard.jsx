import React, { useState } from 'react';
import { Star, ShoppingCart, Heart, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import api, { getServerUrl } from '../../utils/api';
import { toast } from 'react-toastify';
import './ProductCard.css';

const ProductCard = ({ product, book }) => {
    const navigate = useNavigate();
    const { addToCart } = useCart();
    const { user } = useAuth();
    const { refreshWishlist } = useWishlist();
    const data = product || book;

    if (!data) return null;

    const toggleWishlist = async (e) => {
        e.stopPropagation();
        if (!user) {
            toast.error('Vui lòng đăng nhập để lưu vào yêu thích');
            return;
        }

        try {
            const res = await api.post('/wishlist', { book_id: data.id });
            if (res.data.success) {
                toast.success(res.data.message || 'Đã cập nhật danh sách yêu thích');
                refreshWishlist();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Thao tác thất bại');
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getFullImageUrl = (url) => {
        if (!url) return 'https://placehold.co/300x400?text=Book';
        if (url.startsWith('http')) return url;
        return `${getServerUrl()}${url}`;
    };

    const currentPrice = data.price * (1 - (data.discount_percent || 0) / 100);

    const handleNavigate = () => {
        navigate(`/product/${data.id}`);
    };

    return (
        <div className="product-card" onClick={handleNavigate}>
            <div className="product-image">
                <img src={getFullImageUrl(data.thumbnail || data.image)} alt={data.title} />
                {(data.discount_percent > 0) && (
                    <span className="discount-badge">-{data.discount_percent}%</span>
                )}
                
                <div className="product-actions">
                    <button title="Yêu thích" onClick={toggleWishlist}><Heart size={18} /></button>
                    <button title="Xem nhanh" onClick={(e) => { e.stopPropagation(); handleNavigate(); }}><Eye size={18} /></button>
                    <button title="Thêm vào giỏ" onClick={(e) => { e.stopPropagation(); addToCart(data.id, 1); }}><ShoppingCart size={18} /></button>
                </div>
            </div>
            
            <div className="product-info">
                <p className="product-author">{data.category_name || (data.authors && data.authors[0]?.name) || 'Đang cập nhật'}</p>
                <h3 className="product-title" title={data.title}>{data.title}</h3>
                <div className="product-rating">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={i < Math.floor(data.avg_rating || 5) ? 'filled' : ''} />
                    ))}
                    <span className="rating-text">({data.review_count || 0})</span>
                </div>
                <div className="product-price">
                    <span className="current-price">{formatPrice(currentPrice)}</span>
                    {(data.discount_percent > 0) && (
                        <span className="old-price">{formatPrice(data.price)}</span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
