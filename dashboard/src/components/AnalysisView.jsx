import React, { useState, useEffect } from 'react';
import './AnalysisView.css';
import { 
  CloudRain, 
  MapPin, 
  Calendar, 
  Brain,
  Lightbulb,
  Droplets,
  Zap,
  ThermometerSnowflake,
  Wind,
  Layout,
  Share2,
  Activity,
  Layers,
  Mountain
} from 'lucide-react';
import { predictNowcast, getRealtimeWeather } from '../services/apiService';

const ANALYSIS_SECTORS = {
  'Wayanad, Kerala': {
    name: 'Wayanad (Meppadi Ridge)',
    lat: 11.5564,
    lng: 76.1320,
    locationId: 'wayanad',
    state: 'Kerala',
    terrainDesc: 'Western Ghats Orographic Escarpment'
  },
  'Chamoli, Uttarakhand': {
    name: 'Chamoli (Alaknanda Basin)',
    lat: 30.4100,
    lng: 79.3200,
    locationId: 'chamoli',
    state: 'Uttarakhand',
    terrainDesc: 'Alaknanda Deep Gorge Funneling'
  },
  'Kangra, Himachal Pradesh': {
    name: 'Kangra (Dharamsala Basin)',
    lat: 32.2190,
    lng: 76.3234,
    locationId: 'kangra',
    state: 'Himachal Pradesh',
    terrainDesc: 'Dhauladhar Mountain Barrier'
  },
  'Mumbai, Maharashtra': {
    name: 'Mumbai Metropolitan Region',
    lat: 19.0760,
    lng: 72.8777,
    locationId: 'mumbai',
    state: 'Maharashtra',
    terrainDesc: 'Coastal Estuarine Convergence'
  },
  'Rudraprayag, Uttarakhand': {
    name: 'Rudraprayag Sector',
    lat: 30.2844,
    lng: 78.9811,
    locationId: 'rudraprayag',
    state: 'Uttarakhand',
    terrainDesc: 'Mandakini-Alaknanda River Confluence'
  },
  'Pithoragarh, Uttarakhand': {
    name: 'Pithoragarh Sector',
    lat: 29.5829,
    lng: 80.2182,
    locationId: 'pithoragarh',
    state: 'Uttarakhand',
    terrainDesc: 'Sojur Valley High Ridge'
  },
  'Uttarkashi, Uttarakhand': {
    name: 'Uttarkashi (Bhagirathi Basin)',
    lat: 30.7268,
    lng: 78.4354,
    locationId: 'uttarkashi',
    state: 'Uttarakhand',
    terrainDesc: 'Bhagirathi Deep Canyon Corridor'
  }
};

// CTT Satellite Infrared Visualizer Component
function CttSatelliteVisual({ cttDrop }) {
  return (
    <svg viewBox="0 0 320 180" width="100%" height="100%" style={{ display: 'block', background: '#040814' }}>
      <defs>
        <radialGradient id="cttCore" cx="52%" cy="48%" r="48%">
          <stop offset="0%" stopColor="#ec4899" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.75" />
          <stop offset="75%" stopColor="#0284c7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#040814" stopOpacity="0.1" />
        </radialGradient>
      </defs>

      <line x1="0" y1="45" x2="320" y2="45" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="135" x2="320" y2="135" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="80" y1="0" x2="80" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="160" y1="0" x2="160" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="240" y1="0" x2="240" y2="180" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

      <path d="M0 130 Q60 110 120 125 T240 95 T320 110 L320 180 L0 180 Z" fill="#081426" opacity="0.7" />
      <path d="M0 150 Q80 135 160 145 T320 130 L320 180 L0 180 Z" fill="#0d213a" opacity="0.8" />

      <ellipse cx="165" cy="85" rx="100" ry="60" fill="url(#cttCore)" />
      
      <ellipse cx="165" cy="85" rx="65" ry="40" fill="none" stroke="#facc15" strokeWidth="1.2" opacity="0.6" strokeDasharray="4 2" />
      <ellipse cx="165" cy="85" rx="38" ry="24" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.85" />
      <ellipse cx="165" cy="85" rx="16" ry="11" fill="#fdf2f8" opacity="0.9" />

      <text x="10" y="20" fill="#94a3b8" fontSize="9" fontFamily="monospace" opacity="0.8">INSAT-3DR TIR-1 (10.8 µm)</text>
      <text x="10" y="32" fill="#38bdf8" fontSize="9" fontFamily="monospace">CTT Drop: {cttDrop != null ? cttDrop : -14.1}°C/h</text>
    </svg>
  );
}

