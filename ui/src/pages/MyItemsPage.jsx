import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMyItems, deleteItem, clearMyItems, clearDeleteStatus } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
// Import Link for item details navigation and potentially useNavigate
import { Link, useNavigate } from 'react-router-dom';

// Import item placeholder image if needed for list
import itemPlaceholderImage from '../assets/images/logo-1.png';

import './myItemsPage.css'; // Your CSS file


const MyItemsPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate(); // Get navigate hook

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
            console.log('Clearing my items state.');
            dispatch(clearMyItems()); // Dispatch the cleanup action
            dispatch(clearDeleteStatus());
        };

    }, [dispatch, myItemsPagination.currentPage, myItemsPagination.itemsPerPage]); // Re-fetch when page or limit changes


    //------ Addition -------------------------------------------

    // useEffect(() => {
    //     if (id) { console.log(`ItemDetail: Fetching item details for ID: ${id}`); dispatch(fetchItemById(id)); }
    //     return () => {
    //        console.log('ItemDetail: Clearing all relevant state on unmount.');
    //        dispatch(clearCurrentItem());
    //        dispatch(clearClaimStatus());
    //        dispatch(clearUpdateStatus());
    //        dispatch(clearDeleteStatus());
    //        {{ // Clear new status update states on unmount
    //        dispatch(clearMarkReturnedStatus());
    //        dispatch(clearConfirmReceivedStatus());
    //        dispatch(clearCancelClaimStatus());
    //        }}
    //     };
    // }, [id, dispatch]);



    // Effect for claim success (ensure it calls fetchItemById(id) and clearClaimStatus())
    //  useEffect(() => {
    //     if (claimSuccess && claimedItem) {
    //         console.log('Item claimed successfully:', claimedItem);
    //         dispatch(addNotification({ message: `Item "${claimedItem.title}" claimed successfully! The reporter has been notified.`, type: NotificationType.SUCCESS, duration: 8000, }));
    //         dispatch(clearClaimStatus());
    //         dispatch(fetchItemById(id)); // Re-fetch
    //     }
    // }, [claimSuccess, claimedItem, dispatch, navigate, id]);


    //   // Effect for claim errors (ensure it calls clearClaimStatus())
    //   useEffect(() => {
    //     if (claimError) {
    //         console.error('Item claim failed:', claimError);
    //         dispatch(addNotification({ message: `Claim failed: ${claimError}`, type: NotificationType.ERROR, duration: 5000, }));
    //         dispatch(clearClaimStatus());
    //     }
    // }, [claimError, dispatch]);


    // Effect for update success (ensure it calls fetchItemById(id) and clearUpdateStatus())
    // useEffect(() => {
    //     if (updateSuccess && updatedItem) {
    //         console.log('Item updated successfully:', updatedItem);
    //         dispatch(addNotification({ message: `Item "${updatedItem.title || 'Unknown'}" updated successfully!`, type: NotificationType.SUCCESS, duration: 5000, }));
    //         dispatch(clearUpdateStatus());
    //         if (updatedItem.id) { dispatch(fetchItemById(updatedItem.id)); }
    //         else { console.error("EditItemPage: Updated item payload missing ID, cannot re-fetch details."); dispatch(addNotification({ message: 'Item updated, but could not load updated details.', type: NotificationType.WARNING, duration: 5000, })); }
    //     }
    // }, [updateSuccess, updatedItem, dispatch, navigate, id]);


    // Effect for update errors (ensure it calls clearUpdateStatus())
    //  useEffect(() => {
    //     if (updateError) {
    //         console.error('Item update failed:', updateError);
    //         dispatch(addNotification({ message: `Update failed: ${updateError}`, type: NotificationType.ERROR, duration: 5000, }));
    //         dispatch(clearUpdateStatus());
    //     }
    // }, [updateError, dispatch]);



    // // --- Effects for Status Update Success ---
    // {{
    //     useEffect(() => {
    //         if (markReturnedSuccess) {
    //              console.log('Marked as Returned successful.');
    //              dispatch(addNotification({ message: 'Item marked as returned.', type: NotificationType.SUCCESS, duration: 5000 }));
    //              dispatch(clearMarkReturnedStatus());
    //              dispatch(fetchItemById(id)); // Re-fetch to update UI status
    //         }
    //     }, [markReturnedSuccess, dispatch, id]);

    //      useEffect(() => {
    //          if (confirmReceivedSuccess) {
    //               console.log('Confirmed Received successful.');
    //               dispatch(addNotification({ message: 'Item marked as received.', type: NotificationType.SUCCESS, duration: 5000 }));
    //               dispatch(clearConfirmReceivedStatus());
    //               dispatch(fetchItemById(id)); // Re-fetch to update UI status
    //          }
    //      }, [confirmReceivedSuccess, dispatch, id]);

    //      useEffect(() => {
    //          if (cancelClaimSuccess) {
    //               console.log('Claim cancelled successful.');
    //               dispatch(addNotification({ message: 'Item claim cancelled.', type: NotificationType.SUCCESS, duration: 5000 }));
    //               dispatch(clearCancelClaimStatus());
    //               dispatch(fetchItemById(id)); // Re-fetch to update UI status (should go back to FOUND)
    //          }
    //      }, [cancelClaimSuccess, dispatch, id]);
    //     }}
    //     // ------------------------------------------



    //  // --- Effects for Status Update Errors ---
    //  {{
    //     useEffect(() => {
    //         if (markReturnedError) {
    //              console.error('Marked as Returned failed:', markReturnedError);
    //              dispatch(addNotification({ message: `Failed to mark returned: ${markReturnedError}`, type: NotificationType.ERROR, duration: 5000 }));
    //              dispatch(clearMarkReturnedStatus());
    //         }
    //     }, [markReturnedError, dispatch]);

    //      useEffect(() => {
    //          if (confirmReceivedError) {
    //               console.error('Confirmed Received failed:', confirmReceivedError);
    //               dispatch(addNotification({ message: `Failed to confirm received: ${confirmReceivedError}`, type: NotificationType.ERROR, duration: 5000 }));
    //               dispatch(clearConfirmReceivedStatus());
    //          }
    //      }, [confirmReceivedError, dispatch]);

    //      useEffect(() => {
    //          if (cancelClaimError) {
    //               console.error('Claim cancelled failed:', cancelClaimError);
    //               dispatch(addNotification({ message: `Failed to cancel claim: ${cancelClaimError}`, type: NotificationType.ERROR, duration: 5000 }));
    //               dispatch(clearCancelClaimStatus());
    //          }
    //      }, [cancelClaimError, dispatch]);
    //     }}
    //     // ----------------------------------------


    // --------- End Addition ----------------------------------------



    // --- Effect to show error notification ---
    useEffect(() => {
        if (myItemsError) {
            console.error('My items fetch error:', myItemsError);
            dispatch(addNotification({
                message: `Error fetching your items: ${myItemsError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Optional: clear error state in slice if you add clearMyItemsError reducer
        }
    }, [myItemsError, dispatch, navigate]);


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
                page: myItemsPagination.currentPage, // Re-fetch the current page
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


    //=================== Start ================================

    //  // --- Handlers ---
    //     // Handler for Claim Button Click
    //     const handleClaimItem = () => {
    //         if (id && !isClaiming) {
    //             console.log(`ItemDetail: Attempting to claim item with ID: ${id}`);
    //             dispatch(claimItem(id));
    //         }
    //       };

    //       // Handler for Delete Button Click
    //       const handleDeleteItem = () => {
    //           if (id && !isDeleting) {
    //                const isConfirmed = window.confirm('Are you sure you want to delete this item? This action cannot be undone.');
    //                if (isConfirmed) {
    //                    console.log(`ItemDetail: Attempting to delete item with ID: ${id}`);
    //                    dispatch(deleteItem(id));
    //                } else { console.log('Item deletion cancelled by user.'); }
    //           }
    //       };

    //       // --- Handlers for Status Update Buttons ---
    //       {{
    //       const handleMarkReturned = () => {
    //            if (id && !isMarkingReturned) {
    //                 console.log(`ItemDetail: Attempting to mark item ${id} as returned.`);
    //                 dispatch(markItemReturned(id));
    //            }
    //       };

    //        const handleConfirmReceived = () => {
    //            if (id && !isConfirmingReceived) {
    //                 console.log(`ItemDetail: Attempting to confirm received for item ${id}.`);
    //                 dispatch(confirmItemReceived(id));
    //            }
    //        };

    //        const handleCancelClaim = () => {
    //            if (id && !isCancellingClaim) {
    //                 console.log(`ItemDetail: Attempting to cancel claim for item ${id}.`);
    //                 dispatch(cancelItemClaim(id));
    //            }
    //        };
    //       }}
    //       // -------------------------------------------


    //       // --- Determine if any item action is loading (for disabling buttons) ---
    //       {{
    //       const isAnyItemActionLoading = isClaiming || isUpdating || isDeleting || isMarkingReturned || isConfirmingReceived || isCancellingClaim;
    //       }}
    //       // ---------------------------------------------------------------------



    // --- Render Loading/Error/Not Found States ---
    // // Show loading state for initial fetch OR any item action
    // if (isItemLoading || {{isAnyItemActionLoading}}) { // Use isAnyItemActionLoading
    //     return <div style={{ textAlign: 'center', marginTop: '50px' }}>{isAnyItemActionLoading ? 'Processing action...' : 'Loading item details...'}</div>; // Update loading text
    //   }

    //    // Show error or "not found" message if initial fetch failed OR any action failed
    //    if (itemError || (!currentItem && !isItemLoading) || {{claimError || updateError || deleteError || markReturnedError || confirmReceivedError || cancelClaimError}}) { // Include all errors
    //        const displayError = {{claimError || updateError || deleteError || markReturnedError || confirmReceivedError || cancelClaimError}} || itemError || 'Item not found or could not be loaded.'; // Prioritize action errors
    //        return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
    //            {displayError}
    //        </div>;
    //    }

    //  // --- Ensure item data is available before rendering ---
    //  if (!currentItem) {
    //      return <div style={{ textAlign: 'center', marginTop: '50px' }}>Item data not available.</div>;
    //  }

    //====================End ====================================




    // Handle pagination click (now updates the current page by triggering a new fetch)
    const paginateMyItems = (pageNumber) => {
        // Only dispatch if the page number is valid and different from current
        if (pageNumber > 0 && pageNumber <= myItemsPagination.totalPages && pageNumber !== myItemsPagination.currentPage) {
            console.log(`Paginating My Items to page ${pageNumber}`);
            // Dispatch fetchMyItems with the new page number
            dispatch(fetchMyItems({
                page: pageNumber,
                limit: myItemsPagination.itemsPerPage, // Use current limit
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


    // Determine items to display - comes from Redux state
    const itemsToDisplay = myItems;
    const { totalPages, currentPage } = myItemsPagination;


    return (
        <div className="my-items-container">
            <h1>My Items</h1>

            {/* --- LOADING, ERROR, EMPTY, AND ITEM LIST RENDERING --- */}
            {isMyItemsLoading && <p style={{ textAlign: 'center' }}>Loading your items...</p>}

            {myItemsError && <p style={{ textAlign: 'center', color: 'red' }}>{myItemsError}</p>}


            {!isMyItemsLoading && itemsToDisplay?.length === 0 && !myItemsError && (
                <p style={{ textAlign: 'center' }}>You haven't reported or claimed any items yet.</p>
            )}

            {!isMyItemsLoading && !myItemsError && itemsToDisplay?.length > 0 && (
                <div className="item-list"> {/* Reusing item-list class */}
                    {itemsToDisplay.map(item => (
                        <div key={item.id} className="item-card"> {/* Reusing item-card class */}
                            <h2>{item.title}</h2>
                            <img
                                src={item.imageUrlFront || itemPlaceholderImage}
                                alt={item.title}
                                className="item-image"
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
                                    disabled={isMyItemsLoading || isDeleting}
                                >
                                    Edit
                                </Link>
                            )}

                            {/* Mark as Returned (for reportedBy user) */}
                            {isAuthenticated && user?.id === item.reportedById && item.status === 'CLAIMED' && (
                                // TODO: Implement handleMarkReturned function (dispatch thunk)
                                <button className="btn-action success" disabled={isMyItemsLoading || isDeleting}>Mark as Returned</button>
                            )}
                            {/* Confirm Received (for claimedBy user) */}
                            {isAuthenticated && user?.id === item.claimedById && item.status === 'CLAIMED' && (
                                // TODO: Implement handleConfirmReceived function (dispatch thunk)
                                <button className="btn-action success" disabled={isMyItemsLoading || isDeleting}>Confirm Received</button>
                            )}
                            {/* Cancel Claim (for claimedBy user) */}
                            {isAuthenticated && user?.id === item.claimedById && item.status === 'CLAIMED' && (
                                // TODO: Implement handleCancelClaim function (dispatch thunk)
                                <button className="btn-action danger" disabled={isMyItemsLoading || isDeleting}>Cancel Claim</button>
                            )}

                            {/* Delete button */}
                            {/* Show if authenticated, and user is authorized (reporter OR Admin/Super Admin) AND status allows deletion */}
                            {isAuthenticated && (user?.id === item.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (item.status !== 'CLAIMED' && item.status !== 'RETURNED') && ( // Adjust statuses as needed for deletion permission
                                <button
                                    className="btn-action danger" // Reuse button styling
                                    onClick={() => handleDeleteItem(item.id)} // Pass item.id to handler
                                    disabled={isMyItemsLoading || isDeleting} // Disable while items loading or deleting
                                >
                                    {isDeleting ? 'Deleting...' : 'Delete'} {/* Change text while deleting */}
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
                                        disabled={isMyItemsLoading || isDeleting} // Disable while items loading or deleting
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
    );
};

export default MyItemsPage;