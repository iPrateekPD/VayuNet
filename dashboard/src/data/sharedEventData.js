// src/data/sharedEventData.js

export const SIMULATED_TIME = '22 Sep 2026, 23:52 IST';
export const CHAMOLI_EVENT_ID = 'VN-EVT-2026-0922-CHM';

export const mockDashboardStats = {
  events: {
    active: 1,
    developing: 2,
    resolved24h: 3,
    historical: 5
  },
  alerts: {
    active: 1,
    draft: 1,
    pendingReview: 1,
    dispatched24h: 1,
    expiringSoon: 0
  }
};

export const mockEvent = {
  id: CHAMOLI_EVENT_ID,
  name: 'Chamoli / Alaknanda Valley',
  hazard: 'Flash Flood Risk',
  severity: 'CRITICAL',
  status: 'ACTIVE',
  location: 'Chamoli District, Uttarakhand, India',
  coords: [30.41, 79.32],
  startedAt: '22 Sep 2026, 20:00 IST',
  expectedPeak: '+2h',
  currentRisk: '86%',
  peakRisk: '86%',
  confidence: '82%',
  observedRainfall: '96 mm',
  predictedProb: '82%',
  leadTime: '2h 15m',
  affectedRegions: ['Chamoli', 'Rudraprayag', 'Uttarkashi', 'Pauri Garhwal'],
  alertStatus: 'ACTIVE',
  impact: {
    population: '~48,000 people',
    area: '412 km²',
    villages: '45',
    roads: '12',
    criticalSites: '6'
  },
  lifecycle: [
    { state: 'Developing', status: 'past' },
    { state: 'Active', status: 'current' },
    { state: 'Weakening', status: 'future' },
    { state: 'Resolved', status: 'future' }
  ],
  riskEvolution: [
    { time: '20:00', risk: 41 },
    { time: '21:00', risk: 53 },
    { time: '22:00', risk: 68 },
    { time: '23:00', risk: 79 },
    { time: '23:52', risk: 86 }
  ],
  timeline: [
    { time: '20:00', label: 'Initial Detection' },
    { time: '22:00', label: 'Risk Elevated' },
    { time: '23:40', label: 'AI Alert Drafted' },
    { time: '23:52', label: 'Event Active (Current)' },
    { time: '+2h', label: 'Forecast Peak' }
  ]
};

// Also keep some minimal developing/historical mocks to satisfy the UI counts, if needed.
export const SHARED_EVENTS = [
  mockEvent,
  {
    id: 'VN-EVT-2026-0922-DEV1',
    name: 'Tehri Moisture Surge',
    hazard: 'Heavy Rainfall',
    severity: 'MODERATE',
    status: 'DEVELOPING',
    location: 'Tehri Garhwal',
    coords: [30.38, 78.48],
    currentRisk: '45%',
    peakRisk: '60%',
    confidence: '70%',
    alertStatus: 'PENDING',
    riskEvolution: [{time:'22:00', risk:20}, {time:'23:00', risk:35}, {time:'23:52', risk:45}]
  },
  {
    id: 'VN-EVT-2026-0922-DEV2',
    name: 'Pithoragarh Convective Cell',
    hazard: 'Thunderstorm',
    severity: 'MODERATE',
    status: 'DEVELOPING',
    location: 'Pithoragarh',
    coords: [29.58, 80.22],
    currentRisk: '38%',
    peakRisk: '55%',
    confidence: '65%',
    alertStatus: 'NONE',
    riskEvolution: [{time:'22:00', risk:10}, {time:'23:00', risk:25}, {time:'23:52', risk:38}]
  }
];

