import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
// Import thunks and actions: fetchItemById to load data, updateItem to save changes, clearCurrentItem/clearUpdateStatus for cleanup
import { fetchItemById, updateItem, clearCurrentItem, clearUpdateStatus } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
// Import auth state to check permissions (optional, backend should enforce)
import { useSelector as useAuthSelector } from 'react-redux'; // Use alias to avoid conflict

import './editItemPage.css';
import itemPlaceholderImage from '../assets/images/logo-1.png';
import Sidebar from '../components/Sidebar';

// Define available categories, locations, and statuses for dropdowns
// Keep these synced with backend enums and ReportItem.jsx
const categories = [
    { label: 'Select Category', value: '' },
    { label: 'Electronics and Gadgets', value: 'ELECTRONICS_GADGETS' },
    { label: 'Personal Items & Accessories', value: 'PERSONAL_ACCESSORIES' },
    { label: 'Academic Supplies', value: 'ACADEMIC_SUPPLIES' },
    { label: 'Clothing', value: 'CLOTHING' },
    { label: 'Health and Wellness', value: 'HEALTH_WELLNESS' },
    { label: 'Others', value: 'OTHER' },
];

const locations = [
    { label: 'Select Location', value: '' },
    { label: 'SENATE_BUILDING', value: 'SENATE_BUILDING' },
    { label: 'PAB', value: 'PAB' }, // Performing Arts Building
    { label: 'NHS', value: 'NHS' }, // New Horizons
    { label: 'CAFETERIA', value: 'CAFETERIA' },
    { label: 'LIBRARY', value: 'LIBRARY' },
    { label: 'SPORTS_COMPLEX', value: 'SPORTS_COMPLEX' },
    { label: 'OTHER', value: 'OTHER' },
];

const statuses = [
    { label: 'Select Status', value: '' },
    { label: 'Lost', value: 'LOST' },
    { label: 'Found', value: 'FOUND' },
    { label: 'Claimed', value: 'CLAIMED' }, // Add Claimed and Returned for status updates
    { label: 'Returned', value: 'RETURNED' },
    { label: 'Archived', value: 'ARCHIVED' }, // Admin might change to/from Archived
];


