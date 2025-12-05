import React from 'react';
import './AppointmentOverview.css';

const AppointmentOverview = ({ data, type }) => {
  // Debug: Log data
  console.log('[AppointmentOverview] Received data:', data);
  console.log('[AppointmentOverview] Type:', type);
  console.log('[AppointmentOverview] Has summary?', !!data?.summary);
  
  if (!data || !data.summary) {
    console.log('[AppointmentOverview] Keine Daten oder summary fehlt');
    return (
      <div className="appointment-overview">
        <h2 className="section-title">OVERVIEW</h2>
        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
          Keine Daten verfügbar
        </div>
      </div>
    );
  }

  const { summary } = data;
  console.log('[AppointmentOverview] Summary:', summary);
  console.log('[AppointmentOverview] Total:', summary.total);
  const typeLabels = {
    erstgespraech: 'EG',
    konzept: 'Konzept',
    umsetzung: 'Umsetzung',
    service: 'Service'
  };

  const metrics = [
    {
      label: `${typeLabels[type]} Gebucht`,
      value: summary.total || 0,
      color: '#4a90e2'
    },
    {
      label: 'Stattgefunden',
      value: summary.stattgefunden || 0,
      percentage: summary.total > 0 
        ? Math.round((summary.stattgefunden / summary.total) * 100) 
        : 0,
      color: '#0ea66e'
    },
    {
      label: 'No-Show',
      value: summary.noShow || 0,
      percentage: summary.total > 0 
        ? Math.round((summary.noShow / summary.total) * 100) 
        : 0,
      color: '#dc2626'
    },
    {
      label: 'Verschoben',
      value: (summary.verschobenBerater || 0) + (summary.verschobenKunde || 0),
      percentage: summary.total > 0 
        ? Math.round(((summary.verschobenBerater || 0) + (summary.verschobenKunde || 0)) / summary.total * 100) 
        : 0,
      color: '#e3a008'
    }
  ];

  return (
    <div className="appointment-overview">
      <h2 className="section-title">OVERVIEW</h2>
      <div className="overview-grid">
        {metrics.map((metric, index) => (
          <div key={index} className="overview-card">
            <div className="metric-value" style={{ color: metric.color }}>
              {metric.value}
            </div>
            <div className="metric-label">{metric.label}</div>
            {metric.percentage !== undefined && (
              <div className="metric-percentage">{metric.percentage}%</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AppointmentOverview;

