import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Import the thunks and actions from the user slice
import {
    fetchAllUsers, updateUserRole, deleteUser,
    clearUpdateRoleStatus, clearDeleteUserStatus, clearUserManagementState
} from '../features/userSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import { useSelector as useAuthSelector } from 'react-redux';

import './manageUsersPage.css'; // <-- Import the new CSS file
// Define available roles for the dropdown (Keep synced with backend enum)
const userRoles = [
    { label: 'User', value: 'USER' },
    { label: 'Admin', value: 'ADMIN' },
    // Super Admin role change is restricted on the backend for security,
    // so we typically don't include it in the dropdown unless you have
    // specific Super Admin to Super Admin transfer logic.
    // { label: 'Super Admin', value: 'SUPER_ADMIN' },
];


const ManageUsersPage = () => {
    const dispatch = useDispatch();

    // Select state from the user slice
    const {
        users, isLoading, error,
        isUpdatingRole, updateRoleError, updateRoleSuccess, updatedUser,
        isDeletingUser, deleteUserError, deleteUserSuccess, deletedUserId
    } = useSelector(state => state.users);

    // Select current logged-in user from auth slice (needed to prevent self-action)
    const { user: currentUser } = useAuthSelector(state => state.auth); 

    // --- Effect 1: Fetch all users on component mount ---
    useEffect(() => {
        console.log('ManageUsersPage: Fetching all users.');
        dispatch(fetchAllUsers());

        // Cleanup function: Clear user management state on unmount
        return () => {
            console.log('ManageUsersPage: Clearing user management state on unmount.');
            dispatch(clearUserManagementState());
        };
    }, [dispatch]); 


    // --- Effect 2: Handle successful role update ---
    useEffect(() => {
        if (updateRoleSuccess) {
            console.log('ManageUsersPage: User role updated successfully.');
            dispatch(addNotification({
                message: `User "${updatedUser?.name || 'Unknown'}" role updated successfully!`,
                type: NotificationType.SUCCESS,
                duration: 5000,
            }));
            // Clear the status after showing notification
            dispatch(clearUpdateRoleStatus());
        }
    }, [updateRoleSuccess, updatedUser, dispatch]);


    // --- Effect 3: Handle role update errors ---
    useEffect(() => {
        if (updateRoleError) {
            console.error('ManageUsersPage: User role update failed:', updateRoleError);
            dispatch(addNotification({
                message: `Role update failed: ${updateRoleError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Clear the status after showing notification
            dispatch(clearUpdateRoleStatus());
        }
    }, [updateRoleError, dispatch]);


    // --- Effect 4: Handle successful user deletion ---
    useEffect(() => {
        if (deleteUserSuccess && deletedUserId) {
            console.log(`ManageUsersPage: User ${deletedUserId} deleted successfully.`);
            dispatch(addNotification({
                message: 'User deleted successfully.',
                type: NotificationType.SUCCESS,
                duration: 5000,
            }));
            // Clear the status after showing notification
            dispatch(clearDeleteUserStatus());
            // Note: The users list in Redux state is already updated by the thunk's fulfilled case
        }
    }, [deleteUserSuccess, deletedUserId, dispatch]);


    // --- Effect 5: Handle user deletion errors ---
    useEffect(() => {
        if (deleteUserError) {
            console.error('ManageUsersPage: User deletion failed:', deleteUserError);
            dispatch(addNotification({
                message: `User deletion failed: ${deleteUserError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Clear the status after showing notification
            dispatch(clearDeleteUserStatus());
        }
    }, [deleteUserError, dispatch]);


    // --- Effect 6: Handle general fetch error ---
    useEffect(() => {
        if (error) { // Error from fetchAllUsers
            console.error('ManageUsersPage: Fetch users failed:', error);
            dispatch(addNotification({
                message: `Failed to load users: ${error}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // We don't necessarily need to clear this error state here if
            // it's intended to stay visible until a successful fetch or navigation.
        }
    }, [error, dispatch]);


    // --- Handlers ---

    const handleRoleChange = (userId, newRole) => {
        // Optional: Add a confirmation dialog
        const isConfirmed = window.confirm(`Are you sure you want to change the role of user ${userId} to ${newRole}?`);

        if (isConfirmed) {
            console.log(`ManageUsersPage: Attempting to update role for user ${userId} to ${newRole}.`);
            dispatch(updateUserRole({ userId, role: newRole })); // Dispatch the updateUserRole thunk
        } else {
            console.log('Role change cancelled by user.');
        }
    };

    const handleDeleteUser = (userId, userName) => {
        // Prevent deleting the currently logged-in user
        if (currentUser?.id === userId) {
            dispatch(addNotification({
                message: 'You cannot delete your own account from this page.',
                type: NotificationType.WARNING,
                duration: 5000,
            }));
            return; // Stop the function
        }

        // Optional: Add a confirmation dialog
        const isConfirmed = window.confirm(`Are you sure you want to delete user "${userName}" (${userId})? This action cannot be undone.`);

        if (isConfirmed) {
            console.log(`ManageUsersPage: Attempting to delete user with ID: ${userId}.`);
            dispatch(deleteUser(userId)); // Dispatch the deleteUser thunk
        } else {
            console.log('User deletion cancelled by user.');
        }
    };

    // Determine if any user action is loading (for disabling buttons/selects)
    const isAnyUserActionLoading = isLoading || isUpdatingRole || isDeletingUser;


    // --- Render Loading/Error/Empty States ---
    if (isLoading) { // Loading specifically for the initial fetch
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading users...</div>;
    }

    if (error) { // Error from the initial fetch
        // The error notification effect handles displaying the message.
        // We can show nothing or a simple message here.
        return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>Failed to load users.</div>;
    }

    // Handle state for individual action errors (update/delete)
    if (updateRoleError || deleteUserError) {
        // Error notifications are handled by effects 3 and 5.
        // Can optionally display something here too if not using notifications exclusively.
    }


    // Handle empty state after checking loading and errors
    if (!isLoading && !error && users?.length === 0) {
        return (
            <div style={{ textAlign: 'center', marginTop: '30px' }}>No users found.</div>
        );
    }


    // --- Render the Users List ---
    return (
        <div className="manage-users-container">
            <h2 className="manage-title">Manage Users</h2>

            {/* Optional: Display loading/action status */}
            {isUpdatingRole && <p style={{ textAlign: 'center' }}>Updating role...</p>}
            {isDeletingUser && <p style={{ textAlign: 'center' }}>Deleting user...</p>}

            <div className="users-table-wrapper">
            {/* Render the user list (e.g., in a table) */}
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Provider</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.provider}</td>
                                <td>
                                {/* Role Selector (only editable for non-Super Admins, not self) */}
                                {user.role === 'SUPER_ADMIN' ? (
                                    // Display 'Super Admin' role as text if user is Super Admin
                                        <span className="user-role-display">SUPER_ADMIN</span>
                                    ) : (
                                    // For other roles, display a dropdown if not self and not loading
                                    <select
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={isAnyUserActionLoading || currentUser?.id === user.id}
                                            className="role-select"
                                        >
                                            {userRoles.map(roleOption => (
                                                <option key={roleOption.value} value={roleOption.value}>
                                                    {roleOption.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </td>
                                <td className="user-actions">
                                    {/* Delete Button (only visible for non-Super Admins, not self) */}
                                    {user.role !== 'SUPER_ADMIN' && currentUser?.id !== user.id && (
                                        <button
                                            onClick={() => handleDeleteUser(user.id, user.name)}
                                            disabled={isAnyUserActionLoading}
                                            className="action-button delete-user-button"
                                        >
                                            Delete
                                        </button>
                                    )}
                                    {/* Add Edit button for other user properties if needed */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
        </div>

        </div>
    );
};

export default ManageUsersPage;