# Lost and Found Items (Web Application) - University Requirements Document

**Version:** 1.0 (April 28, 2025)

**Objective:** To develop a web application for managing lost and found items within a university environment, facilitating the reporting, searching, and claiming of items to increase the chances of return.

**Technology Stack:**

*   **Frontend:** React.js (using Vite for bundling)
*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB
*   **ORM:** Prisma
*   **API Communication:** Axios
*   **Authentication:** Passport.js (Local, Google OAuth 2.0, Facebook), JWT (JSON Web Tokens)
*   **Push Notifications:** Firebase Cloud Messaging (FCM)
*   **Styling:** (To be decided - e.g., CSS Modules, Tailwind CSS, Material UI)

---

## 1. Core Features

### 1.1. User Authentication & Authorization
*   **Registration:** Users can register using:
    *   Email and password (local strategy). Passwords must be securely hashed using `bcrypt`.
    *   Google Account (OAuth 2.0).
    *   Facebook Account (OAuth).
*   **Login:** Registered users can log in using their chosen method.
*   **OAuth Scopes:** Request minimal necessary scopes: `email` and `profile` for Google/Facebook.
*   **Session Management:**
    *   Use JWT for stateless authentication.
    *   Issue short-lived Access Tokens (e.g., 1 hour) for API authorization.
    *   Issue longer-lived Refresh Tokens (e.g., 7 days) stored securely in HttpOnly cookies.
    *   Implement Refresh Token Rotation: Invalidate the used refresh token and issue a new one upon successful refresh.
*   **Password Reset:**
    *   Secure flow for users registered via email/password.
    *   User requests reset via email address.
    *   System generates a secure, time-limited (e.g., 1 hour) token.
    *   Token hash stored in the database (`User.passwordResetToken`, `User.passwordResetExpires`).
    *   User receives an email with a link containing the original token.
    *   User follows the link, enters a new password.
    *   System verifies the token (by hashing the received token and comparing hash/expiry), updates the password (hashed), and invalidates the reset token.
*   **User Roles:**
    *   `USER`: Regular user (report lost/found, claim, manage own items).
    *   `ADMIN`: Can manage all items (edit, delete, update status), manage users (view, potentially change roles - TBD).
    *   `SUPER_ADMIN`: Can manage Admins, potentially access/delete audit logs, perform system backups/maintenance tasks.

### 1.2. Lost Item Reporting
*   Authenticated users can report a lost item via a dedicated form.
*   **Required Fields:** Title, Description, Category (Enum), Location (Enum).
*   **Optional Fields:** Image Upload (Front and Back).
*   Contact information is implicitly linked via the logged-in user account.

### 1.3. Found Item Reporting
*   Authenticated users can report a found item via a dedicated form.
*   **Required Fields:** Title, Description, Category (Enum), Location (Enum).
*   **Optional Fields:** Image Upload (Front and Back).
*   Contact information is implicitly linked via the logged-in user account.
*   *(Consideration: Allow anonymous/guest reporting of found items with just an email for contact? TBD - Default to requiring login for now)*

### 1.4. Item Listing & Browsing
*   **Found Items Page:**
    *   Default landing page for all users (logged-in and guests).
    *   Displays a list/grid of items with `status: FOUND`.
    *   Includes item Title, Category, Location, Front Image (thumbnail), Date Reported.
    *   **Does NOT display reporter contact details publicly.**
    *   Implement pagination for large lists.
*   **Lost Items Page:**
    *   Accessible to logged-in users.
    *   Displays items with `status: LOST`.
    *   Includes item Title, Category, Location, Front Image (thumbnail), Date Reported.
    *   Implement pagination.
*   **My Items Page (Dashboard):**
    *   Logged-in users can view items they have reported (lost or found) or claimed.
*   **Filtering & Sorting:** Allow users to filter item lists by Category, Location, and potentially date range. Allow sorting by Date Reported (newest/oldest).

### 1.5. Item Details
*   Clicking an item in a list navigates to a detailed view.
*   Displays all item information: Title, Full Description, Category, Location, Date Reported, Status, Full-size Front and Back Image(s) (if provided).
*   **Conditional Display:**
    *   If viewing a `FOUND` item and logged in: Show a "Claim Item" button.
    *   If viewing own reported item: Show "Edit" or "Update Status" options.
    *   Reporter/Claimer contact details are **never** shown directly on this page unless explicitly part of a secure claiming workflow step.