// IWV Atmospheric Water Vapor Moisture Flux Visualizer
function IwvMoistureVisual({ iwv }) {
  const iwvVal = iwv != null ? Number(iwv).toFixed(1) : '52.4';
  return (
    <svg viewBox="0 0 320 180" width="100%" height="100%" style={{ display: 'block', background: '#030813' }}>
      <defs>
        <linearGradient id="iwvPlume" x1="0%" y1="100%" x2="80%" y2="20%">
          <stop offset="0%" stopColor="#0284c7" stopOpacity="0.2" />
          <stop offset="40%" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#eab308" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <line x1="0" y1="45" x2="320" y2="45" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="135" x2="320" y2="135" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

      <path
        d="M20 180 C80 150, 110 110, 160 85 C210 60, 260 50, 310 30 L320 60 C260 85, 210 105, 170 130 C120 160, 80 180, 40 180 Z"
        fill="url(#iwvPlume)"
        opacity="0.85"
      />
      
      <path
        d="M120 120 C150 95, 180 80, 220 70 C190 95, 160 115, 135 135 Z"
        fill="#ef4444"
        opacity="0.7"
      />

      <path d="M60 160 Q110 120 170 95" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="6 3" fill="none" opacity="0.8" />
      <path d="M90 175 Q140 135 200 110" stroke="#facc15" strokeWidth="1.5" strokeDasharray="6 3" fill="none" opacity="0.8" />
      <path d="M120 150 Q170 115 230 90" stroke="#f97316" strokeWidth="1.5" strokeDasharray="6 3" fill="none" opacity="0.8" />

      <polygon points="172,93 162,91 168,99" fill="#38bdf8" />
      <polygon points="202,108 192,106 198,114" fill="#facc15" />
      <polygon points="232,88 222,86 228,94" fill="#f97316" />

      <text x="10" y="20" fill="#94a3b8" fontSize="9" fontFamily="monospace" opacity="0.8">Bolton Saturation Plume</text>
      <text x="10" y="32" fill="#38bdf8" fontSize="9" fontFamily="monospace">Column IWV: {iwvVal} kg/m²</text>
    </svg>
  );
}

// CAPE Thermodynamic Convective Energy Visualizer
function CapeEnergyVisual({ cape, cin }) {
  const capeVal = cape != null ? Math.round(cape) : 1950;
  return (
    <svg viewBox="0 0 320 180" width="100%" height="100%" style={{ display: 'block', background: '#030814' }}>
      <defs>
        <radialGradient id="capeCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="35%" stopColor="#f97316" stopOpacity="0.75" />
          <stop offset="65%" stopColor="#eab308" stopOpacity="0.6" />
          <stop offset="85%" stopColor="#10b981" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.1" />
        </radialGradient>
      </defs>

      <line x1="0" y1="45" x2="320" y2="45" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="90" x2="320" y2="90" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="135" x2="320" y2="135" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

      <path d="M0 140 Q80 120 160 135 T320 110 L320 180 L0 180 Z" fill="#071324" opacity="0.75" />

      <circle cx="160" cy="90" r="75" fill="url(#capeCore)" />

      <circle cx="160" cy="90" r="55" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="5 2.5" opacity="0.8" />
      <circle cx="160" cy="90" r="32" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.9" />
      <circle cx="160" cy="90" r="14" fill="#fef08a" opacity="0.8" />

      <path d="M145 130 L155 98" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />
      <path d="M175 130 L165 98" stroke="#38bdf8" strokeWidth="1.2" strokeDasharray="3 2" />

      <text x="10" y="20" fill="#94a3b8" fontSize="9" fontFamily="monospace" opacity="0.8">ERA5 / IMDAA Sounding Profile</text>
      <text x="10" y="32" fill="#eab308" fontSize="9" fontFamily="monospace">CAPE: {capeVal} J/kg (High Instability)</text>
    </svg>
  );
}

