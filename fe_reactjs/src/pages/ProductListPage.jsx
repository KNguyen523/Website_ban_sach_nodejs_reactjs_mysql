import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { Filter, ChevronLeft, ChevronRight, Star, SearchX, RotateCcw } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import ProductCard from '../components/home/ProductCard';
import './ProductListPage.css';

const ProductListPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);

  // States
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [publishers, setPublishers] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [showFilters, setShowFilters] = useState(false);

  // Filter States (from URL)
  const filters = {
    search: queryParams.get('search') || '',
    category_id: queryParams.get('category_id') || '',
    publisher_id: queryParams.get('publisher_id') || '',
    author_id: queryParams.get('author_id') || '',
    minPrice: queryParams.get('minPrice') || '',
    maxPrice: queryParams.get('maxPrice') || '',
    minRating: queryParams.get('minRating') || '',
    sort: queryParams.get('sort') || 'newest',
    page: queryParams.get('page') || 1
  };

  const [priceRange, setPriceRange] = useState({
    min: filters.minPrice,
    max: filters.maxPrice
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    fetchProducts();
    window.scrollTo(0, 0);
  }, [location.search]);

  const fetchInitialData = async () => {
    try {
      const [filtersRes, catsRes] = await Promise.all([
        api.get('/public/products/filters'),
        api.get('/public/categories')
      ]);
      if (filtersRes.data.success) {
        setPublishers(filtersRes.data.data.publishers);
        setAuthors(filtersRes.data.data.authors);
      }
      if (catsRes.data.success) {
        // Only active categories, keep parent_id + sort_order for tree
        const cats = (catsRes.data.data || [])
          .filter(c => c.is_active === 1 || c.is_active === true || c.is_active === undefined)
          .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/public/products', {
        params: { ...filters, limit: 12 }
      });
      if (response.data.success) {
        setProducts(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateFilters = (newFilters) => {
    const updated = new URLSearchParams(location.search);
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) {
        updated.set(key, newFilters[key]);
      } else {
        updated.delete(key);
      }
    });
    // Reset to page 1 on filter change
    if (!newFilters.page) updated.set('page', 1);
    navigate(`/products?${updated.toString()}`);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    updateFilters({ minPrice: priceRange.min, maxPrice: priceRange.max });
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={14} 
            fill={star <= rating ? "#f1c40f" : "none"} 
            color={star <= rating ? "#f1c40f" : "#b2bec3"} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="product-list-page-wrapper">
      <Header />
      
      <main className="product-list-page">
        <div className="container">
          <div className="product-list-container">
            
            {/* Sidebar Filters */}
            <aside className={`filters-sidebar ${showFilters ? 'show' : ''}`}>
              <div className="filter-section">
                <h3 className="filter-title">Danh mục</h3>
                <div className="filter-list">
                  <div
                    className={`filter-item ${!filters.category_id ? 'active' : ''}`}
                    onClick={() => updateFilters({ category_id: '' })}
                  >
                    Tất cả danh mục
                  </div>
                  {(() => {
                    const byParent = categories.reduce((acc, cat) => {
                      const key = cat.parent_id || 'root';
                      (acc[key] = acc[key] || []).push(cat);
                      return acc;
                    }, {});
                    const renderTree = (parentKey, level) => {
                      const list = byParent[parentKey] || [];
                      return list.map(cat => (
                        <React.Fragment key={cat.id}>
                          <div
                            className={`filter-item filter-item-level-${level} ${filters.category_id == cat.id ? 'active' : ''}`}
                            style={{ paddingLeft: `${12 + level * 16}px` }}
                            onClick={() => updateFilters({ category_id: cat.id })}
                          >
                            {level > 0 && <span className="filter-item-bullet">└</span>}
                            {cat.name}
                          </div>
                          {renderTree(cat.id, level + 1)}
                        </React.Fragment>
                      ));
                    };
                    return renderTree('root', 0);
                  })()}
                </div>
              </div>

              <div className="filter-section">
                <h3 className="filter-title">Khoảng giá</h3>
                <form onSubmit={handlePriceApply}>
                  <div className="price-inputs">
                    <input 
                      type="number" 
                      placeholder="Từ" 
                      value={priceRange.min}
                      onChange={(e) => setPriceRange({...priceRange, min: e.target.value})}
                    />
                    <span className="price-divider">-</span>
                    <input 
                      type="number" 
                      placeholder="Đến" 
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({...priceRange, max: e.target.value})}
                    />
                  </div>
                  <button type="submit" className="apply-price-btn">Áp dụng</button>
                </form>
              </div>

              <div className="filter-section">
                <h3 className="filter-title">Nhà xuất bản</h3>
                <div className="filter-list">
                  <select
                    value={filters.publisher_id}
                    onChange={(e) => updateFilters({ publisher_id: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">Tất cả NXB</option>
                    {publishers.map(pub => (
                      <option key={pub.id} value={pub.id}>{pub.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-section">
                <h3 className="filter-title">Tác giả</h3>
                <div className="filter-list">
                  <select
                    value={filters.author_id}
                    onChange={(e) => updateFilters({ author_id: e.target.value })}
                    className="filter-select"
                  >
                    <option value="">Tất cả tác giả</option>
                    {authors.map(auth => (
                      <option key={auth.id} value={auth.id}>{auth.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="filter-section">
                <h3 className="filter-title">Đánh giá</h3>
                <div className="filter-list">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div 
                      key={rating}
                      className={`filter-item ${filters.minRating == rating ? 'active' : ''}`}
                      onClick={() => updateFilters({ minRating: rating })}
                    >
                      {renderStars(rating)}
                      <span className="text-sm">từ {rating} sao</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <section className="products-main">
              <button className="filter-toggle" onClick={() => setShowFilters(!showFilters)}>
                <Filter size={20} /> {showFilters ? 'Ẩn bộ lọc' : 'Hiện bộ lọc'}
              </button>

              <div className="list-header">
                <div className="results-count">
                  {filters.search && <p className="mb-1">Kết quả cho: <strong>"{filters.search}"</strong></p>}
                  Hiển thị <span>{products.length}</span> trên <span>{pagination.total}</span> sản phẩm
                </div>
                <div className="sort-select">
                  <select value={filters.sort} onChange={(e) => updateFilters({ sort: e.target.value })}>
                    <option value="newest">Mới nhất</option>
                    <option value="sold">Bán chạy nhất</option>
                    <option value="price_asc">Giá: Thấp đến Cao</option>
                    <option value="price_desc">Giá: Cao đến Thấp</option>
                    <option value="rating">Đánh giá cao nhất</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                </div>
              ) : products.length > 0 ? (
                <>
                  <div className="products-grid">
                    {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        className="page-btn" 
                        disabled={pagination.page === 1}
                        onClick={() => updateFilters({ page: pagination.page - 1 })}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      
                      {[...Array(pagination.totalPages)].map((_, i) => (
                        <button 
                          key={i + 1}
                          className={`page-btn ${pagination.page === i + 1 ? 'active' : ''}`}
                          onClick={() => updateFilters({ page: i + 1 })}
                        >
                          {i + 1}
                        </button>
                      ))}

                      <button 
                        className="page-btn" 
                        disabled={pagination.page === pagination.totalPages}
                        onClick={() => updateFilters({ page: pagination.page + 1 })}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-products-state">
                  <div className="empty-icon-wrap">
                    <SearchX size={56} />
                  </div>
                  <h3 className="empty-title">Không tìm thấy sản phẩm nào</h3>
                  <p className="empty-desc">Vui lòng thử lại với bộ lọc khác hoặc xóa các tiêu chí đang áp dụng.</p>
                  <button
                    className="btn-clear-filters"
                    onClick={() => navigate('/products')}
                  >
                    <RotateCcw size={18} />
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductListPage;
