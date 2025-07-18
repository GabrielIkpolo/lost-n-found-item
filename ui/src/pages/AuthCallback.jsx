import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import { setAuthState } from '../features/auth/authSlice'; 
import { Navigate } from 'react-router-dom'; // Import the Navigate component

const AuthCallback = () => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // We still need navigate for error cases

  // Get isAuthenticated from Redux state
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Local state to track if we have processed the URL
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // Only process the URL once
    if (isProcessing) {
      const params = new URLSearchParams(location.search);
      const token = params.get('token');
      const userDataString = params.get('user');

      if (token && userDataString) {
        try {
          const user = JSON.parse(decodeURIComponent(userDataString));
          
          // Dispatch the action to set the auth state
          dispatch(setAuthState({ user, token }));

          // Store in localStorage for persistence
          localStorage.setItem('accessToken', token);
          localStorage.setItem('user', JSON.stringify(user));

          // We are done processing, set the flag to false
          setIsProcessing(false);

        } catch (parseError) {
          console.error('AuthCallback: Failed to parse user data:', parseError);
          dispatch(addNotification({ message: 'Authentication failed due to a data error.', type: NotificationType.ERROR }));
          setIsProcessing(false);
          navigate('/login', { replace: true }); // Navigate away on error
        }
      } else {
        // Handle cases where token/user is missing
        console.warn('AuthCallback: Page accessed without expected parameters.');
        dispatch(addNotification({ message: 'Invalid authentication callback.', type: NotificationType.ERROR }));
        setIsProcessing(false);
        navigate('/login', { replace: true }); // Navigate away on error
      }
    }
  }, [isProcessing, location, dispatch, navigate]);

  // --- This is the key change ---
  // If the state has updated and the user is now authenticated,
  // declaratively navigate to the home page.
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // While processing, show a loading message.
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      Processing authentication...
    </div>
  );
};

export default AuthCallback;
