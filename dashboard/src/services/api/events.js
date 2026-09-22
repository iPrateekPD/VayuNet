import { apiClient } from './client';
import { SHARED_EVENTS as eventData } from '../../data/sharedEventData';

/**
 * Events Service Adapter
 */
export const eventsApi = {
  getAllEvents: async () => {
    try {
      return await apiClient.get('/api/events');
    } catch (error) {
      console.warn('Falling back to mock data for all events:', error);
      return { status: 'fallback', data: eventData };
    }
  },

  getEventById: async (eventId) => {
    try {
      return await apiClient.get(`/api/events/${eventId}`);
    } catch (error) {
      console.warn(`Falling back to mock data for event ${eventId}:`, error);
      const mockEvent = eventData.find(e => e.id === eventId) || eventData[0];
      return { status: 'fallback', data: mockEvent };
    }
  },
  
  getEventsByLocation: async (locationId) => {
    try {
      return await apiClient.get(`/api/locations/${locationId}/events`);
    } catch (error) {
      console.warn(`Falling back to mock data for location events ${locationId}:`, error);
      return { status: 'fallback', data: eventData };
    }
  }
};
