import React from 'react';
import { FaBoxOpen } from 'react-icons/fa'; 

const EmptyState = ({ message = "No items found." }) => {
  return (
    <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '50px',
        color: '#888',
        textAlign: 'center'
    }}>
      <FaBoxOpen size={60} color="#ccc" style={{ marginBottom: '20px' }} />
      <h3 style={{ margin: '0 0 10px 0', color: '#555' }}>No Items Found</h3>
      <p style={{ margin: 0 }}>{message}</p>
    </div>
  );
};

export default EmptyState;