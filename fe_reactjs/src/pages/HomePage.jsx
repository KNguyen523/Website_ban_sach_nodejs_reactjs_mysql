import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Hero from '../components/home/Hero';
import ProductSection from '../components/home/ProductSection';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { toast } from 'react-toastify';

const HomePage = () => {
    const [homeData, setHomeData] = useState({
        banners: [],
        featuredCategories: [],
        sections: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const res = await api.get('/public/home');
                if (res.data.success) {
                    setHomeData(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching home data:', error);
                toast.error('Không thể tải dữ liệu trang chủ');
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loader"></div>
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    return (
        <div className="app-container">
            <Header />
            <main>
                <Hero banners={homeData.banners} />

                {homeData.sections.map((section, index) => (
                    <ProductSection 
                        key={index}
                        title={section.title}
                        books={section.books}
                        type={section.type}
                    />
                ))}
            </main>
            <Footer />
        </div>
    );
};

export default HomePage;
