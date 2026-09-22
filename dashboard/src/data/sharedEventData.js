// src/data/sharedEventData.js

export const SHARED_TIMESTAMP = '08 Sep 2026 · 23:50 IST';
export const CHAMOLI_EVENT_ID = 'VN-EVT-2026-0922-CHM';

export const SHARED_EVENTS = [
  // --------------------------------------------------
  // ACTIVE & DEVELOPING EVENTS
  // --------------------------------------------------
  {
    id: CHAMOLI_EVENT_ID,
    name: 'Chamoli Cloudburst Threat',
    hazard: 'Flash Flood',
    severity: 'HIGH',
    status: 'ACTIVE',
    location: 'Chamoli, Uttarakhand',
    coords: [30.41, 79.32],
    startedAt: 'Today, 14:30',
    expectedPeak: 'Today, 18:00',
    currentRisk: '78%',
    peakRisk: '85%',
    confidence: '82%',
    observedRainfall: '64 mm / 2 h',
    predictedProb: '82%',
    leadTime: 'T+2h 15m',
    affectedRegions: ['Chamoli', 'Nandprayag', 'Karnaprayag'],
    alertStatus: 'ISSUED',
    impact: {
      population: '~12,400',
      villages: '8',
      roads: '4',
      criticalSites: '2'
    },
    timeline: [
      { time: '14:30', label: 'Initial Detection' },
      { time: '15:15', label: 'Elevated Risk' },
      { time: '15:45', label: 'Risk Threshold' },
      { time: '16:00', label: 'Event Classified' },
      { time: '16:15', label: 'Warning Issued' },
      { time: 'CURRENT', label: 'Event Active' }
    ],
    riskEvolution: [
      { time: '14:00', risk: 22 },
      { time: '15:00', risk: 45 },
      { time: '16:00', risk: 68 },
      { time: '17:00', risk: 78 }
    ],
    summary: 'An intense convective system developed over Chamoli, producing heavy rainfall. VAYUNET detected strengthening atmospheric signals, indicating imminent flash flooding.',
    validation: null,
    takeaways: [
      { icon: 'target', title: 'Ongoing Tracking', desc: 'System is currently tracking intense moisture convergence over the upper Alaknanda basin.' }
    ]
  },
  {
    id: 'VN-EVT-2026-0922-JSM',
    name: 'Joshimath Rainfall',
    hazard: 'Heavy Rainfall',
    severity: 'MODERATE',
    status: 'DEVELOPING',
    location: 'Joshimath, Uttarakhand',
    coords: [30.556, 79.566],
    startedAt: 'Today, 16:00',
    expectedPeak: 'Tomorrow, 02:00',
    currentRisk: '45%',
    peakRisk: '65%',
    confidence: '79%',
    observedRainfall: '15 mm / 1 h',
    predictedProb: '65%',
    leadTime: 'T+4h 30m',
    affectedRegions: ['Joshimath', 'Tapovan'],
    alertStatus: 'PENDING',
    impact: {
      population: '~8,500',
      villages: '4',
      roads: '2',
      criticalSites: '1'
    },
    timeline: [
      { time: '16:00', label: 'Moisture surge detected' },
      { time: '16:45', label: 'Probability increasing' },
      { time: 'CURRENT', label: 'Monitoring development' }
    ],
    riskEvolution: [
      { time: '15:00', risk: 15 },
      { time: '16:00', risk: 25 },
      { time: '17:00', risk: 45 }
    ],
    summary: 'Steady accumulation of orographic precipitation is developing over Joshimath. The system is being monitored for potential escalation into a localized landslide threat.',
    validation: null,
    takeaways: [
      { icon: 'clock', title: 'Early Phase', desc: 'The event is still in the early developmental phase with moderate confidence.' }
    ]
  },

  // --------------------------------------------------
  // HISTORICAL EVENTS
  // --------------------------------------------------
  {
    id: 'VN-EVT-2021-0722-DHR',
    name: 'Dharamsala 2021',
    hazard: 'Cloudburst',
    severity: 'EXTREME',
    status: 'HISTORICAL',
    location: 'Dharamsala, Himachal Pradesh',
    coords: [32.2190, 76.3234],
    startedAt: '22 Jul 2021',
    expectedPeak: 'N/A',
    currentRisk: '0%',
    peakRisk: '95%',
    confidence: '100%',
    observedRainfall: '187 mm / 6 h',
    predictedProb: '74%',
    leadTime: 'T+4h 12m',
    affectedRegions: ['Kangra Valley', 'Manjhi Khad'],
    alertStatus: 'ARCHIVED',
    impact: {
      population: '~22,000',
      villages: '15',
      roads: '9',
      criticalSites: '4'
    },
    timeline: [
      { time: 'T-6h', label: 'Detection' },
      { time: 'T-4h', label: 'Prediction' },
      { time: 'T-2h', label: 'Warning' },
      { time: 'T-0', label: 'Impact' },
      { time: 'Post', label: 'Recovery' }
    ],
    riskEvolution: [
      { time: 'T-6h', risk: 35 },
      { time: 'T-4h', risk: 74 },
      { time: 'T-2h', risk: 92 },
      { time: 'T-0', risk: 95 },
      { time: 'T+2h', risk: 40 }
    ],
    summary: 'An intense cloudburst over Dharamsala triggered severe flash flooding along Manjhi Khad, causing significant damage in downstream areas. VAYUNET detected rapid CTT drop and high moisture convergence 4 hours prior to the event.',
    validation: {
      outcome: 'SUCCESS',
      badge: 'success',
      csi: '0.71',
      csiDesc: '(Above IMD baseline 0.52)',
      pod: '0.88',
      podDesc: 'High detection of convective core',
      far: '0.19',
      farDesc: 'Low false trigger rate'
    },
    takeaways: [
      { icon: 'check', title: 'Detection', desc: 'Rapid cloud-top cooling detected.' },
      { icon: 'clock', title: 'Lead Time', desc: '4.2 hours before observed impact.' },
      { icon: 'zap', title: 'Primary Drivers', desc: 'CTT cooling + moisture convergence.' },
      { icon: 'target', title: 'Outcome', desc: 'Flash flood subsequently observed.' }
    ]
  },
  {
    id: 'VN-EVT-2024-0730-WYD',
    name: 'Wayanad 2024',
    hazard: 'Heavy Rainfall',
    severity: 'CATASTROPHIC',
    status: 'HISTORICAL',
    location: 'Wayanad, Kerala',
    coords: [11.6016, 76.0827],
    startedAt: '30 Jul 2024',
    expectedPeak: 'N/A',
    currentRisk: '0%',
    peakRisk: '98%',
    confidence: '100%',
    observedRainfall: '228 mm / 6 h',
    predictedProb: '81%',
    leadTime: 'T+3h 05m',
    affectedRegions: ['Chooralmala', 'Meppadi'],
    alertStatus: 'ARCHIVED',
    impact: {
      population: '~45,000',
      villages: '22',
      roads: '18',
      criticalSites: '6'
    },
    timeline: [
      { time: 'T-6h', label: 'Detection' },
      { time: 'T-4h', label: 'Prediction' },
      { time: 'T-2h', label: 'Warning' },
      { time: 'T-0', label: 'Impact' },
      { time: 'Post', label: 'Recovery' }
    ],
    riskEvolution: [
      { time: 'T-6h', risk: 40 },
      { time: 'T-4h', risk: 81 },
      { time: 'T-2h', risk: 94 },
      { time: 'T-0', risk: 98 },
      { time: 'T+2h', risk: 60 }
    ],
    summary: 'Heavy atmospheric moisture surge combined with steep Western Ghats escarpment triggered catastrophic debris flows in Chooralmala and Meppadi.',
    validation: {
      outcome: 'PARTIAL',
      badge: 'partial',
      csi: '0.68',
      csiDesc: '(Well above persistence models)',
      pod: '0.91',
      podDesc: 'Detected extreme moisture plume',
      far: '0.22',
      farDesc: 'Minor boundary over-prediction'
    },
    takeaways: [
      { icon: 'check', title: 'Detection', desc: 'Extreme moisture saturation detected.' },
      { icon: 'clock', title: 'Lead Time', desc: '3.0 hours before slope failure.' },
      { icon: 'zap', title: 'Primary Drivers', desc: 'Soil pore pressure saturation.' },
      { icon: 'target', title: 'Outcome', desc: 'Catastrophic debris flow.' }
    ]
  },
  {
    id: 'VN-EVT-2023-0810-UTK',
    name: 'Uttarkashi 2023',
    hazard: 'Flash Flood',
    severity: 'HIGH',
    status: 'HISTORICAL',
    location: 'Uttarkashi, Uttarakhand',
    coords: [30.726, 78.435],
    startedAt: '10 Aug 2023',
    expectedPeak: 'N/A',
    currentRisk: '0%',
    peakRisk: '88%',
    confidence: '100%',
    observedRainfall: '142 mm / 3 h',
    predictedProb: '69%',
    leadTime: 'T+5h 08m',
    affectedRegions: ['Bhagirathi Basin'],
    alertStatus: 'ARCHIVED',
    impact: {
      population: '~9,200',
      villages: '6',
      roads: '3',
      criticalSites: '2'
    },
    timeline: [
      { time: 'T-6h', label: 'Detection' },
      { time: 'T-4h', label: 'Prediction' },
      { time: 'T-2h', label: 'Warning' },
      { time: 'T-0', label: 'Impact' },
      { time: 'Post', label: 'Recovery' }
    ],
    riskEvolution: [
      { time: 'T-6h', risk: 30 },
      { time: 'T-4h', risk: 69 },
      { time: 'T-2h', risk: 82 },
      { time: 'T-0', risk: 88 },
      { time: 'T+2h', risk: 20 }
    ],
    summary: 'Severe orographic flash flood triggered in Bhagirathi upper tributaries. VAYUNET model successfully tracked convective cloud train 5 hours ahead.',
    validation: {
      outcome: 'SUCCESS',
      badge: 'success',
      csi: '0.64',
      csiDesc: '(Exceeded regional benchmark)',
      pod: '0.82',
      podDesc: 'Accurate valley corridor mapping',
      far: '0.25',
      farDesc: 'Acceptable operational false rate'
    },
    takeaways: [
      { icon: 'check', title: 'Detection', desc: 'Convective cloud train tracked.' },
      { icon: 'clock', title: 'Lead Time', desc: '5.1 hours lead time.' },
      { icon: 'zap', title: 'Primary Drivers', desc: 'Multi-catchment orographic lifting.' },
      { icon: 'target', title: 'Outcome', desc: 'SDRF pre-positioned successfully.' }
    ]
  },
  {
    id: 'VN-EVT-2020-0923-MUM',
    name: 'Mumbai 2020',
    hazard: 'Heavy Rainfall',
    severity: 'HIGH',
    status: 'HISTORICAL',
    location: 'Greater Mumbai, Maharashtra',
    coords: [19.0760, 72.8777],
    startedAt: '23 Sep 2020',
    expectedPeak: 'N/A',
    currentRisk: '0%',
    peakRisk: '90%',
    confidence: '100%',
    observedRainfall: '118 mm / 4 h',
    predictedProb: '63%',
    leadTime: 'T+2h 15m',
    affectedRegions: ['Central Transit Arteries'],
    alertStatus: 'ARCHIVED',
    impact: {
      population: '~1.2M',
      villages: '0',
      roads: '45',
      criticalSites: '12'
    },
    timeline: [
      { time: 'T-6h', label: 'Detection' },
      { time: 'T-4h', label: 'Prediction' },
      { time: 'T-2h', label: 'Warning' },
      { time: 'T-0', label: 'Impact' },
      { time: 'Post', label: 'Recovery' }
    ],
    riskEvolution: [
      { time: 'T-6h', risk: 25 },
      { time: 'T-4h', risk: 63 },
      { time: 'T-2h', risk: 85 },
      { time: 'T-0', risk: 90 },
      { time: 'T+2h', risk: 50 }
    ],
    summary: 'Coastal squall line caused extreme localized inundation across central Mumbai transit arteries during high-tide confluence.',
    validation: {
      outcome: 'SUCCESS',
      badge: 'success',
      csi: '0.59',
      csiDesc: '(Above radar extrapolation)',
      pod: '0.76',
      podDesc: 'Captures coastal convergence',
      far: '0.29',
      farDesc: 'Higher urban noise environment'
    },
    takeaways: [
      { icon: 'check', title: 'Detection', desc: 'Coastal squall line identified.' },
      { icon: 'clock', title: 'Lead Time', desc: '2.2 hours before inundation.' },
      { icon: 'zap', title: 'Primary Drivers', desc: 'Storm surge + convective bands.' },
      { icon: 'target', title: 'Outcome', desc: 'Zero casualties, safe diversion.' }
    ]
  },
  {
    id: 'VN-EVT-2023-0615-BIP',
    name: 'Cyclone Biparjoy 2023',
    hazard: 'Cyclone',
    severity: 'EXTREME',
    status: 'HISTORICAL',
    location: 'Gujarat Coast',
    coords: [23.2383, 68.5683],
    startedAt: '15 Jun 2023',
    expectedPeak: 'N/A',
    currentRisk: '0%',
    peakRisk: '99%',
    confidence: '100%',
    observedRainfall: '250 mm / 24 h',
    predictedProb: '92%',
    leadTime: 'T+48h',
    affectedRegions: ['Jakhau Port', 'Kutch'],
    alertStatus: 'ARCHIVED',
    impact: {
      population: '~100,000+',
      villages: '120',
      roads: '85',
      criticalSites: '24'
    },
    timeline: [
      { time: 'T-72h', label: 'Detection' },
      { time: 'T-48h', label: 'Prediction' },
      { time: 'T-24h', label: 'Warning' },
      { time: 'T-0', label: 'Impact' },
      { time: 'Post', label: 'Recovery' }
    ],
    riskEvolution: [
      { time: 'T-72h', risk: 50 },
      { time: 'T-48h', risk: 92 },
      { time: 'T-24h', risk: 95 },
      { time: 'T-0', risk: 99 },
      { time: 'T+24h', risk: 30 }
    ],
    summary: 'Extremely Severe Cyclonic Storm Biparjoy made landfall near Jakhau Port. VAYUNET provided accurate track and intensity forecasts 48 hours in advance.',
    validation: {
      outcome: 'SUCCESS',
      badge: 'success',
      csi: '0.81',
      csiDesc: '(Highly accurate track)',
      pod: '0.94',
      podDesc: 'Excellent eye-wall tracking',
      far: '0.12',
      farDesc: 'Minimal false impact zone'
    },
    takeaways: [
      { icon: 'check', title: 'Detection', desc: 'Track established accurately.' },
      { icon: 'clock', title: 'Lead Time', desc: '48+ hours.' },
      { icon: 'zap', title: 'Primary Drivers', desc: 'Asymmetric Arabian Sea dynamics.' },
      { icon: 'target', title: 'Outcome', desc: 'Mass evacuation successful.' }
    ]
  }
];

