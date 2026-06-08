import React, { useState } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { MapPin, Phone, Mail, Send, CheckCircle2, Clock } from 'lucide-react';
import api from '../utils/api';
import { toast } from 'react-toastify';
import { useSettings } from '../context/SettingsContext';
import './ContactPage.css';

const ContactPage = () => {
    const { settings } = useSettings();
    const siteName = settings.site_name || 'Hanoi Bookstore';
    const address = settings.address || '123 Đường ABC, Quận 1, TP.HCM';
    const phone = settings.contact_phone || '090 123 4567';
    const email = settings.contact_email || 'contact@bookstore.com';

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.post('/contact', formData);
            if (res.data.success) {
                toast.success(res.data.message);
                setSubmitted(true);
                setFormData({ name: '', email: '', subject: '', message: '' });
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page">
            <Header />
            
            <section className="contact-hero">
                <div className="max-w-7xl mx-auto px-4">
                    <h1>Liên hệ với chúng tôi</h1>
                    <p>
                        {siteName} luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy gửi tin nhắn cho chúng tôi bất cứ khi nào bạn cần.
                    </p>
                </div>
            </section>
            
            <main className="contact-container">
                {/* Contact Info */}
                <aside className="contact-info-card">
                    <div className="info-item">
                        <div className="info-icon">
                            <MapPin size={24} />
                        </div>
                        <div className="info-content">
                            <h4>Địa chỉ</h4>
                            <p>{address}</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <Phone size={24} />
                        </div>
                        <div className="info-content">
                            <h4>Điện thoại</h4>
                            <p>{phone}</p>
                        </div>
                    </div>

                    <div className="info-item">
                        <div className="info-icon">
                            <Mail size={24} />
                        </div>
                        <div className="info-content">
                            <h4>Email</h4>
                            <p>{email}</p>
                        </div>
                    </div>

                    <div className="work-hours">
                        <div className="flex items-center gap-2 mb-4 text-indigo-600">
                            <Clock size={20} />
                            <h4 className="m-0">Giờ làm việc</h4>
                        </div>
                        <div className="hour-row">
                            <span>Thứ 2 - Thứ 6:</span>
                            <span>8:00 - 21:00</span>
                        </div>
                        <div className="hour-row">
                            <span>Thứ 7 - CN:</span>
                            <span>9:00 - 18:00</span>
                        </div>
                    </div>
                </aside>

                {/* Contact Form */}
                <section className="contact-form-card">
                    {submitted ? (
                        <div className="success-state">
                            <div className="success-icon">
                                <CheckCircle2 size={48} />
                            </div>
                            <h3 className="text-3xl font-bold text-slate-900 mb-4">Gửi tin nhắn thành công!</h3>
                            <p className="text-slate-500 text-lg mb-8">
                                Cảm ơn bạn đã quan tâm đến {siteName}. Chúng tôi sẽ phản hồi sớm nhất có thể.
                            </p>
                            <button 
                                onClick={() => setSubmitted(false)}
                                className="submit-btn mx-auto"
                            >
                                Gửi tin nhắn khác
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            <h2 className="form-title">Gửi tin nhắn cho chúng tôi</h2>
                            
                            <div className="input-row">
                                <div className="form-group">
                                    <label>Họ và tên</label>
                                    <input 
                                        type="text" 
                                        placeholder="Nguyễn Văn A"
                                        value={formData.name}
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input 
                                        type="email" 
                                        placeholder="example@email.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>
                            
                            <div className="form-group mb-6">
                                <label>Chủ đề</label>
                                <input 
                                    type="text" 
                                    placeholder="Bạn muốn hỏi về điều gì?"
                                    value={formData.subject}
                                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                                />
                            </div>
                            
                            <div className="form-group mb-8">
                                <label>Nội dung tin nhắn</label>
                                <textarea 
                                    placeholder="Nhập nội dung tin nhắn của bạn..."
                                    value={formData.message}
                                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                                    required
                                    rows="6"
                                ></textarea>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="submit-btn"
                            >
                                {loading ? 'Đang gửi...' : (
                                    <>
                                        Gửi tin nhắn <Send size={20} />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </section>
            </main>

            <section className="map-section">
                <div className="map-card">
                    <img 
                        src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&q=80&w=1200" 
                        alt="Bản đồ" 
                    />
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ContactPage;
