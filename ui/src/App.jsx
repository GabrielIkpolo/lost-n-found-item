import { useState, useEffect } from 'react'
import { createBrowserRouter, createHashRouter, RouterProvider, Link, Outlet, Navigate } from "react-router-dom";
import './App.css'
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ErrorPage from './pages/ErrorPage';
import Login from './components/Login';
import NotificationContainer from './components/NotificationContainer';
import Register from './components/Register';
import ItemDetail from './pages/ItemDetail';

// Import Redux hooks and the loadAuthState action
import { useDispatch, useSelector } from 'react-redux';
import { loadAuthState } from './features/auth/authSlice';
import ProtectedRoutes from './components/ProtectedRoutes';
import ReportItem from './pages/ReportItem';
import MyItemsPage from './pages/MyItemsPage';
import EditItemPage from './pages/EditItemPage';


import SupportPage from './pages/SupportPage';
import CreateTicketPage from './pages/CreateTicketPage';
import TicketDetailPage from './pages/TicketDetailPage';


import AdminDashboard from './pages/AdminDashboard';
import ManageUsersPage from './pages/ManageUsersPage';
import ManageItemsPage from './pages/ManageItemsPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SystemSettings from './pages/SystemSettings';
import ManageTicketsPage from './pages/ManageTicketsPage'; // NEW IMPORT

// import AuthCallback from './pages/AuthCallback';
import LostItemPage from './pages/LostItemPage';
import { setAuthState } from './features/auth/authSlice';
import RootErrorBoundary from './pages/RootErrorBoundary';

import ProfileSettings from './pages/ProfileSettings';
import SystemLogsPage from './pages/SystemLogsPage';

import { requestFcmToken, onMessageListener } from './util/firebase'; // Import Firebase helpers
import { saveFcmToken } from './features/userSlice'; // Import the new thunk
import { addNotification, NotificationType } from './features/notifications/notificationsSlice';
import HelpPage from './pages/HelpPage';
import ManageReportsPage from './pages/ManageReportsPage';



// Import ItemStatus enum from backend or define relevant roles here
// import { UserRole } from '../../server/prisma/client'; 
// If not importing directly, define locally:
const UserRole = {
  USER: 'USER',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};



const Wrapper = ({ children }) => {
  return (
    <div className="wrapper">
      {children}
    </div>
  );
};

const HeadAndFooter = () => {
  return (
    <>
      <Header />
      <Wrapper >
        <Outlet />
      </Wrapper>
      <Footer />
      <NotificationContainer />
    </>
  );
}


