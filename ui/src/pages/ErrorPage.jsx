import React from 'react';
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom';
import "./errorPage.css";

const ErrorPage = () => {
    const error = useRouteError();
    let statusText = "Oops! An Unexpected Error Occurred";
    let message = "We encountered an unexpected issue. Please try navigating back or refresh the page.";
    let status = 500;

    if (isRouteErrorResponse(error)) {
        status = error.status;
        statusText = error.statusText || statusText;

        if (error.status === 404) {
            statusText = "Page Not Found";
            message = "Sorry, the page you requested doesn't exist. It might have been moved or deleted.";
        } else if (error.status === 401) {
            statusText = "Unauthorized";
            message = "You don't have permission to view this page.";
        } else if (error.status === 403) {
            statusText = "Forbidden";
            message = "Access to this resource is denied.";
        }
    }

    return (
        <div className="error-page-container">
            <h1>{status}</h1>
            <h2>{statusText}</h2>
            <p>{message}</p>
            {/* Display error detail if in development mode */}
            {/* <p>
                <i>{error.data?.message || error.message}</i>
            </p> */}
            <Link to="/">Go to Homepage</Link>
        </div>
    );
};

export default ErrorPage;
