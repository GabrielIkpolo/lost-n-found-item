import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
// Import the new thunk and clear action from authSlice
import { forgotPassword, clearForgotPasswordStatus } from '../features/auth/authSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

// Optional: Create and import a dedicated CSS file if needed, or reuse login.css/register.css structures
// import './forgotPasswordPage.css';
const ForgotPasswordPage = () => {
    const [email, setEmail] = useState('');

    const dispatch = useDispatch();
    // Select state related to the forgot password process
    const { isForgotPasswordLoading, forgotPasswordError, forgotPasswordSuccess } = useSelector((state) => state.auth);


    // --- Effect to handle successful request ---
    useEffect(() => {
        if (forgotPasswordSuccess) {
            console.log('Forgot password request successful.');
            // Show success notification
            dispatch(addNotification({
                message: 'If an account with that email exists, a password reset link has been sent.',
                type: NotificationType.SUCCESS,
                duration: 10000, 
            }));

            // Clear the status after showing notification
            dispatch(clearForgotPasswordStatus());

            // Optionally clear the email input
            setEmail('');

            // Optionally, redirect the user after a short delay
            // setTimeout(() => navigate('/login'), 5000); 
        }
    }, [forgotPasswordSuccess, dispatch]); 


    // --- Effect to handle request errors ---
    useEffect(() => {
        if (forgotPasswordError) {
            console.error('Forgot password request failed:', forgotPasswordError);
            // Show error notification
            dispatch(addNotification({
                message: `Password reset request failed: ${forgotPasswordError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Clear the status after showing notification
            dispatch(clearForgotPasswordStatus());
        }
    }, [forgotPasswordError, dispatch]);


    // --- Cleanup effect ---
    useEffect(() => {
      // Clear status state when the component unmounts
      return () => {
        dispatch(clearForgotPasswordStatus());
      };
    }, [dispatch]);


    // --- Form Submission Handler ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission

        // Basic validation
        if (!email) {
            dispatch(addNotification({
                message: 'Please enter your email address.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            return;
        }

        // Dispatch the forgotPassword async thunk
        console.log('Dispatching forgotPassword thunk.');
        dispatch(forgotPassword({ email }));

        // The success/error effects will handle notifications and state updates
    };


    return (
        // Reusing container and form-container classes from login/register styles
        <div className="container">
            <div className="login-header"> {/* Or create a new class like forgot-password-header */}
                <Link to="/login">Login</Link> |
                <Link to="/register">Register</Link>
            </div>

            <div className="form-container"> {/* Or create a new class */}
                <h2>Forgot Password</h2>
                {/* Optional: Display loading/error messages directly on the form */}
                {/* {isForgotPasswordLoading && <p style={{ textAlign: 'center' }}>Sending reset link...</p>} */}
                {/* {forgotPasswordError && <p style={{ color: 'red', textAlign: 'center' }}>Error: {forgotPasswordError}</p>} */}

                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email address"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isForgotPasswordLoading} // Disable input while loading
                    />
                    <button type="submit" disabled={isForgotPasswordLoading}>
                        {isForgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div style={{ marginTop: '15px', fontSize: '0.9em' }}>
                    <Link to="/login">Remember your password? Login here.</Link>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;