export const mockNowcastData = {
  timeseries: [
    {
      timeOffset: 'NOW',
      risks: { flashFlood: 72, composite: 75, heavyRainfall: 70, thunderstorm: 65, cloudburst: 60 },
      weather: {
        temperature: '18.4°C', rainfall: '42 mm/hr', wind: '24 km/h', pressure: '1007 hPa', humidity: '91%',
        cape: '2450 J/kg', iwv: '48 mm', windShear: '18 m/s', ctt: '-58°C'
      }
    },
    {
      timeOffset: '+1h',
      risks: { flashFlood: 76, composite: 80, heavyRainfall: 75, thunderstorm: 68, cloudburst: 65 },
      weather: {
        temperature: '18.1°C', rainfall: '55 mm/hr', wind: '28 km/h', pressure: '1006 hPa', humidity: '93%',
        cape: '2550 J/kg', iwv: '51 mm', windShear: '20 m/s', ctt: '-61°C'
      }
    },
    {
      timeOffset: '+2h',
      risks: { flashFlood: 82, composite: 86, heavyRainfall: 79, thunderstorm: 71, cloudburst: 68 },
      weather: {
        temperature: '17.8°C', rainfall: '70 mm/hr', wind: '35 km/h', pressure: '1005 hPa', humidity: '95%',
        cape: '2650 J/kg', iwv: '54 mm', windShear: '22 m/s', ctt: '-64°C'
      }
    },
    {
      timeOffset: '+3h',
      risks: { flashFlood: 79, composite: 80, heavyRainfall: 72, thunderstorm: 65, cloudburst: 60 },
      weather: {
        temperature: '17.9°C', rainfall: '50 mm/hr', wind: '30 km/h', pressure: '1006 hPa', humidity: '93%',
        cape: '2300 J/kg', iwv: '49 mm', windShear: '18 m/s', ctt: '-58°C'
      }
    },
    {
      timeOffset: '+4h',
      risks: { flashFlood: 68, composite: 70, heavyRainfall: 60, thunderstorm: 55, cloudburst: 50 },
      weather: {
        temperature: '18.2°C', rainfall: '30 mm/hr', wind: '25 km/h', pressure: '1007 hPa', humidity: '90%',
        cape: '1900 J/kg', iwv: '45 mm', windShear: '15 m/s', ctt: '-50°C'
      }
    },
    {
      timeOffset: '+5h',
      risks: { flashFlood: 55, composite: 60, heavyRainfall: 45, thunderstorm: 40, cloudburst: 35 },
      weather: {
        temperature: '18.5°C', rainfall: '15 mm/hr', wind: '20 km/h', pressure: '1008 hPa', humidity: '85%',
        cape: '1500 J/kg', iwv: '40 mm', windShear: '12 m/s', ctt: '-40°C'
      }
    },
    {
      timeOffset: '+6h',
      risks: { flashFlood: 42, composite: 45, heavyRainfall: 30, thunderstorm: 25, cloudburst: 20 },
      weather: {
        temperature: '18.8°C', rainfall: '5 mm/hr', wind: '15 km/h', pressure: '1009 hPa', humidity: '80%',
        cape: '1000 J/kg', iwv: '35 mm', windShear: '10 m/s', ctt: '-30°C'
      }
    }
  ],
  highestForecastRisk: 'Flash Flood — 82%',
  highestRiskRegion: 'Chamoli',
  affectedDistricts: '04',
  expectedPeak: '+2h',
  activeForecasts: [
    { label: 'Flash Flood', value: '82%' },
    { label: 'Heavy Rainfall', value: '79%' },
    { label: 'Thunderstorm', value: '71%' },
    { label: 'Cloudburst', value: '68%' }
  ]
};

export const mockAnalysisData = {
  eventId: CHAMOLI_EVENT_ID,
  location: 'Chamoli, Uttarakhand',
  timestamp: SIMULATED_TIME,
  currentSituation: {
    hazard: 'Flash Flood Risk',
    riskLevel: 'HIGH'
  },
  aiAnalysis: {
    confidence: '82%',
    risk: '85%',
    likelyOnset: 'T+2h 15m',
    explanation: 'Rapid moisture accumulation combined with strong convective instability, falling cloud-top temperatures and terrain-driven precipitation enhancement indicates an elevated probability of intense rainfall and flash flooding across the Alaknanda Valley.'
  },
  contributingFactors: [
    { label: 'Cloud-Top Temperature Drop', value: 38 },
    { label: 'Moisture / IWV', value: 26 },
    { label: 'CAPE', value: 22 },
    { label: 'Terrain / Orography', value: 8 },
    { label: 'Wind Shear', value: 6 }
  ],
  atmosphericConditions: [
    { label: 'CAPE', value: '2450 J/kg', severity: 'HIGH' },
    { label: 'IWV', value: '48 mm', severity: 'HIGH' },
    { label: 'Vertical Wind Shear', value: '18 m/s', severity: 'MODERATE' },
    { label: 'CTT Drop Rate', value: '-12°C/hr', severity: 'HIGH' }
  ],
  temporalTrends: {
    cape: [{time:'21:00', val: 2100}, {time:'22:00', val: 2250}, {time:'23:52', val: 2450}],
    iwv: [{time:'21:00', val: 39}, {time:'22:00', val: 44}, {time:'23:52', val: 48}],
    ctt: [{time:'21:00', val: -46}, {time:'22:00', val: -52}, {time:'23:52', val: -58}],
    rainfall: [{time:'21:00', val: 18}, {time:'22:00', val: 31}, {time:'23:52', val: 42}]
  }
};

