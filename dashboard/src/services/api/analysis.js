import { apiClient } from './client';
import { mockAnalysisData } from '../../data/sharedEventData';

export const analysisApi = {
  getRiskAnalysis: async (region) => {
    if (import.meta.env.VITE_DEMO_MODE === 'true') {
      return {
        status: 'live',
        data: mockAnalysisData
      };
    }

    try {
      return await apiClient.get(`/api/risk/${region}`);
    } catch (error) {
      console.warn(`Falling back to mock data for risk analysis in ${region}:`, error);
      return {
        status: 'fallback',
        data: mockAnalysisData
      };
    }
  },

  getAllValidations: async () => {
    try {
      return await apiClient.get('/api/risk/validation/all');
    } catch (error) {
      return { status: 'fallback', validations: [] };
    }
  }
};
