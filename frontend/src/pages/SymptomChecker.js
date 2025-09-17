import React, { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthContext } from '../App';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import axios from 'axios';

const SymptomChecker = () => {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [symptoms, setSymptoms] = useState(['']);
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState(1);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState('');

  const addSymptom = () => {
    setSymptoms([...symptoms, '']);
  };

  const removeSymptom = (index) => {
    if (symptoms.length > 1) {
      setSymptoms(symptoms.filter((_, i) => i !== index));
    }
  };

  const updateSymptom = (index, value) => {
    const newSymptoms = [...symptoms];
    newSymptoms[index] = value;
    setSymptoms(newSymptoms);
  };

  const analyzeSymptoms = async (e) => {
    e.preventDefault();
    
    const validSymptoms = symptoms.filter(s => s.trim() !== '');
    if (validSymptoms.length === 0) {
      alert('Please enter at least one symptom');
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        patient_id: user?.role === 'patient' ? 
          parseInt(localStorage.getItem('patientId')) : 
          parseInt(patientId),
        symptoms: validSymptoms,
        duration,
        severity
      };

      const response = await axios.post('/ai/analyze-symptoms', requestData);
      setAnalysis(response.data);
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
      alert('Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyColor = (level) => {
    switch (level) {
      case 4: return '#dc3545';
      case 3: return '#fd7e14';
      case 2: return '#ffc107';
      default: return '#28a745';
    }
  };

  const getUrgencyText = (level) => {
    switch (level) {
      case 4: return 'Emergency - Seek immediate care';
      case 3: return 'Urgent - See doctor within 24 hours';
      case 2: return 'Moderate - Schedule appointment soon';
      default: return 'Low - Monitor symptoms';
    }
  };

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1>{t('patient.symptomChecker.title')}</h1>
        <p>{t('patient.symptomChecker.subtitle')}</p>
        <div className="alert alert-info">
          <strong>{t('common.disclaimer')}:</strong> {t('common.disclaimerText')}
        </div>
      </div>

      <div className="grid grid-2">
        {/* Symptom Input Form */}
        <Card>
          <CardHeader>
            <CardTitle>{t('patient.symptomChecker.describeSymptoms')}</CardTitle>
            <CardSubtitle>{t('patient.symptomChecker.enterForAnalysis')}</CardSubtitle>
          </CardHeader>
          
          <form onSubmit={analyzeSymptoms}>
            {user?.role !== 'patient' && (
              <div className="form-group">
                <label className="form-label">{t('patient.symptomChecker.patientId')} *</label>
                <input
                  type="number"
                  className="form-control"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  placeholder={t('patient.symptomChecker.enterPatientId')}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{t('common.symptoms')} *</label>
              {symptoms.map((symptom, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    type="text"
                    className="form-control"
                    value={symptom}
                    onChange={(e) => updateSymptom(index, e.target.value)}
                    placeholder={`${t('common.symptoms')} ${index + 1}`}
                    required={index === 0}
                  />
                  {symptoms.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeSymptom(index)}
                      className="btn btn-danger"
                      style={{ padding: '0.5rem' }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addSymptom} className="btn btn-outline btn-sm">
                {t('buttons.addAnother')} {t('common.symptoms')}
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">{t('common.duration')}</label>
              <select
                className="form-control form-select"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="">{t('common.selectDuration')}</option>
                <option value="less-than-1-day">{t('common.lessThan1Day')}</option>
                <option value="1-3-days">{t('common.1to3Days')}</option>
                <option value="4-7-days">{t('common.4to7Days')}</option>
                <option value="1-2-weeks">{t('common.1to2Weeks')}</option>
                <option value="more-than-2-weeks">{t('common.moreThan2Weeks')}</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">{t('common.severity')} (1-5)</label>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={severity}
                  onChange={(e) => setSeverity(parseInt(e.target.value))}
                  style={{ flex: 1 }}
                />
                <span style={{ minWidth: '100px' }}>
                  {severity === 1 ? t('common.mild') :
                   severity === 2 ? t('common.moderate') :
                   severity === 3 ? t('common.concerning') :
                   severity === 4 ? t('common.severe') : t('common.critical')}
                </span>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? t('common.analyzing') : `${t('buttons.analyze')} ${t('common.symptoms')}`}
            </button>
          </form>
        </Card>

        {/* Analysis Results */}
        <Card>
          <CardHeader>
            <CardTitle>{t('common.analysisResults')}</CardTitle>
            <CardSubtitle>{t('common.aiPoweredInsights')}</CardSubtitle>
          </CardHeader>
          
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
              <p>Analyzing your symptoms...</p>
            </div>
          )}

          {!loading && !analysis && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              <h3>{t('common.noAnalysis')}</h3>
              <p>{t('common.enterSymptoms')}</p>
            </div>
          )}

          {analysis && (
            <div>
              {/* Urgency Level */}
              <div style={{ 
                padding: '1rem', 
                borderRadius: '8px', 
                backgroundColor: getUrgencyColor(analysis.urgency_level) + '20',
                border: `2px solid ${getUrgencyColor(analysis.urgency_level)}`,
                marginBottom: '1.5rem'
              }}>
                <h4 style={{ color: getUrgencyColor(analysis.urgency_level), margin: 0 }}>
                  {getUrgencyText(analysis.urgency_level)}
                </h4>
              </div>

              {/* Possible Conditions */}
              {analysis.possible_conditions && analysis.possible_conditions.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>{t('common.possibleConditions')}</h4>
                  {analysis.possible_conditions.map((condition, index) => (
                    <div key={index} style={{ 
                      padding: '0.75rem', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '5px',
                      marginBottom: '0.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span>{condition.name}</span>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#666',
                        backgroundColor: '#e9ecef',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '12px'
                      }}>
                        {Math.round(condition.probability * 100)}% {t('common.match')}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Actions */}
              {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4>{t('common.recommendedActions')}</h4>
                  <ul style={{ paddingLeft: '1.5rem' }}>
                    {analysis.recommended_actions.map((action, index) => (
                      <li key={index} style={{ marginBottom: '0.5rem' }}>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Suggested Specialists */}
              {analysis.suggested_specialists && analysis.suggested_specialists.length > 0 && (
                <div>
                  <h4>{t('common.suggestedSpecialists')}</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {analysis.suggested_specialists.map((specialist, index) => (
                      <span key={index} style={{
                        backgroundColor: '#667eea',
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem'
                      }}>
                        {specialist}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => window.location.href = '/consultation'}
                >
                  {t('common.bookConsultation')}
                </button>
                {analysis.urgency_level >= 3 && (
                  <button 
                    className="btn btn-danger"
                    onClick={() => window.location.href = '/emergency'}
                  >
                    {t('common.emergencyHelp')}
                  </button>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Common Symptoms Quick Check */}
      <Card style={{ marginTop: '2rem' }}>
        <CardHeader>
          <CardTitle>{t('patient.symptomChecker.quickSymptomCheck.title')}</CardTitle>
          <CardSubtitle>{t('patient.symptomChecker.quickSymptomCheck.subtitle')}</CardSubtitle>
        </CardHeader>
        
        <div className="grid grid-4">
          {[
            { key: 'fever', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.fever') },
            { key: 'headache', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.headache') },
            { key: 'cough', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.cough') },
            { key: 'soreThroat', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.soreThroat') },
            { key: 'nausea', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.nausea') },
            { key: 'vomiting', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.vomiting') },
            { key: 'diarrhea', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.diarrhea') },
            { key: 'fatigue', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.fatigue') },
            { key: 'chestPain', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.chestPain') },
            { key: 'shortnessOfBreath', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.shortnessOfBreath') },
            { key: 'dizziness', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.dizziness') },
            { key: 'abdominalPain', label: t('patient.symptomChecker.quickSymptomCheck.symptoms.abdominalPain') }
          ].map((symptom) => (
            <button
              key={symptom.key}
              className="btn btn-outline"
              onClick={() => {
                if (!symptoms.includes(symptom.label)) {
                  const emptyIndex = symptoms.findIndex(s => s === '');
                  if (emptyIndex !== -1) {
                    updateSymptom(emptyIndex, symptom.label);
                  } else {
                    setSymptoms([...symptoms, symptom.label]);
                  }
                }
              }}
              style={{ margin: '0.25rem' }}
            >
              {symptom.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Health Tips */}
      <Card style={{ marginTop: '2rem' }}>
        <CardHeader>
          <CardTitle>{t('patient.symptomChecker.healthTips.title')}</CardTitle>
        </CardHeader>
        
        <div className="grid grid-2">
          <div>
            <h4>{t('patient.symptomChecker.healthTips.emergencySection.title')}</h4>
            <ul>
              {t('patient.symptomChecker.healthTips.emergencySection.tips', { returnObjects: true }).map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4>{t('patient.symptomChecker.healthTips.doctorSection.title')}</h4>
            <ul>
              {t('patient.symptomChecker.healthTips.doctorSection.tips', { returnObjects: true }).map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SymptomChecker;
