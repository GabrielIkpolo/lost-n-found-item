import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { axiosInstance as axios } from '../util/axiosInstance'; // Use your axios instance
import './systemSettings.css';

const SystemSettings = () => {
    const { user, isAuthenticated } = useSelector((state) => state.auth);
    const [isLoading, setIsLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [settings, setSettings] = useState({
        foundItemExpiryDays: 90,
        preArchivalNotificationDays: 7,
        defaultItemsPerPage: 10,
    });

    // 1. Fetch Settings on Mount
    useEffect(() => {
        if (isAuthenticated && user?.role === 'SUPER_ADMIN') {
            fetchSettings();
        }
    }, [isAuthenticated, user]);

    const fetchSettings = async () => {
        try {
            const res = await axios.get('/api/admin/settings');
            setSettings({
                foundItemExpiryDays: res.data.foundItemExpiryDays,
                preArchivalNotificationDays: res.data.preArchivalNotificationDays,
                defaultItemsPerPage: res.data.defaultItemsPerPage,
            });
            setIsLoading(false);
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to load settings.' });
            setIsLoading(false);
        }
    };

    if (!isAuthenticated || user?.role !== 'SUPER_ADMIN') {
        return <Navigate to="/" replace />;
    }

    const handleChange = (e) => {
        const { name, value, type } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value, 10) || 0 : value,
        }));
    };

    // 2. Submit Updates
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        
        try {
            await axios.put('/api/admin/settings', settings);
            setMessage({ type: 'success', text: 'System Settings updated successfully!' });
        } catch (err) {
            console.error(err);
            setMessage({ type: 'error', text: 'Failed to update settings.' });
        }
    };

    if (isLoading) return <div style={{padding:'20px'}}>Loading settings...</div>;

    return (
        <div className="system-settings-container">
            <h2>System Settings</h2>
            <p className="subtitle">Configure global application parameters. Only accessible by Super Administrators.</p>

            {message.text && (
                <div style={{ 
                    padding: '10px', 
                    marginBottom: '15px', 
                    borderRadius: '4px',
                    backgroundColor: message.type === 'error' ? '#f8d7da' : '#d4edda',
                    color: message.type === 'error' ? '#721c24' : '#155724'
                }}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="settings-form">
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
                        <small>Notification sent to reporter before auto-archival.</small>
                    </div>
                </section>

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
                        <small>Default number of items in paginated lists.</small>
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