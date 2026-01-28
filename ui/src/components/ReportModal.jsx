import React, { useState } from 'react';
import './claimModal.css'; // Reusing the same CSS for consistency

const ReportModal = ({ isOpen, onClose, onConfirm }) => {
    const [reason, setReason] = useState('Inappropriate Content');
    const [details, setDetails] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({ reason, details });
        setDetails('');
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3 style={{ color: '#dc3545' }}>Report Item</h3>
                <p>Help us keep the community safe. Why are you reporting this?</p>
                
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Reason:</label>
                        <select 
                            value={reason} 
                            onChange={(e) => setReason(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option>Inappropriate Content</option>
                            <option>Spam / Scam</option>
                            <option>Fake Item</option>
                            <option>Duplicate Post</option>
                            <option>Other</option>
                        </select>
                    </div>

                    <textarea 
                        value={details}
                        onChange={(e) => setDetails(e.target.value)}
                        placeholder="Additional details (optional)..."
                        rows={3}
                        className="modal-textarea"
                    />
                    
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-confirm" style={{ backgroundColor: '#dc3545' }}>Submit Report</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReportModal;