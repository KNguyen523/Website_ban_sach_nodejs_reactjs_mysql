import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const ChangePassword = () => {
    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [loading, setLoading] = useState(false);

    const toggleShow = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            return toast.error('Mật khẩu xác nhận không khớp');
        }
        if (formData.newPassword.length < 6) {
            return toast.error('Mật khẩu mới phải từ 6 ký tự');
        }

        setLoading(true);
        try {
            const res = await api.put('/users/update-password', {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            });
            if (res.data.success) {
                toast.success('Đổi mật khẩu thành công');
                setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi đổi mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="content-card glass">
            <div className="content-header">
                <h2>Đổi mật khẩu</h2>
                <p>Quản lý bảo mật tài khoản của bạn</p>
            </div>

            <form className="profile-form" onSubmit={handleSubmit}>
                <div className="form-group mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu hiện tại</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-slate-400" />
                        </div>
                        <input
                            type={showPasswords.current ? "text" : "password"}
                            className="block w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="••••••••"
                            value={formData.currentPassword}
                            onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                            required
                        />
                        <button 
                            type="button" 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                            onClick={() => toggleShow('current')}
                        >
                            {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="form-group mb-6">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mật khẩu mới</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-slate-400" />
                        </div>
                        <input
                            type={showPasswords.new ? "text" : "password"}
                            className="block w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="••••••••"
                            value={formData.newPassword}
                            onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                            required
                        />
                        <button 
                            type="button" 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                            onClick={() => toggleShow('new')}
                        >
                            {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="form-group mb-8">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Xác nhận mật khẩu mới</label>
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Lock size={18} className="text-slate-400" />
                        </div>
                        <input
                            type={showPasswords.confirm ? "text" : "password"}
                            className="block w-full pl-10 pr-12 py-3 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="••••••••"
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            required
                        />
                        <button 
                            type="button" 
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400"
                            onClick={() => toggleShow('confirm')}
                        >
                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="bg-indigo-50 p-4 rounded-xl flex items-start gap-3 mb-8">
                    <ShieldCheck className="text-indigo-600 mt-0.5" size={20} />
                    <div className="text-sm text-indigo-700">
                        <p className="font-bold mb-1">Mẹo đặt mật khẩu an toàn:</p>
                        <ul className="list-disc list-inside space-y-1 opacity-80">
                            <li>Sử dụng ít nhất 8 ký tự</li>
                            <li>Kết hợp chữ hoa, chữ thường và chữ số</li>
                            <li>Tránh sử dụng thông tin dễ đoán (ngày sinh, tên)</li>
                        </ul>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-save-profile"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="btn-spinner"></span>
                            Đang xử lý...
                        </>
                    ) : (
                        <>
                            <KeyRound size={18} />
                            Cập nhật mật khẩu
                        </>
                    )}
                </button>
            </form>
        </div>
    );
};

export default ChangePassword;
