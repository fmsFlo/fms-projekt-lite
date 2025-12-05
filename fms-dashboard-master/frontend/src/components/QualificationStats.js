import React from 'react';
import './QualificationStats.css';

const QualificationStats = ({ data, compact = false }) => {
  if (!data) {
    return null;
  }

  const {
    totalReached = 0,
    activitiesFilled = 0,
    complianceRate = 0,
    qualifiedLeads = 0,
    meetingsBooked = 0,
    conversionRate = 0,
    avgBudget = 0,
    topReasons = []
  } = data;

  if (compact) {
    const metrics = [
      {
        icon: '✓',
        value: `${complianceRate}%`,
        label: 'COMPLIANCE',
        subtext: `${activitiesFilled} von ${totalReached} erreichten Calls`
      },
      {
        icon: '🎯',
        value: qualifiedLeads,
        label: 'QUALIF.',
        subtext: activitiesFilled > 0 
          ? `${Math.round((qualifiedLeads / activitiesFilled) * 100)}% der Activities`
          : 'Keine Activities'
      },
      {
        icon: '📅',
        value: `${conversionRate}%`,
        label: 'TERMIN',
        subtext: `${meetingsBooked} Erstgespräche gebucht`
      },
      {
        icon: '💶',
        value: avgBudget > 0 ? `€${avgBudget}` : 'N/A',
        label: 'Ø BUDGET',
        subtext: 'pro Monat'
      }
    ];

    return (
      <div className="qualification-compact">
        <div className="qualification-header-compact">
          <span className="qualification-title-compact">VORQUALIFIZIERUNG</span>
        </div>
        <div className="qualification-grid-compact">
          {metrics.map((metric, index) => (
            <div key={index} className="qualification-metric-compact">
              <div className="metric-header-compact">
                <span className="metric-icon-compact">{metric.icon}</span>
                <span className="metric-value-compact">{metric.value}</span>
              </div>
              <div className="metric-label-compact">{metric.label}</div>
              <div className="metric-subtext-compact">{metric.subtext}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Original full version (for backwards compatibility)
  return null;
};

export default QualificationStats;
