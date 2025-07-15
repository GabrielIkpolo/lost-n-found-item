import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

// import './adminDashboard.css';

const AdminDashboard = () => {
    // Get the logged-in user from auth state
    const { user, isAuthenticated } = useSelector((state) => state.auth);


    return (
        <div className="admin-dashboard-container" style={{ padding: '20px' }}>
            <h1>Admin Dashboard</h1>

            {/* Navigation for Admin sections */}
            <nav className="admin-nav" style={{ marginBottom: '20px', borderBottom: '1px solid #ccc', paddingBottom: '10px' }}> {/* Basic inline style */}
                <ul style={{ listStyle: 'none', padding: 0, display: 'flex', gap: '15px' }}> {/* Basic inline style */}

                    <li>
                        <Link to="/admin/users">Manage Users</Link>
                    </li>

                    {/* Add links to other admin sections as you create them */}
                    <li>
                        <Link to="/admin/items">Manage Items</Link>
                    </li>

                    {user?.role === 'SUPER_ADMIN' && (
                        <li>
                            <Link to="/admin/settings">System Settings</Link>
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