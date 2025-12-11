import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import './App.css';
import CallsDashboard from './components/CallsDashboard';
import CalendlyDashboard from './components/CalendlyDashboard';
import AnalysisDashboard from './components/AnalysisDashboard';
import { fetchUsers } from './services/api';

// Header Component mit Navigation
const AppHeader = ({ users, selectedUser, setSelectedUser, startDate, setStartDate, endDate, setEndDate, syncMessage, isSyncing, handleSync }) => {
  const location = useLocation();

  return (
    <header className="App-header">
      <div className="header-left">
        <h1>📊 SALES DASHBOARD</h1>
        <nav className="main-nav">
          <Link 
            to="/" 
            className={location.pathname === '/' ? 'active' : ''}
          >
            📞 Telefonie
          </Link>
          <Link 
            to="/calendly" 
            className={location.pathname === '/calendly' ? 'active' : ''}
          >
            📅 Calendly
          </Link>
          <Link 
            to="/analyse" 
            className={location.pathname === '/analyse' ? 'active' : ''}
          >
            📊 Analyse
          </Link>
        </nav>
      </div>
      
      {/* Filter nur für Telefonie-Dashboard, nicht für Calendly */}
      {location.pathname === '/' && (
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="user-select">BERATER</label>
            <select
              id="user-select"
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
            >
              <option value="">Alle Berater</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.name || 'Unbekannt'}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="start-date">VON</label>
            <input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <label htmlFor="end-date">BIS</label>
            <input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-group">
            <button
              className="sync-button"
              onClick={handleSync}
              disabled={isSyncing}
            >
              {isSyncing ? '⏳' : '↻'} {isSyncing ? 'Aktualisiere...' : 'Sync'}
            </button>
            {syncMessage && (
              <div className={`sync-message ${syncMessage.includes('✅') ? 'success' : 'error'}`}>
                {syncMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

// Main App Component
function App() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [syncMessage, setSyncMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadUsers();
    // Set default date range to last 12 months (für alle Daten, inkl. Calendly)
    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - 12);
    setEndDate(end.toISOString().split('T')[0]);
    setStartDate(start.toISOString().split('T')[0]);
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await fetchUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer:', error);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      const response = await fetch('http://localhost:3001/api/sync', {
        method: 'POST'
      });
      const data = await response.json();
      if (data.success) {
        setSyncMessage('✅ Daten erfolgreich aktualisiert!');
        setTimeout(() => setSyncMessage(''), 3000);
        // Reload users after sync
        await loadUsers();
      } else {
        setSyncMessage('❌ Fehler beim Aktualisieren der Daten');
        setTimeout(() => setSyncMessage(''), 5000);
      }
    } catch (error) {
      console.error('Fehler beim Synchronisieren:', error);
      setSyncMessage('❌ Fehler beim Aktualisieren der Daten');
      setTimeout(() => setSyncMessage(''), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Router>
      <div className="App">
        <AppHeader
          users={users}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          syncMessage={syncMessage}
          isSyncing={isSyncing}
          handleSync={handleSync}
        />

        <main className="App-main">
          <Routes>
            <Route 
              path="/" 
              element={
                <CallsDashboard
                  selectedUser={selectedUser}
                  startDate={startDate}
                  endDate={endDate}
                />
              } 
            />
            <Route 
              path="/calendly" 
              element={
                <CalendlyDashboard
                  selectedUser={selectedUser}
                  startDate={startDate}
                  endDate={endDate}
                />
              } 
            />
            <Route 
              path="/analyse" 
              element={<AnalysisDashboard />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
