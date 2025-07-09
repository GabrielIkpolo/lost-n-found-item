import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// Import fetchItemById, clearCurrentItem, claimItem thunk, and clearClaimStatus action
import { fetchItemById, clearCurrentItem, claimItem, clearClaimStatus } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

import './itemDetail.css';
import itemPlaceholderImage from '../assets/images/logo-1.png';


const ItemDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select item state, including claim state
  const { currentItem, isItemLoading, itemError, 
    isClaiming, claimError, claimSuccess, claimedItem } = useSelector((state) => state.items);
  // Select auth state
  const { isAuthenticated, user } = useSelector((state) => state.auth);


  // --- Effect to fetch the item details when the component mounts or ID changes ---
  useEffect(() => {
    if (id) {
      console.log(`Fetching item details for ID: ${id}`);
      dispatch(fetchItemById(id));
    }

    return () => {
      console.log('Clearing current item state and claim status.');
      dispatch(clearCurrentItem());
      // Also clear claim status when leaving the page
      dispatch(clearClaimStatus());
    };

  }, [id, dispatch]);


  // --- Effect to show error notification if fetching fails ---
  useEffect(() => {
    if (itemError) {
        console.error('Item detail fetch error:', itemError);
        dispatch(addNotification({
            message: `Error: ${itemError}`,
            type: NotificationType.ERROR,
            duration: 5000,
        }));
         // Optional: Redirect if item not found
     }
  }, [itemError, dispatch, navigate]);

  // --- Effect to handle successful claim ---
  useEffect(() => {
      if (claimSuccess && claimedItem) {
          console.log('Item claimed successfully:', claimedItem);
          dispatch(addNotification({
              message: `Item "${claimedItem.title}" claimed successfully! The reporter has been notified.`,
              type: NotificationType.SUCCESS,
              duration: 8000, // Give user time to read notification
          }));

          // Optional: Update the currentItem state with the new data from the backend
          // This will automatically re-render the component with the new status/claimedBy info
          // Note: This is a workaround if you don't want to re-fetch the entire item.
          // A more robust solution might be to dispatch an action to update the item in the store.
          // Or simply re-fetch the item details after a successful claim:
          // dispatch(fetchItemById(id));

          // For now, we'll rely on dispatching clearClaimStatus and let the next fetch (if any)
          // or navigating away/back handle state freshness. If staying on the page,
          // re-fetching or manually updating currentItem is recommended.
           // Let's re-fetch the item details to get the latest state from the server
           dispatch(fetchItemById(id)); // Re-fetch the item details

          // Clear the claim status flags
          dispatch(clearClaimStatus());

          // Optional: Redirect user after successful claim
          // navigate('/my-items'); // Redirect to My Items page
      }
  }, [claimSuccess, claimedItem, dispatch, navigate, id]); // Depend on claimSuccess, claimedItem, etc.


   // --- Effect to handle claim errors ---
   useEffect(() => {
       if (claimError) {
           console.error('Item claim failed:', claimError);
           dispatch(addNotification({
               message: `Claim failed: ${claimError}`,
               type: NotificationType.ERROR,
               duration: 5000,
           }));
           // Clear the claim error state after showing notification
           dispatch(clearClaimStatus()); // Clear status after showing notification
       }
   }, [claimError, dispatch]); // Depend on claimError and dispatch


  // --- Handler for Claim Button Click ---
  const handleClaimItem = () => {
      if (id && !isClaiming) { // Ensure we have an ID and are not already claiming
          console.log(`Attempting to claim item with ID: ${id}`);
          dispatch(claimItem(id)); // Dispatch the claimItem thunk
      }
  };


  // --- Render Loading State ---
  if (isItemLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading item details...</div>;
  }

  // --- Render Error State or Item Not Found State ---
   if (itemError || (!currentItem && !isItemLoading)) {
        return <div style={{ textAlign: 'center', marginTop: '50px', color: itemError ? 'red' : 'inherit' }}>
            {itemError || 'Item not found or could not be loaded.'}
        </div>;
   }

   // --- Render Item Details (if currentItem is successfully loaded) ---
   if (!currentItem) {
       return <div style={{ textAlign: 'center', marginTop: '50px' }}>An issue occurred loading item details.</div>;
   }


  return (
    <div className="item-detail-container">
      <h1>{currentItem.title}</h1>

      <div className="item-images">
        <div className="image-wrapper">
            {currentItem.imageUrlFront ? (
              <img src={currentItem.imageUrlFront} alt={`${currentItem.title} (Front)`} className="item-detail-image" />
            ) : (
              <img src={itemPlaceholderImage} alt="No front image available" className="item-detail-image placeholder" />
            )}
             {currentItem.imageUrlFront && <div className="image-caption">Front View</div>}
        </div>

        {currentItem.imageUrlBack && (
          <div className="image-wrapper">
             <img src={currentItem.imageUrlBack} alt={`${currentItem.title} (Back)`} className="item-detail-image" />
             <div className="image-caption">Back View</div>
          </div>
        )}
      </div>

      <div className="item-info">
        <p><strong>Status:</strong> {currentItem.status}</p>
        <p><strong>Category:</strong> {currentItem.category}</p>
        <p><strong>Location:</strong> {currentItem.location}</p>
        <p><strong>Description:</strong> {currentItem.description}</p>
         {currentItem.createdAt && <p><strong>Reported On:</strong> {new Date(currentItem.createdAt).toLocaleDateString()}</p>}


        {/* --- Conditional Buttons (Claim, Edit, Delete) --- */}
        <div className="item-actions">
            {/* Claim Button: Show if authenticated, item is FOUND, and user is NOT the reporter */}
            {/* Ensure user and currentItem are loaded before checking IDs */}
            {isAuthenticated && currentItem.status === 'FOUND' && user?.id !== currentItem.reportedById && (
                 <button
                     className="btn-action primary"
                     onClick={handleClaimItem} // Add click handler
                     disabled={isClaiming} // Disable while claiming
                 >
                    {isClaiming ? 'Claiming...' : 'Claim Item'} {/* Change text while claiming */}
                 </button>
            )}

             {/* Edit Button: Show if authenticated, and user is the reporter OR is an Admin/Super Admin */}
             {isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                 // TODO: Implement Link/handleEdit function (navigate to /items/:id/edit)
                 // Disable while any item action (claiming, deleting, etc.) is in progress globally or specifically
                 <button className="btn-action secondary" /* onClick={() => navigate(`/my-items/${item.id}/edit`)} */ disabled={isClaiming /* || isDeleting || isUpdatingStatus */}>Edit Item</button>
             )}

             {/* Delete Button: Show if authenticated, and user is the reporter (for their own items) OR is an Admin/Super Admin */}
              {isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (currentItem.status !== 'CLAIMED' && currentItem.status !== 'RETURNED') && ( // Adjust statuses as needed for deletion permission
                 // TODO: Implement handleDelete function (dispatch delete thunk)
                 // Disable while any item action is in progress
                 <button className="btn-action danger" /* onClick={() => handleDeleteItem(currentItem.id)} */ disabled={isClaiming /* || isDeleting || isUpdatingStatus */}>Delete Item</button>
             )}

            {/* Example: Button to mark as Returned (for reportedBy user) */}
            {isAuthenticated && user?.id === currentItem.reportedById && currentItem.status === 'CLAIMED' && (
                 // TODO: Implement handleMarkReturned function (dispatch thunk)
                 // Disable while any item action is in progress
                 <button className="btn-action success" disabled={isClaiming /* || isDeleting || isUpdatingStatus */}>Mark as Returned</button>
            )}

             {/* Example: Confirm Received for items YOU claimed that are now CLAIMED */}
             {isAuthenticated && user?.id === currentItem.claimedById && currentItem.status === 'CLAIMED' && (
                 // TODO: Implement handleConfirmReceived function (dispatch thunk)
                 // Disable while any item action is in progress
                 <button className="btn-action success" disabled={isClaiming /* || isDeleting || isUpdatingStatus */}>Confirm Received</button>
            )}

              {/* Example: Cancel Claim for items YOU claimed that are still CLAIMED */}
              {isAuthenticated && user?.id === currentItem.claimedById && currentItem.status === 'CLAIMED' && (
                   // TODO: Implement handleCancelClaim function (dispatch thunk)
                   // Disable while any item action is in progress
                   <button className="btn-action danger" disabled={isClaiming /* || isDeleting || isUpdatingStatus */}>Cancel Claim</button>
              )}

            {/* Add more actions based on status and roles */}

        </div>
        {/* ------------------------------------------------- */}


      </div>
    </div>
  );
};

export default ItemDetail;