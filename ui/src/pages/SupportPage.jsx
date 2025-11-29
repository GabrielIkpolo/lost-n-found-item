import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchTickets } from '../features/support/supportSlice';
import './supportPage.css'; // We will create this CSS file next

const SupportPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { tickets, isLoading, error } = useSelector((state) => state.support);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchTickets());
  }, [dispatch]);

  const handleTicketClick = (ticketId) => {
    navigate(`/support/${ticketId}`);
  };

  if (isLoading) {
    return <div className="loading-container">Loading support tickets...</div>;
  }

  if (error) {
    return <div className="error-container">Error fetching tickets: {error}</div>;
  }

  return (
    <div className="support-page-container">
      <div className="support-header">
        <h1>My Support Tickets</h1>
        <Link to="/support/new" className="btn btn-primary">
          Create New Ticket
        </Link>
      </div>
      <div className="ticket-list">
        {tickets.length === 0 ? (
          <p>You have not created any support tickets yet.</p>
        ) : (
          tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`ticket-item ${ticket.status.toLowerCase()}`}
              onClick={() => handleTicketClick(ticket.id)}
            >
              <div className="ticket-info">
                <span className="ticket-subject">{ticket.subject}</span>
                <span className="ticket-date">
                  {new Date(ticket.updatedAt).toLocaleString()}
                </span>
              </div>
              <div className="ticket-status">
                <span>{ticket.status}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SupportPage;
