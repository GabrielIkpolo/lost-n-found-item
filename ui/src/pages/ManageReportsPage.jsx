import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchReports, dismissReport } from '../features/admin/adminSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import { Link } from 'react-router-dom';
import './manageReportsPage.css'; // Create css below

const ManageReportsPage = () => {
    const dispatch = useDispatch();
    const { reports, isLoading } = useSelector((state) => state.admin);

    useEffect(() => {
        dispatch(fetchReports());
    }, [dispatch]);

    const handleDismiss = async (reportId) => {
        if (window.confirm("Are you sure you want to dismiss this report?")) {
            const result = await dispatch(dismissReport(reportId));
            if (dismissReport.fulfilled.match(result)) {
                dispatch(addNotification({ message: 'Report dismissed.', type: NotificationType.SUCCESS }));
            }
        }
    };

    if (isLoading) return <div style={{textAlign: 'center', marginTop: '20px'}}>Loading reports...</div>;

    return (
        <div className="manage-reports-container">
            <h2>Reported Items</h2>
            {reports.length === 0 ? (
                <p>No active reports. Good job!</p>
            ) : (
                <table className="reports-table">
                    <thead>
                        <tr>
                            <th>Reason</th>
                            <th>Details</th>
                            <th>Reported By</th>
                            <th>Item</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((report) => (
                            <tr key={report.id}>
                                <td style={{ color: '#dc3545', fontWeight: 'bold' }}>{report.reason}</td>
                                <td>{report.details || 'N/A'}</td>
                                <td>{report.user?.name || 'Unknown'}</td>
                                <td>
                                    {report.item ? (
                                        <Link to={`/items/${report.item.id}`} target="_blank">
                                            {report.item.title}
                                        </Link>
                                    ) : (
                                        <em>Item Deleted</em>
                                    )}
                                </td>
                                <td>
                                    <button 
                                        className="btn-dismiss"
                                        onClick={() => handleDismiss(report.id)}
                                    >
                                        Dismiss Report
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default ManageReportsPage;