export const SHARED_ALERTS = [
  {
    id: 'CAP-2041',
    eventId: CHAMOLI_EVENT_ID,
    hazard: 'Flash Flood',
    severity: 'HIGH',
    status: 'ACTIVE',
    location: 'Chamoli, Uttarakhand',
    affectedArea: '412 km²',
    issuedAt: SHARED_TIMESTAMP,
    validFrom: SHARED_TIMESTAMP,
    validUntil: '09 Sep 2026 · 03:50 IST',
    eta: '1h 45m',
    rainfall: '124 mm',
    confidence: '82%',
    coordinates: [30.41, 79.32],
    zoom: 9,
    title: 'CRITICAL: Severe Flash Flood Warning for Alaknanda Valley',
    description: 'Convective cloudburst signature detected upstream with peak precipitation rate of 124 mm. Sudden surge in river levels anticipated in downstream gorges.',
    instructions: 'Evacuate all low-lying riverbeds, temporary settlements, and ghats immediately. Restrict pedestrian transit across suspension bridges.',
    alertBasis: [
      'Flash Flood probability: 82%',
      'Predicted rainfall: 124 mm',
      'Risk threshold crossed (90%)',
      'Terrain susceptibility: HIGH',
      'Rapid IWV increase detected'
    ],
    targetAudience: ['General Public', 'Emergency Responders', 'District Administration'],
    dispatchChannels: ['NDMA / SACHET', 'State Control', 'Public Warning Portal', 'SMS'],
    deliveryStatus: { sent: 4200, delivered: 4150, failed: 50, pending: 0 },
    publicMessage: {
      en: '⚠ FLASH FLOOD WARNING: Chamoli, Uttarakhand. Heavy rainfall may cause sudden flooding in low-lying areas. Expected within 1h 45m. ACTION: Move to safer ground. Avoid rivers and streams. Valid until: 03:50 AM.',
      hi: '⚠ अचानक बाढ़ की चेतावनी: चमोली, उत्तराखंड। भारी बारिश के कारण निचले इलाकों में अचानक बाढ़ आ सकती है। कार्रवाई: सुरक्षित स्थानों पर जाएं। नदियों से दूर रहें।',
      or: '⚠ ଆକସ୍ମିକ ବନ୍ୟା ସତର୍କତା: ଚାମୋଲି, ଉତ୍ତରାଖଣ୍ଡ | ପ୍ରବଳ ବର୍ଷା ଯୋଗୁଁ ତଳିଆ ଅଞ୍ଚଳରେ ବନ୍ୟା ଆସିପାରେ | ଦୟାକରି ନିରାପଦ ସ୍ଥାନକୁ ଯାଆନ୍ତୁ |',
    },
    auditTrail: [
      { time: '11:45 PM', action: 'AI alert draft generated', operator: 'SYSTEM', status: 'SUCCESS' },
      { time: '11:48 PM', action: 'Operator edited alert', operator: 'OP-04', status: 'SUCCESS' },
      { time: '11:50 PM', action: 'Submitted for review', operator: 'OP-04', status: 'SUCCESS' },
      { time: '11:51 PM', action: 'Approved', operator: 'SUP-01', status: 'SUCCESS' },
      { time: '11:52 PM', action: 'CAP dispatched', operator: 'SUP-01', status: 'SUCCESS' }
    ]
  },
  {
    id: 'CAP-2042',
    eventId: 'VN-EVT-2026-0922-JSM',
    hazard: 'Heavy Rainfall',
    severity: 'MODERATE',
    status: 'DRAFT',
    location: 'Joshimath, Uttarakhand',
    affectedArea: '85 km²',
    issuedAt: 'N/A',
    validFrom: 'TBD',
    validUntil: 'TBD',
    eta: '2h 10m',
    rainfall: '85 mm',
    confidence: '75%',
    coordinates: [30.55, 79.56],
    zoom: 10,
    title: 'ADVISORY: Intense Rainfall and Landslip Risk',
    description: 'Continuous moderate-to-heavy rainfall maintaining elevated pore pressure across vulnerable slopes.',
    instructions: 'Monitor nullah discharge gauges. Keep night emergency shelter teams on standby.',
    alertBasis: [
      'Heavy Rainfall probability: 75%',
      'Saturated soil conditions detected',
      'Continuous rainfall rate: 25 mm/h'
    ],
    targetAudience: ['Emergency Responders', 'Local Authorities'],
    dispatchChannels: ['State Control', 'District DEOC'],
    deliveryStatus: { sent: 0, delivered: 0, failed: 0, pending: 0 },
    publicMessage: {
      en: '⚠ HEAVY RAIN ADVISORY: Joshimath. Intense rainfall expected. Avoid steep slopes and remain vigilant.',
      hi: '⚠ भारी बारिश की एडवाइजरी: जोशीमठ। भारी बारिश की संभावना है। सतर्क रहें।',
      or: '⚠ ପ୍ରବଳ ବର୍ଷା ପରାମର୍ଶ: ଜୋଶିମଠ | ପ୍ରବଳ ବର୍ଷା ହେବାର ସମ୍ଭାବନା ଅଛି | ସତର୍କ ରୁହନ୍ତୁ |',
    },
    auditTrail: [
      { time: '01:15 AM', action: 'AI alert draft generated', operator: 'SYSTEM', status: 'SUCCESS' }
    ]
  },
  {
    id: 'CAP-2043',
    eventId: 'VN-EVT-2020-0923-MUM',
    hazard: 'Thunderstorm',
    severity: 'MODERATE',
    status: 'PENDING_REVIEW',
    location: 'Greater Mumbai, Maharashtra',
    affectedArea: '210 km²',
    issuedAt: 'N/A',
    validFrom: '09 Sep 2026 · 01:00 IST',
    validUntil: '09 Sep 2026 · 05:00 IST',
    eta: '3h 00m',
    rainfall: '65 mm',
    confidence: '71%',
    coordinates: [19.076, 72.877],
    zoom: 10,
    title: 'ADVISORY: Severe Thunderstorm & Urban Waterlogging Risk',
    description: 'Organized convective line moving eastward from Arabian Sea. Gusty surface winds exceeding 65 km/h with localized street flooding.',
    instructions: 'Commuters advised to avoid subway underpasses and shoreline promenades. Pre-position dewatering mobile pump units.',
    alertBasis: [
      'Convective line detected',
      'High wind shear observed',
      'Rainfall intensity: 45 mm/hr'
    ],
    targetAudience: ['General Public', 'Municipal Corporation'],
    dispatchChannels: ['Public Warning Portal', 'Social Media', 'State Control'],
    deliveryStatus: { sent: 0, delivered: 0, failed: 0, pending: 0 },
    publicMessage: {
      en: '⚠ SEVERE THUNDERSTORM ADVISORY: Mumbai. Heavy rain and gusty winds expected. Avoid waterlogged areas.',
      hi: '⚠ गंभीर आंधी की एडवाइजरी: मुंबई। भारी बारिश और तेज हवाओं की संभावना।',
      or: '⚠ ପ୍ରବଳ ଘଡ଼ଘଡ଼ି ସହ ବର୍ଷା ପରାମର୍ଶ: ମୁମ୍ବାଇ | ପ୍ରବଳ ବର୍ଷା ଓ ପବନ ହେବାର ସମ୍ଭାବନା |',
    },
    auditTrail: [
      { time: '02:30 AM', action: 'AI alert draft generated', operator: 'SYSTEM', status: 'SUCCESS' },
      { time: '02:35 AM', action: 'Operator edited alert', operator: 'OP-02', status: 'SUCCESS' },
      { time: '02:38 AM', action: 'Submitted for review', operator: 'OP-02', status: 'SUCCESS' }
    ]
  }
];
