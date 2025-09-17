import React, { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import LanguageSwitcher from './LanguageSwitcher';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { t } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const getNavItems = () => {
    const commonItems = [
      { path: '/', label: t('navbar.home'), icon: '🏠' },
      { path: '/health-records', label: t('navbar.records'), icon: '📋' },
      { path: '/pharmacy', label: t('navbar.pharmacy'), icon: '💊' },
      { path: '/emergency', label: t('navbar.emergency'), icon: '🚨' }
    ];

    const roleSpecificItems = {
      patient: [
        { path: '/consultation', label: t('navbar.consultation'), icon: '👨‍⚕️' },
        { path: '/symptom-checker', label: t('common.symptoms'), icon: '🔍' },
        { path: '/ai-symptom-checker', label: `AI ${t('common.symptoms')}`, icon: '🤖' }
      ],
      doctor: [
        { path: '/consultation', label: t('navbar.queue'), icon: '👥' },
        { path: '/doctor-dashboard', label: t('navbar.dashboard'), icon: '📊' }
      ],
      admin: [
        { path: '/admin-dashboard', label: t('navbar.admin'), icon: '⚙️' }
      ],
      gov_official: [
        { path: '/admin-dashboard', label: t('navbar.dashboard'), icon: '📊' }
      ]
    };

    return [...commonItems, ...(roleSpecificItems[user?.role] || [])];
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container">
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <span>🏥</span>
          <span>{t('navbar.brand')}</span>
        </Link>
        
        {/* Mobile menu button */}
        <button 
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <div className={`navbar-nav-container ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <ul className="navbar-nav">
            {getNavItems().map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path} 
                  className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={closeMobileMenu}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="navbar-user">
            {user && (
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </div>
            )}
            <div className="user-actions">
              <LanguageSwitcher />
              <Link to="/profile" className="btn btn-outline" onClick={closeMobileMenu}>
                {t('navbar.profile')}
              </Link>
              <button onClick={() => { logout(); closeMobileMenu(); }} className="btn-logout">
                {t('navbar.logout')}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu overlay */}
        {isMobileMenuOpen && (
          <div className="mobile-menu-overlay" onClick={closeMobileMenu}></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
