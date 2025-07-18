import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// Import the new resetPassword thunk and clear action from authSlice
import { resetPassword, clearResetPasswordStatus } from '../features/auth/authSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

// import './resetPasswordPage.css';

const ResetPasswordPage = () => {
    // Get the reset token from the URL parameters
    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    // State for form inputs
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Select state related to the reset password process
    const { isResettingPassword, resetPasswordError,
        resetPasswordSuccess, isAuthLoading } = useSelector((state) => state.auth);

    // --- Effect 1: Basic token validation and cleanup ---
    useEffect(() => {
        // Basic check if token is present in URL

        // Do absolutely nothing until the initial app auth state has been determined.
        if (isAuthLoading) {
            return;
        }

        if (!token) {
            console.error('ResetPasswordPage: Reset token missing from URL.');
            dispatch(addNotification({
                message: 'Password reset token is missing.',
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Redirect to login or a specific error page if token is missing
            setTimeout(() => navigate('/login', { replace: true }), 2000);
        }

        // Cleanup function: Clear reset password status state on unmount
        return () => {
            console.log('ResetPasswordPage: Clearing reset password state on unmount.');
            dispatch(clearResetPasswordStatus());
        };
    }, [token, navigate, dispatch]); // Re-run if token, navigate, or dispatch changes


    // --- Effect 2: Handle successful password reset ---
    useEffect(() => {
        if (resetPasswordSuccess) {
            console.log('Password reset successful.');
            // Show success notification
            dispatch(addNotification({
                message: 'Password reset successfully! You can now log in.',
                type: NotificationType.SUCCESS,
                duration: 8000,
            }));

            // Clear the status after showing notification
            dispatch(clearResetPasswordStatus());

            // Redirect to the login page after successful reset
            setTimeout(() => navigate('/login', { replace: true }), 1000); // Redirect after 1 second

        }
    }, [resetPasswordSuccess, dispatch, navigate]); // Depend on success flag, dispatch, navigate


    // --- Effect 3: Handle password reset errors ---
    useEffect(() => {
        if (resetPasswordError) {
            console.error('Password reset failed:', resetPasswordError);
            // Show error notification
            dispatch(addNotification({
                message: `Password reset failed: ${resetPasswordError}`,
                type: NotificationType.ERROR,
                duration: 8000, // Keep message visible longer for user to read
            }));

            // Clear the status after showing notification
            dispatch(clearResetPasswordStatus());

            // If the error indicates an invalid or expired token, you might redirect
            if (resetPasswordError.toLowerCase().includes('invalid') || resetPasswordError.toLowerCase().includes('expired')) {
                console.log('ResetPasswordPage: Invalid/expired token, redirecting to login.');
                // Redirect to login after a delay
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }
        }
    }, [resetPasswordError, dispatch, navigate]); // Depend on error state, dispatch, navigate


    // --- Form Submission Handler ---
    const handleSubmit = (e) => {
        e.preventDefault(); // Prevent default form submission

        // Frontend validation
        if (!password || !confirmPassword) {
            dispatch(addNotification({
                message: 'Please enter and confirm your new password.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            return;
        }

        if (password !== confirmPassword) {
            dispatch(addNotification({
                message: 'Passwords do not match.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            return;
        }

        if (password.length < 6) { // Match backend validation
            dispatch(addNotification({
                message: 'Password must be at least 6 characters.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            return;
        }

        // Ensure token is available before dispatching
        if (token && !isResettingPassword) {
            // Dispatch the resetPassword async thunk with token and new password
            console.log(`Dispatching resetPassword thunk for token: ${token}`);
            dispatch(resetPassword({ token, password }));
            // The effects will handle the outcome
        } else if (!token) {
            // This case should be caught by useEffect 1, but defensive
            console.error('ResetPasswordPage: Attempted submit without token.');
        }
    };

    
    // While the main app is loading OR we are actively resetting, show a loading state.
    if (isAuthLoading || isResettingPassword) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>{isResettingPassword ? 'Resetting password...' : 'Loading...'}</div>;
    }


    // While the token is being checked in useEffect 1, or while resetting
    if (!token || isResettingPassword) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>{isResettingPassword ? 'Resetting password...' : 'Validating token...'}</div>;
    }

    // If we reach here, we have a token and are not currently resetting

    return (
        // Reusing container and form-container classes
        <div className="container">
            <div className="login-header"> {/* Or reuse login-header, or create new */}
                {/* You might not need links here, as the user arrived from an email link */}
                {/* <Link to="/login">Login</Link> | <Link to="/register">Register</Link> */}
                <h2 style={{ margin: 0 }}>Reset Your Password</h2>
            </div>

            <div className="form-container"> {/* Or reuse form-container */}
                <h2>Enter New Password</h2>
                {/* Optional: Display loading/error messages directly on the form */}
                {/* {isResettingPassword && <p style={{ textAlign: 'center' }}>Resetting password...</p>} */}
                {/* {resetPasswordError && <p style={{ color: 'red', textAlign: 'center' }}>Error: {resetPasswordError}</p>} */}

                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        name="password"
                        placeholder="New Password (min 6 characters)"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={isResettingPassword} // Disable input while resetting
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        disabled={isResettingPassword} // Disable input while resetting
                    />
                    <button type="submit" disabled={isResettingPassword}>
                        {isResettingPassword ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>

                <div style={{ marginTop: '15px', fontSize: '0.9em', textAlign: 'center' }}>
                    <Link to="/login">Back to Login</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordPage;