require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const SyncService = require('./services/syncService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const apiRoutes = require('./routes/api');
const callsRoutes = require('./routes/calls');
const calendlyRoutes = require('./routes/calendly');
app.use('/api', apiRoutes);
app.use('/api/calls', callsRoutes);
app.use('/api/calendly', calendlyRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Starte Sync Service
const syncService = new SyncService();

// Starte Server zuerst
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  
  // Initiale Synchronisation nach erfolgreichem Server-Start
  setTimeout(() => {
    console.log('\n=== Starte initiale Synchronisation ===');
    syncService.syncAll().catch(err => {
      console.error('Fehler bei initialer Synchronisation:', err);
    });
  }, 1000); // Warte 1 Sekunde nach Server-Start
});

// Cron Job: Synchronisation alle 15 Minuten
cron.schedule('*/15 * * * *', async () => {
  console.log('Starte automatische Synchronisation...');
  try {
    await syncService.syncAll();
    console.log('Automatische Synchronisation erfolgreich abgeschlossen.');
  } catch (error) {
    console.error('Fehler bei automatischer Synchronisation:', error);
  }
});

// Fehlerbehandlung für Server-Fehler
app.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ FEHLER: Port ${PORT} ist bereits belegt!`);
    console.error('Bitte beende den laufenden Prozess oder ändere den Port.\n');
    process.exit(1);
  } else {
    console.error('Server Fehler:', err);
  }
});


