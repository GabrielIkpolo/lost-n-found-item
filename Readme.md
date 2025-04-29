# University Lost and Found Application

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Overview

This web application provides a platform for managing lost and found items within a university environment. It aims to facilitate the reporting, searching, and claiming of items to increase the chances of reuniting owners with their belongings. The application features distinct user roles, detailed item reporting (including images), search/filtering, notifications, and an admin dashboard for management.

## Core Features

*   **User Authentication:** Secure registration and login via Email/Password (local), Google, and Facebook. Includes password reset functionality and JWT-based session management with refresh token rotation.
*   **Role-Based Access Control:** Different capabilities for `USER`, `ADMIN`, and `SUPER_ADMIN` roles.
*   **Item Reporting:** Users can report lost or found items with details like title, description, category (enum), location (enum), and optional front/back images.
*   **Item Browsing:** Public view of `FOUND` items. Logged-in users can view `LOST` items and their own reported/claimed items. Features pagination, filtering (category, location), and sorting.
*   **Item Details View:** Shows full item details and images. Logged-in users see a "Claim" button on found items.
*   **Claiming Workflow:** Logged-in users can claim found items, triggering notifications to the reporter and claimant.
*   **Status Updates:** Users and admins can update item statuses (`LOST`, `FOUND`, `CLAIMED`, `RETURNED`, `ARCHIVED`).
*   **Search:** Full-text search across item details with frontend debouncing.
*   **Notifications:** Multi-channel notifications (Email, In-App, Push via FCM) for key events like claims, status updates, password resets, etc. Includes user preference settings and an in-app notification center.
*   **Image Handling:** Local storage (initially) with multipart form uploads and automatic resizing/thumbnail generation.
*   **Item Archival:** Automatic archival of unclaimed found items after a configurable period (e.g., 90 days) via a scheduled task.
*   **Admin Dashboard:** Interface for admins to manage items, users, roles, view audit logs, and configure settings.
*   **Audit Logging:** Tracks significant actions performed by users and the system.

## Technology Stack

*   **Frontend:** React.js (with Vite)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB
*   **ORM:** Prisma
*   **API Communication:** Axios
*   **Authentication:** Passport.js (Strategies: local, google-oauth20, facebook), JWT
*   **Password Hashing:** bcrypt
*   **Image Processing:** sharp (or similar)
*   **Input Validation:** express-validator 
*   **Rate Limiting:** express-rate-limit
*   **Scheduled Tasks:** node-cron (or similar)
*   **Push Notifications:** Firebase Cloud Messaging (FCM)
*   **UI Framework/Styling:** TBD (e.g., Tailwind CSS or Vanilla CSS)

## Project Structure

```
.
├── server/         # Backend (Node.js/Express/Prisma)
│   ├── prisma/     # Prisma schema and migrations
│   ├── src/        # Source code (controllers, routes, services, middleware)
│   ├── fileStorage/# Directory for storing uploaded images (add to .gitignore)
│   ├── .env        # Environment variables (sensitive, add to .gitignore)
│   ├── package.json
│   └── ...
├── ui/             # Frontend (React/Vite)
│   ├── public/     # Static assets
│   ├── src/        # React components, pages, styles, api calls
│   ├── .env        # Environment variables
│   ├── package.json
│   └── ...
├── app-requirements.md # Detailed application requirements
├── Readme.md       # This file
└── .gitignore      # Git ignore rules
```
*(Note: Specific subdirectories within `server/src` and `ui/src` will be created as development progresses)*

## Getting Started

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm 
*   MongoDB instance (local or cloud-based like MongoDB Atlas)
*   Firebase Project for FCM (Server Key)
*   Google Cloud Project for OAuth (Client ID, Client Secret)
*   Facebook Developer App for OAuth (App ID, App Secret)
*   Git

### Installation

1.  **Clone the repository:**
    ```bash
    # Replace with your actual repository URL if applicable
    git clone https://github.com/yourusername/lost-and-found-items.git
    cd lost-and-found-items
    ```

2.  **Install backend dependencies:**
    ```bash
    cd server
    npm install
    # Or: yarn install
    ```

3.  **Install frontend dependencies:**
    ```bash
    cd ../ui
    npm install
    # Or: yarn install
    ```

### Environment Variables

Create `.env` files in both the `server/` and `ui/` directories based on the examples below. **Never commit your `.env` files to version control.**

