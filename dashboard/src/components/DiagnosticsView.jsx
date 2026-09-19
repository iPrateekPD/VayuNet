import React, { useState } from 'react';

const HAZARD_TABS = ['Thunderstorm', 'Cloudburst', 'Flash Flood'];

export default function DiagnosticsView({ currentData }) {
  const [activeHazard, setActiveHazard] = useState('Cloudburst');

  const atmo = currentData?.atmosphericState || {};
  const xai  = currentData?.xai || {};

  const bulletinText = {
    Cloudburst: `Cloudburst probability is elevated at ${currentData?.predictions?.cloudburst ?? 82}%. 
      Primary driver is a sharp CTT drop rate of ${atmo.cttDrop ?? '-16.4'}°C per 15 minutes (contribution: ${xai.cttDrop ?? 38}%), 
      indicating rapid convective deepening over the target catchment. 
      Moisture fuel (IWV: ${atmo.iwv ?? 64} mm) exceeds the critical 58 mm threshold, 
      and CAPE (${(atmo.cape ?? 3100).toLocaleString()} J/kg) far exceeds 2500 J/kg, 
      signaling high convective potential energy ready for release. 
      CartoDEM flow accumulation confirms high terrain channeling, amplifying runoff risk in downstream nullahs.`,
    Thunderstorm: `Severe thunderstorm probability at ${currentData?.predictions?.thunderstorm ?? 71}%. 
      Wind shear (${atmo.windShear ?? 22} m/s) combined with CAPE instability is driving organized convective initiation. 
      CTT drop signature confirms cloud top deepening consistent with active mesoscale convective system development.`,
    'Flash Flood': `Flash flood inundation risk at ${currentData?.predictions?.flood ?? 68}%. 
      Cloudburst output is being hydrologically routed through CartoDEM D8 flow accumulation channels. 
      High terrain drainage accumulation values indicate downstream surge concentration in primary nullah corridors.`,
  };

  const xaiRows = [
    { name: 'IWV — Integrated Water Vapor',       pct: xai.iwv ?? 26 },
    { name: 'CAPE — Convective Available PE',      pct: xai.cape ?? 22 },
    { name: 'CTT Drop Rate — Cloud Top Cooling',   pct: xai.cttDrop ?? 38 },
    { name: 'DEM — Terrain Drainage Coupling',     pct: xai.dem ?? 14 },
  ];

  return (
    <div className="diagnostics-layout">
      {/* LEFT: ECMWF-style parameter sidebar */}
      <div className="diagnostics-sidebar">
        <div className="diagnostics-sidebar-header">
          <div className="diag-page-title">Atmospheric Diagnostics</div>
          <div className="diag-page-sub">Atmospheric Precursors · Illustrative Factor Contribution</div>
        </div>

        {/* Hazard selector */}
        <div className="ecmwf-param-section">
          <div className="ecmwf-param-title">Prediction Target</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {HAZARD_TABS.map(h => (
              <button
                key={h}
                onClick={() => setActiveHazard(h)}
                style={{
                  background: activeHazard === h ? 'var(--accent-dim)' : 'transparent',
                  border: `1px solid ${activeHazard === h ? 'var(--accent)' : 'var(--border)'}`,
                  color: activeHazard === h ? 'var(--accent)' : 'var(--text-muted)',
                  padding: '8px 12px',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 12,
                  fontFamily: 'var(--font-mono)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Current atmospheric state — ECMWF parameter rows */}
        <div className="ecmwf-param-section">
          <div className="ecmwf-param-title">Atmospheric State</div>
          {[
            { name: 'IWV',        val: atmo.iwv ?? '64',                         unit: 'mm',    flag: (atmo.iwv ?? 64) > 58 },
            { name: 'CAPE',       val: (atmo.cape ?? 3100).toLocaleString(),      unit: 'J/kg',  flag: (atmo.cape ?? 3100) > 2500 },
            { name: 'CIN',        val: atmo.cin ?? '-18',                         unit: 'J/kg',  flag: false },
            { name: 'CTT Rate',   val: atmo.cttDrop ?? '-16.4',                   unit: '°C/15m',flag: true },
            { name: 'Wind Shear', val: atmo.windShear ?? '22',                    unit: 'm/s',   flag: false },
          ].map(p => (
            <div key={p.name} className="param-row">
              <span className="param-name">{p.name}</span>
              <span className="param-val" style={{ color: p.flag ? 'var(--sev-severe)' : 'var(--text-primary)' }}>
                {p.val}
                <span className="param-unit">{p.unit}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Onset window */}
        <div className="ecmwf-param-section">
          <div className="ecmwf-param-title">Forecast Validity</div>
          <div className="param-row">
            <span className="param-name">Onset Window</span>
            <span className="param-val" style={{ fontSize: 11 }}>{currentData?.onsetWindow ?? 'T+2h to T+4h'}</span>
          </div>
          <div className="param-row">
            <span className="param-name">Severity</span>
            <span className={`severity-badge ${currentData?.severity ?? 'severe'}`}>
              {(currentData?.severity ?? 'SEVERE').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* RIGHT: Charts + analysis */}
      <div className="diagnostics-main">

        {/* XAI Attribution — ECMWF chart style */}
        <div className="xai-attribution-section">
          <div className="xai-attr-header">
            <div>
              <div className="xai-attr-title">Factor Contribution (Illustrative) — {activeHazard}</div>
              <div className="xai-attr-subtitle">Illustrative factor contribution to prediction risk score</div>
            </div>
            <span className="prob-val" style={{ fontFamily: 'var(--font-mono)', fontSize: 22 }}>
              {activeHazard === 'Cloudburst' ? (currentData?.predictions?.cloudburst ?? 82)
               : activeHazard === 'Thunderstorm' ? (currentData?.predictions?.thunderstorm ?? 71)
               : (currentData?.predictions?.flood ?? 68)}%
            </span>
          </div>

          <div className="xai-attr-rows">
            {xaiRows.map(r => (
              <div key={r.name} className="xai-attr-row">
                <span className="xai-attr-name">{r.name}</span>
                <div className="xai-attr-bar-track">
                  <div className="xai-attr-bar-fill" style={{ width: `${r.pct}%` }} />
                </div>
                <span className="xai-attr-pct">{r.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Storm Recipe Bulletin — meteorologist-style */}
        <div className="storm-recipe-box">
          <div className="recipe-header">
            <h3>Meteorological Evidence Summary — {activeHazard}</h3>
          </div>
          <div style={{ padding: '16px 20px 20px' }}>
            <div className="recipe-bulletin">
              {bulletinText[activeHazard]}
            </div>
          </div>
        </div>

        {/* Precursor threshold reference table */}
        <div className="verification-table">
          <div className="vtable-header">
            <h3>Precursor Threshold Reference</h3>
          </div>
          <table className="forensics-metrics">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Observed Value</th>
                <th>Alert Threshold</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { param: 'IWV',        obs: `${atmo.iwv ?? 64} mm`,               thresh: '> 58 mm',           ok: (atmo.iwv ?? 64) > 58 },
                { param: 'CAPE',       obs: `${(atmo.cape ?? 3100).toLocaleString()} J/kg`, thresh: '> 2500 J/kg', ok: (atmo.cape ?? 3100) > 2500 },
                { param: 'CTT Rate',   obs: `${atmo.cttDrop ?? -16.4}°C / 15 min`, thresh: '< −14°C / 15 min', ok: true },
                { param: 'Wind Shear', obs: `${atmo.windShear ?? 22} m/s`,         thresh: '> 15 m/s',         ok: (atmo.windShear ?? 22) > 15 },
                { param: 'DEM Accum',  obs: 'High basin accumulation',              thresh: 'High risk basin',  ok: true },
              ].map(r => (
                <tr key={r.param}>
                  <td>{r.param}</td>
                  <td style={{ color: 'var(--text-primary)' }}>{r.obs}</td>
                  <td>{r.thresh}</td>
                  <td>
                    <span style={{
                      fontSize: 10,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      color: r.ok ? 'var(--sev-severe)' : 'var(--sev-low)',
                    }}>
                      {r.ok ? '● BREACHED' : '○ NOMINAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
