import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useParams and useNavigate
import { useDispatch, useSelector } from 'react-redux'; // Import Redux hooks
// Import the fetchItemById thunk and clearCurrentItem action
import { fetchItemById, clearCurrentItem } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice'; // Import notification actions

import './itemDetail.css'; // We'll create this CSS file next
import itemPlaceholderImage from '../assets/images/logo-1.png'; // Placeholder image


const ItemDetail = () => {
  // Get the 'id' parameter from the URL
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate(); // Get navigate hook

  // Select the single item state from the items slice
  const { currentItem, isItemLoading, itemError } = useSelector((state) => state.items);
  // Select auth state to check if user is logged in and get user ID/role for conditional buttons
  const { isAuthenticated, user } = useSelector((state) => state.auth);


  // --- Effect to fetch the item details when the component mounts or ID changes ---
  useEffect(() => {
    if (id) { // Ensure ID exists before fetching
      console.log(`Fetching item details for ID: ${id}`);
      dispatch(fetchItemById(id));
    }

    // Cleanup function: Clear the current item state when the component unmounts
    return () => {
      console.log('Clearing current item state.');
      dispatch(clearCurrentItem());
    };

  }, [id, dispatch]); // Re-fetch if the ID from the URL or dispatch changes


  // --- Effect to show error notification if fetching fails ---
  useEffect(() => {
    if (itemError) {
        console.error('Item detail fetch error:', itemError);
        dispatch(addNotification({
            message: `Error: ${itemError}`, // Show the specific error message
            type: NotificationType.ERROR,
            duration: 5000,
        }));
        // Optional: Redirect the user if the item is not found or a critical error occurs
         // if (itemError.toLowerCase().includes('not found')) { // Check for specific "not found" message from backend
         //     console.log('Redirecting after item not found error...');
         //     // Use navigate with replace: true to avoid stacking bad URLs in history
         //     setTimeout(() => navigate('/', { replace: true }), 3000); // Redirect after 3 seconds
         // }
    }
  }, [itemError, dispatch, navigate]); // Depend on itemError, dispatch, navigate


  // --- Render Loading State ---
  if (isItemLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading item details...</div>;
  }

  // --- Render Error State or Item Not Found State ---
   // If there was an error fetching or no item was returned after loading finishes
   if (itemError || (!currentItem && !isItemLoading)) {
        // You could customize the message based on itemError here
        return <div style={{ textAlign: 'center', marginTop: '50px', color: itemError ? 'red' : 'inherit' }}>
            {itemError || 'Item not found or could not be loaded.'}
        </div>;
   }

   // --- Render Item Details (if currentItem is successfully loaded) ---
   // Ensure currentItem exists before trying to access its properties
   if (!currentItem) {
       // This should theoretically not be reached if the above checks work, but as a fallback:
       // Or if loadAuthState somehow caused currentItem to be non-null initially then cleared.
       return <div style={{ textAlign: 'center', marginTop: '50px' }}>An issue occurred loading item details.</div>;
   }


  return (
    <div className="item-detail-container"> {/* Container for styling */}
      <h1>{currentItem.title}</h1> {/* Display title */}

      <div className="item-images"> {/* Container for images */}
        {/* Display Front Image */}
        <div className="image-wrapper"> {/* Wrapper for individual image */}
            {currentItem.imageUrlFront ? (
              <img src={currentItem.imageUrlFront} alt={`${currentItem.title} (Front)`} className="item-detail-image" />
            ) : (
              <img src={itemPlaceholderImage} alt="No front image available" className="item-detail-image placeholder" />
            )}
            {/* Optional: Caption */}
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
         {/* Optional: placeholder if back image is missing but you want the space */}
         {/* {!currentItem.imageUrlBack && <div className="image-wrapper"><img src={itemPlaceholderImage} alt="No back image available" className="item-detail-image placeholder" /></div>} */}
      </div>

      <div className="item-info"> {/* Container for text info */}
        <p><strong>Status:</strong> {currentItem.status}</p>
        <p><strong>Category:</strong> {currentItem.category}</p>
        <p><strong>Location:</strong> {currentItem.location}</p>
        <p><strong>Description:</strong> {currentItem.description}</p>
        {/* Optional: Display reported date, reported by user (handle privacy!) */}
        {/* Your backend needs to include reportedBy in the single item fetch if you want the name */}
        {/* Example: assuming backend returns `reportedBy: { name: '...' }` */}
         {/* {currentItem.reportedBy?.name && <p><strong>Reported By:</strong> {currentItem.reportedBy.name}</p>} */}
         {currentItem.createdAt && <p><strong>Reported On:</strong> {new Date(currentItem.createdAt).toLocaleDateString()}</p>}


        {/* --- Conditional Buttons (Claim, Edit, Delete) --- */}
        <div className="item-actions">
            {/* Claim Button: Show if authenticated, item is FOUND, and user is NOT the reporter */}
            {isAuthenticated && currentItem.status === 'FOUND' && user?.id !== currentItem.reportedById && (
                 // TODO: Implement handleClaim function
                 <button className="btn-action primary">Claim Item</button>
            )}

             {/* Edit Button: Show if authenticated, and user is the reporter OR is an Admin/Super Admin */}
             {isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                 // TODO: Implement Link/handleEdit function (navigate to /items/:id/edit)
                 <button className="btn-action secondary">Edit Item</button>
             )}

             {/* Delete Button: Show if authenticated, and user is the reporter (for their own items) OR is an Admin/Super Admin */}
              {isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
                 // TODO: Implement handleDelete function (dispatch delete thunk)
                 <button className="btn-action danger">Delete Item</button>
             )}

            {/* Example: Button to mark as Returned (for reportedBy user) */}
            {isAuthenticated && user?.id === currentItem.reportedById && currentItem.status === 'CLAIMED' && (
                 // TODO: Implement handleMarkReturned function
                 <button className="btn-action success">Mark as Returned</button>
            )}

             {/* Example: Button to Mark as Returned (for claimedBy user) */}
             {isAuthenticated && user?.id === currentItem.claimedById && currentItem.status === 'CLAIMED' && (
                 // TODO: Implement handleConfirmReceived function
                 <button className="btn-action success">Confirm Received</button>
            )}

            {/* Add more actions based on status and roles */}

        </div>
        {/* ------------------------------------------------- */}


      </div>
    </div>
  );
};

export default ItemDetail;