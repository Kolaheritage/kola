import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Will be managed by Auth Context later
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <Link to="/" className="logo">
          <span className="logo-icon">🏛️</span>
          <span className="logo-text">Heritage</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="nav-desktop">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/explore" className="nav-link">Explore</Link>
        </nav>

        {/* Auth Buttons */}
        <div className="header-actions">
          {isLoggedIn ? (
            <>
              <Link to="/upload" className="btn btn-primary">
                Share Idea Now
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-text">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/upload" className="btn btn-primary">
                Share Idea Now
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
              <Link to="/register" className="btn btn-text">
                Sign Up
              </Link>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <nav className="nav-mobile">
          <Link to="/" className="nav-link-mobile" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
          <Link to="/explore" className="nav-link-mobile" onClick={() => setMenuOpen(false)}>
            Explore
          </Link>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard" className="nav-link-mobile" onClick={() => setMenuOpen(false)}>
                Dashboard
              </Link>
              <button onClick={handleLogout} className="nav-link-mobile">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link-mobile" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link to="/register" className="nav-link-mobile" onClick={() => setMenuOpen(false)}>
                Sign Up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
};

export default Header;