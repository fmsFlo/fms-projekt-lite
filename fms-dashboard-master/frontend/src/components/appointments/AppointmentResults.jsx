import React from 'react';
import './AppointmentResults.css';

const AppointmentResults = ({ data }) => {
  if (!data || !data.results) {
    return (
      <div className="appointment-results">
        <h2 className="section-title">ERGEBNISSE (Stattgefunden)</h2>
        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
          Keine Ergebnisse verfügbar
        </div>
      </div>
    );
  }

  const { results } = data;

  const resultItems = [
    { label: 'Abschluss', value: results.abschluss || 0, color: '#0ea66e' },
    { label: 'Bedenkzeit', value: results.bedenkzeit || 0, color: '#e3a008' },
    { label: 'Kein Interesse', value: results.keinInteresse || 0, color: '#dc2626' },
    { label: 'Follow-up', value: results.followUp || 0, color: '#4a90e2' }
  ];

  return (
    <div className="appointment-results">
      <h2 className="section-title">ERGEBNISSE (Stattgefunden)</h2>
      <div className="results-list">
        {resultItems.map((item, index) => (
          <div key={index} className="result-item">
            <div className="result-label">{item.label}:</div>
            <div className="result-value" style={{ color: item.color }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentResults;

