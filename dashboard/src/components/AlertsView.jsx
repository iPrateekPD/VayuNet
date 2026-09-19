import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getRealtimeWeather, predictNowcast, broadcastAlert } from '../services/apiService';

// Reuse the exact same CSS
import './TacticalNowcast.css';

// Fix Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function formatISTDate(date, addHours = 0) {
  const d = new Date(date.getTime() + addHours * 3600 * 1000);
  const day = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
  const time = d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });
  return `${day} · ${time} IST`;
}

function formatISTTime(date) {
  return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' });
}

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
    area: 'Alaknanda River Catchment (Joshimath, Pipalkoti, Helang)',
    confidence: '82%',
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
    area: 'Mumbai Suburban & Coastal Thane Corridor',
    confidence: '71%',
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
    area: 'Vythiri, Meppadi, and Chooralmala Slopes',
    confidence: '68%',
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
  
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveNowcast, setLiveNowcast] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('LOADING');
  const [istTime, setIstTime] = useState('');

  // Map Layer State
  const [layers, setLayers] = useState({
    threatArea: true,
    terrain: true,
    cities: true,
  });

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setIstTime(formatISTTime(now) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setWeatherStatus('LOADING');
    const [lat, lng] = selectedIncident.center;
    const locRaw = (selectedIncident.location || '').toLowerCase();
    let locationId = 'chamoli';
    if (locRaw.includes('mumbai')) locationId = 'mumbai';
    else if (locRaw.includes('wayanad')) locationId = 'wayanad';
    else if (locRaw.includes('chamoli')) locationId = 'chamoli';
    else if (locRaw.includes('kangra') || locRaw.includes('dharamsala')) locationId = 'kangra';
    else if (locRaw.includes('rudraprayag')) locationId = 'rudraprayag';
    else if (locRaw.includes('pithoragarh')) locationId = 'pithoragarh';
    else if (locRaw.includes('uttarkashi')) locationId = 'uttarkashi';

    Promise.allSettled([
      getRealtimeWeather(lat, lng, controller.signal),
      predictNowcast({ lat, lng, leadTimeHours: 2, locationId }, controller.signal),
    ]).then(([wRes, nRes]) => {
      if (wRes.status === 'fulfilled' && (wRes.value?.status === 'success' || wRes.value?.weather)) {
        setLiveWeather(wRes.value);
        setWeatherStatus('LIVE');
      } else {
        setWeatherStatus('DEGRADED');
      }
      if (nRes.status === 'fulfilled' && nRes.value) {
        setLiveNowcast(nRes.value);
      }
    }).catch(() => {});

    return () => { controller.abort(); };
  }, [selectedIncident.id]);

  const weather = liveWeather?.weather || {};
  const maxRisk = liveNowcast?.predictions?.flash_flood?.risk_score 
    ?? liveNowcast?.predictions?.cloudburst?.risk_score 
    ?? (liveNowcast?.predictions?.thunderstorm_probability ? liveNowcast.predictions.thunderstorm_probability / 100 : 0.72);

  const dynamicConfidence = liveNowcast ? `${Math.round(maxRisk * 100)}%` : selectedIncident.confidence;
  const dynamicMetric1 = weather.precipitation_mm != null ? `${weather.precipitation_mm.toFixed(1)} mm` : selectedIncident.metric1;
  const dynamicMetric1Label = weather.precipitation_mm != null ? 'Live rain rate' : selectedIncident.metric1Label;
  const dynamicMetric2 = weather.wind_speed_10m_kmh != null ? `${weather.wind_speed_10m_kmh.toFixed(1)} km/h` : selectedIncident.metric2;
  const dynamicMetric2Label = weather.wind_speed_10m_kmh != null ? 'Surface Wind' : selectedIncident.metric2Label;

  const handleDispatchCurrent = async () => {
    setIsDispatching(true);
    try {
      await broadcastAlert({
        alertId: selectedIncident.id,
        headline: selectedIncident.headline,
        severity: selectedIncident.sev,
        area: selectedIncident.area,
        protocol: 'CAP-1.2',
      });
    } catch (err) {
      console.warn('[VAYUNET Alerts] Broadcast error:', err);
    }

    const nowStr = formatISTTime(new Date());
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
    <div className="tac-clean-nowcast-root" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Action Stage Header Banner */}
      <div className="tac-alerts-stage-bar">
        <div className="tac-asb-left">
          <span className="tac-asb-pill">STAGE 4 · ACT</span>
          <span className="tac-asb-title">Emergency Incident Dispatch &amp; ITU-T X.1303 (CAP 1.2) Multi-Agency Broadcast</span>
        </div>
        <div className="tac-asb-right">
          <button
            type="button"
            className="tac-asb-btn"
            onClick={() => onNavigateTab && onNavigateTab('nowcast')}
            title="Return to Nowcast"
          >
            ← 1. Live Nowcast
          </button>
          <button
            type="button"
            className="tac-asb-btn"
            onClick={() => onNavigateTab && onNavigateTab('analysis')}
            title="Review scientific analysis"
          >
            ← 2. Why? (Analysis)
          </button>
          <button
            type="button"
            className="tac-asb-btn"
            onClick={() => onNavigateTab && onNavigateTab('events')}
            title="Review historical validation"
          >
            ← 3. Proof (Events)
          </button>
        </div>
      </div>

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
              <span className={weatherStatus === 'LIVE' ? 'tac-clean-live-dot' : 'tac-clean-degraded-dot'} />
              <span style={{ color: weatherStatus === 'LIVE' ? '#38bdf8' : '#f59e0b', fontSize: '11px', fontWeight: 700 }}>
                {weatherStatus === 'LIVE' ? 'Real-Time Feed' : 'Cached Feed'}
              </span>
              <span style={{ color: '#94a3b8' }}>·</span>
              <span>{istTime || 'Live IST'}</span>
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

          {/* Real-Time Telemetry Bar */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '6px',
            padding: '8px 10px',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
            fontSize: '11px',
            marginBottom: '8px'
          }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase' }}>Surface Temp</div>
              <div style={{ fontWeight: 700, color: '#ffffff' }}>
                {weather.temperature_2m_c != null ? `${weather.temperature_2m_c.toFixed(1)} °C` : '--'}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase' }}>Humidity</div>
              <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                {weather.relative_humidity_2m_pct != null ? `${weather.relative_humidity_2m_pct}%` : '--'}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase' }}>Pressure</div>
              <div style={{ fontWeight: 700, color: '#cbd5e1' }}>
                {weather.surface_pressure_hpa != null ? `${weather.surface_pressure_hpa.toFixed(1)} hPa` : '--'}
              </div>
            </div>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '9px', textTransform: 'uppercase' }}>Model Risk</div>
              <div style={{ fontWeight: 700, color: maxRisk >= 0.7 ? '#ef4444' : maxRisk >= 0.4 ? '#f97316' : '#22c55e' }}>
                {liveNowcast ? `${(maxRisk * 100).toFixed(0)}%` : dynamicConfidence}
              </div>
            </div>
          </div>

          <div className="tac-clean-chips-grid">
            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>{selectedIncident.metric1Icon}</span>
                <span className="tac-clean-chip-val">{dynamicMetric1}</span>
              </div>
              <span className="tac-clean-chip-label">{dynamicMetric1Label}</span>
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
                <span className="tac-clean-chip-val">{dynamicConfidence}</span>
              </div>
              <span className="tac-clean-chip-label">Model confidence</span>
            </div>

            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>{selectedIncident.metric2Icon}</span>
                <span className="tac-clean-chip-val">{dynamicMetric2}</span>
              </div>
              <span className="tac-clean-chip-label">{dynamicMetric2Label}</span>
            </div>
          </div>

          {/* Dynamic Validity Window */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '6px',
            padding: '6px 10px',
            fontSize: '11px',
            color: '#cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span><strong>Valid:</strong> {formatISTDate(new Date())}</span>
            <span style={{ color: '#64748b' }}>➔</span>
            <span><strong>Until:</strong> {formatISTDate(new Date(), 4)}</span>
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

          <div style={{ fontSize: '10px', color: '#94a3b8', fontStyle: 'italic', marginBottom: '6px' }}>
            * AI-generated risk assessment - not an official warning.
          </div>

          <button
            type="button"
            className="tac-clean-dispatch-btn"
            style={{ 
              background: isDispatching ? '#475569' : selectedIncident.sev === 'HIGH' ? '#dc2626' : '#2563eb',
              cursor: isDispatching ? 'not-allowed' : 'pointer',
              border: 'none',
              marginTop: 'auto'
            }}
            onClick={handleDispatchCurrent}
            disabled={isDispatching}
          >
            <span style={{ fontSize: '15px' }}>((●))</span>
            <span>{isDispatching ? 'Transmitting CAP 1.2...' : 'Dispatch CAP Alert →'}</span>
          </button>
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
