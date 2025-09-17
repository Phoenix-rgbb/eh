import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../App';
import InteractiveCard from '../components/InteractiveCard';
import LoadingSpinner from '../components/LoadingSpinner';
import axios from 'axios';

const EnhancedHealthRecords = () => {
  const { user } = useContext(AuthContext);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordType, setRecordType] = useState('general');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchHealthRecords();
  }, []);

  const fetchHealthRecords = async () => {
    try {
      const response = await axios.get('/health-records/my-records');
      setRecords(response.data);
    } catch (error) {
      console.error('Error fetching health records:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    selectedFiles.forEach((file, index) => {
      formData.append(`files`, file);
    });
    formData.append('record_type', recordType);
    formData.append('description', description);

    try {
      const response = await axios.post('/health-records/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });

      alert('Files uploaded successfully!');
      setSelectedFiles([]);
      setDescription('');
      fetchHealthRecords();
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const downloadRecord = async (recordId, filename) => {
    try {
      const response = await axios.get(`/health-records/download/${recordId}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading record:', error);
      alert('Failed to download record');
    }
  };

  const deleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      await axios.delete(`/health-records/${recordId}`);
      alert('Record deleted successfully');
      fetchHealthRecords();
    } catch (error) {
      console.error('Error deleting record:', error);
      alert('Failed to delete record');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your health records..." />;
  }

  return (
    <div className="container">
      <div className="main-content">
        <h1 className="page-title">Health Records</h1>
        
        {/* Upload Section */}
        <InteractiveCard
          title="Upload Health Records"
          subtitle="Upload your medical documents, test reports, and prescriptions"
          className="upload-section fade-in"
        >
          <div className="upload-form">
            <div className="form-group">
              <label className="form-label">Record Type</label>
              <select
                className="form-control form-select"
                value={recordType}
                onChange={(e) => setRecordType(e.target.value)}
              >
                <option value="general">General Medical Record</option>
                <option value="lab_report">Lab Report</option>
                <option value="prescription">Prescription</option>
                <option value="xray">X-Ray/Imaging</option>
                <option value="vaccination">Vaccination Record</option>
                <option value="discharge_summary">Discharge Summary</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-control"
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the records..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Files</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileSelect}
                  className="file-input"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="file-upload-label">
                  <span className="upload-icon">📁</span>
                  <span>Choose Files or Drag & Drop</span>
                  <small>PDF, Images, Word documents (Max 10MB each)</small>
                </label>
              </div>
              
              {selectedFiles.length > 0 && (
                <div className="selected-files">
                  <h4>Selected Files:</h4>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}% uploaded</span>
              </div>
            )}

            <button
              className="btn btn-primary btn-large"
              onClick={uploadFiles}
              disabled={uploading || selectedFiles.length === 0}
            >
              {uploading ? 'Uploading...' : 'Upload Records'}
            </button>
          </div>
        </InteractiveCard>

        {/* Records List */}
        <div className="records-section">
          <h2 className="section-title">Your Health Records</h2>
          
          {records.length === 0 ? (
            <InteractiveCard
              title="No Records Found"
              subtitle="Upload your first health record to get started"
              className="empty-state"
            >
              <div className="empty-illustration">📋</div>
            </InteractiveCard>
          ) : (
            <div className="records-grid">
              {records.map((record) => (
                <InteractiveCard
                  key={record.id}
                  title={record.filename}
                  subtitle={`${record.record_type} • ${new Date(record.upload_date).toLocaleDateString()}`}
                  className="record-card slide-in"
                  hoverable
                >
                  <div className="record-details">
                    {record.description && (
                      <p className="record-description">{record.description}</p>
                    )}
                    <div className="record-meta">
                      <span className="file-size">{(record.file_size / 1024 / 1024).toFixed(2)} MB</span>
                      <span className={`record-type type-${record.record_type}`}>
                        {record.record_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="record-actions">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => downloadRecord(record.id, record.filename)}
                    >
                      Download
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteRecord(record.id)}
                    >
                      Delete
                    </button>
                  </div>
                </InteractiveCard>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedHealthRecords;