const EditItemPage = () => {
    // Get the item ID from the URL params
    const { id } = useParams(); // Get ID from URL

    // State for form inputs (initialize with empty strings)
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState('');

    // State for file inputs - These will handle *new* file selections
    const [imageFront, setImageFront] = useState(null);
    const [imageBack, setImageBack] = useState(null);
    // State to display *current* and *new* file names/previews
    const [currentImageFrontUrl, setCurrentImageFrontUrl] = useState(''); // For displaying existing image
    const [currentImageBackUrl, setCurrentImageBackUrl] = useState('');   // For displaying existing image
    const [newImageFrontName, setNewImageFrontName] = useState(''); // For displaying new file name
    const [newImageBackName, setNewImageBackName] = useState('');   // For displaying new file name
    // State to track if an existing image should be removed (optional feature)
    // const [removeImageFront, setRemoveImageFront] = useState(false);
    // const [removeImageBack, setRemoveImageBack] = useState(false);


    // Redux hooks and state
    const dispatch = useDispatch();
    const navigate = useNavigate();

    // Select state for the *single* item currently being viewed (fetched by fetchItemById)
    const { currentItem, isItemLoading, itemError } = useSelector(state => state.items);
    // Select state for the *update* process
    const { isUpdating, updateError, updateSuccess, updatedItem } = useSelector(state => state.items);
    // Select auth state for permission checks (redundant if using ProtectedRoute, but good practice)
    const { isAuthenticated, user } = useAuthSelector(state => state.auth); // Use alias to avoid conflict



    // --- Effect 1: Fetch the item details when the component mounts or ID changes ---
    useEffect(() => {
        if (id) {
            console.log(`EditItemPage: Fetching item details for ID: ${id}`);
            dispatch(fetchItemById(id));
        }

        // Cleanup function: Clear states when leaving the page
        return () => {
            console.log('EditItemPage: Clearing current item state and update status.');
            dispatch(clearCurrentItem());
            dispatch(clearUpdateStatus()); // Clear update status specifically
        };

    }, [id, dispatch]); // Re-fetch if the ID or dispatch changes

    // --- Effect 2: Populate form fields when item details are loaded ---
    useEffect(() => {
        if (currentItem) {
            console.log('EditItemPage: Item data loaded, populating form.');
            // Set local state from fetched item data
            setTitle(currentItem.title || '');
            setDescription(currentItem.description || '');
            setCategory(currentItem.category || '');
            setLocation(currentItem.location || '');
            setStatus(currentItem.status || '');
            // Set current image URLs for display
            setCurrentImageFrontUrl(currentItem.imageUrlFront || '');
            setCurrentImageBackUrl(currentItem.imageUrlBack || '');
            // Reset file inputs and new file names when a new item is loaded into view
            setImageFront(null);
            setImageBack(null);
            setNewImageFrontName('');
            setNewImageBackName('');
        }
        // No dependencies on form state setters (setTitle etc.) as they should only run ONCE when currentItem changes
        // Depend on currentItem and dispatch (dispatch is stable)
    }, [currentItem, dispatch]);


    // --- Effect 3: Handle successful item update ---
    useEffect(() => {
        if (updateSuccess && updatedItem) {
            console.log('EditItemPage: Item updated successfully:', updatedItem);
            dispatch(addNotification({
                message: `Item "${updatedItem.title || 'Unknown'}" updated successfully!`,
                type: NotificationType.SUCCESS,
                duration: 5000,
            }));

            // Clear the update status flags and updated item data
            dispatch(clearUpdateStatus());

            // Re-fetch the item details using the ID from the updatedItem payload
            // THIS IS THE CRUCIAL CHANGE
            if (updatedItem.id) {
                console.log(`EditItemPage: Re-fetching updated item details for ID: ${updatedItem.id}`);
                dispatch(fetchItemById(updatedItem.id)); // <-- Use updatedItem.id here
            } else {
                console.error("EditItemPage: Updated item payload missing ID, cannot re-fetch details.");
                // Optionally show an error notification or redirect without re-fetch
                dispatch(addNotification({
                    message: 'Item updated, but could not load updated details.',
                    type: NotificationType.WARNING,
                    duration: 5000,
                }));
            }

            // Redirect to the updated item's detail page or My Items page
            // navigate(`/items/${updatedItem.id}`); // Redirect to the item detail page
            navigate(`/my-items`);
        }
    }, [updateSuccess, updatedItem, dispatch, navigate]); // Depend on success flag, updated item, etc.


    // --- Effect 4: Handle item update errors ---
    useEffect(() => {
        if (updateError) {
            console.error('EditItemPage: Item update failed:', updateError);
            dispatch(addNotification({
                message: `Update failed: ${updateError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // Clear the update error state after showing notification
            dispatch(clearUpdateStatus()); // Clear status after showing notification
        }
    }, [updateError, dispatch]); // Depend on updateError and dispatch


    // Effect 5: Handle item fetch errors (e.g., item not found or unauthorized to view)
    useEffect(() => {
        if (itemError) {
            console.error('EditItemPage: Item fetch error:', itemError);
            // Notification is already handled by the effect in ItemDetail.jsx if you were redirected from there.
            // But if navigating directly to /items/:id/edit and it fails, show notification here.
            dispatch(addNotification({
                message: `Error loading item for edit: ${itemError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // If item not found or unauthorized, redirect
            if (itemError.toLowerCase().includes('not found') || itemError.toLowerCase().includes('unauthorized') || itemError.toLowerCase().includes('forbidden')) {
                console.log('EditItemPage: Redirecting after fetch error...');
                setTimeout(() => navigate('/', { replace: true }), 3000); // Redirect after 3 seconds
            }
        }
    }, [itemError, dispatch, navigate]);


    // --- Handlers for file input changes ---
    const handleImageFrontChange = (e) => {
        const file = e.target.files[0];
        setImageFront(file);
        setNewImageFrontName(file ? file.name : ''); // Set new file name for display
        setCurrentImageFrontUrl(''); // Clear current image URL display if a new file is selected
    };

    const handleImageBackChange = (e) => {
        const file = e.target.files[0];
        setImageBack(file);
        setNewImageBackName(file ? file.name : ''); // Set new file name for display
        setCurrentImageBackUrl(''); // Clear current image URL display if a new file is selected
    };


    // --- Handler for form submission ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic frontend validation (required fields)
        if (!title || !description || !category || !location || !status) {
            dispatch(addNotification({
                message: 'Please fill in all required fields.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            return;
        }
        // Check if front image is missing *and* there's no current front image URL
        if (!imageFront && !currentImageFrontUrl) {
            dispatch(addNotification({
                message: 'Please provide a front image for the item.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            return;
        }

        // Create FormData object to send updated text data and potentially new/removed files
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('status', status);
        // Append new files if selected
        if (imageFront) {
            formData.append('imageUrlFront', imageFront); // Append the actual File object
        }
        if (imageBack) {
            formData.append('imageUrlBack', imageBack); // Append the actual File object
        }
        // TODO: Add logic for removing existing images if you implement that feature
        // if (removeImageFront) { formData.append('removeImageUrlFront', 'true'); }
        // if (removeImageBack) { formData.append('removeImageUrlBack', 'true'); }


        // Dispatch the updateItem async thunk with the item ID and FormData
        console.log(`Dispatching updateItem thunk for ID: ${id}`);
        dispatch(updateItem({ itemId: id, formData }));

        // Form state is managed locally, will remain until redirected or component unmounts/reloads

    };

    // --- Render Loading/Error States for Fetching Initial Data ---
    // Show loading or error state *while fetching* the item details
    if (isItemLoading) {
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading item details for editing...</div>;
    }

    // Show error or "not found" message if initial fetch failed
    if (itemError || (!currentItem && !isItemLoading)) {
        return <div style={{ textAlign: 'center', marginTop: '50px', color: itemError ? 'red' : 'inherit' }}>
            {itemError || 'Could not load item for editing.'}
        </div>;
    }

    // --- Ensure item data is available before rendering the form ---
    if (!currentItem) {
        // This case might be redundant if the above check catches it, but as a safeguard:
        return <div style={{ textAlign: 'center', marginTop: '50px' }}>Item data not available for editing.</div>;
    }

    // --- Check User Permissions before rendering the form ---
    // This check is client-side UX; backend middleware MUST enforce this.
    const canEdit = isAuthenticated && (user?.id === currentItem.reportedById || user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN');
    if (!canEdit) {
        // Optional: Show a notification here too
        dispatch(addNotification({
            message: 'You do not have permission to edit this item.',
            type: NotificationType.ERROR,
            duration: 5000,
        }));
        // Redirect to item detail page or home page
        console.log('EditItemPage: Permission denied, redirecting.');
        // Use navigate with replace: true to avoid stacking bad URLs in history
        navigate(`/items/${id}`, { replace: true }); // Redirect to item detail page
        return null; // Don't render anything on this page
    }


    // --- Render the Edit Item Form ---
    return (
        <div className='main-container' >

            <Sidebar />
            
        <div className="report-item-container"> {/* Reusing report-item-container class */}
            <h2>Edit Item: {currentItem.title}</h2>
            {/* Optional: Display loading/error messages on the form itself for the *update* process */}
            {isUpdating && <p style={{ textAlign: 'center' }}>Saving changes...</p>}
            {updateError && <p style={{ color: 'red', textAlign: 'center' }}>Error: {updateError}</p>}


            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Title:</label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        disabled={isUpdating || isItemLoading} // Disable inputs while updating or initial fetch
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="description">Description:</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        disabled={isUpdating || isItemLoading}
                    ></textarea>
                </div>

                <div className="form-group">
                    <label htmlFor="category">Category:</label>
                    <select
                        id="category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        disabled={isUpdating || isItemLoading}
                    >
                        {categories.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="location">Location:</label>
                    <select
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        disabled={isUpdating || isItemLoading} // Disable inputs while updating or initial fetch
                    >
                        {locations.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label htmlFor="status">Status:</label>
                    <select
                        id="status"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        required
                        disabled={isUpdating || isItemLoading}
                    >
                        {statuses.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>


                <div className="form-group">
                    <label htmlFor="imageFront">Front Image:</label>
                    {/* Display current front image or placeholder */}
                    {currentImageFrontUrl && (
                        <div className="current-image-preview">
                            <img src={currentImageFrontUrl} alt="Current Front" style={{ maxWidth: '150px', maxHeight: '150px', marginBottom: '5px', border: '1px solid #eee' }} />
                            {/* Optional: Add a remove checkbox */}
                            {/* <label><input type="checkbox" checked={removeImageFront} onChange={() => setRemoveImageFront(!removeImageFront)} /> Remove existing front image</label> */}
                        </div>
                    )}
                    <input
                        type="file"
                        id="imageFront"
                        accept="image/*" // Accept only image files
                        onChange={handleImageFrontChange}
                        // required // Not required if a current image exists - Validation in handleSubmit
                        disabled={isUpdating || isItemLoading} // Disable input while submitting/loading
                    />
                    {/* Display new file name if selected */}
                    {newImageFrontName && <p className="file-name-display">{newImageFrontName}</p>}
                </div>

                <div className="form-group">
                    <label htmlFor="imageBack">Back Image (Optional):</label>
                    {/* Display current back image or placeholder */}
                    {currentImageBackUrl && (
                        <div className="current-image-preview">
                            <img src={currentImageBackUrl} alt="Current Back" style={{ maxWidth: '150px', maxHeight: '150px', marginBottom: '5px', border: '1px solid #eee' }} />
                            {/* Optional: Add a remove checkbox */}
                            {/* <label><input type="checkbox" checked={removeImageBack} onChange={() => setRemoveImageBack(!removeImageBack)} /> Remove existing back image</label> */}
                        </div>
                    )}
                    <input
                        type="file"
                        id="imageBack"
                        accept="image/*"
                        onChange={handleImageBackChange}
                        disabled={isUpdating || isItemLoading} // Disable input while submitting/loading
                    />
                    {/* Display new file name if selected */}
                    {newImageBackName && <p className="file-name-display">{newImageBackName}</p>}
                </div>

                <button type="submit" disabled={isUpdating || isItemLoading}> {/* Disable button while updating or initial fetch */}
                    {isUpdating ? 'Saving Changes...' : 'Save Changes'} {/* Change text while submitting */}
                </button>
            </form>
        </div>
        </div>
    );
};
export default EditItemPage;