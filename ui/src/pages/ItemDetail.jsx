import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchItemById, deleteItem, claimItem,
  markItemReturned, confirmItemReceived, cancelItemClaim,
  clearCurrentItem, clearUpdateStatus, clearDeleteStatus, clearClaimStatus,
  clearMarkReturnedStatus, clearConfirmReceivedStatus, clearCancelClaimStatus
} from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';

import './itemDetail.css';
import itemPlaceholderImage from '../assets/images/logo-1.png';
import Sidebar from '../components/Sidebar';
import ClaimModal from '../components/ClaimModal';

const ItemDetail = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select item state
  const { currentItem, isItemLoading, itemError,
    isClaiming, claimError, claimSuccess, claimedItem,
    isDeleting, deleteError, deleteSuccess, deletedItemId,
    isMarkingReturned, markReturnedError, markReturnedSuccess,
    isConfirmingReceived, confirmReceivedError, confirmReceivedSuccess,
    isCancellingClaim, cancelClaimError, cancelClaimSuccess
  } = useSelector((state) => state.items);

  // Select auth state
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Effect 1: Fetch item details ---
  useEffect(() => {
    if (id) {
      dispatch(fetchItemById(id));
    }
    // Cleanup
    return () => {
      dispatch(clearCurrentItem());
      dispatch(clearClaimStatus());
      dispatch(clearUpdateStatus());
      dispatch(clearDeleteStatus());
      dispatch(clearMarkReturnedStatus());
      dispatch(clearConfirmReceivedStatus());
      dispatch(clearCancelClaimStatus());
    };
  }, [id, dispatch]);

  // --- Effect 2: Error Handling ---
  useEffect(() => {
    if (itemError) {
      dispatch(addNotification({ message: `Error: ${itemError}`, type: NotificationType.ERROR, duration: 5000 }));
      if (itemError.toLowerCase().includes('not found')) {
        setTimeout(() => navigate('/', { replace: true }), 3000);
      }
    }
  }, [itemError, dispatch, navigate]);

  // --- Effect 3: Claim Success ---
  useEffect(() => {
    if (claimSuccess && claimedItem) {
      dispatch(addNotification({
        message: `Item claimed! Check your email for handover instructions.`,
        type: NotificationType.SUCCESS,
        duration: 8000,
      }));
      dispatch(clearClaimStatus());
      dispatch(fetchItemById(id)); // Re-fetch to get unmasked contact info
    }
  }, [claimSuccess, claimedItem, dispatch, id]);

  // --- Effect 4: Claim Error ---
  useEffect(() => {
    if (claimError) {
      dispatch(addNotification({ message: `Claim failed: ${claimError}`, type: NotificationType.ERROR, duration: 5000 }));
      dispatch(clearClaimStatus());
    }
  }, [claimError, dispatch]);

  // --- Effect 5: Delete Success ---
  useEffect(() => {
    if (deleteSuccess && deletedItemId === id) {
      dispatch(addNotification({ message: 'Item deleted.', type: NotificationType.SUCCESS, duration: 5000 }));
      dispatch(clearDeleteStatus());
      navigate('/my-items', { replace: true });
    }
  }, [deleteSuccess, deletedItemId, dispatch, navigate, id]);

  // --- Effect 6: Delete Error ---
  useEffect(() => {
    if (deleteError) {
      dispatch(addNotification({ message: `Delete failed: ${deleteError}`, type: NotificationType.ERROR }));
      dispatch(clearDeleteStatus());
    }
  }, [deleteError, dispatch]);

  // --- Effect 7: Status Updates (Returned, Received, Cancel) ---
  useEffect(() => {
    if (markReturnedSuccess || confirmReceivedSuccess || cancelClaimSuccess) {
      dispatch(addNotification({ message: 'Item status updated.', type: NotificationType.SUCCESS, duration: 5000 }));
      dispatch(clearMarkReturnedStatus());
      dispatch(clearConfirmReceivedStatus());
      dispatch(clearCancelClaimStatus());
      dispatch(fetchItemById(id));
    }
    if (markReturnedError || confirmReceivedError || cancelClaimError) {
      const msg = markReturnedError || confirmReceivedError || cancelClaimError;
      dispatch(addNotification({ message: `Update failed: ${msg}`, type: NotificationType.ERROR }));
      dispatch(clearMarkReturnedStatus());
      dispatch(clearConfirmReceivedStatus());
      dispatch(clearCancelClaimStatus());
    }
  }, [markReturnedSuccess, confirmReceivedSuccess, cancelClaimSuccess, markReturnedError, confirmReceivedError, cancelClaimError, dispatch, id]);


  // --- Action Handlers ---
  const handleClaimClick = () => {
    if (id && !isClaiming) {
      setIsModalOpen(true);
    }
  };

  // --- Handler for Modal Confirmation ---
  const handleConfirmClaim = (proofMessage) => {
    console.log(`Attempting to claim item ${id} with proof: ${proofMessage}`);
    // Dispatch thunk with OBJECT payload
    dispatch(claimItem({ itemId: id, proofMessage }));
    setIsModalOpen(false);
  };

  const handleDeleteItem = () => { if (window.confirm('Are you sure?')) dispatch(deleteItem(id)); };
  const handleMarkReturned = () => { if (id && !isMarkingReturned) dispatch(markItemReturned(id)); };
  const handleConfirmReceived = () => { if (id && !isConfirmingReceived) dispatch(confirmItemReceived(id)); };
  const handleCancelClaim = () => { if (id && !isCancellingClaim) dispatch(cancelItemClaim(id)); };

  const isAnyItemActionLoading = isClaiming || isDeleting || isMarkingReturned || isConfirmingReceived || isCancellingClaim;

  // --- Helper to Render Contact Info ---
  const renderContactInfo = (person, label) => {
    if (!person) return null;

    // Check if details are masked (null values from backend)
    const isMasked = !person.email && !person.phone;

    return (
      <div className="contact-card">
        <h4>{label}</h4>
        <p><strong>Name:</strong> {person.name}</p>
        {isMasked ? (
          <div className="privacy-notice">
            <p><em>Contact details hidden.</em></p>
            {currentItem.status === 'FOUND' && label === 'Reported By' && (
              <p className="small-text">Claim this item to see details.</p>
            )}
          </div>
        ) : (
          <>
            <p><strong>Email:</strong> <a href={`mailto:${person.email}`}>{person.email}</a></p>
            {person.phone && <p><strong>Phone:</strong> <a href={`tel:${person.phone}`}>{person.phone}</a></p>}
          </>
        )}
      </div>
    );
  };

  // --- Render ---
  if (isItemLoading || isAnyItemActionLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading...</div>;
  }

  if (!currentItem) return null;

  const canEdit = isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');
  const canDelete = isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (currentItem.status !== 'CLAIMED' && currentItem.status !== 'RETURNED');

  return (
    <div className='main-container'>
      <Sidebar />

      <div className="item-detail-container">
        <h1>{currentItem.title}</h1>

        {/* Images */}
        <div className="item-images">
          <div className="image-wrapper">
            <img
              src={currentItem.imageUrlFront || itemPlaceholderImage}
              alt="Front"
              className="item-detail-image"
              onError={(e) => { e.target.src = itemPlaceholderImage; }}
            />
            <div className="image-caption">Front View</div>
          </div>
          {currentItem.imageUrlBack && (
            <div className="image-wrapper">
              <img
                src={currentItem.imageUrlBack}
                alt="Back"
                className="item-detail-image"
                onError={(e) => { e.target.src = itemPlaceholderImage; }}
              />
              <div className="image-caption">Back View</div>
            </div>
          )}
        </div>

        <div className="item-info">
          <p><strong>Status:</strong> {currentItem.status}</p>
          <p><strong>Category:</strong> {currentItem.category}</p>
          <p><strong>Location:</strong> {currentItem.location}</p>
          <p><strong>Description:</strong> {currentItem.description}</p>
          <p><strong>Reported On:</strong> {new Date(currentItem.createdAt).toLocaleDateString()}</p>

          {/* --- CONTACT SECTION --- */}
          <div className="contact-section">
            {/* Show Reporter info (Masked or Unmasked based on backend response) */}
            {renderContactInfo(currentItem.reportedBy, "Reported By")}

            {/* Show Claimant info if available */}
            {currentItem.claimedBy && renderContactInfo(currentItem.claimedBy, "Claimed By")}
          </div>

          {/* --- ACTIONS --- */}
          <div className="item-actions">
            {isAuthenticated && currentItem.status === 'FOUND' && user?.id !== currentItem.reportedById && (
              <button className="btn-action primary" onClick={handleClaimClick} disabled={isAnyItemActionLoading}>
                {isClaiming ? 'Claiming...' : 'Claim Item'}
              </button>
            )}

            {canEdit && (
              <Link to={`/items/${currentItem.id}/edit`} className="btn-action secondary">Edit Item</Link>
            )}

            {canDelete && (
              <button className="btn-action danger" onClick={handleDeleteItem} disabled={isAnyItemActionLoading}>Delete Item</button>
            )}

            {isAuthenticated && user?.id === currentItem.reportedById && currentItem.status === 'CLAIMED' && (
              <button className="btn-action success" onClick={handleMarkReturned} disabled={isAnyItemActionLoading}>Mark as Returned</button>
            )}

            {isAuthenticated && user?.id === currentItem.claimedById && currentItem.status === 'CLAIMED' && (
              <button className="btn-action success" onClick={handleConfirmReceived} disabled={isAnyItemActionLoading}>Confirm Received</button>
            )}

            {isAuthenticated && user?.id === currentItem.claimedById && currentItem.status === 'CLAIMED' && (
              <button className="btn-action danger" onClick={handleCancelClaim} disabled={isAnyItemActionLoading}>Cancel Claim</button>
            )}
          </div>

          <ClaimModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleConfirmClaim}
            itemTitle={currentItem.title}
          />

        </div>
      </div>
    </div>
  );
};

export default ItemDetail;