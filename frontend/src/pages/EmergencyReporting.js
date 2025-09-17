import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../App';
import InteractiveCard from '../components/InteractiveCard';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const EmergencyReporting = () => {
  const { user } = useContext(AuthContext);
  const [emergencyType, setEmergencyType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [emergencyReported, setEmergencyReported] = useState(false);
  const [emergencyId, setEmergencyId] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const emergencyTypes = [
    { value: 'medical', label: 'Medical Emergency', icon: '🏥' },
    { value: 'accident', label: 'Accident', icon: '🚑' },
    { value: 'cardiac', label: 'Heart Attack/Cardiac', icon: '❤️' },
    { value: 'stroke', label: 'Stroke', icon: '🧠' },
    { value: 'breathing', label: 'Breathing Difficulty', icon: '🫁' },
    { value: 'injury', label: 'Severe Injury', icon: '🩹' },
    { value: 'poisoning', label: 'Poisoning', icon: '☠️' },
    { value: 'other', label: 'Other Emergency', icon: '🚨' }
  ];

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocation(`Lat: ${position.coords.latitude.toFixed(6)}, Lng: ${position.coords.longitude.toFixed(6)}`);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const reportEmergency = async () => {
    if (!emergencyType || !description.trim()) {
      alert('Please select emergency type and provide description');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/emergency/report', {
        emergency_type: emergencyType,
        description: description,
        location: location,
        contact_number: contactNumber || user?.phone,
        coordinates: currentLocation,
        patient_id: user?.id
      });

      setEmergencyId(response.data.emergency_id);
      setEmergencyReported(true);
      
      // Also notify available doctors
      await axios.post('/emergency/notify-doctors', {
        emergency_id: response.data.emergency_id
      });

    } catch (error) {
      console.error('Error reporting emergency:', error);
      alert('Failed to report emergency. Please try again or call emergency services directly.');
    } finally {
      setLoading(false);
    }
  };

  const callEmergencyServices = () => {
    window.open('tel:108', '_self'); // Indian emergency number
  };

  if (loading) {
    return <LoadingSpinner text="Reporting emergency..." />;
  }

  if (emergencyReported) {
    return (
      <div className="container">
        <div className="main-content">
          <div className="emergency-reported fade-in">
            <InteractiveCard
              title="🚨 Emergency Reported Successfully"
              subtitle={`Emergency ID: ${emergencyId}`}
              className="emergency-success-card"
            >
              <div className="emergency-status">
                <div className="status-indicator pulsing">
                  <span className="status-dot"></span>
                  <span>Help is on the way</span>
                </div>
                
                <div className="emergency-info">
                  <p><strong>What happens next:</strong></p>
                  <ul>
                    <li>✅ Emergency services have been notified</li>
                    <li>✅ Available doctors have been alerted</li>
                    <li>✅ Your location has been shared</li>
                    <li>🔄 Emergency response team is being dispatched</li>
                  </ul>
                </div>

                <div className="emergency-actions">
                  <button 
                    className="btn btn-danger btn-large"
                    onClick={callEmergencyServices}
                  >
                    📞 Call Emergency Services (108)
                  </button>
                  
                  <button 
                    className="btn btn-outline"
                    onClick={() => {
                      setEmergencyReported(false);
                      setEmergencyId(null);
                      setEmergencyType('');
                      setDescription('');
                    }}
                  >
                    Report Another Emergency
                  </button>
                </div>

                <div className="emergency-tips">
                  <h4>While waiting for help:</h4>
                  <ul>
                    <li>Stay calm and keep the patient comfortable</li>
                    <li>Do not move the patient unless necessary</li>
                    <li>Keep airways clear</li>
                    <li>Apply pressure to bleeding wounds</li>
                    <li>Stay on the line if emergency services call</li>
                  </ul>
                </div>
              </div>
            </InteractiveCard>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="main-content">
        <h1 className="page-title emergency-title">🚨 Emergency Reporting</h1>
        <p className="page-subtitle">Report medical emergencies for immediate assistance</p>

        <div className="emergency-warning fade-in">
          <InteractiveCard
            title="⚠️ For Life-Threatening Emergencies"
            subtitle="Call 108 immediately for ambulance services"
            className="warning-card"
          >
            <button 
              className="btn btn-danger btn-large emergency-call-btn"
              onClick={callEmergencyServices}
            >
              📞 Call 108 Now
            </button>
          </InteractiveCard>
        </div>

        <InteractiveCard
          title="Report Emergency"
          subtitle="Provide details for medical emergency response"
          className="emergency-form-card fade-in"
        >
          <div className="emergency-form">
            <div className="form-group">
              <label className="form-label">Emergency Type</label>
              <div className="emergency-types-grid">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.value}
                    className={`emergency-type-btn ${emergencyType === type.value ? 'selected' : ''}`}
                    onClick={() => setEmergencyType(type.value)}
                  >
                    <span className="emergency-icon">{type.icon}</span>
                    <span className="emergency-label">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="4"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the emergency situation in detail..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location</label>
              <div className="location-input-group">
                <input
                  type="text"
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter location or address"
                />
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={getCurrentLocation}
                >
                  📍 Use Current Location
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Contact Number</label>
              <input
                type="tel"
                className="form-control"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder={user?.phone || "Enter contact number"}
              />
            </div>

            <div className="emergency-actions">
              <button
                className="btn btn-danger btn-large"
                onClick={reportEmergency}
                disabled={!emergencyType || !description.trim()}
              >
                🚨 Report Emergency
              </button>
            </div>

            <div className="emergency-disclaimer">
              <p><strong>Note:</strong> This service complements but does not replace calling emergency services (108). For immediate life-threatening situations, always call 108 first.</p>
            </div>
          </div>
        </InteractiveCard>
      </div>
    </div>
  );
};

export default EmergencyReporting;
