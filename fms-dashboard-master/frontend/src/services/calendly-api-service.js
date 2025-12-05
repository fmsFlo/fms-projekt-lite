// ========================================
// CALENDLY API FUNCTIONS
// ========================================
// Diese Funktionen am Ende von frontend/src/services/api.js einfügen
// (vor dem letzten Export oder am Ende der Datei)

export const fetchCalendlyStats = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/calendly/stats?${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch Calendly stats');
  return response.json();
};

export const fetchCalendlyEvents = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/calendly/events?${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch Calendly events');
  return response.json();
};

export const fetchCalendlyHostStats = async (params) => {
  const queryString = new URLSearchParams(params).toString();
  const response = await fetch(`${API_BASE_URL}/calendly/host-stats?${queryString}`);
  if (!response.ok) throw new Error('Failed to fetch Calendly host stats');
  return response.json();
};
