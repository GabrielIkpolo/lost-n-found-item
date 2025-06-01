import React, { useState } from 'react';
import "./header.css"; 
import logo from '../assets/images/logo-1-300x69.png'; 
import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="logo">
          <img src={logo} alt="Adeleke University Logo" />
        </div>

        {/* Title - stays centered in desktop view */}
        <h1 className="title">Lost and Found Items</h1>

        {/* Mobile Menu Button */}
        <button 
          className="mobile-menu-button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation Links - stays right-aligned */}
        <nav className={`nav-links ${isMenuOpen ? 'mobile-menu-open' : ''}`}>
          <NavLink to="/login" className="nav-link">Login</NavLink>
          <span className="separator">|</span>
          <NavLink to="/" className="nav-link">Logout</NavLink>
        </nav>
      </div>
    </header>
  );
};

export default Header;