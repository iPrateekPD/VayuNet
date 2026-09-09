import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Custom DivIcon creator
function createHtmlIcon(html, size = [20, 20], anchor = [10, 10]) {
  return L.divIcon({
    html,
    className: 'tac-leaflet-div-icon',
    iconSize: size,
    iconAnchor: anchor,
  });
}

export default function TacticalNowcastView({ onDispatchAlert, showToast }) {
  const [selectedStep, setSelectedStep] = useState('+2h');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState('Chamoli, Uttarakhand');

  // Layer switches (matching screenshot defaults)
  const [layers, setLayers] = useState({
    precip: true,        // Live Precipitation (Observed & Nowcast)
    satellite: false,    // Satellite Cloud Tops
    terrain: true,       // Digital Elevation Model (Terrain)
    rivers: true,        // Hydrological River Network
  });

  const timeSteps = ['Now', '+1h', '+2h', '+3h', '+4h', '+6h'];

  const sectorOptions = [
    'Chamoli, Uttarakhand',
    'Kangra, Himachal Pradesh',
    'Rudraprayag, Uttarakhand',
    'Pithoragarh, Uttarakhand',
    'Uttarkashi, Uttarakhand',
  ];

  // Playback simulation timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedStep((prev) => {
          const idx = timeSteps.indexOf(prev);
          const nextIdx = (idx + 1) % timeSteps.length;
          return timeSteps[nextIdx];
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDispatch = () => {
    if (onDispatchAlert) {
      onDispatchAlert();
    } else if (showToast) {
      showToast('CAP Alert dispatched to NDMA SACHET gateway for Chamoli Sector');
    }
  };

  // Coordinates for Chamoli, Uttarakhand
  const chamoliCenter = [30.41, 79.32];

  // High-resolution multi-band Doppler radar convective plume contours (Chamoli - Alaknanda Valley)
  const radarOuterHalo = [
    [30.82, 79.15], [30.86, 79.35], [30.80, 79.58], [30.68, 79.72],
    [30.55, 79.88], [30.40, 80.05], [30.22, 80.08], [30.08, 79.92],
    [30.02, 79.70], [30.06, 79.45], [30.15, 79.22], [30.28, 79.08],
    [30.44, 78.96], [30.60, 78.98], [30.74, 79.05]
  ];

  const radarGreenBand = [
    [30.74, 79.22], [30.76, 79.42], [30.68, 79.62], [30.52, 79.78],
    [30.36, 79.92], [30.20, 79.88], [30.12, 79.68], [30.15, 79.45],
    [30.24, 79.28], [30.38, 79.14], [30.55, 79.12], [30.66, 79.16]
  ];

  const radarYellowBand = [
    [30.66, 79.28], [30.68, 79.45], [30.58, 79.62], [30.45, 79.72],
    [30.32, 79.78], [30.22, 79.65], [30.20, 79.48], [30.28, 79.32],
    [30.42, 79.22], [30.56, 79.22]
  ];

  const radarOrangeBand = [
    [30.58, 79.34], [30.58, 79.48], [30.48, 79.58], [30.38, 79.64],
    [30.28, 79.58], [30.26, 79.44], [30.32, 79.32], [30.44, 79.28],
    [30.52, 79.30]
  ];

  const radarCorePlume = [
    [30.52, 79.36], [30.50, 79.45], [30.42, 79.50], [30.34, 79.48],
    [30.30, 79.40], [30.32, 79.34], [30.40, 79.30], [30.48, 79.32]
  ];

  const radarExtremeCore = [
    [30.46, 79.36], [30.44, 79.42], [30.38, 79.42], [30.34, 79.36],
    [30.36, 79.32], [30.42, 79.32]
  ];

  // Alaknanda River and tributaries
  const alaknandaRiver = [
    [30.744, 79.493], // Badrinath
    [30.650, 79.520],
    [30.556, 79.566], // Joshimath
    [30.490, 79.430],
    [30.410, 79.320], // Chamoli
    [30.350, 79.260],
    [30.258, 79.217], // Karnaprayag
    [30.285, 78.981], // Rudraprayag
    [30.145, 78.597]  // Devprayag
  ];

  const tributaryMandakini = [
    [30.550, 79.050],
    [30.420, 79.020],
    [30.285, 78.981] // joins Rudraprayag
  ];

  const tributaryPindar = [
    [30.080, 79.550],
    [30.180, 79.380],
    [30.258, 79.217] // joins Karnaprayag
  ];

  // Downstream flow vector coordinates along Alaknanda River
  const flowArrowCoords = [
    [30.385, 79.300],
    [30.340, 79.270],
    [30.295, 79.240],
  ];

  // Tactical Town and Peak Points
  const tacticalPoints = [
    { name: 'Badrinath', coords: [30.744, 79.493] },
    { name: 'Joshimath', coords: [30.556, 79.566] },
    { name: 'Rudraprayag', coords: [30.285, 78.981] },
    { name: 'Karnaprayag', coords: [30.258, 79.217] },
    { name: 'Pithoragarh', coords: [29.582, 80.218] },
  ];

  return (
    <div className="tac-clean-nowcast-root">
      {/* ================= TOP ROW: MAP + HIGHEST THREAT CARD ================= */}
      <div className="tac-clean-top-row">
        {/* MAP CONTAINER */}
        <div className="tac-clean-map-card">
          {/* FLOATING TOP BAR */}
          <div className="tac-clean-map-topbar">
            {/* Sector / Search Dropdown */}
            <div className="tac-clean-sector-wrap">
              <button
                type="button"
                className="tac-clean-sector-btn"
                onClick={() => setIsSectorOpen(!isSectorOpen)}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <span>{selectedSector}</span>
                <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>▾</span>
              </button>

              {isSectorOpen && (
                <div className="tac-clean-sector-menu">
                  {sectorOptions.map((opt) => (
                    <div
                      key={opt}
                      className={`tac-clean-sector-option ${selectedSector === opt ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedSector(opt);
                        setIsSectorOpen(false);
                        if (showToast) showToast(`Centered to ${opt}`);
                      }}
                    >
                      {opt}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Timesteps Filter Pills */}
            <div className="tac-clean-timesteps-group">
              {timeSteps.map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`tac-clean-time-pill ${selectedStep === step ? 'active' : ''}`}
                  onClick={() => setSelectedStep(step)}
                >
                  {step}
                </button>
              ))}
            </div>

            {/* Date & Live Indicator */}
            <div className="tac-clean-live-pill">
              <span>08 Sep 2026, 11:52 PM IST</span>
              <span className="tac-clean-live-dot" />
              <span style={{ color: '#f87171', fontWeight: 700 }}>Live</span>
            </div>
          </div>

          {/* FLOATING LEFT TOOLBAR */}
          <div className="tac-clean-left-toolbar">
            <button
              type="button"
              className={`tac-clean-tool-btn ${layers.precip ? 'active' : ''}`}
              onClick={() => handleToggleLayer('precip')}
              title="Toggle Precipitation Radar"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              <span>Precipitation</span>
            </button>

            <button
              type="button"
              className={`tac-clean-tool-btn ${layers.satellite ? 'active' : ''}`}
              onClick={() => handleToggleLayer('satellite')}
              title="Toggle Satellite View"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="9" />
                <path d="M3.6 9h16.8M3.6 15h16.8" />
                <path d="M11.5 3a17 17 0 0 0 0 18M12.5 3a17 17 0 0 1 0 18" />
              </svg>
              <span>Satellite</span>
            </button>

            <button
              type="button"
              className={`tac-clean-tool-btn ${layers.terrain ? 'active' : ''}`}
              onClick={() => handleToggleLayer('terrain')}
              title="Toggle Digital Elevation Model (Terrain)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 20h18L12 4z" />
              </svg>
              <span>Terrain</span>
            </button>

            <button
              type="button"
              className={`tac-clean-tool-btn ${layers.rivers ? 'active' : ''}`}
              onClick={() => handleToggleLayer('rivers')}
              title="Toggle Rivers & Drainage Network"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M4 6c4 0 4 4 8 4s4-4 8-4" />
                <path d="M4 12c4 0 4 4 8 4s4-4 8-4" />
                <path d="M4 18c4 0 4 4 8 4s4-4 8-4" />
              </svg>
              <span>Rivers</span>
            </button>

            <button
              type="button"
              className="tac-clean-tool-btn"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen();
                } else {
                  document.querySelector('.tac-clean-map-card')?.requestFullscreen();
                }
              }}
              title="Toggle Fullscreen"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>

          {/* LEAFLET SATELLITE RADAR MAP */}
          <MapContainer
            center={chamoliCenter}
            zoom={9}
            scrollWheelZoom={true}
            className="tac-clean-leaflet-container"
            zoomControl={false}
          >
            <MapController center={chamoliCenter} zoom={9} />

            {/* Base Satellite Imagery */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="Esri World Imagery"
              maxZoom={18}
            />

            {/* Clean geography labels */}
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              opacity={0.7}
            />

            {/* Precipitation Doppler Multi-Band Radar Simulation */}
            {layers.precip && (
              <>
                <Polygon
                  positions={radarOuterHalo}
                  pathOptions={{
                    color: '#00e5ff',
                    fillColor: '#00b4d8',
                    fillOpacity: 0.35,
                    weight: 1,
                  }}
                />
                <Polygon
                  positions={radarGreenBand}
                  pathOptions={{
                    color: '#22c55e',
                    fillColor: '#16a34a',
                    fillOpacity: 0.45,
                    weight: 1,
                  }}
                />
                <Polygon
                  positions={radarYellowBand}
                  pathOptions={{
                    color: '#eab308',
                    fillColor: '#ca8a04',
                    fillOpacity: 0.55,
                    weight: 1,
                  }}
                />
                <Polygon
                  positions={radarOrangeBand}
                  pathOptions={{
                    color: '#f97316',
                    fillColor: '#ea580c',
                    fillOpacity: 0.7,
                    weight: 1.2,
                  }}
                />
                <Polygon
                  positions={radarCorePlume}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#dc2626',
                    fillOpacity: 0.85,
                    weight: 1.5,
                  }}
                />
                <Polygon
                  positions={radarExtremeCore}
                  pathOptions={{
                    color: '#991b1b',
                    fillColor: '#7f1d1d',
                    fillOpacity: 0.95,
                    weight: 1.5,
                  }}
                />
              </>
            )}

            {/* River Drainage Network */}
            {layers.rivers && (
              <>
                <Polyline
                  positions={alaknandaRiver}
                  pathOptions={{ color: '#38bdf8', weight: 2.8, opacity: 0.85 }}
                />
                <Polyline
                  positions={tributaryMandakini}
                  pathOptions={{ color: '#0284c7', weight: 2, opacity: 0.8 }}
                />
                <Polyline
                  positions={tributaryPindar}
                  pathOptions={{ color: '#0284c7', weight: 2, opacity: 0.8 }}
                />
              </>
            )}

            {/* Chamoli Threat Callout & Pulsing Dot */}
            <Marker
              position={chamoliCenter}
              icon={createHtmlIcon(`
                <div style="position: relative; display: flex; align-items: center;">
                  <div style="width: 10px; height: 10px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 10px #ffffff, 0 0 20px #ef4444; position: absolute; left: 0; top: 12px; z-index: 10;"></div>
                  <div style="margin-left: 18px; background: rgba(8, 14, 25, 0.94); border: 1px solid rgba(239, 68, 68, 0.6); border-radius: 6px; padding: 6px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.85); min-width: 96px;">
                    <div style="font-size: 11px; font-weight: 700; color: #ffffff;">Chamoli</div>
                    <div style="font-size: 10px; font-weight: 700; color: #ef4444;">High Risk</div>
                    <div style="font-size: 9.5px; color: #94a3b8; font-family: monospace;">ETA 1h 45m</div>
                  </div>
                </div>
              `, [160, 48], [5, 17])}
            />

            {/* Downstream Flow Callout Along Alaknanda */}
            <Marker
              position={[30.27, 79.44]}
              icon={createHtmlIcon(`
                <div style="background: rgba(8, 14, 25, 0.94); border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 5px; padding: 4px 10px; color: #f1f5f9; font-size: 10px; font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,0.75); white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                  <span>Likely downstream flow</span>
                  <span style="color: #94a3b8; font-size: 9px;">(along Alaknanda River)</span>
                </div>
              `, [230, 26], [115, 13])}
            />

            {/* Downstream Directional Arrows on River */}
            {[
              [30.375, 79.31],
              [30.335, 79.35],
              [30.295, 79.39],
            ].map((pos, idx) => (
              <Marker
                key={idx}
                position={pos}
                icon={createHtmlIcon(`
                  <div style="color: #ffffff; font-size: 15px; font-weight: 900; text-shadow: 0 0 6px #000; transform: rotate(135deg); opacity: 0.95;">
                    ➜
                  </div>
                `, [18, 18], [9, 9])}
              />
            ))}

            {/* Regional Labels: Uttarakhand & India */}
            <Marker
              position={[30.48, 78.75]}
              icon={createHtmlIcon(`
                <div style="color: rgba(255, 255, 255, 0.55); font-size: 15px; font-weight: 800; letter-spacing: 3px; text-shadow: 0 2px 8px rgba(0,0,0,0.9);">
                  UTTARAKHAND
                </div>
              `, [200, 24], [100, 12])}
            />

            <Marker
              position={[30.65, 80.12]}
              icon={createHtmlIcon(`
                <div style="color: rgba(255, 255, 255, 0.45); font-size: 14px; font-weight: 800; letter-spacing: 2px; text-shadow: 0 2px 8px rgba(0,0,0,0.9);">
                  INDIA
                </div>
              `, [100, 24], [50, 12])}
            />

            {/* Tactical Town Points */}
            {tacticalPoints.map((pt) => (
              <Marker
                key={pt.name}
                position={pt.coords}
                icon={createHtmlIcon(`
                  <div style="display: flex; align-items: center; gap: 4px; pointer-events: none;">
                    <div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 4px #000;"></div>
                    <span style="font-size: 10px; font-weight: 600; color: #f1f5f9; text-shadow: 0 1px 4px #000; white-space: nowrap;">
                      ${pt.name}
                    </span>
                  </div>
                `, [120, 18], [2, 9])}
              />
            ))}
          </MapContainer>

          {/* Scale Bar (Bottom-Left) */}
          <div className="tac-clean-scale-bar">
            <span>0</span>
            <span>10</span>
            <span>20</span>
            <span>50 km</span>
          </div>

          {/* Precipitation Intensity Legend (Bottom-Right) */}
          <div className="tac-clean-legend-box">
            <span className="tac-clean-legend-title">Precipitation Intensity (mm/hr)</span>
            <div className="tac-clean-legend-ramp" />
            <div className="tac-clean-legend-ticks">
              <span>0</span>
              <span>1</span>
              <span>5</span>
              <span>10</span>
              <span>20</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* HIGHEST THREAT PANEL (Right Column) */}
        <div className="tac-clean-threat-card">
          {/* Header */}
          <div className="tac-clean-threat-head">
            <div className="tac-clean-flame-tag">
              <span style={{ fontSize: '14px' }}>🔥</span>
              <span>HIGHEST THREAT</span>
            </div>
            <div className="tac-clean-forecast-pill">Forecast: +1h 45m</div>
          </div>

          {/* Warning Title with Big Icon */}
          <div className="tac-clean-warn-title-group">
            <div className="tac-clean-warn-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <div className="tac-clean-warn-main">FLASH FLOOD</div>
              <div className="tac-clean-warn-main">HIGH RISK</div>
              <div className="tac-clean-warn-loc">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>Chamoli, Uttarakhand</span>
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div className="tac-clean-narrative">
            Intense rainfall may cause sudden rises in rivers and flash flooding in downstream areas.
          </div>

          {/* 4 Metric Chips (2x2 Grid) */}
          <div className="tac-clean-chips-grid">
            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>💧</span>
                <span className="tac-clean-chip-val">124 mm</span>
              </div>
              <span className="tac-clean-chip-label">Est. rainfall (next 2h)</span>
            </div>

            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>🕒</span>
                <span className="tac-clean-chip-val">1h 45m</span>
              </div>
              <span className="tac-clean-chip-label">Estimated arrival</span>
            </div>

            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>📊</span>
                <span className="tac-clean-chip-val">82%</span>
              </div>
              <span className="tac-clean-chip-label">Model confidence</span>
            </div>

            <div className="tac-clean-chip">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#38bdf8', fontSize: '13px' }}>🗺️</span>
                <span className="tac-clean-chip-val">412 km²</span>
              </div>
              <span className="tac-clean-chip-label">Affected area</span>
            </div>
          </div>

          {/* Recommended Action */}
          <div className="tac-clean-action-box">
            <div className="tac-clean-action-head">
              <span>⚠️</span>
              <span>Recommended Action</span>
            </div>
            <div className="tac-clean-action-desc">
              Move away from riverbeds and low-lying areas.
            </div>
          </div>

          {/* Dispatch CAP Alert Button */}
          <button
            type="button"
            className="tac-clean-dispatch-btn"
            onClick={handleDispatch}
          >
            <span style={{ fontSize: '15px' }}>((●))</span>
            <span>Dispatch CAP Alert  →</span>
          </button>
        </div>
      </div>

      {/* ================= BOTTOM ROW: 3 CARDS ================= */}
      <div className="tac-clean-bottom-row">
        {/* Card 1: Forecast Timeline (Chamoli) */}
        <div className="tac-clean-card">
          <div className="tac-clean-card-title">Forecast Timeline (Chamoli)</div>
          <div className="tac-clean-timeline-body">
            <button
              type="button"
              className="tac-clean-play-circle"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? 'Pause simulation' : 'Play simulation'}
            >
              {isPlaying ? '❚❚' : '▶'}
            </button>

            <div className="tac-clean-filmstrip">
              {timeSteps.map((step) => (
                <div
                  key={step}
                  className={`tac-clean-thumb-box ${selectedStep === step ? 'active' : ''}`}
                  onClick={() => setSelectedStep(step)}
                >
                  <div className="tac-clean-thumb-graphic">
                    <svg viewBox="0 0 60 40" width="100%" height="100%">
                      <rect width="60" height="40" fill="#091424" />
                      {/* Mountain contour */}
                      <path d="M0 38 L14 26 L28 32 L42 20 L60 34 L60 40 L0 40 Z" fill="#132438" opacity="0.9" />
                      {/* Cyan/blue outer echo */}
                      <circle
                        cx="32"
                        cy="20"
                        r={step === 'Now' ? 10 : step === '+1h' ? 12 : step === '+2h' ? 15 : step === '+3h' ? 13 : step === '+4h' ? 11 : 9}
                        fill="#00e5ff"
                        opacity="0.45"
                      />
                      {/* Green echo */}
                      <circle
                        cx="32"
                        cy="20"
                        r={step === 'Now' ? 7 : step === '+1h' ? 9 : step === '+2h' ? 12 : step === '+3h' ? 10 : step === '+4h' ? 8 : 6}
                        fill="#22c55e"
                        opacity="0.6"
                      />
                      {/* Yellow echo */}
                      <circle
                        cx="32"
                        cy="20"
                        r={step === 'Now' ? 5 : step === '+1h' ? 7 : step === '+2h' ? 9 : step === '+3h' ? 7 : step === '+4h' ? 5 : 4}
                        fill="#eab308"
                        opacity="0.75"
                      />
                      {/* Orange echo */}
                      <circle
                        cx="32"
                        cy="20"
                        r={step === 'Now' ? 3.5 : step === '+1h' ? 5 : step === '+2h' ? 6.5 : step === '+3h' ? 5 : step === '+4h' ? 3.5 : 2.5}
                        fill="#f97316"
                        opacity="0.85"
                      />
                      {/* Red high-reflectivity core */}
                      <circle
                        cx="32"
                        cy="20"
                        r={step === 'Now' ? 2 : step === '+1h' ? 3 : step === '+2h' ? 4.5 : step === '+3h' ? 3 : step === '+4h' ? 2 : 1.5}
                        fill="#ef4444"
                        opacity="0.95"
                      />
                    </svg>
                  </div>
                  <span className="tac-clean-thumb-label">{step}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="tac-clean-next-btn"
              onClick={() => {
                const idx = timeSteps.indexOf(selectedStep);
                setSelectedStep(timeSteps[(idx + 1) % timeSteps.length]);
              }}
              title="Next timestep"
            >
              ›
            </button>
          </div>
        </div>

        {/* Card 2: Other Active Threats (Next 6 Hours) */}
        <div className="tac-clean-card">
          <div className="tac-clean-card-title-row">
            <span className="tac-clean-card-title">Other Active Threats (Next 6 Hours)</span>
            <span
              className="tac-clean-view-all"
              onClick={() => showToast && showToast('Viewing all secondary tactical convective threats')}
            >
              View All →
            </span>
          </div>

          <div className="tac-clean-threats-list">
            <div className="tac-clean-threat-row">
              <span className="tac-clean-threat-name">
                <span style={{ color: '#ef4444' }}>⚠️</span>
                <span>Cloudburst</span>
              </span>
              <div className="tac-clean-threat-bar-wrap">
                <div
                  className="tac-clean-threat-bar-fill"
                  style={{ width: '48%', background: 'linear-gradient(90deg, #f97316, #ef4444)' }}
                />
              </div>
              <span className="tac-clean-threat-pct">48%</span>
              <span className="tac-clean-threat-eta">ETA 2 h 30 m</span>
            </div>

            <div className="tac-clean-threat-row">
              <span className="tac-clean-threat-name">
                <span style={{ color: '#38bdf8' }}>⛈️</span>
                <span>Thunderstorm</span>
              </span>
              <div className="tac-clean-threat-bar-wrap">
                <div
                  className="tac-clean-threat-bar-fill"
                  style={{ width: '30%', background: 'linear-gradient(90deg, #38bdf8, #eab308)' }}
                />
              </div>
              <span className="tac-clean-threat-pct">30%</span>
              <span className="tac-clean-threat-eta">ETA 3 h 10 m</span>
            </div>

            <div className="tac-clean-threat-row">
              <span className="tac-clean-threat-name">
                <span style={{ color: '#38bdf8' }}>🌧️</span>
                <span>Heavy Rainfall</span>
              </span>
              <div className="tac-clean-threat-bar-wrap">
                <div
                  className="tac-clean-threat-bar-fill"
                  style={{ width: '20%', background: 'linear-gradient(90deg, #0284c7, #38bdf8)' }}
                />
              </div>
              <span className="tac-clean-threat-pct">20%</span>
              <span className="tac-clean-threat-eta">ETA 4 h 20 m</span>
            </div>
          </div>
        </div>

        {/* Card 3: Data Freshness */}
        <div className="tac-clean-card">
          <div className="tac-clean-card-title">Data Freshness</div>
          <div className="tac-clean-freshness-list">
            <div className="tac-clean-freshness-row">
              <div className="tac-clean-feed-left">
                <span className="tac-clean-green-dot" />
                <span>INSAT-3D/3DR</span>
              </div>
              <span className="tac-clean-feed-time">2 min ago</span>
            </div>

            <div className="tac-clean-freshness-row">
              <div className="tac-clean-feed-left">
                <span className="tac-clean-green-dot" />
                <span>IMDAA Reanalysis</span>
              </div>
              <span className="tac-clean-feed-time">6 min ago</span>
            </div>

            <div className="tac-clean-freshness-row">
              <div className="tac-clean-feed-left">
                <span className="tac-clean-green-dot" />
                <span>CartoDEM</span>
              </div>
              <span className="tac-clean-feed-time">12 min ago</span>
            </div>

            <div className="tac-clean-freshness-row">
              <div className="tac-clean-feed-left">
                <span className="tac-clean-green-dot" />
                <span>IMD Observations</span>
              </div>
              <span className="tac-clean-feed-time">3 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
