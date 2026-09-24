import { apiClient } from './client';
import { SHARED_ALERTS } from '../../data/sharedEventData';

export const alertsApi = {
  getActiveAlerts: async () => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      return { status: 'live', data: SHARED_ALERTS };
    }

    try {
      return await apiClient.get('/api/alerts/active');
    } catch (error) {
      console.warn('Falling back to mock data for active alerts:', error);
      return { status: 'fallback', data: SHARED_ALERTS };
    }
  }
};
