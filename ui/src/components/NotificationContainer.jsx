import React from 'react';
import { useSelector } from 'react-redux'; // To read state from Redux
import NotificationItem from './NotificationItem'; // Import the item component
import './notificationContainer.css'; 

const NotificationContainer = () => {
  // Select the notifications array from the Redux store state
  const notifications = useSelector(state => state.notifications.notifications);

  // If there are no notifications, don't render anything
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="notification-container">
      {/* Map over the notifications array and render a NotificationItem for each */}
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id} // Use unique ID as the key
          id={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;