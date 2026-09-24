import { apiClient } from './client';
import { mockNowcastData, mockEvent } from '../../data/sharedEventData';

export const nowcastApi = {
  getNowcastByLocation: async (locationId, leadTime = '+2h') => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      // Find the specific timeseries for the given leadTime or default to NOW
      const ts = mockNowcastData.timeseries.find(t => t.timeOffset === leadTime) || mockNowcastData.timeseries[0];
      
      return {
        status: 'live',
        data: {
          timeseries: ts,
          highestForecastRisk: mockNowcastData.highestForecastRisk,
          highestRiskRegion: mockNowcastData.highestRiskRegion,
          affectedDistricts: mockNowcastData.affectedDistricts,
          expectedPeak: mockNowcastData.expectedPeak,
          activeForecasts: mockNowcastData.activeForecasts
        }
      };
    }

    try {
      return await apiClient.get(`/api/locations/${locationId}/nowcast?lead_time_hours=${leadTime}`);
    } catch (error) {
      console.warn('Falling back to mock data for nowcast:', error);
      return { status: 'fallback', data: null };
    }
  },

  getCurrentWeather: async (locationId) => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      return { status: 'live', data: mockNowcastData.timeseries[0].weather };
    }

    try {
      return await apiClient.get(`/api/weather/imd/current?location=${locationId}`);
    } catch (error) {
      console.warn('Falling back to mock data for weather:', error);
      return { status: 'fallback', data: null };
    }
  }
};
