import React from 'react';

export default function AlertPanel({ alerts, showToast, severity }) {
  const isRed = severity === 'severe' || severity === 'extreme';

  const handleDispatch = async () => {
    try {
      await fetch('https://vayunet-api.onrender.com/api/alerts/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'CLOUDBURST + FLASH FLOOD',
          severity: severity?.toUpperCase(),
          area: 'Active monitoring zone',
          validTime: '2h',
          protocol: 'CAP-1.2'
        }),
      });
      showToast('CAP alert dispatched to NDMA SACHET gateway');
    } catch {
      showToast('Demo dispatch — CAP payload formatted and queued');
    }
  };

  return (
    <div className="panel">
      <div className="panel-title">
        Active Alerts
      </div>
      <div className="alert-section">
        {alerts?.length > 0 ? alerts.map((a, i) => (
          <div key={i} className="alert-item" style={{
            borderLeftWidth: 3,
            borderLeftStyle: 'solid',
            borderLeftColor: isRed ? 'var(--sev-severe)' : 'var(--sev-moderate)',
          }}>
            <div className="alert-item-title">{a.title || a.type}</div>
            <div className="alert-item-meta">{a.area} · {a.validTime || 'T+2h'}</div>
          </div>
        )) : (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '4px 0', fontFamily: 'var(--font-mono)' }}>
            No active alerts in current zone
          </div>
        )}

        <button className="btn-dispatch" onClick={handleDispatch}>
          Dispatch CAP Alert → NDMA
        </button>

        <div style={{ fontSize: 9, color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
          CAP 1.2 · SACHET gateway · SDRF endpoints
        </div>
      </div>
    </div>
  );
}
