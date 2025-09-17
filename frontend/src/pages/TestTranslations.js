import React from 'react';
import { useTranslation } from 'react-i18next';

const TestTranslations = () => {
  const { t, i18n } = useTranslation();

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h1>Translation Test Page</h1>
      <p>Current Language: <strong>{i18n.language}</strong></p>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Common Translations:</h2>
        <ul>
          <li>Loading: {t('common.loading')}</li>
          <li>Save: {t('common.save')}</li>
          <li>Cancel: {t('common.cancel')}</li>
          <li>Home: {t('navbar.home')}</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Medical Translations:</h2>
        <ul>
          <li>Doctor Dashboard: {t('doctor.dashboard.title')}</li>
          <li>Patient Queue: {t('doctor.dashboard.patientQueue')}</li>
          <li>Available: {t('doctor.status.available')}</li>
          <li>Emergency: {t('doctor.status.emergency')}</li>
          <li>Medical Consultation: {t('patient.consultation.title')}</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Common Symptoms Translations:</h2>
        <ul>
          <li>Common Symptoms: {t('common.commonSymptoms')}</li>
          <li>Fever: {t('common.fever')}</li>
          <li>Cough: {t('common.cough')}</li>
          <li>Headache: {t('common.headache')}</li>
          <li>Sore Throat: {t('common.soreThroat')}</li>
          <li>Body Ache: {t('common.bodyAche')}</li>
          <li>Fatigue: {t('common.fatigue')}</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Analysis Results Translations:</h2>
        <ul>
          <li>Possible Conditions: {t('common.possibleConditions')}</li>
          <li>Recommended Actions: {t('common.recommendedActions')}</li>
          <li>Suggested Specialists: {t('common.suggestedSpecialists')}</li>
          <li>Book Consultation: {t('common.bookConsultation')}</li>
          <li>Emergency Help: {t('common.emergencyHelp')}</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h2>Home Page:</h2>
        <ul>
          <li>Title: {t('home.title')}</li>
          <li>Description: {t('home.description')}</li>
        </ul>
      </div>
    </div>
  );
};

export default TestTranslations;
