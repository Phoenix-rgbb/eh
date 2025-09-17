import React from 'react';
import './InteractiveCard.css';

const InteractiveCard = ({ title, value, confidence, interactive }) => {
    const getRiskColor = (riskLevel) => {
        switch (riskLevel?.toLowerCase()) {
            case 'critical': return '#e74c3c';
            case 'high': return '#f39c12';
            case 'moderate': return '#f1c40f';
            case 'low': return '#2ecc71';
            default: return '#bdc3c7';
        }
    };

    const riskColor = getRiskColor(value);

    return (
        <div className={`interactive-card ${interactive ? 'interactive' : ''}`}>
            <div className="card-content">
                <h3 className="card-title">{title}</h3>
                <div className="card-value" style={{ color: riskColor }}>
                    {value || 'N/A'}
                </div>
                {confidence && (
                    <div className="card-confidence">
                        Confidence: {Math.round(confidence * 100)}%
                    </div>
                )}
            </div>
            <div className="card-background" style={{ backgroundColor: riskColor }}></div>
        </div>
    );
};

export default InteractiveCard;
