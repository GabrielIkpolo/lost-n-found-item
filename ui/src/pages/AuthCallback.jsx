import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
// Assuming you'll add a new action to the authSlice to set state directly
import { setAuthState } from '../features/auth/authSlice'; 

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userDataString = params.get('user');
    const error = params.get('error'); 

    console.log('AuthCallback: Checking URL parameters...');
    console.log('AuthCallback: Token found:', !!token);
    console.log('AuthCallback: User data string found:', !!userDataString);
    console.log('AuthCallback: Error found:', error);


    if (token && userDataString) {
      try {
        const user = JSON.parse(decodeURIComponent(userDataString));

        console.log('AuthCallback: Extracted user data:', user);

        // Dispatch action to set auth state in Redux
        dispatch(setAuthState({ user, token })); // Dispatch the new action

        // Store in localStorage for persistence
        localStorage.setItem('accessToken', token);
        localStorage.setItem('user', JSON.stringify(user));

        console.log('AuthCallback: Auth state set, redirecting to homepage.');

        // Add success notification
        dispatch(addNotification({
            message: `Welcome, ${user.name}!`,
            type: NotificationType.SUCCESS,
            duration: 3000
        }));


        // Redirect to the home page or dashboard
        navigate('/', { replace: true }); // Use replace to avoid staying on the callback URL in history

      } catch (parseError) {
        console.error('AuthCallback: Failed to parse user data from URL:', parseError);
        dispatch(addNotification({
          message: 'Authentication failed due to data error.',
          type: NotificationType.ERROR,
          duration: 5000
        }));
        navigate('/login', { replace: true }); // Redirect to login on error
      }

    } else if (error) {
        // Handle errors passed via query params (e.g., from Passport failureRedirect)
         console.error('AuthCallback: Received error parameter:', error);
         let displayMessage = 'Authentication failed. Please try again.';
         if (error === 'auth_failed') {
             displayMessage = 'Authentication process failed.';
         } else {
             // Decode and display other potential error messages if backend sends them
             try {
                displayMessage = decodeURIComponent(error);
             } catch (decodeError) {
                 console.error('Failed to decode error message:', decodeError);
                 // Use default message
             }
         }
        dispatch(addNotification({
          message: displayMessage,
          type: NotificationType.ERROR,
          duration: 5000
        }));
        navigate('/login', { replace: true }); // Redirect to login on error

    } else {
      // If no token and no error, something is wrong or it's a direct visit
      console.warn('AuthCallback: Page accessed without expected query parameters. Redirecting to login.');
       dispatch(addNotification({
           message: 'Authentication callback failed.',
           type: NotificationType.ERROR,
           duration: 5000
       }));
        // Redirect to login as the callback URL is not meant for direct access
        navigate('/login', { replace: true });
    }
  }, [location, navigate, dispatch]); // Depend on location, navigate, and dispatch

  // This component doesn't need to render anything visible while it processes
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      Processing authentication...
    </div>
  );
};

export default AuthCallback;
