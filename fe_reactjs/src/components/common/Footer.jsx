import { useNavigate, Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import './Footer.css';

const Footer = () => {
    const { settings } = useSettings();
    const siteName = settings.site_name || 'HANOI BOOKSTORE';
    const [siteNameFirst, ...siteNameRest] = siteName.split(' ');
    const siteNameSecond = siteNameRest.join(' ');
    const contactAddress = settings.address || '123 Đường ABC, Quận 1, TP.HCM';
    const contactPhone = settings.contact_phone || '090 123 4567';
    const contactEmail = settings.contact_email || 'contact@bookstore.com';
    const footerText = settings.footer_text || `© ${new Date().getFullYear()} ${siteName}. Tất cả quyền được bảo lưu.`;
    const description = settings.site_description || 'Nơi khơi nguồn tri thức và đam mê đọc sách. Chúng tôi mang đến cho bạn những trải nghiệm mua sắm tuyệt vời nhất.';

    return (
        <footer className="main-footer">
            <div className="container">
                <div className="footer-grid">
                    <div className="footer-col brand-col">
                        <h2 className="footer-logo">
                            {siteNameFirst}{siteNameSecond && <> <span>{siteNameSecond}</span></>}
                        </h2>
                        <p>{description}</p>
                        <div className="social-links">
                            <a href="#" title="Facebook" className="facebook">
                                <span className="social-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
                                </span>
                            </a>
                            <a href="#" title="Instagram" className="instagram">
                                <span className="social-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                                </span>
                            </a>
                            <a href="#" title="Youtube" className="youtube">
                                <span className="social-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2C5.12 19.5 12 19.5 12 19.5s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 2.9 2.9 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
                                </span>
                            </a>
                            <a href="#" title="Tiktok" className="tiktok">
                                <span className="social-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"></path></svg>
                                </span>
                            </a>
                        </div>
                    </div>

                    <div className="footer-col">
                        <h3>Về chúng tôi</h3>
                        <ul>
                            <li><Link to="/about">Giới thiệu</Link></li>
                            <li><Link to="/blog">Tin tức & Blog</Link></li>
                            <li><a href="#">Hệ thống cửa hàng</a></li>
                            <li><Link to="/contact">Liên hệ</Link></li>
                        </ul>
                    </div>

                    <div className="footer-col">
                        <h3>Hỗ trợ khách hàng</h3>
                        <ul>
                            <li><a href="#">Chính sách đổi trả</a></li>
                            <li><a href="#">Chính sách vận chuyển</a></li>
                            <li><a href="#">Phương thức thanh toán</a></li>
                            <li><a href="#">Câu hỏi thường gặp</a></li>
                        </ul>
                    </div>

                    <div className="footer-col contact-col">
                        <h3>Thông tin liên hệ</h3>
                        <div className="contact-item">
                            <MapPin size={18} />
                            <span>{contactAddress}</span>
                        </div>
                        <div className="contact-item">
                            <Phone size={18} />
                            <span>{contactPhone}</span>
                        </div>
                        <div className="contact-item">
                            <Mail size={18} />
                            <span>{contactEmail}</span>
                        </div>
                    </div>
                </div>

                <div className="footer-bottom">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p>{footerText}</p>
                        <div className="flex gap-6 text-sm text-slate-500">
                            <a href="#" className="hover:text-indigo-600">Chính sách bảo mật</a>
                            <a href="#" className="hover:text-indigo-600">Điều khoản sử dụng</a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
