/**
 * VAYUNET Weather & Map Provider Architecture
 * Sovereign Indian Meteorological Data Service (MoES / NCMRWF / IMD / ISRO MOSDAC)
 * Subcontinent-wide multi-scale meteorological fields, radar composites, synoptic pressure systems,
 * and Doppler Weather Radar (DWR) infrastructure.
 */

// Base tile providers
export const BASE_MAP_PROVIDERS = {
  dark: {
    name: 'Esri World Dark Gray Canvas',
    url: import.meta.env.VITE_MAP_TILE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
    maxZoom: 16,
  },
  satellite: {
    name: 'Esri World Imagery',
    url: import.meta.env.VITE_MAP_SATELLITE_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 18,
  },
  terrain: {
    name: 'Esri World Physical / Terrain',
    url: import.meta.env.VITE_MAP_TERRAIN_URL || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: US National Park Service',
    maxZoom: 14,
  },
};

// Weather layer catalog
export const WEATHER_LAYERS = [
  {
    id: 'precipitation',
    label: 'Precipitation',
    unit: 'dBZ / mm/hr',
    description: 'IMD Doppler Radar composite & quantitative precipitation estimate',
    hasLegend: true,
  },
  {
    id: 'cloud_tops',
    label: 'Cloud Tops',
    unit: '°C CTT',
    description: 'INSAT-3D/3DR Multispectral Thermal IR cloud top temperature',
    hasLegend: true,
  },
  {
    id: 'lightning',
    label: 'Lightning',
    unit: 'strikes/15min',
    description: 'ISRO/IITM Lightning Location Network & optical flash detections',
    hasLegend: true,
  },
  {
    id: 'wind',
    label: 'Wind',
    unit: 'knots (850 hPa)',
    description: 'NCMRWF IMDAA boundary-layer wind vectors & streamlines',
    hasLegend: true,
  },
  {
    id: 'terrain',
    label: 'Terrain',
    unit: 'm AMSL',
    description: 'ISRO CartoDEM 30m high-resolution digital elevation model',
    hasLegend: false,
  },
  {
    id: 'satellite',
    label: 'Satellite',
    unit: 'Visible/IR',
    description: 'INSAT-3D/3DR Multispectral Geostationary Earth Observation',
    hasLegend: false,
  },
];

// Operational Primary Hazard Watch Markers
export const REGIONAL_HAZARDS = [
  {
    id: 'uttarakhand',
    name: 'Uttarakhand',
    coords: [30.38, 79.32],
    risk: 'High Risk',
    riskClass: 'pin-risk-high',
    hazard: 'Flash Flood',
    hazardType: 'flood',
    eta: 'ETA 2 – 4 h',
    dotColor: '#ef4444',
    basin: 'Alaknanda / Mandakini Basin',
    details: 'CartoDEM D8 slope convergence + intense precipitation pulse',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    coords: [19.076, 72.8777],
    risk: 'Moderate',
    riskClass: 'pin-risk-moderate',
    hazard: 'Thunderstorm',
    hazardType: 'thunderstorm',
    eta: 'ETA 3 – 5 h',
    dotColor: '#f59e0b',
    basin: 'Konkan Coastline',
    details: 'High CAPE (>2200 J/kg) squall line approaching from Arabian Sea',
  },
  {
    id: 'wayanad',
    name: 'Wayanad',
    coords: [11.6854, 76.132],
    risk: 'High Risk',
    riskClass: 'pin-risk-high',
    hazard: 'Cloudburst',
    hazardType: 'cloudburst',
    eta: 'ETA 1 – 3 h',
    dotColor: '#ef4444',
    basin: 'Western Ghats Ridge',
    details: 'Extreme localized rainfall (>110 mm/hr) over high orographic relief',
  },
];

