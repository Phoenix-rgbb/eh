import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import InteractiveCard from '../components/InteractiveCard';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const EnhancedProfile = () => {
  const { user, setUser } = useContext(AuthContext);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    age: '',
    gender: '',
    address: '',
    emergency_contact: '',
    blood_group: '',
    allergies: '',
    medical_conditions: ''
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        age: user.age || '',
        gender: user.gender || '',
        address: user.address || '',
        emergency_contact: user.emergency_contact || '',
        blood_group: user.blood_group || '',
        allergies: user.allergies || '',
        medical_conditions: user.medical_conditions || ''
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveProfile = async () => {
    setLoading(true);
    try {
      const response = await axios.put('/auth/profile', profileData);
      setUser(response.data);
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setChangingPassword(false);
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      alert('Password changed successfully!');
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password. Please check your current password.');
    } finally {
      setLoading(false);
    }
  };

  const downloadProfileData = async () => {
    try {
      const response = await axios.get('/auth/profile/download', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${user.name}_profile_data.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading profile data:', error);
      alert('Failed to download profile data');
    }
  };

  const deleteAccount = async () => {
    const confirmation = window.prompt(
      'Are you sure you want to delete your account? This action cannot be undone. Type "DELETE" to confirm:'
    );
    
    if (confirmation !== 'DELETE') {
      return;
    }

    try {
      await axios.delete('/auth/profile');
      alert('Account deleted successfully');
      // Logout user
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Processing..." />;
  }

  return (
    <div className="container">
      <div className="main-content">
        <h1 className="page-title">Profile Management</h1>
        
        {/* Profile Information */}
        <InteractiveCard
          title="Personal Information"
          subtitle={editing ? "Edit your profile details" : "View and manage your profile"}
          className="profile-card fade-in"
        >
          <div className="profile-content">
            {!editing ? (
              <div className="profile-view">
                <div className="profile-avatar">
                  <div className="avatar-circle">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                </div>
                
                <div className="profile-details">
                  <div className="detail-row">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{profileData.name || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{profileData.email || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{profileData.phone || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Age:</span>
                    <span className="detail-value">{profileData.age || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Gender:</span>
                    <span className="detail-value">{profileData.gender || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{profileData.address || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Emergency Contact:</span>
                    <span className="detail-value">{profileData.emergency_contact || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Blood Group:</span>
                    <span className="detail-value">{profileData.blood_group || 'Not provided'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Allergies:</span>
                    <span className="detail-value">{profileData.allergies || 'None reported'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Medical Conditions:</span>
                    <span className="detail-value">{profileData.medical_conditions || 'None reported'}</span>
                  </div>
                </div>
                
                <button 
                  className="btn btn-primary"
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <div className="profile-edit">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      className="form-control"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Age</label>
                    <input
                      type="number"
                      className="form-control"
                      value={profileData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Gender</label>
                    <select
                      className="form-control form-select"
                      value={profileData.gender}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    >
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label">Blood Group</label>
                    <select
                      className="form-control form-select"
                      value={profileData.blood_group}
                      onChange={(e) => handleInputChange('blood_group', e.target.value)}
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={profileData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Emergency Contact</label>
                  <input
                    type="tel"
                    className="form-control"
                    value={profileData.emergency_contact}
                    onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
                    placeholder="Emergency contact number"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Allergies</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={profileData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    placeholder="List any allergies..."
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Medical Conditions</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={profileData.medical_conditions}
                    onChange={(e) => handleInputChange('medical_conditions', e.target.value)}
                    placeholder="List any ongoing medical conditions..."
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn btn-primary"
                    onClick={saveProfile}
                  >
                    Save Changes
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setEditing(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </InteractiveCard>

        {/* Password Change */}
        <InteractiveCard
          title="Security Settings"
          subtitle="Change your password and manage account security"
          className="security-card fade-in"
        >
          {!changingPassword ? (
            <div className="security-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setChangingPassword(true)}
              >
                Change Password
              </button>
            </div>
          ) : (
            <div className="password-change-form">
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.current_password}
                  onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.new_password}
                  onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-control"
                  value={passwordData.confirm_password}
                  onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                />
              </div>
              
              <div className="form-actions">
                <button 
                  className="btn btn-primary"
                  onClick={changePassword}
                >
                  Change Password
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setChangingPassword(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </InteractiveCard>

        {/* Data Management */}
        <InteractiveCard
          title="Data Management"
          subtitle="Download your data or delete your account"
          className="data-management-card fade-in"
        >
          <div className="data-actions">
            <button 
              className="btn btn-outline"
              onClick={downloadProfileData}
            >
              📥 Download My Data
            </button>
            
            <button 
              className="btn btn-danger"
              onClick={deleteAccount}
            >
              🗑️ Delete Account
            </button>
          </div>
          
          <div className="data-info">
            <p><strong>Download My Data:</strong> Get a copy of all your profile information and health records.</p>
            <p><strong>Delete Account:</strong> Permanently delete your account and all associated data. This action cannot be undone.</p>
          </div>
        </InteractiveCard>
      </div>
    </div>
  );
};

export default EnhancedProfile;
