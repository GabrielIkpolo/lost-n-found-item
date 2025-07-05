import React from 'react'
// Import useDispatch to dispatch Redux actions
import { useDispatch } from 'react-redux';
// Import the addNotification action creator and NotificationType enum
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

import "./home.css";
import smallLogo from '../assets/images/logo-1.png'; // Keep if used elsewhere in Home
import FoundItems from '../components/FoundItems.jsx';


const Home = () => {
    // Get the dispatch function from the Redux store
    const dispatch = useDispatch();

    // Function to dispatch a success notification
    const handleSuccessClick = () => {
        dispatch(addNotification({
            message: 'Item reported successfully!',
            type: NotificationType.SUCCESS, // Use the SUCCESS type
            duration: 3000 // Auto-dismiss after 3 seconds
        }));
    };

    // Function to dispatch an error notification
    const handleErrorClick = () => {
        dispatch(addNotification({
            message: 'Failed to report item. Please try again.',
            type: NotificationType.ERROR, // Use the ERROR type
            duration: 5000 // Auto-dismiss after 5 seconds
        }));
    };

    // Function to dispatch an info notification
    const handleInfoClick = () => {
        dispatch(addNotification({
            message: 'You have a new message.',
            type: NotificationType.INFO, // Use the INFO type
            duration: 4000 // Auto-dismiss after 4 seconds
        }));
    };

     // Function to dispatch a warning notification
     const handleWarningClick = () => {
        dispatch(addNotification({
            message: 'Your session is about to expire!',
            type: NotificationType.WARNING, // Use the WARNING type
            duration: 6000 // Auto-dismiss after 6 seconds
        }));
    };


    return (
        <>
            {/* Add the test buttons */}
            {/* <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <button onClick={handleSuccessClick} style={{ margin: '0 5px' }}>Show Success Notification</button>
                <button onClick={handleErrorClick} style={{ margin: '0 5px' }}>Show Error Notification</button>
                <button onClick={handleInfoClick} style={{ margin: '0 5px' }}>Show Info Notification</button>
                <button onClick={handleWarningClick} style={{ margin: '0 5px' }}>Show Warning Notification</button>
            </div> */}

            {/* Keep the FoundItems component */}
            <FoundItems />
        </>
    )
}

export default Home