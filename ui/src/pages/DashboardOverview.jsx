import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSystemStats } from '../features/admin/adminSlice';
import { FaUsers, FaBoxOpen, FaFlag, FaCheckCircle } from 'react-icons/fa'; 
import './dashboardOverview.css';

const DashboardOverview = () => {
    const dispatch = useDispatch();
    const { stats, isStatsLoading } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchSystemStats());
    }, [dispatch]);

    if (isStatsLoading) return <div className="loading-state">Loading dashboard analytics...</div>;
    if (!stats) return null;

    // Helper for category progress bar width
    const getPercent = (value) => {
        const total = stats.counts.items || 1;
        return Math.round((value / total) * 100);
    };

    return (
        <div className="overview-container">
            <h2>System Overview</h2>

            {/* Top Metrics Cards */}
            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon users"><FaUsers /></div>
                    <div className="metric-info">
                        <h3>{stats.counts.users}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon items"><FaBoxOpen /></div>
                    <div className="metric-info">
                        <h3>{stats.counts.items}</h3>
                        <p>Total Items Reported</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon reports"><FaFlag /></div>
                    <div className="metric-info">
                        <h3>{stats.counts.reports}</h3>
                        <p>Pending Reports</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon success"><FaCheckCircle /></div>
                    <div className="metric-info">
                        <h3>{stats.counts.successRate}%</h3>
                        <p>Success/Return Rate</p>
                    </div>
                </div>
            </div>

            <div className="charts-grid">
                {/* Category Distribution */}
                <div className="chart-card">
                    <h3>Items by Category</h3>
                    <div className="category-list">
                        {stats.categoryDistribution.map((cat) => (
                            <div key={cat.name} className="category-item">
                                <div className="cat-label">
                                    <span>{cat.name.replace(/_/g, ' ')}</span>
                                    <span>{cat.value}</span>
                                </div>
                                <div className="progress-bg">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${getPercent(cat.value)}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {stats.categoryDistribution.length === 0 && <p className="no-data">No items data available.</p>}
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="chart-card">
                    <h3>Item Status</h3>
                    <div className="status-grid">
                        {stats.statusDistribution.map((stat) => (
                            <div key={stat.name} className={`status-box ${stat.name.toLowerCase()}`}>
                                <h4>{stat.value}</h4>
                                <p>{stat.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Recent Activity Log */}
            <div className="recent-activity">
                <h3>Recent Activity</h3>
                <ul>
                    {stats.recentActivity.map((log) => (
                        <li key={log.id}>
                            <span className="log-action">{log.action.replace(/_/g, ' ')}</span>
                            <span className="log-detail">
                                {log.details} 
                                <span className="log-user"> — by {log.user?.name || 'System'}</span>
                            </span>
                            <span className="log-time">{new Date(log.timestamp).toLocaleDateString()}</span>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default DashboardOverview;