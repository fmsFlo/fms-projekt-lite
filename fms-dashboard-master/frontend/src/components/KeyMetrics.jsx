import React from 'react';
import './KeyMetrics.css';

const KeyMetrics = ({ funnelStats, callStats }) => {
  if (!funnelStats && !callStats) {
    return null;
  }

  const metrics = [
    {
      value: funnelStats?.leadsCreated || 0,
      label: 'LEADS',
      subtext: 'erstellt',
      trend: null,
    },
    {
      value: funnelStats?.contacted || 0,
      label: 'KONTAKTIERT',
      subtext: `${funnelStats?.leadsCreated ? Math.round((funnelStats.contacted / funnelStats.leadsCreated) * 100) : 0}%`,
      trend: null,
    },
    {
      value: funnelStats?.reached || 0,
      label: 'ERREICHT',
      subtext: `${funnelStats?.contacted ? Math.round((funnelStats.reached / funnelStats.contacted) * 100) : 0}%`,
      trend: null,
    },
    {
      value: funnelStats?.meetingSet || 0,
      label: 'TERMINE',
      subtext: `${funnelStats?.reached ? Math.round((funnelStats.meetingSet / funnelStats.reached) * 100) : 0}%`,
      trend: '↗',
    }
  ];

  return (
    <div className="key-metrics-row">
      {metrics.map((metric, index) => (
        <div key={index} className="metric-card">
          <div className="metric-header">
            <span className="metric-icon"></span>
            {metric.trend && (
              <span className="metric-trend">{metric.trend}</span>
            )}
          </div>
          <div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-subtext">{metric.subtext}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default KeyMetrics;
