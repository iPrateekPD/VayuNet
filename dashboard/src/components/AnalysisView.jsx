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
  Layout,
  Share2,
  Activity,
  Layers,
  Mountain
} from 'lucide-react';

export default function AnalysisView({ onNavigateTab }) {
  const [activeNav, setActiveNav] = useState('overview');

  const navItems = [
    { id: 'overview', icon: Layout, label: 'Overview' },
    { id: 'attribution', icon: Share2, label: 'Feature Attribution' },
    { id: 'evidence', icon: Activity, label: 'Atmospheric Evidence' },
    { id: 'profile', icon: Layers, label: 'Vertical Profile' },
    { id: 'terrain', icon: Mountain, label: 'Terrain Influence' },
  ];

  const features = [
    { label: 'CTT Drop Rate (Cloud Top Cooling)', pct: 38, color: '#ef4444' },
    { label: 'Integrated Water Vapor (IWV)', pct: 26, color: '#3b82f6' },
    { label: 'CAPE (Convective Available PE)', pct: 22, color: '#38bdf8' },
    { label: 'Terrain Elevation & Slope', pct: 8, color: '#22c55e' },
    { label: 'Moisture Flux Convergence', pct: 4, color: '#a855f7' },
    { label: 'Wind Shear', pct: 2, color: '#a855f7' }
  ];

  const thresholds = [
    { param: 'IWV', observed: '42 mm', limit: '> 58 mm', status: 'Nominal' },
    { param: 'CAPE', observed: '1,200 J/kg', limit: '> 2,500 J/kg', status: 'Nominal' },
    { param: 'CIN', observed: '85 J/kg', limit: '< 50 J/kg', status: 'Nominal' },
    { param: 'CTT Rate', observed: '-1.2 °C / 15 min', limit: '< -14 °C / 15 min', status: 'Breached' },
    { param: 'Wind Shear', observed: '8 m/s', limit: '> 15 m/s', status: 'Nominal' }
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
              <div className="ana-header-title">Cloudburst Analysis</div>
              <div className="ana-header-subtitle">Explainable AI insights for the current prediction</div>
            </div>
          </div>
          <div className="ana-header-right">
            <div className="ana-pill">
              <MapPin size={14} className="ana-pill-icon" />
              <span className="ana-pill-label">Chamoli, Uttarakhand</span>
            </div>
            <div className="ana-pill">
              <Calendar size={14} className="ana-pill-icon" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span className="ana-pill-label">Analysis Time</span>
                <span style={{ fontSize: '12px', fontWeight: '500' }}>08 Sep 2026, 11:52 PM IST</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '8px' }}>
              <div className="ana-conf-circle">
                <span>82%</span>
              </div>
              <div className="ana-conf-text">
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Model Confidence</span>
                <span style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff' }}>82%</span>
              </div>
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
            “VAYUNET predicts elevated cloudburst risk because cloud-top cooling and moisture convergence are rapidly increasing.”
          </div>
          <div className="ana-verdict-meta-bar">
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">PRIMARY ATTRIBUTION</span>
              <span className="ana-vm-val" style={{ color: '#ef4444' }}>CTT Drop (-14 °C / 15m · 38%)</span>
            </div>
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">ATMOSPHERIC MOISTURE</span>
              <span className="ana-vm-val" style={{ color: '#38bdf8' }}>IWV Saturation (42 mm · 26%)</span>
            </div>
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">CONVECTIVE POTENTIAL</span>
              <span className="ana-vm-val" style={{ color: '#eab308' }}>CAPE (1,200 J/kg · 22%)</span>
            </div>
            <div className="ana-verdict-metric">
              <span className="ana-vm-label">TERRAIN AMPLIFICATION</span>
              <span className="ana-vm-val" style={{ color: '#22c55e' }}>Alaknanda Deep Gorge</span>
            </div>
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
              Rapid cloud-top cooling combined with high moisture content and increasing atmospheric instability is driving the elevated cloudburst probability over Chamoli in the next 1–2 hours.
            </div>
            <div className="ana-insight-box">
              <Lightbulb size={20} color="#eab308" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <div className="ana-insight-title">Key Insight</div>
                <div className="ana-insight-text">
                  A sharp drop in cloud-top temperature with very high moisture and steep terrain is creating favorable conditions for an intense, localized cloudburst.
                </div>
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div className="ana-card">
            <div className="ana-card-title">
              Feature Attribution <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'normal', cursor: 'help' }}>ⓘ</span>
            </div>
            <div className="ana-fa-subtitle">% contribution to prediction confidence</div>
            
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
              <span className="ana-map-time">08 Sep 2026, 11:50 PM IST</span>
            </div>
            <div className="ana-map-body">
              <img src="https://images.unsplash.com/photo-1548684786-fb039b563fbd?q=80&w=400&auto=format&fit=crop" className="ana-map-img" style={{ filter: 'grayscale(0.5) hue-rotate(-20deg)' }} alt="CTT" />
              <div className="ana-marker">
                <div className="ana-marker-dot"/> Chamoli
              </div>
              <div style={{ position: 'absolute', bottom: '8px', left: '8px', fontSize: '10px', color: 'rgba(255,255,255,0.7)' }}>Uttarakhand</div>
              
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
              <img src="https://images.unsplash.com/photo-1548684786-fb039b563fbd?q=80&w=400&auto=format&fit=crop" className="ana-map-img" style={{ filter: 'hue-rotate(60deg) saturate(2)' }} alt="IWV" />
              <div className="ana-marker">
                <div className="ana-marker-dot"/> Chamoli
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
              <img src="https://images.unsplash.com/photo-1548684786-fb039b563fbd?q=80&w=400&auto=format&fit=crop" className="ana-map-img" style={{ filter: 'hue-rotate(-40deg) saturate(2)' }} alt="CAPE" />
              <div className="ana-marker">
                <div className="ana-marker-dot"/> Chamoli
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
               {/* Decorative Fake Chart matching screenshot */}
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
                    High instability<br/>(CAPE: 1,200 J/kg)
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="ana-bot-grid">
          
          {/* Atmospheric State */}
          <div className="ana-bot-card">
            <div className="ana-card-title">Atmospheric State <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>(Current Region)</span></div>
            
            <div className="ana-state-icons">
              <div className="ana-state-col">
                <Droplets size={24} className="ana-state-icon" />
                <div className="ana-state-label">IWV</div>
                <div className="ana-state-val">42 <span style={{ fontSize: '12px', fontWeight: 'normal' }}>mm</span></div>
              </div>

              <div className="ana-state-col">
                <Zap size={24} className="ana-state-icon" />
                <div className="ana-state-label">CAPE</div>
                <div className="ana-state-val">1,200</div>
                <div className="ana-state-sub">J/kg</div>
              </div>

              <div className="ana-state-col">
                <ThermometerSnowflake size={24} className="ana-state-icon" style={{ color: '#94a3b8' }} />
                <div className="ana-state-label">CIN</div>
                <div className="ana-state-val">85<span style={{ fontSize: '10px', fontWeight: 'normal' }}>J/kg</span></div>
              </div>

              <div className="ana-state-col">
                <ThermometerSnowflake size={24} className="ana-state-icon" style={{ color: '#38bdf8' }} />
                <div className="ana-state-label">CTT Rate</div>
                <div className="ana-state-val">-1.2 <span style={{ fontSize: '12px', fontWeight: 'normal' }}>°C</span></div>
                <div className="ana-state-sub">15 min</div>
              </div>

              <div className="ana-state-col">
                <Wind size={24} className="ana-state-icon" style={{ color: '#cbd5e1' }} />
                <div className="ana-state-label">Wind Shear</div>
                <div className="ana-state-val">8 <span style={{ fontSize: '12px', fontWeight: 'normal' }}>m/s</span></div>
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
