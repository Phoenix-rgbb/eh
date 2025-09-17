import React from 'react';

const Card = ({ children, className = '', onClick, hover = true }) => {
  const cardClass = `card ${className} ${hover ? 'card-hover' : ''}`;
  
  return (
    <div className={cardClass} onClick={onClick}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => (
  <div className={`card-header ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }) => (
  <h3 className={`card-title ${className}`}>
    {children}
  </h3>
);

export const CardSubtitle = ({ children, className = '' }) => (
  <p className={`card-subtitle ${className}`}>
    {children}
  </p>
);

export const CardBody = ({ children, className = '' }) => (
  <div className={`card-body ${className}`}>
    {children}
  </div>
);

export default Card;
