import React, { useState, useContext } from 'react';
import { AuthContext } from '../App';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const AdminLoginPage = () => {
  const { login } = useContext(AuthContext);
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    admin_code: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (field, value) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password || !credentials.admin_code) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/auth/admin-login', credentials);
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // Use the login context to set user state
      const loginResult = await login(credentials.email, credentials.password);
      if (loginResult.success) {
        // Admin login successful, user will be redirected by App.js routing
        window.location.reload();
      }
    } catch (error) {
      setError(error.response?.data?.detail || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Authenticating admin access..." />;
  }

  return (
    <div className="container">
      <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🔐 Admin Access</h2>
            <p className="card-subtitle">Secure login for administrators and government officials</p>
          </div>
          
          {error && <div className="alert alert-danger">{error}</div>}
          
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Admin Email</label>
              <input
                type="email"
                className="form-control"
                value={credentials.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter admin email"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Admin Access Code</label>
              <input
                type="password"
                className="form-control"
                value={credentials.admin_code}
                onChange={(e) => handleInputChange('admin_code', e.target.value)}
                placeholder="Enter admin access code"
                required
              />
              <small className="form-help">
                Contact system administrator for access code
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{width: '100%'}}
              disabled={loading}
            >
              {loading ? 'Authenticating...' : 'Admin Login'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <p><a href="/">← Back to Patient/Doctor Login</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
