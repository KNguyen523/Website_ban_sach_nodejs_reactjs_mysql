import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    DollarSign,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    RefreshCw,
    ShoppingBasket,
    Award,
    CheckCircle2,
    AlertTriangle,
    Crown
} from 'lucide-react';
import { getServerUrl } from '../../utils/api';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import api from '../../utils/api';
import './Dashboard.css';

const StatCard = ({ title, value, icon, color, loading }) => (
    <div className="stat-card glass">
        <div className="stat-header">
            <div className={`icon-box ${color}`}>{icon}</div>
        </div>
        <div className="stat-body">
            {loading ? <div className="loading-shimmer" style={{ height: '32px', width: '100px', marginBottom: '8px' }}></div> : <h3>{value}</h3>}
            <p>{title}</p>
        </div>
    </div>
);

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState('all');

    const fetchStats = async (range = timeRange) => {
        setLoading(true);
        try {
            const res = await api.get(`/dashboard/stats?range=${range}`);
            if (res.data.success) {
                setStats(res.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải dữ liệu dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, []);

    const handleRangeChange = (e) => {
        const newRange = e.target.value;
        setTimeRange(newRange);
        fetchStats(newRange);
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-title">
                <div>
                    <h1>Tổng quan hệ thống</h1>
                    <p>Chào mừng bạn quay trở lại, đây là những gì đang diễn ra trong hệ thống.</p>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <select 
                        className="glass-select" 
                        value={timeRange} 
                        onChange={handleRangeChange}
                        style={{ height: '44px', padding: '0 1rem', borderRadius: '12px' }}
                    >
                        <option value="all">Tất cả thời gian</option>
                        <option value="today">Hôm nay</option>
                        <option value="7days">7 ngày qua</option>
                        <option value="30days">30 ngày qua</option>
                        <option value="thisMonth">Tháng này</option>
                    </select>
                    <button className="refresh-btn" onClick={() => fetchStats()} disabled={loading}>
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="stats-grid">
                <StatCard
                    title="Tổng doanh thu"
                    value={stats ? formatPrice(stats.totalRevenue) : '0đ'}
                    icon={<DollarSign size={24} />}
                    color="blue"
                    loading={loading}
                />
                <StatCard
                    title="Lợi nhuận (đơn hoàn thành)"
                    value={stats ? formatPrice(stats.profit) : '0đ'}
                    icon={<TrendingUp size={24} />}
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="Tổng số đơn hàng"
                    value={stats ? stats.totalOrders : '0'}
                    icon={<ShoppingBag size={24} />}
                    color="purple"
                    loading={loading}
                />
                <StatCard
                    title="Đơn đã hoàn thành"
                    value={stats ? stats.completedOrders : '0'}
                    icon={<CheckCircle2 size={24} />}
                    color="emerald"
                    loading={loading}
                />
                <StatCard
                    title="Sách đã bán"
                    value={stats ? stats.totalSold : '0'}
                    icon={<ShoppingBasket size={24} />}
                    color="green"
                    loading={loading}
                />
                <StatCard
                    title="Tồn kho hiện tại"
                    value={stats ? stats.totalStock : '0'}
                    icon={<Package size={24} />}
                    color="orange"
                    loading={loading}
                />
            </div>

            <div className="dashboard-grid mt-8">
                <div className="grid-item glass col-span-2">
                    <div className="card-header">
                        <h3>Tỷ lệ sản phẩm bán chạy</h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Phân bổ theo 5 sản phẩm có lượt bán cao nhất</p>
                    </div>
                    <div className="chart-container" style={{ height: '350px', width: '100%' }}>
                        {loading ? (
                            <div className="flex items-center justify-center h-full">Đang tải biểu đồ...</div>
                        ) : stats?.topProducts.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.topProducts}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => {
                                            const displayName = name.length > 20 ? name.substring(0, 20) + '...' : name;
                                            return `${displayName} (${(percent * 100).toFixed(0)}%)`;
                                        }}
                                    >
                                        {stats.topProducts.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-500">Chưa có dữ liệu bán hàng</div>
                        )}
                    </div>
                </div>

                <div className="grid-item glass">
                    <div className="card-header">
                        <h3>Đơn hàng mới nhất</h3>
                    </div>
                    <div className="recent-list">
                        {loading ? (
                            [1,2,3,4,5].map(i => <div key={i} className="loading-shimmer mb-4" style={{ height: '50px', borderRadius: '12px' }}></div>)
                        ) : stats?.recentOrders.length > 0 ? stats.recentOrders.map((order, i) => (
                            <div key={i} className="list-item">
                                <div className="item-info">
                                    <span className="item-id">#{order.order_code}</span>
                                    <span className="item-user">{order.user_name || order.receiver_name}</span>
                                </div>
                                <div className="item-meta">
                                    <span className={`status-pill ${order.status}`}>
                                        {order.status === 'pending' ? 'Chờ duyệt' : 
                                         order.status === 'confirmed' ? 'Đã xác nhận' :
                                         order.status === 'shipping' ? 'Đang giao' : 'Hoàn thành'}
                                    </span>
                                    <span className="item-price">{formatPrice(order.final_amount)}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-500">Chưa có đơn hàng nào</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="dashboard-grid dashboard-grid-2col mt-8">
                <div className="grid-item glass">
                    <div className="card-header">
                        <h3><Crown size={18} style={{ display: 'inline', marginRight: 6, color: '#f59e0b' }} /> Top 5 khách hàng</h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8' }}>Khách có số đơn đã hoàn thành cao nhất</p>
                    </div>
                    <div className="recent-list">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <div key={i} className="loading-shimmer mb-4" style={{ height: '50px', borderRadius: '12px' }}></div>)
                        ) : stats?.topCustomers?.length > 0 ? stats.topCustomers.map((c, i) => (
                            <div key={c.id} className="top-customer-row">
                                <div className="top-rank">#{i + 1}</div>
                                <div className="top-customer-avatar">
                                    {c.avatar ? (
                                        <img src={`${getServerUrl()}${c.avatar}`} alt={c.full_name} />
                                    ) : (
                                        <span>{(c.full_name || 'U').charAt(0).toUpperCase()}</span>
                                    )}
                                </div>
                                <div className="top-customer-info">
                                    <span className="top-customer-name">{c.full_name || 'Khách'}</span>
                                    <span className="top-customer-email">{c.email}</span>
                                </div>
                                <div className="top-customer-meta">
                                    <span className="top-customer-orders">{c.completed_orders} đơn</span>
                                    <span className="top-customer-spent">{formatPrice(c.total_spent)}</span>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-500">Chưa có dữ liệu</div>
                        )}
                    </div>
                </div>

                <div className="grid-item glass">
                    <div className="card-header">
                        <h3><AlertTriangle size={18} style={{ display: 'inline', marginRight: 6, color: '#ef4444' }} /> Sản phẩm chậm bán</h3>
                        <p style={{ fontSize: '13px', color: '#94a3b8' }}>5 sản phẩm chưa từng có trong đơn hàng</p>
                    </div>
                    <div className="recent-list">
                        {loading ? (
                            [1, 2, 3, 4, 5].map(i => <div key={i} className="loading-shimmer mb-4" style={{ height: '50px', borderRadius: '12px' }}></div>)
                        ) : stats?.coldProducts?.length > 0 ? stats.coldProducts.map((p) => (
                            <div key={p.id} className="cold-product-row">
                                <div className="cold-product-img">
                                    {p.thumbnail ? (
                                        <img src={`${getServerUrl()}${p.thumbnail}`} alt={p.title} />
                                    ) : (
                                        <Package size={20} />
                                    )}
                                </div>
                                <div className="cold-product-info">
                                    <span className="cold-product-title">{p.title}</span>
                                    <span className="cold-product-meta">Tồn kho: {p.stock_quantity}</span>
                                </div>
                                <div className="cold-product-price">{formatPrice(p.price)}</div>
                            </div>
                        )) : (
                            <div className="text-center py-8 text-gray-500">Tất cả sản phẩm đều đã được bán</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
