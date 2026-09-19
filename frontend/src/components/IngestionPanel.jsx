import React from 'react';

export default function IngestionPanel({ logs }) {
  const sources = [
    { id: 'insat',   label: 'INSAT-3D/3DR', sub: 'WV + TIR · 15 min cadence',   status: 'online' },
    { id: 'imdaa',   label: 'IMDAA Reanalysis', sub: 'CAPE/CIN/Shear · hourly', status: 'online' },
    { id: 'dem',     label: 'CartoDEM 30m',  sub: 'Static DEM · pre-processed',  status: 'online' },
    { id: 'qpe',     label: 'IMD QPE',       sub: 'Ground truth · hourly',        status: 'warn'   },
  ];

  const colors = { online: 'var(--sev-low)', warn: 'var(--sev-moderate)', offline: 'var(--sev-severe)' };

  return (
    <div className="panel">
      <div className="panel-title">Data Ingestion</div>
      <div className="ingestion-log">
        {sources.map(s => (
          <div key={s.id} className="log-row">
            <span className="log-dot" style={{ background: colors[s.status] }} />
            <div style={{ flex: 1 }}>
              <div className="log-source" style={{ fontWeight: 500 }}>{s.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
