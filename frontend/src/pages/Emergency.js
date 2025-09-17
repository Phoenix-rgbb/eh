import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import axios from 'axios';

const Emergency = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [emergencyDoctors, setEmergencyDoctors] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateAlert, setShowCreateAlert] = useState(false);

  useEffect(() => {
    fetchEmergencyData();
    // Refresh every 30 seconds for real-time updates
    const interval = setInterval(fetchEmergencyData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchEmergencyData = async () => {
    try {
      const [doctorsRes, alertsRes] = await Promise.allSettled([
        axios.get('/emergency/doctors/on-duty'),
        axios.get('/emergency/alerts')
      ]);

      if (doctorsRes.status === 'fulfilled') setEmergencyDoctors(doctorsRes.value.data);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data);
    } catch (error) {
      console.error('Failed to fetch emergency data:', error);
    } finally {
      setLoading(false);
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
        <h1>🚨 {t('emergency.title')}</h1>
        <p>{t('emergency.subtitle')}</p>
        
        {/* Emergency Hotline */}
        <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>📞</div>
          <div style={{ flex: 1 }}>
            <strong>Emergency Hotline: +91-XXX-XXXX-XXXX</strong>
            <p style={{ margin: 0 }}>Call immediately for life-threatening emergencies</p>
          </div>
          <a href="tel:+91XXXXXXXXXX" className="btn btn-danger">
            Call Now
          </a>
        </div>
      </div>

      {/* Emergency Status Dashboard */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('admin.doctors')}</span>
            <span style={{ fontSize: '1.5rem' }}>👨‍⚕️</span>
          </div>
          <div className="widget-value">{emergencyDoctors.length}</div>
          <div className="widget-change change-positive">{t('doctor.status.available')}</div>
        </div>
        
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">Active Alerts</span>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
          </div>
          <div className="widget-value">{alerts.filter(a => a.status === 'active').length}</div>
          <div className="widget-change">Pending response</div>
        </div>
        
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">Response Time</span>
            <span style={{ fontSize: '1.5rem' }}>⏱️</span>
          </div>
          <div className="widget-value" style={{ fontSize: '1.2rem' }}>~15 min</div>
          <div className="widget-change">Average</div>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Emergency Doctors */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Doctors on Duty</CardTitle>
            <CardSubtitle>{emergencyDoctors.length} doctors available</CardSubtitle>
          </CardHeader>
          
          {emergencyDoctors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <h3>⚠️</h3>
              <p>No emergency doctors currently on duty</p>
              <p style={{ fontSize: '0.9rem' }}>Please call the emergency hotline</p>
            </div>
          ) : (
            <div>
              {emergencyDoctors.map(doctor => (
                <div key={doctor.id} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '1rem',
                  border: '1px solid #eee',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div>
                    <h4 style={{ margin: 0 }}>Dr. {doctor.name}</h4>
                    <p style={{ margin: '0.25rem 0', color: '#666' }}>
                      {doctor.specialization}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                      📍 {doctor.location || 'Location not specified'}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="status status-emergency">On Duty</span>
                    <div style={{ marginTop: '0.5rem' }}>
                      <button className="btn btn-danger" style={{ fontSize: '0.9rem' }}>
                        Contact
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Emergency Alerts */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Alerts</CardTitle>
            <CardSubtitle>Recent emergency cases</CardSubtitle>
          </CardHeader>
          
          {user?.role === 'patient' && (
            <button 
              className="btn btn-danger"
              onClick={() => setShowCreateAlert(true)}
              style={{ marginBottom: '1rem', width: '100%' }}
            >
              🚨 Report Emergency
            </button>
          )}
          
          {alerts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <h3>✅</h3>
              <p>No active emergency alerts</p>
            </div>
          ) : (
            <div>
              {alerts.slice(0, 5).map(alert => (
                <div key={alert.id} style={{ 
                  padding: '1rem',
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                  backgroundColor: alert.status === 'active' ? '#fff3cd' : '#f8f9fa'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#856404' }}>
                        {alert.alert_type.toUpperCase()} Emergency
                      </h5>
                      <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem' }}>
                        {alert.description}
                      </p>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#666' }}>
                        📍 {alert.location} • {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span className={`status ${
                      alert.status === 'active' ? 'status-emergency' :
                      alert.status === 'assigned' ? 'status-busy' : 'status-online'
                    }`}>
                      {alert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Emergency Protocols */}
      <Card style={{ marginTop: '2rem' }}>
        <CardHeader>
          <CardTitle>Emergency Response Protocols</CardTitle>
          <CardSubtitle>Quick reference for emergency situations</CardSubtitle>
        </CardHeader>
        
        <div className="grid grid-2">
          <div>
            <h4>🫀 Cardiac Emergency</h4>
            <ol>
              <li>Call emergency hotline immediately</li>
              <li>Check for responsiveness and breathing</li>
              <li>Start CPR if trained and necessary</li>
              <li>Use AED if available</li>
              <li>Stay with patient until help arrives</li>
            </ol>
          </div>
          
          <div>
            <h4>🩸 Severe Bleeding</h4>
            <ol>
              <li>Apply direct pressure to wound</li>
              <li>Elevate injured area if possible</li>
              <li>Use clean cloth or bandage</li>
              <li>Do not remove embedded objects</li>
              <li>Call for emergency assistance</li>
            </ol>
          </div>
          
          <div>
            <h4>🧠 Stroke Signs (FAST)</h4>
            <ul>
              <li><strong>F</strong>ace: Face drooping on one side</li>
              <li><strong>A</strong>rms: Arm weakness or numbness</li>
              <li><strong>S</strong>peech: Speech difficulty or slurred</li>
              <li><strong>T</strong>ime: Time to call emergency services</li>
            </ul>
          </div>
          
          <div>
            <h4>🫁 Breathing Emergency</h4>
            <ol>
              <li>Keep patient calm and upright</li>
              <li>Loosen tight clothing</li>
              <li>Check for obstructions</li>
              <li>Use rescue inhaler if available</li>
              <li>Call emergency services immediately</li>
            </ol>
          </div>
        </div>
      </Card>

      {/* Government Hospital Escalation */}
      <Card style={{ marginTop: '2rem', backgroundColor: '#e7f3ff', border: '1px solid #0066cc' }}>
        <CardHeader>
          <CardTitle style={{ color: '#0066cc' }}>🏥 Government Hospital Network</CardTitle>
          <CardSubtitle style={{ color: '#0066cc' }}>
            For complex emergencies requiring advanced care
          </CardSubtitle>
        </CardHeader>
        
        <div className="grid grid-2">
          <div>
            <h4>District Hospital</h4>
            <p>📞 +91-XXX-XXX-XXXX</p>
            <p>📍 Main City, 45 km away</p>
            <p>🚑 Ambulance available</p>
          </div>
          <div>
            <h4>Medical College Hospital</h4>
            <p>📞 +91-XXX-XXX-XXXX</p>
            <p>📍 State Capital, 120 km away</p>
            <p>🚁 Air ambulance on request</p>
          </div>
        </div>
        
        <button className="btn btn-info" style={{ marginTop: '1rem' }}>
          Request Government Hospital Transfer
        </button>
      </Card>

      {/* Create Emergency Alert Modal */}
      {showCreateAlert && (
        <CreateEmergencyAlert 
          onClose={() => setShowCreateAlert(false)}
          onSubmit={fetchEmergencyData}
        />
      )}
    </div>
  );
};

const CreateEmergencyAlert = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    alert_type: '',
    location: '',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const patientId = parseInt(localStorage.getItem('patientId'));
      await axios.post('/emergency/alert', {
        ...formData,
        patient_id: patientId
      });
      
      onSubmit();
      onClose();
      alert('Emergency alert created successfully. Help is on the way!');
    } catch (error) {
      console.error('Failed to create emergency alert:', error);
      alert('Failed to create emergency alert. Please call the emergency hotline.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3 style={{ color: '#dc3545' }}>🚨 Report Emergency</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="alert alert-warning">
          <strong>For life-threatening emergencies, call +91-XXX-XXXX-XXXX immediately!</strong>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Emergency Type *</label>
            <select
              className="form-control form-select"
              value={formData.alert_type}
              onChange={(e) => setFormData({...formData, alert_type: e.target.value})}
              required
            >
              <option value="">Select emergency type</option>
              <option value="cardiac">Cardiac Emergency</option>
              <option value="respiratory">Breathing Problems</option>
              <option value="trauma">Injury/Trauma</option>
              <option value="stroke">Stroke</option>
              <option value="poisoning">Poisoning</option>
              <option value="allergic">Severe Allergic Reaction</option>
              <option value="other">Other Emergency</option>
            </select>
          </div>
          
          <div className="form-group">
            <label className="form-label">Location *</label>
            <input
              type="text"
              className="form-control"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Exact location or nearest landmark"
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              className="form-control"
              rows="4"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the emergency situation in detail..."
              required
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              type="submit" 
              className="btn btn-danger"
              disabled={submitting}
              style={{ flex: 1 }}
            >
              {submitting ? 'Sending Alert...' : '🚨 Send Emergency Alert'}
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Emergency;
