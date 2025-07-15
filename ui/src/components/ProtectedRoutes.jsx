import React from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Navigate, Outlet } from 'react-router-dom'
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

const ProtectedRoutes = ({ children, requiredRoles }) => {
    const { isAuthenticated, user } = useSelector((state) => state.auth);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    // Log the authentication status and user role for debugging
    console.log(`ProtectedRoutes rendered. isAuthenticated: ${isAuthenticated}, User Role: ${user?.role}`);


    if (!isAuthenticated) {
         console.log('ProtectedRoutes: Not authenticated, redirecting to login.');
        dispatch(addNotification({
            message: 'You must logged in to perform this action',
            type: NotificationType.WARNING,
            duration: 5000,
        }));

        return <Navigate to='/login' replace />
    }

// If authenticated, check if requiredRoles were specified and if the user has one of them
    // Ensure this block is UNCOMMENTED
    if (requiredRoles && requiredRoles.length > 0) {
        // Ensure user object exists before checking role
        const userHasRequiredRole = user && requiredRoles.includes(user.role);

        if (!userHasRequiredRole) {
            console.log('ProtectedRoutes: Authenticated but insufficient role, redirecting to home.');
            dispatch(addNotification({
                message: 'Access Denied: You do not have the required permissions.',
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            return <Navigate to='/' replace />; // Redirect to home or an access denied page
        }
    }
    // If authenticated, render the child routes/elements
    return children;
}

export default ProtectedRoutes