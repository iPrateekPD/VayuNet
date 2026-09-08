// Mock data: pre-scripted Uttarakhand cloudburst event playback
// Simulates a replay of a July 2023-style event across 6 time steps (T+1hr to T+6hr)

export const EVENT_META = {
  name: "Uttarakhand Cloudburst Event",
  date: "July 15, 2023",
  region: "Chamoli District, Uttarakhand",
  center: [30.4, 79.3],
  zoom: 9,
};

export const TIME_STEPS = [
  { label: "T+1hr", leadTime: "T+1h", time: "09:00 IST" },
  { label: "T+2hr", leadTime: "T+2h", time: "10:00 IST" },
  { label: "T+3hr", leadTime: "T+3h", time: "11:00 IST" },
  { label: "T+4hr", leadTime: "T+4h", time: "12:00 IST" },
  { label: "T+5hr", leadTime: "T+5h", time: "13:00 IST" },
  { label: "T+6hr", leadTime: "T+6h", time: "14:00 IST" },
];

// Risk zones per time step — GeoJSON-like polygon definitions
// Each polygon has { coords: [[lat, lon]...], probability: 0-1, type: 'thunderstorm'|'cloudburst'|'flood' }
export const RISK_ZONES = [
  // T+1hr — Low risk forming
  {
    thunderstorm: [
      { coords: [[30.5,79.1],[30.6,79.1],[30.6,79.3],[30.5,79.3]], probability: 0.35 },
    ],
    cloudburst: [],
    flood: [],
    predictions: { thunderstorm: 35, cloudburst: 12, flood: 8 },
    severity: "MODERATE",
    onsetWindow: "11:30 – 13:00 IST",
    atmosphericState: { iwv: 42, cape: 1200, cin: 85, cttDrop: -1.2, windShear: 8 },
    xai: [
      { factor: "IWV Anomaly", value: "+18% above baseline", score: 0.45, trend: "up" },
      { factor: "CAPE", value: "1,200 J/kg (Moderate)", score: 0.38, trend: "up" },
      { factor: "CIN", value: "85 J/kg (Suppressing)", score: 0.22, trend: "neutral" },
      { factor: "CTT Drop Rate", value: "-1.2°C / 15min", score: 0.28, trend: "up" },
      { factor: "Wind Shear", value: "8 m/s (Weak)", score: 0.18, trend: "neutral" },
    ],
    alerts: [],
    ingestionLog: [
      { time: "08:42 IST", msg: "INSAT-3DR WV channel ingested (frame 1/4)" },
      { time: "08:57 IST", msg: "IMDAA thermodynamic baseline synced" },
      { time: "09:00 IST", msg: "Model inference complete — T+1hr prediction ready" },
    ],
  },
  // T+2hr — Conditions intensifying
  {
    thunderstorm: [
      { coords: [[30.45,79.05],[30.65,79.05],[30.65,79.35],[30.45,79.35]], probability: 0.58 },
    ],
    cloudburst: [
      { coords: [[30.5,79.1],[30.6,79.1],[30.6,79.25],[30.5,79.25]], probability: 0.32 },
    ],
    flood: [],
    predictions: { thunderstorm: 58, cloudburst: 32, flood: 18 },
    severity: "HIGH",
    onsetWindow: "11:00 – 12:30 IST",
    atmosphericState: { iwv: 56, cape: 1950, cin: 48, cttDrop: -2.4, windShear: 12 },
    xai: [
      { factor: "IWV Anomaly", value: "+31% above baseline", score: 0.62, trend: "up" },
      { factor: "CAPE", value: "1,950 J/kg (High)", score: 0.58, trend: "up" },
      { factor: "CIN", value: "48 J/kg (Eroding)", score: 0.44, trend: "down" },
      { factor: "CTT Drop Rate", value: "-2.4°C / 15min", score: 0.51, trend: "up" },
      { factor: "Wind Shear", value: "12 m/s (Moderate)", score: 0.35, trend: "up" },
    ],
    alerts: [
      { id: 1, severity: "HIGH", type: "Thunderstorm Warning", region: "Chamoli District", time: "09:58 IST", action: "Alert district administration. Monitor situation." },
    ],
    ingestionLog: [
      { time: "09:45 IST", msg: "INSAT-3DR TIR channel ingested — CTT drop detected" },
      { time: "09:52 IST", msg: "IWV spike detected over Chamoli basin (+31%)" },
      { time: "10:00 IST", msg: "Model inference complete — T+2hr prediction ready" },
    ],
  },
  // T+3hr — Severe risk
  {
    thunderstorm: [
      { coords: [[30.4,79.0],[30.7,79.0],[30.7,79.4],[30.4,79.4]], probability: 0.78 },
    ],
    cloudburst: [
      { coords: [[30.45,79.05],[30.65,79.05],[30.65,79.35],[30.45,79.35]], probability: 0.62 },
    ],
    flood: [
      { coords: [[30.38,79.1],[30.5,79.1],[30.5,79.3],[30.38,79.3]], probability: 0.44 },
    ],
    predictions: { thunderstorm: 78, cloudburst: 62, flood: 44 },
    severity: "SEVERE",
    onsetWindow: "11:00 – 12:00 IST",
    atmosphericState: { iwv: 68, cape: 2800, cin: 18, cttDrop: -3.8, windShear: 16 },
    xai: [
      { factor: "IWV Anomaly", value: "+42% above baseline", score: 0.81, trend: "up" },
      { factor: "CAPE", value: "2,800 J/kg (Very High)", score: 0.76, trend: "up" },
      { factor: "CIN", value: "18 J/kg (Near-zero)", score: 0.72, trend: "down" },
      { factor: "CTT Drop Rate", value: "-3.8°C / 15min", score: 0.68, trend: "up" },
      { factor: "Wind Shear", value: "16 m/s (Strong)", score: 0.52, trend: "up" },
    ],
    alerts: [
      { id: 1, severity: "HIGH", type: "Thunderstorm Warning", region: "Chamoli District", time: "09:58 IST", action: "Alert district administration." },
      { id: 2, severity: "SEVERE", type: "Cloudburst Warning", region: "Upper Chamoli / Badrinath Valley", time: "10:55 IST", action: "Evacuate low-lying river bank settlements immediately." },
    ],
    ingestionLog: [
      { time: "10:42 IST", msg: "INSAT-3DR WV ingested — moisture pool confirmed over Nanda Devi range" },
      { time: "10:51 IST", msg: "CAPE crossed 2800 J/kg threshold — explosive instability" },
      { time: "11:00 IST", msg: "Model inference complete — T+3hr prediction ready" },
    ],
  },
  // T+4hr — Extreme risk, flash flood imminent
  {
    thunderstorm: [
      { coords: [[30.35,78.95],[30.75,78.95],[30.75,79.45],[30.35,79.45]], probability: 0.91 },
    ],
    cloudburst: [
      { coords: [[30.4,79.0],[30.7,79.0],[30.7,79.4],[30.4,79.4]], probability: 0.84 },
    ],
    flood: [
      { coords: [[30.32,79.05],[30.55,79.05],[30.55,79.35],[30.32,79.35]], probability: 0.71 },
    ],
    predictions: { thunderstorm: 91, cloudburst: 84, flood: 71 },
    severity: "EXTREME",
    onsetWindow: "12:00 – 13:00 IST",
    atmosphericState: { iwv: 79, cape: 3400, cin: 4, cttDrop: -5.1, windShear: 21 },
    xai: [
      { factor: "IWV Anomaly", value: "+55% above baseline", score: 0.94, trend: "up" },
      { factor: "CAPE", value: "3,400 J/kg (Extreme)", score: 0.91, trend: "up" },
      { factor: "CIN", value: "4 J/kg (Collapsed)", score: 0.95, trend: "down" },
      { factor: "CTT Drop Rate", value: "-5.1°C / 15min", score: 0.88, trend: "up" },
      { factor: "Wind Shear", value: "21 m/s (Very Strong)", score: 0.72, trend: "up" },
    ],
    alerts: [
      { id: 1, severity: "HIGH", type: "Thunderstorm Warning", region: "Chamoli District", time: "09:58 IST", action: "Alert district administration." },
      { id: 2, severity: "SEVERE", type: "Cloudburst Warning", region: "Upper Chamoli / Badrinath Valley", time: "10:55 IST", action: "Evacuate low-lying river bank settlements immediately." },
      { id: 3, severity: "EXTREME", type: "Flash Flood Warning", region: "Alaknanda River Basin", time: "11:48 IST", action: "IMMEDIATE EVACUATION. Alert NDRF. Close NH-7 highway." },
    ],
    ingestionLog: [
      { time: "11:41 IST", msg: "CIN collapsed to 4 J/kg — convective initiation imminent" },
      { time: "11:49 IST", msg: "DEM overlay: Alaknanda drainage basin at extreme runoff risk" },
      { time: "12:00 IST", msg: "Model inference complete — EXTREME alert threshold crossed" },
    ],
  },
  // T+5hr — Peak event
  {
    thunderstorm: [
      { coords: [[30.3,78.9],[30.8,78.9],[30.8,79.5],[30.3,79.5]], probability: 0.95 },
    ],
    cloudburst: [
      { coords: [[30.38,78.98],[30.72,78.98],[30.72,79.42],[30.38,79.42]], probability: 0.92 },
    ],
    flood: [
      { coords: [[30.28,79.0],[30.58,79.0],[30.58,79.38],[30.28,79.38]], probability: 0.88 },
    ],
    predictions: { thunderstorm: 95, cloudburst: 92, flood: 88 },
    severity: "EXTREME",
    onsetWindow: "13:00 – 14:00 IST",
    atmosphericState: { iwv: 84, cape: 3600, cin: 1, cttDrop: -6.3, windShear: 24 },
    xai: [
      { factor: "IWV Anomaly", value: "+62% above baseline", score: 0.97, trend: "up" },
      { factor: "CAPE", value: "3,600 J/kg (Extreme)", score: 0.95, trend: "up" },
      { factor: "CIN", value: "1 J/kg (Fully Collapsed)", score: 0.98, trend: "down" },
      { factor: "CTT Drop Rate", value: "-6.3°C / 15min", score: 0.93, trend: "up" },
      { factor: "Wind Shear", value: "24 m/s (Severe)", score: 0.81, trend: "up" },
    ],
    alerts: [
      { id: 2, severity: "SEVERE", type: "Cloudburst Warning", region: "Upper Chamoli / Badrinath Valley", time: "10:55 IST", action: "Evacuate low-lying river bank settlements immediately." },
      { id: 3, severity: "EXTREME", type: "Flash Flood Warning", region: "Alaknanda River Basin", time: "11:48 IST", action: "IMMEDIATE EVACUATION. Alert NDRF. Close NH-7 highway." },
      { id: 4, severity: "EXTREME", type: "Multi-District Alert", region: "Chamoli, Rudraprayag, Pauri", time: "12:30 IST", action: "State Emergency Operations Centre activated. Deploy rescue teams." },
    ],
    ingestionLog: [
      { time: "12:42 IST", msg: "INSAT-3DR: Deep convective cells detected over 3 districts" },
      { time: "12:51 IST", msg: "QPE: Real-time rainfall estimate 68mm/hr in Chamoli catchment" },
      { time: "13:00 IST", msg: "Model inference complete — multi-district extreme alert issued" },
    ],
  },
  // T+6hr — Dissipating
  {
    thunderstorm: [
      { coords: [[30.32,78.95],[30.75,78.95],[30.75,79.42],[30.32,79.42]], probability: 0.72 },
    ],
    cloudburst: [
      { coords: [[30.38,79.0],[30.68,79.0],[30.68,79.38],[30.38,79.38]], probability: 0.61 },
    ],
    flood: [
      { coords: [[30.28,79.02],[30.55,79.02],[30.55,79.36],[30.28,79.36]], probability: 0.74 },
    ],
    predictions: { thunderstorm: 72, cloudburst: 61, flood: 74 },
    severity: "SEVERE",
    onsetWindow: "Event in progress — Flood risk persists",
    atmosphericState: { iwv: 71, cape: 2100, cin: 12, cttDrop: -3.1, windShear: 18 },
    xai: [
      { factor: "IWV Anomaly", value: "+48% above baseline", score: 0.78, trend: "up" },
      { factor: "CAPE", value: "2,100 J/kg (Decreasing)", score: 0.71, trend: "down" },
      { factor: "CIN", value: "12 J/kg (Re-establishing)", score: 0.65, trend: "up" },
      { factor: "CTT Drop Rate", value: "-3.1°C / 15min", score: 0.62, trend: "down" },
      { factor: "Wind Shear", value: "18 m/s (Still Strong)", score: 0.68, trend: "neutral" },
    ],
    alerts: [
      { id: 3, severity: "EXTREME", type: "Flash Flood Warning", region: "Alaknanda River Basin", time: "11:48 IST", action: "IMMEDIATE EVACUATION. Alert NDRF. Close NH-7 highway." },
      { id: 4, severity: "EXTREME", type: "Multi-District Alert", region: "Chamoli, Rudraprayag, Pauri", time: "12:30 IST", action: "State Emergency Operations Centre activated. Deploy rescue teams." },
    ],
    ingestionLog: [
      { time: "13:42 IST", msg: "INSAT-3DR: Storm system beginning to weaken" },
      { time: "13:51 IST", msg: "CAPE declining — instability reducing. Flash flood risk remains." },
      { time: "14:00 IST", msg: "Model inference complete — T+6hr prediction ready" },
    ],
  },
];
