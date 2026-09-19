import React, { useState, useEffect } from 'react';

const PIPELINE_STAGES = [
  {
    num: '01',
    name: 'SOURCE',
    detail: 'INSAT-3D/3DR · IMDAA · CartoDEM',
    latency: '15–30 min cadence',
    status: 'online',
  },
  {
    num: '02',
    name: 'INGESTION',
    detail: 'MOSDAC HDF5 parser · NetCDF4 reanalysis · GeoTIFF DEM',
    latency: '~2 min processing',
    status: 'online',
  },
  {
    num: '03',
    name: 'PREPROCESSING',
    detail: 'Grid alignment · 0.04° WGS84 · bilinear interp · normalization',
    latency: '~18 s per frame',
    status: 'online',
  },
  {
    num: '04',
    name: 'MODEL',
    detail: 'Spatiotemporal Transformer · Multi-Task Learning · 12 input channels',
    latency: '< 150 ms inference',
    status: 'online',
  },
  {
    num: '05',
    name: 'OUTPUT',
    detail: 'Probability maps · XAI attribution · CAP payload · GeoJSON polygons',
    latency: 'Real-time',
    status: 'online',
  },
];

const ENDPOINTS = [
  { path: '/api/health',               method: 'GET',  desc: 'System health + uptime',          latency: '12 ms' },
  { path: '/api/hazards/live',         method: 'GET',  desc: 'Live atmospheric telemetry',      latency: '38 ms' },
  { path: '/api/hazards/historical/:id', method: 'GET',desc: 'Benchmark event time-series',    latency: '54 ms' },
  { path: '/api/nowcast/predict',      method: 'POST', desc: 'Multi-hazard nowcast inference',  latency: '148 ms' },
  { path: '/api/alerts/broadcast',     method: 'POST', desc: 'CAP 1.2 emergency dispatch',     latency: '22 ms' },
  { path: '/api/stream/telemetry',     method: 'GET',  desc: 'SSE live telemetry stream',      latency: 'Streaming' },
];

export default function SystemView({ backendOnline }) {
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      setUptime(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fmt = (s) => `${Math.floor(s/3600)}h ${Math.floor((s%3600)/60)}m ${s%60}s`;

  return (
    <div className="system-layout">
      {/* Header */}
      <div className="system-header-row">
        <div>
          <div className="system-title">System Telemetry</div>
          <div className="system-subtitle">
            FastAPI backend · Uvicorn ASGI · localhost:8000 · Session uptime: {fmt(uptime)}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: backendOnline ? 'var(--sev-low)' : 'var(--sev-moderate)',
            display: 'inline-block',
          }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>
            {backendOnline ? 'FastAPI Core ONLINE :8000' : 'Demo Engine (Offline Mode)'}
          </span>
        </div>
      </div>

      {/* Pipeline Flow — SOURCE → INGESTION → PROCESSING → MODEL → OUTPUT */}
      <div className="pipeline-flow">
        <div className="pipeline-flow-header">
          <h3>Data Pipeline — End-to-End Flow</h3>
        </div>
        <div className="pipeline-flow-stages">
          {PIPELINE_STAGES.map((s, i) => (
            <div key={s.num} className="pf-stage">
              <div className="pf-stage-num">{s.num}</div>
              <div className="pf-stage-name">{s.name}</div>
              <div className="pf-stage-detail">{s.detail}</div>
              <div className="pf-status">
                <span className={`pf-dot ${s.status}`} />
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {s.latency}
                </span>
              </div>
              {i < PIPELINE_STAGES.length - 1 && (
                <div className="pf-stage-arrow">▶</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 1,
        background: 'var(--border)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        overflow: 'hidden',
      }}>
        {[
          { label: 'INFERENCE LATENCY', val: '< 150 ms', sub: 'per nowcast cycle' },
          { label: 'INGESTION CADENCE', val: '15 min',   sub: 'INSAT-3D/3DR' },
          { label: 'GRID RESOLUTION',  val: '4 km',      sub: 'WGS84 uniform' },
          { label: 'ACTIVE MODE',      val: backendOnline ? 'LIVE' : 'DEMO', sub: 'backend status' },
        ].map(m => (
          <div key={m.label} style={{ background: 'var(--bg-surface)', padding: '20px 18px' }}>
            <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: 8 }}>
              {m.label}
            </div>
            <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff', marginBottom: 3 }}>
              {m.val}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* API Endpoints */}
      <div className="endpoint-table">
        <div className="endpoint-table-header">
          <h3>API Endpoint Registry</h3>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            {ENDPOINTS.length} endpoints · FastAPI + Uvicorn ASGI
          </span>
        </div>
        {ENDPOINTS.map(ep => (
          <div key={ep.path} className="endpoint-row">
            <span className="endpoint-dot" style={{ background: backendOnline ? 'var(--sev-low)' : 'var(--sev-moderate)' }} />
            <span className="endpoint-path">{ep.path}</span>
            <span className={`endpoint-method method-${ep.method.toLowerCase()}`}>{ep.method}</span>
            <span className="endpoint-desc">{ep.desc}</span>
            <span className="endpoint-latency">{ep.latency}</span>
          </div>
        ))}
      </div>

      {/* Data sources */}
      <div className="verification-table">
        <div className="vtable-header">
          <h3>Data Source Registry</h3>
        </div>
        <table className="forensics-metrics">
          <thead>
            <tr>
              <th>Source</th>
              <th>Parameters</th>
              <th>Cadence</th>
              <th>Format</th>
            </tr>
          </thead>
          <tbody>
            {[
              { src: 'INSAT-3D/3DR (MOSDAC)', params: 'WV 6.7µm · TIR 10.8µm · CTT', cadence: '15–30 min', fmt: 'HDF5 / GeoTIFF' },
              { src: 'IMDAA Reanalysis (NCMRWF)', params: 'CAPE · CIN · Wind Shear · T, q, Z', cadence: '1 hr', fmt: 'NetCDF4' },
              { src: 'ISRO CartoDEM 30m', params: 'Elevation · Slope · D8 Flow Accum', cadence: 'Static', fmt: 'GeoTIFF' },
              { src: 'IMD QPE (AWS / DWR)', params: 'Precipitation estimates > 100 mm/hr', cadence: 'Hourly', fmt: 'NetCDF / CSV' },
            ].map(r => (
              <tr key={r.src}>
                <td>{r.src}</td>
                <td>{r.params}</td>
                <td>{r.cadence}</td>
                <td>{r.fmt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
