import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser, clearRegistrationSuccess, clearAuthError } from '../features/auth/authSlice.js';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice.js';

import './register.css';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const dispatch = useDispatch();
    const { isLoading, error, registrationSuccess } = useSelector((state) => state.auth);

    const navigate = useNavigate();

    // Effect to show registration success notification and redirect
    useEffect(() => {
        if (registrationSuccess) {
            dispatch(addNotification({
                message: 'Registration successful! Please check your email to verify your account.',
                type: NotificationType.SUCCESS,
                duration: 8000 // Give user time to read instruction
            }));

            // Clear the success flag in state so the notification doesn't reappear on component re-render
            dispatch(clearRegistrationSuccess());

            // Redirect user to the login page after successful registration
            navigate('/login');
        }
    }, [registrationSuccess, dispatch, navigate]);


    // Effect to show error notifications (re-using the error state for both login and register)
    useEffect(() => {
        if (error) {
            // Show an error notification using the message from the auth slice state
            dispatch(addNotification({
                message: `Registration failed: ${error}`,
                type: NotificationType.ERROR,
                duration: 5000
            }));

            // Optionally clear the error state after showing it, if you don't want it to persist until next action
            dispatch(clearAuthError()); // You might add a clearError action to authSlice if needed
        }
    }, [error, dispatch]);


    const handleSubmit = (e) => {
        e.preventDefault();

        // Basic frontend validation 
        if (!name || !email || !password) {
            console.log('All fields are required.');
            dispatch(addNotification({
                message: 'Please fill in all fields',
                type: NotificationType.WARNING,
                duration: 3000
            }));

            return;
        }

        // Dispatches the registeruser async thunk
        dispatch(registerUser({ name, email, password }));
    };

    const backendUrl = import.meta.env.VITE_REACT_APP_API_BASE_URL;

    // Simple handlers for social login buttons (assuming they lead to registration if user doesn't exist)
    const handleGoogleRegister = () => {
        window.location.href = `${backendUrl}/api/auth/google`;
    }

    const handleFacebookRegister = () => {
        window.location.href = `${backendUrl}/api/auth/facebook`;
    };



    return (
        <div className="container">
            {/* Header for Login/Register */}
            <div className="login-header">
                <Link to="/login">Login</Link> |
                <Link to="/register">Register</Link>
            </div>

            {/* Form Section */}
            <div className="form-container">
                <h2>Register</h2>
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="name"
                        placeholder="Name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
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
                    <button type="submit" disabled={isLoading} >
                        {isLoading ? 'Registering ...' : 'Register'}
                    </button>
                </form>

                {/* TODO: Add Google/Facebook registration if different from login, otherwise omit */}
                <div className="social-login">

                    <button className="google-btn" onClick={handleGoogleRegister} disabled={isLoading}>
                        <i className="fab fa-google"></i> Register with Google
                    </button>

                    {/* <button className="facebook-btn" disabled={isLoading}>
                        <i className="fab fa-facebook-f"></i> Register with Facebook
                    </button> */}

                </div>

            </div>
        </div>
    );
};

export default Register;