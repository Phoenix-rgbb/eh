import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' }
  ];

  const changeLanguage = (languageCode) => {
    i18n.changeLanguage(languageCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'inherit',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          transition: 'all 0.2s ease',
          fontSize: '0.9rem'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.borderColor = 'rgba(255,255,255,0.2)';
        }}
      >
        <span>{currentLanguage.flag}</span>
        <span>{currentLanguage.nativeName}</span>
        <span style={{ 
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>▼</span>
      </button>
      
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: '0',
          zIndex: 1000,
          minWidth: '180px',
          padding: '0.5rem 0',
          marginTop: '0.25rem',
          backgroundColor: '#fff',
          border: '1px solid rgba(0,0,0,.15)',
          borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,.15)',
          animation: 'fadeIn 0.15s ease-out'
        }}>
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => changeLanguage(language.code)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '0.75rem 1rem',
                border: 'none',
                background: i18n.language === language.code ? '#f0f8ff' : 'transparent',
                color: i18n.language === language.code ? '#0066cc' : '#333',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => {
                if (i18n.language !== language.code) {
                  e.target.style.backgroundColor = '#f8f9fa';
                }
              }}
              onMouseLeave={(e) => {
                if (i18n.language !== language.code) {
                  e.target.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.2rem' }}>{language.flag}</span>
                <div>
                  <div style={{ fontWeight: i18n.language === language.code ? '600' : '400' }}>
                    {language.name}
                  </div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>
                    {language.nativeName}
                  </div>
                </div>
              </div>
              {i18n.language === language.code && (
                <span style={{ color: '#0066cc', fontSize: '1rem' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
      
      {isOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
          onClick={() => setIsOpen(false)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { 
            opacity: 0; 
            transform: translateY(-8px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
      `}</style>
    </div>
  );
};

export default LanguageSwitcher;
