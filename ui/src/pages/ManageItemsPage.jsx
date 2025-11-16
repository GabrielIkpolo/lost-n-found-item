import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
// Import necessary thunks and actions from the items slice
import {
    fetchItems, deleteItem,
    clearDeleteStatus // Assume you have a clear action for delete status
} from '../features/items/itemsSlice'; // Reusing existing itemsSlice thunks
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import { useSelector as useAuthSelector } from 'react-redux'; // Alias for auth slice state
import { Link } from 'react-router-dom'; // For linking to item details or edit page

// Optional: Import a CSS file for this page
import './manageItemsPage.css'; // Now importing the CSS file

// Re-define ItemStatus enum locally if not importing from backend client directly
const ItemStatus = {
  LOST: 'LOST',
  FOUND: 'FOUND',
  CLAIMED: 'CLAIMED',
  RETURNED: 'RETURNED',
  ARCHIVED: 'ARCHIVED'
};

// Re-define ItemCategory enum locally
const ItemCategory = {
  ELECTRONICS_GADGETS: 'ELECTRONICS_GADGETS',
  PERSONAL_ACCESSORIES: 'PERSONAL_ACCESSORIES',
  ACADEMIC_SUPPLIES: 'ACADEMIC_SUPPLIES',
  CLOTHING: 'CLOTHING',
  HEALTH_WELLNESS: 'HEALTH_WELLNESS',
  OTHER: 'OTHER'
};

// Re-define ItemLocation enum locally
const ItemLocation = {
  SENATE_BUILDING: 'SENATE_BUILDING',
  PAB: 'PAB',
  NHS: 'NHS',
  CAFETERIA: 'CAFETERIA',
  LIBRARY: 'LIBRARY',
  SPORTS_COMPLEX: 'SPORTS_COMPLEX',
  OTHER: 'OTHER'
};


// Helper to get status class for styling (ribbons/badges)
const getStatusClass = (status) => {
    switch (status) {
        case ItemStatus.FOUND:
            return 'status-found';
        case ItemStatus.LOST:
            return 'status-lost';
        case ItemStatus.CLAIMED:
            return 'status-claimed';
        case ItemStatus.RETURNED:
            return 'status-returned';
        default:
            return '';
    }
};


const ManageItemsPage = () => {
    const dispatch = useDispatch();

    // Select state from the items slice (reusing existing item list state for simplicity)
    const {
        items, pagination, isLoading, error, // State for the main items list
        isDeleting, deleteError, deleteSuccess, deletedItemId // State for item deletion
    } = useSelector(state => state.items);

    // Select current logged-in user from auth slice (needed for potential permission checks)
    const { user: currentUser } = useAuthSelector(state => state.auth);


    // --- Effect 1: Fetch ALL items on component mount for the admin view ---
    useEffect(() => {
        console.log('ManageItemsPage: Fetching all items for admin.');
        // Dispatch fetchItems thunk, requesting ALL statuses
        dispatch(fetchItems({
            page: pagination.currentPage, // Use current pagination state
            limit: pagination.itemsPerPage, // Use current pagination state
            status: 'ALL', // Request all statuses from the backend endpoint
            // Add any desired admin filters here if needed (e.g., by reportedBy user)
        }));

        // Cleanup function: Consider if you need to clear the items state on unmount
        return () => {
            console.log('ManageItemsPage: Clearing delete status on unmount.');
            dispatch(clearDeleteStatus());
        };
    }, [dispatch, pagination.currentPage, pagination.itemsPerPage]); // Re-fetch when pagination changes


    // --- Effect 2: Handle successful item deletion ---
    useEffect(() => {
        // Check if a deletion was successful
        if (deleteSuccess && deletedItemId) {
            console.log(`ManageItemsPage: Item ${deletedItemId} deleted successfully.`);
            dispatch(addNotification({
                message: 'Item deleted successfully.',
                type: NotificationType.SUCCESS,
                duration: 5000,
            }));

            // Clear the delete status flags
            dispatch(clearDeleteStatus());

            // After deletion, re-fetch the *current* page of items for the admin list
            console.log(`ManageItemsPage: Re-fetching all items after deletion.`);
            dispatch(fetchItems({
                page: pagination.currentPage, // Re-fetch the current page
                limit: pagination.itemsPerPage,
                status: 'ALL', // Ensure we fetch ALL statuses again
                // Include any active filters here
            }));
        }
    }, [deleteSuccess, deletedItemId, dispatch, pagination.currentPage, pagination.itemsPerPage]);


    // --- Effect 3: Handle item deletion errors ---
    useEffect(() => {
        if (deleteError) {
            console.error('ManageItemsPage: Item deletion failed:', deleteError);
            dispatch(addNotification({
                message: `Deletion failed: ${deleteError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Clear the delete error state after showing notification
            dispatch(clearDeleteStatus());
        }
    }, [deleteError, dispatch]);


     // --- Effect 4: Handle general fetch error ---
     useEffect(() => {
        if (error) { // Error from fetchItems
             console.error('ManageItemsPage: Fetch items failed:', error);
             // Notification handling left mostly to the shared state/effect logic,
             // but we keep the error state check here for UI rendering.
         }
     }, [error, dispatch]); // Depend on error state


    // --- Handlers ---

    // Handler for Delete Button Click
    const handleDeleteItem = (itemId, itemTitle) => {
        // Admins/Super Admins can delete items regardless of ownership (backend should verify this)
        // Check if deletion is already in progress
        if (itemId && !isDeleting) {
            // Optional: Add a confirmation dialog
            const isConfirmed = window.confirm(`Are you sure you want to delete item "${itemTitle}" (${itemId})? This action cannot be undone.`);

            if (isConfirmed) {
                console.log(`ManageItemsPage: Attempting to delete item with ID: ${itemId}.`);
                dispatch(deleteItem(itemId)); // Dispatch the deleteItem thunk with the item ID
            } else {
                console.log('Item deletion cancelled by user.');
            }
        }
    };

    // Handler for pagination click (updates the current page by triggering a new fetch)
    const paginateItems = (pageNumber) => {
        // Only dispatch if the page number is valid and different from current
        if (pageNumber > 0 && pageNumber <= pagination.totalPages && pageNumber !== pagination.currentPage) {
            console.log(`Paginating Items to page ${pageNumber} (Admin view).`);
            // Dispatch fetchItems with the new page number and 'ALL' status
            dispatch(fetchItems({
                page: pageNumber,
                limit: pagination.itemsPerPage, // Use current limit
                status: 'ALL', // Always fetch all statuses for admin
                // Include any active filters here
            }));
        }
    };


    // Determine if any item action is loading (for disabling buttons/pagination)
    const isAnyItemActionLoading = isLoading || isDeleting; // Include initial loading and deletion loading


    // --- Render Loading/Error/Empty States ---
    if (isLoading && !isDeleting) { // Only show main loading if not specifically deleting
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading items for admin view...</div>;
    }

    // Show error message if initial fetch failed OR deletion failed
     if (error || deleteError) {
        const displayError = deleteError || error || 'Could not load items.'; // Prioritize deletion error
         return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
             {displayError}
         </div>;
     }


    // Handle empty state after checking loading and errors
     if (!isLoading && !error && !isDeleting && items?.length === 0) {
         return (
              <div style={{ textAlign: 'center', marginTop: '30px' }}>No items found in the system.</div>
         );
     }

    // --- Render the Item List ---
    // Ensure items is an array and not null/undefined before mapping
    const itemsToDisplay = items || [];
    const { totalPages, currentPage } = pagination;


    return (
        <div className="manage-items-container">
            <h2 className="manage-title">Manage Items</h2>

            {/* Optional: Display action status */}
            {isDeleting && <p className="action-status-message">Deleting item...</p>}


            {/* Render the item list (e.g., in a table) */}
            <div className="items-table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Category</th>
                            <th>Location</th>
                            <th>Reported By</th>
                            <th>Claimed By</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemsToDisplay.map(item => (
                            <tr key={item.id}>
                                <td>{item.title}</td>
                                <td>
                                    {/* Use status badge helper for styling */}
                                    <span className={`item-status-badge ${getStatusClass(item.status)}`}>
                                        {item.status}
                                    </span>
                                </td>
                                <td>{item.category}</td>
                                <td>{item.location}</td>
                                {/* Display Reported By and Claimed By names (assuming backend includes them) */}
                                <td>{item.reportedBy?.name || 'N/A'}</td>
                                <td>{item.claimedBy?.name || 'N/A'}</td> {/* claimedBy might be null */}
                                <td className="item-actions">
                                    {/* Actions: View, Edit, Delete - Using CSS classes */}
                                    <Link to={`/items/${item.id}`} className="action-link view-link">View</Link>
                                    <Link to={`/items/${item.id}/edit`} className="action-link edit-link">Edit</Link>

                                    {/* Delete Button */}
                                    <button
                                        onClick={() => handleDeleteItem(item.id, item.title)}
                                        disabled={isAnyItemActionLoading}
                                        className={`action-button delete-button ${isDeleting && deletedItemId === item.id ? 'loading' : ''}`}
                                    >
                                        {isDeleting && deletedItemId === item.id ? 'Deleting...' : 'Delete'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>


            {/* --- Pagination --- */}
            {!isAnyItemActionLoading && totalPages > 1 && (
                <div className="pagination">
                    <nav aria-label="Pagination">
                        <ul>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <li key={page}>
                                    <button
                                        onClick={() => paginateItems(page)}
                                        className={currentPage === page ? 'active' : ''}
                                        disabled={isAnyItemActionLoading}
                                    >
                                        {page}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </div>
            )}

        </div>
    );
};

export default ManageItemsPage;