export const mockAlert = {
  id: 'VN-ALT-2026-0922-CHM-01',
  eventId: CHAMOLI_EVENT_ID,
  title: 'CRITICAL: Severe Flash Flood Warning for Alaknanda Valley',
  status: 'ACTIVE',
  workflowStatus: 'DISPATCHED',
  hazard: 'Flash Flood Risk',
  severity: 'HIGH',
  location: 'Chamoli, Uttarakhand',
  affectedArea: '412 km²',
  issuedAt: SIMULATED_TIME,
  validFrom: SIMULATED_TIME,
  validUntil: '09 Sep 2026 · 03:50 IST',
  eta: '1h 45m',
  rainfall: '124 mm',
  confidence: '82%',
  coordinates: [30.41, 79.32],
  zoom: 9,
  description: 'Intense rainfall and rapid runoff are expected across parts of Chamoli district and the Alaknanda Valley. Flash flooding and sudden rises in river and stream levels are possible during the next 2–3 hours.',
  instructions: 'Residents and visitors in low-lying areas, river corridors and landslide-prone zones should move to safer locations and avoid crossing flooded roads or streams.',
  alertBasis: [
    'Flash Flood Probability: 82%',
    'Risk Threshold: 90%',
    'Rapid IWV Increase: DETECTED',
    'Predicted Rainfall: 124 mm',
    'Terrain Susceptibility: HIGH',
    'Convective Instability: HIGH',
    'Radar/Satellite Confirmation: DETECTED'
  ],
  publicMessage: {
    en: "⚠ FLASH FLOOD WARNING\n\nALAKNANDA VALLEY\nCHAMOLI, UTTARAKHAND\n\nSEVERITY:\nCRITICAL\n\nEXPECTED:\nWithin 1–2 hours\n\nHeavy rainfall and rapid runoff may cause sudden flooding in rivers, streams and low-lying areas.\n\nACTION:\nMove to safer ground.\nAvoid riverbanks and flooded roads.\nFollow instructions from local authorities.",
    hi: "⚠ अचानक बाढ़ की चेतावनी\n\nअलकनंदा घाटी\nचमोली, उत्तराखंड\n\nगंभीरता: अत्यंत गंभीर\n\nसंभावना: 1-2 घंटे के भीतर\n\nभारी बारिश और तेज बहाव के कारण नदियों और निचले इलाकों में अचानक बाढ़ आ सकती है।\n\nकार्रवाई:\nसुरक्षित स्थानों पर जाएं।\nनदियों और जलमग्न सड़कों से दूर रहें।\nस्थानीय प्रशासन के निर्देशों का पालन करें।",
    or: "⚠ ଆକସ୍ମିକ ବନ୍ୟା ସତର୍କତା: ଚାମୋଲି, ଉତ୍ତରାଖଣ୍ଡ | ପ୍ରବଳ ବର୍ଷା ଯୋଗୁଁ ତଳିଆ ଅଞ୍ଚଳରେ ବନ୍ୟା ଆସିପାରେ | ଦୟାକରି ନିରାପଦ ସ୍ଥାନକୁ ଯାଆନ୍ତୁ |"
  },
  targetAudience: [
    'General Public', 
    'Emergency Responders', 
    'District Administration', 
    'Local Authorities', 
    'Vulnerable Communities'
  ],
  dispatchChannels: [
    'Public Warning Portal', 
    'Web Dashboard', 
    'SMS', 
    'Push Notification', 
    'NDMA / SACHET', 
    'State Control Room', 
    'District DEOC'
  ],
  deliveryStatus: { sent: 4200, delivered: 4150, failed: 50, pending: 0 },
  auditTrail: [
    { time: '23:40', action: 'AI alert draft generated', operator: 'VAYUNET AI Engine', status: 'SUCCESS' },
    { time: '23:43', action: 'Operator edited alert', operator: 'VAYUNET Operator', status: 'SUCCESS' },
    { time: '23:47', action: 'Submitted for review', operator: 'VAYUNET Operator', status: 'SUCCESS' },
    { time: '23:51', action: 'Alert approved', operator: 'District Control Operator', status: 'SUCCESS' },
    { time: '23:54', action: 'CAP alert dispatched', operator: 'System', status: 'SUCCESS' }
  ]
};

