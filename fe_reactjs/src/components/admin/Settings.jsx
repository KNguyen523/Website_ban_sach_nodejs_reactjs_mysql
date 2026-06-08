import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Layout, Globe, Mail, Phone, MapPin, Link as LinkIcon } from 'lucide-react';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import './ProductList.css'; // Reusing base styles

const Settings = () => {
    const [settings, setSettings] = useState({
        site_name: '',
        site_title: '',
        site_description: '',
        contact_email: '',
        contact_phone: '',
        address: '',
        facebook_url: '',
        instagram_url: '',
        youtube_url: '',
        footer_text: '',
        shipping_fee: 30000,
        free_shipping_threshold: 500000
    });
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);



    const fetchSettings = async () => {
        setFetching(true);
        try {
            const res = await api.get('/settings');
            if (res.data.success) {
                // Merge with defaults
                setSettings(prev => ({ ...prev, ...res.data.data }));
            }
        } catch (error) {
            toast.error('Không thể tải cài đặt');
        } finally {
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.put('/settings', settings);
            if (res.data.success) {
                toast.success('Đã lưu cài đặt hệ thống');
            }
        } catch (error) {
            toast.error('Lỗi khi lưu cài đặt');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="loading-state">Đang tải cấu hình...</div>;

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <div>
                    <h1>Cài đặt hệ thống</h1>
                    <p>Quản lý thông tin chung, liên hệ và hiển thị của cửa hàng.</p>
                </div>
                <button className="refresh-btn" onClick={fetchSettings}>
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="admin-form mt-6">
                <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>
                    
                    {/* Cấu hình Website */}
                    <div className="settings-section glass p-6 rounded-2xl">
                        <div className="section-title flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#3b82f6', fontWeight: 'bold' }}>
                            <Globe size={20} /> <span>Cấu hình Website</span>
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Tên website</label>
                            <input type="text" name="site_name" value={settings.site_name} onChange={handleChange} placeholder="Vd: Hanoi Bookstore" />
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Tiêu đề (SEO Title)</label>
                            <input type="text" name="site_title" value={settings.site_title} onChange={handleChange} />
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Mô tả ngắn</label>
                            <textarea name="site_description" value={settings.site_description} onChange={handleChange} rows="3"></textarea>
                        </div>
                    </div>

                    {/* Thông tin liên hệ */}
                    <div className="settings-section glass p-6 rounded-2xl">
                        <div className="section-title flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#10b981', fontWeight: 'bold' }}>
                            <Mail size={20} /> <span>Thông tin liên hệ</span>
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Email liên hệ</label>
                            <input type="email" name="contact_email" value={settings.contact_email} onChange={handleChange} />
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Hotline</label>
                            <input type="text" name="contact_phone" value={settings.contact_phone} onChange={handleChange} />
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Địa chỉ</label>
                            <input type="text" name="address" value={settings.address} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Mạng xã hội */}
                    <div className="settings-section glass p-6 rounded-2xl">
                        <div className="section-title flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#8b5cf6', fontWeight: 'bold' }}>
                            <Layout size={20} /> <span>Mạng xã hội & Footer</span>
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label><FacebookIcon size={16} /> Facebook URL</label>
                            <input type="text" name="facebook_url" value={settings.facebook_url} onChange={handleChange} />
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label><InstagramIcon size={16} /> Instagram URL</label>
                            <input type="text" name="instagram_url" value={settings.instagram_url} onChange={handleChange} />
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Footer Text</label>
                            <input type="text" name="footer_text" value={settings.footer_text} onChange={handleChange} />
                        </div>
                    </div>

                    {/* Vận chuyển */}
                    <div className="settings-section glass p-6 rounded-2xl">
                        <div className="section-title flex items-center gap-2 mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', color: '#f59e0b', fontWeight: 'bold' }}>
                            <Truck size={20} /> <span>Vận chuyển & Phí</span>
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Phí vận chuyển mặc định (VNĐ)</label>
                            <input type="number" name="shipping_fee" value={settings.shipping_fee} onChange={handleChange} />
                        </div>
                        <div className="form-group text-left" style={{ textAlign: 'left' }}>
                            <label>Miễn phí vận chuyển từ (VNĐ)</label>
                            <input type="number" name="free_shipping_threshold" value={settings.free_shipping_threshold} onChange={handleChange} />
                        </div>
                    </div>

                </div>

                <div className="sticky-footer glass p-4 mt-8 flex justify-center" style={{ position: 'sticky', bottom: '2rem', display: 'flex', justifyContent: 'center', padding: '1rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(10px)', zIndex: 10 }}>
                    <button type="submit" className="submit-btn" style={{ padding: '0.8rem 4rem' }} disabled={loading}>
                        {loading ? 'Đang lưu...' : <><Save size={20} /> LƯU THAY ĐỔI</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

// Internal icons to avoid versioning hell
const Truck = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>
);

const FacebookIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const InstagramIcon = ({ size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

export default Settings;
