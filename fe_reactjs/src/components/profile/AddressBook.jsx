import React, { useState, useEffect } from 'react';
import { MapPin, Phone, User, Plus, Trash2, Edit3, CheckCircle2 } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import ConfirmModal from '../common/ConfirmModal';
import AddressModal from './AddressModal';

const AddressBook = () => {
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [deleteId, setDeleteId] = useState(null);

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const res = await api.get('/addresses');
            if (res.data.success) {
                setAddresses(res.data.data);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, []);

    const handleDelete = async () => {
        try {
            const res = await api.delete(`/addresses/${deleteId}`);
            if (res.data.success) {
                toast.success('Xóa địa chỉ thành công');
                fetchAddresses();
            }
        } catch (error) {
            toast.error('Lỗi khi xóa địa chỉ');
        } finally {
            setIsConfirmOpen(false);
        }
    };

    const handleSetDefault = async (id) => {
        try {
            const res = await api.patch(`/addresses/${id}/default`);
            if (res.data.success) {
                toast.success('Đã cập nhật địa chỉ mặc định');
                fetchAddresses();
            }
        } catch (error) {
            toast.error('Lỗi khi cập nhật địa chỉ mặc định');
        }
    };

    return (
        <div className="content-card glass">
            <div className="content-header flex justify-between items-center">
                <div>
                    <h2>Sổ địa chỉ</h2>
                    <p>Quản lý thông tin giao hàng của bạn</p>
                </div>
                <button 
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
                    onClick={() => { setSelectedAddress(null); setIsModalOpen(true); }}
                >
                    <Plus size={18} />
                    Thêm địa chỉ mới
                </button>
            </div>

            {loading ? (
                <div className="py-20 text-center">Đang tải địa chỉ...</div>
            ) : (
                <div className="address-grid">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`address-card ${addr.is_default ? 'default' : ''}`}>
                            {addr.is_default && (
                                <div className="default-badge flex items-center gap-1">
                                    <CheckCircle2 size={12} />
                                    Mặc định
                                </div>
                            )}
                            <div className="address-info">
                                <div className="info-row">
                                    <User size={16} className="text-indigo-500" />
                                    <span className="receiver-name">{addr.receiver_name}</span>
                                </div>
                                <div className="info-row">
                                    <Phone size={16} className="text-emerald-500" />
                                    <span className="receiver-phone">{addr.receiver_phone}</span>
                                </div>
                                <div className="flex items-start gap-2 street-address">
                                    <MapPin size={16} className="text-slate-400 mt-1 flex-shrink-0" />
                                    <span>
                                        {addr.street_address}<br />
                                        {addr.ward}, {addr.district}, {addr.province}
                                    </span>
                                </div>
                            </div>
                            <div className="address-actions">
                                <button 
                                    className="edit-btn"
                                    onClick={() => { setSelectedAddress(addr); setIsModalOpen(true); }}
                                >
                                    <Edit3 size={14} /> Sửa
                                </button>
                                <button 
                                    className="delete-btn"
                                    onClick={() => { setDeleteId(addr.id); setIsConfirmOpen(true); }}
                                >
                                    <Trash2 size={14} /> Xóa
                                </button>
                                {!addr.is_default && (
                                    <button 
                                        className="set-default-btn"
                                        onClick={() => handleSetDefault(addr.id)}
                                    >
                                        Thiết lập mặc định
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}

                    <div 
                        className="add-address-card"
                        onClick={() => { setSelectedAddress(null); setIsModalOpen(true); }}
                    >
                        <Plus size={32} className="mb-2 opacity-50 text-indigo-500" />
                        <span className="font-semibold">Thêm địa chỉ mới</span>
                    </div>
                </div>
            )}

            <AddressModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                address={selectedAddress}
                onSave={fetchAddresses}
            />

            <ConfirmModal 
                isOpen={isConfirmOpen}
                title="Xóa địa chỉ"
                message="Bạn có chắc chắn muốn xóa địa chỉ này không?"
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                type="danger"
            />
        </div>
    );
};

export default AddressBook;