### 1.6. Claiming Items
*   Logged-in users can initiate a claim on a `FOUND` item.
*   **Workflow:**
    0.  User manually checks posters detail and contacts the poster
    1. Arrangement for return happens offline or via potential future in-app messaging.
    2.  User clicks "Claim Item". Or 
    2.  System potentially asks for confirming details (e.g., "Briefly describe a unique feature"). (TBD - adds complexity, maybe skip for v1).
    3.  System updates item status to `CLAIMED`.
    4.  System sends a notification (Email, In-App, Push) to the user who *reported* the found item, including the claimant's name and email (or a link to an in-app messaging system - TBD).
    5.  System sends a confirmation notification to the claimant.
    

### 1.7. Item Status Updates
*   Users can update the status of items they reported.
    *   Lost item reporter can mark it as `RETURNED` (if found independently).
    *   Found item reporter can mark it as `RETURNED` (after successful hand-off to claimant).
*   Admins can update the status of any item.
*   System automatically updates status to `ARCHIVED` based on expiry policy.
*   **Available Statuses:** `LOST`, `FOUND`, `CLAIMED`, `RETURNED`, `ARCHIVED`.

### 1.8. Search Functionality
*   Implement a search bar (prominently displayed, e.g., in the header).
*   Allow users to search across item Title, Description, Category, Location.
*   Use **Full-Text Search** capabilities (e.g., MongoDB Atlas Search or equivalent).
*   Implement **debouncing** on the search input in the frontend to limit API calls during typing.

### 1.9. Admin Dashboard
*   Separate interface accessible only to `ADMIN` and `SUPER_ADMIN` roles.
*   **Features:**
    *   View all reported items (regardless of status).
    *   Filter/Search all items.
    *   Edit any item details.
    *   Update status of any item (including `DELETE` - TBD if delete or just archive).
    *   View all registered users.
    *   Manage user roles (Super Admin manages Admins).
    *   View Audit Logs (Super Admin potentially).
    *   System settings (e.g., item expiry duration).

### 1.10. Notification System
*   Implement multiple notification channels: Email, In-App, Web Push (FCM).
*   **User Preferences:** Allow users to enable/disable each channel in their profile settings.
*   **Notification Triggers:**
    *   `ITEM_REPORTED`: (Optional) Notify admins?
    *   `ITEM_CLAIMED`: Notify the user who reported the found item. Notify the claimant.
    *   `ITEM_UPDATED`: Notify relevant parties if status changes (e.g., to `RETURNED`).
    *   `ITEM_EXPIRING_SOON`: (Optional) Notify the finder a week before auto-archival.
    *   `PASSWORD_RESET_REQUEST`: Email notification with reset link.
    *   `ACCOUNT_WELCOME`: Email upon successful registration.
*   **Notification Content:** Include relevant item details, user information (where appropriate and privacy-preserving), and clear calls to action (e.g., links).
*   **Email Templates:** Use professional-looking HTML templates for email notifications.
*   **In-App Notification Center:** A dedicated section in the UI where users can view a history of their notifications (`Notification` model, filter by `read` status).

### 1.11. Image Handling
*   **Upload:** Use multipart form data on the backend.
*   **Storage:** Store images locally on the server filesystem within a designated directory (e.g., `/server/fileStorage/images/`) for the initial implementation. Ensure this path is gitignored.
*   **Optimization:** Implement automatic image resizing (e.g., creating thumbnails) upon upload using a library like `sharp` to save storage and bandwidth. Store the paths/URLs to the images in the `Item.imageUrlFront` and `Item.imageUrlBack` fields.

### 1.12. Item Expiry & Archival
*   **Policy:** Found items unclaimed after a defined period (e.g., 90 days) will be automatically archived.
*   **Implementation:**
    *   Add `expiresAt` field to `Item` model. Set upon reporting a `FOUND` item (`createdAt` + duration).
    *   A scheduled task (e.g., `node-cron`) runs daily on the backend.
    *   Task queries for items with `status: FOUND` and `expiresAt` in the past.
    *   Task updates status to `ARCHIVED` and logs the action in `AuditLog`.
    *   `ARCHIVED` items are hidden from public view but accessible to Admins.

---

## 2. Backend Details (Node.js, Express, Prisma, MongoDB)

