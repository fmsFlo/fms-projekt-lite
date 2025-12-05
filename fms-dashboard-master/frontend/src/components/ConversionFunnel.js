import React from 'react';
import './ConversionFunnel.css';

const ConversionFunnel = ({ data }) => {
  if (!data) {
    return null;
  }

  const {
    leadsCreated = 0,
    contacted = 0,
    reached = 0,
    meetingSet = 0,
    avgAttemptsToReach = 0,
    meetingRate = 0
  } = data;

  // Berechne Conversion Rates
  const contactedRate = leadsCreated > 0 
    ? Math.round((contacted / leadsCreated) * 100) 
    : 0;
  const reachedRate = contacted > 0 
    ? Math.round((reached / contacted) * 100) 
    : 0;
  const meetingRateFromReached = reached > 0 
    ? Math.round((Math.min(meetingSet, reached) / reached) * 100) 
    : 0;

  const steps = [
    { value: leadsCreated, rate: 100, label: 'Leads' },
    { value: contacted, rate: contactedRate, label: 'Kontaktiert' },
    { value: reached, rate: reachedRate, label: 'Erreicht' },
    { value: meetingSet, rate: meetingRateFromReached, label: 'Termine' }
  ];

  return (
    <div className="conversion-funnel-compact">
      <div className="funnel-header-compact">
        <span className="funnel-title">CONVERSION</span>
        <span className="funnel-metrics">
          Ø {avgAttemptsToReach} Versuche · {meetingRate}% Terminquote
        </span>
      </div>
      
      <div className="funnel-flow">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div className="funnel-step-compact">
              <div className="step-value-compact">{step.value}</div>
              <div className="step-label-compact">{step.label}</div>
              <div className="step-rate-compact">{step.rate}%</div>
            </div>
            {index < steps.length - 1 && (
              <div className="funnel-arrow">→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ConversionFunnel;
