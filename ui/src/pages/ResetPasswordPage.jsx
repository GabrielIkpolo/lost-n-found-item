// import React, { useState, useEffect } from 'react';
// import { useParams, useNavigate, Link } from 'react-router-dom';
// import { useDispatch, useSelector } from 'react-redux';
// import { resetPassword, clearResetPasswordStatus } from '../features/auth/authSlice';
// import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

// const ResetPasswordPage = () => {
//     const { token } = useParams();
//     const navigate = useNavigate();
//     const dispatch = useDispatch();

//     const [password, setPassword] = useState('');
//     const [confirmPassword, setConfirmPassword] = useState('');

//     const [isTokenValid, setIsTokenValid] = useState(false);

//     const {
//         isResettingPassword,
//         resetPasswordError,
//         resetPasswordSuccess,
//         isAuthLoading
//     } = useSelector((state) => state.auth);

//     // Effect for token validation, success, errors, and cleanup
//     useEffect(() => {
//         // 1. Don't do anything until the main app has finished its initial auth loading.
//         console.log(`Token from URL: ${token}`);

//         if (isAuthLoading) {
//             return;
//         }

//         // 2. Once loaded, check if the token from the URL is actually present.
//         if (!token) {
//             console.error('ResetPasswordPage: Token is missing from URL. Redirecting to login.');
//             dispatch(addNotification({
//                 message: 'Password reset link is invalid or has expired.',
//                 type: NotificationType.ERROR,
//             }));
//             navigate('/login', { replace: true });
//             return;
//         }

//         // 3. Handle successful password reset
//         if (resetPasswordSuccess) {
//             dispatch(addNotification({ message: 'Password has been reset successfully!', type: NotificationType.SUCCESS, duration: 8000 }));
//             dispatch(clearResetPasswordStatus());
//             setTimeout(() => navigate('/login', { replace: true }), 1500);
//         }

//         // 4. Handle password reset errors
//         if (resetPasswordError) {
//             dispatch(addNotification({ message: `Password reset failed: ${resetPasswordError}`, type: NotificationType.ERROR, duration: 8000 }));
//             dispatch(clearResetPasswordStatus());
//             // Optionally redirect on specific errors
//             if (resetPasswordError.toLowerCase().includes('invalid') || resetPasswordError.toLowerCase().includes('expired')) {
//                 setTimeout(() => navigate('/login', { replace: true }), 3000);
//             }
//         }

//         setIsTokenValid(true); //
//         // 5. Cleanup function: This will run when the component unmounts.
//         return () => {
//             dispatch(clearResetPasswordStatus());
//         };
//     }, [
//         token,
//         isAuthLoading,
//         resetPasswordSuccess,
//         resetPasswordError,
//         navigate,
//         dispatch
//     ]);

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         if (password !== confirmPassword) {
//             dispatch(addNotification({ message: 'Passwords do not match.', type: NotificationType.WARNING }));
//             return;
//         }
//         if (password.length < 6) {
//             dispatch(addNotification({ message: 'Password must be at least 6 characters.', type: NotificationType.WARNING }));
//             return;
//         }
//         if (token) {
//             dispatch(resetPassword({ token, password }));
//         }
//     };

//     // --- RENDER LOGIC ---
//     // If the main app is still loading OR we are in the middle of resetting, show a loading state.
//     if (isAuthLoading || isResettingPassword) {
//         const message = isResettingPassword ? 'Resetting your password...' : 'Loading...';
//         return <div style={{ textAlign: 'center', marginTop: '50px' }}>{message}</div>;
//     }

//     // If we reach here, the app is loaded, we are not resetting, and the useEffect has validated the token.
//     return (
//         <div className="container">
//             <div className="login-header">
//                 <h2 style={{ margin: 0 }}>Reset Your Password</h2>
//             </div>
//             <div className="form-container">
//                 <h2>Enter New Password</h2>
//                 <form onSubmit={handleSubmit}>
//                     <input
//                         type="password"
//                         name="password"
//                         placeholder="New Password (min 6 characters)"
//                         required
//                         value={password}
//                         onChange={(e) => setPassword(e.target.value)}
//                     />
//                     <input
//                         type="password"
//                         name="confirmPassword"
//                         placeholder="Confirm New Password"
//                         required
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                     />
//                     <button type="submit">
//                         Reset Password
//                     </button>
//                 </form>
//                 <div style={{ marginTop: '15px', fontSize: '0.9em', textAlign: 'center' }}>
//                     <Link to="/login">Back to Login</Link>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default ResetPasswordPage;




import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { resetPassword, clearResetPasswordStatus } from '../features/auth/authSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

const ResetPasswordPage = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const {
        isResettingPassword,
        resetPasswordError,
        resetPasswordSuccess,
    } = useSelector((state) => state.auth);

    // --- NEW, SIMPLIFIED EFFECT LOGIC ---

    // Effect to handle success/error from the reset API call
    useEffect(() => {
        if (resetPasswordSuccess) {
            dispatch(addNotification({ message: 'Password has been reset successfully!', type: NotificationType.SUCCESS, duration: 8000 }));
            dispatch(clearResetPasswordStatus());
            // Use a short timeout to allow the user to see the success message before navigating
            setTimeout(() => navigate('/login', { replace: true }), 1500);
        }

        if (resetPasswordError) {
            dispatch(addNotification({ message: `Password reset failed: ${resetPasswordError}`, type: NotificationType.ERROR, duration: 8000 }));
            dispatch(clearResetPasswordStatus());
            // Redirect on critical errors
            if (resetPasswordError.toLowerCase().includes('invalid') || resetPasswordError.toLowerCase().includes('expired')) {
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }
        }
    }, [resetPasswordSuccess, resetPasswordError, dispatch, navigate]);

    // Effect for cleanup on unmount
    useEffect(() => {
        // If the user navigates away, ensure the state is clean
        return () => {
            dispatch(clearResetPasswordStatus());
        };
    }, [dispatch]);

    // Handle the case where the token is missing from the URL right away.
    // This is a direct check without waiting for async state.
    if (!token) {
        // This is an invalid state. We can show a message and offer a link back.
        // This is better than a silent redirect.
        return (
            <div style={{ textAlign: 'center', marginTop: '50px' }}>
                <h1>Invalid Link</h1>
                <p>The password reset link is missing a required token.</p>
                <Link to="/forgot-password">Request a new reset link</Link>
            </div>
        );
    }
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            dispatch(addNotification({ message: 'Passwords do not match.', type: NotificationType.WARNING }));
            return;
        }
        if (password.length < 6) {
            dispatch(addNotification({ message: 'Password must be at least 6 characters.', type: NotificationType.WARNING }));
            return;
        }
        dispatch(resetPassword({ token, password }));
    };

    // --- RENDER LOGIC ---
    // The top-level <App> handles the initial load. We only need to show a loading state
    // when the password is being actively reset via API call.
    if (isResettingPassword) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Resetting your password...</div>;
    }
    
    // Default render is the form.
    return (
        <div className="container" style={{ margin: '4rem auto' }}> {/* Reusing login.css styles */}
            <div className="login-header">
                <h2 style={{ margin: 0, color: 'white' }}>Reset Your Password</h2>
            </div>
            <div className="form-container">
                <p style={{ fontSize: '0.9em', color: '#555' }}>
                    Please enter and confirm your new password.
                </p>
                <form onSubmit={handleSubmit} noValidate>
                    <input
                        type="password"
                        name="password"
                        placeholder="New Password (min 6 characters)"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                    />
                    <button type="submit">
                        Reset Password
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