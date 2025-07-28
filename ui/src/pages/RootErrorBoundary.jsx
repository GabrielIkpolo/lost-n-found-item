import React from 'react';
import { useRouteError, Link } from "react-router-dom";

 const RootErrorBoundary = ()=> {
  
  // This hook gives you the actual router error
  const error = useRouteError(); 
  console.error("React Router Error Boundary caught an error:", error);

  return (
    <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1>Oops! An Unexpected Error Occurred.</h1>
      <p>We're sorry for the inconvenience. Please try again later.</p>
      <p>
        <Link to="/" style={{ color: '#007bff' }}>Go back to the Home Page</Link>
      </p>
      <div style={{ marginTop: '20px', background: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '5px', padding: '15px', textAlign: 'left', color: '#dc3545' }}>
        <h4 style={{ marginTop: 0 }}>Error Details:</h4>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {error.statusText || error.message}
        </pre>
        {error.data && <pre>{error.data}</pre>}
      </div>
    </div>
  );
}

export default RootErrorBoundary;