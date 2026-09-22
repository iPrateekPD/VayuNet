// src/data/eventsMockData.js
import { SHARED_EVENTS } from './sharedEventData';

export const MOCK_EVENTS = SHARED_EVENTS;

export const getEventsSummary = () => {
  const active = MOCK_EVENTS.filter(e => e.status === 'ACTIVE').length;
  const developing = MOCK_EVENTS.filter(e => e.status === 'DEVELOPING').length;
  const resolved24h = MOCK_EVENTS.filter(e => e.status === 'RESOLVED').length;
  const last24h = active + developing + resolved24h;

  return { active, developing, resolved24h, last24h };
};
