import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import axios from 'axios';

const Home = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const responses = await Promise.allSettled([
        axios.get('/doctors/available'),
        axios.get('/emergency/doctors/on-duty'),
        axios.get('/queues/waiting'),
        axios.get('/pharmacy/low-stock')
      ]);

      setStats({
        availableDoctors: responses[0].status === 'fulfilled' ? responses[0].value.data.length : 0,
        emergencyDoctors: responses[1].status === 'fulfilled' ? responses[1].value.data.length : 0,
        waitingQueue: responses[2].status === 'fulfilled' ? responses[2].value.data.length : 0,
        lowStockMedicines: responses[3].status === 'fulfilled' ? responses[3].value.data.length : 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    return t('home.title');
  };

  const getQuickActions = () => {
    const actions = {
      patient: [
        { title: t('patient.consultation.title'), desc: t('patient.consultation.subtitle'), icon: '👨‍⚕️', link: '/consultation', color: 'primary' },
        { title: 'Check Symptoms', desc: 'AI-powered symptom analysis', icon: '🔍', link: '/symptom-checker', color: 'info' },
        { title: t('navbar.records'), desc: t('records.subtitle'), icon: '📋', link: '/health-records', color: 'secondary' },
        { title: t('navbar.emergency'), desc: t('emergency.subtitle'), icon: '🚨', link: '/emergency', color: 'danger' }
      ],
      doctor: [
        { title: t('navbar.queue'), desc: t('doctor.dashboard.waitingPatients'), icon: '👥', link: '/consultation', color: 'primary' },
        { title: t('navbar.records'), desc: 'Access patient medical histories', icon: '📋', link: '/health-records', color: 'secondary' },
        { title: t('navbar.emergency'), desc: 'View emergency cases', icon: '🚨', link: '/emergency', color: 'danger' },
        { title: t('navbar.pharmacy'), desc: 'Check medicine availability', icon: '💊', link: '/pharmacy', color: 'success' }
      ],
      admin: [
        { title: t('navbar.dashboard'), desc: t('admin.systemHealth'), icon: '📊', link: '/admin', color: 'primary' },
        { title: t('admin.doctors'), desc: 'Doctor availability and assignments', icon: '👨‍⚕️', link: '/admin', color: 'info' },
        { title: t('navbar.pharmacy'), desc: 'Medicine inventory and alerts', icon: '💊', link: '/pharmacy', color: 'success' },
        { title: t('navbar.emergency'), desc: 'Monitor emergency situations', icon: '🚨', link: '/emergency', color: 'danger' }
      ],
      gov_official: [
        { title: t('admin.analytics'), desc: 'Population health insights', icon: '📈', link: '/admin', color: 'primary' },
        { title: 'Outbreak Monitoring', desc: 'Disease outbreak tracking', icon: '⚠️', link: '/admin', color: 'warning' },
        { title: 'Resource Planning', desc: 'Healthcare resource allocation', icon: '🏥', link: '/admin', color: 'info' },
        { title: t('navbar.emergency'), desc: 'Emergency response coordination', icon: '🚨', link: '/emergency', color: 'danger' }
      ]
    };

    return actions[user?.role] || actions.patient;
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
      {/* Welcome Section */}
      <div style={{ marginBottom: '2rem' }}>
        <h1>{getWelcomeMessage()}</h1>
        <p style={{ color: '#666', fontSize: '1.1rem' }}>
          {t('home.description')}
        </p>
      </div>

      {/* System Status */}
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('patient.consultation.availableDoctors')}</span>
            <span style={{ fontSize: '1.5rem' }}>👨‍⚕️</span>
          </div>
          <div className="widget-value">{stats.availableDoctors}</div>
          <div className="widget-change change-positive">{t('patient.consultation.doctorsOnline')}</div>
        </div>

        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('emergency.title')}</span>
            <span style={{ fontSize: '1.5rem' }}>🚨</span>
          </div>
          <div className="widget-value">{stats.emergencyDoctors}</div>
          <div className="widget-change change-positive">On duty</div>
        </div>

        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('patient.consultation.currentQueue')}</span>
            <span style={{ fontSize: '1.5rem' }}>⏱️</span>
          </div>
          <div className="widget-value">{stats.waitingQueue}</div>
          <div className="widget-change">{t('patient.consultation.patientsWaiting')}</div>
        </div>

        <div className="dashboard-widget">
          <div className="widget-header">
            <span className="widget-title">{t('pharmacy.title')}</span>
            <span style={{ fontSize: '1.5rem' }}>💊</span>
          </div>
          <div className="widget-value">{stats.lowStockMedicines}</div>
          <div className="widget-change change-negative">{t('pharmacy.outOfStock')}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>{t('home.getStarted')}</h2>
        <div className="grid grid-2">
          {getQuickActions().map((action, index) => (
            <Card key={index}>
              <Link to={action.link} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '2rem' }}>{action.icon}</div>
                  <div style={{ flex: 1 }}>
                    <CardTitle>{action.title}</CardTitle>
                    <CardSubtitle>{action.desc}</CardSubtitle>
                  </div>
                  <div className={`btn btn-${action.color}`} style={{ padding: '0.5rem 1rem' }}>
                    Go →
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Health Tips */}
      <Card>
        <CardHeader>
          <CardTitle>🌟 Health Tips for Rural Communities</CardTitle>
        </CardHeader>
        <div className="grid grid-3">
          <div>
            <h4>💧 Stay Hydrated</h4>
            <p>Drink clean, boiled water regularly. Aim for 8-10 glasses daily, especially during hot weather.</p>
          </div>
          <div>
            <h4>🥗 Balanced Diet</h4>
            <p>Include local fruits, vegetables, and grains in your diet. Maintain proper nutrition for better immunity.</p>
          </div>
          <div>
            <h4>🧼 Hand Hygiene</h4>
            <p>Wash hands frequently with soap and water, especially before meals and after using the restroom.</p>
          </div>
          <div>
            <h4>😴 Adequate Sleep</h4>
            <p>Get 7-8 hours of quality sleep daily. Good rest is essential for physical and mental health.</p>
          </div>
          <div>
            <h4>🏃‍♂️ Regular Exercise</h4>
            <p>Engage in daily physical activities like walking, farming, or traditional exercises to stay fit.</p>
          </div>
          <div>
            <h4>🩺 Regular Checkups</h4>
            <p>Schedule routine health checkups and don't ignore persistent symptoms or health concerns.</p>
          </div>
        </div>
      </Card>

      {/* Emergency Contact */}
      <Card style={{ marginTop: '2rem', backgroundColor: '#fff3cd', border: '1px solid #ffeaa7' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '2rem' }}>🚨</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, color: '#856404' }}>Emergency Contact</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#856404' }}>
              For medical emergencies, call: <strong>+91-XXX-XXXX-XXXX</strong> or use the Emergency button above
            </p>
          </div>
          <Link to="/emergency" className="btn btn-danger">
            Emergency Help
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default Home;
