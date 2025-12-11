import React from 'react';
import './DurationStats.css';

const DurationStats = ({ data, formatDuration, compact = false }) => {
  if (!data) {
    return (
      <div className="duration-stats">
        <p style={{ color: 'rgba(255, 255, 255, 0.4)', textAlign: 'center', padding: '2rem' }}>
          Keine Daten verfügbar
        </p>
      </div>
    );
  }

  if (compact) {
    const metrics = [
      {
        icon: '📞',
        value: formatDuration(data.total_duration),
        label: 'GESAMT'
      },
      {
        icon: '⏱️',
        value: formatDuration(data.avg_duration),
        label: 'Ø GESPRÄCH'
      },
      {
        icon: '📊',
        value: data.total_calls,
        label: 'GESPRÄCHE'
      },
      {
        icon: '🎯',
        value: formatDuration(data.avg_per_appointment),
        label: 'TERMIN'
      }
    ];

    return (
      <div className="duration-compact">
        <div className="duration-header-compact">
          <span className="duration-title-compact">GESPRÄCHSZEITEN</span>
        </div>
        <div className="duration-grid-compact">
          {metrics.map((metric, index) => (
            <div key={index} className="duration-metric-compact">
              <div className="duration-header-metric-compact">
                <span className="duration-icon-compact">{metric.icon}</span>
                <span className="duration-value-compact">{metric.value}</span>
              </div>
              <div className="duration-label-compact">{metric.label}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Original full version
  return null;
};

export default DurationStats;
