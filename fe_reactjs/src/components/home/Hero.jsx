import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay, EffectFade } from 'swiper/modules';
import { motion } from 'framer-motion';

// Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';
import { getServerUrl } from '../../utils/api';
import './Hero.css';

const Hero = ({ banners = [] }) => {
    // If no banners from API, use default ones
    const displayBanners = banners.length > 0 ? banners : [
        {
            id: 1,
            image_url: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000',
            title: 'Khơi Nguồn Tri Thức',
            description: 'Khám phá hàng ngàn cuốn sách hay nhất từ các nhà xuất bản hàng đầu.'
        },
        {
            id: 2,
            image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2000',
            title: 'Ưu Đãi Mùa Hè',
            description: 'Giảm giá lên đến 50% cho tất cả các dòng sách văn học.'
        }
    ];

    const getFullImageUrl = (url) => {
        if (!url) return '';
        if (url.startsWith('http')) return url;
        return `${getServerUrl()}${url}`;
    };

    return (
        <section className="hero-section">
            <Swiper
                modules={[Navigation, Pagination, Autoplay, EffectFade]}
                effect="fade"
                spaceBetween={0}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                loop={displayBanners.length > 1}
                className="hero-swiper"
            >
                {displayBanners.map((banner) => (
                    <SwiperSlide key={banner.id}>
                        <div className="hero-slide">
                            <div className="hero-bg">
                                <img src={getFullImageUrl(banner.image_url)} alt={banner.title} />
                                <div className="hero-overlay"></div>
                            </div>
                            
                            <div className="hero-content-wrapper container">
                                <motion.div 
                                    className="hero-content"
                                    initial={{ opacity: 0, x: -50 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.8 }}
                                >
                                    <span className="hero-tag">Chào mừng đến với BookStore</span>
                                    <h1>{banner.title}</h1>
                                    <p>{banner.description || banner.summary || 'Mang cả thế giới sách đến tận tay bạn với chất lượng tốt nhất và dịch vụ tận tâm.'}</p>
                                </motion.div>
                            </div>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </section>
    );
};

export default Hero;
