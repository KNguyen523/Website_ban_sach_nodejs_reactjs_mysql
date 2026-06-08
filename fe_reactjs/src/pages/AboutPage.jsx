import React from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { BookOpen, Users, Award, ShieldCheck, Sparkles } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import './AboutPage.css';

const AboutPage = () => {
    const { settings } = useSettings();
    const siteName = settings.site_name || 'Hanoi Bookstore';

    return (
        <div className="about-page">
            <Header />

            <main className="about-container">
                <div className="about-hero-section">
                    <div className="about-hero-text">
                        <div className="about-hero-badge">
                            <Sparkles size={14} />
                            <span>Câu chuyện của chúng tôi</span>
                        </div>
                        <h1 className="about-hero-title">
                            Chào mừng bạn đến với <span>{siteName}</span>
                        </h1>
                        <p className="about-hero-p">
                            Được thành lập từ năm 2010, {siteName} không chỉ là một hiệu sách, mà là nơi hội tụ của tri thức, tâm hồn và những câu chuyện vượt thời gian. Chúng tôi tin rằng mỗi cuốn sách là một thế giới mới đang chờ bạn khám phá.
                        </p>
                        <p className="about-hero-p">
                            Với hơn 100.000 đầu sách đa dạng từ Văn học, Kinh tế, Kỹ năng đến Sách thiếu nhi, chúng tôi cam kết mang đến những trải nghiệm đọc sách tuyệt vời nhất cho cộng đồng yêu sách tại Việt Nam.
                        </p>
                        
                        <div className="about-stats">
                            <div className="stat-card">
                                <span className="stat-number">10+</span>
                                <span className="stat-label">Năm kinh nghiệm</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">50K+</span>
                                <span className="stat-label">Khách hàng tin tưởng</span>
                            </div>
                            <div className="stat-card">
                                <span className="stat-number">100K+</span>
                                <span className="stat-label">Đầu sách phong phú</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="about-image-wrapper">
                        <img 
                            src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&q=80&w=1000" 
                            alt="Bookstore Interior" 
                            className="about-image"
                        />
                        <div className="about-image-bg-pattern-1"></div>
                        <div className="about-image-bg-pattern-2"></div>
                    </div>
                </div>

                <div className="values-section">
                    <div className="values-header">
                        <h2>Giá trị cốt lõi</h2>
                        <p>Chúng tôi luôn đặt độc giả và chất lượng dịch vụ lên hàng đầu</p>
                    </div>
                    
                    <div className="values-grid">
                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <BookOpen size={24} />
                            </div>
                            <h3>Tri thức đa dạng</h3>
                            <p>Luôn cập nhật những đầu sách mới nhất và giá trị nhất từ các nhà xuất bản uy tín.</p>
                        </div>
                        
                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <Users size={24} />
                            </div>
                            <h3>Cộng đồng yêu sách</h3>
                            <p>Xây dựng không gian kết nối và chia sẻ đam mê giữa những người yêu sách.</p>
                        </div>
                        
                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <Award size={24} />
                            </div>
                            <h3>Dịch vụ tận tâm</h3>
                            <p>Đội ngũ nhân viên luôn sẵn sàng hỗ trợ bạn tìm kiếm người bạn đồng hành ưng ý.</p>
                        </div>
                        
                        <div className="value-card">
                            <div className="value-icon-wrapper">
                                <ShieldCheck size={24} />
                            </div>
                            <h3>Chất lượng thật</h3>
                            <p>Cam kết 100% sách chính hãng và được bảo quản trong điều kiện tốt nhất.</p>
                        </div>
                    </div>
                </div>

                <div className="vision-mission-section">
                    <h2>Tầm nhìn & Sứ mệnh</h2>
                    
                    <div className="vision-mission-grid">
                        <div className="vision-mission-card">
                            <h4>Tầm nhìn</h4>
                            <p>"Trở thành điểm đến tri thức số 1 tại Việt Nam, nơi mỗi độc giả đều tìm thấy cảm hứng và sự phát triển bản thân qua từng trang sách."</p>
                        </div>
                        
                        <div className="vision-mission-card">
                            <h4>Sứ mệnh</h4>
                            <p>"Góp phần nâng cao văn hóa đọc và lan tỏa tri thức đến mọi thế hệ người Việt bằng sự tận tâm và chuyên nghiệp."</p>
                        </div>
                    </div>
                </div>
            </main>
            
            <Footer />
        </div>
    );
};

export default AboutPage;
