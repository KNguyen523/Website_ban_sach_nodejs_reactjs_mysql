import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api, { getServerUrl } from '../utils/api';
import { 
  ShoppingCart, Heart, Share2, Star, Plus, Minus, 
  ChevronRight, Calendar, BookOpen, Globe, PenTool, Hash,
  AlertCircle
} from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ProductCard from '../components/home/ProductCard';
import './ProductDetailPage.css';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { toast } from 'react-toastify';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { refreshWishlist } = useWishlist();
  const reviewSectionRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [activeImg, setActiveImg] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewEligibility, setReviewEligibility] = useState({ eligible: false, alreadyReviewed: false, message: '' });

  useEffect(() => {
    fetchProductData();
    if (user) {
      checkFavorite();
      checkReviewEligibility();
    } else {
      setReviewEligibility({ eligible: false, alreadyReviewed: false, message: '' });
    }
  }, [id, user]);

  useEffect(() => {
    if (!loading && searchParams.get('review') === '1' && reviewSectionRef.current) {
      reviewSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, searchParams]);

  const checkReviewEligibility = async () => {
    try {
      const res = await api.get(`/reviews/check-eligibility/${id}`);
      if (res.data.success) {
        setReviewEligibility({
          eligible: res.data.eligible,
          alreadyReviewed: res.data.alreadyReviewed || false,
          message: res.data.message || ''
        });
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const [prodRes, relRes, revRes] = await Promise.all([
        api.get(`/public/products/${id}`),
        api.get(`/public/products/${id}/related`),
        api.get(`/public/products/${id}/reviews`)
      ]);

      if (prodRes.data.success) {
        setProduct(prodRes.data.data);
        setActiveImg(prodRes.data.data.thumbnail);
        setRelated(relRes.data.data);
        setReviews(revRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast.error('Không thể tải thông tin sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const res = await api.get(`/wishlist/check/${id}`);
      setIsFavorite(res.data.isFavorite);
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để lưu vào yêu thích');
      return;
    }

    try {
      if (isFavorite) {
        await api.delete(`/wishlist/${id}`);
        setIsFavorite(false);
        toast.success('Đã xóa khỏi danh sách yêu thích');
      } else {
        await api.post('/wishlist', { book_id: id });
        setIsFavorite(true);
        toast.success('Đã thêm vào danh sách yêu thích');
      }
      refreshWishlist();
    } catch (error) {
      toast.error('Thao tác thất bại');
    }
  };

  const handleAddToCart = async () => {
    await addToCart(id, quantity);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('Vui lòng đăng nhập để đánh giá');
      return;
    }

    try {
      await api.post('/reviews', {
        book_id: id,
        rating: reviewForm.rating,
        comment: reviewForm.comment
      });
      toast.success('Đánh giá của bạn đã được gửi');
      setReviewForm({ rating: 5, comment: '' });
      fetchProductData(); // Refresh reviews
      checkReviewEligibility(); // Refresh eligibility
    } catch (error) {
      toast.error(error.response?.data?.message || 'Không thể gửi đánh giá');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500"></div>
    </div>
  );

  if (!product) return <div className="text-center py-20">Không tìm thấy sản phẩm</div>;

  const discountedPrice = product.price * (1 - product.discount_percent / 100);

  return (
    <div className="bg-gray-50 min-h-screen">
      <Header />
      
      <main className="product-detail-page">
        <div className="container">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <span className="cursor-pointer hover:text-emerald-500" onClick={() => navigate('/')}>Trang chủ</span>
            <ChevronRight size={14} />
            <span className="cursor-pointer hover:text-emerald-500" onClick={() => navigate(`/products?category_id=${product.category_id}`)}>{product.category_name}</span>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium truncate max-w-xs">{product.title}</span>
          </div>

          <div className="product-detail-container">
            <div className="product-main-info">
              {/* Image Gallery */}
              <div className="product-gallery">
                <img src={`${getServerUrl()}${activeImg}`} alt={product.title} className="main-image" />
                <div className="thumbnail-list">
                  <div 
                    className={`thumbnail-item ${activeImg === product.thumbnail ? 'active' : ''}`}
                    onClick={() => setActiveImg(product.thumbnail)}
                  >
                    <img src={`${getServerUrl()}${product.thumbnail}`} alt="Main" />
                  </div>
                  {product.images?.map((img) => (
                    <div 
                      key={img.id}
                      className={`thumbnail-item ${activeImg === img.image_url ? 'active' : ''}`}
                      onClick={() => setActiveImg(img.image_url)}
                    >
                      <img src={`${getServerUrl()}${img.image_url}`} alt="Gallery" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Product Info */}
              <div className="product-info-right">
                <div className="flex justify-between items-start">
                  <h1 className="product-title">{product.title}</h1>
                  <div className="flex gap-2">
                    <button className="wishlist-btn"><Share2 size={20} /></button>
                    <button 
                      className={`wishlist-btn ${isFavorite ? 'active' : ''}`}
                      onClick={toggleFavorite}
                    >
                      <Heart size={20} fill={isFavorite ? "#ff7675" : "none"} />
                    </button>
                  </div>
                </div>

                <div className="product-meta">
                  <div className="rating-summary">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={16} fill={s <= product.avg_rating ? "#f1c40f" : "none"} color={s <= product.avg_rating ? "#f1c40f" : "#b2bec3"} />
                      ))}
                    </div>
                    <span className="rating-count">({product.review_count || 0} đánh giá)</span>
                  </div>
                  <div className="text-gray-300">|</div>
                  <div>Đã bán: <span className="font-bold text-gray-800">{product.sold_count || 0}</span></div>
                </div>

                <div className="product-price-section">
                  <div className="flex items-center">
                    <span className="current-price">{formatPrice(discountedPrice)}</span>
                    {product.discount_percent > 0 && (
                      <>
                        <span className="original-price">{formatPrice(product.price)}</span>
                        <span className="discount-badge-detail">-{product.discount_percent}%</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-600 leading-relaxed line-clamp-3">{product.description}</p>
                </div>

                <div className={`stock-status ${product.stock_quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                  {product.stock_quantity > 0 ? `Còn hàng (Kho: ${product.stock_quantity})` : 'Hết hàng'}
                </div>

                <div className="quantity-selector">
                  <span className="font-bold text-gray-700">Số lượng:</span>
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                    <button 
                      className="qty-btn hover:bg-gray-100" 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    >
                      <Minus size={16} />
                    </button>
                    <input 
                      type="number" 
                      className="qty-input border-none" 
                      value={quantity} 
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    />
                    <button 
                      className="qty-btn hover:bg-gray-100"
                      onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>

                <div className="action-buttons">
                  <button 
                    className="add-to-cart-btn" 
                    onClick={handleAddToCart}
                    disabled={product.stock_quantity === 0}
                  >
                    <ShoppingCart size={22} />
                    THÊM VÀO GIỎ HÀNG
                  </button>
                </div>
              </div>
            </div>

            {/* Detailed Tabs */}
            <div className="detail-tabs">
              <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-emerald-50">
                <h3 className="section-title text-emerald-600 border-emerald-500">Thông tin chi tiết</h3>
                <div className="specs-grid">
                  <div className="spec-item">
                    <span className="spec-label">Nhà cung cấp</span>
                    <span className="spec-value">{product.publisher_name}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Tác giả</span>
                    <span className="spec-value">{product.authors?.map(a => a.name).join(', ')}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Năm xuất bản</span>
                    <span className="spec-value">{product.publish_year}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Danh mục</span>
                    <span className="spec-value">{product.category_name}</span>
                  </div>
                  {product.isbn && (
                    <div className="spec-item">
                      <span className="spec-label">Mã sách (ISBN)</span>
                      <span className="spec-value">{product.isbn}</span>
                    </div>
                  )}
                  {product.page_count && (
                    <div className="spec-item">
                      <span className="spec-label">Số trang</span>
                      <span className="spec-value">{product.page_count}</span>
                    </div>
                  )}
                  <div className="spec-item">
                    <span className="spec-label">Ngôn ngữ</span>
                    <span className="spec-value">{product.language || 'Tiếng Việt'}</span>
                  </div>
                  <div className="spec-item">
                    <span className="spec-label">Loại bìa</span>
                    <span className="spec-value">{product.cover_type || 'Bìa mềm'}</span>
                  </div>
                  {product.weight && (
                    <div className="spec-item">
                      <span className="spec-label">Trọng lượng (g)</span>
                      <span className="spec-value">{product.weight}</span>
                    </div>
                  )}
                  {product.dimensions && (
                    <div className="spec-item">
                      <span className="spec-label">Kích thước</span>
                      <span className="spec-value">{product.dimensions}</span>
                    </div>
                  )}
                </div>
              </section>

              <section className="mb-10 bg-white p-8 rounded-2xl shadow-sm border border-emerald-50">
                <h3 className="section-title text-emerald-600 border-emerald-500">Mô tả sản phẩm</h3>
                <div className="description-content">
                  <p className="mb-6 font-medium text-gray-800">{product.description}</p>
                  {product.detail && (
                    <div className="detail-content pt-4 border-t border-gray-100 mt-4 leading-relaxed text-gray-700">
                      <div dangerouslySetInnerHTML={{ __html: product.detail }} />
                    </div>
                  )}
                </div>
              </section>

              {/* Reviews Section */}
              <section className="reviews-container" ref={reviewSectionRef}>
                <h3 className="section-title">Khách hàng đánh giá</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  {/* Review Stats */}
                  <div className="lg:col-span-1 bg-gray-50 p-6 rounded-xl text-center">
                    <h4 className="text-5xl font-extrabold text-emerald-500 mb-2">{product.avg_rating ? parseFloat(product.avg_rating).toFixed(1) : '0.0'}</h4>
                    <div className="flex justify-center gap-1 mb-2">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} size={20} fill={s <= product.avg_rating ? "#f1c40f" : "none"} color={s <= product.avg_rating ? "#f1c40f" : "#b2bec3"} />
                      ))}
                    </div>
                    <p className="text-gray-500">({product.review_count || 0} đánh giá)</p>
                  </div>

                  {/* Review List & Form */}
                  <div className="lg:col-span-2">
                    {user && (
                      <div className="review-eligibility-wrapper mb-8">
                        {reviewEligibility.eligible ? (
                          <form onSubmit={submitReview} className="review-form">
                            <div className="review-form-header">
                              <h4 className="review-form-title">Viết đánh giá của bạn</h4>
                              <p className="review-form-subtitle">Chia sẻ cảm nhận để giúp bạn đọc khác chọn sách phù hợp</p>
                            </div>

                            <div className="review-form-rating">
                              <span className="review-form-label">Đánh giá của bạn</span>
                              <div className="review-stars-input">
                                {[1, 2, 3, 4, 5].map(s => (
                                  <button
                                    type="button"
                                    key={s}
                                    className={`review-star ${s <= reviewForm.rating ? 'active' : ''}`}
                                    onClick={() => setReviewForm({...reviewForm, rating: s})}
                                    aria-label={`${s} sao`}
                                  >
                                    <Star
                                      size={26}
                                      fill={s <= reviewForm.rating ? "#f59e0b" : "none"}
                                      color={s <= reviewForm.rating ? "#f59e0b" : "#cbd5e1"}
                                    />
                                  </button>
                                ))}
                                <span className="review-rating-text">
                                  {['', 'Tệ', 'Tạm được', 'Bình thường', 'Tốt', 'Tuyệt vời'][reviewForm.rating]}
                                </span>
                              </div>
                            </div>

                            <div className="review-form-field">
                              <span className="review-form-label">Nhận xét</span>
                              <textarea
                                className="review-textarea"
                                placeholder="Chia sẻ nhận xét của bạn về sách này..."
                                value={reviewForm.comment}
                                onChange={(e) => setReviewForm({...reviewForm, comment: e.target.value})}
                                required
                              ></textarea>
                            </div>

                            <button type="submit" className="review-submit-btn">
                              Gửi đánh giá
                            </button>
                          </form>
                        ) : (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800">
                            <AlertCircle className="mx-auto text-amber-500 mb-3" size={32} />
                            <h4 className="font-bold mb-1">
                              {reviewEligibility.alreadyReviewed 
                                ? 'Bạn đã đánh giá sản phẩm này' 
                                : 'Chưa thể đánh giá sản phẩm'}
                            </h4>
                            <p className="text-sm text-amber-700">
                              {reviewEligibility.alreadyReviewed 
                                ? 'Cảm ơn bạn đã viết đánh giá cho sản phẩm này.' 
                                : 'Bạn chỉ có thể đánh giá sản phẩm sau khi đơn hàng chứa sản phẩm này được giao thành công.'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="review-list">
                      {reviews.length > 0 ? reviews.map(rev => (
                        <div key={rev.id} className="review-item">
                          <div className="review-header">
                            <div className="review-user">
                              <div className="review-avatar">
                                {(rev.user_name || 'Người dùng ẩn').charAt(0).toUpperCase()}
                              </div>
                              <span>{rev.user_name || 'Người dùng ẩn'}</span>
                            </div>
                            <span className="review-date">{new Date(rev.created_at).toLocaleDateString('vi-VN')}</span>
                          </div>
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={14} fill={s <= rev.rating ? "#f1c40f" : "none"} color={s <= rev.rating ? "#f1c40f" : "#b2bec3"} />
                            ))}
                          </div>
                          <p className="text-gray-600">{rev.comment}</p>
                        </div>
                      )) : (
                        <p className="text-gray-500 italic">Chưa có đánh giá nào cho sản phẩm này.</p>
                      )}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <section className="related-section">
              <div className="related-header">
                <div className="related-title-wrap">
                  <span className="related-eyebrow">Gợi ý cho bạn</span>
                  <h2 className="related-title">Sản phẩm liên quan</h2>
                  <span className="related-underline"></span>
                </div>
                <button
                  type="button"
                  className="related-viewall"
                  onClick={() => navigate('/products')}
                >
                  Xem tất cả <ChevronRight size={16} />
                </button>
              </div>
              <div className="related-grid">
                {related.map(item => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetailPage;
