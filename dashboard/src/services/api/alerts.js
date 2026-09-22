import { apiClient } from './client';
import { MOCK_ALERTS } from '../../data/alertsMockData';

/**
 * Alerts Service Adapter
 */
export const alertsApi = {
  getActiveAlerts: async () => {
    try {
      return await apiClient.get('/api/alerts/active');
    } catch (error) {
      console.warn('Falling back to mock data for active alerts:', error);
      return { status: 'fallback', data: MOCK_ALERTS };
    }
  }
};
