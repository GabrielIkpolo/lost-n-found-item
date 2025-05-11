import React from 'react';
import "./header.css"; 
import logo from '../assets/images/logo-1-300x69.png'; 

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
          <a href="#" className="nav-link">Login</a>
          <span className="separator">|</span>
          <a href="#" className="nav-link">Logout</a>
        </nav>
      </div>
    </header>
  );
};

export default Header;