*   **Server Setup:** Standard Express server structure (routes, controllers, middleware).
*   **Database Connection:** Use Prisma Client to connect to MongoDB.
*   **API Endpoints:** Design RESTful API endpoints for all CRUD operations on items, users, authentication, claims, etc.
*   **Authentication Middleware:** Protect relevant endpoints using Passport.js JWT strategy verification.
*   **Authorization Middleware:** Implement checks based on `User.role` for accessing admin routes or performing restricted actions.
*   **Input Validation:** Use `express-validator` to validate all incoming request bodies, params, and queries.
*   **Rate Limiting:** Apply rate limiting using `express-rate-limit` to key endpoints (auth, reporting, claiming) to prevent abuse. Track by IP and/or authenticated user ID.
*   **Error Handling:** Implement robust global error handling middleware.
*   **CORS:** Configure CORS appropriately.
*   **Environment Variables:** Use `.env` file for sensitive information (database URL, JWT secrets, API keys, etc.).
*   **Scheduled Tasks:** Use `node-cron` or similar for the item archival task.

---

## 3. Frontend Details (React.js)

*   **UI Framework:** (To be decided - e.g., vanilla css or custom styling with Tailwind CSS).
*   **Component Structure:** Break down the UI into reusable functional components.
*   **Routing:** Use `react-router-dom` for client-side navigation.
*   **API Requests:** Use `axios` for making requests to the backend API. Create helper functions or an API service layer.
*   **State Management:** Use React Context API or redux
*   **Forms:** Use a form library (e.g., React Hook Form) for handling form state, validation, and submission.
*   **UI/UX:**
    *   **Responsive Design:** Ensure the application is fully responsive across mobile, tablet, and desktop screen sizes.
    *   **Visual Cues:** Use clear visual indicators for item status (e.g., colored tags/badges).
    *   **Loading/Error States:** Provide clear feedback to the user during data fetching (loading spinners/skeletons) and when errors occur (user-friendly messages).
    *   **Accessibility (a11y):** Adhere to accessibility best practices (semantic HTML, ARIA attributes, keyboard navigation, color contrast).
*   **Search Debouncing:** Implement debouncing for the search input field to optimize API calls.
*   **Notifications:** Display in-app notifications and integrate with FCM for push notifications.

---

## 4. Database Schema (Prisma)

```generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

model User {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  name       String
  email      String   @unique
  phone      String? // Removed @unique based on earlier discussion, add back if needed
  password   String? // Hashed password for local auth, optional if only using OAuth
  provider   Provider // Enum: LOCAL, GOOGLE, FACEBOOK
  providerId String? // Store Google/Facebook ID, unique per provider
  role       UserRole @default(USER) // Enum: USER, ADMIN, SUPER_ADMIN
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Notification Settings
  fcmToken                  String? // FCM token for push notifications
  lastFcmUpdate             DateTime? // Last update of FCM token
  emailNotificationsEnabled Boolean   @default(true)
  inAppNotificationsEnabled Boolean   @default(true)
  pushNotificationsEnabled  Boolean   @default(true)

  // Password Reset
  passwordResetToken   String? // Token for password reset link
  passwordResetExpires DateTime? // Expiry time for the reset token

  // Relations
  items         Item[]         @relation("UserItems") // Items reported by this user
  claimedItems  Item[]         @relation("ClaimedItems") // Items claimed by this user
  notifications Notification[] // Notifications for this user
  auditLogs     AuditLog[] // Actions performed by this user

  }

enum Provider {
  LOCAL
  GOOGLE
  FACEBOOK
}

enum UserRole {
  USER // Regular user
  ADMIN // Can manage items & users
  SUPER_ADMIN // Can delete logs, backup data, manage admins
}

model Item {
  id            String       @id @default(auto()) @map("_id") @db.ObjectId
  title         String
  description   String
  category      ItemCategory // Enum for category
  location      ItemLocation // Enum for location
  imageUrlFront String?
  imageUrlBack  String?
  status        ItemStatus   @default(LOST) // Enum: LOST, FOUND, CLAIMED, RETURNED, ARCHIVED
  reportedBy    User         @relation("UserItems", fields: [reportedById], references: [id])
  reportedById  String       @db.ObjectId
  claimedBy     User?        @relation("ClaimedItems", fields: [claimedById], references: [id])
  claimedById   String?      @db.ObjectId
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  expiresAt     DateTime? // For automatic archival of FOUND items

  // Relations
  notifications Notification[] // Notifications related to this item
  auditLogs     AuditLog[] // Audit trail for this item
  // Add text index for full-text search if using MongoDB Atlas Search
  // @@fulltext([title, description, category, location]) // Example syntax, check Prisma/Mongo docs

  @@index([status]) // Index status for faster querying (e.g., finding all FOUND items)
  @@index([category])
  @@index([location])
  @@index([createdAt])
}

enum ItemStatus {
  LOST // Reported as lost
  FOUND // Reported as found
  CLAIMED // A found item has been claimed (pending return)
  RETURNED // Item confirmed returned to owner
  ARCHIVED // Unclaimed found item after expiry period
}

enum ItemCategory {
  ELECTRONICS_GADGETS
  PERSONAL_ACCESSORIES
  ACADEMIC_SUPPLIES
  CLOTHING
  HEALTH_WELLNESS
  OTHER // Always good to have a fallback
}

enum ItemLocation {
  SENATE_BUILDING
  PBA // Pharmacy Building Area? Specify full name if possible
  NHS // Nursing/Health Sciences? Specify full name
  CAFETERIA
  LIBRARY // Added common location
  SPORTS_COMPLEX // Added common location
  OTHER // Fallback
}

model Notification {
  id        String           @id @default(auto()) @map("_id") @db.ObjectId
  user      User             @relation(fields: [userId], references: [id])
  userId    String           @db.ObjectId
  item      Item?            @relation(fields: [itemId], references: [id]) // Link notification to item
  itemId    String?          @db.ObjectId
  message   String
  type      NotificationType // Enum: ITEM_REPORTED, ITEM_CLAIMED, ITEM_UPDATED, ITEM_EXPIRING_SOON, etc.
  createdAt DateTime         @default(now())
  read      Boolean          @default(false)

  @@index([userId, read, createdAt]) // Index for fetching user notifications efficiently
}

enum NotificationType {
  ITEM_REPORTED // A new item (lost or found) was reported
  ITEM_CLAIMED // A found item was claimed
  ITEM_UPDATED // Item status changed (e.g., to RETURNED)
  // Add more specific types as needed
  // PASSWORD_RESET_REQUEST
  // ACCOUNT_WELCOME
}

model AuditLog {
  id        String      @id @default(auto()) @map("_id") @db.ObjectId
  user      User?       @relation(fields: [userId], references: [id]) // User performing action (optional if system action)
  userId    String?     @db.ObjectId
  item      Item?       @relation(fields: [itemId], references: [id]) // Item affected (optional)
  itemId    String?     @db.ObjectId
  action    AuditAction // Enum: CREATE_ITEM, CLAIM_ITEM, UPDATE_ITEM_STATUS, DELETE_ITEM, ARCHIVE_ITEM, USER_LOGIN, USER_REGISTER, PASSWORD_RESET, etc.
  details   String? // Optional: Store extra context (e.g., old/new status)
  timestamp DateTime    @default(now())
  ipAddress String? // Make optional as system actions might not have one
  userAgent String? // Make optional

  @@index([userId])
  @@index([itemId])
  @@index([action])
  @@index([timestamp])
}

enum AuditAction {
  // Item Actions
  CREATE_ITEM
  UPDATE_ITEM
  CLAIM_ITEM
  UPDATE_ITEM_STATUS
  ARCHIVE_ITEM // Specific action for auto-archival
  DELETE_ITEM // Admin action

  // User Actions
  USER_REGISTER
  USER_LOGIN_LOCAL
  USER_LOGIN_OAUTH
  USER_LOGOUT
  PASSWORD_RESET_REQUEST
  PASSWORD_RESET_SUCCESS
  UPDATE_PROFILE
  UPDATE_NOTIFICATION_PREFS

  // Admin Actions
  MANAGE_USER_ROLE
  // etc.
}
```

---

## 5. Non-Functional Requirements

*   **Performance:** Application should load quickly and respond promptly to user interactions. API response times should be reasonable. Database queries should be optimized (use indexes).
*   **Security:** Implement standard web security practices (HTTPS, input validation, output encoding, secure headers, protection against common vulnerabilities like XSS, CSRF, SQL Injection - though Prisma helps with the latter). Secure handling of credentials and tokens.
*   **Scalability:** Might consider potential future growth. Using MongoDB and potentially stateless backend architecture helps.
*   **Maintainability:** Code should be well-organized, commented where necessary, and follow consistent coding standards.
*   **Reliability:** The application should be stable and available during expected usage hours. Implement proper error handling and logging.

---

## 6. Future Considerations (Post V1)

*   In-app messaging between finder and claimant.
*   More advanced search filters (e.g., date range).
*   Map integration for selecting/viewing location.
*   Integration with university Single Sign-On (SSO).
*   More detailed admin reporting/analytics.
*   Allowing anonymous reporting of found items.
*   Image recognition for category suggestions.
