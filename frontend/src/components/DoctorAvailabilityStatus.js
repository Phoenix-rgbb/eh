import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';

const DoctorAvailabilityStatus = ({ doctorId, initialAvailable = true, initialEmergency = false }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [isAvailable, setIsAvailable] = useState(initialAvailable);
  const [isEmergency, setIsEmergency] = useState(initialEmergency);
  const [loading, setLoading] = useState(false);

  // Fetch current doctor status
  useEffect(() => {
    fetchDoctorStatus();
  }, [doctorId]);

  const fetchDoctorStatus = async () => {
    if (!doctorId) {
      console.log('No doctorId provided, using default values');
      return;
    }
    
    try {
      const response = await axios.get(`/doctors/${doctorId}`);
      setIsAvailable(response.data.is_available);
      setIsEmergency(response.data.emergency_status);
      console.log('Doctor status fetched:', { isAvailable: response.data.is_available, isEmergency: response.data.emergency_status });
    } catch (error) {
      console.error('Error fetching doctor status:', error);
      console.log('Using default status values due to fetch error');
      // Keep default values if fetch fails
    }
  };

  const toggleAvailability = async () => {
    if (!doctorId) {
      alert('Doctor ID not found. Please refresh the page.');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      await axios.put(`/doctors/${doctorId}/availability`, {}, config);
      setIsAvailable(!isAvailable);
      console.log('Availability toggled to:', !isAvailable);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability status: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const toggleEmergencyStatus = async () => {
    if (!doctorId) {
      alert('Doctor ID not found. Please refresh the page.');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      await axios.put(`/doctors/${doctorId}/emergency-status`, {}, config);
      setIsEmergency(!isEmergency);
      console.log('Emergency status toggled to:', !isEmergency);
    } catch (error) {
      console.error('Error updating emergency status:', error);
      alert('Failed to update emergency status: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = () => {
    if (!isAvailable) {
      return { label: t('doctor.status.offline'), color: '#e53e3e', icon: '🔴' };
    } else if (isEmergency) {
      return { label: t('doctor.status.emergencyDuty'), color: '#e53e3e', icon: '🚨' };
    } else {
      return { label: t('doctor.status.available'), color: '#38a169', icon: '🟢' };
    }
  };

  const statusInfo = getStatusDisplay();

  return (
    <div className="doctor-status-widget">
      <div className="current-status">
        <span className="status-icon">{statusInfo.icon}</span>
        <span className="status-text" style={{ color: statusInfo.color }}>
          {statusInfo.label}
        </span>
      </div>
      
      <div className="status-controls">
        <button
          className={`status-btn ${isAvailable ? 'active' : ''}`}
          onClick={toggleAvailability}
          disabled={loading}
          style={{ 
            borderColor: isAvailable ? '#38a169' : '#e53e3e',
            backgroundColor: isAvailable ? '#38a169' : 'transparent',
            color: isAvailable ? 'white' : '#e53e3e',
            marginRight: '0.5rem'
          }}
        >
          {isAvailable ? `🟢 ${t('doctor.status.available')}` : `🔴 ${t('doctor.status.offline')}`}
        </button>
        
        {isAvailable && (
          <button
            className={`status-btn ${isEmergency ? 'active' : ''}`}
            onClick={toggleEmergencyStatus}
            disabled={loading}
            style={{ 
              borderColor: '#e53e3e',
              backgroundColor: isEmergency ? '#e53e3e' : 'transparent',
              color: isEmergency ? 'white' : '#e53e3e'
            }}
          >
            {isEmergency ? `🚨 ${t('doctor.status.emergency')}` : `🚨 ${t('doctor.status.emergencyMode')}`}
          </button>
        )}
      </div>
      
      {loading && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
          {t('common.loading')}
        </div>
      )}
    </div>
  );
};

export default DoctorAvailabilityStatus;
