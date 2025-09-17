import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle, CardBody } from '../components/Card';
import InteractiveCard from '../components/InteractiveCard';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    activeConsultations: 0,
    emergencyCases: 0,
    healthMetrics: [],
    outbreakAlerts: [],
    resourceAllocation: []
  });

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh every 30 seconds for real-time data
    const refreshInterval = setInterval(() => {
      if (activeTab === 'overview') {
        fetchDashboardData();
      }
    }, 30000);

    // Cleanup interval on component unmount
    return () => clearInterval(refreshInterval);
  }, [activeTab]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch real-time dashboard statistics
      const statsResponse = await axios.get('/admin/dashboard/stats');
      const realTimeStats = statsResponse.data;

      // Combine real-time data with static mock data for other sections
      const combinedData = {
        totalPatients: realTimeStats.totalPatients,
        totalDoctors: realTimeStats.totalDoctors,
        activeConsultations: realTimeStats.activeConsultations,
        emergencyCases: realTimeStats.emergencyCases,
        waitingQueue: realTimeStats.waitingQueue,
        recentActivities: realTimeStats.recentActivities || [],
        lastUpdated: realTimeStats.lastUpdated,
        healthMetrics: [
          { region: 'North District', population: 45000, diseases: ['Malaria', 'Dengue'], riskLevel: 'Medium' },
          { region: 'South District', population: 38000, diseases: ['Diabetes', 'Hypertension'], riskLevel: 'Low' },
          { region: 'East District', population: 52000, diseases: ['Respiratory Issues'], riskLevel: 'High' },
          { region: 'West District', population: 41000, diseases: ['Malnutrition'], riskLevel: 'Medium' }
        ],
        outbreakAlerts: [
          { id: 1, disease: 'Dengue Fever', location: 'East District', cases: 23, status: 'Active', severity: 'High' },
          { id: 2, disease: 'Malaria', location: 'North District', cases: 12, status: 'Monitoring', severity: 'Medium' },
          { id: 3, disease: 'Gastroenteritis', location: 'South District', cases: 8, status: 'Contained', severity: 'Low' }
        ],
        resourceAllocation: [
          { resource: 'Medical Staff', allocated: realTimeStats.totalDoctors, required: 100, efficiency: `${Math.round((realTimeStats.totalDoctors / 100) * 100)}%` },
          { resource: 'Hospital Beds', allocated: 120, required: 150, efficiency: '80%' },
          { resource: 'Medical Equipment', allocated: 75, required: 90, efficiency: '83%' },
          { resource: 'Ambulances', allocated: 12, required: 15, efficiency: '80%' },
          { resource: 'Medicine Stock', allocated: 90, required: 100, efficiency: '90%' }
        ]
      };
      
      setDashboardData(combinedData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Fallback to mock data if API fails
      const fallbackData = {
        totalPatients: 1247,
        totalDoctors: 23,
        activeConsultations: 15,
        emergencyCases: 3,
        waitingQueue: 8,
        recentActivities: [
          { type: 'info', message: 'Unable to fetch real-time data', timestamp: new Date().toISOString(), priority: 'warning' }
        ],
        healthMetrics: [
          { region: 'North District', population: 45000, diseases: ['Malaria', 'Dengue'], riskLevel: 'Medium' },
          { region: 'South District', population: 38000, diseases: ['Diabetes', 'Hypertension'], riskLevel: 'Low' },
          { region: 'East District', population: 52000, diseases: ['Respiratory Issues'], riskLevel: 'High' },
          { region: 'West District', population: 41000, diseases: ['Malnutrition'], riskLevel: 'Medium' }
        ],
        outbreakAlerts: [
          { id: 1, disease: 'Dengue Fever', location: 'East District', cases: 23, status: 'Active', severity: 'High' },
          { id: 2, disease: 'Malaria', location: 'North District', cases: 12, status: 'Monitoring', severity: 'Medium' },
          { id: 3, disease: 'Gastroenteritis', location: 'South District', cases: 8, status: 'Contained', severity: 'Low' }
        ],
        resourceAllocation: [
          { resource: 'Medical Staff', allocated: 85, required: 100, efficiency: '85%' },
          { resource: 'Hospital Beds', allocated: 120, required: 150, efficiency: '80%' },
          { resource: 'Medical Equipment', allocated: 75, required: 90, efficiency: '83%' },
          { resource: 'Ambulances', allocated: 12, required: 15, efficiency: '80%' },
          { resource: 'Medicine Stock', allocated: 90, required: 100, efficiency: '90%' }
        ]
      };
      setDashboardData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  const handleOutbreakAction = (alertId, action) => {
    setDashboardData(prev => ({
      ...prev,
      outbreakAlerts: prev.outbreakAlerts.map(alert => 
        alert.id === alertId 
          ? { ...alert, status: action === 'escalate' ? 'Escalated' : 'Resolved' }
          : alert
      )
    }));
  };

  const handleResourceReallocation = (resource, newAllocation) => {
    setDashboardData(prev => ({
      ...prev,
      resourceAllocation: prev.resourceAllocation.map(item => 
        item.resource === resource 
          ? { ...item, allocated: newAllocation, efficiency: `${Math.round((newAllocation / item.required) * 100)}%` }
          : item
      )
    }));
  };

  const renderOverview = () => (
    <div className="stats-grid">
      <Card className="stat-card stat-primary">
        <CardBody>
          <CardTitle>Total Patients</CardTitle>
          <div className="stat-number">{dashboardData.totalPatients}</div>
          <CardSubtitle>Registered in system</CardSubtitle>
        </CardBody>
      </Card>
      <Card className="stat-card stat-success">
        <CardBody>
          <CardTitle>Active Doctors</CardTitle>
          <div className="stat-number">{dashboardData.totalDoctors}</div>
          <CardSubtitle>Currently available</CardSubtitle>
        </CardBody>
      </Card>
      <Card className="stat-card stat-warning">
        <CardBody>
          <CardTitle>Active Consultations</CardTitle>
          <div className="stat-number">{dashboardData.activeConsultations}</div>
          <CardSubtitle>In progress</CardSubtitle>
        </CardBody>
      </Card>
      <Card className="stat-card stat-danger">
        <CardBody>
          <CardTitle>Emergency Cases</CardTitle>
          <div className="stat-number">{dashboardData.emergencyCases}</div>
          <CardSubtitle>Requires attention</CardSubtitle>
        </CardBody>
      </Card>
      <Card className="stat-card stat-info">
        <CardBody>
          <CardTitle>Waiting Queue</CardTitle>
          <div className="stat-number">{dashboardData.waitingQueue || 0}</div>
          <CardSubtitle>Patients waiting</CardSubtitle>
        </CardBody>
      </Card>
    </div>
  );

  const renderHealthAnalytics = () => (
    <Card>
      <CardHeader>
        <CardTitle>Health Analytics</CardTitle>
        <CardSubtitle>Population Health Insights</CardSubtitle>
      </CardHeader>
      <CardBody>
        <div className="analytics-grid">
          {dashboardData.healthMetrics.map((metric, index) => (
            <Card key={index} className="analytics-card">
              <CardBody>
                <div className="card-header-flex">
                  <CardTitle>{metric.region}</CardTitle>
                  <span className={`badge ${
                    metric.riskLevel === 'High' ? 'badge-danger' :
                    metric.riskLevel === 'Medium' ? 'badge-warning' :
                    'badge-success'
                  }`}>
                    {metric.riskLevel} Risk
                  </span>
                </div>
                <p className="metric-info">Population: {metric.population.toLocaleString()}</p>
                <div className="diseases-section">
                  <p className="section-label">Common Health Issues:</p>
                  <div className="disease-tags">
                    {metric.diseases.map((disease, idx) => (
                      <span key={idx} className="tag tag-info">
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
                <button 
                  className="btn btn-primary btn-full"
                  onClick={() => alert(`Generating detailed health report for ${metric.region}...`)}
                >
                  Generate Health Report
                </button>
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  const renderOutbreakMonitoring = () => (
    <Card>
      <CardHeader>
        <CardTitle>Outbreak Monitoring</CardTitle>
        <CardSubtitle>Disease Outbreak Tracking</CardSubtitle>
      </CardHeader>
      <CardBody>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Disease</th>
                <th>Location</th>
                <th>Cases</th>
                <th>Status</th>
                <th>Severity</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData.outbreakAlerts.map((alert) => (
                <tr key={alert.id}>
                  <td className="font-medium">{alert.disease}</td>
                  <td>{alert.location}</td>
                  <td>{alert.cases}</td>
                  <td>
                    <span className={`badge ${
                      alert.status === 'Active' ? 'badge-danger' :
                      alert.status === 'Monitoring' ? 'badge-warning' :
                      alert.status === 'Contained' ? 'badge-success' :
                      'badge-info'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      alert.severity === 'High' ? 'badge-danger' :
                      alert.severity === 'Medium' ? 'badge-warning' :
                      'badge-success'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleOutbreakAction(alert.id, 'escalate')}
                      >
                        Escalate
                      </button>
                      <button 
                        className="btn btn-sm btn-success"
                        onClick={() => handleOutbreakAction(alert.id, 'resolve')}
                      >
                        Resolve
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );

  const renderResourcePlanning = () => (
    <Card>
      <CardHeader>
        <CardTitle>Resource Planning</CardTitle>
        <CardSubtitle>Healthcare Resource Allocation</CardSubtitle>
      </CardHeader>
      <CardBody>
        <div className="resource-grid">
          {dashboardData.resourceAllocation.map((resource, index) => (
            <Card key={index} className="resource-card">
              <CardBody>
                <div className="card-header-flex">
                  <CardTitle>{resource.resource}</CardTitle>
                  <span className={`badge ${
                    parseInt(resource.efficiency) >= 90 ? 'badge-success' :
                    parseInt(resource.efficiency) >= 80 ? 'badge-warning' :
                    'badge-danger'
                  }`}>
                    {resource.efficiency} Efficiency
                  </span>
                </div>
                <div className="resource-stats">
                  <div className="stat-row">
                    <span>Allocated: {resource.allocated}</span>
                    <span>Required: {resource.required}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className={`progress-fill ${
                        (resource.allocated / resource.required) >= 0.9 ? 'progress-success' :
                        (resource.allocated / resource.required) >= 0.8 ? 'progress-warning' :
                        'progress-danger'
                      }`}
                      style={{ width: `${Math.min((resource.allocated / resource.required) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <div className="form-group">
                  <div className="input-group">
                    <input 
                      type="number" 
                      className="form-control"
                      placeholder="New allocation"
                      min="0"
                      max={resource.required}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const newValue = parseInt(e.target.value);
                          if (newValue && newValue <= resource.required) {
                            handleResourceReallocation(resource.resource, newValue);
                            e.target.value = '';
                          }
                        }
                      }}
                    />
                    <button 
                      className="btn btn-primary"
                      onClick={(e) => {
                        const input = e.target.parentElement.querySelector('input');
                        const newValue = parseInt(input.value);
                        if (newValue && newValue <= resource.required) {
                          handleResourceReallocation(resource.resource, newValue);
                          input.value = '';
                        }
                      }}
                    >
                      Reallocate
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.name}</p>
      </div>

      {/* Navigation Tabs */}
      <div className="tab-navigation">
        <nav className="nav-tabs">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'analytics', label: 'Health Analytics' },
            { id: 'outbreaks', label: 'Outbreak Monitoring' },
            { id: 'resources', label: 'Resource Planning' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`nav-tab ${
                activeTab === tab.id ? 'nav-tab-active' : ''
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div>
            {renderOverview()}
            
            {/* Recent Activities Section */}
            {dashboardData.recentActivities && dashboardData.recentActivities.length > 0 && (
              <Card className="recent-activities-card">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="activities-list">
                    {dashboardData.recentActivities.map((activity, index) => (
                      <div key={index} className={`activity-item priority-${activity.priority}`}>
                        <div className="activity-content">
                          <span className="activity-message">{activity.message}</span>
                          <span className="activity-time">
                            {new Date(activity.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Last Updated Info */}
            {dashboardData.lastUpdated && (
              <div className="last-updated">
                <small>Last updated: {new Date(dashboardData.lastUpdated).toLocaleString()}</small>
                <button 
                  className="btn btn-sm btn-outline-primary refresh-btn"
                  onClick={fetchDashboardData}
                  disabled={loading}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'analytics' && renderHealthAnalytics()}
        {activeTab === 'outbreaks' && renderOutbreakMonitoring()}
        {activeTab === 'resources' && renderResourcePlanning()}
      </div>
    </div>
  );
};

export default AdminDashboard;
