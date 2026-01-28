import React, { useState } from 'react';
import './claimModal.css';

const ClaimModal = ({ isOpen, onClose, onConfirm, itemTitle }) => {
    const [proof, setProof] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(proof);
        setProof(''); // Reset after submit
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Claim "{itemTitle}"</h3>
                <p>To prevent spam and ensure safety, please provide a distinctive detail about this item that only the owner would know.</p>
                <p className="modal-hint">Examples: "The screensaver is my picture", "There is a scratch on the bottom left", "The bag contains a blue notebook".</p>
                
                <form onSubmit={handleSubmit}>
                    <textarea 
                        value={proof}
                        onChange={(e) => setProof(e.target.value)}
                        placeholder="Describe a unique feature..."
                        required
                        rows={4}
                        className="modal-textarea"
                    />
                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-confirm">Submit Claim</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClaimModal;