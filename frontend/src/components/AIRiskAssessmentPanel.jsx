import React from 'react';
import './AIRiskAssessmentPanel.css';

// Safe SVG Components
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="aira-icon-green"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="aira-icon-large-green"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
);
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const BankIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="20" width="20" height="2"></rect><rect x="4" y="10" width="2" height="10"></rect><rect x="10" y="10" width="2" height="10"></rect><rect x="16" y="10" width="2" height="10"></rect><rect x="18" y="10" width="2" height="10"></rect><polygon points="12 2 2 7 22 7 12 2"></polygon></svg>
);
const DropletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
);
const ZapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f472b6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);
const AlertIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
);
const CloudRainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>
);
const ScienceIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2v2"></path><path d="M15 2v2"></path><path d="M12 2v2"></path><path d="M12 18v.01"></path><path d="M16 11V6a4 4 0 0 0-8 0v5l-4 8a2 2 0 0 0 1.7 3h14.6a2 2 0 0 0 1.7-3z"></path></svg>
);

export default function AIRiskAssessmentPanel({ predictions, severity }) {
  if (!predictions) {
    return (
      <div className="aira-container">
        <div className="aira-narrative" style={{ textAlign: 'center', padding: '40px 20px' }}>
          Loading AI Inference...
        </div>
      </div>
    );
  }

  const isAvailable = predictions.prediction_status === 'SUCCESS';

  if (!isAvailable) {
    return (
      <div className="aira-container" style={{ opacity: 0.85 }}>
        {/* Top Header Row */}
        <div className="aira-header-row">
          <div className="aira-brand">
            <ShieldIcon />
            <div className="aira-brand-text">
              <span style={{ color: '#94a3b8' }}>VAYUNET AI RISK</span>
              <span style={{ color: '#94a3b8' }}>ASSESSMENT</span>
            </div>
          </div>
          <div className="aira-model-pill" style={{ color: '#fca5a5', borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
            STATUS: UNAVAILABLE
          </div>
        </div>

        {/* Threat Title & Location */}
        <div className="aira-threat-card" style={{ backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px dashed #334155' }}>
          <div className="aira-threat-icon-col">
            <ShieldCheckIcon style={{ color: '#94a3b8' }} />
          </div>
          <div className="aira-threat-text-col">
            <h2 className="aira-threat-title" style={{ color: '#94a3b8' }}>MODEL INFERENCE UNAVAILABLE</h2>
            <h3 className="aira-threat-subtitle" style={{ color: '#64748b' }}>{predictions.reason || "Missing satellite tensor channels"}</h3>
            <div className="aira-location">
              <MapPinIcon />
              <span>{predictions.target?.location_name || 'Unknown'}</span>
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div className="aira-narrative" style={{ color: '#94a3b8', fontSize: '11px', fontStyle: 'italic' }}>
          Real-time weather data retrieved successfully. However, the VAYUNET-MTL-v2.0 
          model requires complete 12-channel inputs including Geostationary INSAT IR/WV 
          streams. We strictly enforce an anti-fabrication policy and do not mock predictions.
        </div>
        
        {/* Real-time Weather Box */}
        <div className="aira-weather-box">
          <div className="aira-weather-header">
            <div className="aira-wh-left">
              <CloudRainIcon />
              <span>REAL-TIME WEATHER (OPEN-METEO)</span>
            </div>
            <div className="aira-wh-live" style={{ color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.2)' }}>LIVE</div>
          </div>
          <div className="aira-weather-grid">
            <div className="aira-w-row">
              <span className="aira-w-label">Temperature</span>
              <span className="aira-w-val">{predictions.atmospheric_precursors?.temperature_2m_c ?? '--'} °C</span>
            </div>
            <div className="aira-w-row">
              <span className="aira-w-label">Pressure</span>
              <span className="aira-w-val">{predictions.atmospheric_precursors?.surface_pressure_hpa ?? '--'} hPa</span>
            </div>
            
            <div className="aira-w-row">
              <span className="aira-w-label">Rain</span>
              <span className="aira-w-val aira-w-val-blue">{predictions.atmospheric_precursors?.rain_mm_h ?? '--'} mm/h</span>
            </div>
            <div className="aira-w-row">
              <span className="aira-w-label">CAPE</span>
              <span className="aira-w-val aira-w-val-orange">{predictions.atmospheric_precursors?.cape_j_kg ?? '--'} J/kg</span>
            </div>
            
            <div className="aira-w-row">
              <span className="aira-w-label">CIN</span>
              <span className="aira-w-val">{predictions.atmospheric_precursors?.cin_j_kg ?? '--'} J/kg</span>
            </div>
            <div className="aira-w-row">
              <span className="aira-w-label">IWV</span>
              <span className="aira-w-val aira-w-val-blue">{predictions.atmospheric_precursors?.iwv_kg_m2 ?? '--'} kg/m²</span>
            </div>
          </div>
          
          <div className="aira-weather-footer">
            <span>Fetched: Just now</span>
            <span>Source: Open-Meteo API</span>
          </div>
        </div>
      </div>
    );
  }

  // SUCCESS STATE
  const p = predictions.predictions || {};
  const ap = predictions.atmospheric_precursors || {};
  const loc = predictions.target?.location_name || 'Unknown';
  
  let threatTitle = "NOMINAL / SAFE";
  let titleColor = "#22c55e";
  let subtitleColor = "#86efac";
  let score = Math.max(p.thunderstorm_probability || 0, p.cloudburst_probability || 0, p.flash_flood_probability || 0);

  if (p.composite_threat_level === "RED") {
    threatTitle = "EXTREME THREAT";
    titleColor = "#ef4444";
    subtitleColor = "#fca5a5";
  } else if (p.composite_threat_level === "ORANGE") {
    threatTitle = "SEVERE RISK";
    titleColor = "#f97316";
    subtitleColor = "#fdba74";
  } else if (p.composite_threat_level === "YELLOW") {
    threatTitle = "ELEVATED RISK";
    titleColor = "#fbbf24";
    subtitleColor = "#fde047";
  }

  return (
    <div className="aira-container">
      {/* Top Header Row */}
      <div className="aira-header-row">
        <div className="aira-brand">
          <ShieldIcon />
          <div className="aira-brand-text">
            <span>VAYUNET AI RISK</span>
            <span>ASSESSMENT</span>
          </div>
        </div>
        <div className="aira-model-pill">
          Model: VAYUNET-MTL-v2.0 •<br/>LIVE
        </div>
      </div>

      {/* Threat Title & Location */}
      <div className="aira-threat-card">
        <div className="aira-threat-icon-col">
          <ShieldCheckIcon />
        </div>
        <div className="aira-threat-text-col">
          <h2 className="aira-threat-title" style={{ color: titleColor }}>{threatTitle}</h2>
          <h3 className="aira-threat-subtitle" style={{ color: subtitleColor }}>Risk Score: {score.toFixed(2)}</h3>
          <div className="aira-location">
            <MapPinIcon />
            <span>{loc}</span>
          </div>
        </div>
      </div>

      {/* Benchmark Banner */}
      <div className="aira-benchmark-banner">
        <div className="aira-benchmark-icon">
          <BankIcon />
        </div>
        <div className="aira-benchmark-text">
          Target Lead Time: <strong>{predictions.lead_time || '+2h'}</strong> • Model Inf: <strong>SUCCESS</strong>
        </div>
      </div>

      {/* Narrative */}
      <div className="aira-narrative">
        Current conditions in {loc} indicate a CAPE of <strong>{ap.cape_j_kg} J/kg</strong> and IWV of 
        <strong> {ap.total_column_water_vapour_kg_m2} kg/m²</strong>. The multi-task deep learning model predicts a 
        <strong> {(p.flash_flood_probability * 100).toFixed(1)}% </strong> probability of Flash Flood and 
        <strong> {(p.cloudburst_probability * 100).toFixed(1)}% </strong> probability of Cloudburst.
      </div>

      {/* Metrics Grid */}
      <div className="aira-metrics-grid">
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <DropletIcon />
            <span>{ap.total_column_water_vapour_kg_m2 ?? '--'} <span>kg/m²</span></span>
          </div>
          <div className="aira-metric-label">Precursor IWV</div>
        </div>
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <ZapIcon />
            <span>{ap.cape_j_kg ?? '--'} <span>J/kg</span></span>
          </div>
          <div className="aira-metric-label">Convective CAPE</div>
        </div>
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <ActivityIcon />
            <span>{score.toFixed(2)}</span>
          </div>
          <div className="aira-metric-label">Model risk score</div>
        </div>
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <ClockIcon />
            <span>{(p.thunderstorm_probability * 100).toFixed(0)} <span>%</span></span>
          </div>
          <div className="aira-metric-label">T-Storm Prob</div>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="aira-action-box">
        <div className="aira-action-header">
          <AlertIcon />
          <span>Threat Probabilities</span>
        </div>
        <div className="aira-action-text" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Flash Flood: {(p.flash_flood_probability * 100).toFixed(1)}%</span>
          <span>Cloudburst: {(p.cloudburst_probability * 100).toFixed(1)}%</span>
        </div>
      </div>

      {/* Real-time Weather Box */}
      <div className="aira-weather-box">
        <div className="aira-weather-header">
          <div className="aira-wh-left">
            <CloudRainIcon />
            <span>REAL-TIME WEATHER</span>
          </div>
          <div className="aira-wh-live">LIVE</div>
        </div>
        <div className="aira-weather-grid">
          <div className="aira-w-row">
            <span className="aira-w-label">Temperature</span>
            <span className="aira-w-val">{ap.temperature_2m_c ?? '--'} °C</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">Pressure</span>
            <span className="aira-w-val">{ap.surface_pressure_hpa ?? '--'} hPa</span>
          </div>
          
          <div className="aira-w-row">
            <span className="aira-w-label">Rain</span>
            <span className="aira-w-val aira-w-val-blue">{ap.rain_mm_h ?? '--'} mm/h</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">CAPE</span>
            <span className="aira-w-val aira-w-val-orange">{ap.cape_j_kg ?? '--'} J/kg</span>
          </div>
          
          <div className="aira-w-row">
            <span className="aira-w-label">CIN</span>
            <span className="aira-w-val">{ap.cin_j_kg ?? '--'} J/kg</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">IWV</span>
            <span className="aira-w-val aira-w-val-blue">{ap.iwv_kg_m2 ?? '--'} kg/m²</span>
          </div>
        </div>
        
        <div className="aira-weather-footer">
          <span>Updated 5s ago</span>
          <span>Source: Open-Meteo (Direct)</span>
        </div>
      </div>

    </div>
  );
}
