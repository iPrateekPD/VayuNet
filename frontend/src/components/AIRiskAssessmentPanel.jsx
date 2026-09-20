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
  // Use mock data to match screenshot perfectly for now.
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
          Model: VAYUNET-MTL-v2.0 •<br/>28.3 ms
        </div>
      </div>

      {/* Threat Title & Location */}
      <div className="aira-threat-card">
        <div className="aira-threat-icon-col">
          <ShieldCheckIcon />
        </div>
        <div className="aira-threat-text-col">
          <h2 className="aira-threat-title">DEEP GORGE FLASH FLOOD</h2>
          <h3 className="aira-threat-subtitle">NOMINAL / SAFE (Risk Score: 0.18)</h3>
          <div className="aira-location">
            <MapPinIcon />
            <span>Chamoli (Alaknanda Basin), Uttarakhand</span>
          </div>
        </div>
      </div>

      {/* Benchmark Banner */}
      <div className="aira-benchmark-banner">
        <div className="aira-benchmark-icon">
          <BankIcon />
        </div>
        <div className="aira-benchmark-text">
          Benchmark: <strong>Chamoli 2021 Alaknanda Surge</strong> • Precursor<br/>Proximity: <strong>14.1%</strong>
        </div>
      </div>

      {/* Narrative */}
      <div className="aira-narrative">
        Current weather in Chamoli is nominal (23.3°C, rain 0.0 mm/h).
        Atmospheric precursors (CAPE: 0 J/kg, IWV: 18.5 mm) are at 
        <strong> 14.1% </strong> of the disaster trigger threshold established by 
        Chamoli 2021 Alaknanda Surge (disaster trigger: IWV &gt; 48.0 mm, CAPE &gt; 
        1900 J/kg). Disaster risk is currently NOMINAL.
      </div>

      {/* Metrics Grid */}
      <div className="aira-metrics-grid">
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <DropletIcon />
            <span>18.5 <span>mm</span></span>
          </div>
          <div className="aira-metric-label">Precursor IWV</div>
        </div>
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <ZapIcon />
            <span>2100 <span>J/kg</span></span>
          </div>
          <div className="aira-metric-label">Convective CAPE</div>
        </div>
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <ActivityIcon />
            <span>0.18</span>
          </div>
          <div className="aira-metric-label">Model risk score</div>
        </div>
        <div className="aira-metric-box">
          <div className="aira-metric-val">
            <ClockIcon />
            <span>28.3 <span>ms</span></span>
          </div>
          <div className="aira-metric-label">Neural latency</div>
        </div>
      </div>

      {/* Recommended Action */}
      <div className="aira-action-box">
        <div className="aira-action-header">
          <AlertIcon />
          <span>Recommended Action</span>
        </div>
        <div className="aira-action-text">
          Maintain routine automated radar surveillance and automated<br/>AWS monitoring.
        </div>
      </div>

      {/* Investigate Drivers Button */}
      <button className="aira-investigate-btn">
        <ScienceIcon />
        <span>Investigate Drivers (Why?) &rarr;</span>
      </button>

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
            <span className="aira-w-val">23.3 °C</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">Humidity</span>
            <span className="aira-w-val">--</span>
          </div>
          
          <div className="aira-w-row">
            <span className="aira-w-label">Pressure</span>
            <span className="aira-w-val">857.2 hPa</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">Rain</span>
            <span className="aira-w-val aira-w-val-blue">0.0 mm</span>
          </div>
          
          <div className="aira-w-row">
            <span className="aira-w-label">Wind</span>
            <span className="aira-w-val">--</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">CAPE</span>
            <span className="aira-w-val aira-w-val-orange">0 J/kg</span>
          </div>
          
          <div className="aira-w-row">
            <span className="aira-w-label">CIN</span>
            <span className="aira-w-val">126 J/kg</span>
          </div>
          <div className="aira-w-row">
            <span className="aira-w-label">IWV</span>
            <span className="aira-w-val aira-w-val-blue">18.5 kg/m²</span>
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
