import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import {
    fetchProvinces,
    fetchDistrictsByProvinceCode,
    fetchWardsByDistrictCode,
    findAddressCodes
} from '../../utils/vietnamAddressApi';

const emptyAddressForm = {
    receiver_name: '',
    receiver_phone: '',
    province: '',
    district: '',
    ward: '',
    street_address: '',
    is_default: 0
};

const AddressModal = ({ isOpen, onClose, address, onSave }) => {
    const [formData, setFormData] = useState(emptyAddressForm);
    const [loading, setLoading] = useState(false);
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedProvinceCode, setSelectedProvinceCode] = useState('');
    const [selectedDistrictCode, setSelectedDistrictCode] = useState('');
    const [selectedWardCode, setSelectedWardCode] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        let cancelled = false;

        const loadAddressOptions = async () => {
            const nextFormData = address ? { ...emptyAddressForm, ...address } : emptyAddressForm;
            setFormData(nextFormData);
            setDistricts([]);
            setWards([]);
            setSelectedProvinceCode('');
            setSelectedDistrictCode('');
            setSelectedWardCode('');

            try {
                const provinceList = await fetchProvinces();
                if (cancelled) return;
                setProvinces(provinceList || []);

                if (address?.province) {
                    const matched = await findAddressCodes(address, provinceList || []);
                    if (cancelled) return;
                    setDistricts(matched.districts);
                    setWards(matched.wards);
                    setSelectedProvinceCode(matched.provinceCode);
                    setSelectedDistrictCode(matched.districtCode);
                    setSelectedWardCode(matched.wardCode);
                }
            } catch (error) {
                console.error('Error fetching address options:', error);
                toast.error('Không thể tải danh sách tỉnh/thành phố');
            }
        };

        loadAddressOptions();

        return () => {
            cancelled = true;
        };
    }, [address, isOpen]);

    const handleProvinceChange = async (e) => {
        const code = e.target.value;
        const provinceName = code ? e.target.options[e.target.selectedIndex].text : '';

        setSelectedProvinceCode(code);
        setSelectedDistrictCode('');
        setSelectedWardCode('');
        setDistricts([]);
        setWards([]);
        setFormData(prev => ({
            ...prev,
            province: provinceName,
            district: '',
            ward: ''
        }));

        if (!code) return;

        try {
            const districtList = await fetchDistrictsByProvinceCode(code);
            setDistricts(districtList);
        } catch (error) {
            console.error('Error fetching districts:', error);
            toast.error('Không thể tải danh sách quận/huyện');
        }
    };

    const handleDistrictChange = async (e) => {
        const code = e.target.value;
        const districtName = code ? e.target.options[e.target.selectedIndex].text : '';

        setSelectedDistrictCode(code);
        setSelectedWardCode('');
        setWards([]);
        setFormData(prev => ({
            ...prev,
            district: districtName,
            ward: ''
        }));

        if (!code) return;

        try {
            const wardList = await fetchWardsByDistrictCode(code);
            setWards(wardList);
        } catch (error) {
            console.error('Error fetching wards:', error);
            toast.error('Không thể tải danh sách phường/xã');
        }
    };

    const handleWardChange = (e) => {
        const code = e.target.value;
        const wardName = code ? e.target.options[e.target.selectedIndex].text : '';

        setSelectedWardCode(code);
        setFormData(prev => ({
            ...prev,
            ward: wardName
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^0[0-9]{9}$/;
        if (!phoneRegex.test(formData.receiver_phone)) {
            toast.error('Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0');
            return;
        }

        setLoading(true);
        try {
            let res;
            if (address) {
                res = await api.put(`/addresses/${address.id}`, formData);
            } else {
                res = await api.post('/addresses', formData);
            }

            if (res.data.success) {
                toast.success(address ? 'Cập nhật thành công' : 'Thêm địa chỉ thành công');
                onSave();
                onClose();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi lưu địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="address-modal-overlay" onClick={onClose}>
            <div className="address-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="address-modal-header">
                    <h2>{address ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}</h2>
                    <button type="button" className="address-modal-close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form className="address-modal-form" onSubmit={handleSubmit}>
                    <div className="address-form-row two-cols">
                        <div className="address-form-group">
                            <label>Người nhận</label>
                            <input
                                type="text"
                                value={formData.receiver_name}
                                onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="address-form-group">
                            <label>Số điện thoại</label>
                            <input
                                type="text"
                                value={formData.receiver_phone}
                                onChange={(e) => setFormData({ ...formData, receiver_phone: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="address-form-group">
                        <label>Tỉnh/Thành phố</label>
                        <select
                            value={selectedProvinceCode}
                            onChange={handleProvinceChange}
                            required
                        >
                            <option value="">-- Chọn Tỉnh/Thành --</option>
                            {provinces.map(province => (
                                <option key={province.code} value={province.code}>{province.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="address-form-row two-cols">
                        <div className="address-form-group">
                            <label>Quận/Huyện</label>
                            <select
                                value={selectedDistrictCode}
                                onChange={handleDistrictChange}
                                disabled={!selectedProvinceCode}
                                required
                            >
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {districts.map(district => (
                                    <option key={district.code} value={district.code}>{district.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="address-form-group">
                            <label>Phường/Xã</label>
                            <select
                                value={selectedWardCode}
                                onChange={handleWardChange}
                                disabled={!selectedDistrictCode}
                                required
                            >
                                <option value="">-- Chọn Phường/Xã --</option>
                                {wards.map(ward => (
                                    <option key={ward.code} value={ward.code}>{ward.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="address-form-group">
                        <label>Địa chỉ chi tiết (Số nhà, tên đường...)</label>
                        <input
                            type="text"
                            value={formData.street_address}
                            onChange={(e) => setFormData({ ...formData, street_address: e.target.value })}
                            required
                        />
                    </div>

                    <label className="address-default-check">
                        <input
                            type="checkbox"
                            checked={formData.is_default === 1}
                            onChange={(e) => setFormData({ ...formData, is_default: e.target.checked ? 1 : 0 })}
                        />
                        <span>Đặt làm địa chỉ mặc định</span>
                    </label>

                    <div className="address-modal-footer">
                        <button type="button" className="address-btn-cancel" onClick={onClose}>Hủy</button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="address-btn-save"
                        >
                            <Save size={16} />
                            {loading ? 'Đang lưu...' : 'Lưu địa chỉ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddressModal;
