import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { loginUser } from '../features/auth/authSlice'; // Import the loginUser thunk
import { addNotification, clearAllNotifications, NotificationType } from '../features/notifications/notificationsSlice';
import { axiosInstance } from '../util/axiosInstance';

import './login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // state to toggle the Resend button
    const [showResend, setShowResend] = useState(false);
    const [isResending, setIsResending] = useState(false);

    const dispatch = useDispatch();
    // Select state from the Redux auth slice
    const { isLoading, error, isAuthenticated } = useSelector((state) => state.auth);

    const navigate = useNavigate();

    // Effect to redirect after successful login
    useEffect(() => {
        if (isAuthenticated) {
            // Redirect to home page 
            navigate('/');
            // Optionally show a success notification
            dispatch(addNotification({
                message: 'Login successful!',
                type: NotificationType.SUCCESS
            }));


        }
    }, [isAuthenticated, navigate, dispatch]);

  
    // Effect to handle errors
    useEffect(() => {
        if (error) {
            // Check if the error is specifically about verification
            if (error.toLowerCase().includes('verify your email')) {
                setShowResend(true); // Show the button
            } else {
                setShowResend(false);
            }

            dispatch(addNotification({
                message: `Login failed: ${error}`,
                type: NotificationType.ERROR,
                duration: 5000
            }));
        }
    }, [error, dispatch]);


    // On email varification success for google strategy
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('verified')) {
            dispatch(addNotification({
                message: 'Email verified successfully! You can now log in.',
                type: NotificationType.SUCCESS
            }));
            // Optionally clear the query parameter after showing the notification
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [dispatch]);



    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission

        // Basic validation before dispatching
        if (!email || !password) {
            dispatch(addNotification({
                message: 'Please enter both email and password.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            return;
        }
        // Dispatch the loginUser async thunk with credentials
        dispatch(loginUser({ email, password }));
    };



    // ---  Resend Verification ---
    const handleResendVerification = async () => {
        if (!email) return;
        setIsResending(true);
        try {
            await axiosInstance.post('/api/auth/resend-verification', { email });
            dispatch(addNotification({
                message: 'Verification email resent! Please check your inbox.',
                type: NotificationType.SUCCESS
            }));
            setShowResend(false); // Hide button after success
        } catch (err) {
            const msg = err.response?.data?.error || 'Failed to resend verification.';
            dispatch(addNotification({ message: msg, type: NotificationType.ERROR }));
        } finally {
            setIsResending(false);
        }
    };


    // The full URL of our backend server
    const backendUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;

    // Simple handlers for social login buttons (for now, just navigate to backend routes)
    const handleGoogleLogin = () => {
        window.location.href = `${backendUrl}/api/auth/google`; // Navigate to your backend Google auth route
    };

    const handleFacebookLogin = () => {
        window.location.href = `${backendUrl}/api/auth/facebook`;
    };


    return (
        <div className="container">
            <div className="login-header">
                <Link to="/login">Login</Link> |
                <Link to="/register">Register</Link>
            </div>

            {/* Form Section */}
            <div className="form-container">
                <h2>Login</h2>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

                {/* --- Conditional Resend Button --- */}
                {showResend && (
                    <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px' }}>
                        <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#856404' }}>
                            Account not verified?
                        </p>
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            disabled={isResending}
                            style={{ backgroundColor: '#856404', padding: '8px', fontSize: '0.9rem' }}
                        >
                            {isResending ? 'Sending...' : 'Resend Verification Email'}
                        </button>
                    </div>
                )}


                <form onSubmit={handleSubmit}>
                    <input
                        type="email"
                        name="email"
                        placeholder="Email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit" disabled={isLoading}> {/* Disable button while loading */}
                        {isLoading ? 'Logging in...' : 'Login'} {/* Change text while loading */}
                    </button>
                </form>

                {/* Forgot Password Link */}
                <div style={{ marginTop: '10px', fontSize: '0.9em' }}>
                    <Link to="/forgot-password">Forgot Password?</Link>
                </div>


                {/* Social Login */}
                <div className="social-login">
                    <button className="google-btn" onClick={handleGoogleLogin} disabled={isLoading}>
                        <i className="fab fa-google"></i> Google Login
                    </button>
                    {/* <button className="facebook-btn" onClick={handleFacebookLogin} disabled={isLoading}> 
                        <i className="fab fa-facebook-f"></i> Facebook Login
                    </button> */}
                </div>
            </div>
        </div>
    );
};

export default Login;