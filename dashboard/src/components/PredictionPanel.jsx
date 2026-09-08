import React from 'react';

export default function PredictionPanel({ predictions, severity }) {
  const hazards = [
    { key: 'thunderstorm', label: 'Severe Thunderstorm', abbr: 'TS', color: 'var(--hazard-thunder)' },
    { key: 'cloudburst',   label: 'Cloudburst',          abbr: 'CB', color: 'var(--hazard-burst)' },
    { key: 'flood',        label: 'Flash Flood',         abbr: 'FF', color: 'var(--hazard-flood)' },
  ];

  return (
    <div className="panel">
      <div className="panel-title">
        Hazard Probability
      </div>
      <div className="prediction-section">
        {hazards.map(({ key, label, abbr, color }) => {
          const val = predictions?.[key] ?? 0;
          return (
            <div key={key} className="prob-row">
              <div className="prob-header">
                <span className="prob-name">
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: color,
                    marginRight: 6,
                    fontWeight: 700,
                    opacity: 0.9
                  }}>{abbr}</span>
                  {label}
                </span>
                <span className="prob-val" style={{ color: val > 70 ? color : 'var(--text-primary)' }}>
                  {val}%
                </span>
              </div>
              <div className="prob-bar-track">
                <div
                  className="prob-bar-fill"
                  style={{ width: `${val}%`, background: color, opacity: 0.85 }}
                />
              </div>
            </div>
          );
        })}

        <div style={{
          paddingTop: 10,
          borderTop: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            COMPOSITE SEVERITY
          </span>
          <span className={`severity-badge ${severity}`}>{severity?.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
}
