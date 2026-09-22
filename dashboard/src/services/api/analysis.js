import { apiClient } from './client';
import { eventData } from '../../data/sharedEventData';

/**
 * Analysis Service Adapter
 * Provides backend integration for the Analysis View with mock data fallbacks.
 */
export const analysisApi = {
  getRiskAnalysis: async (region) => {
    try {
      return await apiClient.get(`/api/risk/${region}`);
    } catch (error) {
      console.warn(`Falling back to mock data for risk analysis in ${region}:`, error);
      
      const mockEvent = eventData.find(e => e.location.includes(region)) || eventData[0];
      
      return {
        status: 'fallback',
        region: region,
        riskLevel: mockEvent.risk,
        confidence: 85,
        factors: ['Atmospheric Instability', 'High Humidity', 'Wind Shear'],
        mockData: true
      };
    }
  },

  getAllValidations: async () => {
    try {
      return await apiClient.get('/api/risk/validation/all');
    } catch (error) {
      console.warn('Falling back to mock data for risk validations:', error);
      return { status: 'fallback', validations: [] };
    }
  }
};
