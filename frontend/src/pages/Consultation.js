import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import axios from 'axios';

const Consultation = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [queue, setQueue] = useState([]);
  const [myQueue, setMyQueue] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [activeConsultation, setActiveConsultation] = useState(null);

  useEffect(() => {
    fetchData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [queueRes, myQueueRes, doctorsRes] = await Promise.allSettled([
        axios.get('/api/queue/'), // Changed to fetch from ConsultationQueue
        axios.get('/queues/my-queue'),
        axios.get('/doctors/available')
      ]);

      if (queueRes.status === 'fulfilled') setQueue(queueRes.value.data);
      if (myQueueRes.status === 'fulfilled') setMyQueue(myQueueRes.value.data);
      if (doctorsRes.status === 'fulfilled') setDoctors(doctorsRes.value.data);
    } catch (error) {
      console.error('Failed to fetch consultation data:', error);
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

  if (user?.role === 'patient') {
    return <PatientConsultation 
      myQueue={myQueue} 
      doctors={doctors} 
      showJoinForm={showJoinForm}
      setShowJoinForm={setShowJoinForm}
      fetchData={fetchData}
      activeConsultation={activeConsultation}
      setActiveConsultation={setActiveConsultation}
    />;
  }

  if (user?.role === 'doctor') {
    return <DoctorConsultation 
      queue={queue} 
      myQueue={myQueue}
      fetchData={fetchData}
      activeConsultation={activeConsultation}
      setActiveConsultation={setActiveConsultation}
    />;
  }

  return (
    <div className="container">
      <Card>
        <CardHeader>
          <CardTitle>{t('messages.unauthorized')}</CardTitle>
          <CardSubtitle>You don't have permission to access consultations</CardSubtitle>
        </CardHeader>
      </Card>
    </div>
  );
};

const PatientConsultation = ({ myQueue, doctors, showJoinForm, setShowJoinForm, fetchData, activeConsultation, setActiveConsultation }) => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    symptoms: '',
    doctorId: '',
    urgency: 'low'
  });
  const [submitting, setSubmitting] = useState(false);
  const [consultationQueue, setConsultationQueue] = useState([]);
  const [joinedQueue, setJoinedQueue] = useState(false);

  // Fetch consultation queue data
  useEffect(() => {
    fetchConsultationQueue();
    const interval = setInterval(fetchConsultationQueue, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchConsultationQueue = async () => {
    try {
      const response = await axios.get('/api/queue/');
      setConsultationQueue(response.data);
    } catch (error) {
      console.error('Failed to fetch consultation queue:', error);
    }
  };

  const activeQueue = myQueue.find(q => q.status === 'waiting' || q.status === 'in_progress');
  const inProgress = myQueue.find(q => q.status === 'in_progress');

  const handleJoinConsultationQueue = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post('/api/queue/join', {
        patient_name: user?.name || 'Anonymous Patient',
        symptoms: formData.symptoms
      });

      setShowJoinForm(false);
      setFormData({ symptoms: '', doctorId: '', urgency: 'low' });
      setJoinedQueue(true);
      fetchConsultationQueue();
      alert('Successfully joined the consultation queue!');
    } catch (error) {
      console.error('Failed to join consultation queue:', error);
      alert('Failed to join consultation queue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinQueue = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post('/queues/', {
        patient_id: parseInt(localStorage.getItem('patientId')), // This should be set during login
        doctor_id: formData.doctorId ? parseInt(formData.doctorId) : null,
        symptoms_brief: formData.symptoms
      });

      setShowJoinForm(false);
      setFormData({ symptoms: '', doctorId: '', urgency: 'low' });
      fetchData();
    } catch (error) {
      console.error('Failed to join queue:', error);
      alert('Failed to join queue. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cancelQueue = async (queueId) => {
    try {
      await axios.delete(`/queues/${queueId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to cancel queue:', error);
      alert('Failed to cancel queue. Please try again.');
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>{t('patient.consultation.title')}</h1>
        <p>{t('patient.consultation.subtitle')}</p>
      </div>

      {/* Active Consultation */}
      {inProgress && (
        <Card style={{ marginBottom: '2rem', border: '2px solid #28a745' }}>
          <CardHeader>
            <CardTitle>🎥 Active Consultation</CardTitle>
            <CardSubtitle>Your consultation is in progress</CardSubtitle>
          </CardHeader>
          <VideoCallInterface 
            consultation={inProgress}
            onEnd={() => {
              setActiveConsultation(null);
              fetchData();
            }}
          />
        </Card>
      )}

      {/* Current Queue Status */}
      {activeQueue && !inProgress && (
        <Card style={{ marginBottom: '2rem', border: '2px solid #ffc107' }}>
          <CardHeader>
            <CardTitle>⏱️ You're in the Queue</CardTitle>
            <CardSubtitle>Please wait for your turn</CardSubtitle>
          </CardHeader>
          <div>
            <p><strong>Symptoms:</strong> {activeQueue.symptoms_brief}</p>
            <p><strong>Priority:</strong> 
              <span className={`priority priority-${
                activeQueue.priority === 4 ? 'emergency' :
                activeQueue.priority === 3 ? 'high' :
                activeQueue.priority === 2 ? 'medium' : 'low'
              }`}>
                {activeQueue.priority === 4 ? 'Emergency' :
                 activeQueue.priority === 3 ? 'High' :
                 activeQueue.priority === 2 ? 'Medium' : 'Low'}
              </span>
            </p>
            <p><strong>Estimated Wait:</strong> {activeQueue.estimated_wait_time || 15} minutes</p>
            <p><strong>Status:</strong> 
              <span className={`status ${activeQueue.status === 'waiting' ? 'status-busy' : 'status-online'}`}>
                {activeQueue.status === 'waiting' ? 'Waiting' : 'In Progress'}
              </span>
            </p>
            <button 
              onClick={() => cancelQueue(activeQueue.id)}
              className="btn btn-danger"
              style={{ marginTop: '1rem' }}
            >
              Cancel Consultation
            </button>
          </div>
        </Card>
      )}

      {/* Join Consultation Queue Form */}
      {!activeQueue && !joinedQueue && (
        <Card style={{ marginBottom: '2rem' }}>
          <CardHeader>
            <CardTitle>Join Consultation Queue</CardTitle>
            <CardSubtitle>Describe your symptoms to join the consultation queue</CardSubtitle>
          </CardHeader>
          
          {!showJoinForm ? (
            <button 
              onClick={() => setShowJoinForm(true)}
              className="btn btn-primary"
            >
              Join Consultation Queue
            </button>
          ) : (
            <form onSubmit={handleJoinConsultationQueue}>
              <div className="form-group">
                <label className="form-label">Describe your symptoms *</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formData.symptoms}
                  onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                  placeholder="Please describe your symptoms in detail..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Joining...' : 'Join Consultation Queue'}
                </button>
                <button 
                  type="button"
                  onClick={() => setShowJoinForm(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* Show queue status if joined */}
      {joinedQueue && (
        <Card style={{ marginBottom: '2rem', border: '2px solid #28a745' }}>
          <CardHeader>
            <CardTitle>✅ {t('patient.consultation.joinSuccess')}</CardTitle>
            <CardSubtitle>{t('patient.consultation.joinSuccessMessage')}</CardSubtitle>
          </CardHeader>
          <div>
            <p>Thank you for joining the consultation queue. A doctor will be with you shortly.</p>
            <button 
              onClick={() => setJoinedQueue(false)}
              className="btn btn-secondary"
            >
              {t('patient.consultation.joinAnother')}
            </button>
          </div>
        </Card>
      )}

      {/* Current Consultation Queue */}
      {consultationQueue.length > 0 && (
        <Card style={{ marginBottom: '2rem' }}>
          <CardHeader>
            <CardTitle>{t('patient.consultation.currentQueue')}</CardTitle>
            <CardSubtitle>{consultationQueue.length} {t('patient.consultation.patientsWaiting')}</CardSubtitle>
          </CardHeader>
          <div>
            {consultationQueue.map((item, index) => (
              <div key={item.id} style={{ 
                padding: '1rem', 
                border: '1px solid #ddd', 
                borderRadius: '5px', 
                marginBottom: '0.5rem',
                backgroundColor: index === 0 ? '#e8f5e8' : '#f8f9fa'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>
                      {index === 0 ? '🔄 ' : `${index + 1}. `}
                      {item.patient_name}
                    </h4>
                    <p style={{ margin: '0 0 0.5rem 0', color: '#666' }}>
                      <strong>Symptoms:</strong> {item.symptoms}
                    </p>
                    <p style={{ margin: '0', fontSize: '0.9rem', color: '#888' }}>
                      Joined: {new Date(item.joined_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className={`status ${
                      index === 0 ? 'status-online' : 'status-busy'
                    }`}>
                      {index === 0 ? 'Next' : 'Waiting'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Available Doctors */}
      <Card>
        <CardHeader>
          <CardTitle>{t('patient.consultation.availableDoctors')}</CardTitle>
          <CardSubtitle>{doctors.length} {t('patient.consultation.doctorsOnline')}</CardSubtitle>
        </CardHeader>
        <div className="grid grid-2">
          {doctors.map(doctor => (
            <div key={doctor.id} className="card" style={{ margin: '0.5rem 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>Dr. {doctor.user.name}</h4>
                  <p style={{ color: '#666', margin: '0.25rem 0' }}>{doctor.specialization}</p>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    {doctor.experience_years} {t('patient.consultation.experience')}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                    {doctor.is_available ? (
                      <>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          padding: '0.25rem 0.5rem',
                          backgroundColor: '#d4edda',
                          color: '#155724',
                          borderRadius: '12px',
                          fontSize: '0.8rem',
                          fontWeight: '500'
                        }}>
                          🟢 Available
                        </span>
                        {doctor.emergency_status && (
                          <span style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.25rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            borderRadius: '12px',
                            fontSize: '0.8rem',
                            fontWeight: '500'
                          }}>
                            🚨 Emergency Duty
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ 
                        display: 'inline-flex', 
                        alignItems: 'center', 
                        gap: '0.25rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '12px',
                        fontSize: '0.8rem',
                        fontWeight: '500'
                      }}>
                        🔴 Offline
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#666' }}>
                      {t('patient.consultation.lastSeen')}: {new Date(doctor.last_seen).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

const DoctorConsultation = ({ queue, myQueue, fetchData, activeConsultation, setActiveConsultation }) => {
  const [selectedPatient, setSelectedPatient] = useState(null);

  const startConsultation = async (queueId) => {
    try {
      await axios.put(`/api/queue/${queueId}/status?status=in_consultation`);
      fetchData();
      setActiveConsultation(queueId);
    } catch (error) {
      console.error('Failed to start consultation:', error);
      alert('Failed to start consultation. Please try again.');
    }
  };

  const completeConsultation = async (queueId) => {
    try {
      await axios.put(`/api/queue/${queueId}/status?status=done`);
      fetchData();
      setActiveConsultation(null);
    } catch (error) {
      console.error('Failed to complete consultation:', error);
      alert('Failed to complete consultation. Please try again.');
    }
  };

  const inProgressConsultation = myQueue.find(q => q.status === 'in_progress');

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>Doctor Queue</h1>
        <p>Manage your patient consultations</p>
      </div>

      {/* Active Consultation */}
      {inProgressConsultation && (
        <Card style={{ marginBottom: '2rem', border: '2px solid #28a745' }}>
          <CardHeader>
            <CardTitle>🎥 Active Consultation</CardTitle>
            <CardSubtitle>Currently consulting with patient</CardSubtitle>
          </CardHeader>
          <VideoCallInterface 
            consultation={inProgressConsultation}
            isDoctor={true}
            onEnd={() => completeConsultation(inProgressConsultation.id)}
          />
        </Card>
      )}

      {/* Waiting Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Patient Queue</CardTitle>
          <CardSubtitle>{queue.length} patients waiting</CardSubtitle>
        </CardHeader>
        
        {queue.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
            No patients in queue
          </p>
        ) : (
          <div>
            {queue.map(item => (
              <div key={item.id} className="queue-item">
                <div className="queue-info">
                  <div className="queue-patient">{item.patient_name}</div>
                  <div className="queue-symptoms">{item.symptoms}</div>
                  <div className="queue-meta">
                    <span className="status">
                      Status: {item.status}
                    </span>
                    <span className="wait-time">
                      Waiting: {Math.floor((new Date() - new Date(item.joined_at)) / 60000)} min
                    </span>
                  </div>
                </div>
                <div>
                  {!inProgressConsultation && item.status === 'waiting' && (
                    <button 
                      onClick={() => startConsultation(item.id)}
                      className="btn btn-primary"
                    >
                      Start Consultation
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

const VideoCallInterface = ({ consultation, isDoctor = false, onEnd }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);

  return (
    <div>
      <div className="video-container">
        <div className="video-placeholder">
          <div style={{ textAlign: 'center' }}>
            <h3>Video Call Active</h3>
            <p>Consultation in progress...</p>
            <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              This is a placeholder for video call integration (WebRTC/Jitsi/Zoom)
            </p>
          </div>
        </div>
        
        <div className="video-controls">
          <button 
            className={`video-btn video-btn-mute ${isMuted ? 'muted' : ''}`}
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🎤'}
          </button>
          
          <button 
            className={`video-btn video-btn-mute ${!isVideoOn ? 'muted' : ''}`}
            onClick={() => setIsVideoOn(!isVideoOn)}
            title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoOn ? '📹' : '📷'}
          </button>
          
          <button 
            className="video-btn video-btn-end"
            onClick={onEnd}
            title="End call"
          >
            📞
          </button>
        </div>
      </div>
      
      {isDoctor && (
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
          <h4>Patient Information</h4>
          <p><strong>Symptoms:</strong> {consultation.symptoms_brief}</p>
          <p><strong>Priority:</strong> 
            <span className={`priority priority-${
              consultation.priority === 4 ? 'emergency' :
              consultation.priority === 3 ? 'high' :
              consultation.priority === 2 ? 'medium' : 'low'
            }`}>
              {consultation.priority === 4 ? 'Emergency' :
               consultation.priority === 3 ? 'High' :
               consultation.priority === 2 ? 'Medium' : 'Low'}
            </span>
          </p>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-info" style={{ marginRight: '1rem' }}>
              View Patient Records
            </button>
            <button className="btn btn-warning">
              Escalate to Government Hospital
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Consultation;
