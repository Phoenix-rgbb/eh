import React, { useState, useEffect, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import { getHealthRecordsOffline, saveHealthRecordOffline } from '../utils/offlineStorage';
import axios from 'axios';

const HealthRecords = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    fetchRecords();
    
    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const fetchRecords = async () => {
    try {
      if (navigator.onLine) {
        // Try to fetch from server
        const response = await axios.get('/records/my-records');
        setRecords(response.data);
        
        // Cache records offline for patients
        if (user?.role === 'patient') {
          const patientId = response.data[0]?.patient_id;
          if (patientId) {
            response.data.forEach(record => saveHealthRecordOffline(record));
          }
        }
      } else {
        // Load from offline storage
        if (user?.role === 'patient') {
          const patientId = parseInt(localStorage.getItem('patientId'));
          const offlineRecords = await getHealthRecordsOffline(patientId);
          setRecords(offlineRecords);
        }
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
      
      // Fallback to offline storage
      if (user?.role === 'patient') {
        try {
          const patientId = parseInt(localStorage.getItem('patientId'));
          const offlineRecords = await getHealthRecordsOffline(patientId);
          setRecords(offlineRecords);
        } catch (offlineError) {
          console.error('Failed to load offline records:', offlineError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(record => {
    const matchesSearch = searchTerm === '' || 
      record.symptoms?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filter === 'all' || 
      (filter === 'emergency' && record.is_emergency) ||
      (filter === 'recent' && new Date(record.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h1>{t('records.title')}</h1>
        <p>{t('records.subtitle')}</p>
        {isOffline && (
          <div className="alert alert-warning">
            You are offline. Showing cached records. Some recent records may not be available.
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <Card style={{ marginBottom: '2rem' }}>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">{t('common.search')}</label>
            <input
              type="text"
              className="form-control"
              placeholder={t('common.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t('common.filter')}</label>
            <select
              className="form-control form-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">{t('records.recordTypes.all')}</option>
              <option value="recent">Recent (30 days)</option>
              <option value="emergency">{t('navbar.emergency')}</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Records Summary */}
      <div className="grid grid-3" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('records.title')}</span>
            <span style={{ fontSize: '1.5rem' }}>📋</span>
          </div>
          <div className="widget-value">{records.length}</div>
        </div>
        
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('navbar.emergency')}</span>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
          </div>
          <div className="widget-value">{records.filter(r => r.is_emergency).length}</div>
        </div>
        
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('records.date')}</span>
            <span style={{ fontSize: '1.5rem' }}>📅</span>
          </div>
          <div className="widget-value" style={{ fontSize: '1rem' }}>
            {records.length > 0 ? formatDate(records[0].created_at).split(',')[0] : t('messages.noDataFound')}
          </div>
        </div>
      </div>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h3>{t('messages.noDataFound')}</h3>
            <p>No health records match your search criteria.</p>
          </div>
        </Card>
      ) : (
        <div>
          {filteredRecords.map((record, index) => (
            <Card key={record.id || index} style={{ marginBottom: '1rem' }}>
              <div className="record-item">
                <div className="record-date">
                  {formatDate(record.created_at)}
                  {record.is_emergency && (
                    <span className="priority priority-emergency" style={{ marginLeft: '1rem' }}>
                      Emergency
                    </span>
                  )}
                  {!record.synced && (
                    <span style={{ 
                      marginLeft: '1rem', 
                      color: '#856404', 
                      fontSize: '0.8rem',
                      backgroundColor: '#fff3cd',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px'
                    }}>
                      Offline
                    </span>
                  )}
                </div>
                
                {user?.role !== 'patient' && (
                  <div className="record-doctor">
                    Doctor: Dr. {record.doctor?.user?.name || 'Unknown'} 
                    ({record.doctor?.specialization || 'General'})
                  </div>
                )}
                
                <div className="record-symptoms">
                  <strong>Symptoms:</strong> {record.symptoms}
                </div>
                
                {record.diagnosis && (
                  <div className="record-diagnosis">
                    <strong>Diagnosis:</strong> {record.diagnosis}
                  </div>
                )}
                
                {record.prescriptions && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Prescriptions:</strong>
                    <div style={{ 
                      backgroundColor: '#e7f3ff', 
                      padding: '0.75rem', 
                      borderRadius: '5px',
                      marginTop: '0.25rem'
                    }}>
                      {record.prescriptions}
                    </div>
                  </div>
                )}
                
                {record.notes && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong>Notes:</strong>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '0.75rem', 
                      borderRadius: '5px',
                      marginTop: '0.25rem'
                    }}>
                      {record.notes}
                    </div>
                  </div>
                )}
                
                {record.follow_up_date && (
                  <div style={{ marginTop: '0.5rem', color: '#856404' }}>
                    <strong>Follow-up:</strong> {formatDate(record.follow_up_date)}
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Export Options */}
      <Card style={{ marginTop: '2rem' }}>
        <CardHeader>
          <CardTitle>Export Records</CardTitle>
          <CardSubtitle>Download your health records for offline access</CardSubtitle>
        </CardHeader>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => exportRecords('pdf')}
          >
            📄 Export as PDF
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => exportRecords('csv')}
          >
            📊 Export as CSV
          </button>
        </div>
      </Card>
    </div>
  );
};

const exportRecords = (format) => {
  // This is a placeholder for export functionality
  // In production, you would implement actual PDF/CSV generation
  alert(`Export as ${format.toUpperCase()} functionality would be implemented here`);
};

export default HealthRecords;
