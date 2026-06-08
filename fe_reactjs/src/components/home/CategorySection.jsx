import React from 'react';
import { motion } from 'framer-motion';
import { getServerUrl } from '../../utils/api';
import './CategorySection.css';

const CategorySection = ({ categories = [] }) => {
    if (categories.length === 0) return null;

    const getFullImageUrl = (url) => {
        if (!url) return 'https://placehold.co/150x150?text=Category';
        if (url.startsWith('http')) return url;
        return `${getServerUrl()}${url}`;
    };

    return (
        <section className="category-section container">
            <div className="section-header">
                <h2>Danh Mục Nổi Bật</h2>
                <div className="section-divider"></div>
            </div>

            <div className="category-grid">
                {categories.map((cat, index) => (
                    <motion.div 
                        key={cat.id}
                        className="category-card"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -10 }}
                    >
                        <div className="category-image">
                            <img src={getFullImageUrl(cat.image)} alt={cat.name} />
                        </div>
                        <h3>{cat.name}</h3>
                        <p>{cat.description?.slice(0, 40)}...</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export default CategorySection;
