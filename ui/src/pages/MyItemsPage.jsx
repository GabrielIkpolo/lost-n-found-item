import React, { useEffect, useState } from 'react'; // Import useState for local pagination
import { useDispatch, useSelector } from 'react-redux';
// Import the thunk to fetch my items and the cleanup action
import { fetchMyItems, clearMyItems } from '../features/items/itemsSlice';
// Import notification actions
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
    const { myItems, myItemsPagination, isMyItemsLoading, myItemsError } = useSelector(state => state.items);
    // Select auth state to check user role if needed for specific actions on items
    const { isAuthenticated, user } = useSelector(state => state.auth);

    // Local state for pagination (though Redux state holds the source of truth)
    // We'll use the Redux pagination state directly in the fetch call params and rendering
    // Local state might be used for filters specific to My Items later, if needed.

    // --- Effect to fetch user's items on mount and when pagination changes ---
    useEffect(() => {
        console.log(`Fetching my items. Page: ${myItemsPagination.currentPage}, Limit: ${myItemsPagination.itemsPerPage}`);
        // Dispatch fetchMyItems thunk with current pagination params
        dispatch(fetchMyItems({
             page: myItemsPagination.currentPage,
             limit: myItemsPagination.itemsPerPage,
             // Add filters specific to 'my-items' here if your backend supports them
             // For example, to filter by status:
             // status: 'LOST',
        }));

        // Cleanup function: Clear the 'my items' state when the component unmounts
        return () => {
           console.log('Clearing my items state.');
           dispatch(clearMyItems()); // Dispatch the cleanup action
        };

    }, [dispatch, myItemsPagination.currentPage, myItemsPagination.itemsPerPage]); // Re-fetch when page or limit changes


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
     }, [myItemsError, dispatch]); // Depend on myItemsError state and dispatch


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


    // Determine items to display - comes from Redux state
    const itemsToDisplay = myItems;
    // Determine pagination properties from Redux state
    const { totalPages, currentPage } = myItemsPagination;


    return (
        <div className="my-items-container"> {/* Use the container class from CSS */}
            <h1>My Items</h1>

            {/* --- LOADING, ERROR, EMPTY, AND ITEM LIST RENDERING --- */}
            {isMyItemsLoading && <p style={{ textAlign: 'center' }}>Loading your items...</p>}

            {/* Error notification is handled by the useEffect. Optionally show inline error too */}
             {myItemsError && <p style={{ textAlign: 'center', color: 'red' }}>{myItemsError}</p>}


            {!isMyItemsLoading && itemsToDisplay?.length === 0 && !myItemsError && (
                 <p style={{ textAlign: 'center' }}>You haven't reported or claimed any items yet.</p>
            )}

            {!isMyItemsLoading && !myItemsError && itemsToDisplay?.length > 0 && (
                 <div className="item-list"> {/* Reusing item-list class, adjust CSS if needed */}
                     {itemsToDisplay.map(item => (
                         <div key={item.id} className="item-card"> {/* Reusing item-card class */}
                             <h2>{item.title}</h2>
                             {/* Display image if imageUrlFront exists, otherwise use placeholder */}
                             <img
                                src={item.imageUrlFront || itemPlaceholderImage}
                                alt={item.title}
                                className="item-image" // Reusing item-image class
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
                             <Link to={`/items/${item.id}`} className="btn-details"> {/* Reusing btn-details class */}
                                 View Details
                             </Link>

                             {/* --- Conditional Actions on My Items --- */}
                             {/* Example: Edit button for items YOU reported (if status allows, e.g., LOST or FOUND) */}
                             {isAuthenticated && user?.id === item.reportedById && (item.status === 'LOST' || item.status === 'FOUND') && (
                                  // TODO: Implement Link or onClick handler for Edit page (/my-items/:id/edit or /items/:id/edit)
                                  <button className="btn-action secondary" /* onClick={() => navigate(`/my-items/${item.id}/edit`)} */>Edit</button>
                             )}

                              {/* Example: Mark as Returned for items YOU reported as FOUND that are now CLAIMED */}
                              {isAuthenticated && user?.id === item.reportedById && item.status === 'CLAIMED' && (
                                   // TODO: Implement handleMarkReturned function (dispatch thunk)
                                   <button className="btn-action success">Mark as Returned</button>
                              )}

                               {/* Example: Confirm Received for items YOU claimed that are now CLAIMED */}
                               {isAuthenticated && user?.id === item.claimedById && item.status === 'CLAIMED' && (
                                    // TODO: Implement handleConfirmReceived function (dispatch thunk)
                                    <button className="btn-action success">Confirm Received</button>
                               )}

                              {/* Example: Cancel Claim for items YOU claimed that are still CLAIMED */}
                              {isAuthenticated && user?.id === item.claimedById && item.status === 'CLAIMED' && (
                                   // TODO: Implement handleCancelClaim function (dispatch thunk)
                                   <button className="btn-action danger">Cancel Claim</button>
                              )}

                              {/* Example: Delete button for items YOU reported (if status allows) or if Admin/Super Admin */}
                              {isAuthenticated && (user?.id === item.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (item.status === 'LOST' || item.status === 'FOUND' || item.status === 'ARCHIVED') && ( // Adjust statuses as needed
                                   // TODO: Implement handleDelete function (dispatch thunk)
                                   <button className="btn-action danger">Delete</button>
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
                                         onClick={() => paginateMyItems(page)} // Use the specific paginate function
                                         className={myItemsPagination.currentPage === page ? 'active' : ''}
                                         disabled={isMyItemsLoading} // Disable pagination while loading
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