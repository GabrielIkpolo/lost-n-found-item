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
    const [imageFrontName, setImageFrontName] = useState('');
    const [imageBackName, setImageBackName] = useState('');

    // Local state to prevent double submission
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Redux hooks and state
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { isCreating, creationError, itemCreationSuccess, createdItem } = useSelector(state => state.items);


    // --- Effect to handle successful item creation ---
    useEffect(() => {
        if (itemCreationSuccess) {
            dispatch(addNotification({
                message: `Item "${createdItem?.title || 'Unknown'}" reported successfully!`,
                type: NotificationType.SUCCESS,
                duration: 5000,
            }));
            dispatch(clearItemCreationStatus());
            navigate('/');
        }
    }, [itemCreationSuccess, dispatch, navigate, createdItem]);


    // --- Effect to handle item creation errors ---
    useEffect(() => {
        if (creationError) {
            dispatch(addNotification({
                message: `Failed to report item: ${creationError}`,
                type: NotificationType.ERROR,
                duration: 5000,
            }));
            // It's good to clear the error status so it doesn't re-appear on other pages
            dispatch(clearItemCreationStatus());
        }
    }, [creationError, dispatch]);


    // Handler for file input changes
    const handleImageFrontChange = (e) => {
        const file = e.target.files[0];
        setImageFront(file);
        setImageFrontName(file ? file.name : '');
    };

    const handleImageBackChange = (e) => {
        const file = e.target.files[0];
        setImageBack(file);
        setImageBackName(file ? file.name : '');
    };


    const handleSubmit = (e) => {
        e.preventDefault();

        // Prevent double submission with both local and redux state
        if (isSubmitting || isCreating) {
            return;
        }

        // Basic frontend validation
        if (!title || !description || !category || !location || !status) {
            dispatch(addNotification({ message: 'Please fill in all required fields.', type: NotificationType.WARNING, duration: 3000 }));
            return;
        }
        if (!imageFront) {
            dispatch(addNotification({ message: 'Please provide a front image for the item.', type: NotificationType.WARNING, duration: 3000 }));
            return;
        }

        // Set local submitting state immediately to lock the form
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('location', location);
        formData.append('status', status);
        formData.append('imageUrlFront', imageFront);
        if (imageBack) {
            formData.append('imageUrlBack', imageBack);
        }

        console.log('Dispatching createItem thunk with FormData.');
        dispatch(createItem(formData)).finally(() => {
            // Re-enable the form after the async thunk is settled (fulfilled or rejected)
            setIsSubmitting(false);
        });
    };


    return (
        <div className='main-container' >
            <Sidebar />
            <div className="report-item-container">
                <h2>Report a Lost or Found Item</h2>
                
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Title:</label>
                        <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isCreating || isSubmitting} />
                    </div>
                    <div className="form-group">
                        <label htmlFor="description">Description:</label>
                        <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required disabled={isCreating || isSubmitting}></textarea>
                    </div>
                    <div className="form-group">
                        <label htmlFor="category">Category:</label>
                        <select id="category" value={category} onChange={(e) => setCategory(e.target.value)} required disabled={isCreating || isSubmitting}>
                            {categories.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="location">Location:</label>
                        <select id="location" value={location} onChange={(e) => setLocation(e.target.value)} required disabled={isCreating || isSubmitting}>
                            {locations.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="status">Status:</label>
                        <select id="status" value={status} onChange={(e) => setStatus(e.target.value)} required disabled={isCreating || isSubmitting}>
                            {statuses.map((option) => (<option key={option.value} value={option.value}>{option.label}</option>))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="imageFront">Front Image:</label>
                        <input type="file" id="imageFront" accept="image/*" onChange={handleImageFrontChange} required disabled={isCreating || isSubmitting} />
                        {imageFrontName && <p className="file-name-display">{imageFrontName}</p>}
                    </div>
                    <div className="form-group">
                        <label htmlFor="imageBack">Back Image (Optional):</label>
                        <input type="file" id="imageBack" accept="image/*" onChange={handleImageBackChange} disabled={isCreating || isSubmitting} />
                        {imageBackName && <p className="file-name-display">{imageBackName}</p>}
                    </div>
                    <button type="submit" disabled={isCreating || isSubmitting}>
                        {isCreating || isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportItem;