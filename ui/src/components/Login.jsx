import React, { useState, useEffect } from 'react'; 
import { useDispatch, useSelector } from 'react-redux'; 
import { useNavigate, Link } from 'react-router-dom'; 
import { loginUser } from '../features/auth/authSlice'; // Import the loginUser thunk
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice'; 

import './login.css'; 

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

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

        // We don't need to add `dispatch` or `navigate` to the dependency array
        // because `dispatch` is stable and `navigate` is also stable.
        // `isAuthenticated` is the only state that changes and should trigger this effect.
    }, [isAuthenticated, navigate, dispatch]); // Add dispatch and navigate to dependencies for best practice

    // Effect to show error notifications
    useEffect(() => {
        if (error) {
            // Show an error notification using the message from the auth slice state
            dispatch(addNotification({
                message: `Login failed: ${error}`,
                type: NotificationType.ERROR,
                duration: 5000 
            }));
        }
    }, [error, dispatch]); // Re-run effect if error state or dispatch changes


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

    // Simple handlers for social login buttons (for now, just navigate to backend routes)
    const handleGoogleLogin = () => {
        window.location.href = '/api/auth/google'; // Navigate to your backend Google auth route
    };

    const handleFacebookLogin = () => {
        window.location.href = '/api/auth/facebook'; 
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
                    <button className="google-btn" onClick={handleGoogleLogin} disabled={isLoading}> {/* Disable while loading */}
                        <i className="fab fa-google"></i> Google Login
                    </button>
                    <button className="facebook-btn" onClick={handleFacebookLogin} disabled={isLoading}> {/* Disable while loading */}
                        <i className="fab fa-facebook-f"></i> Facebook Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Login;