export const SHARED_ALERTS = [
  mockAlert,
  {
    id: 'VN-ALT-2026-0922-DEV1',
    eventId: 'VN-EVT-2026-0922-DEV1',
    title: 'DRAFT: Advisory for Heavy Rainfall in Tehri',
    status: 'DRAFT',
    workflowStatus: 'DRAFT',
    severity: 'MODERATE',
    hazard: 'Rainfall',
    location: 'Tehri District, Uttarakhand',
    affectedArea: '150 km²',
    issuedAt: 'N/A',
    validFrom: 'TBD',
    validUntil: 'TBD',
    eta: '3h 30m',
    rainfall: '55 mm',
    confidence: '70%',
    coordinates: [30.38, 78.48],
    zoom: 9,
    description: 'Moderate to heavy rainfall is expected in isolated places.',
    instructions: 'Commuters should avoid unnecessary travel during heavy showers.',
    alertBasis: ['Heavy Rainfall probability: 70%', 'Predicted rainfall: 55 mm'],
    targetAudience: ['General Public'],
    dispatchChannels: ['App', 'SMS'],
    deliveryStatus: { sent: 0, delivered: 0, failed: 0, pending: 0 },
    publicMessage: {
      en: '⚠ ADVISORY: Heavy Rainfall in Tehri. Drive carefully.',
      hi: '⚠ एडवाइजरी: टिहरी में भारी बारिश। सावधानी से वाहन चलाएं।',
      or: ''
    },
    auditTrail: [
      { time: '04:15 AM', action: 'AI alert draft generated', operator: 'SYSTEM', status: 'SUCCESS' }
    ]
  },
  {
    id: 'VN-ALT-2026-0922-DEV2',
    eventId: 'VN-EVT-2026-0922-DEV2',
    title: 'REVIEW: Potential Thunderstorm warning for Pithoragarh',
    status: 'PENDING_REVIEW',
    workflowStatus: 'PENDING REVIEW',
    severity: 'HIGH',
    hazard: 'Thunderstorm',
    location: 'Pithoragarh District, Uttarakhand',
    affectedArea: '80 km²',
    issuedAt: 'N/A',
    validFrom: 'TBD',
    validUntil: 'TBD',
    eta: '2h 00m',
    rainfall: '45 mm',
    confidence: '85%',
    coordinates: [29.58, 80.22],
    zoom: 10,
    description: 'Thunderstorms with lightning and gusty winds likely in the region.',
    instructions: 'Stay indoors during lightning. Unplug electronic devices.',
    alertBasis: ['Convective Activity: HIGH', 'Lightning probability: 85%'],
    targetAudience: ['General Public', 'Emergency Responders'],
    dispatchChannels: ['App', 'SMS', 'CAP'],
    deliveryStatus: { sent: 0, delivered: 0, failed: 0, pending: 0 },
    publicMessage: {
      en: '⚠ WARNING: Thunderstorms expected in Pithoragarh. Stay indoors.',
      hi: '⚠ चेतावनी: पिथौरागढ़ में आंधी-तूफान। घर के अंदर रहें।',
      or: ''
    },
    auditTrail: [
      { time: '05:00 AM', action: 'AI alert draft generated', operator: 'SYSTEM', status: 'SUCCESS' },
      { time: '05:10 AM', action: 'Submitted for review', operator: 'OP-02', status: 'SUCCESS' }
    ]
  }
];