**`server/.env`:**

```dotenv
# Server Configuration
PORT=3000 # Or any port you prefer

# Database
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster-url>/lost-and-found?retryWrites=true&w=majority" # Example for MongoDB Atlas or mongodb://localhost:27017/lost-and-found

# Authentication
JWT_SECRET="YOUR_VERY_STRONG_JWT_SECRET_KEY" # Use a long, random string
JWT_ACCESS_TOKEN_EXPIRATION="1h"
JWT_REFRESH_TOKEN_EXPIRATION="7d"

# OAuth Credentials (Get from Google Cloud Console / Facebook for Developers)
GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="YOUR_GOOGLE_CLIENT_SECRET"
FACEBOOK_APP_ID="YOUR_FACEBOOK_APP_ID"
FACEBOOK_APP_SECRET="YOUR_FACEBOOK_APP_SECRET"

# Notification Service (Get from Firebase Console)
FCM_SERVER_KEY="YOUR_FCM_SERVER_KEY"

# Other (Add email service credentials if implementing email notifications)
# EMAIL_HOST=...
# EMAIL_PORT=...
# EMAIL_USER=...
# EMAIL_PASS=...
# EMAIL_FROM=...

# Base URL for frontend (used for constructing links in emails etc.)
CLIENT_URL="http://localhost:5173" # Default Vite port
```

**`ui/.env`:**

```dotenv
# API URL for the frontend to connect to the backend
VITE_API_URL="http://localhost:3000" # Match the backend PORT

# OAuth Client IDs (Needed for frontend SDKs/redirects)
VITE_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID" # Must match server's
VITE_FACEBOOK_APP_ID="YOUR_FACEBOOK_APP_ID"   # Must match server's

# Firebase Config (Get from Firebase Console -> Project Settings -> Web App)
VITE_FIREBASE_API_KEY="YOUR_FIREBASE_API_KEY"
VITE_FIREBASE_AUTH_DOMAIN="YOUR_FIREBASE_AUTH_DOMAIN"
VITE_FIREBASE_PROJECT_ID="YOUR_FIREBASE_PROJECT_ID"
VITE_FIREBASE_STORAGE_BUCKET="YOUR_FIREBASE_STORAGE_BUCKET"
VITE_FIREBASE_MESSAGING_SENDER_ID="YOUR_FIREBASE_MESSAGING_SENDER_ID"
VITE_FIREBASE_APP_ID="YOUR_FIREBASE_APP_ID"
VITE_FIREBASE_VAPID_KEY="YOUR_FIREBASE_VAPID_KEY" # For FCM Push Notifications
```

### Running the Application

1.  **Apply Prisma Schema:**
    *   Navigate to the `server/` directory.
    *   Run `npx prisma generate` to generate the Prisma Client based on your schema.
    *   *(Note: With MongoDB, `prisma migrate dev` is not used in the same way as SQL databases. Schema changes are primarily managed in `schema.prisma` and reflected via `prisma generate`)*

2.  **Start the backend server:**
    ```bash
    cd server
    npm run dev
    ```
    
3.  **Start the frontend development server:**
    ```bash
    cd ../ui
    npm run dev
    ```

4.  **Open the application:**
    Open your browser and navigate to `http://localhost:5173` (or the port specified by Vite, usually 5173).

## API Endpoints

*(This section can be filled out later or link to separate API documentation, e.g., generated via Swagger/OpenAPI)*

A RESTful API will be provided for frontend communication. Key resource endpoints will include:

*   `/auth/register`
*   `/auth/login/local`
*   `/auth/google`, `/auth/google/callback`
*   `/auth/facebook`, `/auth/facebook/callback`
*   `/auth/refresh`
*   `/auth/logout`
*   `/auth/request-password-reset`
*   `/auth/reset-password`
*   `/items` (GET, POST)
*   `/items/:id` (GET, PUT, DELETE)
*   `/items/:id/claim` (POST)
*   `/users/me` (GET, PUT)
*   `/notifications` (GET, PUT)
*   `/admin/...` (Admin-specific routes)

## Contributing

Contributions are welcome! Please follow standard Git workflow:

1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

Please ensure code is formatted (`npm run format` or `yarn format` in respective directories) and adheres to project standards. Add tests where applicable.

## License

Distributed under the MIT License. See `LICENSE` file for more information (if one exists, otherwise state MIT License).
