import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// GET /api/appointments/{type}
export const fetchAppointments = async (type, params = {}) => {
  try {
    // Mapping: Frontend verwendet 'erstgespraech', Backend erwartet 'erstgespraeche'
    const typeMapping = {
      'erstgespraech': 'erstgespraeche',
      'konzept': 'konzept',
      'umsetzung': 'umsetzung',
      'service': 'service'
    };
    
    const backendType = typeMapping[type] || type;
    
    console.log(`[appointmentsApi] Fetching appointments for type: ${type} -> ${backendType}`);
    console.log(`[appointmentsApi] Params:`, params);
    
    const url = `/appointments/${backendType}`;
    const fullUrl = `${API_BASE_URL}${url}`;
    console.log(`[appointmentsApi] Full URL: ${fullUrl}`);
    
    const response = await api.get(url, { params });
    
    console.log(`[appointmentsApi] Response status: ${response.status}`);
    console.log(`[appointmentsApi] Response data:`, response.data);
    
    return response.data;
  } catch (error) {
    console.error(`[appointmentsApi] Fehler beim Laden der Appointments (${type}):`, error);
    console.error(`[appointmentsApi] Error details:`, {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    
    // Fallback: Leere Daten zurückgeben statt Fehler zu werfen
    return {
      summary: { total: 0, geplant: 0, stattgefunden: 0, noShow: 0, verschobenBerater: 0, verschobenKunde: 0 },
      byUser: [],
      upcoming: [],
      results: { abschluss: 0, bedenkzeit: 0, keinInteresse: 0, followUp: 0 }
    };
  }
};

// GET /api/appointments/conversion-funnel
export const fetchConversionFunnel = async (params = {}) => {
  try {
    const response = await api.get('/appointments/conversion-funnel', { params });
    return response.data;
  } catch (error) {
    console.error('Fehler beim Laden des Conversion-Funnels:', error);
    // Fallback: Leere Daten zurückgeben
    return {
      erstgespraech: { stattgefunden: 0, zuKonzeptGebucht: 0, conversionRate: 0 },
      konzept: { stattgefunden: 0, zuUmsetzungGebucht: 0, conversionRate: 0 },
      umsetzung: { stattgefunden: 0, gewonnen: 0, conversionRate: 0 },
      overall: { erstgespraechToWon: 0, avgDaysErstToWon: 0 }
    };
  }
};

