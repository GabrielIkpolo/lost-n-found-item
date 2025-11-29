import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTickets, updateTicketStatus, clearUpdateStatus } from '../features/support/supportSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import './manageTicketsPage.css'; // The new CSS file

const ManageTicketsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // Select state from the support slice
    const { 
        tickets, 
        isLoading, 
        error, 
        isUpdatingStatus, 
        updateStatusError, 
        updateStatusSuccess 
    } = useSelector((state) => state.support);

    // Initial fetch of all tickets (for admin view)
    useEffect(() => {
        // fetchTickets will fetch all tickets if the user is an admin (handled in backend)
        dispatch(fetchTickets());
    }, [dispatch]);

    // Handle ticket status update success/error
    useEffect(() => {
        if (updateStatusSuccess) {
            // Re-fetch tickets to ensure list is fresh, or rely on redux update logic
            // We rely on redux update logic in supportSlice, but a re-fetch can ensure consistency.
            // For now, let's just clear status and dispatch a notification.
            dispatch(addNotification({ message: 'Ticket status updated successfully!', type: NotificationType.SUCCESS }));
            dispatch(clearUpdateStatus()); 
            // Optional: dispatch(fetchTickets()); if relying on local state update is risky
        }
        if (updateStatusError) {
            dispatch(addNotification({ message: `Status update failed: ${updateStatusError}`, type: NotificationType.ERROR }));
            dispatch(clearUpdateStatus());
        }
    }, [updateStatusSuccess, updateStatusError, dispatch]);


    const handleTicketClick = (ticketId) => {
        // Navigate to the detail page for admin to view/reply
        navigate(`/admin/tickets/${ticketId}`);
    };

    const handleUpdateStatus = (ticketId, currentStatus, event) => {
        // Prevent the ticket click handler from firing
        event.stopPropagation();

        const newStatus = currentStatus === 'OPEN' ? 'CLOSED' : 'OPEN';
        
        const isConfirmed = window.confirm(`Are you sure you want to change the status of this ticket to "${newStatus}"?`);

        if (isConfirmed && !isUpdatingStatus) {
            dispatch(updateTicketStatus({ ticketId, status: newStatus }));
        }
    };

    if (isLoading) {
        return <div className="loading-container">Loading all support tickets...</div>;
    }

    if (error) {
        return <div className="error-container">Error fetching tickets: {error}</div>;
    }

    // Filter and sort tickets: Open first, then Closed, both by updatedAt descending
    const sortedTickets = [...tickets]
        .sort((a, b) => {
            if (a.status === 'OPEN' && b.status === 'CLOSED') return -1;
            if (a.status === 'CLOSED' && b.status === 'OPEN') return 1;
            // Within the same status, sort by updated date descending
            return new Date(b.updatedAt) - new Date(a.updatedAt);
        });

    return (
        <div className="manage-tickets-page-container">
            <div className="manage-tickets-header">
                <h1>Manage Support Tickets</h1>
                {/* Optional: Add a link to create a test ticket or filter options */}
            </div>
            
            {sortedTickets.length === 0 ? (
                <p>No support tickets found in the system.</p>
            ) : (
                <div className="ticket-list">
                    {sortedTickets.map((ticket) => (
                        <div
                            key={ticket.id}
                            className={`ticket-item ${ticket.status.toLowerCase()}`}
                            onClick={() => handleTicketClick(ticket.id)}
                        >
                            <div className="ticket-info">
                                <span className="ticket-subject">{ticket.subject}</span>
                                <span className="ticket-user">Reported by: {ticket.user.name} ({ticket.user.email})</span>
                                <span className="ticket-date">
                                    Last Update: {new Date(ticket.updatedAt).toLocaleString()}
                                </span>
                            </div>
                            <div className="ticket-status">
                                <span className="status-badge">
                                    {ticket.status}
                                </span>
                            </div>
                            <button 
                                className={`btn btn-secondary ${ticket.status === 'CLOSED' ? 'btn-open' : 'btn-close'}`}
                                onClick={(e) => handleUpdateStatus(ticket.id, ticket.status, e)}
                                disabled={isUpdatingStatus}
                            >
                                {ticket.status === 'CLOSED' ? 'Re-open' : 'Close Ticket'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManageTicketsPage;