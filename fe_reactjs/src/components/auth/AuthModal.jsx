import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, LogIn, UserPlus, BookOpen, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import './AuthModal.css';

const AuthModal = ({ isOpen, onClose }) => {
    const [mode, setMode] = useState('login'); // login, register, verify, forgot, reset
    const [loading, setLoading] = useState(false);
    const { login, register, verifyOTP, resendOTP, forgotPassword, resetPassword } = useAuth();
    const navigate = useNavigate();

    // OTP Timer
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    // Form states
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        confirmPassword: '',
        otp: '',
        newPassword: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleResendOTP = async () => {
        if (timer > 0) return;
        setLoading(true);
        try {
            if (mode === 'verify') {
                await resendOTP(formData.email);
            } else if (mode === 'reset') {
                await forgotPassword(formData.email);
            }
            toast.success('Đã gửi lại mã OTP!');
            setTimer(60);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Không thể gửi lại mã');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'login') {
                try {
                    const res = await login(formData.email, formData.password);
                    toast.success('Đăng nhập thành công!');
                    onClose();
                    
                    const role = res.data.user.role;
                    if (role === 'admin' || role === 'staff') navigate('/admin');
                    else navigate('/'); 
                } catch (err) {
                    if (err.response?.data?.unverified) {
                        toast.info('Tài khoản chưa xác thực. Vui lòng nhập OTP.');
                        setMode('verify');
                        setTimer(60);
                    } else {
                        throw err;
                    }
                }
            } else if (mode === 'register') {
                if (formData.password !== formData.confirmPassword) {
                    throw new Error('Mật khẩu xác nhận không khớp');
                }
                const res = await register(formData.full_name, formData.email, formData.password);
                toast.success(res.data.message || 'Đăng ký thành công!');
                setMode('verify');
                setTimer(60);
            } else if (mode === 'verify') {
                await verifyOTP(formData.email, formData.otp);
                toast.success('Xác thực thành công! Hãy đăng nhập.');
                setMode('login');
                setFormData(prev => ({ ...prev, otp: '', password: '' }));
            } else if (mode === 'forgot') {
                await forgotPassword(formData.email);
                toast.success('Hãy kiểm tra email để lấy mã xác thực.');
                setMode('reset');
                setTimer(60);
            } else if (mode === 'reset') {
                if (formData.newPassword !== formData.confirmPassword) {
                    throw new Error('Mật khẩu xác nhận không khớp');
                }
                await resetPassword(formData.email, formData.otp, formData.newPassword);
                toast.success('Đặt lại mật khẩu thành công! Hãy đăng nhập lại.');
                setMode('login');
                setFormData(prev => ({ ...prev, otp: '', password: '', newPassword: '', confirmPassword: '' }));
            }
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Đã có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const renderHeader = () => {
        if (mode === 'verify') return 'Xác thực tài khoản';
        if (mode === 'forgot') return 'Quên mật khẩu';
        if (mode === 'reset') return 'Đặt lại mật khẩu';
        if (mode === 'login') return 'Mừng trở lại!';
        return 'Tham gia cùng chúng tôi';
    };

    const renderDescription = () => {
        if (mode === 'verify') return `Mã OTP 6 số đã được gửi đến ${formData.email}.`;
        if (mode === 'forgot') return 'Nhập email của bạn để nhận mã khôi phục mật khẩu.';
        if (mode === 'reset') return 'Nhập mã OTP và mật khẩu mới của bạn.';
        if (mode === 'login') return 'Đăng nhập để tiếp tục hành trình khám phá kho tri thức vô tận.';
        return 'Tạo tài khoản để nhận nhiều ưu đãi và quản lý đơn hàng tốt hơn.';
    };

    return (
        <AnimatePresence>
            <div className="auth-modal-overlay" onClick={onClose}>
                <motion.div 
                    className="auth-modal-container glass"
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className="close-btn" onClick={onClose}><X /></button>

                    <div className="auth-modal-side">
                        <div className="side-content">
                            <BookOpen size={48} className="mb-4" />
                            <h2>{renderHeader()}</h2>
                            <p>{renderDescription()}</p>
                        </div>
                    </div>

                    <div className="auth-modal-main">
                        {['login', 'register'].includes(mode) && (
                            <div className="auth-tabs">
                                <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Đăng nhập</button>
                                <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Đăng ký</button>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            {mode === 'register' && (
                                <div className="input-group">
                                    <label>Họ và tên</label>
                                    <div className="input-wrapper">
                                        <User className="field-icon" size={18} />
                                        <input name="full_name" type="text" placeholder="Nguyễn Văn A" required value={formData.full_name} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            {mode !== 'verify' && mode !== 'reset' && (
                                <div className="input-group">
                                    <label>Email</label>
                                    <div className="input-wrapper">
                                        <Mail className="field-icon" size={18} />
                                        <input name="email" type="email" placeholder="email@example.com" required value={formData.email} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            {mode === 'login' && (
                                <div className="input-group">
                                    <label>Mật khẩu</label>
                                    <div className="input-wrapper">
                                        <Lock className="field-icon" size={18} />
                                        <input name="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                                    </div>
                                </div>
                            )}

                            {mode === 'register' && (
                                <>
                                    <div className="input-group">
                                        <label>Mật khẩu</label>
                                        <div className="input-wrapper">
                                            <Lock className="field-icon" size={18} />
                                            <input name="password" type="password" placeholder="••••••••" required value={formData.password} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Xác nhận mật khẩu</label>
                                        <div className="input-wrapper">
                                            <Lock className="field-icon" size={18} />
                                            <input name="confirmPassword" type="password" placeholder="••••••••" required value={formData.confirmPassword} onChange={handleChange} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {(mode === 'verify' || mode === 'reset') && (
                                <div className="input-group">
                                    <label>Mã OTP (6 chữ số)</label>
                                    <div className="input-wrapper">
                                        <ShieldCheck className="field-icon" size={18} />
                                        <input name="otp" type="text" placeholder="123456" required maxLength={6} value={formData.otp} onChange={handleChange} />
                                    </div>
                                    <div className="resend-container">
                                        <button type="button" className="resend-btn" onClick={handleResendOTP} disabled={timer > 0 || loading}>
                                            {timer > 0 ? `Gửi lại sau (${timer}s)` : <><RefreshCw size={14} /> Gửi lại mã</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {mode === 'reset' && (
                                <>
                                    <div className="input-group">
                                        <label>Mật khẩu mới</label>
                                        <div className="input-wrapper">
                                            <Lock className="field-icon" size={18} />
                                            <input name="newPassword" type="password" placeholder="••••••••" required value={formData.newPassword} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Xác nhận mật khẩu mới</label>
                                        <div className="input-wrapper">
                                            <Lock className="field-icon" size={18} />
                                            <input name="confirmPassword" type="password" placeholder="••••••••" required value={formData.confirmPassword} onChange={handleChange} />
                                        </div>
                                    </div>
                                </>
                            )}

                            {mode === 'login' && (
                                <div className="forgot-pass">
                                    <button type="button" onClick={() => setMode('forgot')}>Quên mật khẩu?</button>
                                </div>
                            )}

                            <button type="submit" className={`submit-btn ${loading ? 'loading' : ''}`} disabled={loading}>
                                {loading ? 'Đang xử lý...' : (
                                    <>
                                        {mode === 'login' ? <LogIn size={20} /> : (mode === 'register' ? <UserPlus size={20} /> : <ShieldCheck size={20} />)}
                                        {mode === 'login' ? 'Đăng nhập ngay' : 
                                         mode === 'register' ? 'Đăng ký tài khoản' : 
                                         mode === 'verify' ? 'Xác thực ngay' : 
                                         mode === 'forgot' ? 'Tiếp tục' : 'Đặt lại mật khẩu'}
                                    </>
                                )}
                            </button>

                            {['verify', 'forgot', 'reset'].includes(mode) && (
                                <button type="button" className="back-to-auth" onClick={() => setMode('login')}>Quay lại Đăng nhập</button>
                            )}
                        </form>

                        {['login', 'register'].includes(mode) && (
                            <div className="auth-footer">
                                <p>
                                    {mode === 'login' ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
                                    <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                                        {mode === 'login' ? 'Đăng ký ngay' : 'Đăng nhập ngay'}
                                        <ArrowRight size={14} />
                                    </button>
                                </p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AuthModal;
