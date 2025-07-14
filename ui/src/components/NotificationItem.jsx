import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { removeNotification } from '../features/notifications/notificationsSlice';
import './notificationItem.css'; 

// Define the props the component expects
const NotificationItem = ({ id, message, type, duration }) => {
  const dispatch = useDispatch();

  // Effect to automatically remove the notification after 'duration'
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        dispatch(removeNotification(id)); // Dispatch remove action with its ID
      }, duration);

      // Cleanup function: Clear the timer if the component is unmounted
      // before the timer finishes (e.g., if the user manually closes it)
      return () => {
        clearTimeout(timer);
      };
    }
    // No cleanup needed if duration is 0 (manual dismissal only)
    return undefined; // Return undefined if no cleanup is necessary
  }, [dispatch, duration, id]); // Re-run effect if dispatch, duration, or id changes

  // Function to manually remove the notification (e.g., on click)
  const handleClose = () => {
    dispatch(removeNotification(id));
  };

  // Determine CSS class based on notification type
  const typeClass = `notification-${type}`; // e.g., 'notification-success', 'notification-error'

  return (
    <div className={`notification-item ${typeClass}`} onClick={handleClose}>
      <p>{message}</p>
      {/* Optional: Add a close button if not auto-dismissing or if clickable dismissal isn't desired */}
      <button className="close-button" onClick={handleClose}>&times;</button>
    </div>
  );
};

export default NotificationItem;

