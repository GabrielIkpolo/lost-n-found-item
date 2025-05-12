import React from 'react';
import "./header.css"; 
import logo from '../assets/images/logo-1-300x69.png'; 
import { NavLink } from 'react-router-dom';

const Header = () => {

  
  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <img src={logo} alt="Adeleke University Logo" />
        </div>

        {/* Title */}
        <h1 className="title">Lost and Found Items</h1>

        {/* Navigation Links */}
        <nav className="nav-links">
          <NavLink to="/login" className="nav-link">Login</NavLink>
          <span className="separator">|</span>
          <NavLink to="/" className="nav-link">Logout</NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;