// The guide 
const routerConfig = [
  {
    path: '/', element: <HeadAndFooter />,
    errorElement: <RootErrorBoundary />,
    children: [
      { path: '/', element: <Home /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'items/:id', element: <ItemDetail /> },

      {
        path: 'report', element: (
          <ProtectedRoutes >
            <ReportItem />
          </ProtectedRoutes>
        )
      },

      { path: 'lost-items', element: <LostItemPage /> },

      { path: 'forgot-password', element: <ForgotPasswordPage /> },

      { path: 'reset-password/:token', element: <ResetPasswordPage /> },

      // { path: '/index.html', element: <AuthCallback /> },

      // { path: '/auth/callback', element: <AuthCallback /> },

      { path: 'verify-email', element: <Navigate to="/login" replace /> },


      {
        path: '/my-items', element: (
          <ProtectedRoutes>
            <MyItemsPage />
          </ProtectedRoutes>
        )
      },

      {
        path: 'items/:id/edit', element: (
          <ProtectedRoutes>
            <EditItemPage />
          </ProtectedRoutes>
        )
      },


      {
        path: 'support',
        element: (
          <ProtectedRoutes>
            <SupportPage />
          </ProtectedRoutes>
        ),
      },
      {
        path: 'support/new',
        element: (
          <ProtectedRoutes>
            <CreateTicketPage />
          </ProtectedRoutes>
        ),
      },
      {
        path: 'support/:id',
        element: (
          <ProtectedRoutes>
            <TicketDetailPage />
          </ProtectedRoutes>
        ),
      },


      {
        path: 'admin', element: (
          <ProtectedRoutes requiredRoles={[UserRole.ADMIN, UserRole.SUPER_ADMIN]} >
            <AdminDashboard />
          </ProtectedRoutes>
        ),
        children: [
          {
            path: 'users', element: <ManageUsersPage />
          },

          {
            path: 'items',
            element: <ManageItemsPage />
          },

          // NEW: Admin route for managing support tickets
          {
            path: 'tickets',
            element: <ManageTicketsPage />, // The main list view for admins
          },

          // NEW: Admin route for viewing a specific ticket (reusing the component)
          // The component handles the necessary Admin/User role checks internally
          {
            path: 'tickets/:id',
            element: <TicketDetailPage />,
          },


          {
            path: 'settings',
            element: <ProtectedRoutes requiredRoles={[UserRole.SUPER_ADMIN]}>
              <SystemSettings />
            </ProtectedRoutes>
          },

          {
            path: 'logs',
            element: (
              <ProtectedRoutes requiredRoles={[UserRole.SUPER_ADMIN]}>
                <SystemLogsPage />
              </ProtectedRoutes>
            )
          },
          
          {
            path: 'reports',
            element: <ManageReportsPage />
          },
        ],
      },

      {
        path: 'profile',
        element: (
          <ProtectedRoutes>
            <ProfileSettings />
          </ProtectedRoutes>
        )
      },

      {
        path: 'help',
        element: <HelpPage />
      },




      { path: '*', element: <ErrorPage /> }
    ]
  }
];


function App() {
  const dispatch = useDispatch();
  const { isAuthLoading, isAuthenticated } = useSelector((state) => state.auth);

  const router = createBrowserRouter(routerConfig);

  // Effect to load auth state from localStorage on initial render
  useEffect(() => {
    dispatch(loadAuthState());
  }, [dispatch]);


  useEffect(() => {
    // Check if there is a hash in the URL
    if (window.location.hash.includes('token')) {
      // Use URLSearchParams to easily parse the parameters from the hash
      const params = new URLSearchParams(window.location.hash.substring(1)); // remove the '#'
      const token = params.get('token');
      const userDataString = params.get('user');

      if (token && userDataString) {
        try {
          const user = JSON.parse(decodeURIComponent(userDataString));

          // Dispatch the action to set the auth state in Redux
          dispatch(setAuthState({ user, token }));

          // Store in localStorage for persistence
          localStorage.setItem('accessToken', token);
          localStorage.setItem('user', JSON.stringify(user));

          // Clean the URL by removing the hash, so it doesn't get processed again on refresh
          window.history.replaceState({}, document.title, window.location.pathname);

        } catch (error) {
          console.error('Failed to parse user data from URL hash:', error);
          // Clean the URL even if parsing fails
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    }
  }, [dispatch])

  // --- Handle Push Notifications ---
  useEffect(() => {
    // Only run if user is logged in
    if (isAuthenticated) {

      // 1. Request Permission and Get Token
      const initializeFirebase = async () => {
        const token = await requestFcmToken();
        if (token) {
          // Send token to backend to save in User model
          dispatch(saveFcmToken(token));
        }
      };

      initializeFirebase();

      // 2. Listen for FOREGROUND messages (when app is open)
      // Firebase doesn't show system popup when app is open, so we use our In-App Notification system
      onMessageListener()
        .then((payload) => {
          console.log('Foreground Notification:', payload);
          dispatch(addNotification({
            message: `${payload.notification.title}: ${payload.notification.body}`,
            type: NotificationType.INFO,
            duration: 6000
          }));
        })
        .catch((err) => console.log('failed: ', err));
    }
  }, [isAuthenticated, dispatch]);


  if (isAuthLoading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading application...</div>;
  }





  return (
    <>
      <RouterProvider router={router} />
    </>
  )
}

export default App