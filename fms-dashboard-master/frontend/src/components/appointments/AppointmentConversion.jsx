import React from 'react';
import './AppointmentConversion.css';

const AppointmentConversion = ({ data, type }) => {
  if (!data) {
    return null;
  }

  const getConversionInfo = () => {
    if (type === 'erstgespraech') {
      return {
        label: 'EG → Konzept',
        rate: data.erstgespraech?.conversionRate || 0,
        avgDays: null
      };
    } else if (type === 'konzept') {
      return {
        label: 'Konzept → Umsetzung',
        rate: data.konzept?.conversionRate || 0,
        avgDays: null
      };
    } else if (type === 'umsetzung') {
      return {
        label: 'Umsetzung → Won',
        rate: data.umsetzung?.conversionRate || 0,
        avgDays: null
      };
    }
    return null;
  };

  const info = getConversionInfo();
  if (!info) {
    return null;
  }

  return (
    <div className="appointment-conversion">
      <h2 className="section-title">CONVERSION</h2>
      <div className="conversion-content">
        <div className="conversion-rate">
          <div className="rate-label">{info.label}:</div>
          <div className="rate-value">{info.rate}%</div>
        </div>
        {info.avgDays && (
          <div className="avg-days">Ø Tage: {info.avgDays}d</div>
        )}
      </div>
    </div>
  );
};

export default AppointmentConversion;

