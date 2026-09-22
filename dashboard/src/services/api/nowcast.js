import { apiClient } from './client';
import { eventData } from '../../data/sharedEventData';

/**
 * Nowcast Service Adapter
 * Falls back to mock data if the backend is unavailable to ensure UI resilience.
 */
export const nowcastApi = {
  getNowcastByLocation: async (locationId, leadTime = 2) => {
    try {
      return await apiClient.get(`/api/locations/${locationId}/nowcast?lead_time_hours=${leadTime}`);
    } catch (error) {
      console.warn('Falling back to mock data for nowcast:', error);
      // Construct mock response from local eventData
      return {
        status: 'fallback',
        data: eventData.map(e => ({
          hazard_type: e.type,
          probability: e.risk,
          timeline: e.timeline
        }))
      };
    }
  },

  getCurrentWeather: async (locationId) => {
    try {
      // The API uses region or coordinates, but let's assume we can query by location
      return await apiClient.get(`/api/weather/imd/current?location=${locationId}`);
    } catch (error) {
      console.warn('Falling back to mock data for weather:', error);
      return { status: 'fallback', temp: 28, condition: 'Partly Cloudy' };
    }
  }
};
