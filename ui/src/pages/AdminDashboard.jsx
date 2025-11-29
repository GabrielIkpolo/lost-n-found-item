import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom'; // Import useLocation to check active route
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

import './adminDashboard.css';

const AdminDashboard = () => {
    // Get the logged-in user from auth state
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const location = useLocation(); // Get current location

    // 1. Authorization check:
    if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
        return <Navigate to="/" replace />;
    }

    // Helper function to determine if a link is active
    const getLinkClass = (path) => {
        return location.pathname.startsWith(path) ? 'active' : '';
    };

    return (
        <div className="admin-dashboard-container">
            <h1>Admin Dashboard</h1>
            <p>Welcome, {user.name} ({user.role})</p>

            {/* Navigation for Admin sections */}
            <nav className="admin-nav">
                <ul>

                    <li>
                        {/* Use /admin/users as the index/default admin page, or use /admin if you set an index route */}
                        <Link to="/admin/users" className={getLinkClass('/admin/users')}>Manage Users</Link>
                    </li>

                    <li>
                        <Link to="/admin/items" className={getLinkClass('/admin/items')}>Manage Items</Link>
                    </li>

                    {/* NEW: Link for managing support tickets */}
                    <li>
                        <Link to="/admin/tickets" className={getLinkClass('/admin/tickets')}>Manage Tickets</Link>
                    </li>


                    {user?.role === 'SUPER_ADMIN' && (
                        <li>
                            <Link to="/admin/settings" className={getLinkClass('/admin/settings')}>System Settings</Link>
                        </li>
                    )}

                </ul>
            </nav>

            {/* Renders nested routes (Manage Users, Manage Items etc.) */}
            <div className="admin-content">
                <Outlet />
            </div>

        </div>
    );
};

export default AdminDashboard;