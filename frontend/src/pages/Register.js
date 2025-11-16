import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: ''
  });

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, label: '', color: '' };

    // Length check
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Contains lowercase
    if (/[a-z]/.test(password)) score++;

    // Contains uppercase
    if (/[A-Z]/.test(password)) score++;

    // Contains numbers
    if (/\d/.test(password)) score++;

    // Contains special characters
    if (/[^A-Za-z0-9]/.test(password)) score++;

    // Determine strength label and color
    if (score <= 2) {
      return { score, label: 'Weak', color: '#ef4444' };
    } else if (score <= 4) {
      return { score, label: 'Medium', color: '#f59e0b' };
    } else {
      return { score, label: 'Strong', color: '#10b981' };
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Update password strength in real-time
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  // Enhanced validation
  const validateForm = () => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Username validation (3-20 chars, alphanumeric and underscore)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(formData.username)) {
      setError('Username must be 3-20 characters and contain only letters, numbers, and underscores');
      return false;
    }

    // Password validation
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    // Password strength check
    if (passwordStrength.score < 3) {
      setError('Password is too weak. Use a mix of uppercase, lowercase, numbers, and special characters');
      return false;
    }

    // Password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Use AuthContext register function
      const result = await register({
        email: formData.email,
        username: formData.username,
        password: formData.password
      });

      if (result.success) {
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h1>Join Heritage</h1>
          <p className="auth-subtitle">Create an account to start sharing</p>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="your@email.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                minLength="3"
                placeholder="username"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="8"
                placeholder="At least 8 characters"
              />
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div
                      className="password-strength-fill"
                      style={{
                        width: `${(passwordStrength.score / 6) * 100}%`,
                        backgroundColor: passwordStrength.color
                      }}
                    />
                  </div>
                  <span
                    className="password-strength-label"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
              )}
              <small className="form-hint">
                Use 8+ characters with a mix of uppercase, lowercase, numbers & symbols
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                placeholder="Confirm password"
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;