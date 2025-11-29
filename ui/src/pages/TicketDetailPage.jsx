import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { fetchTicketById, replyToTicket, clearCurrentThread, clearReplyStatus, updateTicketStatus, clearUpdateStatus } from '../features/support/supportSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice'; // Import notifications
import './ticketDetailPage.css';

const TicketDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const {
    currentThread, isLoading, error,
    isReplying, replySuccess,
    isUpdatingStatus, updateStatusSuccess, updateStatusError
  } = useSelector((state) => state.support);
  const { user } = useSelector((state) => state.auth);

  // Determine if the logged-in user is an Admin/Super Admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';


  useEffect(() => {
    dispatch(fetchTicketById(id));

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentThread());
      dispatch(clearReplyStatus());
      dispatch(clearUpdateStatus()); // Clear status update state
    };
  }, [id, dispatch]);

  useEffect(() => {
    // Reset the form after a successful reply
    if (replySuccess) {
      reset();
    }
  }, [replySuccess, reset]);

  // Handle status update success/error
  useEffect(() => {
    if (updateStatusSuccess || updateStatusError) {
      // Dispatch notification handled in supportSlice
      dispatch(clearUpdateStatus());
      // Re-fetch the ticket to get the absolute latest state (optional, as slice handles state update)
      // dispatch(fetchTicketById(id));
    }
  }, [updateStatusSuccess, updateStatusError, dispatch]);

  const onReplySubmit = ({ message }) => {
    dispatch(replyToTicket({ ticketId: id, message }));
  };

  const handleUpdateStatus = () => {
    if (!currentThread || isUpdatingStatus) return;

    // Determine the new status
    const newStatus = currentThread.status === 'OPEN' ? 'CLOSED' : 'OPEN';

    // Admin check is implicit as only admin sees the button, but good to be safe
    if (isAdmin) {
        dispatch(updateTicketStatus({ ticketId: id, status: newStatus }));
    }
  };


  if (isLoading || !currentThread) {
    return <div className="loading-container">Loading conversation...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  // Determine if the reply section should be shown
  const canReply = currentThread.status === 'OPEN' || isAdmin;


  return (
    <div className="ticket-detail-container">
      <Link to={isAdmin ? "/admin/tickets" : "/support"} className="back-link">
        &larr; Back to {isAdmin ? 'Admin Tickets' : 'My Tickets'}
      </Link>
      <div className="ticket-header">
        <h2>{currentThread.subject}</h2>
        <span className={`status-badge ${currentThread.status.toLowerCase()}`}>
          {currentThread.status}
        </span>
        {isAdmin && (
            <button
                className={`btn btn-secondary status-toggle-button ${currentThread.status === 'CLOSED' ? 'btn-open' : 'btn-close'}`}
                onClick={handleUpdateStatus}
                disabled={isUpdatingStatus}
            >
                {isUpdatingStatus
                    ? `Changing to ${currentThread.status === 'OPEN' ? 'CLOSED' : 'OPEN'}...`
                    : (currentThread.status === 'CLOSED' ? 'Re-open' : 'Close Ticket')}
            </button>
        )}
      </div>
      <div className="message-list">
        {currentThread.messages.map((message) => (
          <div
            key={message.id}
            className={`message-item ${message.sender.role === 'ADMIN' || message.sender.role === 'SUPER_ADMIN' ? 'admin' : 'user'}`}
          >
            <div className="message-sender">
              {/* <strong>{message.sender.name}</strong> ({message.sender.role}) */}
              <strong>{message.sender.name}</strong>
    </div>
            <p className="message-content">{message.content}</p>
            <div className="message-timestamp">
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
      {canReply && ( // Only show reply section if canReply is true
        <div className="reply-section">
          <h3>Reply to this Ticket</h3>
          <form onSubmit={handleSubmit(onReplySubmit)} className="reply-form">
            <textarea
              {...register('message', { required: 'Reply message cannot be empty' })}
              rows="5"
              placeholder="Type your message here..."
              disabled={isReplying}
            />
            {errors.message && <p className="error-message">{errors.message.message}</p>}
            <button type="submit" className="btn btn-primary" disabled={isReplying}>
              {isReplying ? 'Sending...' : 'Send Reply'}
            </button>
          </form>
        </div>
      )}
      {!canReply && !isAdmin && ( // Show a message if the ticket is closed and user is not an Admin
        <div className="closed-ticket-message">
            <p>This ticket is currently closed. If your issue persists, please create a new ticket.</p>
        </div>
      )}
    </div>
  );
};

export default TicketDetailPage;

