import React, { useState, useCallback, useEffect } from 'react';
import {
    Plus,
    Search,
    Filter,
    Edit2,
    Trash2,
    Eye,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';
import { toast } from 'react-toastify';
import ProductModal from './ProductModal';
import ConfirmModal from '../common/ConfirmModal';
import './ProductList.css';

const PRODUCTS_PER_PAGE = 12;

const ProductList = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: PRODUCTS_PER_PAGE,
        totalPages: 1
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [isReadOnly, setIsReadOnly] = useState(false);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/products', {
                params: {
                    page,
                    limit: PRODUCTS_PER_PAGE,
                    search: searchTerm.trim() || undefined
                }
            });

            if (res.data.success) {
                setProducts(res.data.data);
                setPagination(res.data.pagination || {
                    total: res.data.data.length,
                    page,
                    limit: PRODUCTS_PER_PAGE,
                    totalPages: 1
                });
            }
        } catch (error) {
            toast.error('Không thể tải danh sách sản phẩm');
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const res = await api.delete(`/products/${deleteId}`);
            if (res.data.success) {
                toast.success(res.data.message);
                if (products.length === 1 && page > 1) {
                    setPage(prev => prev - 1);
                } else {
                    fetchProducts();
                }
            }
        } catch (error) {
            toast.error('Lỗi khi xóa sản phẩm');
        }
    };

    const handleEdit = async (product) => {
        try {
            const res = await api.get(`/products/${product.id}`);
            if (res.data.success) {
                setSelectedProduct(res.data.data);
                setIsReadOnly(false);
                setIsModalOpen(true);
            }
        } catch (error) {
            toast.error('Không thể lấy thông tin chi tiết sản phẩm');
        }
    };

    const handleView = async (product) => {
        try {
            const res = await api.get(`/products/${product.id}`);
            if (res.data.success) {
                setSelectedProduct(res.data.data);
                setIsReadOnly(true);
                setIsModalOpen(true);
            }
        } catch (error) {
            toast.error('Không thể lấy thông tin chi tiết sản phẩm');
        }
    };

    const handleAdd = () => {
        setSelectedProduct(null);
        setIsReadOnly(false);
        setIsModalOpen(true);
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1);
    };

    const goToPage = (nextPage) => {
        if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === page) return;
        setPage(nextPage);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    const getImageUrl = (thumbnail) => {
        if (!thumbnail) return 'https://via.placeholder.com/150';
        return thumbnail.startsWith('http') ? thumbnail : `${getServerUrl()}${thumbnail}`;
    };

    const pageNumbers = Array.from({ length: Math.max(pagination.totalPages, 1) }, (_, i) => i + 1);
    const showingFrom = pagination.total === 0 ? 0 : ((pagination.page - 1) * pagination.limit) + 1;
    const showingTo = pagination.total === 0 ? 0 : showingFrom + products.length - 1;

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý sản phẩm</h1>
                    <p>Danh sách các tựa sách hiện có trong hệ thống.</p>
                </div>
                <div className="header-btns">
                    <button className="refresh-btn" onClick={fetchProducts} title="Làm mới">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="add-btn" onClick={handleAdd}>
                        <Plus size={20} />
                        Thêm sách mới
                    </button>
                </div>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên sách, danh mục, NXB hoặc ISBN..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                </div>
                <div className="filter-actions">
                    <button className="filter-btn">
                        <Filter size={18} />
                        Bộ lọc
                    </button>
                </div>
            </div>

            <div className="table-wrapper glass">
                {loading ? (
                    <div className="loading-state">Đang tải dữ liệu...</div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Giá bán</th>
                                <th>Tồn kho</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? products.map((product) => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className="product-img">
                                                <img src={getImageUrl(product.thumbnail)} alt={product.title} />
                                            </div>
                                            <div className="product-info">
                                                <span className="product-title">{product.title}</span>
                                                <span className="product-id">ID: #{product.id.toString().padStart(4, '0')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{product.category_name || 'Chưa phân loại'}</td>
                                    <td className="font-semibold text-primary">{formatPrice(product.price)}</td>
                                    <td>{product.stock_quantity}</td>
                                    <td>
                                        <span className={`status-badge ${product.is_active ? 'active' : 'error'}`}>
                                            {product.is_active ? 'Đang bán' : 'Ẩn'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn view" title="Xem" onClick={() => handleView(product)}><Eye size={16} /></button>
                                            <button className="action-btn edit" title="Sửa" onClick={() => handleEdit(product)}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" title="Xóa" onClick={() => handleDeleteClick(product.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="text-center py-8">Không tìm thấy sản phẩm nào</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}

                <div className="table-footer">
                    <span className="pagination-info">Hiển thị {showingFrom}-{showingTo} trên {pagination.total} sản phẩm</span>
                    <div className="pagination-btns">
                        <button
                            className={`pag-btn ${page <= 1 ? 'disabled' : ''}`}
                            disabled={page <= 1}
                            onClick={() => goToPage(page - 1)}
                        >
                            <ChevronLeft size={18} />
                        </button>
                        {pageNumbers.map(pageNumber => (
                            <button
                                key={pageNumber}
                                className={`pag-number ${pageNumber === page ? 'active' : ''}`}
                                onClick={() => goToPage(pageNumber)}
                            >
                                {pageNumber}
                            </button>
                        ))}
                        <button
                            className={`pag-btn ${page >= pagination.totalPages ? 'disabled' : ''}`}
                            disabled={page >= pagination.totalPages}
                            onClick={() => goToPage(page + 1)}
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={selectedProduct}
                onSave={fetchProducts}
                isReadOnly={isReadOnly}
            />

            <ConfirmModal
                isOpen={isConfirmOpen}
                title="Xóa sản phẩm"
                message="Bạn có chắc chắn muốn xóa cuốn sách này không? Hành động này không thể hoàn tác."
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default ProductList;
