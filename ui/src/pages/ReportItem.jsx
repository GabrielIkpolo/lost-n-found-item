import React, { useState, useEffect } from 'react';
// Import Redux hooks, thunk, and notification actions
import { useDispatch, useSelector } from 'react-redux';
import { createItem, clearItemCreationStatus } from '../features/items/itemsSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import { useNavigate } from 'react-router-dom';

import './reportItem.css';
import Sidebar from '../components/Sidebar';

// Define available categories and locations for dropdowns (Keep these or fetch from backend)
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
];


const ReportItem = () => {
    // State for form inputs
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [location, setLocation] = useState('');
    const [status, setStatus] = useState('');

    // State for file inputs
    const [imageFront, setImageFront] = useState(null);
    const [imageBack, setImageBack] = useState(null);
    // State to display file names
    const [imageFrontName, setImageFrontName] = useState(''); // <-- Picking up here
    const [imageBackName, setImageBackName] = useState(''); // <-- Picking up here


    // Redux hooks and state
    const dispatch = useDispatch();
    const navigate = useNavigate();
    // Select relevant state from the items slice for item creation
    const { isCreating, creationError, itemCreationSuccess, createdItem } = useSelector(state => state.items);


    // --- Effect to handle successful item creation ---
    useEffect(() => {
        if (itemCreationSuccess) {
            // Show success notification
            dispatch(addNotification({
                message: `Item "${createdItem?.title || 'Unknown'}" reported successfully!`, // Use createdItem data
                type: NotificationType.SUCCESS,
                duration: 5000,
            }));

            // Clear the creation status flags and created item data from Redux state
            dispatch(clearItemCreationStatus());

            // Optional: Redirect to the created item's detail page or a confirmation page
            // Or redirect back to the home page or My Items page
            navigate('/'); // Redirect to home for now
        }
    }, [itemCreationSuccess, dispatch, navigate, createdItem]); // Depend on success flag, dispatch, navigate, and createdItem


    // --- Effect to handle item creation errors ---
    useEffect(() => {
        if (creationError) {
            // Show error notification
            dispatch(addNotification({
                message: `Failed to report item: ${creationError}`, // Use the error message
                type: NotificationType.ERROR,
                duration: 5000,
            }));

            // Clear the creation error state from Redux state
            // We don't need clearItemCreationStatus here if the error effect
            // is the only place we show the error notification based on this state.
            // If you wanted the error message to persist on the page, you might not clear it immediately.
            // dispatch(clearItemCreationStatus()); 
        }
    }, [creationError, dispatch]); // Depend on creationError and dispatch


    // Handler for file input changes
    const handleImageFrontChange = (e) => {
        const file = e.target.files[0];
        setImageFront(file);
        setImageFrontName(file ? file.name : ''); // Set file name for display
    };

    const handleImageBackChange = (e) => {
        const file = e.target.files[0];
        setImageBack(file);
        setImageBackName(file ? file.name : ''); // Set file name for display
    };


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
        // Basic validation for the required front image
        if (!imageFront) {
            dispatch(addNotification({
                message: 'Please provide a front image for the item.',
                type: NotificationType.WARNING,
                duration: 3000
            }));
            // You might want to clear any previous creationError here if present
            dispatch(clearItemCreationStatus());
            return;
        }

        // Create FormData object to send both text data and files
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('status', status);
        // Append actual File objects
        formData.append('imageUrlFront', imageFront);
        if (imageBack) {
            formData.append('imageUrlBack', imageBack);
        }

        // Dispatch the createItem async thunk with the FormData
        console.log('Dispatching createItem thunk with FormData.');
        dispatch(createItem(formData));

        // Form will be cleared and redirected on success via useEffect

        // Optional: Clear the form fields immediately after dispatch if you want
        // setTitle('');
        // setDescription('');
        // setCategory('');
        // setLocation('');
        // setStatus('');
        // setImageFront(null);
        // setImageBack(null);
        // setImageFrontName('');
        // setImageBackName('');

    };


    return (
        <div className='main-container' >
            <Sidebar />

            <div className="report-item-container">
                <h2>Report a Lost or Found Item</h2>
                {/* Optional: Display loading/error messages on the form itself */}
                {isCreating && <p style={{ textAlign: 'center' }}>Submitting...</p>}
                {creationError && <p style={{ color: 'red', textAlign: 'center' }}>Error: {creationError}</p>}


                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            disabled={isCreating} // Disable inputs while submitting
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            disabled={isCreating} // Disable inputs while submitting
                        ></textarea>
                    </div>

                    <div className="form-group">
                        <label htmlFor="category">Category:</label>
                        <select
                            id="category"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            required
                            disabled={isCreating} // Disable inputs while submitting
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
                            disabled={isCreating} // Disable inputs while submitting
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
                            disabled={isCreating} // Disable inputs while submitting
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
                        <input
                            type="file"
                            id="imageFront"
                            accept="image/*" // Accept only image files
                            onChange={handleImageFrontChange}
                            required // Front image is required
                            disabled={isCreating} // Disable input while submitting
                        />
                        {/* Display selected file name */}
                        {imageFrontName && <p className="file-name-display">{imageFrontName}</p>}
                    </div>

                    <div className="form-group">
                        <label htmlFor="imageBack">Back Image (Optional):</label>
                        <input
                            type="file"
                            id="imageBack"
                            accept="image/*"
                            onChange={handleImageBackChange}
                            disabled={isCreating} // Disable input while submitting
                        />
                        {/* Display selected file name */}
                        {imageBackName && <p className="file-name-display">{imageBackName}</p>}
                    </div>

                    <button type="submit" disabled={isCreating}>
                        {isCreating ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>

        </div>
    );
};

export default ReportItem;