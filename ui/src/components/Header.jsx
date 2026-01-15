import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
// Import Redux hooks
import { useDispatch, useSelector } from 'react-redux';
//Import the logout action creator
import { logout } from '../features/auth/authSlice.js';
// Import notification actions (optional, for logout notification)
import { addNotification, NotificationType } from '../features/notifications/notificationsSlice.js';
import "./header.css";
import logo from '../assets/images/logo-1-300x69.png';
import { FaBars, FaTimes } from 'react-icons/fa';


const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Select isAuthenticated state and user info from the auth slice
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  //Function to toggle mobile menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  //Function to handle logout
  const handleLogout = () => {
    dispatch(logout()); // Dispatch the logout action

    // Optionally show a logout success notification
    dispatch(addNotification({
      message: 'Logged out successfully',
      type: NotificationType.INFO
    }));

    // Redirect to thelogin page after logout
    navigate('/login');
    setIsMenuOpen(false);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo - Link to home page */}
        <div className="logo">
          <NavLink to='/'>
            <img src={logo} alt="Adeleke University Logo" />
          </NavLink>
        </div>

        {/* Title - stays centered in desktop view */}
        <h1 className="title" onClick={() => navigate('/')}>Lost and Found Items</h1>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-button"
          onClick={toggleMenu}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation Links - stays right-aligned */}
        <nav className={`nav-links ${isMenuOpen ? 'mobile-menu-open' : ''}`}>

          {/* Conditionally render links based on isAuthenticated */}

          {
            !isAuthenticated ? (
              <>
                {/* Links for non-authenticated users */}
                <NavLink to="/login" className="nav-link" onClick={toggleMenu}>Login</NavLink>
                <span className="separator">|</span>
                <NavLink to="/register" className="nav-link" onClick={toggleMenu}>Register</NavLink>
              </>
            ) : (
              <>
                {/* Links for authenticated users */}
                {/* Example: Link to My Items page */}
                <NavLink to="/my-items" className="nav-link" onClick={toggleMenu}>My Items</NavLink>
                <span className="separator">|</span>

                {/* Display user's name (optional) */}
                {/* {user && <span className="nav-link">Welcome, {user.name}</span>} */}
                {user && (
                  <NavLink to="/profile" className="nav-link" onClick={toggleMenu}>
                    Welcome, {user.name}
                  </NavLink>
                )}
                <span className="separator">|</span>

                {/* Logout button/link */}
                <button onClick={handleLogout} className="nav-link logout-button">Logout</button>
              </>
            )
          }
        </nav>
      </div>
    </header>
  );
};

export default Header;