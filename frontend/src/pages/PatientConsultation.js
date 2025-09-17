import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import InteractiveCard from '../components/InteractiveCard';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const PatientConsultation = () => {
  const { user } = useContext(AuthContext);
  const [queuePosition, setQueuePosition] = useState(null);
  const [availableDoctors, setAvailableDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [inQueue, setInQueue] = useState(false);
  const [estimatedWaitTime, setEstimatedWaitTime] = useState(null);

  useEffect(() => {
    fetchAvailableDoctors();
    checkQueueStatus();
  }, []);

  const fetchAvailableDoctors = async () => {
    try {
      const response = await axios.get('/doctors/available');
      setAvailableDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const checkQueueStatus = async () => {
    try {
      const response = await axios.get('/queues/my-position');
      if (response.data.position) {
        setQueuePosition(response.data.position);
        setEstimatedWaitTime(response.data.estimated_wait);
        setInQueue(true);
      }
    } catch (error) {
      console.error('Error checking queue status:', error);
    }
  };

  const joinQueue = async () => {
    if (!selectedDoctor || !symptoms.trim()) {
      alert('Please select a doctor and describe your symptoms');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/queues/join', {
        doctor_id: selectedDoctor.id,
        symptoms: symptoms,
        urgency: urgency
      });
      
      setQueuePosition(response.data.position);
      setEstimatedWaitTime(response.data.estimated_wait);
      setInQueue(true);
    } catch (error) {
      console.error('Error joining queue:', error);
      alert('Failed to join consultation queue');
    } finally {
      setLoading(false);
    }
  };

  const leaveQueue = async () => {
    setLoading(true);
    try {
      await axios.delete('/queues/leave');
      setQueuePosition(null);
      setEstimatedWaitTime(null);
      setInQueue(false);
    } catch (error) {
      console.error('Error leaving queue:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Processing your request..." />;
  }

  return (
    <div className="container">
      <div className="main-content">
        <h1 className="page-title">Consultation Queue</h1>
        
        {inQueue ? (
          <div className="queue-status fade-in">
            <InteractiveCard
              title="You're in the Queue!"
              subtitle={`Position: ${queuePosition}`}
              className="queue-status-card"
            >
              <div className="queue-info-grid">
                <div className="queue-stat">
                  <span className="stat-label">Estimated Wait Time</span>
                  <span className="stat-value">{estimatedWaitTime} minutes</span>
                </div>
                <div className="queue-stat">
                  <span className="stat-label">Doctor</span>
                  <span className="stat-value">{selectedDoctor?.name}</span>
                </div>
                <div className="queue-stat">
                  <span className="stat-label">Urgency</span>
                  <span className={`priority priority-${urgency}`}>{urgency}</span>
                </div>
              </div>
              
              <div className="queue-actions">
                <button 
                  className="btn btn-danger"
                  onClick={leaveQueue}
                >
                  Leave Queue
                </button>
              </div>
            </InteractiveCard>
          </div>
        ) : (
          <div className="consultation-form fade-in">
            <InteractiveCard
              title="Request Consultation"
              subtitle="Select a doctor and describe your symptoms"
            >
              <div className="form-group">
                <label className="form-label">Available Doctors</label>
                <div className="doctors-grid">
                  {availableDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`doctor-card ${selectedDoctor?.id === doctor.id ? 'selected' : ''}`}
                      onClick={() => setSelectedDoctor(doctor)}
                    >
                      <div className="doctor-info">
                        <h4>{doctor.name}</h4>
                        <p className="doctor-specialty">{doctor.specialization}</p>
                        <span className="status status-online">Available</span>
                      </div>
                      <div className="doctor-stats">
                        <span className="queue-count">{doctor.queue_count || 0} in queue</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Describe Your Symptoms</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Please describe your symptoms in detail..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">Urgency Level</label>
                <select
                  className="form-control form-select"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </div>

              <button
                className="btn btn-primary btn-large"
                onClick={joinQueue}
                disabled={!selectedDoctor || !symptoms.trim()}
              >
                Join Consultation Queue
              </button>
            </InteractiveCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientConsultation;
