import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Search, 
    Edit2, 
    Trash2, 
    RefreshCw,
    Ticket,
    Calendar,
    Users
} from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import VoucherModal from './VoucherModal';
import ConfirmModal from '../common/ConfirmModal';
import './ProductList.css'; 

const VoucherList = () => {
    const [vouchers, setVouchers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVoucher, setSelectedVoucher] = useState(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [deleteId, setDeleteId] = useState(null);

    const fetchVouchers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/vouchers');
            if (res.data.success) {
                setVouchers(res.data.data);
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách voucher');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, []);

    const handleDeleteClick = (id) => {
        setDeleteId(id);
        setIsConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await api.delete(`/vouchers/${deleteId}`);
            toast.success('Đã xóa mã');
            fetchVouchers();
        } catch (error) {
            toast.error('Lỗi khi xóa');
        }
    };

    const formatValue = (v) => {
        if (v.type === 'percent') return `${v.value}%`;
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.value);
    };

    const filteredVouchers = vouchers.filter(v => 
        v.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Quản lý mã khuyến mãi</h1>
                    <p>Tạo và theo dõi các chương trình ưu đãi cho khách hàng.</p>
                </div>
                <div className="header-btns">
                    <button className="refresh-btn" onClick={fetchVouchers}><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
                    <button className="add-btn" onClick={() => { setSelectedVoucher(null); setIsModalOpen(true); }}>
                        <Plus size={20} /> Thêm Mã Khuyến Mãi
                    </button>
                </div>
            </div>

            <div className="table-actions glass mb-6">
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Tìm theo mã code..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
            </div>

            <div className="table-wrapper glass">
                {loading ? <div className="loading-state">Đang tải...</div> : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Mã Voucher</th>
                                <th>Giảm giá</th>
                                <th>Đơn tối thiểu</th>
                                <th>Sử dụng</th>
                                <th>Hết hạn</th>
                                <th>Trạng thái</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVouchers.map(v => (
                                <tr key={v.id}>
                                    <td>
                                        <div className="product-cell">
                                            <div className="icon-box-small" style={{ borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '8px' }}>
                                                <Ticket size={20} />
                                            </div>
                                            <span className="product-title font-bold" style={{ color: '#3b82f6', letterSpacing: '1px' }}>{v.code}</span>
                                        </div>
                                    </td>
                                    <td className="font-bold text-primary">{formatValue(v)}</td>
                                    <td>{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.min_order_amount)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                                            <Users size={12} /> {v.usage_count} / {v.usage_limit || '∞'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#94a3b8' }}>
                                            <Calendar size={12} /> {v.end_date ? new Date(v.end_date).toLocaleDateString('vi-VN') : 'Không thời hạn'}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge ${v.is_active ? 'active' : 'warning'}`}>
                                            {v.is_active ? 'Hoạt động' : 'Tạm dừng'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-btns">
                                            <button className="action-btn edit" onClick={() => { setSelectedVoucher(v); setIsModalOpen(true); }}><Edit2 size={16} /></button>
                                            <button className="action-btn delete" onClick={() => handleDeleteClick(v.id)}><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            <VoucherModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} voucher={selectedVoucher} onSave={fetchVouchers} />
            
            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xóa mã khuyến mãi"
                message="Bạn có chắc chắn muốn xóa mã giảm giá này không?"
                onConfirm={handleConfirmDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default VoucherList;
