import React from 'react';
import './AIRiskAssessmentPanel.css';

// Safe SVG Components
const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="aira-icon-green"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
);
const ShieldCheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="aira-icon-large-green"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><polyline points="9 12 11 14 15 10"></polyline></svg>
);
const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
);
const CloudRainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M16 14v6"></path><path d="M8 14v6"></path><path d="M12 16v6"></path></svg>
);
const AlertTriangleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
);
const ActivityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
);

export default function AIRiskAssessmentPanel({ predictions, nowcastState, selectedIncident = null, onSelectIncident = () => {} }) {
  if (!predictions || !nowcastState) {
    return (
      <div className="aira-container">
        <div className="aira-narrative" style={{ textAlign: 'center', padding: '40px 20px' }}>
          Loading AI Inference...
        </div>
      </div>
    );
  }

  const isAvailable = predictions.prediction_status === 'SUCCESS';
  
  // SUCCESS STATE PARSING
  const ap = predictions.weather || {};
  const loc = predictions.location?.name || 'Unknown';
  
  const activeForecasts = nowcastState.activeForecasts || [];
  const inc = selectedIncident || activeForecasts[0] || {};
  
  const isPrecip = nowcastState.hazard === 'PRECIPITATION';

  let threatTitle = "NOMINAL / SAFE";
  let titleColor = "#22c55e";
  let subtitleColor = "#86efac";
  let probability = inc.confidence || "0%";

  if (!isAvailable) {
    threatTitle = "MODEL UNAVAILABLE";
    titleColor = "#94a3b8";
    subtitleColor = "#64748b";
    probability = predictions.reason || "Missing channels";
  } else if (inc) {
    threatTitle = inc.hazard || "UNKNOWN THREAT";
    titleColor = inc.riskColor || "#fbbf24";
    subtitleColor = titleColor;
    if (isPrecip) {
      probability = `${inc.precipitation || 0} ${nowcastState.unit || 'mm/hr'}`;
    }
  }

  let displayEta = nowcastState.expectedPeak || inc.eta;

  return (
    <div className="aira-container">
      {/* 1. SYSTEM STATUS & HIGHEST THREAT OVERVIEW */}
      <div className="aira-section">
        <div className="aira-header-row">
          <div className="aira-brand">
            {isPrecip ? <CloudRainIcon /> : <ShieldIcon />}
            <div className="aira-brand-text">
              <span>{isPrecip ? 'PEAK PRECIPITATION' : 'HIGHEST FORECAST'}</span>
              {!isPrecip && <span>RISK</span>}
            </div>
          </div>
          <div className="aira-model-pill" style={{ color: isAvailable ? '#22c55e' : '#fca5a5', backgroundColor: isAvailable ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', borderColor: isAvailable ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)' }}>
            {isAvailable ? 'STATUS: SUCCESS' : 'STATUS: UNAVAILABLE'}
          </div>
        </div>

        <div className="aira-threat-card" style={!isAvailable ? { backgroundColor: 'rgba(15, 23, 42, 0.4)', border: '1px dashed #334155' } : {}}>
          <div className="aira-threat-icon-col">
            <ShieldCheckIcon style={{ color: titleColor }} />
          </div>
          <div className="aira-threat-text-col">
            <h2 className="aira-threat-title" style={{ color: titleColor }}>{threatTitle}</h2>
            <h3 className="aira-threat-subtitle" style={{ color: subtitleColor }}>
              {probability}
            </h3>
            <div className="aira-location">
              <MapPinIcon />
              <span>{inc.name || loc}</span>
            </div>
          </div>
        </div>

        {isAvailable && (
          <div className="aira-threat-details">
            <div className="aira-threat-detail-row">
              <span className="aira-td-label">Highest-Risk Region:</span>
              <span className="aira-td-val">{nowcastState.highestRiskRegion || inc.name?.split(',')[0] || 'Unknown'}</span>
            </div>
            <div className="aira-threat-detail-row">
              <span className="aira-td-label">Affected Districts:</span>
              <span className="aira-td-val">{nowcastState.affectedDistricts || inc.affectedDistricts || '02'}</span>
            </div>
            <div className="aira-threat-detail-row">
              <span className="aira-td-label">{isPrecip ? 'Peak Period:' : 'Expected Peak:'}</span>
              <span className="aira-td-val" style={{ color: isPrecip ? '#3b82f6' : '#ef4444' }}>{displayEta}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. ACTIVE THREATS PANEL */}
      <div className="aira-section">
        <div className="aira-section-title">
          <AlertTriangleIcon />
          <span>ACTIVE FORECASTS ({activeForecasts.length})</span>
        </div>
        <div className="aira-incidents-list">
          {activeForecasts.map((forecast) => (
            <div 
              key={forecast.id} 
              className={`aira-inc-row ${selectedIncident?.id === forecast.id ? 'active' : ''}`}
              onClick={() => onSelectIncident(forecast)}
            >
              <div className="aira-inc-top">
                <div className="aira-inc-left">
                  <span className="aira-inc-dot" style={{ backgroundColor: forecast.riskColor }} />
                  <span className="aira-inc-hazard" style={{ color: forecast.riskColor }}>{forecast.hazard}</span>
                </div>
                <span className="aira-inc-pct">{isPrecip && forecast.hazard === 'PRECIPITATION' ? `${forecast.precipitation || 0} ${nowcastState.unit}` : forecast.confidence}</span>
              </div>
              <div className="aira-inc-bot">
                <span className="aira-inc-loc">{forecast.name}</span>
                <span className="aira-inc-eta">ETA {forecast.eta || displayEta}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. REAL-TIME WEATHER (COMPACT) */}
      <div className="aira-section">
        <div className="aira-section-title">
          <CloudRainIcon />
          <span>Real-Time Weather</span>
          <span className="aira-live-badge">LIVE</span>
        </div>
        <div className="aira-weather-grid">
          <div className="aira-w-row">
            <span className="aira-w-label">Temp</span>
            <span className="aira-w-val">{ap.temp_c ?? '--'}°C</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">Rain</span>
            <span className="aira-w-val aira-w-val-blue">{ap.rain_mm_h ?? '--'} mm/h</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">Wind</span>
            <span className="aira-w-val">{ap.wind_kph ?? '--'} km/h</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">Press</span>
            <span className="aira-w-val">{ap.pressure_hpa ?? '--'} hPa</span>
          </div>
        </div>
      </div>

      {/* 4. DATA FRESHNESS */}
      <div className="aira-section" style={{ borderBottom: 'none', paddingBottom: 0 }}>
        <div className="aira-section-title">
          <ActivityIcon />
          <span>Data Freshness</span>
        </div>
        <div className="aira-freshness-list">
          <div className="aira-fresh-row">
            <div className="aira-fresh-left">
              <span className="aira-fresh-dot" />
              <span className="aira-fresh-name">INSAT-3D/3DR (Geostationary)</span>
            </div>
            <span className="aira-fresh-time" style={{ color: '#22c55e' }}>2m ago</span>
          </div>
          <div className="aira-fresh-row">
            <div className="aira-fresh-left">
              <span className="aira-fresh-dot" />
              <span className="aira-fresh-name">IMDAA Reanalysis</span>
            </div>
            <span className="aira-fresh-time">6m ago</span>
          </div>
          <div className="aira-fresh-row">
            <div className="aira-fresh-left">
              <span className="aira-fresh-dot" />
              <span className="aira-fresh-name">CartoDEM Mesh</span>
            </div>
            <span className="aira-fresh-time">12m ago</span>
          </div>
          <div className="aira-fresh-row">
            <div className="aira-fresh-left">
              <span className="aira-fresh-dot" />
              <span className="aira-fresh-name">IMD Observations (AWS)</span>
            </div>
            <span className="aira-fresh-time">3m ago</span>
          </div>
          <div className="aira-fresh-row">
            <div className="aira-fresh-left">
              <span className="aira-fresh-dot" />
              <span className="aira-fresh-name">QPE</span>
            </div>
            <span className="aira-fresh-time" style={{ color: '#22c55e' }}>3m ago</span>
          </div>
          <div className="aira-fresh-row">
            <div className="aira-fresh-left">
              <span className="aira-fresh-dot" />
              <span className="aira-fresh-name">AI ENGINE</span>
            </div>
            <span className="aira-fresh-time" style={{ color: '#22c55e' }}>● LIVE</span>
          </div>
          <div className="aira-fresh-row">
            <div className="aira-fresh-left">
              <span className="aira-fresh-dot" style={{ background: 'transparent', boxShadow: 'none' }} />
              <span className="aira-fresh-name">LAST INFERENCE</span>
            </div>
            <span className="aira-fresh-time">16:39:42 IST</span>
          </div>
        </div>
      </div>

    </div>
  );
}