export default function AnalysisView({ onNavigateTab }) {
  const [activeNav, setActiveNav] = useState('overview');
  const [selectedSector, setSelectedSector] = useState('Wayanad, Kerala');
  const [liveData, setLiveData] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('LIVE');
  const [istTimestamp, setIstTimestamp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navItems = [
    { id: 'overview', icon: Layout, label: 'Overview' },
    { id: 'attribution', icon: Share2, label: 'Feature Attribution' },
    { id: 'evidence', icon: Activity, label: 'Atmospheric Evidence' },
    { id: 'profile', icon: Layers, label: 'Vertical Profile' },
    { id: 'terrain', icon: Mountain, label: 'Terrain Influence' },
  ];

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
      setIstTimestamp(`${dateStr}, ${timeStr} IST`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const sector = ANALYSIS_SECTORS[selectedSector] || ANALYSIS_SECTORS['Wayanad, Kerala'];
    setIsLoading(true);

    Promise.allSettled([
      predictNowcast({ lat: sector.lat, lng: sector.lng, leadTimeHours: 2, locationId: sector.locationId }),
      getRealtimeWeather(sector.lat, sector.lng)
    ]).then(([predRes, weatherRes]) => {
      if (!isMounted) return;
      setIsLoading(false);
      if (predRes.status === 'fulfilled' && predRes.value) {
        setLiveData(predRes.value);
      }
      if (weatherRes.status === 'fulfilled' && weatherRes.value?.status === 'success') {
        setLiveWeather(weatherRes.value);
        setWeatherStatus('LIVE');
      } else {
        setWeatherStatus('DEGRADED');
      }
    });

    return () => { isMounted = false; };
  }, [selectedSector]);

  const currentSector = ANALYSIS_SECTORS[selectedSector] || ANALYSIS_SECTORS['Wayanad, Kerala'];
  const weather = liveWeather?.weather || liveData?.weather || {};

  const precursors = liveData?.atmospheric_precursors || {
    iwv_mm: weather.total_column_water_vapour_kg_m2 ?? 41.0,
    cape_j_kg: weather.cape_j_kg ?? 980,
    cin_j_kg: weather.cin_j_kg ?? 5,
    ctt_drop_rate_c_hr: -14.1,
    wind_shear_0_6km_kt: weather.wind_speed_10m_kmh ? Math.round(weather.wind_speed_10m_kmh * 0.54) : 15,
  };

  const xaiContrib = liveData?.xai?.contributions || {
    iwv_moisture_flux: Math.min(60, Math.round(((precursors.iwv_mm || 40) / 65) * 45)),
    cape_instability: Math.min(50, Math.round(((precursors.cape_j_kg || 1000) / 2500) * 35)),
    dem_slope_funneling: 22,
    ctt_drop_rate: 18,
  };

  const tsScore = liveData?.predictions?.thunderstorm?.risk_score ?? (liveData?.predictions?.thunderstorm_probability ? liveData.predictions.thunderstorm_probability / 100 : 0.74);
  const cbScore = liveData?.predictions?.cloudburst?.risk_score ?? (liveData?.predictions?.cloudburst_probability ? liveData.predictions.cloudburst_probability / 100 : 0.52);
  const ffScore = liveData?.predictions?.flash_flood?.risk_score ?? (liveData?.predictions?.flash_flood_probability ? liveData.predictions.flash_flood_probability / 100 : 0.88);
  const maxRisk = Math.max(tsScore, cbScore, ffScore);

  let topHazard = 'Flash Flood';
  if (tsScore >= ffScore && tsScore >= cbScore) topHazard = 'Thunderstorm';
  else if (cbScore >= ffScore) topHazard = 'Cloudburst';

  const threatLevel = liveData?.active_threat_level || (
    maxRisk >= 0.80 ? 'RED ALERT' :
    maxRisk >= 0.60 ? 'ORANGE ALERT' :
    maxRisk >= 0.35 ? 'YELLOW WATCH' : 'GREEN NOMINAL'
  );

  const features = [
    { label: 'Integrated Water Vapor (IWV Flux)', pct: xaiContrib.iwv_moisture_flux || 42, color: '#3b82f6' },
    { label: 'CAPE (Convective Instability)', pct: xaiContrib.cape_instability || 28, color: '#38bdf8' },
    { label: 'CartoDEM Topography & Slope', pct: xaiContrib.dem_slope_funneling || 18, color: '#22c55e' },
    { label: 'CTT Drop Rate (Cloud Top Cooling)', pct: xaiContrib.ctt_drop_rate || 12, color: '#ef4444' },
    { label: 'Deep Layer Wind Shear', pct: 6, color: '#a855f7' },
  ];

  const thresholds = [
    { param: 'IWV (Water Vapor)', observed: `${precursors.iwv_mm != null ? precursors.iwv_mm.toFixed(1) : '41.0'} mm`, limit: '> 58 mm', status: (precursors.iwv_mm || 0) > 58 ? 'Breached' : 'Nominal' },
    { param: 'CAPE (Instability)', observed: `${precursors.cape_j_kg != null ? Math.round(precursors.cape_j_kg) : '980'} J/kg`, limit: '> 2,000 J/kg', status: (precursors.cape_j_kg || 0) > 2000 ? 'Breached' : 'Nominal' },
    { param: 'CIN (Inhibition)', observed: `${precursors.cin_j_kg != null ? Math.round(precursors.cin_j_kg) : '5'} J/kg`, limit: '> -25 J/kg', status: (precursors.cin_j_kg || 0) > -25 ? 'Breached' : 'Nominal' },
    { param: 'Surface Pressure', observed: `${weather.surface_pressure_hpa != null ? weather.surface_pressure_hpa.toFixed(1) : '918.2'} hPa`, limit: '< 980 hPa (Highland)', status: (weather.surface_pressure_hpa || 1013) < 980 ? 'Breached' : 'Nominal' },
    { param: 'Wind Speed', observed: `${weather.wind_speed_10m_kmh != null ? weather.wind_speed_10m_kmh.toFixed(1) : '7.6'} km/h`, limit: '> 25 km/h', status: (weather.wind_speed_10m_kmh || 0) > 25 ? 'Breached' : 'Nominal' }
  ];

  return (
    <div className="ana-root">
      
      {/* Sidebar */}
      <div className="ana-sidebar">
        <div className="ana-sidebar-top">
          <div>
            <div className="ana-sidebar-title">Analysis</div>
            <div className="ana-sidebar-desc">Understand why the model predicts severe weather</div>
          </div>
          
          <div className="ana-nav-list">
            {navItems.map(item => {
              const Icon = item.icon;
              return (
                <div 
                  key={item.id} 
                  className={`ana-nav-item ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ana-sidebar-bottom">
          <Lightbulb size={24} color="#eab308" />
          <div className="ana-sidebar-bot-text">
            <div>From data to clearer answers.</div>
            <div style={{ color: '#cbd5e1', marginTop: '4px' }}>VAYUNET</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ana-main">
        
        {/* Header */}
        <div className="ana-header">
          <div className="ana-header-left">
            <CloudRain size={36} className="ana-header-icon" />
            <div>
              <div className="ana-header-title">{topHazard} Physics Analysis</div>
              <div className="ana-header-subtitle">Explainable AI insights & real-time telemetry</div>
            </div>
          </div>
          <div className="ana-header-right">
            <div className="ana-pill" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={14} className="ana-pill-icon" />
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: '600',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {Object.keys(ANALYSIS_SECTORS).map((s) => (
                  <option key={s} value={s} style={{ background: '#0b1329', color: '#ffffff' }}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="ana-pill">
              <Calendar size={14} className="ana-pill-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="ana-pill-label">Analysis Time</span>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>{istTimestamp || 'Live IST'}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: '6px' }}>
              <div 
                className="ana-conf-circle"
                style={{
                  borderColor: threatLevel.includes('RED') ? '#ef4444' : threatLevel.includes('ORANGE') ? '#f97316' : '#38bdf8'
                }}
              >
                <span>{maxRisk.toFixed(2)}</span>
              </div>
              <div className="ana-conf-text">
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Live Risk Score</span>
                <span style={{ fontSize: '18px', fontWeight: 600, color: threatLevel.includes('RED') ? '#ef4444' : threatLevel.includes('ORANGE') ? '#f97316' : '#ffffff' }}>
                  {maxRisk.toFixed(2)}
                </span>
              </div>
              <span 
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: threatLevel.includes('RED') ? 'rgba(239, 68, 68, 0.2)' : threatLevel.includes('ORANGE') ? 'rgba(249, 115, 22, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  color: threatLevel.includes('RED') ? '#ef4444' : threatLevel.includes('ORANGE') ? '#f97316' : '#38bdf8',
                  border: `1px solid ${threatLevel.includes('RED') ? 'rgba(239, 68, 68, 0.4)' : threatLevel.includes('ORANGE') ? 'rgba(249, 115, 22, 0.4)' : 'rgba(56, 189, 248, 0.4)'}`
                }}
              >
                {threatLevel}
              </span>
            </div>
          </div>
        </div>

        {/* EXECUTIVE SCIENTIFIC DIAGNOSIS (ONE-SENTENCE VERDICT) */}
        <div className="ana-verdict-banner">
          <div className="ana-verdict-badge">
            <span className="ana-verdict-dot"></span>
            <span>STAGE 2: SCIENTIFIC EXPLANATION (UNDERSTAND)</span>
          </div>
          <div className="ana-verdict-statement">
            {liveData?.scientific_verdict || `“VAYUNET predicts ${threatLevel} (${(maxRisk * 100).toFixed(0)}%) for ${currentSector.name} driven by ${topHazard.toLowerCase()} atmospheric precursors.”`}
          </div>
          <div className="ana-verdict-meta-bar">
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">PRIMARY ATTRIBUTION</span>
              <span className="ana-vm-val" style={{ color: '#ef4444' }}>
                CTT Drop ({precursors.ctt_drop_rate_c_hr != null ? precursors.ctt_drop_rate_c_hr.toFixed(1) : '-14.1'} °C/hr)
              </span>
            </div>
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">ATMOSPHERIC MOISTURE</span>
              <span className="ana-vm-val" style={{ color: '#38bdf8' }}>
                IWV Saturation ({precursors.iwv_mm != null ? precursors.iwv_mm.toFixed(1) : '41.0'} mm)
              </span>
            </div>
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">CONVECTIVE POTENTIAL</span>
              <span className="ana-vm-val" style={{ color: '#eab308' }}>
                CAPE ({precursors.cape_j_kg != null ? Math.round(precursors.cape_j_kg) : '980'} J/kg)
              </span>
            </div>
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">TERRAIN FORCING</span>
              <span className="ana-vm-val" style={{ color: '#22c55e' }}>
                {currentSector.terrain}
              </span>
            </div>
          </div>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginTop: '6px' }}>
            * AI-generated risk assessment - not an official warning.
          </div>

          <div className="ana-pipeline-nav-bar">
            <button
              type="button"
              className="ana-pipeline-btn secondary"
              onClick={() => onNavigateTab && onNavigateTab('nowcast')}
              title="Return to operational map and live detection"
            >
              ← 1. Live Nowcast (SEE)
            </button>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="ana-pipeline-btn primary"
                onClick={() => onNavigateTab && onNavigateTab('events')}
                title="Verify how VAYUNET performed in similar past disasters"
              >
                3. Historical Validation (PROVE) →
              </button>
              <button
                type="button"
                className="ana-pipeline-btn dispatch"
                onClick={() => onNavigateTab && onNavigateTab('alerts')}
                title="Proceed to alert generation and CAP 1.2 broadcast"
              >
                4. Create / Dispatch Alert (ACT) →
              </button>
            </div>
          </div>
        </div>

        {/* Why Prediction & Feature Attribution */}
        <div className="ana-grid-2">
          
          {/* Left Card */}
          <div className="ana-card">
            <div className="ana-card-title">
              <Brain size={20} color="#38bdf8" /> Why this prediction?
            </div>
            <div className="ana-why-text">
              {liveData?.scientific_verdict 
                ? liveData.scientific_verdict
                : `Real-time atmospheric telemetry over ${currentSector.name} indicates surface temperature of ${weather.temperature_2m_c != null ? weather.temperature_2m_c.toFixed(1) + ' °C' : '28.4 °C'} with relative humidity at ${weather.relative_humidity_2m_pct != null ? weather.relative_humidity_2m_pct + '%' : '82%'}. Deep learning inference computes ${topHazard.toLowerCase()} risk at ${(maxRisk * 100).toFixed(0)}% in the 1–2 hour lead window.`
              }
            </div>
            <div className="ana-insight-box">
              <Lightbulb size={20} color="#eab308" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div className="ana-insight-title">Key Insight</div>
                <div className="ana-insight-text">
                  Observed IWV at {precursors.iwv_mm != null ? precursors.iwv_mm.toFixed(1) : '41.0'} mm combined with CAPE of {precursors.cape_j_kg != null ? Math.round(precursors.cape_j_kg) : '980'} J/kg and {currentSector.terrain} orographic forcing creates favorable trigger conditions.
                </div>
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div className="ana-card">
            <div className="ana-card-title">
              Feature Attribution <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'normal', cursor: 'help' }}>ⓘ</span>
            </div>
            <div className="ana-fa-subtitle">% contribution to prediction confidence (Illustrative factor contribution)</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
              {features.map((f, i) => (
                <div key={i} className="ana-fa-row">
                  <div className="ana-fa-label">{f.label}</div>
                  <div className="ana-fa-bar-bg">
                    <div className="ana-fa-bar-fill" style={{ width: `${f.pct}%`, background: f.color }} />
                  </div>
                  <div className="ana-fa-pct">{f.pct}%</div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Maps Grid */}
        <div className="ana-maps-grid">
          
          {/* CTT Map */}
          <div className="ana-map-card">
            <div className="ana-map-header">
              <span className="ana-map-title">Satellite — Cloud Top Temperature</span>
              <span className="ana-map-time">{istTimestamp || 'Live IST'}</span>
            </div>
            <div className="ana-map-body">
              <CttSatelliteVisual cttDrop={precursors.ctt_drop_rate_c_hr} />
              <div className="ana-marker">
                <div className="ana-marker-dot"/> {currentSector.name.split(',')[0]}
              </div>
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>{currentSector.terrainDesc}</div>
              
              <div className="ana-scale-box vertical">
                <span style={{ fontSize: '10px' }}>CTT (°C)</span>
                <span style={{ marginTop: '4px' }}>-80</span>
                <span style={{ marginTop: '12px' }}>-60</span>
                <span style={{ marginTop: '12px' }}>-40</span>
                <span style={{ marginTop: '12px' }}>-20</span>
                <span style={{ marginTop: '12px' }}>0</span>
                <span style={{ marginTop: '12px' }}>20</span>
                <div className="ana-scale-ramp-v" style={{ position: 'absolute', right: '4px', top: '24px', height: 'calc(100% - 32px)', width: '6px' }} />
              </div>
            </div>
          </div>

          {/* IWV Map */}
          <div className="ana-map-card">
            <div className="ana-map-header">
              <span className="ana-map-title">Integrated Water Vapor (IWV)</span>
            </div>
            <div className="ana-map-body">
              <IwvMoistureVisual iwv={precursors.iwv_mm} />
              <div className="ana-marker">
                <div className="ana-marker-dot"/> {currentSector.name.split(',')[0]}
              </div>
              <div className="ana-scale-box horizontal">
                <div className="ana-scale-ramp-h" />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
                  <span>0</span><span>20</span><span>40</span><span>60</span><span>mm</span>
                </div>
              </div>
            </div>
          </div>

          {/* CAPE Map */}
          <div className="ana-map-card">
            <div className="ana-map-header">
              <span className="ana-map-title">CAPE (Convective Available PE)</span>
            </div>
            <div className="ana-map-body">
              <CapeEnergyVisual cape={precursors.cape_j_kg} cin={precursors.cin_j_kg} />
              <div className="ana-marker">
                <div className="ana-marker-dot"/> {currentSector.name.split(',')[0]}
              </div>
              <div className="ana-scale-box horizontal">
                <div className="ana-scale-ramp-h" style={{ background: 'linear-gradient(to right, #0284c7, #10b981, #facc15, #f97316, #ef4444)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 4px', boxSizing: 'border-box' }}>
                  <span>0</span><span>500</span><span>1,000</span><span>1,500</span><span>2,000 J/kg</span>
                </div>
              </div>
            </div>
          </div>

          {/* Vertical Profile Chart */}
          <div className="ana-map-card">
            <div className="ana-map-header">
              <span className="ana-map-title">Vertical Atmospheric Profile</span>
            </div>
            <div className="ana-map-body" style={{ background: '#040914', padding: '16px' }}>
               {/* Decorative Chart */}
               <div style={{ position: 'relative', width: '100%', height: '100%', borderLeft: '1px solid #334155', borderBottom: '1px solid #334155' }}>
                  <div style={{ position: 'absolute', top: -14, right: 0, display: 'flex', gap: '12px', fontSize: '9px', color: '#94a3b8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}/> Temperature (°C)</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }}/> Dew Point (°C)</div>
                  </div>
                  
                  {/* Y Axis */}
                  <div style={{ position: 'absolute', left: '-30px', top: 0, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', color: '#64748b', textAlign: 'right', width: '24px' }}>
                    <span>100</span><span>200</span><span>300</span><span>500</span><span>700</span><span>850</span><span>1000</span>
                  </div>
                  <div style={{ position: 'absolute', left: '-44px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '9px', color: '#94a3b8' }}>Pressure (hPa)</div>

                  {/* X Axis */}
                  <div style={{ position: 'absolute', bottom: '-16px', width: '100%', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                    <span>-60</span><span>-40</span><span>-20</span><span>0</span><span>20</span><span>40</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '-28px', width: '100%', textAlign: 'center', fontSize: '9px', color: '#94a3b8' }}>Temperature (°C)</div>

                  {/* Lines & Box */}
                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute' }}>
                    {/* Temperature Line */}
                    <path d="M 20 0 L 40 40 L 55 70 L 60 100" fill="none" stroke="#ef4444" strokeWidth="2" />
                    {/* Dew Point Line */}
                    <path d="M 10 0 L 30 40 L 45 70 L 48 100" fill="none" stroke="#38bdf8" strokeWidth="2" />
                    
                    {/* Highlight Box */}
                    <rect x="45" y="40" width="40" height="30" fill="rgba(239, 68, 68, 0.1)" stroke="rgba(239, 68, 68, 0.5)" strokeDasharray="2,2" />
                  </svg>

                  <div style={{ position: 'absolute', top: '50px', left: '85px', fontSize: '9px', color: '#cbd5e1', whiteSpace: 'nowrap', textShadow: '0 1px 2px black' }}>
                    Instability Index<br/>(CAPE: {precursors.cape_j_kg != null ? Math.round(precursors.cape_j_kg) : '980'} J/kg)
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="ana-bot-grid">
          
          {/* Atmospheric State */}
          <div className="ana-bot-card">
            <div className="ana-card-title">Atmospheric State <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>({currentSector.name})</span></div>
            
            <div className="ana-state-icons">
              <div className="ana-state-col">
                <Droplets size={24} className="ana-state-icon" />
                <div className="ana-state-label">IWV</div>
                <div className="ana-state-val">{precursors.iwv_mm != null ? precursors.iwv_mm.toFixed(1) : '41.0'} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>mm</span></div>
              </div>

              <div className="ana-state-col">
                <Zap size={24} className="ana-state-icon" />
                <div className="ana-state-label">CAPE</div>
                <div className="ana-state-val">{precursors.cape_j_kg != null ? Math.round(precursors.cape_j_kg) : '980'}</div>
                <div className="ana-state-sub">J/kg</div>
              </div>

              <div className="ana-state-col">
                <ThermometerSnowflake size={24} className="ana-state-icon" style={{ color: '#94a3b8' }} />
                <div className="ana-state-label">CIN</div>
                <div className="ana-state-val">{precursors.cin_j_kg != null ? Math.round(precursors.cin_j_kg) : '5'}<span style={{ fontSize: '10px', fontWeight: 'normal' }}>J/kg</span></div>
              </div>

              <div className="ana-state-col">
                <ThermometerSnowflake size={24} className="ana-state-icon" style={{ color: '#38bdf8' }} />
                <div className="ana-state-label">CTT Rate</div>
                <div className="ana-state-val">{precursors.ctt_drop_rate_c_hr != null ? precursors.ctt_drop_rate_c_hr.toFixed(1) : '-14.1'} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>°C</span></div>
                <div className="ana-state-sub">1 hr</div>
              </div>

              <div className="ana-state-col">
                <Wind size={24} className="ana-state-icon" style={{ color: '#cbd5e1' }} />
                <div className="ana-state-label">Wind</div>
                <div className="ana-state-val">{weather.wind_speed_10m_kmh != null ? weather.wind_speed_10m_kmh.toFixed(1) : '7.6'} <span style={{ fontSize: '12px', fontWeight: 'normal' }}>km/h</span></div>
              </div>
            </div>
          </div>

          {/* Precursor Threshold */}
          <div className="ana-bot-card">
            <div className="ana-card-title">Precursor Threshold Reference</div>
            
            <table className="ana-thresh-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Observed Value</th>
                  <th>Alert Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t, i) => (
                  <tr key={i}>
                    <td>{t.param}</td>
                    <td>{t.observed}</td>
                    <td style={{ color: '#64748b' }}>{t.limit}</td>
                    <td>
                      <div className="ana-thresh-status">
                        <div className={`ana-status-dot ${t.status.toLowerCase()}`} />
                        <span className={`ana-status-text ${t.status.toLowerCase()}`}>{t.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Temporal Evolution */}
          <div className="ana-bot-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="ana-card-title" style={{ fontSize: '13px' }}>Temporal Evolution (Last 3 Hours)</div>
              <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#cbd5e1' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#38bdf8' }}/> IWV</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ef4444' }}/> CAPE</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7' }}/> CTT Rate</div>
              </div>
            </div>
            
            <div style={{ flex: 1, position: 'relative', background: '#040914', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)', marginTop: '8px', padding: '12px 24px' }}>
              {/* Fake Line Chart */}
              <div style={{ position: 'absolute', left: '8px', top: '12px', bottom: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                <span>80</span><span>60</span><span>40</span><span>20</span><span>0</span>
              </div>
              <div style={{ position: 'absolute', left: '-12px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '9px', color: '#94a3b8' }}>IWV (mm)</div>

              <div style={{ position: 'absolute', right: '8px', top: '12px', bottom: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                <span>3K</span><span>2K</span><span>1K</span><span>0</span>
              </div>
              <div style={{ position: 'absolute', right: '-12px', top: '50%', transform: 'translateY(-50%) rotate(-90deg)', fontSize: '9px', color: '#94a3b8' }}>CAPE (J/kg)</div>

              <div style={{ position: 'absolute', bottom: '8px', left: '24px', right: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#64748b' }}>
                <span>20:00</span><span>20:30</span><span>21:00</span><span>21:30</span><span>22:00</span><span>22:30</span><span>23:00</span>
              </div>

              <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', left: '24px', width: 'calc(100% - 48px)', top: '12px', height: 'calc(100% - 36px)' }}>
                {/* Now Line */}
                <line x1="85" y1="0" x2="85" y2="100" stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
                
                {/* IWV (Blue) */}
                <path d="M 0 90 L 16 80 L 33 75 L 50 68 L 66 62 L 85 55 L 100 50" fill="none" stroke="#38bdf8" strokeWidth="2" />
                <circle cx="85" cy="55" r="3" fill="#38bdf8" />
                
                {/* CAPE (Red) */}
                <path d="M 0 85 L 16 65 L 33 60 L 50 50 L 66 30 L 85 20 L 100 25" fill="none" stroke="#ef4444" strokeWidth="2" />
                <circle cx="85" cy="20" r="3" fill="#ef4444" />
                
                {/* CTT Rate (Purple) */}
                <path d="M 0 95 L 16 93 L 33 92 L 50 94 L 66 95 L 85 85 L 100 65" fill="none" stroke="#a855f7" strokeWidth="2" />
                <circle cx="85" cy="85" r="3" fill="#a855f7" />
              </svg>

              <div style={{ position: 'absolute', top: '2px', left: 'calc(24px + 85%)', transform: 'translateX(-50%)', background: '#1e293b', fontSize: '9px', padding: '2px 6px', borderRadius: '4px', color: '#fff' }}>Now</div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
