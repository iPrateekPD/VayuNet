const TIMESTEP_DATA = {
  'Now': { scale: 0.78, shift: 0 }, 
  '+1h': { scale: 0.90, shift: 0.2 }, 
  '+2h': { scale: 1.0, shift: 0.5 }, 
  '+3h': { scale: 1.22, shift: 0.8 }, 
  '+4h': { scale: 1.15, shift: 1.2 }, 
  '+5h': { scale: 0.95, shift: 1.5 }, 
  '+6h': { scale: 0.72, shift: 1.8 },
};

const HAZARD_CONFIG = {
  'COMPOSITE': { size: 1.0, offsetLat: 0, offsetLng: 0, basePeak: '+1h 45m', unit: '%', legendType: 'risk', baseRisk: 82 },
  'THUNDERSTORM': { size: 1.3, offsetLat: 0.05, offsetLng: -0.05, basePeak: '+3h 10m', unit: '%', legendType: 'risk', baseRisk: 71 },
  'CLOUDBURST': { size: 0.6, offsetLat: -0.02, offsetLng: 0.02, basePeak: '+4h 15m', unit: '%', legendType: 'risk', baseRisk: 68 },
  'FLASH FLOOD': { size: 0.8, offsetLat: 0, offsetLng: 0.04, basePeak: '+1h 45m', unit: '%', legendType: 'risk', baseRisk: 82 },
  'PRECIPITATION': { size: 1.6, offsetLat: -0.05, offsetLng: -0.05, basePeak: '+2h', unit: 'mm/hr', legendType: 'precipitation', baseRisk: 42 },
};

import { CHAMOLI_EVENT_ID, SHARED_EVENTS } from './sharedEventData';

const INCIDENTS_BASE = [
  { id: CHAMOLI_EVENT_ID, name: 'Chamoli, Uttarakhand', hazard: 'FLASH FLOOD', riskColor: '#ef4444', confidence: '82%', precipitation: 42 },
  { id: 'VN-EVT-2026-0922-JSM', name: 'Joshimath, Uttarakhand', hazard: 'HEAVY RAINFALL', riskColor: '#f97316', confidence: '79%', precipitation: 25 },
  { id: 'mock-THUNDERSTORM', name: 'Rudraprayag, Uttarakhand', hazard: 'THUNDERSTORM', riskColor: '#eab308', confidence: '71%', precipitation: 15 },
  { id: 'mock-CLOUDBURST', name: 'Uttarkashi, Uttarakhand', hazard: 'CLOUDBURST', riskColor: '#38bdf8', confidence: '68%', precipitation: 68 },
];

function generateActiveForecasts(hazard) {
  let incidents = [...INCIDENTS_BASE];
  if (hazard === 'COMPOSITE') {
    return incidents;
  }
  
  incidents.sort((a, b) => {
    if (a.hazard === hazard) return -1;
    if (b.hazard === hazard) return 1;
    return 0;
  });

  if (incidents[0].hazard !== hazard) {
    incidents.unshift({
      id: 'mock-' + hazard,
      name: 'Chamoli, Uttarakhand',
      hazard: hazard,
      riskColor: hazard === 'PRECIPITATION' ? '#3b82f6' : '#ef4444',
      confidence: '85%',
      precipitation: 55
    });
  }
  return incidents;
}

export function getNowcastState(hazard, forecastHour, bounds) {
  const tsData = TIMESTEP_DATA[forecastHour] || { scale: 1, shift: 0 };
  const hConfig = HAZARD_CONFIG[hazard] || HAZARD_CONFIG['COMPOSITE'];
  
  const activeForecasts = generateActiveForecasts(hazard);
  const highestRegion = activeForecasts[0].name.split(',')[0];
  const affectedDistricts = hazard === 'THUNDERSTORM' || hazard === 'CLOUDBURST' ? '02' : '04';
  
  // Calculate a deterministic variation for the highest risk based on forecastHour shift
  let riskValue = hConfig.baseRisk;
  if (forecastHour !== 'Now') {
    riskValue = Math.round(hConfig.baseRisk * (1 + tsData.shift * 0.1));
  }
  
  const state = {
    hazard,
    forecastHour,
    legendType: hConfig.legendType,
    highestRisk: riskValue,
    unit: hConfig.unit,
    highestRiskRegion: highestRegion,
    affectedDistricts,
    expectedPeak: forecastHour !== 'Now' ? forecastHour : hConfig.basePeak,
    activeForecasts,
    gridData: []
  };

  // Generate grid data if bounds are provided
  if (bounds) {
    const latStep = 0.036; // Approx 4km
    const lngStep = 0.041;
    
    // Calculate an aligned grid starting point to ensure fixed cells while panning
    const startLat = Math.floor(bounds.getSouth() / latStep) * latStep;
    const startLng = Math.floor(bounds.getWest() / lngStep) * lngStep;
    const north = bounds.getNorth();
    const east = bounds.getEast();
    
    // We need a stable center to base the distance calculation on
    // In our mock, the "storm" is roughly centered on Chamoli [30.41, 79.32]
    const alignLat = 30.41;
    const alignLng = 79.32;
    
    const shiftedLat = alignLat + hConfig.offsetLat + (tsData.shift * 0.02);
    const shiftedLng = alignLng + hConfig.offsetLng + (tsData.shift * 0.02);
    
    if (hazard !== 'COMPOSITE') {
      for (let lat = startLat; lat < north; lat += latStep) {
        for (let lng = startLng; lng < east; lng += lngStep) {
          const dLat = Math.abs(lat - shiftedLat) / latStep;
          const dLng = Math.abs(lng - shiftedLng) / lngStep;
          const dist = Math.sqrt(dLat*dLat + dLng*dLng) / (tsData.scale * hConfig.size);
          
          let riskColor = null;
          let opacity = 0;
          
          if (hazard === 'PRECIPITATION') {
            if (dist < 1.5) { riskColor = '#1d4ed8'; opacity = 0.55; }
            else if (dist < 2.5) { riskColor = '#2563eb'; opacity = 0.45; }
            else if (dist < 4.0) { riskColor = '#3b82f6'; opacity = 0.35; }
            else if (dist < 6.0) { riskColor = '#60a5fa'; opacity = 0.20; }
            else if (dist < 8.0) { riskColor = '#93c5fd'; opacity = 0.10; }
          } else {
            if (dist < 1.5) { riskColor = '#ef4444'; opacity = 0.45; }
            else if (dist < 2.5) { riskColor = '#f97316'; opacity = 0.35; }
            else if (dist < 4.0) { riskColor = '#eab308'; opacity = 0.25; }
            else if (dist < 6.0) { riskColor = '#3b82f6'; opacity = 0.15; }
          }
          
          if (riskColor) {
            state.gridData.push({
              lat,
              lng,
              latStep,
              lngStep,
              fillColor: riskColor,
              fillOpacity: opacity
            });
          }
        }
      }
    }
  }

  return state;
}
