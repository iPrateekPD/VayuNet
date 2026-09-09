import React, { useState } from 'react';

export default function AnalysisView({ currentData }) {
  const [subTab, setSubTab] = useState('overview');
  const [targetHazard, setTargetHazard] = useState('cloudburst');

  const atmo = currentData?.atmosphericState || {
    iwv: 64,
    cape: 3100,
    cin: -18,
    cttDrop: -16.4,
    windShear: 22,
  };

  const xai = currentData?.xai || {
    cttDrop: 38,
    iwv: 26,
    cape: 22,
    terrain: 8,
    windShear: 2,
  };

  const keyDrivers = [
    { label: 'CTT Drop Rate (Rapid Cloud-Top Cooling)', pct: 38, desc: 'Convective cloud top deepening > 16°C in 15 mins indicates rapid explosive updraft.' },
    { label: 'IWV (Integrated Water Vapor)', pct: 26, desc: 'Atmospheric moisture column reaches 64 mm, exceeding saturated trigger threshold of 58 mm.' },
    { label: 'CAPE (Convective Instability)', pct: 22, desc: 'High convective potential (3,100 J/kg) provides abundant kinetic buoyancy energy.' },
    { label: 'Terrain Drainage Coupling (CartoDEM D8)', pct: 8, desc: 'Steep Himalayan nullah orography channels runoff directly toward Alaknanda gorge.' },
    { label: 'Deep Layer Wind Shear (0-6 km)', pct: 2, desc: 'Moderate 22 m/s bulk shear sustains multicell storm organization.' },
  ];

  const thresholds = [
    { param: 'Integrated Water Vapor (IWV)', observed: `${atmo.iwv ?? 64} mm`, threshold: '> 58 mm', status: 'BREACHED', sev: 'breached' },
    { param: 'Convective Available Potential Energy (CAPE)', observed: `${(atmo.cape ?? 3100).toLocaleString()} J/kg`, threshold: '> 2,500 J/kg', status: 'BREACHED', sev: 'breached' },
    { param: 'Cloud Top Cooling Rate (CTT Rate)', observed: `${atmo.cttDrop ?? -16.4} °C / 15m`, threshold: '< -10.0 °C / 15m', status: 'BREACHED', sev: 'breached' },
    { param: 'Deep Layer 0–6km Bulk Shear', observed: `${atmo.windShear ?? 22} m/s`, threshold: '> 20 m/s', status: 'WATCH', sev: 'watch' },
    { param: 'Convective Inhibition (CIN)', observed: `${atmo.cin ?? -18} J/kg`, threshold: '> -50 J/kg', status: 'NORMAL', sev: 'normal' },
    { param: 'CartoDEM Topographic Funneling Index', observed: '0.86 (Steep Catchment)', threshold: '> 0.70', status: 'BREACHED', sev: 'breached' },
  ];

  return (
    <div className="ops-analysis-container">
      {/* Header */}
      <div className="ops-analysis-header">
        <div className="ops-analysis-title-group">
          <h1>Atmospheric Analysis & Explainable AI (XAI)</h1>
          <div className="ops-analysis-target">
            <span>Target:</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>Cloudburst & Flash Flood Prediction</span>
            <span>·</span>
            <span>Location:</span>
            <span style={{ color: '#ffffff', fontWeight: 600 }}>Chamoli, Uttarakhand (Alaknanda Basin)</span>
          </div>
        </div>

        <div className="ops-analysis-meta-chips">
          <div className="ops-analysis-chip">
            <span className="ops-analysis-chip-label">Model Confidence</span>
            <span className="ops-analysis-chip-value" style={{ color: '#ef4444' }}>82% (High Risk)</span>
          </div>
          <div className="ops-analysis-chip">
            <span className="ops-analysis-chip-label">Analysis Timestamp</span>
            <span className="ops-analysis-chip-value">08 Sep 2026 · 11:52 PM IST</span>
          </div>
          <div className="ops-analysis-chip">
            <span className="ops-analysis-chip-label">Attribution Method</span>
            <span className="ops-analysis-chip-value" style={{ color: '#38bdf8' }}>Integrated Gradients</span>
          </div>
        </div>
      </div>

      {/* Subnavigation Tabs */}
      <div className="ops-subnav">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'attribution', label: 'Feature Attribution' },
          { id: 'evidence', label: 'Atmospheric Evidence' },
          { id: 'profile', label: 'Vertical Profile' },
          { id: 'terrain', label: 'Terrain Influence' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`ops-subnav-btn ${subTab === tab.id ? 'active' : ''}`}
            onClick={() => setSubTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Analysis Body */}
      <div className="ops-analysis-grid">
        {/* Left Column: Why This Hazard + Key Drivers + Advanced Evidence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Primary Section: Plain-Language Explanation FIRST */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">Why This Hazard?</span>
              <span className="ops-badge-status ops-status-breached">🔴 CRITICAL THREAT LEVEL</span>
            </div>

            <div className="ops-plain-language-box">
              <div className="ops-plain-language-lead">Plain-Language Meteorological Synthesis:</div>
              "Rapid cloud-top cooling combined with high moisture and increasing atmospheric instability is driving the elevated cloudburst probability over Chamoli catchment. A steep drop in brightness temperature (-16.4°C per 15 minutes) reveals violent convective vertical growth, while moisture reservoir exceeds saturation thresholds, locking moisture into narrow Himalayan valley walls."
            </div>

            {/* Key Drivers Contribution Bars */}
            <div>
              <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#ffffff', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Key Drivers of Model Prediction (Captum Feature Attribution)
              </div>
              <div className="ops-driver-list">
                {keyDrivers.map((driver) => (
                  <div key={driver.label} className="ops-driver-row">
                    <div className="ops-driver-info">
                      <span className="ops-driver-name">{driver.label}</span>
                      <span className="ops-driver-val">{driver.pct}%</span>
                    </div>
                    <div className="ops-driver-track">
                      <div className="ops-driver-bar" style={{ width: `${driver.pct * 2}%` }} />
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--ops-text-muted)', marginTop: '2px' }}>
                      {driver.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Analysis Sections based on Subnav */}
          {(subTab === 'overview' || subTab === 'evidence' || subTab === 'attribution') && (
            <div className="ops-card">
              <div className="ops-card-title-row">
                <span className="ops-card-title">Satellite & Sensor Evidence</span>
                <span style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>INSAT-3DR TIR-1 + Water Vapor Channel</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div style={{ background: '#050a14', border: '1px solid var(--ops-border-subtle)', borderRadius: 'var(--ops-radius-sm)', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                    TIR-1 Brightness Temperature
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--ops-font-mono)', color: '#ffffff' }}>
                    -74.2 °C
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ops-text-secondary)', marginTop: '4px' }}>
                    Indicates severe convective cloud penetration into upper troposphere beyond 13 km MSL.
                  </div>
                </div>

                <div style={{ background: '#050a14', border: '1px solid var(--ops-border-subtle)', borderRadius: 'var(--ops-radius-sm)', padding: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', marginBottom: '4px' }}>
                    Water Vapor Absorption (6.8 µm)
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--ops-font-mono)', color: '#ffffff' }}>
                    -38.6 °C
                  </div>
                  <div style={{ fontSize: '10.5px', color: 'var(--ops-text-secondary)', marginTop: '4px' }}>
                    Mid-tropospheric moisture transport active from Bay of Bengal along southerly Himalayan slope.
                  </div>
                </div>
              </div>
            </div>
          )}

          {(subTab === 'overview' || subTab === 'terrain') && (
            <div className="ops-card">
              <div className="ops-card-title-row">
                <span className="ops-card-title">Topographic & Terrain Amplification</span>
                <span style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>CartoDEM 30m Resolution</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--ops-text-secondary)', lineHeight: 1.55 }}>
                Orographic forced ascent over the Greater Himalayas forces incoming saturated air parcels to their Level of Free Convection (LFC) rapidly. The V-shaped valley geometry of the Alaknanda and Rishi Ganga catchments accelerates hydraulic runoff accumulation, reducing basin lag time from 3.5 hours to 1.8 hours.
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Threshold Table + Subordinated Atmospheric State + Sounding */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Threshold Verification Table */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">Operational Threshold Status</span>
              <span style={{ fontSize: '10px', color: 'var(--ops-text-muted)' }}>IMD & NCMRWF Baselines</span>
            </div>

            <table className="ops-threshold-table">
              <thead>
                <tr>
                  <th>Parameter</th>
                  <th>Observed</th>
                  <th>Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.map((t) => (
                  <tr key={t.param}>
                    <td style={{ color: '#ffffff', fontWeight: 500 }}>{t.param}</td>
                    <td style={{ fontFamily: 'var(--ops-font-mono)', color: '#cbd5e1' }}>{t.observed}</td>
                    <td style={{ fontFamily: 'var(--ops-font-mono)', color: 'var(--ops-text-muted)' }}>{t.threshold}</td>
                    <td>
                      <span className={`ops-badge-status ops-status-${t.sev}`}>
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Vertical Atmospheric Profile (Subordinated State) */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">Vertical Sounding Profile</span>
              <span style={{ fontSize: '10px', color: 'var(--ops-text-muted)' }}>Thermodynamic Levels</span>
            </div>

            <div className="ops-profile-box">
              <div className="ops-profile-row">
                <span style={{ color: 'var(--ops-text-muted)' }}>Level of Free Convection (LFC)</span>
                <span style={{ color: '#ffffff', fontWeight: 600 }}>780 hPa (2,240 m MSL)</span>
              </div>
              <div className="ops-profile-row">
                <span style={{ color: 'var(--ops-text-muted)' }}>Lifted Condensation Level (LCL)</span>
                <span style={{ color: '#ffffff' }}>850 hPa (1,480 m MSL)</span>
              </div>
              <div className="ops-profile-row">
                <span style={{ color: 'var(--ops-text-muted)' }}>Equilibrium Level (EL)</span>
                <span style={{ color: '#ffffff' }}>180 hPa (12,800 m MSL)</span>
              </div>
              <div className="ops-profile-row">
                <span style={{ color: 'var(--ops-text-muted)' }}>Freezing Level (0°C Isotherm)</span>
                <span style={{ color: '#38bdf8' }}>580 hPa (4,650 m MSL)</span>
              </div>
              <div className="ops-profile-row">
                <span style={{ color: 'var(--ops-text-muted)' }}>Precipitable Water Index (PWI)</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>64.2 mm (Saturated)</span>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--ops-text-muted)', lineHeight: 1.4 }}>
              Zero convective inhibition (-18 J/kg) indicates any orographic parcel perturbation triggers instant explosive release of the 3,100 J/kg CAPE column.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
