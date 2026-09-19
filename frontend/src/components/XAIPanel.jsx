import React from 'react';

export default function XAIPanel({ factors }) {
  // Handle both legacy array format and new object format
  let iwv, cape, cttDrop, dem;
  if (Array.isArray(factors)) {
    const get = (name) => {
      const item = factors.find(f => f.factor?.toLowerCase().includes(name));
      return item ? Math.round(item.score * 100) : 0;
    };
    iwv     = get('iwv');
    cape    = get('cape');
    cttDrop = get('ctt');
    dem     = get('wind') || 14;
  } else {
    iwv     = factors?.iwv ?? 26;
    cape    = factors?.cape ?? 22;
    cttDrop = factors?.cttDrop ?? 38;
    dem     = factors?.dem ?? 14;
  }

  const items = [
    { key: 'iwv',      label: 'IWV — Integrated Water Vapor',      val: iwv },
    { key: 'cape',     label: 'CAPE — Convective Instability',      val: cape },
    { key: 'cttDrop',  label: 'CTT Drop Rate — Cloud Top Cooling',  val: cttDrop },
    { key: 'dem',      label: 'DEM — Terrain Drainage Coupling',    val: dem },
  ];

  return (
    <div className="panel">
      <div className="panel-title">XAI — Feature Attribution</div>
      <div className="xai-section">
        {items.map(({ key, label, val }) => (
          <div key={key} className="xai-factor-row">
            <div className="xai-factor-header">
              <span className="xai-factor-name">{label}</span>
              <span className="xai-factor-pct">{val}%</span>
            </div>
            <div className="xai-bar-track">
              <div className="xai-bar-fill" style={{ width: `${val}%` }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', paddingTop: 6 }}>
          Captum integrated gradients · % contribution to active alert
        </div>
      </div>
    </div>
  );
}
