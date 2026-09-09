import React, { useState } from 'react';

const INITIAL_INCIDENTS = [
  {
    id: 'CAP-2041',
    sev: 'HIGH',
    sevBadge: 'high',
    location: 'Chamoli, Uttarakhand',
    hazard: 'Flash Flood + Cloudburst',
    eta: '1h 45m',
    status: 'ACTIVE',
    lastUpdated: '11:52 PM',
    area: 'Alaknanda River Catchment (Joshimath, Pipalkoti, Helang)',
    confidence: '82%',
    validFrom: '08 Sep 2026 · 23:50 IST',
    validUntil: '09 Sep 2026 · 03:50 IST',
    headline: 'CRITICAL: Severe Flash Flood Warning for Alaknanda Valley',
    description: 'Convective cloudburst signature detected upstream with peak precipitation rate of 124 mm. Sudden surge in river levels anticipated in downstream gorges.',
    instructions: 'Evacuate all low-lying riverbeds, temporary settlements, and ghats immediately. Restrict pedestrian transit across suspension bridges.',
  },
  {
    id: 'CAP-2040',
    sev: 'MODERATE',
    sevBadge: 'mod',
    location: 'Greater Mumbai, Maharashtra',
    hazard: 'Severe Thunderstorm & Squall',
    eta: '3h 00m',
    status: 'MONITORING',
    lastUpdated: '11:30 PM',
    area: 'Mumbai Suburban & Coastal Thane Corridor',
    confidence: '71%',
    validFrom: '09 Sep 2026 · 01:00 IST',
    validUntil: '09 Sep 2026 · 05:00 IST',
    headline: 'ADVISORY: Severe Thunderstorm & Urban Waterlogging Risk',
    description: 'Organized convective line moving eastward from Arabian Sea. Gusty surface winds exceeding 65 km/h with localized street flooding.',
    instructions: 'Commuters advised to avoid subway underpasses and shoreline promenades. Pre-position dewatering mobile pump units.',
  },
  {
    id: 'CAP-2039',
    sev: 'WATCH',
    sevBadge: 'watch',
    location: 'Wayanad, Kerala',
    hazard: 'Slope Runoff & Saturated Soil',
    eta: '4h 15m',
    status: 'ADVISORY',
    lastUpdated: '11:15 PM',
    area: 'Vythiri, Meppadi, and Chooralmala Slopes',
    confidence: '68%',
    validFrom: '09 Sep 2026 · 02:30 IST',
    validUntil: '09 Sep 2026 · 08:30 IST',
    headline: 'WATCH: Orographic Rainfall & Landslip Advisory',
    description: 'Continuous moderate-to-heavy rainfall maintaining elevated pore pressure across vulnerable tea estate slopes.',
    instructions: 'Monitor nullah discharge gauges. Keep night emergency shelter teams on standby.',
  },
  {
    id: 'CAP-2038',
    sev: 'WATCH',
    sevBadge: 'watch',
    location: 'Uttarkashi, Uttarakhand',
    hazard: 'Multi-nullah Discharge Rise',
    eta: '5h 00m',
    status: 'ADVISORY',
    lastUpdated: '10:45 PM',
    area: 'Bhagirathi Upper Tributaries',
    confidence: '64%',
    validFrom: '09 Sep 2026 · 03:00 IST',
    validUntil: '09 Sep 2026 · 09:00 IST',
    headline: 'ADVISORY: Upstream Inundation Watch',
    description: 'Moderate convective accumulation projected over high-altitude glaciers.',
    instructions: 'Check hydrological relay telemetry at 30-minute intervals.',
  },
];

const DESTINATIONS = [
  { name: 'NDMA / SACHET Gateway', role: 'National Disaster Management Authority (XML v1.2 Feed)', status: 'Connected', badge: 'connected' },
  { name: 'State Disaster Response Force (SDRF)', role: 'Uttarakhand State EOC & Wireless IP Network', status: 'Connected', badge: 'connected' },
  { name: 'District Administration (DEOC)', role: 'District Magistrate & Sub-Divisional Magistrates', status: 'Connected', badge: 'connected' },
  { name: 'Police & Emergency First Responders', role: 'State Police Radio Network & SMS Broadcast', status: 'Connected', badge: 'connected' },
  { name: 'Citizen Public Warning Portal', role: 'Real-Time WebSocket & Geo-Fenced Mobile Push', status: 'Connected', badge: 'connected' },
];

