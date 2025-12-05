import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// GET /api/users
export const fetchUsers = async () => {
  const response = await api.get('/users');
  return response.data;
};

// GET /api/stats/calls
export const fetchCallStats = async (params = {}) => {
  try {
    console.log('[api] Fetching call stats with params:', params);
    const response = await api.get('/stats/calls', { params });
    console.log('[api] Call stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching call stats:', error);
    console.error('[api] Error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    // Return empty array instead of throwing to prevent dashboard crash
    return [];
  }
};

// GET /api/stats/outcomes
export const fetchOutcomes = async (params = {}) => {
  try {
    const response = await api.get('/stats/outcomes', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching outcomes:', error);
    return [];
  }
};

// GET /api/stats/best-time
export const fetchBestTime = async (params = {}) => {
  try {
    const response = await api.get('/stats/best-time', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching best time:', error);
    return [];
  }
};

// GET /api/stats/duration
export const fetchDuration = async (params = {}) => {
  try {
    const response = await api.get('/stats/duration', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching duration:', error);
    return null;
  }
};

// GET /api/calls/stats - Kombinierte Call-Statistiken
export const fetchCallsStats = async (params = {}) => {
  const response = await api.get('/calls/stats', { params });
  return response.data;
};

// GET /api/stats/unassigned
export const fetchUnassignedCalls = async (params = {}) => {
  try {
    const response = await api.get('/stats/unassigned', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching unassigned calls:', error);
    return { unassignedCalls: 0 };
  }
};

// GET /api/stats/funnel
export const fetchFunnelStats = async (params = {}) => {
  try {
    const response = await api.get('/stats/funnel', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching funnel stats:', error);
    return null;
  }
};

// GET /api/stats/qualification
export const fetchQualificationStats = async (params = {}) => {
  try {
    const response = await api.get('/stats/qualification', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching qualification stats:', error);
    return null;
  }
};

// GET /api/stats/user-activities
export const fetchUserActivities = async (params = {}) => {
  const response = await api.get('/stats/user-activities', { params });
  return response.data;
};

// GET /api/stats/response-time
export const fetchResponseTime = async (params = {}) => {
  try {
    const response = await api.get('/stats/response-time', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching response time:', error);
    return null;
  }
};

// POST /api/sync
export const triggerSync = async () => {
  const response = await api.post('/sync');
  return response.data;
};

// ========== CALENDLY API ==========

// GET /api/calendly/stats
export const fetchCalendlyStats = async (params = {}) => {
  try {
    const response = await api.get('/calendly/stats', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching calendly stats:', error);
    return {
      totalEvents: 0,
      activeEvents: 0,
      canceledEvents: 0,
      uniqueClients: 0,
      cancelRate: 0,
      eventTypes: [],
      eventsByDay: [],
      bestTime: [],
      weekdayStats: []
    };
  }
};

// GET /api/calendly/events
export const fetchCalendlyEvents = async (params = {}) => {
  try {
    const response = await api.get('/calendly/events', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching calendly events:', error);
    return [];
  }
};

// GET /api/calendly/host-stats
export const fetchCalendlyHostStats = async (params = {}) => {
  try {
    const response = await api.get('/calendly/host-stats', { params });
    return response.data;
  } catch (error) {
    console.error('[api] Error fetching calendly host stats:', error);
    return [];
  }
};

// POST /api/calendly/sync - Nur Calendly synchronisieren
export const syncCalendly = async (daysBack = 365) => {
  try {
    const response = await api.post('/calendly/sync', { daysBack });
    return response.data;
  } catch (error) {
    console.error('[api] Error syncing calendly:', error);
    throw error;
  }
};

// ========== CUSTOM ACTIVITIES API ==========

// GET /api/custom-activities/stats
export const fetchCustomActivitiesStats = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/custom-activities/stats?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch custom activities stats');
    return response.json();
  } catch (error) {
    console.error('[api] Error fetching custom activities stats:', error);
    return {
      total: 0,
      byType: {},
      byResult: {},
      byAdvisor: {}
    };
  }
};

// GET /api/custom-activities/advisor-completion
export const fetchAdvisorCompletion = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/custom-activities/advisor-completion?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch advisor completion');
    return response.json();
  } catch (error) {
    console.error('[api] Error fetching advisor completion:', error);
    return [];
  }
};

// GET /api/custom-activities/by-type
export const fetchCustomActivitiesByType = async (type, params = {}) => {
  try {
    const queryString = new URLSearchParams({ 
      ...params, 
      activityType: type,
      useCache: 'true' // Verwende DB-Cache
    }).toString();
    const url = `${API_BASE_URL}/custom-activities/by-type?${queryString}`;
    console.log('[api] Fetching Custom Activities:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[api] API Error Response:', response.status, errorText);
      throw new Error(`Failed to fetch activities by type: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    console.log('[api] Custom Activities Response:', {
      activityType: data.activityType,
      total: data.total,
      activitiesCount: data.activities?.length,
      source: data.source
    });
    return data;
  } catch (error) {
    console.error('[api] Error fetching activities by type:', error);
    return {
      activityType: type,
      total: 0,
      activities: []
    };
  }
};

// POST /api/custom-activities/sync - Sync Custom Activities (neue robuste Methode)
// Unterstützt sowohl normale JSON-Antwort als auch SSE für Fortschritt
export const syncCustomActivities = async (daysBack = 90, onProgress = null) => {
  try {
    // Wenn onProgress Callback vorhanden, verwende SSE
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const eventSource = new EventSource(`${API_BASE_URL}/custom-activities/sync?daysBack=${daysBack}&useSSE=true`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        // EventSource unterstützt keine POST mit Body, daher verwenden wir einen Workaround
        // Wir müssen stattdessen einen POST-Request mit fetch machen und dann SSE verwenden
        fetch(`${API_BASE_URL}/custom-activities/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ daysBack, useSSE: true })
        })
        .then(response => {
          if (!response.ok) {
            throw new Error('Failed to start sync');
          }
          
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          
          const readStream = () => {
            reader.read().then(({ done, value }) => {
              if (done) {
                resolve({ success: true });
                return;
              }
              
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Letzte unvollständige Zeile behalten
              
              lines.forEach(line => {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.substring(6));
                    onProgress(data);
                    
                    if (data.type === 'complete') {
                      resolve(data);
                    } else if (data.type === 'error') {
                      reject(new Error(data.error));
                    }
                  } catch (e) {
                    console.warn('[api] Failed to parse SSE data:', e);
                  }
                }
              });
              
              readStream();
            }).catch(reject);
          };
          
          readStream();
        })
        .catch(reject);
      });
    } else {
      // Normale JSON-Antwort
      const response = await fetch(`${API_BASE_URL}/custom-activities/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ daysBack, useSSE: false })
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to sync custom activities');
      }
      return response.json();
    }
  } catch (error) {
    console.error('[api] Error syncing custom activities:', error);
    throw error;
  }
};

// GET /api/custom-activities/matched - Matched Events mit Results
export const fetchMatchedActivities = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/custom-activities/matched?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch matched activities');
    return response.json();
  } catch (error) {
    console.error('[api] Error fetching matched activities:', error);
    return [];
  }
};

// GET /api/forecast-backcast - Forecast und Backcast Daten
export const fetchForecastBackcast = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}/forecast-backcast?${queryString}`;
    console.log('[api] Fetching Forecast/Backcast:', url);
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[api] Forecast/Backcast Error:', response.status, errorText);
      throw new Error(`Failed to fetch forecast/backcast: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('[api] Forecast/Backcast Response:', {
      forecastCount: data.forecast?.length || 0,
      backcastCount: data.backcast?.length || 0
    });
    return data;
  } catch (error) {
    console.error('[api] Error fetching forecast/backcast:', error);
    return { forecast: [], backcast: [] };
  }
};

// GET /api/custom-activities/overview - Übersicht: Was wurde aus vergangenen Terminen?
export const fetchCustomActivitiesOverview = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE_URL}/custom-activities/overview?${queryString}`);
    if (!response.ok) throw new Error('Failed to fetch custom activities overview');
    return response.json();
  } catch (error) {
    console.error('[api] Error fetching custom activities overview:', error);
    return { total: 0, byResult: [], byType: [], unmatched: 0, activities: [] };
  }
};

export default api;


