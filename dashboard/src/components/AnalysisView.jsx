import React, { useState } from 'react';
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
  Layers,
  ShieldAlert
} from 'lucide-react';

export default function AnalysisView({ onNavigateTab }) {
  const features = [
    { label: 'CTT Drop Rate (Cloud Top Cooling)', pct: 38, color: '#ef4444' },
    { label: 'Integrated Water Vapor (IWV)', pct: 26, color: '#0ea5e9' },
    { label: 'CAPE (Convective Available PE)', pct: 22, color: '#eab308' },
    { label: 'Terrain Elevation & Slope Lift', pct: 8, color: '#22c55e' },
    { label: 'Moisture Flux Convergence', pct: 4, color: '#a855f7' },
    { label: '850 hPa Wind Shear', pct: 2, color: '#64748b' }
  ];

  return (
    <div className="ana-root">
      {/* 1. TOP HEADER BAR */}
      <div className="ana-header">
        <div className="ana-header-left">
          <div className="ana-header-icon-box">
            <Brain size={20} color="#38bdf8" />
          </div>
          <div>
            <div className="ana-header-title">Explainable AI &amp; Atmospheric Drivers</div>
            <div className="ana-header-subtitle">Physics-grounded XAI diagnostics for Chamoli convective event</div>
          </div>
        </div>

        <div className="ana-header-right">
          <div className="ana-pill">
            <MapPin size={13} className="ana-pill-icon" />
            <span className="ana-pill-label">Chamoli, Uttarakhand</span>
          </div>
          <div className="ana-pill">
            <Calendar size={13} className="ana-pill-icon" />
            <span className="ana-pill-label">08 Sep 2026, 11:52 PM IST</span>
          </div>
          <div className="ana-conf-pill">
            <span className="ana-conf-label">Model Confidence</span>
            <span className="ana-conf-val">82%</span>
          </div>
        </div>
      </div>

      {/* 2. REASONING & FEATURE ATTRIBUTION (2 COLUMNS) */}
      <div className="ana-grid-2">
        {/* Left: Scientific Reasoning */}
        <div className="ana-card">
          <div className="ana-card-title-row">
            <div className="ana-card-title">
              <Lightbulb size={16} color="#eab308" />
              <span>Physical Convective Drivers</span>
            </div>
            <span className="ana-badge-critical">HIGH RISK CLUSTER</span>
          </div>

          <p className="ana-reasoning-lead">
            Rapid cloud-top cooling (<strong style={{ color: '#ef4444' }}>-14 °C / 15 min</strong>) combined with extreme moisture convergence (<strong style={{ color: '#38bdf8' }}>42 mm IWV</strong>) and steep orographic lift along the Alaknanda River gorge is driving the elevated cloudburst probability over Chamoli in the next 1–2 hours.
          </p>

          <div className="ana-driver-metrics-grid">
            <div className="ana-driver-metric-box">
              <span className="ana-dmb-label">Primary Driver</span>
              <span className="ana-dmb-val" style={{ color: '#ef4444' }}>CTT Drop (-14 °C)</span>
              <span className="ana-dmb-sub">38% Model Weight</span>
            </div>
            <div className="ana-driver-metric-box">
              <span className="ana-dmb-label">Atmospheric Moisture</span>
              <span className="ana-dmb-val" style={{ color: '#38bdf8' }}>42 mm (IWV)</span>
              <span className="ana-dmb-sub">26% Model Weight</span>
            </div>
            <div className="ana-driver-metric-box">
              <span className="ana-dmb-label">Convective Potential</span>
              <span className="ana-dmb-val" style={{ color: '#eab308' }}>1,200 J/kg</span>
              <span className="ana-dmb-sub">22% Model Weight</span>
            </div>
            <div className="ana-driver-metric-box">
              <span className="ana-dmb-label">Terrain Amplification</span>
              <span className="ana-dmb-val" style={{ color: '#22c55e' }}>Alaknanda Gorge</span>
              <span className="ana-dmb-sub">8% Slope Lift</span>
            </div>
          </div>
        </div>

        {/* Right: Feature Attribution SHAP Bars */}
        <div className="ana-card">
          <div className="ana-card-title-row">
            <div className="ana-card-title">
              <Layers size={16} color="#38bdf8" />
              <span>Feature Attribution (SHAP Decomposition)</span>
            </div>
            <span className="ana-card-sub">% contribution to prediction</span>
          </div>

          <div className="ana-fa-list">
            {features.map((f, i) => (
              <div key={i} className="ana-fa-row">
                <span className="ana-fa-label">{f.label}</span>
                <div className="ana-fa-bar-bg">
                  <div 
                    className="ana-fa-bar-fill" 
                    style={{ width: `${f.pct}%`, background: f.color }} 
                  />
                </div>
                <span className="ana-fa-pct">{f.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. 4-COLUMN ATMOSPHERIC TELEMETRY CARDS (VECTOR VISUALS - NO BROKEN IMAGES) */}
      <div className="ana-maps-grid">
        {/* Card 1: Cloud Top Temperature */}
        <div className="ana-map-card">
          <div className="ana-map-header">
            <span className="ana-map-title">Satellite · Cloud Top Temp</span>
            <span className="ana-map-badge">INSAT-3DR</span>
          </div>
          <div className="ana-vector-canvas">
            <svg viewBox="0 0 200 130" width="100%" height="100%">
              <rect width="200" height="130" fill="#040914" />
              {/* Mountain ridge backdrop */}
              <path d="M0 110 L35 85 L70 95 L110 65 L150 90 L200 70 L200 130 L0 130 Z" fill="#0c192c" opacity="0.8" />
              {/* Thermal infrared contours */}
              <ellipse cx="105" cy="60" rx="75" ry="42" fill="#1e3a8a" opacity="0.35" />
              <ellipse cx="105" cy="58" rx="55" ry="32" fill="#3b82f6" opacity="0.45" />
              <ellipse cx="105" cy="56" rx="38" ry="22" fill="#8b5cf6" opacity="0.65" />
              <ellipse cx="105" cy="55" rx="24" ry="14" fill="#ec4899" opacity="0.85" />
              <circle cx="105" cy="55" r="8" fill="#f43f5e" opacity="0.95" />
              {/* Pin */}
              <circle cx="105" cy="55" r="2.5" fill="#ffffff" />
              <text x="110" y="52" fill="#f8fafc" fontSize="8.5" fontWeight="700">Chamoli (-72°C)</text>
            </svg>
            <div className="ana-vector-legend-h">
              <span>-80°C</span>
              <div className="ana-legend-ramp-temp" />
              <span>-20°C</span>
            </div>
          </div>
        </div>

        {/* Card 2: Integrated Water Vapor */}
        <div className="ana-map-card">
          <div className="ana-map-header">
            <span className="ana-map-title">Atmospheric Moisture (IWV)</span>
            <span className="ana-map-badge">IMDAA</span>
          </div>
          <div className="ana-vector-canvas">
            <svg viewBox="0 0 200 130" width="100%" height="100%">
              <rect width="200" height="130" fill="#040914" />
              <path d="M0 120 L40 90 L85 105 L130 75 L175 95 L200 80 L200 130 L0 130 Z" fill="#0b1728" opacity="0.8" />
              {/* River funnel */}
              <path d="M40 130 Q90 90 105 60 Q120 40 140 0" stroke="#0284c7" strokeWidth="2" fill="none" opacity="0.6" />
              {/* Moisture plume */}
              <path d="M50 130 C70 90 90 70 105 58 C120 45 140 60 160 85 C140 115 110 125 50 130 Z" fill="#06b6d4" opacity="0.3" />
              <ellipse cx="105" cy="62" rx="35" ry="24" fill="#0ea5e9" opacity="0.55" />
              <ellipse cx="105" cy="60" rx="18" ry="12" fill="#38bdf8" opacity="0.85" />
              <circle cx="105" cy="60" r="2.5" fill="#ffffff" />
              <text x="110" y="58" fill="#f8fafc" fontSize="8.5" fontWeight="700">Chamoli (42 mm)</text>
            </svg>
            <div className="ana-vector-legend-h">
              <span>0 mm</span>
              <div className="ana-legend-ramp-moisture" />
              <span>60 mm</span>
            </div>
          </div>
        </div>

        {/* Card 3: CAPE Convective Instability */}
        <div className="ana-map-card">
          <div className="ana-map-header">
            <span className="ana-map-title">Convective Available PE</span>
            <span className="ana-map-badge">NCMRWF</span>
          </div>
          <div className="ana-vector-canvas">
            <svg viewBox="0 0 200 130" width="100%" height="100%">
              <rect width="200" height="130" fill="#040914" />
              <path d="M0 115 L45 88 L90 98 L135 68 L180 88 L200 75 L200 130 L0 130 Z" fill="#0b1728" opacity="0.8" />
              {/* CAPE Instability Cell */}
              <ellipse cx="105" cy="65" rx="60" ry="38" fill="#22c55e" opacity="0.25" />
              <ellipse cx="105" cy="63" rx="42" ry="26" fill="#eab308" opacity="0.45" />
              <ellipse cx="105" cy="60" rx="25" ry="16" fill="#f97316" opacity="0.7" />
              <circle cx="105" cy="58" r="9" fill="#ef4444" opacity="0.85" />
              <circle cx="105" cy="58" r="2.5" fill="#ffffff" />
              <text x="110" y="55" fill="#f8fafc" fontSize="8.5" fontWeight="700">1,200 J/kg</text>
            </svg>
            <div className="ana-vector-legend-h">
              <span>0</span>
              <div className="ana-legend-ramp-cape" />
              <span>2,000 J/kg</span>
            </div>
          </div>
        </div>

        {/* Card 4: Vertical Atmospheric Sounding */}
        <div className="ana-map-card">
          <div className="ana-map-header">
            <span className="ana-map-title">Vertical Sounding (Skew-T)</span>
            <span className="ana-map-badge">Radiosonde</span>
          </div>
          <div className="ana-vector-canvas">
            <svg viewBox="0 0 200 130" width="100%" height="100%">
              <rect width="200" height="130" fill="#040914" />
              {/* Grid levels */}
              <line x1="26" y1="20" x2="190" y2="20" stroke="rgba(255,255,255,0.06)" strokeDasharray="2,2" />
              <line x1="26" y1="50" x2="190" y2="50" stroke="rgba(255,255,255,0.06)" strokeDasharray="2,2" />
              <line x1="26" y1="80" x2="190" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="2,2" />
              <line x1="26" y1="110" x2="190" y2="110" stroke="rgba(255,255,255,0.06)" strokeDasharray="2,2" />
              
              {/* Pressure labels */}
              <text x="22" y="23" fill="#64748b" fontSize="7" textAnchor="end">200</text>
              <text x="22" y="53" fill="#64748b" fontSize="7" textAnchor="end">500</text>
              <text x="22" y="83" fill="#64748b" fontSize="7" textAnchor="end">700</text>
              <text x="22" y="113" fill="#64748b" fontSize="7" textAnchor="end">850</text>
              
              {/* Instability shaded area between Dewpoint and Temp */}
              <path d="M 60 115 L 85 85 L 115 50 L 140 20 L 125 20 L 100 50 L 72 85 L 50 115 Z" fill="rgba(239, 68, 68, 0.18)" />
              {/* Temperature Line (Red) */}
              <path d="M 60 115 L 85 85 L 115 50 L 140 20" fill="none" stroke="#ef4444" strokeWidth="2" />
              {/* Dewpoint Line (Blue) */}
              <path d="M 50 115 L 72 85 L 100 50 L 125 20" fill="none" stroke="#38bdf8" strokeWidth="2" />
              
              {/* Legend pills */}
              <circle cx="140" cy="118" r="3" fill="#ef4444" />
              <text x="146" y="120" fill="#94a3b8" fontSize="7">Temp</text>
              <circle cx="170" cy="118" r="3" fill="#38bdf8" />
              <text x="176" y="120" fill="#94a3b8" fontSize="7">DewPt</text>
            </svg>
            <div className="ana-vector-legend-h" style={{ justifyContent: 'center' }}>
              <span style={{ color: '#f87171' }}>Convective Inversion Breached (CAPE: 1,200 J/kg)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
