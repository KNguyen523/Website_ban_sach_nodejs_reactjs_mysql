import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import Breadcrumb from '../components/common/Breadcrumb';
import { Calendar, User, Eye, Share2, Link as LinkIcon, ChevronLeft } from 'lucide-react';
import api, { getServerUrl } from '../utils/api';
import { toast } from 'react-toastify';
import './BlogPostPage.css';

const BlogPostPage = () => {
    const { slug } = useParams();
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState([]);

    useEffect(() => {
        const fetchPost = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/posts/${slug}`);
                if (res.data.success) {
                    setPost(res.data.data);
                    // Fetch other posts for "Related" section
                    const allRes = await api.get('/posts');
                    if (allRes.data.success) {
                        setRelatedPosts(allRes.data.data.filter(p => p.slug !== slug).slice(0, 3));
                    }
                }
            } catch (error) {
                toast.error('Không tìm thấy bài viết');
            } finally {
                setLoading(false);
            }
        };
        fetchPost();
        window.scrollTo(0, 0);
    }, [slug]);

    if (loading) return (
        <div className="post-page-container">
            <Header />
            <div className="post-main" style={{ textAlign: 'center', padding: '100px 20px' }}>Đang tải bài viết...</div>
            <Footer />
        </div>
    );

    if (!post) return (
        <div className="post-page-container">
            <Header />
            <div className="post-main" style={{ textAlign: 'center', padding: '100px 20px' }}>Không tìm thấy bài viết</div>
            <Footer />
        </div>
    );

    return (
        <div className="post-page-container">
            <Header />
            <Breadcrumb items={[
                { label: 'Tin tức & Blog', link: '/blog' },
                { label: post.title }
            ]} />
            
            <main className="post-main">
                <article>
                    {/* Header */}
                    <div className="post-header">
                        <span className="post-category-tag">
                            Tin tức & Sự kiện
                        </span>
                        <h1 className="post-title">
                            {post.title}
                        </h1>
                        <div className="post-meta">
                            <div className="post-meta-item">
                                <Calendar size={16} />
                                {new Date(post.created_at).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="post-meta-item">
                                <User size={16} />
                                Hanoi Bookstore
                            </div>
                            <div className="post-meta-item">
                                <Eye size={16} />
                                {post.view_count} lượt xem
                            </div>
                        </div>
                    </div>

                    {/* Featured Image */}
                    <div className="post-featured-image-wrapper">
                        <img 
                            src={post.thumbnail ? (post.thumbnail.startsWith('http') ? post.thumbnail : `${getServerUrl()}${post.thumbnail}`) : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000'} 
                            alt={post.title}
                            className="post-featured-image"
                        />
                    </div>

                    {/* Content */}
                    <div className="post-content-body">
                        <div dangerouslySetInnerHTML={{ __html: post.content }} />
                    </div>

                    {/* Footer / Share */}
                    <div className="post-footer-actions">
                        <div className="share-section">
                            <span className="share-label">Chia sẻ:</span>
                            <button className="share-btn" title="Facebook">
                                <Share2 size={18} />
                            </button>
                            <button className="share-btn" title="Twitter">
                                <Share2 size={18} />
                            </button>
                            <button className="share-btn" title="Copy Link">
                                <LinkIcon size={18} />
                            </button>
                        </div>
                        <Link to="/blog" className="back-to-list-link">
                            <ChevronLeft size={20} /> Quay lại danh sách
                        </Link>
                    </div>
                </article>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <div className="related-posts-section">
                        <h3>Bài viết liên quan</h3>
                        <div className="related-posts-grid">
                            {relatedPosts.map(p => (
                                <Link key={p.id} to={`/blog/${p.slug}`} className="related-post-card">
                                    <div className="related-post-image-wrapper">
                                        <img 
                                            src={p.thumbnail ? (p.thumbnail.startsWith('http') ? p.thumbnail : `${getServerUrl()}${p.thumbnail}`) : 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000'} 
                                            alt={p.title}
                                            className="related-post-image"
                                        />
                                    </div>
                                    <h4 className="related-post-title">
                                        {p.title}
                                    </h4>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default BlogPostPage;
