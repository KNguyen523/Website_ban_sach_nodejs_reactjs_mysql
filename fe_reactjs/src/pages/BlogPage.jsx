import React, { useState, useEffect } from 'react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Breadcrumb from '../components/common/Breadcrumb';
import { Calendar, User, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import api, { getServerUrl } from '../utils/api';
import './BlogPage.css';

const BlogPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await api.get('/posts');
                if (res.data.success) {
                    setPosts(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="blog-page-container">
            <Header />
            <Breadcrumb items={[{ label: 'Tin tức & Blog' }]} />
            
            <main className="blog-main">
                <div className="blog-header-row">
                    <div>
                        <h1>Tin tức & Blog</h1>
                        <p>Cập nhật tin mới nhất về sách và văn hóa đọc</p>
                    </div>
                    <div className="blog-search-wrapper">
                        <Search className="blog-search-icon" size={20} />
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm bài viết..."
                            className="blog-search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="blog-skeleton-grid">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="blog-skeleton-card">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-line three-quarter"></div>
                                <div className="skeleton-line full"></div>
                                <div className="skeleton-line half"></div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {filteredPosts.length === 0 ? (
                            <div className="blog-empty-state">
                                <p>Không tìm thấy bài viết nào phù hợp.</p>
                            </div>
                        ) : (
                            <div className="blog-grid">
                                {filteredPosts.map(post => (
                                    <article key={post.id} className="blog-card">
                                        <Link to={`/blog/${post.slug}`} className="blog-card-image-link">
                                            <img 
                                                src={post.thumbnail ? (post.thumbnail.startsWith('http') ? post.thumbnail : `${getServerUrl()}${post.thumbnail}`) : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000'} 
                                                alt={post.title}
                                                className="blog-card-image"
                                            />
                                            <div className="blog-card-badge">
                                                Tin tức
                                            </div>
                                        </Link>
                                        <div className="blog-card-body">
                                            <div className="blog-card-meta">
                                                <div className="meta-item">
                                                    <Calendar size={14} />
                                                    {new Date(post.created_at).toLocaleDateString('vi-VN')}
                                                </div>
                                                <div className="meta-item">
                                                    <User size={14} />
                                                    Hanoi Bookstore
                                                </div>
                                            </div>
                                            <Link to={`/blog/${post.slug}`} className="blog-card-title-link">
                                                <h2 className="blog-card-title">
                                                    {post.title}
                                                </h2>
                                            </Link>
                                            <p className="blog-card-summary">
                                                {post.summary}
                                            </p>
                                            <Link 
                                                to={`/blog/${post.slug}`} 
                                                className="blog-card-readmore"
                                            >
                                                Đọc thêm <ArrowRight size={18} />
                                            </Link>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Newsletter Section */}
                <div className="newsletter-section">
                    <div className="newsletter-content">
                        <h2>Đăng ký nhận bản tin</h2>
                        <p>Nhận những cập nhật mới nhất về các đầu sách hot và chương trình khuyến mãi đặc biệt.</p>
                        <form className="newsletter-form" onSubmit={(e) => e.preventDefault()}>
                            <input 
                                type="email" 
                                placeholder="Nhập email của bạn"
                                className="newsletter-input"
                                required
                            />
                            <button type="submit" className="newsletter-button">
                                Đăng ký ngay
                            </button>
                        </form>
                    </div>
                    <div className="newsletter-bg-decor-1"></div>
                    <div className="newsletter-bg-decor-2"></div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default BlogPage;
