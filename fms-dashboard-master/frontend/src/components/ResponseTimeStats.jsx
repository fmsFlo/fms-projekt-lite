import React from 'react';
import './ResponseTimeStats.css';

const ResponseTimeStats = ({ data, selectedUser, compact = false }) => {
  if (!data || !data.byUser || data.byUser.length === 0) {
    return (
      <div className="response-time-stats">
        <div className="response-time-header">
          <h2>⚡ LEAD RESPONSE TIME</h2>
        </div>
        <div className="no-data">
          <p>Keine Daten verfügbar</p>
        </div>
      </div>
    );
  }

  const { byUser, overall } = data;

  // Wenn ein User gefiltert ist, zeige nur diesen User
  const displayUsers = selectedUser 
    ? byUser.filter(user => user.userId === parseInt(selectedUser))
    : byUser;

  if (compact) {
    // Kompakte Version für Chart-Grid
    const user = displayUsers[0] || byUser[0];
    if (!user) return null;

    return (
      <div className="response-time-compact">
        <div className="response-time-header-compact">
          <span className="response-time-title-compact">RESPONSE TIME</span>
          <span className="response-time-avg-compact">
            Ø {user.avgResponseHours ? `${user.avgResponseHours}h` : 'N/A'}
          </span>
        </div>
        <div className="response-time-bars-compact">
          <div className="bar-item-compact">
            <span className="bar-label-compact good">✅ &lt;24h</span>
            <div className="bar-container-compact">
              <div 
                className="bar-fill-compact good" 
                style={{ width: `${user.breakdown.under24h.percentage}%` }}
              ></div>
            </div>
            <span className="bar-value-compact">{user.breakdown.under24h.percentage}% ({user.breakdown.under24h.count})</span>
          </div>
          <div className="bar-item-compact">
            <span className="bar-label-compact warning">⚠️ 24-48h</span>
            <div className="bar-container-compact">
              <div 
                className="bar-fill-compact warning" 
                style={{ width: `${user.breakdown.between24_48h.percentage}%` }}
              ></div>
            </div>
            <span className="bar-value-compact">{user.breakdown.between24_48h.percentage}% ({user.breakdown.between24_48h.count})</span>
          </div>
          <div className="bar-item-compact">
            <span className="bar-label-compact bad">❌ &gt;48h</span>
            <div className="bar-container-compact">
              <div 
                className="bar-fill-compact bad" 
                style={{ width: `${user.breakdown.over48h.percentage}%` }}
              ></div>
            </div>
            <span className="bar-value-compact">{user.breakdown.over48h.percentage}% ({user.breakdown.over48h.count})</span>
          </div>
        </div>
        {user.notContactedYet > 0 && (
          <div className="not-contacted-compact">
            ⚠️ {user.notContactedYet} nicht kontaktiert
          </div>
        )}
      </div>
    );
  }

  // Original full version
  return null;
};

export default ResponseTimeStats;
