import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createTicket, clearCreateStatus } from '../features/support/supportSlice';
import './createTicketPage.css'; // We will create this CSS file next

const CreateTicketPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isCreating, createSuccess, createError } = useSelector((state) => state.support);

  const onSubmit = (data) => {
    dispatch(createTicket(data));
  };

  useEffect(() => {
    if (createSuccess) {
      navigate('/support');
    }
    // Cleanup function to clear the status when the component unmounts
    return () => {
      dispatch(clearCreateStatus());
    };
  }, [createSuccess, navigate, dispatch]);

  return (
    <div className="create-ticket-container">
      <h1>Create a New Support Ticket</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="ticket-form">
        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            id="subject"
            {...register('subject', { required: 'Subject is required' })}
            placeholder="e.g., Issue with a claimed item"
          />
          {errors.subject && <p className="error-message">{errors.subject.message}</p>}
        </div>
        <div className="form-group">
          <label htmlFor="message">Message</label>
          <textarea
            id="message"
            {...register('message', { required: 'Message is required' })}
            rows="8"
            placeholder="Please describe your issue in detail..."
          />
          {errors.message && <p className="error-message">{errors.message.message}</p>}
        </div>
        {createError && <p className="error-message server-error">{createError}</p>}
        <button type="submit" className="btn btn-primary" disabled={isCreating}>
          {isCreating ? 'Submitting...' : 'Submit Ticket'}
        </button>
      </form>
    </div>
  );
};

export default CreateTicketPage;