// Official IMD Doppler Weather Radar (DWR) Network
export const IMD_DWR_NETWORK = [
  { id: 'dwr-del', name: 'Delhi (Mausam Bhavan)', coords: [28.589, 77.221], band: 'S-Band Polarimetric', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-mum', name: 'Mumbai (Colaba)', coords: [18.906, 72.814], band: 'S-Band Polarimetric', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-kol', name: 'Kolkata Port', coords: [22.532, 88.324], band: 'S-Band Polarimetric', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-che', name: 'Chennai (Port)', coords: [13.082, 80.292], band: 'S-Band Polarimetric', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-koc', name: 'Kochi (Naval Base)', coords: [9.943, 76.267], band: 'C-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-viz', name: 'Visakhapatnam (Dolphin\'s Nose)', coords: [17.683, 83.298], band: 'S-Band Polarimetric', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-par', name: 'Paradip Port', coords: [20.316, 86.611], band: 'S-Band Polarimetric', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-che2', name: 'Cherrapunji (Sohra)', coords: [25.274, 91.732], band: 'C-Band Polarimetric', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-sri', name: 'Srinagar (Pir Panjal)', coords: [34.083, 74.797], band: 'X-Band Mountain Radar', rangeKm: 150, status: 'Scanning 0.5°–24.0°' },
  { id: 'dwr-muk', name: 'Mukteshwar (Kumaon Hills)', coords: [29.472, 79.652], band: 'C-Band Orographic', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-bho', name: 'Bhopal (Central IMD)', coords: [23.259, 77.412], band: 'S-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-nag', name: 'Nagpur (Sonegaon)', coords: [21.145, 79.088], band: 'S-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-pat', name: 'Patna (Gangetic Basin)', coords: [25.609, 85.101], band: 'S-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-moh', name: 'Mohanbari (Dibrugarh)', coords: [27.483, 95.021], band: 'S-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-bhu', name: 'Bhuj (Kutch Coast)', coords: [23.242, 69.666], band: 'S-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-tri', name: 'Thiruvananthapuram', coords: [8.524, 76.936], band: 'C-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-aga', name: 'Agartala (Tripura)', coords: [23.831, 91.286], band: 'C-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
  { id: 'dwr-jai', name: 'Jaipur (Sanganer)', coords: [26.912, 75.787], band: 'S-Band Doppler', rangeKm: 250, status: 'Scanning 0.5°–19.5°' },
];

// National Automatic Weather Station (AWS) Network across Major Indian Hubs
export const NATIONAL_AWS_STATIONS = [
  { id: 'aws-del', name: 'New Delhi (Safdarjung)', coords: [28.584, 77.206], temp: '31.4°C', rain: '14 mm/h', pressure: '1002 hPa', humidity: '78%', wind: 'ENE 14 km/h', status: 'Moderate Rain' },
  { id: 'aws-mum', name: 'Mumbai (Santacruz)', coords: [19.089, 72.865], temp: '28.2°C', rain: '68 mm/h', pressure: '1001 hPa', humidity: '94%', wind: 'WSW 34 km/h', status: 'Heavy Rain / Squall' },
  { id: 'aws-kol', name: 'Kolkata (Alipore)', coords: [22.532, 88.331], temp: '29.1°C', rain: '42 mm/h', pressure: '998 hPa', humidity: '89%', wind: 'SE 24 km/h', status: 'Convective Rain' },
  { id: 'aws-blr', name: 'Bengaluru (HAL)', coords: [12.951, 77.668], temp: '24.5°C', rain: '8 mm/h', pressure: '1004 hPa', humidity: '72%', wind: 'W 18 km/h', status: 'Scattered Showers' },
  { id: 'aws-chn', name: 'Chennai (Meenambakkam)', coords: [12.994, 80.180], temp: '32.8°C', rain: '3 mm/h', pressure: '1004 hPa', humidity: '68%', wind: 'SW 16 km/h', status: 'Partly Cloudy' },
  { id: 'aws-ddn', name: 'Dehradun (FRI)', coords: [30.342, 77.998], temp: '22.4°C', rain: '84 mm/h', pressure: '996 hPa', humidity: '96%', wind: 'NE 26 km/h', status: 'Cloudburst Warning' },
  { id: 'aws-gau', name: 'Guwahati (Borjhar)', coords: [26.106, 91.585], temp: '27.2°C', rain: '58 mm/h', pressure: '999 hPa', humidity: '92%', wind: 'E 18 km/h', status: 'Heavy Rain' },
  { id: 'aws-bhu', name: 'Bhubaneswar (Airport)', coords: [20.252, 85.817], temp: '28.6°C', rain: '48 mm/h', pressure: '999 hPa', humidity: '91%', wind: 'SSE 28 km/h', status: 'Coastal Convection' },
  { id: 'aws-ahm', name: 'Ahmedabad (Airport)', coords: [23.073, 72.626], temp: '33.5°C', rain: '6 mm/h', pressure: '1001 hPa', humidity: '64%', wind: 'WSW 22 km/h', status: 'Overcast' },
  { id: 'aws-cok', name: 'Kochi (Naval Base)', coords: [9.957, 76.273], temp: '26.8°C', rain: '74 mm/h', pressure: '1003 hPa', humidity: '98%', wind: 'WNW 28 km/h', status: 'Very Heavy Rain' },
  { id: 'aws-sxi', name: 'Srinagar (Airport)', coords: [33.987, 74.774], temp: '18.9°C', rain: '18 mm/h', pressure: '1008 hPa', humidity: '82%', wind: 'N 12 km/h', status: 'Light Rain' },
  { id: 'aws-hyd', name: 'Hyderabad (Begumpet)', coords: [17.453, 78.467], temp: '27.4°C', rain: '22 mm/h', pressure: '1003 hPa', humidity: '78%', wind: 'W 20 km/h', status: 'Convective Cell' },
  { id: 'aws-pat', name: 'Patna (Airport)', coords: [25.591, 85.088], temp: '30.2°C', rain: '28 mm/h', pressure: '1000 hPa', humidity: '84%', wind: 'ESE 16 km/h', status: 'Thundershower' },
  { id: 'aws-sml', name: 'Shimla (Ridge)', coords: [31.104, 77.173], temp: '16.5°C', rain: '46 mm/h', pressure: '998 hPa', humidity: '94%', wind: 'ENE 20 km/h', status: 'Hill Thunderstorm' },
];

// Synoptic Meteorological Features across India (Monsoon Trough, Pressure Lows, Isobars)
export const SYNOPTIC_PRESSURE_SYSTEM = {
  monsoonTrough: [
    [29.5, 73.2], [28.4, 76.1], [26.8, 79.5], [25.4, 82.8], [23.9, 86.2], [22.4, 88.6], [20.8, 90.5]
  ],
  lowCenter: {
    coords: [20.4, 88.6],
    pressure: '998 hPa',
    label: 'L (998 hPa)',
    title: 'Monsoon Depression Low · Bay of Bengal',
  },
  isobars: [
    {
      value: '998 hPa',
      coords: [
        [21.8, 86.8], [21.9, 88.5], [21.2, 90.2], [19.8, 89.8], [19.2, 87.8], [20.2, 86.5], [21.8, 86.8]
      ],
      labelPos: [21.9, 88.5],
    },
    {
      value: '1000 hPa',
      coords: [
        [24.5, 84.0], [23.8, 87.5], [23.0, 90.8], [20.8, 92.2], [18.2, 89.5], [17.5, 86.0], [18.8, 83.5], [21.5, 83.2], [24.5, 84.0]
      ],
      labelPos: [23.8, 87.5],
    },
    {
      value: '1002 hPa',
      coords: [
        [28.2, 75.0], [26.5, 78.5], [25.2, 82.0], [23.5, 85.0], [21.5, 82.5], [18.5, 80.0], [16.5, 77.5], [17.0, 74.5], [19.5, 73.0], [22.8, 71.5], [25.5, 71.8], [28.2, 75.0]
      ],
      labelPos: [26.5, 78.5],
    },
    {
      value: '1004 hPa',
      coords: [
        [15.5, 73.5], [14.0, 76.5], [13.2, 80.5], [14.8, 83.5], [15.2, 86.5], [12.5, 84.0], [11.0, 80.0], [11.2, 76.0], [13.2, 74.0], [15.5, 73.5]
      ],
      labelPos: [13.2, 80.5],
    },
    {
      value: '1006 hPa',
      coords: [
        [9.5, 74.5], [8.0, 77.5], [7.8, 81.5], [9.2, 83.5], [8.0, 85.5], [6.8, 82.0], [6.5, 78.0], [7.5, 75.5], [9.5, 74.5]
      ],
      labelPos: [8.0, 77.5],
    },
  ],
};

// Atmospheric Boundary-Layer Wind Streamlines across Subcontinent
export const WIND_STREAMLINES = [
  // Arabian Sea Low-Level Jet (LLJ) 32–38 kts
  { path: [[11.0, 64.0], [12.5, 68.0], [14.2, 72.0], [15.8, 74.5]], speed: 36, label: '36 kts (W-SW)' },
  { path: [[13.0, 65.0], [14.8, 69.0], [16.5, 72.5], [18.2, 73.8]], speed: 34, label: '34 kts (WSW)' },
  { path: [[15.0, 66.0], [16.8, 70.0], [18.5, 72.8], [19.8, 74.0]], speed: 32, label: '32 kts (WSW)' },
  { path: [[17.0, 67.0], [18.8, 70.8], [20.2, 72.5], [21.5, 73.5]], speed: 28, label: '28 kts (SW)' },

  // Peninsular Cross-Over into Bay of Bengal 24 kts
  { path: [[13.5, 75.0], [14.2, 77.5], [14.8, 80.5], [15.5, 84.0]], speed: 24, label: '24 kts (W)' },
  { path: [[11.5, 76.5], [12.0, 78.8], [12.6, 81.5], [13.5, 85.0]], speed: 22, label: '22 kts (W)' },

  // Bay of Bengal Cyclonic Curl 26 kts
  { path: [[14.0, 85.0], [16.5, 87.2], [19.0, 88.5], [21.2, 88.8]], speed: 26, label: '26 kts (S-SE)' },
  { path: [[16.0, 88.0], [18.5, 89.8], [21.0, 90.5], [22.8, 89.5]], speed: 28, label: '28 kts (SE)' },
  { path: [[21.5, 91.0], [22.8, 89.2], [22.5, 87.0], [21.0, 85.5]], speed: 22, label: '22 kts (E-NE)' },

  // Gangetic Valley Inflow (Easterlies) 16 kts
  { path: [[23.5, 88.5], [24.8, 85.2], [26.0, 82.0], [27.5, 78.5]], speed: 18, label: '18 kts (ESE)' },
  { path: [[25.5, 87.0], [26.5, 83.5], [27.8, 80.0], [28.8, 77.0]], speed: 16, label: '16 kts (E)' },
  { path: [[27.0, 85.0], [28.0, 81.5], [29.2, 78.0], [30.2, 75.5]], speed: 14, label: '14 kts (E-SE)' },
];

// Multi-step model forecast scenarios across India (0 to 5 for Now -> +6h)
export const FORECAST_TIME_STEPS = [
  { step: 0, label: 'Now', offset: '+0h', validTime: '20:42 IST' },
  { step: 1, label: '+1h', offset: '+1h', validTime: '21:42 IST' },
  { step: 2, label: '+2h', offset: '+2h', validTime: '22:42 IST' },
  { step: 3, label: '+3h', offset: '+3h', validTime: '23:42 IST' },
  { step: 4, label: '+4h', offset: '+4h', validTime: '00:42 IST' },
  { step: 5, label: '+6h', offset: '+6h', validTime: '02:42 IST' },
];

// Comprehensive Nationwide Subcontinent Hazard Data per Forecast Step
export const FORECAST_HAZARD_ZONES = {
  // Step 0: Now (Subcontinent-wide rich radar mosaic)
  0: {
    thunderstorm: [
      { coords: [[18.6, 72.3], [19.6, 72.5], [19.5, 73.4], [18.5, 73.2]], prob: 0.72, label: 'Mumbai-Thane Squall Line' },
      { coords: [[25.4, 91.2], [26.4, 91.4], [26.2, 92.5], [25.3, 92.3]], prob: 0.78, label: 'Meghalaya-Cherrapunji Front' },
      { coords: [[21.2, 86.2], [22.2, 86.4], [22.0, 87.5], [21.0, 87.2]], prob: 0.65, label: 'Odisha Coastal Cluster' },
      { coords: [[22.8, 88.0], [23.5, 88.2], [23.3, 89.2], [22.6, 89.0]], prob: 0.68, label: 'Gangetic Bengal Inflow' },
      { coords: [[28.3, 76.8], [29.0, 77.0], [28.8, 77.8], [28.1, 77.6]], prob: 0.54, label: 'Delhi-NCR Convective Cell' },
    ],
    cloudburst: [
      { coords: [[11.45, 75.85], [11.90, 75.95], [11.85, 76.40], [11.40, 76.30]], prob: 0.82, label: 'Wayanad Ghat Core' },
      { coords: [[30.15, 79.05], [30.65, 79.10], [30.60, 79.55], [30.10, 79.50]], prob: 0.74, label: 'Rudraprayag-Chamoli High Ridge' },
    ],
    flood: [
      { coords: [[30.05, 78.95], [30.55, 79.00], [30.50, 79.60], [30.00, 79.55]], prob: 0.62, label: 'Alaknanda Catchment Inundation' },
      { coords: [[11.30, 75.70], [11.65, 75.75], [11.60, 76.20], [11.25, 76.15]], prob: 0.58, label: 'Chaliyar River Basin' },
    ],
    // High-density nationwide Doppler radar composite (24+ cells covering entire subcontinent)
    radarIntensity: [
      // 1. Western Ghats & Konkan Arc
      { center: [8.52, 76.94], radius: 65000, intensity: 52, dbz: 44, color: '#f59e0b', level: 'Heavy', region: 'Trivandrum Coast' },
      { center: [9.95, 76.27], radius: 80000, intensity: 74, dbz: 50, color: '#ef4444', level: 'Very Heavy', region: 'Kochi-Idukki Foothills' },
      { center: [11.68, 76.13], radius: 85000, intensity: 110, dbz: 58, color: '#dc2626', level: 'Cloudburst Trigger', region: 'Wayanad Mountain Core' },
      { center: [12.91, 74.85], radius: 75000, intensity: 62, dbz: 46, color: '#f97316', level: 'Heavy', region: 'Mangaluru-Udupi Ghats' },
      { center: [15.35, 73.95], radius: 70000, intensity: 48, dbz: 42, color: '#f59e0b', level: 'Moderate-Heavy', region: 'Goa Coastal Belt' },
      { center: [16.99, 73.31], radius: 65000, intensity: 44, dbz: 40, color: '#f59e0b', level: 'Moderate', region: 'Ratnagiri Coast' },
      { center: [19.08, 72.88], radius: 95000, intensity: 82, dbz: 52, color: '#ef4444', level: 'Very Heavy', region: 'Mumbai Urban Core' },
      { center: [20.55, 72.90], radius: 70000, intensity: 54, dbz: 45, color: '#f97316', level: 'Heavy', region: 'Daman-Surat Convergence' },

      // 2. Central India Monsoon Trough
      { center: [22.72, 75.86], radius: 80000, intensity: 42, dbz: 39, color: '#84cc16', level: 'Moderate', region: 'Indore-Malwa Plateau' },
      { center: [23.26, 77.41], radius: 85000, intensity: 48, dbz: 42, color: '#f59e0b', level: 'Moderate-Heavy', region: 'Bhopal Trough Line' },
      { center: [23.18, 79.98], radius: 75000, intensity: 56, dbz: 46, color: '#f97316', level: 'Heavy', region: 'Jabalpur Catchment' },
      { center: [21.15, 79.09], radius: 80000, intensity: 46, dbz: 41, color: '#f59e0b', level: 'Moderate', region: 'Nagpur-Vidarbha Cell' },
      { center: [21.25, 81.63], radius: 85000, intensity: 58, dbz: 47, color: '#f97316', level: 'Heavy', region: 'Raipur-Mahanadi Basin' },
      { center: [23.34, 85.31], radius: 75000, intensity: 64, dbz: 48, color: '#ef4444', level: 'Heavy Convective', region: 'Ranchi Plateau' },

      // 3. Bay of Bengal Depressive Spiral & East Coast
      { center: [20.4, 88.6], radius: 125000, intensity: 92, dbz: 54, color: '#ef4444', level: 'Depression Core', region: 'Head Bay of Bengal' },
      { center: [19.81, 85.83], radius: 85000, intensity: 68, dbz: 49, color: '#ef4444', level: 'Heavy', region: 'Puri-Chilika Coast' },
      { center: [20.30, 86.61], radius: 80000, intensity: 72, dbz: 50, color: '#ef4444', level: 'Very Heavy', region: 'Paradip Port' },
      { center: [21.49, 86.93], radius: 75000, intensity: 62, dbz: 47, color: '#f97316', level: 'Heavy', region: 'Balasore Coastal Cell' },
      { center: [22.57, 88.36], radius: 90000, intensity: 65, dbz: 48, color: '#ef4444', level: 'Very Heavy', region: 'Kolkata-Howrah Metro' },
      { center: [21.90, 89.10], radius: 95000, intensity: 78, dbz: 51, color: '#ef4444', level: 'Intense Inflow', region: 'Sundarbans Delta' },
      { center: [17.68, 83.30], radius: 75000, intensity: 48, dbz: 42, color: '#f59e0b', level: 'Moderate', region: 'Visakhapatnam Coast' },

      // 4. Himalayan Orographic Wedge
      { center: [34.08, 74.80], radius: 65000, intensity: 38, dbz: 37, color: '#06b6d4', level: 'Stratiform-Rain', region: 'Kashmir Valley' },
      { center: [32.22, 76.32], radius: 65000, intensity: 58, dbz: 47, color: '#f97316', level: 'Heavy', region: 'Dharamshala-Kangra' },
      { center: [31.10, 77.17], radius: 70000, intensity: 64, dbz: 48, color: '#f97316', level: 'Heavy Orographic', region: 'Shimla Ridge' },
      { center: [30.38, 79.32], radius: 75000, intensity: 94, dbz: 56, color: '#dc2626', level: 'Cloudburst Warning', region: 'Chamoli-Kedarnath' },
      { center: [29.58, 79.64], radius: 60000, intensity: 62, dbz: 47, color: '#f97316', level: 'Heavy', region: 'Nainital-Almora' },

      // 5. Northeast Megadrop Zone
      { center: [25.27, 91.73], radius: 85000, intensity: 120, dbz: 60, color: '#a855f7', level: 'Extreme Orographic Deluge', region: 'Cherrapunji-Mawsynram' },
      { center: [26.14, 91.74], radius: 80000, intensity: 76, dbz: 51, color: '#ef4444', level: 'Very Heavy', region: 'Guwahati-Kamrup' },
      { center: [26.65, 92.80], radius: 75000, intensity: 68, dbz: 49, color: '#f97316', level: 'Heavy', region: 'Tezpur-Brahmaputra' },
      { center: [27.48, 95.02], radius: 70000, intensity: 58, dbz: 46, color: '#f97316', level: 'Heavy', region: 'Dibrugarh-Upper Assam' },

      // 6. Gangetic Plains & Peninsular Nodes
      { center: [28.61, 77.21], radius: 70000, intensity: 35, dbz: 36, color: '#06b6d4', level: 'Moderate', region: 'Delhi-NCR Ring' },
      { center: [26.85, 80.95], radius: 75000, intensity: 48, dbz: 42, color: '#f59e0b', level: 'Moderate-Heavy', region: 'Lucknow-Awadh' },
      { center: [25.59, 85.14], radius: 70000, intensity: 45, dbz: 41, color: '#f59e0b', level: 'Moderate', region: 'Patna-Gangetic Plain' },
      { center: [17.38, 78.49], radius: 65000, intensity: 36, dbz: 36, color: '#06b6d4', level: 'Moderate Showers', region: 'Hyderabad Cell' },
      { center: [12.97, 77.59], radius: 60000, intensity: 30, dbz: 34, color: '#0ea5e9', level: 'Light-Moderate', region: 'Bengaluru Plateau' },
    ],
    // High-density distributed lightning strikes across active convective corridors
    lightningStrikes: [
      [19.12, 72.88], [19.25, 72.95], [18.98, 73.05], [19.35, 73.12],
      [11.71, 76.10], [11.62, 76.22], [11.80, 76.05],
      [30.45, 79.28], [30.52, 79.40], [30.38, 79.48],
      [26.15, 91.90], [26.02, 91.75], [25.30, 91.70], [25.25, 91.80],
      [20.45, 88.55], [20.35, 88.70], [22.58, 88.40], [22.65, 88.30],
      [23.30, 85.35], [21.20, 81.65], [31.12, 77.20], [28.65, 77.25],
    ],
  },

  // Step 1: +1h
  1: {
    thunderstorm: [
      { coords: [[18.8, 72.5], [19.7, 72.7], [19.6, 73.5], [18.7, 73.3]], prob: 0.80, label: 'Mumbai-Thane Squall' },
      { coords: [[25.6, 91.3], [26.5, 91.5], [26.3, 92.6], [25.5, 92.4]], prob: 0.84, label: 'Assam Valley Propagation' },
      { coords: [[21.4, 86.4], [22.4, 86.6], [22.2, 87.7], [21.2, 87.4]], prob: 0.72, label: 'Balasore-Midnapore Front' },
    ],
    cloudburst: [
      { coords: [[11.50, 75.90], [11.95, 76.00], [11.90, 76.45], [11.45, 76.35]], prob: 0.90, label: 'Wayanad Cloudburst Core' },
      { coords: [[30.20, 79.10], [30.70, 79.15], [30.65, 79.60], [30.15, 79.55]], prob: 0.82, label: 'Rudraprayag Intense Core' },
    ],
    flood: [
      { coords: [[30.10, 79.00], [30.60, 79.05], [30.55, 79.65], [30.05, 79.60]], prob: 0.78, label: 'Chamoli-Alaknanda Surge' },
      { coords: [[11.35, 75.75], [11.70, 75.80], [11.65, 76.25], [11.30, 76.20]], prob: 0.68, label: 'Chaliyar River Outflow' },
    ],
    radarIntensity: [
      { center: [8.60, 76.98], radius: 70000, intensity: 58, dbz: 46, color: '#f97316', level: 'Heavy', region: 'Trivandrum Coast' },
      { center: [10.02, 76.32], radius: 85000, intensity: 86, dbz: 53, color: '#ef4444', level: 'Very Heavy', region: 'Kochi-Aluva' },
      { center: [11.70, 76.15], radius: 90000, intensity: 125, dbz: 60, color: '#dc2626', level: 'Cloudburst Trigger', region: 'Wayanad Peak Core' },
      { center: [12.98, 74.90], radius: 80000, intensity: 72, dbz: 49, color: '#ef4444', level: 'Very Heavy', region: 'Dakshina Kannada' },
      { center: [15.42, 74.02], radius: 75000, intensity: 55, dbz: 45, color: '#f97316', level: 'Heavy', region: 'Goa Ghats' },
      { center: [19.20, 72.95], radius: 105000, intensity: 94, dbz: 55, color: '#ef4444', level: 'Severe Storm Core', region: 'Thane-Navi Mumbai' },
      { center: [20.65, 72.98], radius: 75000, intensity: 62, dbz: 47, color: '#f97316', level: 'Heavy', region: 'Navsari-Surat' },
      { center: [23.35, 77.48], radius: 90000, intensity: 54, dbz: 45, color: '#f97316', level: 'Heavy', region: 'Bhopal Trough Band' },
      { center: [21.22, 79.15], radius: 85000, intensity: 52, dbz: 44, color: '#f59e0b', level: 'Moderate-Heavy', region: 'Vidarbha Basin' },
      { center: [21.32, 81.70], radius: 90000, intensity: 68, dbz: 49, color: '#ef4444', level: 'Very Heavy', region: 'Bastar-Raipur' },
      { center: [20.48, 88.50], radius: 135000, intensity: 102, dbz: 56, color: '#dc2626', level: 'Depression Surge', region: 'North Bay of Bengal' },
      { center: [20.38, 86.68], radius: 85000, intensity: 84, dbz: 52, color: '#ef4444', level: 'Very Heavy', region: 'Paradip Coastal Arm' },
      { center: [22.65, 88.42], radius: 95000, intensity: 78, dbz: 51, color: '#ef4444', level: 'Very Heavy', region: 'Kolkata-Barasat' },
      { center: [30.45, 79.35], radius: 85000, intensity: 108, dbz: 58, color: '#dc2626', level: 'Cloudburst Wave', region: 'Chamoli Peak' },
      { center: [31.18, 77.22], radius: 75000, intensity: 72, dbz: 49, color: '#ef4444', level: 'Heavy Orographic', region: 'Shimla-Kullu' },
      { center: [25.32, 91.78], radius: 90000, intensity: 130, dbz: 62, color: '#a855f7', level: 'Extreme Deluge', region: 'Cherrapunji Front' },
      { center: [26.22, 91.80], radius: 85000, intensity: 88, dbz: 53, color: '#ef4444', level: 'Very Heavy', region: 'Guwahati Front' },
      { center: [28.68, 77.28], radius: 75000, intensity: 42, dbz: 39, color: '#84cc16', level: 'Moderate', region: 'Noida-Ghaziabad' },
    ],
    lightningStrikes: [
      [19.18, 72.92], [19.32, 73.01], [19.05, 73.12], [18.88, 72.98],
      [11.74, 76.15], [11.68, 76.28], [11.82, 76.05],
      [30.48, 79.35], [30.55, 79.42], [30.40, 79.30],
      [20.50, 88.45], [20.40, 88.60], [22.62, 88.38],
      [25.35, 91.75], [26.20, 91.82],
    ],
  },

  // Step 2: +2h
  2: {
    thunderstorm: [
      { coords: [[19.0, 72.7], [19.8, 72.9], [19.7, 73.6], [18.9, 73.4]], prob: 0.88, label: 'North Konkan Belt' },
      { coords: [[26.0, 91.7], [26.7, 91.8], [26.5, 92.7], [25.9, 92.5]], prob: 0.89, label: 'Brahmaputra Front' },
    ],
    cloudburst: [
      { coords: [[30.35, 79.20], [30.75, 79.25], [30.70, 79.65], [30.30, 79.60]], prob: 0.95, label: 'Kedarnath-Chamoli Core' },
      { coords: [[11.58, 75.98], [11.95, 76.08], [11.90, 76.45], [11.52, 76.35]], prob: 0.85, label: 'Wayanad Ghat Inundation' },
    ],
    flood: [
      { coords: [[30.15, 79.05], [30.65, 79.10], [30.60, 79.70], [30.10, 79.65]], prob: 0.92, label: 'Downstream Inundation Corridor' },
      { coords: [[11.38, 75.75], [11.75, 75.80], [11.70, 76.25], [11.30, 76.20]], prob: 0.78, label: 'Wayanad Catchment Inflow' },
    ],
    radarIntensity: [
      { center: [30.50, 79.40], radius: 95000, intensity: 135, dbz: 64, color: '#9333ea', level: 'Severe Cloudburst Core', region: 'Kedarnath-Alaknanda' },
      { center: [19.30, 73.00], radius: 115000, intensity: 88, dbz: 53, color: '#ef4444', level: 'Very Heavy Squall', region: 'Mumbai-Kalyan' },
      { center: [11.72, 76.18], radius: 85000, intensity: 98, dbz: 56, color: '#dc2626', level: 'High Inundation Core', region: 'Wayanad Ridge' },
      { center: [20.55, 88.40], radius: 140000, intensity: 110, dbz: 58, color: '#dc2626', level: 'Deep Depressive Wall', region: 'Head Bay Surge' },
      { center: [22.70, 88.50], radius: 100000, intensity: 82, dbz: 52, color: '#ef4444', level: 'Heavy Squall', region: 'Greater Kolkata' },
      { center: [25.38, 91.82], radius: 95000, intensity: 135, dbz: 63, color: '#a855f7', level: 'Extreme Rain Pulse', region: 'Cherrapunji Uplift' },
      { center: [23.40, 77.55], radius: 85000, intensity: 62, dbz: 47, color: '#f97316', level: 'Heavy Trough Band', region: 'Central MP' },
    ],
    lightningStrikes: [
      [30.52, 79.38], [30.42, 79.45], [30.61, 79.32],
      [19.25, 72.98], [19.40, 73.10], [11.76, 76.20],
      [20.52, 88.42], [22.68, 88.45],
    ],
  },

  // Step 3: +3h
  3: {
    thunderstorm: [
      { coords: [[19.1, 72.8], [19.9, 73.0], [19.8, 73.7], [19.0, 73.5]], prob: 0.86, label: 'Western Maharashtra Inland Surge' },
      { coords: [[26.1, 91.8], [26.8, 92.0], [26.6, 92.8], [26.0, 92.6]], prob: 0.91, label: 'Guwahati Frontal Cell' },
    ],
    cloudburst: [
      { coords: [[30.38, 79.22], [30.78, 79.28], [30.72, 79.68], [30.32, 79.62]], prob: 0.88, label: 'Upper Mandakini High Ridge' },
    ],
    flood: [
      { coords: [[30.10, 79.00], [30.70, 79.08], [30.65, 79.72], [30.05, 79.62]], prob: 0.96, label: 'Peak Flash Flood Wave' },
    ],
    radarIntensity: [
      { center: [30.52, 79.42], radius: 105000, intensity: 145, dbz: 66, color: '#c026d3', level: 'Peak Cloudburst Pulse', region: 'Mandakini Gorge' },
      { center: [19.35, 73.05], radius: 120000, intensity: 92, dbz: 54, color: '#ef4444', level: 'Severe Storm', region: 'Thane-Raigad' },
      { center: [20.60, 88.35], radius: 145000, intensity: 115, dbz: 59, color: '#dc2626', level: 'Coastal Inundation Surge', region: 'Odisha-Bengal Coast' },
      { center: [25.42, 91.88], radius: 95000, intensity: 128, dbz: 62, color: '#a855f7', level: 'Torrential Downpour', region: 'Khasi Hills' },
    ],
    lightningStrikes: [
      [30.55, 79.42], [30.48, 79.50], [19.30, 73.05], [20.58, 88.32],
    ],
  },

  // Step 4: +4h
  4: {
    thunderstorm: [
      { coords: [[19.2, 73.0], [20.0, 73.2], [19.9, 73.9], [19.1, 73.7]], prob: 0.70, label: 'Pune-Nasik Convective Line' },
    ],
    cloudburst: [
      { coords: [[30.40, 79.25], [30.78, 79.32], [30.72, 79.70], [30.35, 79.65]], prob: 0.68, label: 'Dissipating Cloudburst Core' },
    ],
    flood: [
      { coords: [[30.05, 78.95], [30.68, 79.02], [30.62, 79.75], [30.00, 79.68]], prob: 0.90, label: 'Devprayag Confluence Flood' },
    ],
    radarIntensity: [
      { center: [30.55, 79.45], radius: 80000, intensity: 82, dbz: 52, color: '#ef4444', level: 'Post-Peak Surge', region: 'Rudraprayag-Devprayag' },
      { center: [19.40, 73.15], radius: 95000, intensity: 64, dbz: 48, color: '#f59e0b', level: 'Moderate-Heavy', region: 'Ghat Descent' },
      { center: [20.65, 88.25], radius: 130000, intensity: 88, dbz: 53, color: '#ef4444', level: 'Depression Rainband', region: 'Dhamra-Paradip' },
    ],
    lightningStrikes: [
      [19.35, 73.12], [30.58, 79.45],
    ],
  },

  // Step 5: +6h
  5: {
    thunderstorm: [
      { coords: [[19.3, 73.2], [20.1, 73.4], [20.0, 74.1], [19.2, 73.9]], prob: 0.48, label: 'Deccan Plateau Dissipation' },
    ],
    cloudburst: [],
    flood: [
      { coords: [[30.00, 78.90], [30.62, 78.98], [30.58, 79.80], [29.95, 79.72]], prob: 0.76, label: 'Rishikesh-Haridwar River Runoff' },
    ],
    radarIntensity: [
      { center: [30.50, 79.50], radius: 60000, intensity: 42, dbz: 40, color: '#06b6d4', level: 'Residual Runoff', region: 'Haridwar Basin' },
      { center: [19.50, 73.30], radius: 70000, intensity: 36, dbz: 37, color: '#0ea5e9', level: 'Residual Showers', region: 'Western Maharashtra' },
      { center: [20.70, 88.20], radius: 110000, intensity: 62, dbz: 47, color: '#f97316', level: 'Weakening Low', region: 'Odisha Inland' },
    ],
    lightningStrikes: [],
  },
};

/**
 * Service class implementing WeatherLayerProvider
 */
export class WeatherLayerProvider {
  static getBaseTile(type = 'dark') {
    return BASE_MAP_PROVIDERS[type] || BASE_MAP_PROVIDERS.dark;
  }

  static getHazardZones(stepIndex = 0) {
    return FORECAST_HAZARD_ZONES[stepIndex] || FORECAST_HAZARD_ZONES[0];
  }

  static getRegionalMarkers(stepIndex = 0) {
    const etas = [
      { u: 'ETA 2 – 4 h', m: 'ETA 3 – 5 h', w: 'ETA 1 – 3 h' },
      { u: 'ETA 1 – 3 h', m: 'ETA 2 – 4 h', w: 'ETA 0.5 – 1.5 h' },
      { u: 'ETA Peak Surge', m: 'ETA 1 – 3 h', w: 'ETA Active Inundation' },
      { u: 'ETA Receding Wave', m: 'ETA 0.5 – 2 h', w: 'ETA Post-Event Surge' },
      { u: 'ETA Confluence Warning', m: 'ETA Inbound Interior', w: 'ETA Recovery Phase' },
      { u: 'ETA Downstream Haridwar', m: 'ETA Dissipated', w: 'ETA Cleared' },
    ];
    const etaSet = etas[stepIndex] || etas[0];
    return REGIONAL_HAZARDS.map(pin => {
      let eta = pin.eta;
      if (pin.id === 'uttarakhand') eta = etaSet.u;
      if (pin.id === 'mumbai') eta = etaSet.m;
      if (pin.id === 'wayanad') eta = etaSet.w;
      return { ...pin, eta };
    });
  }

  static getDwrNetwork() {
    return IMD_DWR_NETWORK;
  }

  static getAwsStations() {
    return NATIONAL_AWS_STATIONS;
  }

  static getSynopticFeatures() {
    return SYNOPTIC_PRESSURE_SYSTEM;
  }

  static getWindStreamlines() {
    return WIND_STREAMLINES;
  }

  static getAvailableLayers() {
    return WEATHER_LAYERS;
  }
}

export default WeatherLayerProvider;
