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

//     const { 
//         isResettingPassword, 
//         resetPasswordError,
//         resetPasswordSuccess, 
//         isAuthLoading // Crucial state variable
//     } = useSelector((state) => state.auth);

//     // --- Effect 1: The main validation logic ---
//     useEffect(() => {
//         // If the main app is still loading its auth state, do nothing yet.
//         if (isAuthLoading) {
//             return;
//         }

//         // Once the app has loaded, we can safely check for the token.
//         if (!token) {
//             console.error('ResetPasswordPage: Token missing after auth load. Redirecting.');
//             dispatch(addNotification({
//                 message: 'Password reset token is missing or invalid.',
//                 type: NotificationType.ERROR,
//             }));
//             navigate('/login', { replace: true });
//         }

//         // Cleanup function for when the component unmounts
//         return () => {
//             dispatch(clearResetPasswordStatus());
//         };
//     // --- THIS IS THE FIX ---
//     // Add isAuthLoading to the dependency array.
//     }, [token, navigate, dispatch, isAuthLoading]);

//     // --- Your other useEffects for success and error handling are perfectly fine ---
//     useEffect(() => {
//         if (resetPasswordSuccess) {
//             // ... (your existing success logic is correct)
//             dispatch(addNotification({ message: 'Password reset successfully! You can now log in.', type: NotificationType.SUCCESS, duration: 8000 }));
//             dispatch(clearResetPasswordStatus());
//             setTimeout(() => navigate('/login', { replace: true }), 1000);
//         }
//     }, [resetPasswordSuccess, dispatch, navigate]);

//     useEffect(() => {
//         if (resetPasswordError) {
//             // ... (your existing error logic is correct)
//             dispatch(addNotification({ message: `Password reset failed: ${resetPasswordError}`, type: NotificationType.ERROR, duration: 8000 }));
//             dispatch(clearResetPasswordStatus());
//             if (resetPasswordError.toLowerCase().includes('invalid') || resetPasswordError.toLowerCase().includes('expired')) {
//                 setTimeout(() => navigate('/login', { replace: true }), 3000);
//             }
//         }
//     }, [resetPasswordError, dispatch, navigate]);

//     // --- Your handleSubmit function is also perfectly fine ---
//     const handleSubmit = (e) => {
//         e.preventDefault();
//         // ... (your existing submit logic is correct)
//         if (password !== confirmPassword) { /* ... */ return; }
//         if (password.length < 6) { /* ... */ return; }
//         if (token && !isResettingPassword) {
//             dispatch(resetPassword({ token, password }));
//         }
//     };
    
//     // --- CLEANER RENDER LOGIC ---
//     // If the main app is still in its initial loading phase, show a generic loading screen.
//     if (isAuthLoading) {
//         return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
//     }

//     // If we are actively in the process of resetting the password, show that specific message.
//     if (isResettingPassword) {
//         return <div style={{ textAlign: 'center', marginTop: '50px' }}>Resetting password...</div>;
//     }
    
//     // If we reach here, the app has loaded and we can render the form.
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
//                         disabled={isResettingPassword}
//                     />
//                     <input
//                         type="password"
//                         name="confirmPassword"
//                         placeholder="Confirm New Password"
//                         required
//                         value={confirmPassword}
//                         onChange={(e) => setConfirmPassword(e.target.value)}
//                         disabled={isResettingPassword}
//                     />
//                     <button type="submit" disabled={isResettingPassword}>
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



//=============================================

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
        isAuthLoading 
    } = useSelector((state) => state.auth);

    // Effect for token validation, success, errors, and cleanup
    useEffect(() => {
        // 1. Don't do anything until the main app has finished its initial auth loading.
        if (isAuthLoading) {
            return;
        }

        // 2. Once loaded, check if the token from the URL is actually present.
        if (!token) {
            console.error('ResetPasswordPage: Token is missing from URL. Redirecting to login.');
            dispatch(addNotification({
                message: 'Password reset link is invalid or has expired.',
                type: NotificationType.ERROR,
            }));
            navigate('/login', { replace: true });
        }

        // 3. Handle successful password reset
        if (resetPasswordSuccess) {
            dispatch(addNotification({ message: 'Password has been reset successfully!', type: NotificationType.SUCCESS, duration: 8000 }));
            dispatch(clearResetPasswordStatus());
            setTimeout(() => navigate('/login', { replace: true }), 1500);
        }

        // 4. Handle password reset errors
        if (resetPasswordError) {
            dispatch(addNotification({ message: `Password reset failed: ${resetPasswordError}`, type: NotificationType.ERROR, duration: 8000 }));
            dispatch(clearResetPasswordStatus());
            // Optionally redirect on specific errors
            if (resetPasswordError.toLowerCase().includes('invalid') || resetPasswordError.toLowerCase().includes('expired')) {
                setTimeout(() => navigate('/login', { replace: true }), 3000);
            }
        }
        
        // 5. Cleanup function: This will run when the component unmounts.
        return () => {
            dispatch(clearResetPasswordStatus());
        };
    }, [
        token, 
        isAuthLoading, 
        resetPasswordSuccess, 
        resetPasswordError, 
        navigate, 
        dispatch
    ]);

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
        if (token) {
            dispatch(resetPassword({ token, password }));
        }
    };
    
    // --- RENDER LOGIC ---
    // If the main app is still loading OR we are in the middle of resetting, show a loading state.
    if (isAuthLoading || isResettingPassword) {
        const message = isResettingPassword ? 'Resetting your password...' : 'Loading...';
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>{message}</div>;
    }
    
    // If we reach here, the app is loaded, we are not resetting, and the useEffect has validated the token.
    return (
        <div className="container">
            <div className="login-header">
                <h2 style={{ margin: 0 }}>Reset Your Password</h2>
            </div>
            <div className="form-container">
                <h2>Enter New Password</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        name="password"
                        placeholder="New Password (min 6 characters)"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <input
                        type="password"
                        name="confirmPassword"
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
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