import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useForm } from 'react-hook-form';
import { fetchTicketById, replyToTicket, clearCurrentThread, clearReplyStatus } from '../features/support/supportSlice';
import './ticketDetailPage.css';

const TicketDetailPage = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { currentThread, isLoading, error, isReplying, replySuccess } = useSelector((state) => state.support);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchTicketById(id));

    // Cleanup when component unmounts
    return () => {
      dispatch(clearCurrentThread());
      dispatch(clearReplyStatus());
    };
  }, [id, dispatch]);

  useEffect(() => {
    // Reset the form after a successful reply
    if (replySuccess) {
      reset();
    }
  }, [replySuccess, reset]);

  const onReplySubmit = ({ message }) => {
    dispatch(replyToTicket({ ticketId: id, message }));
  };

  if (isLoading || !currentThread) {
    return <div className="loading-container">Loading conversation...</div>;
  }

  if (error) {
    return <div className="error-container">Error: {error}</div>;
  }

  return (
    <div className="ticket-detail-container">
      <Link to="/support" className="back-link">
        &larr; Back to Tickets
      </Link>
      <div className="ticket-header">
        <h2>{currentThread.subject}</h2>
        <span className={`status-badge ${currentThread.status.toLowerCase()}`}>
          {currentThread.status}
        </span>
      </div>
      <div className="message-list">
        {currentThread.messages.map((message) => (
          <div
            key={message.id}
            className={`message-item ${message.sender.role === 'ADMIN' || message.sender.role === 'SUPER_ADMIN' ? 'admin' : 'user'}`}
          >
            <div className="message-sender">
              <strong>{message.sender.name}</strong> ({message.sender.role})
            </div>
            <p className="message-content">{message.content}</p>
            <div className="message-timestamp">
              {new Date(message.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
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
    </div>
  );
};

export default TicketDetailPage;
