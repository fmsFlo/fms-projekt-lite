import React from 'react';
import './AppointmentTypeTabs.css';

const AppointmentTypeTabs = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'erstgespraech', label: 'Erstgespräche', icon: '👋' },
    { id: 'konzept', label: 'Konzept', icon: '💡' },
    { id: 'umsetzung', label: 'Umsetzung', icon: '🚀' },
    { id: 'service', label: 'Service', icon: '🔧' }
  ];

  return (
    <div className="appointment-tabs">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </div>
  );
};

export default AppointmentTypeTabs;

