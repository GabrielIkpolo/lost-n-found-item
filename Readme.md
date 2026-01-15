# LAFI - University Lost and Found Application

LAFI is a comprehensive web application designed to facilitate the reporting, searching, and claiming of lost and found items within a university campus environment. It features a robust backend, a responsive frontend, role-based access control, and an integrated support system.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Installation & Running](#-installation--running)
- [API Endpoints](#-api-endpoints)
- [License](#-license)

---

## 🚀 Features

### 👤 User Features
*   **Authentication:** Secure registration and login via Email/Password (Local) and OAuth (Google, Facebook).
*   **Profile Management:** Users can update personal details (Phone, Department/Unit, Address).
*   **Report Items:** Report 'Lost' or 'Found' items with images (Front/Back view), category, and location.
*   **Search & Filter:** Advanced search with debouncing, filtering by category, location, and status.
*   **Claim Workflow:** Claim 'Found' items. The system notifies the reporter via Email/In-App notification.
*   **My Items Dashboard:** View and manage reported items, confirm returns, and cancel claims.
*   **Support System:** Create and reply to support tickets for inquiries or disputes.
*   **Notifications:** Real-time In-App notifications and Email alerts (Nodemailer).

### 🛡️ Admin & Super Admin Features
*   **Dashboard:** Centralized view to manage the system.
*   **User Management:** View all users, update user roles (Admin only), and delete users.
*   **Item Management:** View all items (regardless of status), edit item details, and delete items.
*   **Ticket Management:** View all support tickets, reply to users, and close tickets.
*   **System Settings (Super Admin):** Configure global settings like item expiry duration and pagination limits.
*   **Audit Logging:** Tracks critical actions (Role updates, Item deletions, System setting changes).
*   **Automated Archival:** Scheduled tasks (Cron) to automatically archive unclaimed items after a set period.

---

## 🛠 Technology Stack

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** MongoDB
*   **ORM:** Prisma
*   **Authentication:** Passport.js (JWT Strategy)
*   **File Uploads:** Multer (Local Storage logic included, Cloudinary ready)
*   **Email:** Nodemailer (SMTP/Gmail)
*   **Scheduling:** Node-cron

### Frontend
*   **Framework:** React.js (Vite)
*   **State Management:** Redux Toolkit
*   **Routing:** React Router DOM
*   **HTTP Client:** Axios (with Interceptors)
*   **Styling:** Vanilla CSS / CSS Modules
*   **Icons:** FontAwesome / React Icons

---

## 📂 Project Structure

```bash
.
├── server/                 # Backend (Node/Express)
│   ├── prisma/             # Database Schema (schema.prisma)
│   ├── src/
│   │   ├── controllers/    # Route logic (Auth, Item, User, Support, Admin)
│   │   ├── routes/         # API Route definitions
│   │   ├── services/       # Email, Notification, File services
│   │   ├── tasks/          # Cron jobs (Archival task)
│   │   └── helpers/        # Middleware (Auth, RateLimit), Utilities
│   └── fileStorage/        # Local image storage
├── ui/                     # Frontend (React)
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── features/       # Redux Slices (Auth, Items, Users, Support)
│   │   ├── pages/          # Application Pages
│   │   └── util/           # Axios configuration
│   └── public/             # Static assets
└── ...
```

## 🔐 Environment Variables

You must create a .env file in both the server/ and ui/ directories.

Backend (server/.env)

## Server Config
PORT=3000
NODE_ENV=development

## Database
DATABASE_URL="mongodb+srv://<user>:<password>@<cluster>.mongodb.net/lafi?retryWrites=true&w=majority"

## Security
JWT_SECRET="YOUR_SUPER_SECRET_KEY"
JWT_ACCESS_TOKEN_EXPIRATION="15m"
JWT_REFRESH_TOKEN_EXPIRATION="7d"
SESSION_SECRET="YOUR_SESSION_SECRET"

## OAuth (Google/Facebook)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
FACEBOOK_APP_ID="your_facebook_app_id"
FACEBOOK_APP_SECRET="your_facebook_app_secret"

## Email Service (Nodemailer)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=465
EMAIL_USER="your_email@gmail.com"
EMAIL_PASS="your_app_password" # Use App Password for Gmail
EMAIL_FROM_NAME="LAFI Support"
EMAIL_FROM_ADDRESS="no-reply@lafi.edu.ng"

## Storage
STORAGE_TYPE="local" # or 'cloudinary'

## Client URL (For CORS and Redirects)
VITE_REACT_APP_API_CLIENT_URL="http://localhost:5173"



# Frontend (ui/.env)

## API Base URL
VITE_REACT_APP_API_BASE_URL="http://localhost:3000"



### Installation & Running

## 1. Clone the Repository



```
git clone https://github.com/your-username/LAFI.git
cd LAFI
```

## 2. Backend Setup
```
cd server
npm install
```
# Generate Prisma Client (Required after every schema change)
```npx prisma generate```

# Start Server
```
npm run dev
```
Server will run on http://localhost:3000

## 3. Frontend Setup

Open a new terminal.
```
cd ui
npm install
```

# Start React App
```npm run dev```


App will run on http://localhost:5173


### 📡 API Endpoints Overview

| Area | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | POST | `/api/auth/register` | Register new user | Public |
| | POST | `/api/auth/login` | Login user | Public |
| **User** | PUT | `/api/users/profile` | Update profile details | User |
| | PUT | `/api/users/preferences` | Update notifications | User |
| **Items** | GET | `/api/items` | Fetch items (filters enabled) | Public |
| | POST | `/api/items` | Report Item (Multipart/Form) | User |
| | POST | `/api/items/claim/:id` | Claim a found item | User |
| | PUT | `/api/items/:id` | Update item details | Owner/Admin |
| **Support**| POST | `/api/support` | Create ticket | User |
| | PUT | `/api/support/:id/status`| Close/Open ticket | Admin |
| **Admin** | GET | `/api/users` | List all users | Admin |
| | PUT | `/api/users/:id/role` | Change user role | Super Admin |
| | GET | `/api/admin/settings` | Get System Settings | Super Admin |
| | PUT | `/api/admin/settings` | Update Settings | Super Admin |

## 📄 License

Distributed under the MIT License.