require('dotenv').config();
const CloseApiService = require('../services/closeApi');

// Farben für Terminal-Output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

const printHeader = (title) => {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
};

const printSection = (title) => {
  console.log(`\n${colors.bright}${colors.yellow}▶ ${title}${colors.reset}`);
  console.log(`${colors.yellow}${'-'.repeat(58)}${colors.reset}`);
};

const printUser = (user, index) => {
  console.log(`\n${colors.green}[User ${index + 1}]${colors.reset}`);
  console.log(`  ID:        ${user.id}`);
  console.log(`  Name:      ${user.display_name || `${user.first_name} ${user.last_name}`.trim() || 'N/A'}`);
  console.log(`  E-Mail:    ${user.email || 'N/A'}`);
};

const printLead = (lead, index) => {
  console.log(`\n${colors.green}[Lead ${index + 1}]${colors.reset}`);
  console.log(`  ID:            ${lead.id}`);
  console.log(`  Name:          ${lead.name || 'N/A'}`);
  console.log(`  Firma:         ${lead.company_name || 'N/A'}`);
  console.log(`  E-Mail:        ${lead.email || 'N/A'}`);
  console.log(`  Telefon:       ${lead.phone || 'N/A'}`);
  console.log(`  Status:        ${lead.status || 'N/A'}`);
};

const printCall = (call, index) => {
  console.log(`\n${colors.green}[Call ${index + 1}]${colors.reset}`);
  console.log(`  ID:            ${call.id}`);
  console.log(`  User ID:       ${call.user_id || 'N/A'}`);
  console.log(`  Lead ID:       ${call.lead_id || 'N/A'}`);
  console.log(`  Direction:     ${call.direction || 'N/A'}`);
  console.log(`  Status:        ${call.status || 'N/A'}`);
  console.log(`  Disposition:   ${call.outcome || 'N/A'}`);
  console.log(`  Duration:      ${call.duration ? `${call.duration}s` : '0s'}`);
  console.log(`  Timestamp:     ${call.call_timestamp || 'N/A'}`);
};

// Hauptfunktion
const testCloseConnection = async () => {
  try {
    printHeader('Close CRM API Connection Test');
    
    // Prüfe ob API Key gesetzt ist
    if (!process.env.CLOSE_API_KEY) {
      console.error(`${colors.red}❌ FEHLER: CLOSE_API_KEY ist nicht in der .env Datei definiert!${colors.reset}`);
      console.log(`\nBitte erstelle eine .env Datei im backend/ Verzeichnis mit:`);
      console.log(`CLOSE_API_KEY=dein_api_key_hier\n`);
      process.exit(1);
    }
    
    console.log(`${colors.green}✓ API Key gefunden${colors.reset}`);
    console.log(`${colors.blue}API Key: ${process.env.CLOSE_API_KEY.substring(0, 20)}...${colors.reset}\n`);
    
    // Initialisiere Close API Service
    printSection('Initialisiere Close API Service...');
    const closeApi = new CloseApiService();
    console.log(`${colors.green}✓ Service initialisiert${colors.reset}`);
    
    // Test 1: Hole Users
    printSection('Lade Users (Berater)...');
    try {
      const users = await closeApi.getUsers();
      const first5Users = users.slice(0, 5);
      
      console.log(`${colors.green}✓ ${users.length} User(s) gefunden${colors.reset}`);
      console.log(`${colors.blue}Zeige erste ${Math.min(5, users.length)} User(s):${colors.reset}`);
      
      first5Users.forEach((user, index) => {
        printUser(user, index);
      });
      
      if (users.length > 5) {
        console.log(`\n${colors.magenta}... und ${users.length - 5} weitere User(s)${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Fehler beim Laden der Users:${colors.reset}`);
      console.error(`${colors.red}${error.message}${colors.reset}`);
      if (error.response) {
        console.error(`${colors.red}Status: ${error.response.status}${colors.reset}`);
        console.error(`${colors.red}Response: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
      }
    }
    
    // Test 2: Hole Leads
    printSection('Lade Leads...');
    try {
      const leads = await closeApi.getLeads();
      const first5Leads = leads.slice(0, 5);
      
      console.log(`${colors.green}✓ ${leads.length} Lead(s) gefunden${colors.reset}`);
      console.log(`${colors.blue}Zeige erste ${Math.min(5, leads.length)} Lead(s):${colors.reset}`);
      
      first5Leads.forEach((lead, index) => {
        printLead(lead, index);
      });
      
      if (leads.length > 5) {
        console.log(`\n${colors.magenta}... und ${leads.length - 5} weitere Lead(s)${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Fehler beim Laden der Leads:${colors.reset}`);
      console.error(`${colors.red}${error.message}${colors.reset}`);
      if (error.response) {
        console.error(`${colors.red}Status: ${error.response.status}${colors.reset}`);
        console.error(`${colors.red}Response: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
      }
    }
    
    // Test 3: Hole Calls
    printSection('Lade Call Activities (letzte 30 Tage)...');
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const calls = await closeApi.getCallsByDateRange(
        startDate.toISOString(),
        endDate.toISOString()
      );
      const first5Calls = calls.slice(0, 5);
      
      console.log(`${colors.green}✓ ${calls.length} Call(s) gefunden${colors.reset}`);
      console.log(`${colors.blue}Zeige erste ${Math.min(5, calls.length)} Call(s):${colors.reset}`);
      
      first5Calls.forEach((call, index) => {
        printCall(call, index);
      });
      
      if (calls.length > 5) {
        console.log(`\n${colors.magenta}... und ${calls.length - 5} weitere Call(s)${colors.reset}`);
      }
    } catch (error) {
      console.error(`${colors.red}❌ Fehler beim Laden der Calls:${colors.reset}`);
      console.error(`${colors.red}${error.message}${colors.reset}`);
      if (error.response) {
        console.error(`${colors.red}Status: ${error.response.status}${colors.reset}`);
        console.error(`${colors.red}Response: ${JSON.stringify(error.response.data, null, 2)}${colors.reset}`);
      }
    }
    
    // Zusammenfassung
    printHeader('Test Abgeschlossen');
    console.log(`${colors.green}✓ API Connection erfolgreich getestet!${colors.reset}`);
    console.log(`${colors.blue}Dein Close API Key funktioniert korrekt.${colors.reset}\n`);
    
  } catch (error) {
    printHeader('Test Fehlgeschlagen');
    console.error(`${colors.red}❌ Kritischer Fehler:${colors.reset}`);
    console.error(`${colors.red}${error.message}${colors.reset}`);
    
    if (error.response) {
      console.error(`\n${colors.red}API Response Details:${colors.reset}`);
      console.error(`${colors.red}Status: ${error.response.status}${colors.reset}`);
      console.error(`${colors.red}Status Text: ${error.response.statusText}${colors.reset}`);
      if (error.response.data) {
        console.error(`${colors.red}Response Body:${colors.reset}`);
        console.error(JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log(`\n${colors.yellow}Tipps:${colors.reset}`);
    console.log(`- Prüfe ob dein API Key korrekt in der .env Datei steht`);
    console.log(`- Prüfe ob der API Key in Close CRM aktiv ist`);
    console.log(`- Prüfe die Rate Limits deines API Keys\n`);
    
    process.exit(1);
  }
};

// Führe Test aus
testCloseConnection();

