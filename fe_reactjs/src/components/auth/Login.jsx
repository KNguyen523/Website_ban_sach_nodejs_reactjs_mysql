import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, BookOpen } from 'lucide-react';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await login(email, password);
            toast.success('Đăng nhập thành công!');
            
            // Redirect based on role
            const role = res.data.user.role;
            if (role === 'admin' || role === 'staff') navigate('/admin');
            else navigate('/profile');
            
        } catch (err) {
            toast.error(err.response?.data?.message || 'Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-background">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
            </div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="login-card glass"
            >
                <div className="login-header">
                    <div className="logo-icon">
                        <BookOpen size={40} />
                    </div>
                    <h1>Hanoi Bookstore</h1>
                    <p>Chào mừng bạn quay trở lại</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="input-group">
                        <label>Email</label>
                        <div className="input-wrapper">
                            <Mail className="field-icon" size={20} />
                            <input 
                                type="email" 
                                placeholder="name@example.com" 
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Mật khẩu</label>
                        <div className="input-wrapper">
                            <Lock className="field-icon" size={20} />
                            <input 
                                type="password" 
                                placeholder="••••••••" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="forgot-password">
                        <a href="/forgot-password">Quên mật khẩu?</a>
                    </div>

                    <button 
                        type="submit" 
                        className={`login-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : (
                            <>
                                <LogIn size={20} />
                                Đăng nhập
                            </>
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <span>Chưa có tài khoản?</span>
                    <a href="/register">Đăng ký ngay</a>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
