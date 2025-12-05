import React from 'react';
import './UpcomingAppointments.css';

const UpcomingAppointments = ({ data }) => {
  console.log('[UpcomingAppointments] Received data:', data);
  console.log('[UpcomingAppointments] Has upcoming?', !!data?.upcoming);
  console.log('[UpcomingAppointments] Upcoming length:', data?.upcoming?.length);
  console.log('[UpcomingAppointments] Upcoming data:', data?.upcoming);
  
  if (!data || !data.upcoming || data.upcoming.length === 0) {
    console.log('[UpcomingAppointments] Keine kommenden Termine - zeige leere Ansicht');
    return (
      <div className="upcoming-appointments">
        <h2 className="section-title">UPCOMING ERSTGESPRÄCHE</h2>
        <div style={{ padding: '20px', textAlign: 'center', color: '#9ca3af' }}>
          Keine kommenden Termine
        </div>
      </div>
    );
  }
  
  console.log('[UpcomingAppointments] Rendering', data.upcoming.length, 'upcoming appointments');

  // Gruppiere nach Datum
  const grouped = {};
  data.upcoming.forEach(apt => {
    const date = apt.date;
    if (!grouped[date]) {
      grouped[date] = [];
    }
    grouped[date].push(apt);
  });

  // Sortiere Daten
  const sortedDates = Object.keys(grouped).sort();

  // Diese Woche / Nächste Woche
  const today = new Date();
  const thisWeek = [];
  const nextWeek = [];

  sortedDates.forEach(date => {
    const aptDate = new Date(date);
    const daysDiff = Math.floor((aptDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysDiff >= 0 && daysDiff < 7) {
      thisWeek.push(...grouped[date]);
    } else if (daysDiff >= 7 && daysDiff < 14) {
      nextWeek.push(...grouped[date]);
    }
  });

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Heute';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Morgen';
    } else {
      return date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
    }
  };

  return (
    <div className="upcoming-appointments">
      <h2 className="section-title">UPCOMING ERSTGESPRÄCHE</h2>
      <div className="upcoming-stats">
        <span>Diese Woche: <strong>{thisWeek.length}</strong></span>
        <span>Nächste Woche: <strong>{nextWeek.length}</strong></span>
      </div>

      <div className="upcoming-list">
        {sortedDates.slice(0, 5).map(date => (
          <div key={date} className="upcoming-day">
            <div className="day-header">{formatDate(date)}</div>
            {grouped[date].map(apt => (
              <div key={apt.id} className="appointment-item">
                <span className="appointment-time">•</span>
                <span className="appointment-lead">{apt.leadName}</span>
                <span className="appointment-user">({apt.userName})</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UpcomingAppointments;

