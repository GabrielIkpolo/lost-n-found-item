import React from 'react'
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Navigate, Outlet } from 'react-router-dom'
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

const ProtectedRoutes = ({ children }) => {
    const { isAuthenticated } = useSelector((state) => state.auth);

    const navigate = useNavigate();
    const dispatch = useDispatch();

    if (!isAuthenticated) {

        dispatch(addNotification({
            message: 'You must logged in to perform this action',
            type: NotificationType.WARNING,
            duration: 5000,
        }));

        // / Select the isAuthenticated state from Redux
        return <Navigate to='/login' replace />
    }

    // If authenticated, render the child routes/elements
    return children;
}

export default ProtectedRoutes