import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import axios from 'axios';

const Profile = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      let profileResponse;
      
      if (user?.role === 'patient') {
        profileResponse = await axios.get('/patients/me/profile');
      } else if (user?.role === 'doctor') {
        // Get doctor profile - this would need the doctor ID
        const doctorsResponse = await axios.get('/doctors/');
        const myDoctor = doctorsResponse.data.find(d => d.user.id === user.id);
        profileResponse = { data: myDoctor };
      } else {
        // For admin/gov_official, just use user data
        profileResponse = { data: { user } };
      }
      
      setProfile(profileResponse.data);
      setFormData(profileResponse.data);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (user?.role === 'patient') {
        await axios.put(`/patients/${profile.id}`, formData);
      } else if (user?.role === 'doctor') {
        await axios.put(`/doctors/${profile.id}`, formData);
      }
      
      setProfile(formData);
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile');
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>{t('navbar.profile')}</h1>
        <p>Manage your account information and preferences</p>
      </div>

      <div className="grid grid-2">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardSubtitle>Your account details</CardSubtitle>
          </CardHeader>
          
          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              type="text"
              className="form-control"
              value={editing ? formData.user?.name || formData.name || '' : profile?.user?.name || profile?.name || ''}
              onChange={(e) => editing && setFormData({
                ...formData, 
                user: { ...formData.user, name: e.target.value }
              })}
              disabled={!editing}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={profile?.user?.email || user?.email || ''}
              disabled
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input
              type="tel"
              className="form-control"
              value={editing ? formData.user?.phone || '' : profile?.user?.phone || ''}
              onChange={(e) => editing && setFormData({
                ...formData, 
                user: { ...formData.user, phone: e.target.value }
              })}
              disabled={!editing}
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Role</label>
            <input
              type="text"
              className="form-control"
              value={user?.role || ''}
              disabled
            />
          </div>
        </Card>

        {/* Role-specific Information */}
        <Card>
          <CardHeader>
            <CardTitle>
              {user?.role === 'patient' ? 'Medical Information' :
               user?.role === 'doctor' ? 'Professional Information' :
               'Additional Information'}
            </CardTitle>
          </CardHeader>
          
          {user?.role === 'patient' && (
            <PatientProfile 
              profile={profile}
              formData={formData}
              setFormData={setFormData}
              editing={editing}
            />
          )}
          
          {user?.role === 'doctor' && (
            <DoctorProfile 
              profile={profile}
              formData={formData}
              setFormData={setFormData}
              editing={editing}
            />
          )}
          
          {(user?.role === 'admin' || user?.role === 'gov_official') && (
            <AdminProfile user={user} />
          )}
        </Card>
      </div>

      {/* Action Buttons */}
      <Card style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {!editing ? (
            <button 
              className="btn btn-primary"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          ) : (
            <>
              <button 
                className="btn btn-success"
                onClick={handleSave}
              >
                Save Changes
              </button>
              <button 
                className="btn btn-secondary"
                onClick={() => {
                  setEditing(false);
                  setFormData(profile);
                }}
              >
                Cancel
              </button>
            </>
          )}
          
          <button className="btn btn-info">
            Download Profile Data
          </button>
          
          <button className="btn btn-warning">
            Change Password
          </button>
        </div>
      </Card>

      {/* Account Statistics */}
      <AccountStatistics user={user} />
    </div>
  );
};

const PatientProfile = ({ profile, formData, setFormData, editing }) => (
  <>
    <div className="form-group">
      <label className="form-label">Age</label>
      <input
        type="number"
        className="form-control"
        value={editing ? formData.age || '' : profile?.age || ''}
        onChange={(e) => editing && setFormData({...formData, age: parseInt(e.target.value) || null})}
        disabled={!editing}
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Gender</label>
      <select
        className="form-control form-select"
        value={editing ? formData.gender || '' : profile?.gender || ''}
        onChange={(e) => editing && setFormData({...formData, gender: e.target.value})}
        disabled={!editing}
      >
        <option value="">Select gender</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
        <option value="Other">Other</option>
      </select>
    </div>
    
    <div className="form-group">
      <label className="form-label">Village</label>
      <input
        type="text"
        className="form-control"
        value={editing ? formData.village || '' : profile?.village || ''}
        onChange={(e) => editing && setFormData({...formData, village: e.target.value})}
        disabled={!editing}
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Blood Group</label>
      <select
        className="form-control form-select"
        value={editing ? formData.blood_group || '' : profile?.blood_group || ''}
        onChange={(e) => editing && setFormData({...formData, blood_group: e.target.value})}
        disabled={!editing}
      >
        <option value="">Select blood group</option>
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
    
    <div className="form-group">
      <label className="form-label">Emergency Contact</label>
      <input
        type="tel"
        className="form-control"
        value={editing ? formData.emergency_contact || '' : profile?.emergency_contact || ''}
        onChange={(e) => editing && setFormData({...formData, emergency_contact: e.target.value})}
        disabled={!editing}
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Medical History</label>
      <textarea
        className="form-control"
        rows="3"
        value={editing ? formData.medical_history || '' : profile?.medical_history || ''}
        onChange={(e) => editing && setFormData({...formData, medical_history: e.target.value})}
        disabled={!editing}
        placeholder="Previous medical conditions, surgeries, etc."
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Allergies</label>
      <textarea
        className="form-control"
        rows="2"
        value={editing ? formData.allergies || '' : profile?.allergies || ''}
        onChange={(e) => editing && setFormData({...formData, allergies: e.target.value})}
        disabled={!editing}
        placeholder="Known allergies to medications, foods, etc."
      />
    </div>
  </>
);

