import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkLoggedIn = async () => {
            try {
                const res = await api.get('/auth/me');
                if (res.data.status === 'success') {
                    setUser(res.data.data);
                }
            } catch (err) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        checkLoggedIn();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        if (res.data.status === 'success') {
            setUser(res.data.data.user);
            localStorage.setItem('token', res.data.data.token);
            return res.data;
        }
    };

    const register = async (full_name, email, password) => {
        return await api.post('/auth/register', { full_name, email, password });
    };

    const verifyOTP = async (email, otp) => {
        return await api.post('/auth/verify-otp', { email, otp });
    };

    const resendOTP = async (email) => {
        return await api.post('/auth/resend-otp', { email });
    };

    const forgotPassword = async (email) => {
        return await api.post('/auth/forgot-password', { email });
    };

    const resetPassword = async (email, otp, newPassword) => {
        return await api.post('/auth/reset-password', { email, otp, newPassword });
    };

    const logout = async () => {
        await api.post('/auth/logout');
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ 
            user, setUser, loading, login, register, 
            verifyOTP, resendOTP, forgotPassword, resetPassword, logout 
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
