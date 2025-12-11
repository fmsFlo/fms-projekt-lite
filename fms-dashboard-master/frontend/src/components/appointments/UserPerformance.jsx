import React from 'react';
import './UserPerformance.css';

const UserPerformance = ({ data }) => {
  if (!data || !data.byUser || data.byUser.length === 0) {
    return (
      <div className="user-performance">
        <h2 className="section-title">PERFORMANCE BY USER</h2>
        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
          Keine Benutzer-Daten verfügbar
        </div>
      </div>
    );
  }

  return (
    <div className="user-performance">
      <h2 className="section-title">PERFORMANCE BY USER</h2>
      <div className="performance-list">
        {data.byUser.map(user => (
          <div key={user.userId} className="performance-item">
            <div className="user-name">{user.userName}:</div>
            <div className="user-stats">
              <span>{user.total} EG</span>
              <span>|</span>
              <span>{user.showRate}% Show</span>
              <span>|</span>
              <span>{user.avgDaysBetweenBookingAndMeeting || 0} Tage Ø</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserPerformance;

