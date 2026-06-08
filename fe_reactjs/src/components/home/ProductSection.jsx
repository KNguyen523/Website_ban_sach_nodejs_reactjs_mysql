import React from 'react';
import ProductCard from './ProductCard';
import './ProductSection.css';
import { ChevronRight, Zap, Diamond, TrendingUp, BookOpen } from 'lucide-react';

const sectionIcons = {
  flash_sale: <Zap size={28} className="text-orange-500" />,
  featured: <Diamond size={28} className="text-blue-500" />,
  best_seller: <TrendingUp size={28} className="text-emerald-500" />,
  new_arrival: <BookOpen size={28} className="text-indigo-500" />
};

const ProductSection = ({ title, books, type }) => {
  // Function to remove leading emojis/icons if they exist in the title string
  const cleanTitle = (text) => {
    return text.replace(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F|⚡|💎|📈|📖|🔥|✨|🏆)\s*/u, '');
  };

  return (
    <div className="product-section section-padding">
      <div className="container">
        <div className="section-header flex justify-between items-end mb-8">
          <div className="section-title">
            <h2 className="title">
              <span className="title-icon">{sectionIcons[type]}</span>
              <span className="title-text">{cleanTitle(title)}</span>
            </h2>
            <div className="title-underline"></div>
          </div>
          <a href="#" className="view-all flex items-center gap-1">
            Xem tất cả <ChevronRight size={16} />
          </a>
        </div>

        <div className="product-grid">
          {books.map((book) => (
            <ProductCard key={book.id} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductSection;
