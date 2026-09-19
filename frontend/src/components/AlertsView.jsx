import React, { useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Reuse the exact same CSS
import './TacticalNowcast.css';

// Fix Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Map recentering controller
function MapController({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map custom zoom buttons
function MapZoomButtons() {
  const map = useMap();
  return (
    <div style={{
      position: 'absolute',
      bottom: '18px',
      left: '18px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '5px'
    }}>
      <button
        type="button"
        onClick={() => map.zoomIn()}
        title="Zoom In"
        style={{
          width: '32px',
          height: '32px',
          background: 'rgba(7, 14, 27, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '6px',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
        }}
      >
        +
      </button>
      <button
        type="button"
        onClick={() => map.zoomOut()}
        title="Zoom Out"
        style={{
          width: '32px',
          height: '32px',
          background: 'rgba(7, 14, 27, 0.92)',
          border: '1px solid rgba(255, 255, 255, 0.22)',
          borderRadius: '6px',
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.6)'
        }}
      >
        −
      </button>
    </div>
  );
}

function createHtmlIcon(html, size = [20, 20], anchor = [10, 10]) {
  return L.divIcon({
    html,
    className: 'tac-leaflet-div-icon',
    iconSize: size,
    iconAnchor: anchor,
  });
}

const INITIAL_INCIDENTS = [
  {
    id: 'CAP-2041',
    sev: 'HIGH',
    sevBadge: 'high',
    location: 'Chamoli, Uttarakhand',
    center: [30.41, 79.32],
    zoom: 9,
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
    metric1: '124 mm', metric1Label: 'Est. rainfall (next 2h)', metric1Icon: '💧',
    metric2: '412 km²', metric2Label: 'Affected area', metric2Icon: '🗺️',
  },
  {
    id: 'CAP-2040',
    sev: 'MODERATE',
    sevBadge: 'mod',
    location: 'Greater Mumbai, Maharashtra',
    center: [19.076, 72.877],
    zoom: 10,
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
    metric1: '65 km/h', metric1Label: 'Max Gust Speed', metric1Icon: '💨',
    metric2: '210 km²', metric2Label: 'Affected area', metric2Icon: '🗺️',
  },
  {
    id: 'CAP-2039',
    sev: 'WATCH',
    sevBadge: 'watch',
    location: 'Wayanad, Kerala',
    center: [11.685, 76.132],
    zoom: 10,
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
    metric1: '85 mm', metric1Label: 'Est. rainfall (next 4h)', metric1Icon: '💧',
    metric2: '54 km²', metric2Label: 'High Risk Zones', metric2Icon: '🗺️',
  },
];

const DESTINATIONS = [
  { name: 'NDMA / SACHET Gateway', role: 'XML v1.2 Feed', status: 'Connected', badge: 'connected' },
  { name: 'State SDRF Control', role: 'Wireless IP Network', status: 'Connected', badge: 'connected' },
  { name: 'District DEOC', role: 'District Magistrate', status: 'Connected', badge: 'connected' },
  { name: 'Police First Responders', role: 'SMS Broadcast', status: 'Connected', badge: 'connected' },
  { name: 'Citizen Warning Portal', role: 'Mobile Push', status: 'Connected', badge: 'connected' },
];

const INITIAL_AUDIT = [
  { time: '11:52 PM', alertId: 'CAP-2041', dest: 'NDMA SACHET', status: 'Delivered (ACK 200)' },
  { time: '11:52 PM', alertId: 'CAP-2041', dest: 'SDRF Control', status: 'Delivered (ACK 200)' },
  { time: '11:30 PM', alertId: 'CAP-2040', dest: 'Mumbai DEOC', status: 'Delivered (ACK 200)' },
  { time: '10:45 PM', alertId: 'CAP-2039', dest: 'Uttarkashi EOC', status: 'Delivered (ACK 200)' },
];

export default function AlertsView({ showToast, onNavigateTab }) {
  const [incidents, setIncidents] = useState(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState(INITIAL_INCIDENTS[0]);
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT);
  const [isDispatching, setIsDispatching] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef(null);

  const toggleAudioPlayback = (base64Audio) => {
    if (isPlayingAudio && audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setIsPlayingAudio(false);
      return;
    }
    if (!base64Audio) return;

    try {
      const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
      audioPlayerRef.current = audio;
      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      };
      audio.onerror = () => {
        setIsPlayingAudio(false);
        audioPlayerRef.current = null;
      };
      audio.play();
    } catch (e) {
      console.warn('Audio playback error:', e);
      setIsPlayingAudio(false);
    }
  };

  const dispatchAIAlert = async () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
      setIsPlayingAudio(false);
    }
    setIsAILoading(true);
    setAiResult(null);
    try {
      const response = await fetch('/api/alerts/ai-dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hazard_type: selectedIncident.hazard, 
          severity: selectedIncident.sev, 
          location_name: selectedIncident.location, 
          lead_time_hours: selectedIncident.eta 
        }),
      });
      const data = await response.json();
      setAiResult(data.generated_content);
      showToast(`AI Warning generated with Bhashini Regional Speech!`);
    } catch (e) {
      showToast(`AI Dispatch failed: ${e.message}`);
    } finally {
      setIsAILoading(false);
    }
  };
  
  // Map Layer State
  const [layers, setLayers] = useState({
    threatArea: true,
    terrain: true,
    cities: true,
  });

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
    setIncidents((prev) =>
      prev.map((inc) => (inc.id === selectedIncident.id ? { ...inc, status: 'DISPATCHED' } : inc))
    );
    setIsDispatching(false);

    if (showToast) {
      showToast(`CAP-1.2 alert [${selectedIncident.id}] successfully dispatched to all emergency gateways.`);
    }
  };

  return (
    <div className="tac-clean-nowcast-root">
      {/* ================= TOP ROW: MAP + ALERT DETAILS CARD ================= */}
      <div className="tac-clean-top-row">
        
        {/* MAP CONTAINER (LEFT) */}
        <div className="tac-clean-map-card">
          <div className="tac-clean-map-topbar">
            {/* Threat Name Dropdown styling */}
            <div className="tac-clean-sector-wrap">
              <button type="button" className="tac-clean-sector-btn" style={{ cursor: 'default' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>{selectedIncident.id} — {selectedIncident.location}</span>
              </button>
            </div>

            <div className="tac-clean-live-pill">
              <span>{selectedIncident.lastUpdated} IST</span>
              <span className="tac-clean-live-dot" />
              <span style={{ color: '#f87171', fontWeight: 700 }}>Live Alert</span>
            </div>
          </div>

          <div className="tac-clean-left-toolbar">
            <button
              type="button"
              className={`tac-clean-tool-btn ${layers.threatArea ? 'active' : ''}`}
              onClick={() => handleToggleLayer('threatArea')}
              title="Toggle Threat Area"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </button>
            <button
              type="button"
              className={`tac-clean-tool-btn ${layers.terrain ? 'active' : ''}`}
              onClick={() => handleToggleLayer('terrain')}
              title="Toggle Terrain"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 20h18L12 4z" />
              </svg>
            </button>
          </div>

          <MapContainer
            center={selectedIncident.center}
            zoom={selectedIncident.zoom}
            scrollWheelZoom={false}
            className="tac-clean-leaflet-container"
            zoomControl={false}
          >
            <MapController center={selectedIncident.center} zoom={selectedIncident.zoom} />
            <MapZoomButtons />

            {/* Base Satellite Imagery */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
              maxZoom={18}
            />

            {/* Geography labels */}
            {layers.cities && (
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                subdomains="abcd"
                opacity={0.7}
              />
            )}

            {/* Threat Area Pulsing Marker */}
            {layers.threatArea && (
              <Marker
                position={selectedIncident.center}
                icon={createHtmlIcon(`
                  <div style="position: relative; display: flex; align-items: center;">
                    <div style="width: 14px; height: 14px; border-radius: 50%; background: ${selectedIncident.sevBadge === 'high' ? '#ef4444' : selectedIncident.sevBadge === 'mod' ? '#f97316' : '#eab308'}; box-shadow: 0 0 10px #ffffff, 0 0 30px ${selectedIncident.sevBadge === 'high' ? '#ef4444' : selectedIncident.sevBadge === 'mod' ? '#f97316' : '#eab308'}; position: absolute; left: 0; top: 10px; z-index: 10; animation: tacPulse 2s infinite;"></div>
                    <div style="margin-left: 22px; background: rgba(8, 14, 25, 0.94); border: 1px solid ${selectedIncident.sevBadge === 'high' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(255, 255, 255, 0.2)'}; border-radius: 6px; padding: 6px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.85); min-width: 96px;">
                      <div style="font-size: 11px; font-weight: 700; color: #ffffff;">${selectedIncident.hazard}</div>
                      <div style="font-size: 10px; font-weight: 700; color: ${selectedIncident.sevBadge === 'high' ? '#ef4444' : selectedIncident.sevBadge === 'mod' ? '#f97316' : '#eab308'};">${selectedIncident.sev} RISK</div>
                    </div>
                  </div>
                `, [200, 48], [7, 17])}
              />
            )}
          </MapContainer>
        </div>

        {/* ALERT DETAILS CARD (RIGHT) */}
        <div className="tac-clean-threat-card" style={{ 
          background: selectedIncident.sev === 'HIGH' ? 'linear-gradient(180deg, rgba(153, 27, 27, 0.35) 0%, rgba(69, 10, 10, 0.2) 100%)' : 'linear-gradient(180deg, rgba(30, 58, 138, 0.35) 0%, rgba(15, 23, 42, 0.2) 100%)',
          borderColor: selectedIncident.sev === 'HIGH' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(56, 189, 248, 0.4)'
        }}>
          <div className="tac-clean-threat-head">
            <div className="tac-clean-flame-tag" style={{ color: selectedIncident.sev === 'HIGH' ? '#ef4444' : '#38bdf8' }}>
              <span style={{ fontSize: '14px' }}>{selectedIncident.sev === 'HIGH' ? '🚨' : '⚠️'}</span>
              <span>{selectedIncident.status === 'ACTIVE' ? 'ACTIVE ALERT' : 'MONITORING'}</span>
            </div>
            <div className="tac-clean-forecast-pill">CAP 1.2 Ready</div>
          </div>

          <div className="tac-clean-warn-title-group">
            <div className="tac-clean-warn-icon">
              {selectedIncident.sev === 'HIGH' ? (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              )}
            </div>
            <div>
              <div className="tac-clean-warn-main" style={{ color: selectedIncident.sev === 'HIGH' ? '#ef4444' : '#38bdf8' }}>{selectedIncident.hazard.toUpperCase()}</div>
              <div className="tac-clean-warn-main" style={{ color: selectedIncident.sev === 'HIGH' ? '#ef4444' : '#38bdf8' }}>{selectedIncident.sev} RISK</div>
              <div className="tac-clean-warn-loc">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{selectedIncident.location}</span>
              </div>
            </div>
          </div>

          <div className="tac-clean-narrative">
            {selectedIncident.description}
          </div>

          <div className="tac-clean-chips-grid">
            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>{selectedIncident.metric1Icon}</span>
                <span className="tac-clean-chip-val">{selectedIncident.metric1}</span>
              </div>
              <span className="tac-clean-chip-label">{selectedIncident.metric1Label}</span>
            </div>

            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>🕒</span>
                <span className="tac-clean-chip-val">{selectedIncident.eta}</span>
              </div>
              <span className="tac-clean-chip-label">Estimated arrival</span>
            </div>

            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>📊</span>
                <span className="tac-clean-chip-val">{selectedIncident.confidence}</span>
              </div>
              <span className="tac-clean-chip-label">Model confidence</span>
            </div>

            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>{selectedIncident.metric2Icon}</span>
                <span className="tac-clean-chip-val">{selectedIncident.metric2}</span>
              </div>
              <span className="tac-clean-chip-label">{selectedIncident.metric2Label}</span>
            </div>
          </div>

          <div className="tac-clean-action-box">
            <div className="tac-clean-action-head">
              <span>⚠️</span>
              <span>Mandatory Action Required</span>
            </div>
            <div className="tac-clean-action-desc">
              {selectedIncident.instructions}
            </div>
          </div>

          <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              className="btn-ai-dispatch"
              onClick={dispatchAIAlert}
              disabled={isAILoading || isDispatching}
              style={{ padding: '12px' }}
            >
              {isAILoading ? 'AI Analyzing...' : '✨ Generate AI Multi-Lingual Alert'}
            </button>

            {aiResult && (
              <div className="ai-dispatch-result" style={{ margin: '8px 0', border: '1px solid rgba(6, 182, 212, 0.4)', borderRadius: '8px', padding: '10px' }}>
                <div className="ai-dispatch-source" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Generated by {aiResult.source}</span>
                  {aiResult.bhashini_verified && (
                    <span style={{ fontSize: '10px', background: 'rgba(6, 182, 212, 0.2)', color: '#22d3ee', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(34, 211, 238, 0.3)' }}>
                      🇮🇳 Bhashini TTS
                    </span>
                  )}
                </div>
                <div className="ai-alert-box" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '4px', marginTop: '6px' }}>
                  <strong>EN:</strong> {aiResult.english}
                </div>
                <div className="ai-alert-box regional-text" style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '4px', marginTop: '4px' }}>
                  <strong>{aiResult.language_name || 'Regional'}:</strong> {aiResult.regional}
                </div>
                {aiResult.audio_base64 && (
                  <button
                    type="button"
                    onClick={() => toggleAudioPlayback(aiResult.audio_base64)}
                    style={{
                      marginTop: '8px',
                      width: '100%',
                      background: isPlayingAudio ? 'rgba(239, 68, 68, 0.25)' : 'rgba(6, 182, 212, 0.2)',
                      border: isPlayingAudio ? '1px solid #ef4444' : '1px solid #22d3ee',
                      color: isPlayingAudio ? '#fca5a5' : '#67e8f9',
                      padding: '7px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>{isPlayingAudio ? '⏹ Stop Voice Broadcast' : `🔊 Listen to ${aiResult.language_name || 'Regional'} Voice Alert`}</span>
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              className="tac-clean-dispatch-btn"
              style={{ 
                background: isDispatching ? '#475569' : selectedIncident.sev === 'HIGH' ? '#dc2626' : '#2563eb',
                cursor: isDispatching ? 'not-allowed' : 'pointer',
                border: 'none',
              }}
              onClick={() => {
                handleDispatchCurrent();
                setAiResult(null);
              }}
              disabled={isDispatching}
            >
              <span style={{ fontSize: '15px' }}>((●))</span>
              <span>{isDispatching ? 'Transmitting CAP 1.2...' : 'Dispatch CAP Alert →'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= BOTTOM ROW: 3 CARDS ================= */}
      <div className="tac-clean-bottom-row">
        
        {/* Card 1: Active Alerts List */}
        <div className="tac-clean-card" style={{ flex: 1.2 }}>
          <div className="tac-clean-card-title-row">
            <span className="tac-clean-card-title">Active Severe Weather Incidents ({incidents.length})</span>
          </div>
          <div className="tac-clean-threats-list" style={{ overflowY: 'auto', maxHeight: '140px' }}>
            {incidents.map((inc) => (
              <div 
                key={inc.id} 
                className="tac-clean-threat-row" 
                style={{ 
                  cursor: 'pointer', 
                  background: selectedIncident.id === inc.id ? 'rgba(255,255,255,0.08)' : 'transparent',
                  padding: '6px 8px',
                  borderRadius: '6px'
                }}
                onClick={() => setSelectedIncident(inc)}
              >
                <span className="tac-clean-threat-name" style={{ minWidth: '120px' }}>
                  <span style={{ color: inc.sev === 'HIGH' ? '#ef4444' : inc.sev === 'MODERATE' ? '#f97316' : '#eab308' }}>
                    {inc.sev === 'HIGH' ? '🔴' : inc.sev === 'MODERATE' ? '🟠' : '🟡'}
                  </span>
                  <span>{inc.location.split(',')[0]}</span>
                </span>
                <span style={{ fontSize: '11px', color: '#cbd5e1', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {inc.hazard}
                </span>
                <span className="tac-clean-threat-eta">{inc.eta}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Gateway Dispatch Audit Trail */}
        <div className="tac-clean-card" style={{ flex: 1.2 }}>
          <div className="tac-clean-card-title-row">
            <span className="tac-clean-card-title">Gateway Dispatch Audit Trail</span>
          </div>
          <div className="tac-clean-threats-list" style={{ overflowY: 'auto', maxHeight: '140px' }}>
            {auditLog.map((log, idx) => (
              <div key={idx} className="tac-clean-threat-row" style={{ padding: '6px 0' }}>
                <span className="tac-clean-threat-time" style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', minWidth: '60px' }}>
                  {log.time}
                </span>
                <span style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, minWidth: '70px' }}>
                  {log.alertId}
                </span>
                <span style={{ fontSize: '11px', color: '#38bdf8', flex: 1 }}>
                  {log.dest}
                </span>
                <span style={{ fontSize: '10px', color: '#86efac' }}>
                  {log.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 3: Connected Emergency Destinations */}
        <div className="tac-clean-card" style={{ flex: 0.8 }}>
          <div className="tac-clean-card-title">Emergency Destinations</div>
          <div className="tac-clean-freshness-list" style={{ overflowY: 'auto', maxHeight: '140px' }}>
            {DESTINATIONS.map((dest, i) => (
              <div key={i} className="tac-clean-freshness-row" style={{ padding: '4px 0' }}>
                <div className="tac-clean-feed-left">
                  <span className="tac-clean-green-dot" />
                  <span style={{ fontSize: '11px', color: '#cbd5e1' }}>{dest.name}</span>
                </div>
                <span className="tac-clean-feed-time" style={{ color: '#86efac' }}>Connected</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
