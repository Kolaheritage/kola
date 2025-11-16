import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer: React.FC = () => {
  const currentYear: number = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>Heritage Platform</h3>
          <p>Your Heritage Is Your Content</p>
        </div>

        <div className="footer-section">
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/explore">Explore</Link>
          <Link to="/upload">Share Content</Link>
        </div>

        <div className="footer-section">
          <h4>Resources</h4>
          <Link to="/about">About</Link>
          <Link to="/guidelines">Guidelines</Link>
          <Link to="/help">Help</Link>
        </div>

        <div className="footer-section">
          <h4>Legal</h4>
          <Link to="/privacy">Privacy Policy</Link>
          <Link to="/terms">Terms of Service</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} Heritage Platform. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
