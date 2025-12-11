require('dotenv').config();
const { db } = require('../database/db');

console.log('Datenbank wird initialisiert...');

// Die Initialisierung passiert bereits in db.js beim Import
// Diese Datei kann für zukünftige Migrationen genutzt werden

setTimeout(() => {
  console.log('Datenbank initialisiert.');
  process.exit(0);
}, 1000);


