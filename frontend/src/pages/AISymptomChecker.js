import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import Card, { CardHeader, CardTitle, CardSubtitle } from '../components/Card';
import InteractiveCard from '../components/InteractiveCard';
import LoadingSpinner from '../components/LoadingSpinner';

const AISymptomChecker = () => {
    const { t } = useTranslation();
    const [symptoms, setSymptoms] = useState('');
    const [symptomDescription, setSymptomDescription] = useState('');
    const [patientAge, setPatientAge] = useState('');
    const [patientGender, setPatientGender] = useState('');
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getCommonSymptoms = () => [
        { key: "fever", label: t('common.fever') },
        { key: "cough", label: t('common.cough') },
        { key: "headache", label: t('common.headache') },
        { key: "soreThroat", label: t('common.soreThroat') },
        { key: "bodyAche", label: t('common.bodyAche') },
        { key: "fatigue", label: t('common.fatigue') },
        { key: "stomachPain", label: t('common.stomachPain') },
        { key: "nausea", label: t('common.nausea') },
        { key: "vomiting", label: t('common.vomiting') },
        { key: "diarrhea", label: t('common.diarrhea') },
        { key: "shortnessOfBreath", label: t('common.shortnessOfBreath') },
        { key: "rash", label: t('common.rash') }
    ];

    const handleSymptomClick = (symptomLabel) => {
        setSymptoms(prev => prev ? `${prev}, ${symptomLabel}` : symptomLabel);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setAnalysis(null);

        const symptomList = symptoms.split(',').map(s => s.trim()).filter(s => s);

        if (symptomList.length === 0) {
            setError("Please enter at least one symptom.");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/ai-symptom/analyze-symptoms', {
                symptoms: symptomList,
                symptom_description: symptomDescription,
                patient_age: patientAge ? parseInt(patientAge) : null,
                patient_gender: patientGender || null
            });
            setAnalysis(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || "An error occurred during analysis.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container" style={{ paddingTop: '2rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h1>🤖 {t('patient.symptomChecker.aiTitle')}</h1>
                <p style={{ fontSize: '1.2rem', color: '#666' }}>
                    {t('patient.symptomChecker.aiSubtitle')}
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('patient.symptomChecker.analysisForm')}</CardTitle>
                    <CardSubtitle>{t('patient.symptomChecker.enterForAnalysis')}</CardSubtitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-2" style={{ gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">{t('common.age')}</label>
                            <input
                                type="number"
                                className="form-control"
                                value={patientAge}
                                onChange={e => setPatientAge(e.target.value)}
                                placeholder="e.g., 35"
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">{t('common.gender')}</label>
                            <select
                                className="form-control"
                                value={patientGender}
                                onChange={e => setPatientGender(e.target.value)}
                            >
                                <option value="">{t('common.selectGender')}</option>
                                <option value="male">{t('common.male')}</option>
                                <option value="female">{t('common.female')}</option>
                                <option value="other">{t('common.other')}</option>
                            </select>
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">{t('common.symptoms')} *</label>
                        <input
                            type="text"
                            className="form-control"
                            value={symptoms}
                            onChange={e => setSymptoms(e.target.value)}
                            placeholder={`e.g., fever, headache, cough`}
                            required
                        />
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            <h5 style={{ width: '100%', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>{t('common.commonSymptoms')}:</h5>
                            {getCommonSymptoms().map(symptom => (
                                <button
                                    type="button"
                                    key={symptom.key}
                                    className="btn btn-outline"
                                    onClick={() => handleSymptomClick(symptom.label)}
                                    style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}
                                >
                                    {symptom.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group" style={{ marginTop: '1rem' }}>
                        <label className="form-label">Detailed Description</label>
                        <textarea
                            className="form-control"
                            rows="4"
                            value={symptomDescription}
                            onChange={e => setSymptomDescription(e.target.value)}
                            placeholder={`Describe your ${t('common.symptoms')} in detail, including when they started, severity, etc.`}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? t('common.analyzing') : `Get AI ${t('buttons.analyze')}`}
                    </button>
                </form>
            </Card>

            {error && <div className="alert alert-danger" style={{ marginTop: '2rem' }}>{error}</div>}

            {loading && !analysis && (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <LoadingSpinner />
                    <p style={{ textAlign: 'center', color: '#666', marginTop: '2rem' }}>
                        {t('common.enterSymptoms')}
                    </p>
                </div>
            )}

            {analysis && (
                <div style={{ marginTop: '3rem' }}>
                    <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontWeight: 'bold' }}>AI Analysis Report</h2>

                    <div className="grid grid-3" style={{ gap: '2rem' }}>
                        <InteractiveCard
                            title="Risk Level"
                            value={analysis.risk_level}
                            confidence={analysis.confidence}
                            interactive
                        />
                        <Card>
                            <CardHeader>
                                <CardTitle>Possible Conditions</CardTitle>
                            </CardHeader>
                            <ul>
                                {analysis.possible_conditions.map((cond, i) => <li key={i}>{cond}</li>)}
                            </ul>
                        </Card>
                        <Card>
                             <CardHeader>
                                <CardTitle>AI Insights</CardTitle>
                            </CardHeader>
                            <p>{analysis.ai_insights.contextual_analysis}</p>
                            <p><strong>Follow-up:</strong> {analysis.ai_insights.follow_up_timeline}</p>
                            {analysis.ai_insights.red_flags.length > 0 && 
                                <p><strong>Red Flags Detected:</strong> {analysis.ai_insights.red_flags.join(', ')}</p>
                            }
                        </Card>
                    </div>

                    <Card style={{ marginTop: '2rem' }}>
                        <CardHeader>
                            <CardTitle>Recommendations</CardTitle>
                        </CardHeader>
                        <ul>
                            {analysis.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                        </ul>
                    </Card>

                    <h3 style={{ marginTop: '3rem', marginBottom: '1.5rem', fontWeight: 'bold' }}>Similar Patient Cases</h3>
                    <div className="grid grid-3" style={{ gap: '1.5rem' }}>
                        {analysis.similar_cases.map(pCase => (
                            <Card key={pCase.case_id}>
                                <CardHeader>
                                    <CardTitle>Case: {pCase.case_id}</CardTitle>
                                    <CardSubtitle>{pCase.diagnosis}</CardSubtitle>
                                </CardHeader>
                                <p>
                                    <strong>Symptoms:</strong> {pCase.symptoms.join(', ')}
                                </p>
                                <p>
                                    <strong>Treatment:</strong> {pCase.treatment}
                                </p>
                                <div style={{
                                    borderLeft: '4px solid #007bff',
                                    paddingLeft: '1rem',
                                    marginTop: '1rem',
                                    fontStyle: 'italic'
                                }}>
                                    <p>"{pCase.doctor_quote}"</p>
                                    <small>- Dr. {pCase.doctor_name}</small>
                                </div>
                                <div style={{
                                    marginTop: '1rem',
                                    fontSize: '0.85rem',
                                    color: '#666'
                                }}>
                                    Similarity Score: {pCase.similarity_score.toFixed(2)}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AISymptomChecker;
