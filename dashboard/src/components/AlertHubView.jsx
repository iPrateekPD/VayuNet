import React, { useState } from 'react';

const ACTIVE_ALERTS = [
  {
    id: 'AL-001',
    sev: 'red',
    sevLabel: 'RED — EXTREME',
    hazard: 'Cloudburst + Flash Flood',
    location: 'Dharamsala, Himachal Pradesh',
    area: 'Kangra Valley — Uhl & Binwa catchments',
    validTime: 'T+2h to T+6h (Active)',
    threat: 'Rainfall > 150 mm/hr anticipated',
    dispatched: false,
  },
  {
    id: 'AL-002',
    sev: 'orange',
    sevLabel: 'ORANGE — HIGH',
    hazard: 'Severe Thunderstorm',
    location: 'Wayanad, Kerala',
    area: 'Kabani River basin',
    validTime: 'T+4h (Advisory)',
    threat: 'Lightning + Wind Shear > 20 m/s',
    dispatched: true,
  },
  {
    id: 'AL-003',
    sev: 'yellow',
    sevLabel: 'YELLOW — MODERATE',
    hazard: 'Flash Flood — Watch',
    location: 'Uttarkashi, Uttarakhand',
    area: 'Bhagirathi River — upstream tributaries',
    validTime: 'T+5h to T+8h (Watch)',
    threat: 'DEM flow accumulation: High basin risk',
    dispatched: false,
  },
];

export default function AlertHubView({ showToast }) {
  const [dispatched, setDispatched] = useState({ 'AL-002': true });
  const [capForm, setCapForm] = useState({ hazard: 'Cloudburst', sev: 'Extreme', area: 'Dharamsala, HP', validTime: 'T+2h' });

  const dispatch = async (id) => {
    try {
      await fetch('http://localhost:8000/api/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id, protocol: 'CAP-1.2' }),
      });
    } catch {}
    setDispatched(p => ({ ...p, [id]: true }));
    showToast(`CAP alert ${id} dispatched to NDMA SACHET`);
  };

  const broadcastNew = async () => {
    try {
      await fetch('http://localhost:8000/api/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...capForm, protocol: 'CAP-1.2', source: 'VAYUNET-OPS' }),
      });
    } catch {}
    showToast(`CAP broadcast queued — ${capForm.hazard} · ${capForm.sev} · ${capForm.area}`);
  };

  return (
    <div className="alert-hub-layout">
      {/* LEFT: Active alert cards */}
      <div className="alert-hub-left">
        <div className="hub-section-title">Active Warnings — {ACTIVE_ALERTS.length} Issued</div>

        {ACTIVE_ALERTS.map(alert => (
          <div key={alert.id} className={`hub-alert-card sev-${alert.sev}`}>
            <div className="hub-card-header">
              <span className={`hub-sev-badge ${alert.sev}`}>{alert.sevLabel}</span>
              <span className="hub-hazard-type">{alert.hazard}</span>
              <span className="hub-card-time">{alert.id}</span>
            </div>

            <div className="hub-card-body">
              <div className="hub-field">
                <label>LOCATION</label>
                <span>{alert.location}</span>
              </div>
              <div className="hub-field">
                <label>VALID TIME</label>
                <span>{alert.validTime}</span>
              </div>
              <div className="hub-field">
                <label>AFFECTED AREA</label>
                <span>{alert.area}</span>
              </div>
            </div>

            <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                {alert.threat}
              </div>
            </div>

            <div className="hub-card-footer">
              <span className={`hub-dispatch-status ${dispatched[alert.id] ? 'sent' : ''}`}>
                {dispatched[alert.id] ? '● DISPATCHED TO NDMA SACHET' : '○ Pending Dispatch'}
              </span>
              {!dispatched[alert.id] && (
                <button className="btn-hub-dispatch" onClick={() => dispatch(alert.id)}>
                  Dispatch CAP
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* RIGHT: CAP Dispatch Panel */}
      <div className="alert-hub-right">
        <div className="hub-section-title">Broadcast New Alert</div>

        <div className="cap-panel">
          <div className="cap-panel-header">
            <h3>CAP 1.2 Alert Composer</h3>
            <p>Common Alerting Protocol · NDMA / SACHET compatible</p>
          </div>

          <div className="cap-fields">
            <div className="cap-field">
              <label>Hazard Type</label>
              <select value={capForm.hazard} onChange={e => setCapForm(p => ({ ...p, hazard: e.target.value }))}>
                <option>Cloudburst</option>
                <option>Severe Thunderstorm</option>
                <option>Flash Flood</option>
                <option>Multi-Hazard</option>
              </select>
            </div>
            <div className="cap-field">
              <label>Severity Level</label>
              <select value={capForm.sev} onChange={e => setCapForm(p => ({ ...p, sev: e.target.value }))}>
                <option>Extreme</option>
                <option>Severe</option>
                <option>High</option>
                <option>Moderate</option>
              </select>
            </div>
            <div className="cap-field">
              <label>Target Area</label>
              <input
                type="text"
                value={capForm.area}
                onChange={e => setCapForm(p => ({ ...p, area: e.target.value }))}
                placeholder="District, State"
              />
            </div>
            <div className="cap-field">
              <label>Valid Time Window</label>
              <select value={capForm.validTime} onChange={e => setCapForm(p => ({ ...p, validTime: e.target.value }))}>
                <option>T+2h</option>
                <option>T+4h</option>
                <option>T+6h</option>
              </select>
            </div>

            <button className="btn-cap-broadcast" onClick={broadcastNew}>
              Broadcast to NDMA SACHET
            </button>
          </div>
        </div>

        {/* Recipients */}
        <div className="cap-panel">
          <div className="cap-panel-header">
            <h3>Dispatch Recipients</h3>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { id: 'NDMA', label: 'NDMA Ops Center', status: 'online' },
              { id: 'SACHET', label: 'SACHET Cell Broadcast', status: 'online' },
              { id: 'SDRF-KNG', label: 'SDRF Kangra Battalion', status: 'online' },
              { id: 'SDRF-WYN', label: 'SDRF Wayanad Battalion', status: 'online' },
              { id: 'DEOC', label: 'District EOC Network', status: 'warn' },
            ].map(r => (
              <div key={r.id} className="log-row">
                <span className="log-dot" style={{
                  background: r.status === 'online' ? 'var(--sev-low)' : 'var(--sev-moderate)'
                }} />
                <span className="log-source">{r.label}</span>
                <span className="log-time" style={{ fontSize: 10 }}>{r.id}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
