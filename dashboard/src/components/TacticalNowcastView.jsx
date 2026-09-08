import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Circle, Marker, Tooltip, useMap } from 'react-leaflet';
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
  const [searchQuery, setSearchQuery] = useState('Chamoli, Uttarakhand');
  const [activePreset, setActivePreset] = useState('all');

  // Layer switches (matching screenshot defaults)
  const [layers, setLayers] = useState({
    hazard: true,        // VAYUNET Hazard (Predicted)
    precip: true,        // Live Precipitation (Observed)
    satellite: false,    // Satellite (Cloud Tops)
    terrain: true,       // Terrain (DEM)
    rivers: true,        // Rivers & Water Bodies
    boundaries: false,   // District Boundaries
    roads: false,        // Major Roads
  });

  const timeSteps = ['Now', '+1h', '+2h', '+3h', '+4h', '+6h'];

  // Playback timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedStep((prev) => {
          const idx = timeSteps.indexOf(prev);
          const nextIdx = (idx + 1) % timeSteps.length;
          return timeSteps[nextIdx];
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSelectPreset = (preset) => {
    setActivePreset(preset);
    if (preset === 'all') {
      setLayers({ hazard: true, precip: true, satellite: false, terrain: true, rivers: true, boundaries: false, roads: false });
    } else if (preset === 'flood') {
      setLayers({ hazard: true, precip: true, satellite: false, terrain: true, rivers: true, boundaries: false, roads: false });
    } else if (preset === 'burst') {
      setLayers({ hazard: true, precip: true, satellite: true, terrain: true, rivers: false, boundaries: false, roads: false });
    } else if (preset === 'thunder') {
      setLayers({ hazard: true, precip: true, satellite: true, terrain: false, rivers: false, boundaries: true, roads: false });
    } else if (preset === 'rainfall') {
      setLayers({ hazard: false, precip: true, satellite: false, terrain: true, rivers: true, boundaries: false, roads: true });
    }
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

  // Downstream flow arrows coordinates along the river
  const flowArrowCoords = [
    [30.385, 79.300],
    [30.340, 79.270],
    [30.295, 79.240],
  ];

  // Surrounding towns and peaks
  const tacticalPoints = [
    { name: 'Badrinath', coords: [30.744, 79.493], type: 'town' },
    { name: 'Joshimath', coords: [30.556, 79.566], type: 'town' },
    { name: 'Rudraprayag', coords: [30.285, 78.981], type: 'town' },
    { name: 'Karnaprayag', coords: [30.258, 79.217], type: 'town' },
    { name: 'Tehri', coords: [30.380, 78.480], type: 'town' },
    { name: 'Pithoragarh', coords: [29.582, 80.218], type: 'town' },
    { name: 'NANDA DEVI 7,816 m', coords: [30.375, 79.970], type: 'peak' },
  ];

  return (
    <div className="tactical-nowcast-root">
      <div className="tactical-grid-layout">
        {/* ==================== LEFT COLUMN ==================== */}
        <aside className="tac-left-col">
          {/* Location Selector */}
          <div className="tac-card tac-location-card">
            <div className="tac-section-title">Location</div>
            <div className="tac-search-box">
              <svg className="tac-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className="tac-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sector or district..."
              />
              {searchQuery && (
                <button type="button" className="tac-search-clear" onClick={() => setSearchQuery('')} title="Clear search">
                  ✕
                </button>
              )}
              <button
                type="button"
                className="tac-search-locate"
                onClick={() => {
                  setSearchQuery('Chamoli, Uttarakhand');
                  if (showToast) showToast('Recenetred to Chamoli Sector [30.41°N, 79.32°E]');
                }}
                title="Locate sector"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="7" />
                  <line x1="12" y1="1" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="1" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="23" y2="12" />
                </svg>
              </button>
            </div>

            {/* Mini India Locator Preview */}
            <div className="tac-locator-preview">
              <svg className="tac-mini-map-svg" viewBox="0 0 100 100" fill="none">
                {/* Simplified schematic silhouette of India */}
                <path
                  d="M48 10 L56 16 L54 22 L62 26 L65 32 L58 36 L64 42 L68 46 L74 46 L82 40 L88 44 L80 50 L70 52 L62 58 L58 66 L52 78 L50 86 L46 76 L42 66 L34 56 L26 50 L22 42 L26 34 L32 32 L36 24 L42 22 Z"
                  fill="#1e293b"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                  opacity="0.75"
                />
                {/* Uttarakhand highlight area */}
                <path d="M48 20 L54 22 L52 27 L46 25 Z" fill="#3b82f6" opacity="0.8" />
                {/* Glowing Chamoli pin */}
                <circle cx="50" cy="24" r="3.5" fill="#38bdf8" />
                <circle cx="50" cy="24" r="7" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
              </svg>
              <div className="tac-locator-meta">
                <span className="tac-locator-state">Uttarakhand</span>
                <span className="tac-locator-city">Chamoli</span>
                <span className="tac-locator-coords">30.41° N, 79.32° E</span>
              </div>
            </div>
          </div>

          {/* Hazard Layers */}
          <div className="tac-card tac-layers-card">
            <div className="tac-section-title">Hazard Layers</div>
            <div className="tac-layers-list">
              {/* 1. VAYUNET Hazard (Predicted) */}
              <div className="tac-layer-item" onClick={() => handleToggleLayer('hazard')}>
                <div className="tac-layer-left">
                  <span className="tac-layer-icon" style={{ color: '#ef4444' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2c-4.97 0-9 4.03-9 9 0 4.17 2.84 7.67 6.69 8.69L12 22l2.31-2.31C18.16 18.67 21 15.17 21 11c0-4.97-4.03-9-9-9zm0 13c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" />
                    </svg>
                  </span>
                  <span className="tac-layer-name">VAYUNET Hazard (Predicted)</span>
                </div>
                <div className={`tac-switch ${layers.hazard ? 'active' : ''}`}>
                  <div className="tac-switch-thumb" />
                </div>
              </div>

              {/* 2. Live Precipitation (Observed) */}
              <div className="tac-layer-item" onClick={() => handleToggleLayer('precip')}>
                <div className="tac-layer-left">
                  <span className="tac-layer-icon" style={{ color: '#38bdf8' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM10 18l-2 3M14 18l-2 3M18 18l-2 3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                  <span className="tac-layer-name">Live Precipitation (Observed)</span>
                </div>
                <div className={`tac-switch ${layers.precip ? 'active' : ''}`}>
                  <div className="tac-switch-thumb" />
                </div>
              </div>

              {/* 3. Satellite (Cloud Tops) */}
              <div className="tac-layer-item" onClick={() => handleToggleLayer('satellite')}>
                <div className="tac-layer-left">
                  <span className="tac-layer-icon" style={{ color: '#94a3b8' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 10a8 8 0 0 1 8-8m-8 12a12 12 0 0 1 12-12" />
                      <line x1="21.17" y1="2.83" x2="16.93" y2="7.07" />
                      <line x1="14.1" y1="9.9" x2="16.93" y2="7.07" />
                      <circle cx="9" cy="15" r="5" />
                    </svg>
                  </span>
                  <span className="tac-layer-name">Satellite (Cloud Tops)</span>
                </div>
                <div className={`tac-switch ${layers.satellite ? 'active' : ''}`}>
                  <div className="tac-switch-thumb" />
                </div>
              </div>

              {/* 4. Terrain (DEM) */}
              <div className="tac-layer-item" onClick={() => handleToggleLayer('terrain')}>
                <div className="tac-layer-left">
                  <span className="tac-layer-icon" style={{ color: '#38bdf8' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="14 6 4 19 20 19" />
                    </svg>
                  </span>
                  <span className="tac-layer-name">Terrain (DEM)</span>
                </div>
                <div className={`tac-switch ${layers.terrain ? 'active' : ''}`}>
                  <div className="tac-switch-thumb" />
                </div>
              </div>

              {/* 5. Rivers & Water Bodies */}
              <div className="tac-layer-item" onClick={() => handleToggleLayer('rivers')}>
                <div className="tac-layer-left">
                  <span className="tac-layer-icon" style={{ color: '#06b6d4' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 6c3 0 4 2 7 2s4-2 7-2 4 2 6 2" />
                      <path d="M2 12c3 0 4 2 7 2s4-2 7-2 4 2 6 2" />
                      <path d="M2 18c3 0 4 2 7 2s4-2 7-2 4 2 6 2" />
                    </svg>
                  </span>
                  <span className="tac-layer-name">Rivers & Water Bodies</span>
                </div>
                <div className={`tac-switch ${layers.rivers ? 'active' : ''}`}>
                  <div className="tac-switch-thumb" />
                </div>
              </div>

              {/* 6. District Boundaries */}
              <div className="tac-layer-item" onClick={() => handleToggleLayer('boundaries')}>
                <div className="tac-layer-left">
                  <span className="tac-layer-icon" style={{ color: '#94a3b8' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                  </span>
                  <span className="tac-layer-name">District Boundaries</span>
                </div>
                <div className={`tac-switch ${layers.boundaries ? 'active' : ''}`}>
                  <div className="tac-switch-thumb" />
                </div>
              </div>

              {/* 7. Major Roads */}
              <div className="tac-layer-item" onClick={() => handleToggleLayer('roads')}>
                <div className="tac-layer-left">
                  <span className="tac-layer-icon" style={{ color: '#94a3b8' }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="4" y1="19" x2="8" y2="5" />
                      <line x1="20" y1="19" x2="16" y2="5" />
                      <line x1="12" y1="7" x2="12" y2="9" strokeDasharray="2 2" />
                      <line x1="12" y1="15" x2="12" y2="17" strokeDasharray="2 2" />
                    </svg>
                  </span>
                  <span className="tac-layer-name">Major Roads</span>
                </div>
                <div className={`tac-switch ${layers.roads ? 'active' : ''}`}>
                  <div className="tac-switch-thumb" />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="tac-card tac-presets-card">
            <div className="tac-section-title">Quick Presets</div>
            <div className="tac-presets-list">
              <button
                type="button"
                className={`tac-preset-btn ${activePreset === 'all' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('all')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <span>All Hazards</span>
              </button>

              <button
                type="button"
                className={`tac-preset-btn ${activePreset === 'flood' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('flood')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12c3 0 4 2 7 2s4-2 7-2 4 2 6 2" />
                  <path d="M2 18c3 0 4 2 7 2s4-2 7-2 4 2 6 2" />
                </svg>
                <span>Flash Flood</span>
              </button>

              <button
                type="button"
                className={`tac-preset-btn ${activePreset === 'burst' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('burst')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                </svg>
                <span>Cloudburst</span>
              </button>

              <button
                type="button"
                className={`tac-preset-btn ${activePreset === 'thunder' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('thunder')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <span>Thunderstorm</span>
              </button>

              <button
                type="button"
                className={`tac-preset-btn ${activePreset === 'rainfall' ? 'active' : ''}`}
                onClick={() => handleSelectPreset('rainfall')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="4" y="14" width="3" height="6" rx="1" />
                  <rect x="10.5" y="9" width="3" height="11" rx="1" />
                  <rect x="17" y="4" width="3" height="16" rx="1" />
                </svg>
                <span>Rainfall Intensity</span>
              </button>
            </div>
          </div>

          {/* Live Data Feed */}
          <div className="tac-card tac-feed-card">
            <div className="tac-feed-header">
              <span className="tac-feed-pulse-dot" />
              <span>Live Data Feed</span>
            </div>
            <div className="tac-feed-list">
              <div className="tac-feed-row">
                <span className="tac-feed-source">INSAT-3D/3DR</span>
                <span className="tac-feed-time">2 min ago</span>
              </div>
              <div className="tac-feed-row">
                <span className="tac-feed-source">IMDAA Reanalysis</span>
                <span className="tac-feed-time">6 min ago</span>
              </div>
              <div className="tac-feed-row">
                <span className="tac-feed-source">CartoDEM (Terrain)</span>
                <span className="tac-feed-time">12 min ago</span>
              </div>
              <div className="tac-feed-row">
                <span className="tac-feed-source">IMD Observations</span>
                <span className="tac-feed-time">1 min ago</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ==================== CENTER COLUMN (MAP & TIMELINE) ==================== */}
        <main className="tac-center-col">
          <div className="tac-map-wrapper">
            {/* Top Floating Time Step Pills & Live Clock */}
            <div className="tac-map-top-bar">
              <div className="tac-time-pills">
                {timeSteps.map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`tac-time-pill-btn ${selectedStep === step ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedStep(step);
                      setIsPlaying(false);
                    }}
                  >
                    {step}
                  </button>
                ))}
              </div>

              <div className="tac-live-badge-wrap">
                <span>08 Sep 2026 11:52 PM IST</span>
                <div className="tac-live-text-dot">
                  <span className="tac-live-dot" />
                  <span>Live</span>
                </div>
              </div>
            </div>

            {/* Left Floating Map Controls */}
            <div className="tac-map-controls-bar">
              <button
                type="button"
                className="tac-map-tool-btn"
                title="Zoom In"
                onClick={() => {
                  const map = window._tacLeafletMap;
                  if (map) map.zoomIn();
                }}
              >
                +
              </button>
              <button
                type="button"
                className="tac-map-tool-btn"
                title="Zoom Out"
                onClick={() => {
                  const map = window._tacLeafletMap;
                  if (map) map.zoomOut();
                }}
              >
                −
              </button>
              <button
                type="button"
                className="tac-map-tool-btn"
                title="Recenter on Chamoli"
                onClick={() => {
                  const map = window._tacLeafletMap;
                  if (map) map.flyTo(chamoliCenter, 10, { duration: 1 });
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="7" />
                  <line x1="12" y1="1" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="1" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="23" y2="12" />
                </svg>
              </button>
              <button
                type="button"
                className="tac-map-tool-btn"
                title="Toggle Base Layer"
                onClick={() => {
                  setLayers(prev => ({ ...prev, terrain: !prev.terrain }));
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 2 7 12 12 22 7 12 2" />
                  <polyline points="2 17 12 22 22 17" />
                  <polyline points="2 12 12 17 22 12" />
                </svg>
              </button>
              <button
                type="button"
                className="tac-map-tool-btn"
                title="Tactical Measurement Tool"
                onClick={() => {
                  if (showToast) showToast('Distance tool activated: Click any two points along Alaknanda river.');
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.5L21.174 6.812z" />
                </svg>
              </button>
            </div>

            {/* Precipitation Intensity Scale Bar (Bottom Left) */}
            <div className="tac-map-intensity-legend">
              <div className="tac-legend-title">Precipitation Intensity (mm/hr)</div>
              <div className="tac-legend-ramp" />
              <div className="tac-legend-ticks">
                <span>0</span>
                <span>1</span>
                <span>5</span>
                <span>10</span>
                <span>20</span>
                <span>50</span>
                <span>100</span>
              </div>
            </div>

            {/* Map Scale Indicator (Bottom Right) */}
            <div className="tac-map-scale-bar">
              <div className="tac-scale-lines" />
              <div className="tac-scale-ticks">
                <span>0</span>
                <span>10</span>
                <span>25</span>
                <span>50 km</span>
              </div>
            </div>

            {/* Leaflet Interactive Satellite Map */}
            <MapContainer
              center={chamoliCenter}
              zoom={10}
              className="tac-leaflet-container"
              style={{ width: '100%', height: '100%', background: '#020617' }}
              zoomControl={false}
              whenCreated={(mapInstance) => {
                window._tacLeafletMap = mapInstance;
              }}
            >
              <MapController center={chamoliCenter} zoom={10} />

              {/* Satellite Base Layer */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                attribution="&copy; Esri, Maxar, Earthstar Geographics"
                maxZoom={17}
              />

              {/* Reference Boundaries and Labels */}
              <TileLayer
                url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                opacity={0.7}
                maxZoom={17}
              />

              {/* District / State boundary lines */}
              {layers.boundaries && (
                <Polyline
                  positions={[
                    [30.90, 79.10], [30.70, 79.80], [30.30, 80.20], [29.90, 79.90], [30.00, 79.10], [30.90, 79.10]
                  ]}
                  pathOptions={{ color: '#38bdf8', weight: 1.5, dashArray: '4 4', opacity: 0.8 }}
                />
              )}

              {/* Rivers & Water Bodies */}
              {layers.rivers && (
                <>
                  <Polyline
                    positions={alaknandaRiver}
                    pathOptions={{ color: '#38bdf8', weight: 3.5, opacity: 0.85 }}
                  />
                  <Polyline
                    positions={tributaryMandakini}
                    pathOptions={{ color: '#38bdf8', weight: 2.2, opacity: 0.75 }}
                  />
                  <Polyline
                    positions={tributaryPindar}
                    pathOptions={{ color: '#38bdf8', weight: 2.2, opacity: 0.75 }}
                  />
                </>
              )}

              {/* Live Precipitation (Observed) - Multi-Band High-Resolution Doppler Radar Heatmap */}
              {layers.precip && (
                <>
                  {/* Outer light blue/cyan halo */}
                  <Polygon
                    positions={radarOuterHalo}
                    pathOptions={{
                      fillColor: '#0284c7',
                      fillOpacity: 0.38,
                      stroke: false,
                    }}
                  />
                  {/* Green convective band */}
                  <Polygon
                    positions={radarGreenBand}
                    pathOptions={{
                      fillColor: '#10b981',
                      fillOpacity: 0.52,
                      stroke: false,
                    }}
                  />
                  {/* Yellow moderate band */}
                  <Polygon
                    positions={radarYellowBand}
                    pathOptions={{
                      fillColor: '#eab308',
                      fillOpacity: 0.65,
                      stroke: false,
                    }}
                  />
                  {/* Orange heavy band */}
                  <Polygon
                    positions={radarOrangeBand}
                    pathOptions={{
                      fillColor: '#f97316',
                      fillOpacity: 0.75,
                      stroke: false,
                    }}
                  />
                  {/* Core red plume */}
                  <Polygon
                    positions={radarCorePlume}
                    pathOptions={{
                      fillColor: '#ef4444',
                      fillOpacity: 0.85,
                      stroke: false,
                    }}
                  />
                  {/* Extreme deep magenta/crimson peak core */}
                  <Polygon
                    positions={radarExtremeCore}
                    pathOptions={{
                      fillColor: '#b91c1c',
                      fillOpacity: 0.95,
                      stroke: false,
                    }}
                  />
                </>
              )}

              {/* VAYUNET Hazard (Predicted) Polygons */}
              {layers.hazard && (
                <Polygon
                  positions={[
                    [30.49, 79.31], [30.43, 79.46], [30.31, 79.40], [30.27, 79.28], [30.36, 79.22]
                  ]}
                  pathOptions={{
                    fillColor: '#b91c1c',
                    fillOpacity: 0.45,
                    color: '#ef4444',
                    weight: 2,
                    dashArray: '5 3',
                  }}
                />
              )}

              {/* Downstream flow vectors / arrows along Alaknanda River */}
              {flowArrowCoords.map((coord, i) => (
                <Marker
                  key={`flow-arrow-${i}`}
                  position={coord}
                  icon={createHtmlIcon(`
                    <div style="transform: rotate(135deg); color: #ffffff; font-size: 14px; font-weight: 900; filter: drop-shadow(0 0 3px #000);">
                      ➔
                    </div>
                  `, [16, 16], [8, 8])}
                />
              ))}

              {/* Downstream Flow Label Card */}
              <Marker
                position={[30.31, 79.38]}
                icon={createHtmlIcon(`
                  <div class="tac-flow-label-card">
                    Likely downstream flow<br/><span style="opacity:0.85; font-size: 8.5px;">(along Alaknanda River)</span>
                  </div>
                `, [160, 36], [10, 18])}
              />

              {/* Chamoli Pin with Highlight & Threat Callout Card */}
              <Circle
                center={chamoliCenter}
                radius={2400}
                pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.35, weight: 2 }}
              />
              <Marker
                position={chamoliCenter}
                icon={createHtmlIcon(`
                  <div style="width: 14px; height: 14px; background: #ffffff; border: 3px solid #ef4444; border-radius: 50%; box-shadow: 0 0 10px #ef4444;"></div>
                `, [14, 14], [7, 7])}
              />

              <Marker
                position={[30.43, 79.38]}
                icon={createHtmlIcon(`
                  <div class="tac-chamoli-callout-card">
                    <div class="tac-callout-header">
                      <span class="tac-callout-city">Chamoli</span>
                      <span class="tac-callout-badge">High Risk</span>
                    </div>
                    <div class="tac-callout-eta">ETA 1 h 45 m</div>
                  </div>
                `, [130, 48], [15, 24])}
              />

              {/* Surrounding Geographic Settlement & Mountain Markers */}
              {tacticalPoints.map((pt) => (
                <Marker
                  key={pt.name}
                  position={pt.coords}
                  icon={createHtmlIcon(`
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <div style="width: 5px; height: 5px; background: ${pt.type === 'peak' ? '#f59e0b' : '#ffffff'}; border-radius: 50%; box-shadow: 0 0 4px #000;"></div>
                      <span class="${pt.type === 'peak' ? 'tac-peak-label' : 'tac-town-label'}">${pt.name}</span>
                    </div>
                  `, [120, 20], [2, 10])}
                />
              ))}

              {/* State & Country Watermarks */}
              <Marker
                position={[30.22, 78.80]}
                icon={createHtmlIcon(`
                  <div style="font-size: 13px; font-weight: 800; color: rgba(255, 255, 255, 0.45); letter-spacing: 2px; text-shadow: 0 0 6px #000;">
                    UTTARAKHAND
                  </div>
                `, [140, 20], [0, 0])}
              />

              <Marker
                position={[30.28, 80.12]}
                icon={createHtmlIcon(`
                  <div style="font-size: 14px; font-weight: 800; color: rgba(255, 255, 255, 0.4); letter-spacing: 3px; text-shadow: 0 0 6px #000;">
                    INDIA
                  </div>
                `, [100, 20], [0, 0])}
              />
            </MapContainer>
          </div>

          {/* Forecast Timeline Dock (Directly Below Map) */}
          <div className="tac-timeline-dock">
            <div className="tac-dock-header">Forecast Timeline (Chamoli)</div>
            <div className="tac-dock-body">
              {/* Play / Pause Toggle Button */}
              <button
                type="button"
                className="tac-play-btn"
                onClick={() => setIsPlaying(v => !v)}
                title={isPlaying ? 'Pause forecast timeline' : 'Play 6h forecast simulation'}
              >
                {isPlaying ? (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" />
                    <rect x="14" y="4" width="4" height="16" />
                  </svg>
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="6 4 20 12 6 20 6 4" />
                  </svg>
                )}
              </button>

              {/* 6-Filmstrip Thumbnails */}
              <div className="tac-filmstrip">
                {timeSteps.map((step) => {
                  const isActive = selectedStep === step;
                  return (
                    <div
                      key={step}
                      className={`tac-thumb-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedStep(step);
                        setIsPlaying(false);
                      }}
                    >
                      <div className="tac-thumb-box">
                        {/* Realistic miniature canvas preview of radar convective signature */}
                        <svg className="tac-thumb-radar" viewBox="0 0 60 40">
                          <rect width="60" height="40" fill="#040d1a" />
                          <circle cx="30" cy="20" r={step === 'Now' ? 8 : step === '+1h' ? 14 : step === '+2h' ? 18 : step === '+3h' ? 15 : 11} fill="#0284c7" opacity="0.6" />
                          <circle cx="30" cy="20" r={step === 'Now' ? 5 : step === '+1h' ? 9 : step === '+2h' ? 12 : step === '+3h' ? 9 : 6} fill="#eab308" opacity="0.75" />
                          <circle cx="30" cy="20" r={step === 'Now' ? 2 : step === '+1h' ? 5 : step === '+2h' ? 7 : step === '+3h' ? 5 : 3} fill="#ef4444" opacity="0.9" />
                        </svg>
                      </div>
                      <span className="tac-thumb-label">{step}</span>
                    </div>
                  );
                })}
              </div>

              {/* Right Summary Info Box */}
              <div className="tac-dock-info-box">
                <div className="tac-dock-info-title-row">
                  <span className="tac-dock-forecast-label">{selectedStep} Forecast</span>
                  {selectedStep === '+2h' && <span className="tac-dock-peak-badge">Peak Risk</span>}
                </div>
                <div className="tac-dock-desc">
                  {selectedStep === '+2h'
                    ? 'Heavy precipitation continues over Chamoli with high probability of flash floods in downstream areas.'
                    : selectedStep === 'Now'
                    ? 'Initial convective cloudburst formation detected over Alaknanda headwaters.'
                    : 'Precipitation core gradually attenuating as synoptic flow moves eastward towards Pithoragarh.'}
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* ==================== RIGHT COLUMN (THREATS & ACTIONS) ==================== */}
        <aside className="tac-right-col">
          {/* Crimson HIGHEST THREAT Card */}
          <div className="tac-threat-card">
            <div className="tac-threat-header">
              <div className="tac-threat-tag">
                <span style={{ color: '#ef4444', fontSize: '12px' }}>🔥</span>
                <span>HIGHEST THREAT</span>
              </div>
              <span className="tac-threat-forecast-pill">Forecast: <strong style={{ color: '#ef4444' }}>+1h 45m</strong></span>
            </div>

            <div className="tac-threat-main">
              <div className="tac-threat-icon-box">
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div className="tac-threat-titles">
                <span className="tac-threat-headline">FLASH FLOOD</span>
                <span className="tac-threat-subheadline">HIGH RISK</span>
                <span className="tac-threat-place">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  Chamoli, Uttarakhand
                </span>
              </div>
            </div>

            <div className="tac-threat-narrative">
              Intense rainfall may cause sudden rises in rivers and flash flooding in downstream areas.
            </div>

            {/* 3 Metrics Chips */}
            <div className="tac-threat-chips-grid">
              <div className="tac-chip-box">
                <span className="tac-chip-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                </span>
                <span className="tac-chip-val">124 mm</span>
                <span className="tac-chip-label">Est. rainfall (next 2h)</span>
              </div>

              <div className="tac-chip-box">
                <span className="tac-chip-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <span className="tac-chip-val">1 h 45 m</span>
                <span className="tac-chip-label">Estimated arrival</span>
              </div>

              <div className="tac-chip-box">
                <span className="tac-chip-icon">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="4" y="14" width="3" height="6" rx="1" />
                    <rect x="10.5" y="9" width="3" height="11" rx="1" />
                    <rect x="17" y="4" width="3" height="16" rx="1" />
                  </svg>
                </span>
                <span className="tac-chip-val">82%</span>
                <span className="tac-chip-label">Model confidence</span>
              </div>
            </div>

            {/* Dispatch Button */}
            <button
              type="button"
              className="tac-dispatch-cap-btn"
              onClick={handleDispatch}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="2" />
                <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
              </svg>
              <span>Dispatch CAP Alert →</span>
            </button>
          </div>

          {/* Other Hazards (Next 6 Hours) */}
          <div className="tac-card tac-other-hazards-card">
            <div className="tac-card-header-row">
              <span className="tac-section-title" style={{ margin: 0 }}>Other Hazards (Next 6 Hours)</span>
              <span className="tac-view-all-link" onClick={() => showToast && showToast('Viewing full hazard matrix')}>View All →</span>
            </div>

            {/* Cloudburst */}
            <div className="tac-hazard-item-row">
              <div className="tac-hazard-item-top">
                <div className="tac-hazard-name-group">
                  <span style={{ color: '#38bdf8' }}>🌧️</span>
                  <span>Cloudburst</span>
                </div>
                <span className="tac-hazard-eta">ETA 2 h 30 m</span>
              </div>
              <div className="tac-hazard-bar-wrap">
                <div className="tac-hazard-bar-track">
                  <div className="tac-hazard-bar-fill" style={{ width: '48%', background: '#f97316' }} />
                </div>
                <span className="tac-hazard-pct">48%</span>
              </div>
            </div>

            {/* Severe Thunderstorm */}
            <div className="tac-hazard-item-row">
              <div className="tac-hazard-item-top">
                <div className="tac-hazard-name-group">
                  <span style={{ color: '#eab308' }}>⚡</span>
                  <span>Severe Thunderstorm</span>
                </div>
                <span className="tac-hazard-eta">ETA 3 h 10 m</span>
              </div>
              <div className="tac-hazard-bar-wrap">
                <div className="tac-hazard-bar-track">
                  <div className="tac-hazard-bar-fill" style={{ width: '30%', background: '#eab308' }} />
                </div>
                <span className="tac-hazard-pct">30%</span>
              </div>
            </div>

            {/* Heavy Rainfall */}
            <div className="tac-hazard-item-row">
              <div className="tac-hazard-item-top">
                <div className="tac-hazard-name-group">
                  <span style={{ color: '#06b6d4' }}>🌧️</span>
                  <span>Heavy Rainfall</span>
                </div>
                <span className="tac-hazard-eta">ETA 4 h 20 m</span>
              </div>
              <div className="tac-hazard-bar-wrap">
                <div className="tac-hazard-bar-track">
                  <div className="tac-hazard-bar-fill" style={{ width: '20%', background: '#2563eb' }} />
                </div>
                <span className="tac-hazard-pct">20%</span>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="tac-card tac-actions-card">
            <div className="tac-section-title">Recommended Actions</div>
            <div className="tac-actions-list">
              <div className="tac-action-item">
                <div className="tac-action-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <span className="tac-action-text">Move away from riverbeds and low-lying areas</span>
              </div>

              <div className="tac-action-item">
                <div className="tac-action-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="7" r="4" />
                    <path d="M5.5 21v-4a6.5 6.5 0 0 1 13 0v4" />
                  </svg>
                </div>
                <span className="tac-action-text">Avoid unnecessary travel</span>
              </div>

              <div className="tac-action-item">
                <div className="tac-action-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                </div>
                <span className="tac-action-text">Follow official evacuation instructions</span>
              </div>

              <div className="tac-action-item">
                <div className="tac-action-badge">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="2" />
                    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49" />
                  </svg>
                </div>
                <span className="tac-action-text">Stay updated through official channels</span>
              </div>
            </div>
          </div>
        </aside>

        {/* ==================== BOTTOM ROW PANELS ==================== */}
        <div className="tac-bottom-row">
          {/* Card 1: Key Metrics (Current Region) */}
          <div className="tac-card tac-metrics-card">
            <div className="tac-section-title" style={{ margin: 0 }}>Key Metrics (Current Region)</div>
            <div className="tac-metrics-grid">
              {/* Rainfall */}
              <div className="tac-metric-tile">
                <div className="tac-metric-top">
                  <span style={{ color: '#38bdf8' }}>💧</span>
                  <span className="tac-metric-val">124</span>
                  <span className="tac-metric-unit">mm</span>
                </div>
                <span className="tac-metric-label">Est. Rainfall (2h)</span>
              </div>

              {/* CAPE */}
              <div className="tac-metric-tile">
                <div className="tac-metric-top">
                  <span style={{ color: '#38bdf8' }}>⚡</span>
                  <span className="tac-metric-val">1,200</span>
                  <span className="tac-metric-unit">J/kg</span>
                </div>
                <span className="tac-metric-label">CAPE</span>
              </div>

              {/* Cloud Top Temp */}
              <div className="tac-metric-tile">
                <div className="tac-metric-top">
                  <span style={{ color: '#38bdf8' }}>🌡️</span>
                  <span className="tac-metric-val">-48</span>
                  <span className="tac-metric-unit">°C</span>
                </div>
                <span className="tac-metric-label">Cloud Top Temp</span>
              </div>

              {/* Wind Shear */}
              <div className="tac-metric-tile">
                <div className="tac-metric-top">
                  <span style={{ color: '#38bdf8' }}>💨</span>
                  <span className="tac-metric-val">8</span>
                  <span className="tac-metric-unit">m/s</span>
                </div>
                <span className="tac-metric-label">Wind Shear</span>
              </div>
            </div>
          </div>

          {/* Card 2: Potentially Affected Areas */}
          <div className="tac-card tac-affected-card">
            <div className="tac-card-header-row">
              <span className="tac-section-title" style={{ margin: 0 }}>Potentially Affected Areas</span>
              <span className="tac-view-all-link" onClick={() => showToast && showToast('Listing all 14 affected administrative zones')}>View Full List →</span>
            </div>
            <div className="tac-affected-list">
              <div className="tac-affected-item">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                <span className="tac-affected-name">Chamoli</span>
                <span className="tac-affected-sev">(High)</span>
              </div>

              <div className="tac-affected-item">
                <span style={{ color: '#eab308' }}>•</span>
                <span className="tac-affected-name">Pipalkoti</span>
                <span className="tac-affected-sev">(Moderate)</span>
              </div>

              <div className="tac-affected-item">
                <span style={{ color: '#ef4444' }}>•</span>
                <span className="tac-affected-name">Joshimath</span>
                <span className="tac-affected-sev">(High)</span>
              </div>

              <div className="tac-affected-item">
                <span style={{ color: '#eab308' }}>•</span>
                <span className="tac-affected-name">Helang</span>
                <span className="tac-affected-sev">(Moderate)</span>
              </div>
            </div>
          </div>

          {/* Card 3: Recent Alerts */}
          <div className="tac-card tac-alerts-card">
            <div className="tac-card-header-row">
              <span className="tac-section-title" style={{ margin: 0 }}>Recent Alerts</span>
              <span className="tac-view-all-link" onClick={() => showToast && showToast('Opening historical alert telemetry')}>View All →</span>
            </div>
            <div className="tac-alerts-list">
              <div className="tac-alert-row">
                <span className="tac-alert-dot" style={{ background: '#ef4444' }} />
                <span className="tac-alert-time">11:52 PM</span>
                <span className="tac-alert-text">High risk zone updated (Chamoli)</span>
              </div>

              <div className="tac-alert-row">
                <span className="tac-alert-dot" style={{ background: '#eab308' }} />
                <span className="tac-alert-time">10:48 PM</span>
                <span className="tac-alert-text">New cloudburst signal detected</span>
              </div>

              <div className="tac-alert-row">
                <span className="tac-alert-dot" style={{ background: '#22c55e' }} />
                <span className="tac-alert-time">09:15 PM</span>
                <span className="tac-alert-text">Model run completed (T+6h)</span>
              </div>

              <div className="tac-alert-row">
                <span className="tac-alert-dot" style={{ background: '#38bdf8' }} />
                <span className="tac-alert-time">08:52 PM</span>
                <span className="tac-alert-text">Satellite data ingested (INSAT-3D)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
