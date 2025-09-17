import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import InteractiveCard from '../components/InteractiveCard';
import LoadingSpinner from '../components/LoadingSpinner';
import DoctorAvailabilityStatus from '../components/DoctorAvailabilityStatus';
import axios from 'axios';

const DoctorDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [doctorInfo, setDoctorInfo] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('=== DOCTOR DASHBOARD DEBUG ===');
      console.log('Token:', token);
      console.log('User:', user);
      console.log('User Role:', user?.role);
      
      if (!token) {
        console.error('No token found! User not logged in.');
        return;
      }
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };

      // First, get doctor info to get the doctor ID
      const doctorResponse = await axios.get('/doctors/', config);
      const currentDoctor = doctorResponse.data.find(doc => doc.user_id === user?.id);
      console.log('All doctors:', doctorResponse.data);
      console.log('Current user ID:', user?.id);
      console.log('Found current doctor:', currentDoctor);
      
      let finalDoctorInfo = currentDoctor;
      
      if (!currentDoctor && user?.role === 'doctor') {
        console.log('No doctor profile found for doctor user. Creating doctor profile...');
        try {
          // Create doctor profile on the server
          const createResponse = await axios.post('/doctors/create-profile', {}, config);
          console.log('Doctor profile created:', createResponse.data);
          finalDoctorInfo = createResponse.data;
          setDoctorInfo(createResponse.data);
        } catch (createError) {
          console.error('Failed to create doctor profile:', createError);
          // Create a temporary doctor info object for UI purposes
          const tempDoctorInfo = {
            id: user.id, // Use user ID as fallback
            user_id: user.id,
            is_available: true,
            emergency_status: false,
            specialization: 'General Medicine',
            experience_years: 0
          };
          finalDoctorInfo = tempDoctorInfo;
          setDoctorInfo(tempDoctorInfo);
        }
      } else {
        setDoctorInfo(currentDoctor);
      }

      console.log('Making API call to /queues/api/queue...');
      // Use the final doctor info (either found or created)
      const doctorIdToUse = finalDoctorInfo?.id || user?.id;
      const [queueRes, patientsRes, scheduleRes] = await Promise.allSettled([
        axios.get('/queues/api/queue', config),
        axios.get(`/doctors/${doctorIdToUse}/patients`, config),
        axios.get(`/doctors/${doctorIdToUse}/schedule`, config)
      ]);

      console.log('Queue Response Status:', queueRes.status);
      console.log('Queue Response:', queueRes);
      if (queueRes.status === 'fulfilled') {
        console.log('Queue Data:', queueRes.value.data);
        console.log('Queue Data Length:', queueRes.value.data.length);
        console.log('First patient data:', queueRes.value.data[0]);
        queueRes.value.data.forEach((patient, index) => {
          console.log(`Patient ${index + 1}:`, {
            id: patient.id,
            patient_name: patient.patient_name,
            symptoms: patient.symptoms,
            status: patient.status,
            joined_at: patient.joined_at
          });
        });
      } else {
        console.error('Queue Request Failed:', queueRes.reason);
      }

      const queueData = queueRes.status === 'fulfilled' ? queueRes.value.data : [];
      console.log('Setting dashboard data with queue:', queueData);
      
      setDashboardData({
        queue: queueData,
        patients: patientsRes.status === 'fulfilled' ? patientsRes.value.data : [],
        schedule: scheduleRes.status === 'fulfilled' ? scheduleRes.value.data : {}
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePatientCall = async (queueId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.post(`/queues/api/queue/start/${queueId}`, {}, config);
      // Refresh queue data
      fetchDashboardData();
      alert('Consultation started successfully!');
    } catch (error) {
      console.error('Failed to start consultation:', error);
      alert('Failed to start consultation');
    }
  };

  const handleFinishConsultation = async (queueId) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      await axios.post(`/queues/api/queue/finish/${queueId}`, {}, config);
      // Refresh queue data
      fetchDashboardData();
      alert('Consultation finished successfully!');
    } catch (error) {
      console.error('Failed to finish consultation:', error);
      alert('Failed to finish consultation');
    }
  };

  if (loading) {
    return <LoadingSpinner text={t('common.loading')} />;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">👨‍⚕️ {t('doctor.dashboard.title')}</h1>
        <p className="page-subtitle">{t('doctor.dashboard.subtitle')}</p>
      </div>

      {/* Doctor Status Widget */}
      <div style={{ marginBottom: '2rem' }}>
        {doctorInfo ? (
          <DoctorAvailabilityStatus 
            doctorId={doctorInfo.id}
            initialAvailable={doctorInfo.is_available}
            initialEmergency={doctorInfo.emergency_status}
          />
        ) : (
          <div className="doctor-status-widget">
            <div className="current-status">
              <span className="status-icon">⏳</span>
              <span className="status-text">{t('doctor.status.loadingStatus')}</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
              {t('doctor.status.waitMessage')}
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {[
          { id: 'queue', label: t('doctor.dashboard.patientQueue'), icon: '⏱️' },
          { id: 'active', label: t('doctor.dashboard.activeConsultations'), icon: '🩺' },
          { id: 'history', label: t('doctor.dashboard.patientHistory'), icon: '📋' },
          { id: 'schedule', label: t('doctor.dashboard.schedule'), icon: '📅' }
        ].map(tab => (
          <button
            key={tab.id}
            className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'queue' && (
        <>
          {console.log('Passing queue data to QueueTab:', JSON.stringify(dashboardData.queue, null, 2))}
          <QueueTab data={dashboardData.queue} onPatientCall={handlePatientCall} onFinishConsultation={handleFinishConsultation} t={t} />
        </>
      )}
      {activeTab === 'active' && <ActiveConsultationsTab onFinishConsultation={handleFinishConsultation} />}
      {activeTab === 'history' && <PatientHistoryTab data={dashboardData.patients} />}
      {activeTab === 'schedule' && <ScheduleTab data={dashboardData.schedule} />}
    </div>
  );
};

const QueueTab = ({ data, onPatientCall, onFinishConsultation, t }) => {
  console.log('QueueTab received data:', JSON.stringify(data, null, 2));
  console.log('QueueTab data type:', typeof data);
  console.log('QueueTab data length:', data?.length);
  console.log('QueueTab data is array:', Array.isArray(data));
  
  // Ensure data is an array
  const queueData = Array.isArray(data) ? data : [];
  
  return (
    <div>
      <div className="section-title">
        <h3>{t('doctor.dashboard.waitingPatients')} ({queueData.length})</h3>
      </div>

      {queueData.length === 0 ? (
        <div className="empty-state">
          <div className="empty-illustration">😴</div>
          <h3>{t('doctor.dashboard.noPatients')}</h3>
          <p>{t('doctor.dashboard.noPatientMessage')}</p>
        </div>
      ) : (
        <div className="queue-list">
          {queueData.map((queue, index) => {
            console.log(`Rendering patient ${index + 1}:`, JSON.stringify(queue, null, 2));
            return (
              <InteractiveCard
                key={queue.id}
                className="patient-queue-card"
              >
                <div className="patient-queue-info">
                  <div className="patient-details">
                    <h4>{queue.patient_name || t('doctor.dashboard.patientName')}</h4>
                <p className="patient-meta">
                  {t('doctor.dashboard.joinedAt')}: {queue.joined_at ? new Date(queue.joined_at).toLocaleString() : 'Unknown'}
                </p>
                <div className="symptoms">
                  <strong>{t('doctor.dashboard.symptoms')}:</strong> {queue.symptoms || 'No symptoms provided'}
                </div>
                <div className="urgency-indicator">
                  <span className="wait-time">
                    {t('doctor.dashboard.waitingTime')}: {queue.joined_at ? 
                      Math.floor((new Date() - new Date(queue.joined_at)) / 60000) : 0} minutes
                  </span>
                  <span className="status-badge">
                    {t('doctor.dashboard.status')}: {queue.status}
                  </span>
                </div>
              </div>
              <div className="patient-actions">
                {queue.status === 'waiting' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => onPatientCall(queue.id)}
                  >
                    {t('buttons.startConsultation')}
                  </button>
                )}
                {queue.status === 'in_consultation' && (
                  <button
                    className="btn btn-success"
                    onClick={() => onFinishConsultation(queue.id)}
                  >
                    {t('buttons.finishConsultation')}
                  </button>
                )}
                <button className="btn btn-outline btn-sm">
                  📋 View History
                </button>
              </div>
            </div>
          </InteractiveCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

const ActiveConsultationsTab = ({ onFinishConsultation }) => {
  const [activeConsultations, setActiveConsultations] = useState([]);

  useEffect(() => {
    fetchActiveConsultations();
  }, []);

  const fetchActiveConsultations = async () => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      };
      
      // Get in-progress consultations from the consultation queue
      const response = await axios.get('/queues/api/queue', config);
      console.log('All queue data for active consultations:', JSON.stringify(response.data, null, 2));
      const inProgressConsultations = response.data.filter(queue => queue.status === 'in_consultation');
      console.log('Filtered in_consultation patients:', JSON.stringify(inProgressConsultations, null, 2));
      setActiveConsultations(inProgressConsultations);
    } catch (error) {
      console.error('Failed to fetch active consultations:', error);
    }
  };

  const endConsultation = async (queueId) => {
    try {
      await onFinishConsultation(queueId);
      fetchActiveConsultations();
    } catch (error) {
      console.error('Failed to end consultation:', error);
    }
  };

  return (
    <div>
      <div className="section-title">
        <h3>Active Consultations ({activeConsultations.length})</h3>
      </div>

      {activeConsultations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-illustration">💬</div>
          <h3>No active consultations</h3>
          <p>Start a consultation from the patient queue.</p>
        </div>
      ) : (
        <div className="consultations-grid">
          {activeConsultations.map(consultation => (
            <InteractiveCard key={consultation.id} className="consultation-card">
              <div className="consultation-header">
                <h4>{consultation.patient_name || 'Unknown Patient'}</h4>
                <span className="consultation-duration">
                  {consultation.joined_at ? 
                    Math.floor((new Date() - new Date(consultation.joined_at)) / 60000) : 0} minutes
                </span>
              </div>
              <div className="consultation-details">
                <p><strong>Symptoms:</strong> {consultation.symptoms || 'No symptoms provided'}</p>
                <p><strong>Started:</strong> {consultation.joined_at ? 
                  new Date(consultation.joined_at).toLocaleTimeString() : 'Unknown'}</p>
                <p><strong>Status:</strong> {consultation.status}</p>
              </div>
              <div className="consultation-actions">
                <button
                  className="btn btn-success"
                  onClick={() => endConsultation(consultation.id)}
                >
                  ✅ Complete Consultation
                </button>
                <button className="btn btn-outline">
                  📝 Add Notes
                </button>
              </div>
            </InteractiveCard>
          ))}
        </div>
      )}
    </div>
  );
};

const PatientHistoryTab = ({ data }) => (
  <div>
    <div className="section-title">
      <h3>Recent Patients</h3>
    </div>

    <div className="patients-grid">
      {data.map(patient => (
        <InteractiveCard key={patient.id} className="patient-history-card">
          <div className="patient-info">
            <h4>{patient.name}</h4>
            <p className="patient-meta">
              Last visit: {new Date(patient.last_consultation).toLocaleDateString()}
            </p>
            <div className="consultation-summary">
              <p><strong>Last diagnosis:</strong> {patient.last_diagnosis}</p>
              <p><strong>Prescribed:</strong> {patient.last_prescription}</p>
            </div>
          </div>
          <div className="patient-stats">
            <div className="stat">
              <span className="stat-value">{patient.total_consultations}</span>
              <span className="stat-label">Total Visits</span>
            </div>
            <div className="stat">
              <span className="stat-value">{patient.health_score}</span>
              <span className="stat-label">Health Score</span>
            </div>
          </div>
        </InteractiveCard>
      ))}
    </div>
  </div>
);

const ScheduleTab = ({ data }) => (
  <div>
    <div className="section-title">
      <h3>Today's Schedule</h3>
    </div>

    <InteractiveCard title="Working Hours" className="schedule-card">
      <div className="schedule-info">
        <div className="schedule-item">
          <span className="schedule-label">Start Time:</span>
          <span className="schedule-value">{data.start_time || '9:00 AM'}</span>
        </div>
        <div className="schedule-item">
          <span className="schedule-label">End Time:</span>
          <span className="schedule-value">{data.end_time || '5:00 PM'}</span>
        </div>
        <div className="schedule-item">
          <span className="schedule-label">Break Time:</span>
          <span className="schedule-value">{data.break_time || '1:00 PM - 2:00 PM'}</span>
        </div>
        <div className="schedule-item">
          <span className="schedule-label">Specialization:</span>
          <span className="schedule-value">{data.specialization || 'General Medicine'}</span>
        </div>
      </div>
      
      <div className="schedule-actions">
        <button className="btn btn-outline">
          📅 Update Schedule
        </button>
        <button className="btn btn-outline">
          🚫 Mark Unavailable
        </button>
      </div>
    </InteractiveCard>

    <InteractiveCard title="Statistics" className="stats-card">
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-number">{data.consultations_today || 0}</span>
          <span className="stat-description">Consultations Today</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{data.avg_consultation_time || 0}m</span>
          <span className="stat-description">Avg Consultation Time</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{data.patient_satisfaction || 0}%</span>
          <span className="stat-description">Patient Satisfaction</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{data.total_patients_helped || 0}</span>
          <span className="stat-description">Total Patients Helped</span>
        </div>
      </div>
    </InteractiveCard>
  </div>
);

export default DoctorDashboard;