const DoctorProfile = ({ profile, formData, setFormData, editing }) => (
  <>
    <div className="form-group">
      <label className="form-label">Specialization</label>
      <input
        type="text"
        className="form-control"
        value={editing ? formData.specialization || '' : profile?.specialization || ''}
        onChange={(e) => editing && setFormData({...formData, specialization: e.target.value})}
        disabled={!editing}
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">License Number</label>
      <input
        type="text"
        className="form-control"
        value={profile?.license_number || ''}
        disabled
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Experience (Years)</label>
      <input
        type="number"
        className="form-control"
        value={editing ? formData.experience_years || '' : profile?.experience_years || ''}
        onChange={(e) => editing && setFormData({...formData, experience_years: parseInt(e.target.value) || null})}
        disabled={!editing}
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Location</label>
      <input
        type="text"
        className="form-control"
        value={editing ? formData.location || '' : profile?.location || ''}
        onChange={(e) => editing && setFormData({...formData, location: e.target.value})}
        disabled={!editing}
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Availability Status</label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span className={`status ${profile?.is_available ? 'status-online' : 'status-offline'}`}>
          {profile?.is_available ? 'Available' : 'Unavailable'}
        </span>
        {profile?.emergency_status && (
          <span className="status status-emergency">Emergency Duty</span>
        )}
      </div>
    </div>
    
    <div className="form-group">
      <label className="form-label">Last Seen</label>
      <input
        type="text"
        className="form-control"
        value={profile?.last_seen ? new Date(profile.last_seen).toLocaleString() : 'Never'}
        disabled
      />
    </div>
  </>
);

const AdminProfile = ({ user }) => (
  <div>
    <div className="form-group">
      <label className="form-label">Access Level</label>
      <input
        type="text"
        className="form-control"
        value={user?.role === 'admin' ? 'System Administrator' : 'Government Official'}
        disabled
      />
    </div>
    
    <div className="form-group">
      <label className="form-label">Permissions</label>
      <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
          {user?.role === 'admin' ? (
            <>
              <li>Manage doctors and patients</li>
              <li>Pharmacy inventory management</li>
              <li>System configuration</li>
              <li>Emergency response coordination</li>
              <li>Data analytics and reporting</li>
            </>
          ) : (
            <>
              <li>Health analytics and reporting</li>
              <li>Outbreak monitoring</li>
              <li>Resource allocation planning</li>
              <li>Emergency response oversight</li>
              <li>Inter-hospital coordination</li>
            </>
          )}
        </ul>
      </div>
    </div>
  </div>
);

const AccountStatistics = ({ user }) => {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      if (user?.role === 'patient') {
        const recordsRes = await axios.get('/records/my-records');
        const queueRes = await axios.get('/queues/my-queue');
        
        setStats({
          totalConsultations: recordsRes.data.length,
          emergencyVisits: recordsRes.data.filter(r => r.is_emergency).length,
          activeQueues: queueRes.data.filter(q => q.status === 'waiting' || q.status === 'in_progress').length,
          lastVisit: recordsRes.data[0]?.created_at
        });
      } else if (user?.role === 'doctor') {
        const recordsRes = await axios.get('/records/my-records');
        const queueRes = await axios.get('/queues/my-queue');
        
        setStats({
          totalConsultations: recordsRes.data.length,
          activeQueues: queueRes.data.filter(q => q.status === 'waiting').length,
          completedToday: recordsRes.data.filter(r => 
            new Date(r.created_at).toDateString() === new Date().toDateString()
          ).length
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  return (
    <Card style={{ marginTop: '2rem' }}>
      <CardHeader>
        <CardTitle>Account Statistics</CardTitle>
        <CardSubtitle>Your activity summary</CardSubtitle>
      </CardHeader>
      
      <div className="grid grid-3">
        {user?.role === 'patient' && (
          <>
            <div className="dashboard-widget">
              <div className="widget-header">
                <span className="widget-title">Total Consultations</span>
                <span style={{ fontSize: '1.5rem' }}>📋</span>
              </div>
              <div className="widget-value">{stats.totalConsultations || 0}</div>
            </div>
            
            <div className="dashboard-widget">
              <div className="widget-header">
                <span className="widget-title">Emergency Visits</span>
                <span style={{ fontSize: '1.5rem' }}>🚨</span>
              </div>
              <div className="widget-value">{stats.emergencyVisits || 0}</div>
            </div>
            
            <div className="dashboard-widget">
              <div className="widget-header">
                <span className="widget-title">Active Queues</span>
                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
              </div>
              <div className="widget-value">{stats.activeQueues || 0}</div>
            </div>
          </>
        )}
        
        {user?.role === 'doctor' && (
          <>
            <div className="dashboard-widget">
              <div className="widget-header">
                <span className="widget-title">Total Consultations</span>
                <span style={{ fontSize: '1.5rem' }}>👥</span>
              </div>
              <div className="widget-value">{stats.totalConsultations || 0}</div>
            </div>
            
            <div className="dashboard-widget">
              <div className="widget-header">
                <span className="widget-title">Pending Queue</span>
                <span style={{ fontSize: '1.5rem' }}>⏱️</span>
              </div>
              <div className="widget-value">{stats.activeQueues || 0}</div>
            </div>
            
            <div className="dashboard-widget">
              <div className="widget-header">
                <span className="widget-title">Completed Today</span>
                <span style={{ fontSize: '1.5rem' }}>✅</span>
              </div>
              <div className="widget-value">{stats.completedToday || 0}</div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default Profile;
