import React, { useState, useRef, useEffect } from 'react';
import { Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import OperationalMap from './OperationalMap';
import { AlertTriangle, CheckCircle, ShieldAlert, Clock, MapPin, Activity, FileText, Globe, Send, Shield, Zap } from 'lucide-react';

import './AlertsView.css';
import { MOCK_ALERTS, GATEWAY_STATUS } from '../data/alertsMockData';
import { alertsApi } from '../services/api/alerts';

// Fix Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});



function createHtmlIcon(html, size = [20, 20], anchor = [10, 10]) {
  return L.divIcon({
    html,
    className: 'tac-leaflet-div-icon',
    iconSize: size,
    iconAnchor: anchor,
  });
}

export default function AlertsView({ showToast, globalSelectedLocation, setGlobalSelectedLocation }) {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [selectedAlertId, setSelectedAlertId] = useState(MOCK_ALERTS[0].id);
  const [connectionStatus, setConnectionStatus] = useState('live');

  // Sync with globalSelectedLocation if passed from Events View
  useEffect(() => {
    if (globalSelectedLocation) {
      const match = alerts.find(a => a.eventId === globalSelectedLocation || a.location.includes(globalSelectedLocation));
      if (match) {
        setSelectedAlertId(match.id);
      }
    }
  }, [globalSelectedLocation, alerts]);

  // Fetch API data
  useEffect(() => {
    const fetchAlerts = async () => {
      setConnectionStatus('syncing');
      try {
        const response = await alertsApi.getActiveAlerts();
        if (response.data && Array.isArray(response.data)) {
          setAlerts(response.data);
          // if we have no selected ID or if the selected ID is no longer in the list, set to the first one
          if (!response.data.find(a => a.id === selectedAlertId) && response.data.length > 0) {
              setSelectedAlertId(response.data[0].id);
          }
        }
        setConnectionStatus(response.status === 'fallback' ? 'fallback' : 'live');
      } catch (error) {
        setConnectionStatus('fallback');
      }
    };
    fetchAlerts();
  }, []);

  const selectedAlert = alerts.find(a => a.id === selectedAlertId) || alerts[0];

  // Derived metrics
  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const draftCount = alerts.filter(a => a.status === 'DRAFT').length;
  const pendingCount = alerts.filter(a => a.status === 'PENDING_REVIEW').length;
  const dispatchedCount = alerts.filter(a => ['DISPATCHED', 'ACTIVE'].includes(a.status)).length;
  const expiredCount = alerts.filter(a => a.status === 'EXPIRED').length;

  // AI Generation State
  const [isAILoading, setIsAILoading] = useState(false);
  const [showAIPreview, setShowAIPreview] = useState(false);
  const [activeLang, setActiveLang] = useState('en');
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCreateAlert = () => {
    const newDraft = {
      id: `CAP-${Math.floor(2000 + Math.random() * 900)}`,
      eventId: 'VN-2026-0922-NEW',
      hazard: 'Flash Flood',
      severity: 'HIGH',
      status: 'DRAFT',
      location: 'New Affected Area',
      affectedArea: '0 km²',
      issuedAt: 'N/A',
      validFrom: 'TBD',
      validUntil: 'TBD',
      eta: 'TBD',
      rainfall: '0 mm',
      confidence: '0%',
      coordinates: [20.5937, 78.9629], // Central India
      zoom: 5,
      title: 'NEW ALERT DRAFT',
      description: 'Enter description here.',
      instructions: 'Enter mandatory action.',
      alertBasis: [],
      targetAudience: [],
      dispatchChannels: [],
      deliveryStatus: { sent: 0, delivered: 0, failed: 0, pending: 0 },
      publicMessage: { en: '', hi: '', or: '' },
      auditTrail: [
        { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: 'Draft Created', operator: 'OP-04', status: 'SUCCESS' }
      ]
    };
    setAlerts([newDraft, ...alerts]);
    setSelectedAlertId(newDraft.id);
    if (showToast) showToast('New Alert Draft Created.');
  };

  const updateAlertStatus = (id, newStatus, actionDesc) => {
    setAlerts(prev => prev.map(a => {
      if (a.id === id) {
        const newAudit = [
          ...a.auditTrail,
          { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), action: actionDesc, operator: 'OP-04', status: 'SUCCESS' }
        ];
        return { ...a, status: newStatus, auditTrail: newAudit };
      }
      return a;
    }));
  };

  const handleDispatch = () => {
    updateAlertStatus(selectedAlert.id, 'ACTIVE', 'CAP dispatched');
    if (showToast) showToast(`CAP Alert ${selectedAlert.id} Dispatched to channels.`);
  };

  const generateAILanguages = () => {
    setIsAILoading(true);
    setTimeout(() => {
      setIsAILoading(false);
      setShowAIPreview(true);
      setActiveLang('hi');
      if (showToast) showToast('Multilingual previews generated successfully.');
    }, 1200);
  };

  const isHighSeverity = selectedAlert.severity === 'HIGH';
  const badgeClass = isHighSeverity ? 'high' : 'mod';
  const badgeColor = isHighSeverity ? '#ef4444' : '#38bdf8';

  return (
    <div className="tac-alert-root">
      {/* PAGE TITLE */}
      <div style={{ padding: '24px 24px 0 24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.5px', display: 'flex', alignItems: 'center' }}>
          ALERTS
          {connectionStatus === 'syncing' && <span style={{ fontSize: '12px', marginLeft: '12px', color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 400, letterSpacing: '0px' }}><span className="ana-spinner" style={{ width: '10px', height: '10px', border: '2px solid rgba(234, 179, 8, 0.3)', borderTopColor: '#eab308', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span> Syncing...</span>}
          {connectionStatus === 'fallback' && <span style={{ fontSize: '12px', marginLeft: '12px', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 400, letterSpacing: '0px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Offline</span>}
        </h1>
        <div style={{ fontSize: '13px', color: '#94a3b8' }}>Warning generation, approval & dispatch center</div>
      </div>

      {/* OVERVIEW METRICS ROW */}
      <div className="tac-alert-overview">
        <div className="tac-alert-metrics-group">
          <div className="tac-alert-metric-item">
            <span className="tac-alert-metric-label">Active Alerts</span>
            <span className="tac-alert-metric-val active">{activeCount.toString().padStart(2, '0')}</span>
          </div>
          <div className="tac-alert-metric-item">
            <span className="tac-alert-metric-label">Draft Alerts</span>
            <span className="tac-alert-metric-val draft">{draftCount.toString().padStart(2, '0')}</span>
          </div>
          <div className="tac-alert-metric-item">
            <span className="tac-alert-metric-label">Pending Review</span>
            <span className="tac-alert-metric-val pending">{pendingCount.toString().padStart(2, '0')}</span>
          </div>
          <div className="tac-alert-metric-item">
            <span className="tac-alert-metric-label">Dispatched (24H)</span>
            <span className="tac-alert-metric-val dispatched">{dispatchedCount.toString().padStart(2, '0')}</span>
          </div>
          <div className="tac-alert-metric-item">
            <span className="tac-alert-metric-label">Expiring Soon</span>
            <span className="tac-alert-metric-val">{expiredCount.toString().padStart(2, '0')}</span>
          </div>
        </div>
        <button className="tac-alert-create-btn" onClick={handleCreateAlert}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          CREATE ALERT
        </button>
      </div>

      <div className="tac-alert-workspace">
        
        {/* LEFT COLUMN: ALERT DETAILS & BASIS */}
        <div className="tac-alert-col-left">
          
          <div className="tac-alert-card">
            <div className="tac-alert-card-header">
              <span>ALERT STATUS WORKFLOW</span>
              <span style={{ color: badgeColor }}>{selectedAlert.id}</span>
            </div>
            
            <div className="tac-alert-status-tree">
              <div className={`tac-alert-status-step ${['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'DISPATCHED', 'EXPIRED'].includes(selectedAlert.status) ? 'completed' : ''}`}>
                <FileText size={16} /> DRAFT
              </div>
              <div className="tac-alert-status-arrow">→</div>
              <div className={`tac-alert-status-step ${['PENDING_REVIEW', 'APPROVED', 'ACTIVE', 'DISPATCHED', 'EXPIRED'].includes(selectedAlert.status) ? 'completed' : ''} ${selectedAlert.status === 'PENDING_REVIEW' ? 'active' : ''}`}>
                <Shield size={16} /> PENDING REVIEW
              </div>
              <div className="tac-alert-status-arrow">→</div>
              <div className={`tac-alert-status-step ${['APPROVED', 'ACTIVE', 'DISPATCHED', 'EXPIRED'].includes(selectedAlert.status) ? 'completed' : ''}`}>
                <CheckCircle size={16} /> APPROVED
              </div>
              <div className="tac-alert-status-arrow">→</div>
              <div className={`tac-alert-status-step ${['ACTIVE', 'DISPATCHED', 'EXPIRED'].includes(selectedAlert.status) ? 'completed' : ''}`}>
                <Send size={16} /> DISPATCHED
              </div>
            </div>

            {selectedAlert.status === 'ACTIVE' && (
              <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                CURRENT STATUS: <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }}></span> ACTIVE
              </div>
            )}
            {selectedAlert.status === 'EXPIRED' && (
              <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: 700, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                CURRENT STATUS: ✓ EXPIRED
              </div>
            )}

            <div className="tac-alert-headline">{selectedAlert.title}</div>
            <div className="tac-alert-desc">{selectedAlert.description}</div>

            <div className="tac-alert-badges">
              <div className={`tac-alert-badge ${badgeClass}`}>
                {isHighSeverity ? '🔴' : '⚠️'} {selectedAlert.hazard.toUpperCase()}
              </div>
              <div className="tac-alert-badge">
                <MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />
                {selectedAlert.location}
              </div>
              <div className="tac-alert-badge" style={{ borderColor: '#64748b', color: '#94a3b8' }}>
                <Clock size={12} style={{ display: 'inline', marginRight: '4px' }} />
                ETA: {selectedAlert.eta}
              </div>
            </div>

            <div className="tac-alert-metrics-grid">
              <div className="tac-alert-metric-box">
                <div className="tac-alert-metric-box-val">{selectedAlert.rainfall || '124 mm'}</div>
                <div className="tac-alert-metric-box-label">Rainfall</div>
              </div>
              <div className="tac-alert-metric-box">
                <div className="tac-alert-metric-box-val">{selectedAlert.confidence || '82%'}</div>
                <div className="tac-alert-metric-box-label">Confidence</div>
              </div>
              <div className="tac-alert-metric-box">
                <div className="tac-alert-metric-box-val">1h 45m</div>
                <div className="tac-alert-metric-box-label">Lead Time</div>
              </div>
              <div className="tac-alert-metric-box">
                <div className="tac-alert-metric-box-val">{selectedAlert.affectedArea || '412 km²'}</div>
                <div className="tac-alert-metric-box-label">Affected Area</div>
              </div>
            </div>

            <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '12px', borderRadius: '4px', marginBottom: '16px' }}>
              <div style={{ color: '#fca5a5', fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}>MANDATORY ACTION</div>
              <div style={{ color: '#f1f5f9', fontSize: '13px' }}>{selectedAlert.instructions}</div>
            </div>

          </div>

          <div className="tac-alert-card">
            <div className="tac-alert-card-header">
              <span>ALERT BASIS & SOURCE</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="tac-alert-btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}>View Analysis →</button>
                <button className="tac-alert-btn-secondary" style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}>View Event {selectedAlert.eventId} →</button>
              </div>
            </div>
            
            <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '4px' }}>SOURCE EVENT</div>
              <div style={{ fontSize: '13px', color: '#38bdf8', fontWeight: 700 }}>{selectedAlert.eventId}</div>
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginBottom: '8px' }}>AI PREDICTION</div>
            <ul className="tac-alert-list">
              {selectedAlert.alertBasis.map((basis, idx) => (
                <li key={idx} className="tac-alert-list-item">
                  <CheckCircle size={14} />
                  <span>{basis}</span>
                </li>
              ))}
              {selectedAlert.alertBasis.length === 0 && (
                <li className="tac-alert-list-item" style={{ color: '#64748b' }}>No AI analysis recorded for this draft yet.</li>
              )}
            </ul>
          </div>

          <div className="tac-alert-card" style={{ flexDirection: 'row', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <div className="tac-alert-card-header">TARGET AUDIENCE</div>
              <div className="tac-alert-check-list">
                {['General Public', 'Emergency Responders', 'District Administration', 'Local Authorities', 'Vulnerable Communities'].map(aud => (
                  <label key={aud} className="tac-alert-check-item">
                    <input type="checkbox" defaultChecked={selectedAlert.targetAudience.includes(aud)} />
                    {aud}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="tac-alert-card-header">DISPATCH CHANNELS</div>
              <div className="tac-alert-check-list">
                {['Public Warning Portal', 'Web Dashboard', 'SMS', 'Push Notification', 'NDMA / SACHET', 'State Control', 'District DEOC'].map(ch => (
                  <label key={ch} className="tac-alert-check-item">
                    <input type="checkbox" defaultChecked={selectedAlert.dispatchChannels.includes(ch)} />
                    {ch}
                  </label>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: MAP & PREVIEW */}
        <div className="tac-alert-col-right">
          
          <div className="tac-alert-card">
            <div className="tac-alert-card-header">ALERT AREA MAP</div>
            <div className="tac-alert-map-wrap">
              <OperationalMap
                mode="alerts"
                eventData={{ coords: selectedAlert.coordinates }}
              >
                <Marker
                  position={selectedAlert.coordinates}
                  icon={createHtmlIcon(`
                    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                      <div style="width: 16px; height: 16px; border-radius: 50%; background: ${badgeColor}; box-shadow: 0 0 10px #ffffff, 0 0 30px ${badgeColor}; animation: tacPulse 2s infinite;"></div>
                    </div>
                  `, [20, 20], [10, 10])}
                />
                <Circle 
                  center={selectedAlert.coordinates} 
                  radius={12000} 
                  pathOptions={{ color: badgeColor, fillColor: badgeColor, fillOpacity: 0.2, weight: 1 }} 
                />
              </OperationalMap>
            </div>
            
            <div className="tac-alert-card-header" style={{ marginTop: '16px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>PUBLIC ALERT PREVIEW</span>
              {showAIPreview && (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className={`tac-alert-lang-tab ${activeLang === 'en' ? 'active' : ''}`} onClick={() => setActiveLang('en')}>English</button>
                  <button className={`tac-alert-lang-tab ${activeLang === 'hi' ? 'active' : ''}`} onClick={() => setActiveLang('hi')}>हिन्दी</button>
                  <button className={`tac-alert-lang-tab ${activeLang === 'or' ? 'active' : ''}`} onClick={() => setActiveLang('or')}>ଓଡ଼ିଆ</button>
                </div>
              )}
            </div>
            
            <div className="tac-alert-preview-box">
              {activeLang === 'en' && (selectedAlert.publicMessage?.en || 'No public message generated yet.')}
              {activeLang === 'hi' && (selectedAlert.publicMessage?.hi || 'अनुवाद उपलब्ध नहीं है।')}
              {activeLang === 'or' && (selectedAlert.publicMessage?.or || 'ଅନୁବାଦ ଉପଲବ୍ଧ ନାହିଁ |')}
            </div>

            <button 
              className="tac-alert-btn-secondary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px' }}
              onClick={generateAILanguages}
              disabled={isAILoading}
            >
              <Globe size={16} />
              {isAILoading ? 'Translating...' : 'Generate AI Multi-Lingual Alert'}
            </button>
            
            {/* WORKFLOW ACTIONS */}
            <div className="tac-alert-actions" style={{ marginTop: '24px' }}>
              {selectedAlert.status === 'DRAFT' && (
                <>
                  <button className="tac-alert-btn tac-alert-btn-secondary">Edit Alert</button>
                  <button className="tac-alert-btn tac-alert-btn-primary" onClick={() => updateAlertStatus(selectedAlert.id, 'PENDING_REVIEW', 'Submitted for review')}>Submit for Review</button>
                </>
              )}
              {selectedAlert.status === 'PENDING_REVIEW' && (
                <>
                  <button className="tac-alert-btn tac-alert-btn-secondary" onClick={() => updateAlertStatus(selectedAlert.id, 'DRAFT', 'Returned to draft')}>Return to Draft</button>
                  <button className="tac-alert-btn tac-alert-btn-primary" onClick={() => updateAlertStatus(selectedAlert.id, 'APPROVED', 'Approved Alert')}>Approve Alert</button>
                </>
              )}
              {selectedAlert.status === 'APPROVED' && (
                <>
                  <button className="tac-alert-btn tac-alert-btn-secondary">Update</button>
                  <button className="tac-alert-btn tac-alert-btn-secondary">Extend</button>
                  <button className="tac-alert-btn tac-alert-btn-danger" onClick={handleDispatch} style={{ background: '#0ea5e9', borderColor: '#0ea5e9', color: '#fff' }}>
                    <Send size={16} style={{ display: 'inline', marginRight: '6px' }} /> 
                    Dispatch CAP Alert
                  </button>
                </>
              )}
              {['ACTIVE', 'DISPATCHED'].includes(selectedAlert.status) && (
                <>
                  <button className="tac-alert-btn tac-alert-btn-primary" style={{ flex: 2 }}>Update Alert</button>
                  <button className="tac-alert-btn tac-alert-btn-secondary" style={{ flex: 1 }}>Extend Validity</button>
                  <button className="tac-alert-btn tac-alert-btn-danger" style={{ flex: 1 }} onClick={() => setShowCancelModal(true)}>Cancel Alert</button>
                </>
              )}
              {selectedAlert.status === 'EXPIRED' && (
                <>
                  <button className="tac-alert-btn tac-alert-btn-secondary">View Archive</button>
                </>
              )}
            </div>

          </div>

          {/* AUDIT TRAIL */}
          <div className="tac-alert-card">
            <div className="tac-alert-card-header">LIFECYCLE AUDIT TRAIL</div>
            <div className="tac-alert-table-wrap">
              <table className="tac-alert-table">
                <tbody>
                  {selectedAlert.auditTrail.slice().reverse().map((audit, i) => (
                    <tr key={i}>
                      <td style={{ width: '80px', fontFamily: 'monospace' }}>{audit.time}</td>
                      <td style={{ fontWeight: 600, color: '#f8fafc' }}>{audit.action}</td>
                      <td style={{ color: '#38bdf8' }}>{audit.operator}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>

      {/* BOTTOM ALERT HISTORY TABLE */}
      <div className="tac-alert-table-section">
        <div className="tac-alert-card" style={{ marginBottom: '32px' }}>
          <div className="tac-alert-card-header">ALERT HISTORY & ACTIVE LIST</div>
          <div className="tac-alert-table-wrap">
            <table className="tac-alert-table-main">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>ALERT ID</th>
                  <th style={{ width: '14%' }}>HAZARD</th>
                  <th style={{ width: '22%' }}>LOCATION</th>
                  <th style={{ width: '12%' }}>SEVERITY</th>
                  <th style={{ width: '18%' }}>ISSUED TIME</th>
                  <th style={{ width: '12%' }}>STATUS</th>
                  <th style={{ width: '10%' }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer', background: a.id === selectedAlertId ? 'rgba(255,255,255,0.05)' : 'transparent' }} onClick={() => setSelectedAlertId(a.id)}>
                    <td style={{ color: a.severity === 'HIGH' ? '#ef4444' : '#38bdf8', fontWeight: 700 }}>{a.id}</td>
                    <td>{a.hazard}</td>
                    <td>{a.location}</td>
                    <td>
                      <span className={`tac-alert-badge-small ${a.severity === 'HIGH' ? 'high' : 'mod'}`}>
                        {a.severity}
                      </span>
                    </td>
                    <td>{a.issuedAt}</td>
                    <td>
                      <span className={`tac-alert-badge-small ${a.status.toLowerCase()}`}>
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 600 }}>VIEW ↗</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      {/* CANCEL CONFIRMATION MODAL */}
      {showCancelModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', padding: '24px', width: '400px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#ef4444', fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <AlertTriangle size={20} /> CANCEL ALERT?
            </h3>
            <div style={{ color: '#cbd5e1', fontSize: '14px', marginBottom: '8px' }}>
              You are about to cancel:
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '6px', marginBottom: '24px' }}>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: '14px' }}>{selectedAlert.id}</div>
              <div style={{ color: '#94a3b8', fontSize: '13px' }}>{selectedAlert.hazard} — {selectedAlert.location}</div>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>
              This will stop the alert from remaining active across all dispatched channels.
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="tac-alert-btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px' }} onClick={() => setShowCancelModal(false)}>
                Keep Alert Active
              </button>
              <button 
                className="tac-alert-btn-danger" 
                style={{ padding: '8px 16px', borderRadius: '6px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.5)', color: '#fca5a5' }}
                onClick={() => {
                  updateAlertStatus(selectedAlert.id, 'EXPIRED', 'Alert cancelled by Operator');
                  setShowCancelModal(false);
                  if (showToast) showToast('Alert successfully cancelled.');
                }}
              >
                Cancel Alert
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
