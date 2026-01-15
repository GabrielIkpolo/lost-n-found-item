import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserProfile } from '../features/auth/authSlice';
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice';
import Sidebar from '../components/Sidebar';
import './profileSettings.css'; // We'll create this css next

const ProfileSettings = () => {
    const dispatch = useDispatch();
    const { user, isLoading } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        name: '',
        email: '', // Read only
        phone: '',
        department: '',
        address: ''
    });

    // Load current user data into form
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                department: user.department || '',
                address: user.address || ''
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Dispatch the update action
        const result = await dispatch(updateUserProfile({
            name: formData.name,
            phone: formData.phone,
            department: formData.department,
            address: formData.address
        }));

        if (updateUserProfile.fulfilled.match(result)) {
            dispatch(addNotification({
                message: 'Profile updated successfully!',
                type: NotificationType.SUCCESS
            }));
        } else {
            dispatch(addNotification({
                message: result.payload || 'Failed to update profile',
                type: NotificationType.ERROR
            }));
        }
    };

    return (
        <div className="main-container">
            <Sidebar />
            <div className="settings-container">
                <h2>Profile Settings</h2>
                <form onSubmit={handleSubmit} className="settings-form">
                    
                    <div className="form-group">
                        <label>Full Name</label>
                        <input 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                        />
                    </div>

                    <div className="form-group">
                        <label>Email (Cannot be changed)</label>
                        <input 
                            type="email" 
                            value={formData.email} 
                            disabled 
                            className="disabled-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        <input 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            placeholder="e.g., 08012345678"
                        />
                    </div>

                    <div className="form-group">
                        <label>Department / Faculty / Unit</label>
                        <input 
                            type="text" 
                            name="department" 
                            value={formData.department} 
                            onChange={handleChange} 
                            placeholder="e.g., Computer Science"
                        />
                    </div>

                    <div className="form-group">
                        <label>Address / Hostel / Office</label>
                        <textarea 
                            name="address" 
                            value={formData.address} 
                            onChange={handleChange} 
                            placeholder="e.g., Hall of Residence A, Room 202"
                            rows="3"
                        />
                    </div>

                    <button type="submit" disabled={isLoading} className="save-btn">
                        {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfileSettings;