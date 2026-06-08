import React, { useState, useEffect } from 'react';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import ConfirmModal from '../common/ConfirmModal';

const Wishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmId, setConfirmId] = useState(null);
    const { addToCart } = useCart();
    const { refreshWishlist } = useWishlist();

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            const res = await api.get('/wishlist');
            if (res.data.success) {
                setWishlist(res.data.data);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách yêu thích');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    const removeFromWishlist = async (id) => {
        try {
            const res = await api.delete(`/wishlist/${id}`);
            if (res.data.success) {
                toast.success('Đã xóa khỏi danh sách yêu thích');
                setWishlist(prev => prev.filter(item => item.id !== id));
                refreshWishlist();
            }
        } catch (error) {
            toast.error('Lỗi khi xóa sản phẩm');
        }
    };

    const handleAddToCart = async (product) => {
        await addToCart(product.id, 1);
    };

    if (loading) return <div className="py-20 text-center">Đang tải danh sách yêu thích...</div>;

    return (
        <div className="content-card glass">
            <div className="content-header flex justify-between items-center">
                <div>
                    <h2>Sách yêu thích</h2>
                    <p>Những cuốn sách bạn đã lưu để mua sau</p>
                </div>
                <div className="text-sm font-medium text-slate-500">
                    {wishlist.length} sản phẩm
                </div>
            </div>

            {wishlist.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                        <Heart size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Danh sách trống</h3>
                    <p className="text-slate-500 mb-8">Bạn chưa có sản phẩm nào trong danh sách yêu thích.</p>
                    <Link to="/products" className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">
                        Khám phá ngay <ArrowRight size={18} />
                    </Link>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlist.map(item => (
                        <div key={item.id} className="wishlist-card">
                            <div className="wishlist-image">
                                <img
                                    src={item.thumbnail ? `${getServerUrl()}${item.thumbnail}` : 'https://via.placeholder.com/200x300'}
                                    alt={item.title}
                                />
                            </div>
                            <div className="wishlist-body">
                                <Link to={`/product/${item.id}`} className="wishlist-title-link">
                                    <h3 className="wishlist-title">{item.title}</h3>
                                </Link>
                                <p className="wishlist-category">{item.category_name}</p>
                                <div className="wishlist-price-row">
                                    <span className="wishlist-price">
                                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price)}
                                    </span>
                                </div>
                                <div className="wishlist-actions">
                                    <button
                                        type="button"
                                        className="wishlist-cart-btn"
                                        onClick={() => handleAddToCart(item)}
                                    >
                                        <ShoppingCart size={16} />
                                        Thêm vào giỏ
                                    </button>
                                    <button
                                        type="button"
                                        className="wishlist-remove-btn"
                                        onClick={() => setConfirmId(item.id)}
                                        title="Xóa khỏi yêu thích"
                                    >
                                        <Trash2 size={16} />
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmModal
                isOpen={confirmId !== null}
                title="Xóa khỏi yêu thích"
                message="Bạn có chắc chắn muốn xóa sản phẩm này khỏi danh sách yêu thích?"
                onConfirm={() => removeFromWishlist(confirmId)}
                onCancel={() => setConfirmId(null)}
                type="danger"
            />
        </div>
    );
};

export default Wishlist;
