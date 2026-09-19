/**
 * VAYUNET API Service Client (v2.0)
 * Single entrypoint connecting the React 19 UI with the FastAPI Operational Backend & PyTorch DL Engine
 * Supports AbortController signals for rapid location switching and zero race conditions.
 */

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

export async function checkHealth(signal) {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal });
    if (!res.ok) throw new Error(`Health check returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Health check offline:', err.message);
    return null;
  }
}

export async function getSystemStatus(signal) {
  try {
    const res = await fetch(`${API_BASE}/api/system/status`, { signal });
    if (!res.ok) throw new Error(`System status returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Failed to fetch system status:', err.message);
    return null;
  }
}

export async function getLocations(signal) {
  try {
    const res = await fetch(`${API_BASE}/api/locations`, { signal });
    if (!res.ok) throw new Error(`Locations fetch returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Failed to fetch locations:', err.message);
    return null;
  }
}

// Backward-compatible alias
export const getMonitoredLocations = getLocations;

export async function getLocationDetails(locationId, signal) {
  try {
    const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(locationId)}`, { signal });
    if (!res.ok) throw new Error(`Location details returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn(`[VAYUNET API] Failed to fetch location ${locationId}:`, err.message);
    return null;
  }
}

export async function getLocationWeather(locationId, signal) {
  try {
    const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(locationId)}/weather`, { signal });
    if (!res.ok) throw new Error(`Location weather returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn(`[VAYUNET API] Failed to fetch weather for ${locationId}:`, err.message);
    throw err;
  }
}

export async function getRealtimeWeather(lat, lng, signal) {
  try {
    const res = await fetch(
      `${API_BASE}/api/weather/realtime?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`,
      { signal }
    );
    if (!res.ok) throw new Error(`Unable to retrieve current weather: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Failed to fetch real-time weather:', err.message);
    throw err;
  }
}

export async function getLocationNowcast(locationId, leadTimeHours = 2, signal) {
  try {
    const res = await fetch(
      `${API_BASE}/api/locations/${encodeURIComponent(locationId)}/nowcast?lead_time_hours=${encodeURIComponent(leadTimeHours)}`,
      { signal }
    );
    if (!res.ok) throw new Error(`Nowcast returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn(`[VAYUNET API] Failed to fetch nowcast for ${locationId}:`, err.message);
    return null;
  }
}

export async function predictNowcast({ lat, lng, leadTimeHours = 2, locationId = null }, signal) {
  try {
    // If locationId is known, prefer direct location endpoint
    if (locationId) {
      const locRes = await getLocationNowcast(locationId, leadTimeHours, signal);
      if (locRes) return locRes;
    }

    const payload = {
      lat: Number(lat),
      lng: Number(lng),
      lead_time_hours: Number(leadTimeHours),
    };
    if (locationId) {
      payload.location_id = locationId;
    }

    const res = await fetch(`${API_BASE}/api/nowcast/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) throw new Error(`Nowcast prediction failed with status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Nowcast prediction request error:', err.message);
    return null;
  }
}

export async function getLocationAlerts(locationId, signal) {
  try {
    const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(locationId)}/alerts`, { signal });
    if (!res.ok) throw new Error(`Location alerts returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn(`[VAYUNET API] Failed to fetch alerts for ${locationId}:`, err.message);
    return null;
  }
}

export async function broadcastAlert(payload, signal) {
  try {
    const res = await fetch(`${API_BASE}/api/alerts/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    });
    if (!res.ok) throw new Error(`Alert broadcast failed with status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Failed to broadcast alert:', err.message);
    throw err;
  }
}

export async function getEvents(signal) {
  try {
    const res = await fetch(`${API_BASE}/api/events`, { signal });
    if (!res.ok) throw new Error(`Events fetch returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Failed to fetch historical events:', err.message);
    return null;
  }
}

export async function getLocationEvents(locationId, signal) {
  try {
    const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(locationId)}/events`, { signal });
    if (!res.ok) throw new Error(`Location events returned status: ${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn(`[VAYUNET API] Failed to fetch events for ${locationId}:`, err.message);
    return null;
  }
}

export async function getHistoricalEvent(eventId, signal) {
  try {
    const res = await fetch(`${API_BASE}/api/events/${encodeURIComponent(eventId)}`, { signal });
    if (res.ok) return await res.json();

    // Fallback to legacy path
    const fallbackRes = await fetch(`${API_BASE}/api/hazards/historical/${encodeURIComponent(eventId)}`, { signal });
    if (!fallbackRes.ok) throw new Error(`Historical event request failed with status: ${fallbackRes.status}`);
    return await fallbackRes.json();
  } catch (err) {
    if (err.name === 'AbortError') return null;
    console.warn('[VAYUNET API] Failed to fetch historical event:', err.message);
    return null;
  }
}
