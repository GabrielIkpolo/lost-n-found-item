import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import './systemSettings.css';

const SystemSettings = () => {
    // Get the logged-in user from auth state
    const { user, isAuthenticated } = useSelector((state) => state.auth);

    // Initial state for settings, using required defaults from app-requirements.md
    const [settings, setSettings] = useState({
        foundItemExpiryDays: 90, // Default based on requirement
        preArchivalNotificationDays: 7, // Default suggestion
        defaultItemsPerPage: 10, // Default suggestion
    });

    // Check authorization: Must be logged in AND a SUPER_ADMIN
    if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
        // Use RootErrorBoundary for a proper 403 or redirect to home.
        // For now, redirecting to home is a simple approach.
        return <Navigate to="/" replace />;
    }

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // TODO: Implement API call (e.g., PUT /api/admin/settings) to save settings to the backend
        console.log('Attempting to save settings:', settings);

        // Mock success message for now
        alert('System Settings updated successfully!');
    };

    return (
        <div className="system-settings-container">
            <h2>System Settings</h2>
            <p className="subtitle">Configure global application parameters, such as archival policies and UI defaults. Only accessible by Super Administrators.</p>

            <form onSubmit={handleSubmit} className="settings-form">
                {/* 1. Item Archival Settings */}
                <section className="settings-section">
                    <h3>Item Archival Policy</h3>
                    <div className="form-group">
                        <label htmlFor="foundItemExpiryDays">Found Item Expiry (Days)</label>
                        <input
                            type="number"
                            id="foundItemExpiryDays"
                            name="foundItemExpiryDays"
                            value={settings.foundItemExpiryDays}
                            onChange={handleChange}
                            min="1"
                            required
                        />
                        <small>Unclaimed FOUND items will be automatically marked as ARCHIVED after this many days.</small>
                    </div>

                    <div className="form-group">
                        <label htmlFor="preArchivalNotificationDays">Pre-Archival Notification (Days)</label>
                        <input
                            type="number"
                            id="preArchivalNotificationDays"
                            name="preArchivalNotificationDays"
                            value={settings.preArchivalNotificationDays}
                            onChange={handleChange}
                            min="0"
                            required
                        />
                        <small>A notification will be sent to the item reporter this many days before the auto-archival date.</small>
                    </div>
                </section>

                {/* 2. Global UI/Performance Settings */}
                <section className="settings-section">
                    <h3>UI & Performance</h3>
                    <div className="form-group">
                        <label htmlFor="defaultItemsPerPage">Default Items Per Page</label>
                        <input
                            type="number"
                            id="defaultItemsPerPage"
                            name="defaultItemsPerPage"
                            value={settings.defaultItemsPerPage}
                            onChange={handleChange}
                            min="1"
                            max="50"
                            required
                        />
                        <small>The default number of items displayed in paginated lists across the application (e.g., Found Items Page, Admin View).</small>
                    </div>
                </section>

                <div className="form-actions">
                    <button type="submit" className="save-button">Save Settings</button>
                </div>
            </form>
        </div>
    );
};

export default SystemSettings;
