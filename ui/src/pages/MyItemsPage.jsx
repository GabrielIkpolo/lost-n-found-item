import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchMyItems, deleteItem, clearMyItems, clearDeleteStatus,
    markItemReturned, confirmItemReceived, cancelItemClaim,
    clearMarkReturnedStatus, clearConfirmReceivedStatus, clearCancelClaimStatus,
} from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
// Import Link for item details navigation and potentially useNavigate
import { Link, useNavigate } from 'react-router-dom';

// Import item placeholder image if needed for list
import itemPlaceholderImage from '../assets/images/logo-1.png';

import './myItemsPage.css';
import Sidebar from '../components/Sidebar';


const MyItemsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Select state for 'my items' from the items slice
    const { myItems, myItemsPagination, isMyItemsLoading, myItemsError,
        isDeleting, deleteError, deleteSuccess, deletedItemId,
        currentItem, isItemLoading, itemError,
        isClaiming, claimError, claimSuccess, claimedItem,
        isUpdating, updateError, updateSuccess, updatedItem,
        // Select new status update states
        isMarkingReturned, markReturnedError, markReturnedSuccess,
        isConfirmingReceived, confirmReceivedError, confirmReceivedSuccess,
        isCancellingClaim, cancelClaimError, cancelClaimSuccess

    } = useSelector(state => state.items);

    // Select auth state to check user role if needed for specific actions on items
    const { isAuthenticated, user } = useSelector(state => state.auth);


    // --- Effect to fetch user's items on mount and when pagination changes ---
    useEffect(() => {
        console.log(`Fetching my items. Page: ${myItemsPagination.currentPage}, Limit: ${myItemsPagination.itemsPerPage}`);
        // Dispatch fetchMyItems thunk with current pagination params
        dispatch(fetchMyItems({
            page: myItemsPagination.currentPage,
            limit: myItemsPagination.itemsPerPage,
            // Add filters specific to 'my-items' here when backend supports them
            // For example, to filter by status:
            // status: 'LOST',
        }));

        // Cleanup function: Clear the 'my items' state when the component unmounts
        return () => {
            console.log('Clearing my items state and delete status.');
            dispatch(clearMyItems());
            dispatch(clearDeleteStatus());
            // Clear status update statuses too
            dispatch(clearMarkReturnedStatus());
            dispatch(clearConfirmReceivedStatus());
            dispatch(clearCancelClaimStatus());
        };

    }, [dispatch,]);
    // myItemsPagination.currentPage, myItemsPagination.itemsPerPage



    // --- Effect to show error notification for fetching my items ---
    useEffect(() => {
        if (myItemsError) {
            console.error('My items fetch error:', myItemsError);
            dispatch(addNotification({
                message: `Error fetching your items: ${myItemsError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Note: Error message is already cleared by fetchMyItems.rejected
        }
    }, [myItemsError, dispatch]);


    // --- Effect 8: Handle successful item deletion ---
    useEffect(() => {
        // Check if a deletion was successful
        if (deleteSuccess && deletedItemId) {
            console.log(`MyItemsPage: Item ${deletedItemId} deleted successfully.`);
            dispatch(addNotification({
                message: 'Item deleted successfully.',
                type: NotificationType.SUCCESS,
                duration: 5000,
            }));

            // Clear the delete status flags
            dispatch(clearDeleteStatus());

            // After deletion, re-fetch the *current* page of my items to update the list and pagination
            // This is important if deletion removes an item and affects the count/pages
            console.log(`MyItemsPage: Re-fetching my items after deletion.`);
            dispatch(fetchMyItems({
                page: myItemsPagination.currentPage,
                limit: myItemsPagination.itemsPerPage,
                // Include any active filters here
            }));

            // Optional: If the deleted item was the *last* item on the current page
            // and it was not the first page, you might want to navigate to the previous page.
            // You would need to check if totalItems % itemsPerPage === 0 after deletion
            // and if currentPage > 1, then dispatch fetchMyItems({ page: currentPage - 1, ... })
        }
    }, [deleteSuccess, deletedItemId, dispatch,]);
    // [deleteSuccess, deletedItemId, dispatch, myItemsPagination.currentPage, myItemsPagination.itemsPerPage]

    // --- Effect 9: Handle item deletion errors ---
    useEffect(() => {
        if (deleteError) {
            console.error('MyItemsPage: Item deletion failed:', deleteError);
            dispatch(addNotification({
                message: `Deletion failed: ${deleteError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Clear the delete error state after showing notification
            dispatch(clearDeleteStatus());
        }
    }, [deleteError, dispatch]);



    // --- Effects for Status Update Success ---
    useEffect(() => {
        // Check if any of the status update success flags are true
        if (markReturnedSuccess || confirmReceivedSuccess || cancelClaimSuccess) {
            console.log('MyItemsPage: Status update successful.');
            // Show a generic success notification (or more specific if needed)
            dispatch(addNotification({ message: 'Item status updated.', type: NotificationType.SUCCESS, duration: 5000 }));

            // Clear all status update flags
            dispatch(clearMarkReturnedStatus());
            dispatch(clearConfirmReceivedStatus());
            dispatch(clearCancelClaimStatus());

            // Re-fetch the current page of my items to update the list with the new status
            console.log(`MyItemsPage: Re-fetching my items after status update.`);
            dispatch(fetchMyItems({
                page: myItemsPagination.currentPage,
                limit: myItemsPagination.itemsPerPage,
                // Include any active filters
            }));
        }
    }, [markReturnedSuccess, confirmReceivedSuccess, cancelClaimSuccess, dispatch, myItemsPagination.currentPage, myItemsPagination.itemsPerPage]);


    // --- Effects for Status Update Errors ---
    useEffect(() => {
        // Check if any of the status update error flags are true
        if (markReturnedError || confirmReceivedError || cancelClaimError) {
            console.error('MyItemsPage: Status update failed.');
            // Find the specific error message
            const errorMsg = markReturnedError || confirmReceivedError || cancelClaimError || 'Failed to update item status.';
            dispatch(addNotification({ message: `Status update failed: ${errorMsg}`, type: NotificationType.ERROR, duration: 5000 }));

            // Clear all status update flags
            dispatch(clearMarkReturnedStatus());
            dispatch(clearConfirmReceivedStatus());
            dispatch(clearCancelClaimStatus());
        }
    }, [markReturnedError, confirmReceivedError, cancelClaimError, dispatch]);



    // Handle pagination click (now updates the current page by triggering a new fetch)
    const paginateMyItems = (pageNumber) => {
        // Only dispatch if the page number is valid and different from current
        if (pageNumber > 0 && pageNumber <= myItemsPagination.totalPages && pageNumber !== myItemsPagination.currentPage) {
            console.log(`Paginating My Items to page ${pageNumber}`);
            // Dispatch fetchMyItems with the new page number
            dispatch(fetchMyItems({
                page: pageNumber,
                limit: myItemsPagination.itemsPerPage,
                // Keep any active filters here
            }));
        }
    };


    // --- Handler for Delete Button Click ---
    const handleDeleteItem = (itemId) => {
        if (itemId && !isDeleting) { // Ensure we have an ID and are not already deleting
            // Show a confirmation dialog
            const isConfirmed = window.confirm('Are you sure you want to delete this item? This action cannot be undone.');

            if (isConfirmed) {
                console.log(`MyItemsPage: Attempting to delete item with ID: ${itemId}`);
                dispatch(deleteItem(itemId)); // Dispatch the deleteItem thunk with the item ID
            } else {
                console.log('Item deletion cancelled by user.');
            }
        }
    };



    // --- Handlers for Status Update Buttons ---
    const handleMarkReturned = (itemId) => {
        if (itemId && !isMarkingReturned) {
            console.log(`MyItemsPage: Attempting to mark item ${itemId} as returned.`);
            dispatch(markItemReturned(itemId));
        }
    };

    const handleConfirmReceived = (itemId) => {
        if (itemId && !isConfirmingReceived) {
            console.log(`MyItemsPage: Attempting to confirm received for item ${itemId}.`);
            dispatch(confirmItemReceived(itemId));
        }
    };

    const handleCancelClaim = (itemId) => {
        if (itemId && !isCancellingClaim) {
            console.log(`MyItemsPage: Attempting to cancel claim for item ${itemId}.`);
            dispatch(cancelItemClaim(itemId));
        }
    };


    // --- Determine if any item action is loading (for disabling buttons) ---
    const isAnyItemActionLoading = isMyItemsLoading || isDeleting || isMarkingReturned || isConfirmingReceived || isCancellingClaim;

    // --- Render Loading/Error/Empty States ---
    // Show loading state for initial fetch OR any item action
    if (isMyItemsLoading || isAnyItemActionLoading) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>{isAnyItemActionLoading ? 'Processing action...' : 'Loading your items...'}</div>;
    }

    // Show error message if initial fetch failed OR any action failed
    if (myItemsError || deleteError || markReturnedError || confirmReceivedError || cancelClaimError) {
        const displayError = deleteError || markReturnedError || confirmReceivedError || cancelClaimError || myItemsError || 'Could not load your items.';
        return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
            {displayError}
        </div>;
    }


    // Handle empty state *after* checking loading and errors
    if (!isMyItemsLoading && !myItemsError && myItems?.length === 0) {
        return (
            <div className="my-items-container">
                <h1>My Items</h1>
                <p style={{ textAlign: 'center', marginTop: '30px' }}>You haven't reported or claimed any items yet.</p>
            </div>
        );
    }



    // Determine items to display - comes from Redux state
    const itemsToDisplay = myItems || [];
    const { totalPages, currentPage } = myItemsPagination;


    return (
        <div className='main-container'>
            <Sidebar />

            <div className="my-items-container">
                <h1>My Items</h1>

                {/* --- LOADING, ERROR, EMPTY, AND ITEM LIST RENDERING --- */}
                {isMyItemsLoading && <p style={{ textAlign: 'center' }}>Loading your items...</p>}

                {myItemsError && <p style={{ textAlign: 'center', color: 'red' }}>{myItemsError}</p>}


                {!isMyItemsLoading && itemsToDisplay?.length === 0 && !myItemsError && (
                    <p style={{ textAlign: 'center' }}>You haven't reported or claimed any items yet.</p>
                )}

                {!isMyItemsLoading && !myItemsError && itemsToDisplay?.length > 0 && (
                    <div className="item-list">
                        {itemsToDisplay.map(item => (
                            <div key={item.id} className="item-card"> {/* Reusing item-card class */}
                                <h2>{item.title}</h2>
                                <img
                                    src={item.imageUrlFront || itemPlaceholderImage}
                                    alt={item.title}
                                    className="item-image"
                                    onError={(e) => { e.target.src = itemPlaceholderImage; }}
                                />
                                <p>
                                    <strong>Status:</strong> {item.status}
                                </p>
                                <p>{item.description}</p>
                                <p><strong>Category:</strong> {item.category}</p>
                                <p><strong>Location:</strong> {item.location}</p>

                                {/* Distinguish Reported By vs Claimed By */}
                                {user && (
                                    <p>
                                        <strong>Role:</strong> {item.reportedById === user.id ? 'Reporter' : (item.claimedById === user.id ? 'Claimant' : 'Other')}
                                    </p>
                                )}

                                {/* Link to item detail */}
                                <Link to={`/items/${item.id}`} className="btn-details">
                                    View Details
                                </Link>

                                {/* --- Conditional Actions on My Items --- */}
                                {/* Edit button */}
                                {isAuthenticated && user?.id === item.reportedById && (item.status === 'LOST' || item.status === 'FOUND') && (
                                    <Link
                                        to={`/items/${item.id}/edit`}
                                        className="btn-action secondary"
                                        disabled={isAnyItemActionLoading}
                                    >
                                        Edit
                                    </Link>
                                )}

                                {/* Mark as Returned (for reportedBy user) */}
                                {isAuthenticated && user?.id === item.reportedById && item.status === 'CLAIMED' && (
                                    <button className="btn-action success"
                                        onClick={() => handleMarkReturned(item.id)}
                                        disabled={isAnyItemActionLoading}>
                                        {isMarkingReturned ? 'Marking...' : 'Mark as Returned'}
                                    </button>
                                )}
                                {/* Confirm Received (for claimedBy user) */}
                                {isAuthenticated && user?.id === item.claimedById && item.status === 'CLAIMED' && (
                                    <button className="btn-action success"
                                        onClick={() => handleConfirmReceived(item.id)}
                                        disabled={isAnyItemActionLoading}>
                                        {isConfirmingReceived ? 'Confirming...' : 'Confirm Received'}
                                    </button>
                                )}
                                {/* Cancel Claim (for claimedBy user) */}
                                {isAuthenticated && user?.id === item.claimedById && item.status === 'CLAIMED' && (
                                    <button className="btn-action danger"
                                        onClick={() => handleCancelClaim(item.id)}
                                        disabled={isAnyItemActionLoading}>
                                        {isCancellingClaim ? 'Cancelling...' : 'Cancel Claim'}
                                    </button>
                                )}

                                {/* Delete button */}
                                {/* Show if authenticated, and user is authorized (reporter OR Admin/Super Admin) AND status allows deletion */}
                                {isAuthenticated && (user?.id === item.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (item.status !== 'CLAIMED' && item.status !== 'RETURNED') && (
                                    <button
                                        className="btn-action danger"
                                        onClick={() => handleDeleteItem(item.id)}
                                        disabled={isAnyItemActionLoading}
                                    >
                                        {isDeleting ? 'Deleting...' : 'Delete'}
                                    </button>
                                )}
                                {/* ----------------------------------------- */}
                            </div>
                        ))}
                    </div>
                )}

                {/* --- Pagination for My Items --- */}
                {!isMyItemsLoading && !myItemsError && myItemsPagination.totalPages > 1 && (
                    <div className="pagination"> {/* Reusing pagination class */}
                        <nav aria-label="Pagination">
                            <ul>
                                {Array.from({ length: myItemsPagination.totalPages }, (_, i) => i + 1).map((page) => (
                                    <li key={page}>
                                        <button
                                            onClick={() => paginateMyItems(page)}
                                            className={myItemsPagination.currentPage === page ? 'active' : ''}
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
                {/* ------------------------------- */}
            </div>
        </div>
    );
};

export default MyItemsPage;