import React, { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// Import fetchItemById, clearCurrentItem, claimItem thunk, and clearClaimStatus action
import {
  fetchItemById, updateItem, deleteItem, claimItem,
    markItemReturned, confirmItemReceived, cancelItemClaim, 
    clearCurrentItem, clearUpdateStatus, clearDeleteStatus, clearClaimStatus, 
    clearMarkReturnedStatus, clearConfirmReceivedStatus, clearCancelClaimStatus 
} from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import { useSelector as useAuthSelector } from 'react-redux';

import './itemDetail.css';
import itemPlaceholderImage from '../assets/images/logo-1.png';


const ItemDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select item state, including claim state
  const { currentItem, isItemLoading, itemError,
    isClaiming, claimError, claimSuccess, isUpdating,
    claimedItem, updateError, updateSuccess, updatedItem,
    isDeleting, deleteError, deleteSuccess, deletedItemId } = useSelector((state) => state.items);
  // Select auth state
  const { isAuthenticated, user } = useSelector((state) => state.auth);


  // --- Effect 1: Fetch the item details when the component mounts or ID changes ---
  useEffect(() => {
    if (id) {
      console.log(`ItemDetail: Fetching item details for ID: ${id}`);
      dispatch(fetchItemById(id));
    }

    // Cleanup function: Clear states when leaving the page
    return () => {
      console.log('ItemDetail: Clearing current item state, claim, update, and delete status.');
      dispatch(clearCurrentItem());
      dispatch(clearClaimStatus());
      dispatch(clearUpdateStatus());
      {
        {
          dispatch(clearDeleteStatus()); // Clear delete status specifically
        }
      }
    };

  }, [id, dispatch]);


  // --- 5. Effect to show error notification if fetching fails ---
  useEffect(() => {
    if (itemError) {
      console.error('Item detail fetch error:', itemError);
      dispatch(addNotification({
        message: `Error: ${itemError}`,
        type: NotificationType.ERROR,
        duration: 5000,
      }));
      // Optional: Redirect if item not found
      if (itemError.toLowerCase().includes('not found') || itemError.toLowerCase().includes('unauthorized') || itemError.toLowerCase().includes('forbidden')) {
        console.log('ItemDetail: Redirecting after fetch error...');
        // Redirect to home or a 404 page
        setTimeout(() => navigate('/', { replace: true }), 3000);
      }
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

      // For now, we'll rely on dispatching clearClaimStatus and let the next fetch (if any)
      // or navigating away/back handle state freshness. If staying on the page,
      // re-fetching or manually updating currentItem is recommended.
      // Let's re-fetch the item details to get the latest state from the server

      // Clear the claim status flags
      dispatch(clearClaimStatus());

      dispatch(fetchItemById(id)); // Re-fetch the item details

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



  // --- Effect 8: Handle successful item deletion ---
  useEffect(() => {
    if (deleteSuccess && deletedItemId === id) { // Check if the deleted item ID matches the current item ID
      console.log(`Item ${deletedItemId} deleted successfully.`);
      dispatch(addNotification({
        message: 'Item deleted successfully.',
        type: NotificationType.SUCCESS,
        duration: 5000,
      }));

      // Clear the delete status flags
      dispatch(clearDeleteStatus());

      // Redirect the user since the item they were viewing is gone
      console.log('Redirecting after item deletion...');
      navigate('/my-items', { replace: true }); // Redirect to My Items page or home
    }
  }, [deleteSuccess, deletedItemId, dispatch, navigate, id]); // Depend on deleteSuccess, deletedItemId, etc.

  // --- Effect 9: Handle item deletion errors ---
  useEffect(() => {
    if (deleteError) {
      console.error('Item deletion failed:', deleteError);
      dispatch(addNotification({
        message: `Deletion failed: ${deleteError}`,
        type: NotificationType.ERROR,
        duration: 5000,
      }));
      // Clear the delete error state after showing notification
      dispatch(clearDeleteStatus()); // Clear status after showing notification
    }
  }, [deleteError, dispatch]);


  // --- Handler for Claim Button Click ---
  const handleClaimItem = () => {
    if (id && !isClaiming) { // Ensure we have an ID and are not already claiming
      console.log(`Attempting to claim item with ID: ${id}`);
      dispatch(claimItem(id)); // Dispatch the claimItem thunk
    }
  };


  // --- Handler for Delete Button Click ---
  const handleDeleteItem = () => {
    if (id && !isDeleting) { // Ensure we have an ID and are not already deleting
      // Show a confirmation dialog
      const isConfirmed = window.confirm('Are you sure you want to delete this item? This action cannot be undone.');

      if (isConfirmed) {
        console.log(`ItemDetail: Attempting to delete item with ID: ${id}`);
        dispatch(deleteItem(id)); // Dispatch the deleteItem thunk
      } else {
        console.log('Item deletion cancelled by user.');
      }
    }
  };


  // --- Render Loading/Error/Not Found States ---
  // Show loading state for initial fetch OR deletion
  if (isItemLoading || isDeleting) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>{isDeleting ? 'Deleting item...' : 'Loading item details...'}</div>;
  }

  // Show error or "not found" message if initial fetch failed OR deletion failed
  if (itemError || (!currentItem && !isItemLoading) || deleteError) {
    // Prioritize deletion error message if present
    const displayError = deleteError || itemError || 'Item not found or could not be loaded.';
    return <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
      {displayError}
    </div>;
  }

  // --- Ensure item data is available before rendering the form ---
  // This check is after loading and error states
  if (!currentItem) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Item data not available.</div>;
  }


  // --- Check User Permissions before rendering action buttons ---
  // Check permission to *edit* and *delete* separately
  const canEdit = isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');
  const canDelete = isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (currentItem.status !== 'CLAIMED' && currentItem.status !== 'RETURNED');

  return (
    <div className="item-detail-container">
      <h1>{currentItem.title}</h1>

      {/* ... existing image and info display ... */}
      <div className="item-images"> {/* Container for images */}
        {/* Display Front Image */}
        <div className="image-wrapper"> {/* Wrapper for individual image */}
          {currentItem.imageUrlFront ? (
            <img src={currentItem.imageUrlFront} alt={`${currentItem.title} (Front)`} className="item-detail-image" />
          ) : (
            <img src={itemPlaceholderImage} alt="No front image available" className="item-detail-image placeholder" />
          )}
          {currentItem.imageUrlFront && <div className="image-caption">Front View</div>}
        </div>


        {/* Display Back Image (only if it exists) */}
        {currentItem.imageUrlBack && (
          <div className="image-wrapper"> {/* Wrapper for individual image */}
            <img src={currentItem.imageUrlBack} alt={`${currentItem.title} (Back)`} className="item-detail-image" />
            {/* Optional: Caption */}
            <div className="image-caption">Back View</div>
          </div>
        )}
      </div>

      <div className="item-info"> {/* Container for text info */}
        <p><strong>Status:</strong> {currentItem.status}</p>
        <p><strong>Category:</strong> {currentItem.category}</p> {/* Picking up here */}
        <p><strong>Location:</strong> {currentItem.location}</p>
        <p><strong>Description:</strong> {currentItem.description}</p>
        {currentItem.createdAt && <p><strong>Reported On:</strong> {new Date(currentItem.createdAt).toLocaleDateString()}</p>}

        {/* Add Reported By name if available and appropriate */}
        {/* Your backend needs to include reportedBy in the single item fetch if you want the name */}
        {/* Example: assuming backend returns `reportedBy: { name: '...' }` */}
        {/* {currentItem.reportedBy?.name && <p><strong>Reported By:</strong> {currentItem.reportedBy.name}</p>} */}


        {/* --- Conditional Buttons (Claim, Edit, Delete, Status Updates) --- */}
        <div className="item-actions">
          {/* Claim Button: Show if authenticated, item is FOUND, and user is NOT the reporter */}
          {/* Ensure user and currentItem are loaded before checking IDs */}
          {isAuthenticated && currentItem.status === 'FOUND' && user?.id !== currentItem.reportedById && (
            <button
              className="btn-action primary"
              onClick={handleClaimItem} // Add click handler
              disabled={isClaiming || isUpdating || isDeleting /* Add other relevant loading states */}
            >
              {isClaiming ? 'Claiming...' : 'Claim Item'}
            </button>
          )}

          {/* Edit Button: Show if authenticated, and user is the reporter OR is an Admin/Super Admin */}
          {/* Also check if item data is loaded */}
          {isAuthenticated && currentItem && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && canEdit && ( // Use canEdit check for clarity
            <Link
              to={`/items/${currentItem.id}/edit`} // Link to the edit route using item ID
              className="btn-action secondary" // Reuse button styling
              disabled={isClaiming || isUpdating || isDeleting /* Add other relevant loading states */} // Disable if other actions are in progress
            >
              Edit Item
            </Link>
          )}

          {/* Delete Button: Show if authenticated, and user is authorized (reporter OR Admin/Super Admin) AND status allows deletion */}
          {/* Also check if item data is loaded */}
          {isAuthenticated && currentItem && canDelete && ( // Use canDelete check for clarity
            <button
              className="btn-action danger" // Reuse button styling
              onClick={handleDeleteItem} // Add delete click handler
              disabled={isClaiming || isUpdating || isDeleting /* Add other relevant loading states */} // Disable while any item action is in progress
            >
              {isDeleting ? 'Deleting...' : 'Delete Item'} {/* Change text while deleting */}
            </button>
          )}

          {/* Example: Button to mark as Returned (for reportedBy user) */}
          {isAuthenticated && user?.id === currentItem.reportedById && currentItem.status === 'CLAIMED' && (
            // TODO: Implement handleMarkReturned function (dispatch thunk)
            // Disable while any item action is in progress
            <button className="btn-action success" disabled={isClaiming || isUpdating || isDeleting /* Add other relevant loading states */}>Mark as Returned</button>
          )}

          {/* Example: Confirm Received for items YOU claimed that are now CLAIMED */}
          {isAuthenticated && user?.id === currentItem.claimedById && currentItem.status === 'CLAIMED' && (
            // TODO: Implement handleConfirmReceived function (dispatch thunk)
            // Disable while any item action is in progress
            <button className="btn-action success" disabled={isClaiming || isUpdating || isDeleting /* Add other relevant loading states */}>Confirm Received</button>
          )}

          {/* Example: Cancel Claim for items YOU claimed that are still CLAIMED */}
          {isAuthenticated && user?.id === currentItem.claimedById && currentItem.status === 'CLAIMED' && (
            // TODO: Implement handleCancelClaim function (dispatch thunk)
            // Disable while any item action is in progress
            <button className="btn-action danger" disabled={isClaiming || isUpdating || isDeleting }>Cancel Claim</button>
          )}

          {/* Add more actions based on status and roles */}

        </div>
        {/* ------------------------------------------------- */}


      </div>
    </div> 
  );
};

export default ItemDetail;