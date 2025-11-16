import React from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Forgot Password</h1>
          <p className="auth-subtitle">Password reset functionality coming soon</p>

          <div className="info-message">
            <p>This feature is currently under development.</p>
            <p>Please contact support if you need to reset your password.</p>
          </div>

          <Link to="/login" className="btn btn-primary btn-full">
            Back to Login
          </Link>

          <p className="auth-footer">
            Remember your password? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
