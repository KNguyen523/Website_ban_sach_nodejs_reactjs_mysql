import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Camera, Save } from 'lucide-react';
import api, { getServerUrl } from '../../utils/api';
import { toast } from 'react-toastify';

const ProfileInfo = ({ user, onUpdate }) => {
    const [formData, setFormData] = useState({
        full_name: '',
        phone: '',
        email: '', // Email usually read-only
        avatar: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                full_name: user.full_name || '',
                phone: user.phone || '',
                email: user.email || '',
                avatar: user.avatar || ''
            });
            if (user.avatar) {
                setPreviewUrl(user.avatar.startsWith('http') ? user.avatar : `${getServerUrl()}${user.avatar}`);
            }
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const phoneRegex = /^0[0-9]{9}$/;
        if (formData.phone && !phoneRegex.test(formData.phone)) {
            toast.error('Số điện thoại phải có đúng 10 chữ số và bắt đầu bằng số 0');
            return;
        }

        setLoading(true);

        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('phone', formData.phone);
        if (avatarFile) {
            data.append('avatar', avatarFile);
        } else {
            data.append('avatar', formData.avatar);
        }

        try {
            const res = await api.put('/users/update-me', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (res.data.success) {
                toast.success('Cập nhật thông tin thành công');
                onUpdate(res.data.data);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-card glass">
            <div className="content-header">
                <h2>Thông tin cá nhân</h2>
                <p>Cập nhật thông tin tài khoản của bạn</p>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
                <div className="avatar-upload-section">
                    <label className="avatar-edit-label">
                        <div className="avatar-preview">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Avatar" />
                            ) : (
                                <User size={40} className="text-slate-300" />
                            )}
                            <div className="avatar-overlay">
                                <Camera size={24} />
                            </div>
                        </div>
                        <input type="file" accept="image/*" onChange={handleAvatarChange} hidden />
                    </label>
                    <div className="upload-actions">
                        <p className="font-semibold text-slate-800">Ảnh đại diện</p>
                        <p className="text-xs text-slate-500 mt-1">Dung lượng tối đa 5MB. Định dạng: JPG, PNG, WEBP.</p>
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Họ và tên</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <User size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Nhập họ tên"
                            value={formData.full_name}
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                            required
                        />
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Số điện thoại</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Nhập số điện thoại"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>
                </div>

                <div className="form-group mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Địa chỉ Email</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail size={18} className="text-slate-400" />
                        </div>
                        <input
                            type="email"
                            className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed"
                            value={formData.email}
                            disabled
                        />
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Email không thể thay đổi để đảm bảo bảo mật tài khoản.</p>
                </div>

                <button
                    type="submit"
                    className="btn-save-profile"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="btn-spinner"></span>
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Lưu thay đổi
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ProfileInfo;
