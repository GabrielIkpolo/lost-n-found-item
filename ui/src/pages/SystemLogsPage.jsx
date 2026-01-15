import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAuditLogs } from '../features/admin/adminSlice';
import { Navigate } from 'react-router-dom';
import './systemLogsPage.css'; // We'll create this CSS next

const SystemLogsPage = () => {
    const dispatch = useDispatch();
    const { logs, pagination, isLoading, error } = useSelector((state) => state.admin);
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
            dispatch(fetchAuditLogs(1)); // Fetch page 1 on mount
        }
    }, [dispatch, isAuthenticated, user]);

    const handlePageChange = (newPage) => {
        dispatch(fetchAuditLogs(newPage));
    };

    // Security check
    if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
        return <Navigate to="/admin" replace />;
    }

    // Helper to format enum string to readable text
    const formatAction = (action) => {
        return action.replace(/_/g, ' ');
    };

    return (
        <div className="logs-container">
            <div className="logs-header">
                <h2>System Audit Logs</h2>
                <button onClick={() => dispatch(fetchAuditLogs(pagination.currentPage))} className="refresh-btn">
                    Refresh
                </button>
            </div>

            {isLoading && <div className="loading-state">Loading logs...</div>}
            
            {error && <div className="error-state">{error}</div>}

            {!isLoading && logs.length === 0 ? (
                <p>No logs found.</p>
            ) : (
                <div className="table-responsive">
                    <table className="logs-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>Action</th>
                                <th>User</th>
                                <th>Details</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id}>
                                    <td className="col-date">
                                        {new Date(log.timestamp).toLocaleString()}
                                    </td>
                                    <td>
                                        <span className={`badge ${log.action.split('_')[0].toLowerCase()}`}>
                                            {formatAction(log.action)}
                                        </span>
                                    </td>
                                    <td>
                                        {log.user ? (
                                            <div className="user-cell">
                                                <span className="user-name">{log.user.name}</span>
                                                <span className="user-email">{log.user.email}</span>
                                            </div>
                                        ) : (
                                            <span className="system-user">System/Guest</span>
                                        )}
                                    </td>
                                    <td className="col-details">{log.details}</td>
                                    <td>{log.ipAddress || 'N/A'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
                <div className="pagination">
                    <button 
                        disabled={pagination.currentPage === 1}
                        onClick={() => handlePageChange(pagination.currentPage - 1)}
                    >
                        Previous
                    </button>
                    <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
                    <button 
                        disabled={pagination.currentPage === pagination.totalPages}
                        onClick={() => handlePageChange(pagination.currentPage + 1)}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
};

export default SystemLogsPage;