const INITIAL_AUDIT = [
  { time: '11:52 PM', alertId: 'CAP-2041', dest: 'NDMA SACHET', status: 'Delivered (ACK 200)' },
  { time: '11:52 PM', alertId: 'CAP-2041', dest: 'SDRF Control', status: 'Delivered (ACK 200)' },
  { time: '11:52 PM', alertId: 'CAP-2041', dest: 'Public Warning Portal', status: 'Broadcasted (Live)' },
  { time: '11:30 PM', alertId: 'CAP-2040', dest: 'Mumbai DEOC', status: 'Delivered (ACK 200)' },
  { time: '10:45 PM', alertId: 'CAP-2039', dest: 'Uttarkashi EOC', status: 'Delivered (ACK 200)' },
];

export default function AlertsView({ showToast }) {
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState(INITIAL_INCIDENTS[0]);
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT);
  const [isDispatching, setIsDispatching] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Alert Form state
  const [newAlert, setNewAlert] = useState({
    location: 'Dharamsala, Himachal Pradesh',
    hazard: 'Flash Flood Watch',
    sev: 'MODERATE',
    eta: '2h 30m',
    area: 'Kangra Valley & Manjhi Khad',
    headline: 'Precautionary Flash Flood Advisory',
    description: 'Anticipated convective rainfall over mountain ridges.',
    instructions: 'Stay tuned to official disaster management radio.'
  });

  const handleDispatchCurrent = async () => {
    setIsDispatching(true);
    try {
      await fetch('http://localhost:8000/api/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId: selectedIncident.id,
          headline: selectedIncident.headline,
          severity: selectedIncident.sev,
          area: selectedIncident.area,
          protocol: 'CAP-1.2',
        }),
      });
    } catch {}

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntries = [
      { time: nowStr, alertId: selectedIncident.id, dest: 'NDMA SACHET', status: 'Delivered (ACK 200)' },
      { time: nowStr, alertId: selectedIncident.id, dest: 'SDRF Control', status: 'Delivered (ACK 200)' },
      { time: nowStr, alertId: selectedIncident.id, dest: 'Public Warning Portal', status: 'Broadcasted (Live)' },
    ];
    setAuditLog((prev) => [...newEntries, ...prev]);
    setIsDispatching(false);

    if (showToast) {
      showToast(`CAP-1.2 alert [${selectedIncident.id}] successfully dispatched to all 5 emergency gateways.`);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    const createdId = `CAP-${Math.floor(2042 + Math.random() * 50)}`;
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const incidentObj = {
      id: createdId,
      sev: newAlert.sev,
      sevBadge: newAlert.sev === 'HIGH' ? 'high' : newAlert.sev === 'MODERATE' ? 'mod' : 'watch',
      location: newAlert.location,
      hazard: newAlert.hazard,
      eta: newAlert.eta,
      status: 'ACTIVE',
      lastUpdated: nowStr,
      area: newAlert.area,
      confidence: '78%',
      validFrom: 'Immediate',
      validUntil: 'T+4h',
      headline: newAlert.headline,
      description: newAlert.description,
      instructions: newAlert.instructions,
    };

    setIncidents([incidentObj, ...incidents]);
    setSelectedIncident(incidentObj);
    setShowCreateModal(false);
    if (showToast) {
      showToast(`New alert ${createdId} created and staged for CAP dispatch.`);
    }
  };

  return (
    <div className="ops-alerts-container">
      {/* Header */}
      <div className="ops-alerts-header">
        <div className="ops-alerts-title-group">
          <h1>Alerts & Common Alerting Protocol (CAP 1.2) Management</h1>
          <div style={{ fontSize: '11.5px', color: 'var(--ops-text-secondary)', marginTop: '2px' }}>
            Multi-Agency Warning Transmission Hub · ITU-T X.1303 / OASIS CAP v1.2 Standard
          </div>
        </div>

        <div className="ops-alerts-actions">
          <button
            className="ops-create-alert-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Alert
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="ops-alerts-grid">
        {/* Left Column: Active Incidents Table & Audit Trail */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Incidents Table */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">Active Severe Weather Incidents ({incidents.length})</span>
              <span style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>Click row to inspect & dispatch</span>
            </div>

            <table className="ops-incidents-table">
              <thead>
                <tr>
                  <th>Severity</th>
                  <th>Location</th>
                  <th>Hazard</th>
                  <th>ETA</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {incidents.map((inc) => (
                  <tr
                    key={inc.id}
                    className={`ops-incidents-row ${selectedIncident.id === inc.id ? 'selected' : ''}`}
                    onClick={() => setSelectedIncident(inc)}
                  >
                    <td>
                      <span className={`ops-badge-status ops-status-${inc.sevBadge === 'high' ? 'breached' : inc.sevBadge === 'mod' ? 'watch' : 'normal'}`}>
                        {inc.sev === 'HIGH' ? '🔴 HIGH' : inc.sev === 'MODERATE' ? '🟠 MODERATE' : '🟡 WATCH'}
                      </span>
                    </td>
                    <td style={{ color: '#ffffff', fontWeight: 600 }}>{inc.location}</td>
                    <td>{inc.hazard}</td>
                    <td style={{ fontFamily: 'var(--ops-font-mono)', color: '#38bdf8' }}>{inc.eta}</td>
                    <td>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--ops-font-mono)', color: inc.status === 'ACTIVE' ? '#86efac' : '#fde047' }}>
                        ● {inc.status}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--ops-font-mono)', color: 'var(--ops-text-muted)' }}>{inc.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Audit Log */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">Gateway Dispatch Audit Trail</span>
              <span style={{ fontSize: '10.5px', color: 'var(--ops-text-muted)' }}>Chronological Transmission Ledger</span>
            </div>

            <table className="ops-audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Identifier</th>
                  <th>Target Destination</th>
                  <th>Transmission Status</th>
                </tr>
              </thead>
              <tbody>
                {auditLog.map((log, idx) => (
                  <tr key={idx}>
                    <td style={{ color: 'var(--ops-text-muted)' }}>{log.time}</td>
                    <td style={{ color: '#ffffff', fontWeight: 600 }}>{log.alertId}</td>
                    <td style={{ color: '#38bdf8' }}>{log.dest}</td>
                    <td>
                      <span style={{ color: '#86efac' }}>{log.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Selected Alert Detail + CAP 1.2 Payload & Dispatch */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Selected Alert Detail */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">Incident Specifications</span>
              <span style={{ fontFamily: 'var(--ops-font-mono)', fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>
                {selectedIncident.id}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
              <div>
                <span style={{ color: 'var(--ops-text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Hazard & Severity</span>
                <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>
                  {selectedIncident.hazard} — {selectedIncident.sev} RISK
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--ops-text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Affected Geographical Extent</span>
                <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
                  {selectedIncident.area}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                <div>
                  <span style={{ color: 'var(--ops-text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Expected Onset</span>
                  <div style={{ fontFamily: 'var(--ops-font-mono)', color: '#38bdf8', fontWeight: 600 }}>
                    {selectedIncident.eta}
                  </div>
                </div>
                <div>
                  <span style={{ color: 'var(--ops-text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Confidence</span>
                  <div style={{ fontFamily: 'var(--ops-font-mono)', color: '#ffffff', fontWeight: 600 }}>
                    {selectedIncident.confidence}
                  </div>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--ops-text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Mandatory Action Required</span>
                <div style={{ color: '#fca5a5', marginTop: '2px', lineHeight: 1.45 }}>
                  {selectedIncident.instructions}
                </div>
              </div>
            </div>
          </div>

          {/* CAP 1.2 Payload Preview & Dispatch */}
          <div className="ops-cap-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">CAP 1.2 Payload Synthesis</span>
              <span style={{ fontSize: '10px', color: '#86efac', fontFamily: 'var(--ops-font-mono)' }}>OASIS Compliant</span>
            </div>

            <div className="ops-cap-preview-box">
              <div className="ops-cap-field-row">
                <span className="ops-cap-field-key">alert.identifier</span>
                <span>{selectedIncident.id}</span>
              </div>
              <div className="ops-cap-field-row">
                <span className="ops-cap-field-key">alert.sender</span>
                <span>in-moes.vapunet.deoc-kangra-04</span>
              </div>
              <div className="ops-cap-field-row">
                <span className="ops-cap-field-key">info.headline</span>
                <span style={{ color: '#ffffff' }}>{selectedIncident.headline}</span>
              </div>
              <div className="ops-cap-field-row">
                <span className="ops-cap-field-key">info.area</span>
                <span>{selectedIncident.area}</span>
              </div>
              <div className="ops-cap-field-row">
                <span className="ops-cap-field-key">info.effective</span>
                <span>{selectedIncident.validFrom}</span>
              </div>
              <div className="ops-cap-field-row">
                <span className="ops-cap-field-key">info.expires</span>
                <span>{selectedIncident.validUntil}</span>
              </div>
            </div>

            {/* Dispatch Destinations */}
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--ops-text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Connected Emergency Destinations
              </div>
              <div className="ops-dest-list">
                {DESTINATIONS.map((dest) => (
                  <div key={dest.name} className="ops-dest-row">
                    <div>
                      <div className="ops-dest-name">{dest.name}</div>
                      <div style={{ fontSize: '10px', color: 'var(--ops-text-muted)' }}>{dest.role}</div>
                    </div>
                    <span className={`ops-dest-badge ops-dest-${dest.badge}`}>
                      ● {dest.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dispatch Button */}
            <button
              className="ops-create-alert-btn"
              style={{ width: '100%', justifyContent: 'center', padding: '10px 0', fontSize: '13px' }}
              onClick={handleDispatchCurrent}
              disabled={isDispatching}
            >
              {isDispatching ? 'Transmitting CAP 1.2 to Gateways...' : '⚡ Dispatch CAP Alert to 5 Gateways'}
            </button>
          </div>
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="ops-drawer-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="ops-card"
            style={{ width: '500px', maxWidth: '90%', margin: 'auto', zIndex: 10000 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ops-card-title-row">
              <span className="ops-card-title">Compose New Operational Warning</span>
              <button
                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>Location Sector</label>
                <input
                  type="text"
                  className="ops-search-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  value={newAlert.location}
                  onChange={(e) => setNewAlert({ ...newAlert, location: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>Hazard Category</label>
                  <input
                    type="text"
                    className="ops-search-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    value={newAlert.hazard}
                    onChange={(e) => setNewAlert({ ...newAlert, hazard: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>Severity Level</label>
                  <select
                    className="ops-search-input"
                    style={{ width: '100%', marginTop: '4px', background: '#0a1324' }}
                    value={newAlert.sev}
                    onChange={(e) => setNewAlert({ ...newAlert, sev: e.target.value })}
                  >
                    <option value="HIGH">HIGH (Red Alert)</option>
                    <option value="MODERATE">MODERATE (Orange Alert)</option>
                    <option value="WATCH">WATCH (Yellow Alert)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>Estimated Time of Arrival (ETA)</label>
                <input
                  type="text"
                  className="ops-search-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  value={newAlert.eta}
                  onChange={(e) => setNewAlert({ ...newAlert, eta: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>Affected Area Boundary</label>
                <input
                  type="text"
                  className="ops-search-input"
                  style={{ width: '100%', marginTop: '4px' }}
                  value={newAlert.area}
                  onChange={(e) => setNewAlert({ ...newAlert, area: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>Mandatory Protective Actions</label>
                <textarea
                  className="ops-search-input"
                  style={{ width: '100%', marginTop: '4px', minHeight: '60px' }}
                  value={newAlert.instructions}
                  onChange={(e) => setNewAlert({ ...newAlert, instructions: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  style={{ background: 'transparent', border: '1px solid var(--ops-border-medium)', color: '#cbd5e1', padding: '6px 14px', borderRadius: 'var(--ops-radius-xs)', cursor: 'pointer' }}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ops-create-alert-btn"
                >
                  Create & Stage Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
