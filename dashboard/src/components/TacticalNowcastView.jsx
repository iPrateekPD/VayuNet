import React, { useState, useEffect, useRef } from 'react';
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

// Map Controller for programmatically recentering / flying to locations
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Map Custom Right-Side Tool Controls (+, -, target recenter, fullscreen)
function MapToolControls({ onRecenter, onToggleFullscreen }) {
  const map = useMap();
  return (
    <div className="tac-clean-map-tools">
      <button
        type="button"
        className="tac-clean-map-tool-btn"
        onClick={() => map.zoomIn()}
        title="Zoom In"
      >
        +
      </button>
      <button
        type="button"
        className="tac-clean-map-tool-btn"
        onClick={() => map.zoomOut()}
        title="Zoom Out"
      >
        −
      </button>
      <button
        type="button"
        className="tac-clean-map-tool-btn"
        onClick={onRecenter}
        title="Recenter to Chamoli Incident"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
      <button
        type="button"
        className="tac-clean-map-tool-btn"
        onClick={onToggleFullscreen}
        title="Toggle Fullscreen"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
        </svg>
      </button>
    </div>
  );
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

// Helper to scale coordinates around a geographic center
function scaleCoords(coords, factor, center = [30.41, 79.32]) {
  return coords.map(([lat, lng]) => [
    Number((center[0] + (lat - center[0]) * factor).toFixed(5)),
    Number((center[1] + (lng - center[1]) * factor).toFixed(5)),
  ]);
}

const TIME_STEPS = ['Now', '+1h', '+2h', '+3h', '+4h', '+5h', '+6h'];

// Supported sector coordinates
const SECTOR_COORDS = {
  'Chamoli, Uttarakhand': [30.41, 79.32],
  'Joshimath, Uttarakhand': [30.556, 79.566],
  'Rudraprayag, Uttarakhand': [30.285, 78.981],
  'Uttarkashi, Uttarakhand': [30.726, 78.435],
  'Kangra, Himachal Pradesh': [32.099, 76.269],
  'Wayanad, Kerala': [11.685, 76.132],
  'Mumbai, Maharashtra': [19.076, 72.877],
  'Pithoragarh, Uttarakhand': [29.582, 80.218],
};

const SECTOR_OPTIONS = Object.keys(SECTOR_COORDS);

// Active Incidents Data
const INCIDENTS_DATA = [
  {
    id: 'chamoli',
    name: 'Chamoli, Uttarakhand',
    center: [30.41, 79.32],
    hazard: 'FLASH FLOOD',
    riskLevel: 'HIGH RISK',
    riskColor: '#ef4444',
    eta: '1h 45m',
    rainfall: '124 mm',
    confidence: '82%',
    area: '412 km²',
    narrative: 'Intense rainfall may cause sudden rises in rivers and flash flooding in downstream areas.',
    action: 'Move away from riverbeds and low-lying areas.',
    badge: 'HIGHEST THREAT',
  },
  {
    id: 'joshimath',
    name: 'Joshimath, Uttarakhand',
    center: [30.556, 79.566],
    hazard: 'HEAVY RAINFALL',
    riskLevel: 'MODERATE RISK',
    riskColor: '#f97316',
    eta: '2h 30m',
    rainfall: '82 mm',
    confidence: '79%',
    area: '260 km²',
    narrative: 'High moisture condensation and slope runoff approaching vulnerable transit routes.',
    action: 'Halt pilgrimage transit and avoid unstable hill slopes.',
    badge: 'ACTIVE WATCH',
  },
  {
    id: 'rudraprayag',
    name: 'Rudraprayag, Uttarakhand',
    center: [30.285, 78.981],
    hazard: 'THUNDERSTORM',
    riskLevel: 'WATCH',
    riskColor: '#eab308',
    eta: '3h 10m',
    rainfall: '45 mm',
    confidence: '71%',
    area: '185 km²',
    narrative: 'Convective cells generating localized lightning and brief torrential bursts.',
    action: 'Seek indoor shelter away from open ridges and electrical poles.',
    badge: 'ADVISORY',
  },
  {
    id: 'uttarkashi',
    name: 'Uttarkashi, Uttarakhand',
    center: [30.726, 78.435],
    hazard: 'CLOUDBURST WATCH',
    riskLevel: 'ADVISORY',
    riskColor: '#38bdf8',
    eta: '4h 15m',
    rainfall: '35 mm',
    confidence: '68%',
    area: '140 km²',
    narrative: 'Atmospheric instability index rising above Bhagirathi catchment headwaters.',
    action: 'Activate telemetry alerts and verify automated sirens.',
    badge: 'MONITORING',
  },
];

// Timestep forecast telemetry variations for Chamoli
const TIMESTEP_DATA = {
  'Now': {
    hazard: 'FLASH FLOOD',
    riskLevel: 'ACTIVE CONVECTIVE CORE',
    eta: '0m (Live)',
    rainfall: '42 mm',
    arrival: 'Now Active',
    confidence: '94%',
    area: '210 km²',
    scale: 0.78,
    action: 'Immediate evacuation of Alaknanda riverbanks.',
  },
  '+1h': {
    hazard: 'FLASH FLOOD',
    riskLevel: 'HIGH SURGE INCOMING',
    eta: '45m',
    rainfall: '88 mm',
    arrival: '45m',
    confidence: '89%',
    area: '320 km²',
    scale: 0.90,
    action: 'Clear low-lying bridges and drainage corridors.',
  },
  '+2h': {
    hazard: 'FLASH FLOOD',
    riskLevel: 'HIGH RISK',
    eta: '1h 45m',
    rainfall: '124 mm',
    arrival: '1h 45m',
    confidence: '82%',
    area: '412 km²',
    scale: 1.0,
    action: 'Move away from riverbeds and low-lying areas.',
  },
  '+3h': {
    hazard: 'FLASH FLOOD',
    riskLevel: 'PEAK RUNOFF DISCHARGE',
    eta: '2h 30m',
    rainfall: '152 mm',
    arrival: '2h 30m',
    confidence: '76%',
    area: '480 km²',
    scale: 1.22,
    action: 'Downstream dam gates throttling; alert Karnaprayag & Srinagar.',
  },
  '+4h': {
    hazard: 'FLASH FLOOD',
    riskLevel: 'RECEDING CONVECTIVE FLUX',
    eta: '3h 45m',
    rainfall: '110 mm',
    arrival: '3h 45m',
    confidence: '70%',
    area: '520 km²',
    scale: 1.15,
    action: 'Monitor secondary slope saturation and mudflow risks.',
  },
  '+5h': {
    hazard: 'FLASH FLOOD',
    riskLevel: 'MODERATE RUNOFF',
    eta: '4h 50m',
    rainfall: '65 mm',
    arrival: '4h 50m',
    confidence: '64%',
    area: '440 km²',
    scale: 0.95,
    action: 'Relief and search reconnaissance access clearance.',
  },
  '+6h': {
    hazard: 'FLASH FLOOD',
    riskLevel: 'RESIDUAL INUNDATION',
    eta: '5h 55m',
    rainfall: '35 mm',
    arrival: '5h 55m',
    confidence: '58%',
    area: '310 km²',
    scale: 0.72,
    action: 'Assess infrastructure integrity along NH-7 corridor.',
  },
};

export default function TacticalNowcastView({ onDispatchAlert, showToast, onNavigateTab }) {
  const [selectedStep, setSelectedStep] = useState('+2h');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState('Chamoli, Uttarakhand');
  const [activeRailItem, setActiveRailItem] = useState('map'); // 'map' | 'layers' | 'forecast' | 'rivers' | 'incidents' | 'bookmarks'
  const [activePanel, setActivePanel] = useState(null); // 'layers' | 'rivers' | 'incidents' | 'bookmarks' | 'telemetry' | null
  const [basemap, setBasemap] = useState('satellite'); // 'satellite' | 'terrain' | 'hybrid'
  const [selectedIncident, setSelectedIncident] = useState(INCIDENTS_DATA[0]);
  const [isTimelineFocused, setIsTimelineFocused] = useState(false);
  const [selectedTelemetrySource, setSelectedTelemetrySource] = useState(null);
  const [newBookmarkText, setNewBookmarkText] = useState('');
  const mapCardRef = useRef(null);
  const timelineCardRef = useRef(null);

  // Bookmarks with localStorage persistence
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('vayunet_saved_bookmarks');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn(e);
    }
    return [
      'Chamoli, Uttarakhand',
      'Joshimath, Uttarakhand',
      'Wayanad, Kerala',
      'Mumbai, Maharashtra',
      'Kangra, Himachal Pradesh',
    ];
  });

  // Layer switches (Interactive Map Layers)
  const [layers, setLayers] = useState({
    precip: true,
    satellite: true,
    terrain: false,
    radar: false,
    rivers: true,
    wind: false,
    affectedArea: false,
  });

  // Coordinates for Chamoli, Uttarakhand
  const chamoliCenter = [30.41, 79.32];
  const [currentCenter, setCurrentCenter] = useState(chamoliCenter);
  const [currentZoom, setCurrentZoom] = useState(9);

  // Persist bookmarks
  useEffect(() => {
    try {
      localStorage.setItem('vayunet_saved_bookmarks', JSON.stringify(bookmarks));
    } catch (e) {
      console.warn(e);
    }
  }, [bookmarks]);

  // Simulation Playback Loop (Now → +6h)
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedStep((prev) => {
          const idx = TIME_STEPS.indexOf(prev);
          const nextIdx = (idx + 1) % TIME_STEPS.length;
          return TIME_STEPS[nextIdx];
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Handle Layer Toggle
  const handleToggleLayer = (key) => {
    setLayers((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      // If satellite or terrain is toggled, synchronize basemap
      if (key === 'satellite' && next.satellite) {
        setBasemap('satellite');
        next.terrain = false;
      } else if (key === 'terrain' && next.terrain) {
        setBasemap('terrain');
        next.satellite = false;
      }
      return next;
    });
    if (showToast) showToast(`Layer "${key.toUpperCase()}" ${!layers[key] ? 'Enabled' : 'Disabled'}`);
  };

  // Handle Play/Pause toggle
  const handleTogglePlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      if (showToast) showToast(next ? 'Forecast simulation playback started' : 'Forecast simulation paused');
      return next;
    });
  };

  // 1. Sidebar MAP Button (WHERE): Return to default operational map, close open panels, keep location & forecast time
  const handleRailMapClick = () => {
    setActiveRailItem('map');
    setActivePanel(null);
    setLayers((prev) => ({ ...prev, rivers: false }));
    if (showToast) showToast('Operational map view active');
  };

  // 2. Sidebar LAYERS Button (WHAT): Toggle Map Layers floating drawer
  const handleRailLayersClick = () => {
    if (activeRailItem === 'layers' && activePanel === 'layers') {
      setActivePanel(null);
      setActiveRailItem('map');
    } else {
      setActiveRailItem('layers');
      setActivePanel('layers');
    }
  };

  // 3. Sidebar FORECAST Button (WHEN): Direct Play/Pause simulation toggle
  const handleRailForecastClick = () => {
    setActivePanel(null);
    handleTogglePlay();
  };

  // 4. Sidebar RIVERS Button (WHERE WATER GOES): Toggle rivers and open river risk panel
  const handleRailRiversClick = () => {
    if (activeRailItem === 'rivers') {
      setActiveRailItem('map');
      setActivePanel(null);
      setLayers((prev) => ({ ...prev, rivers: false }));
      if (showToast) showToast('Rivers visualization turned off');
    } else {
      setActiveRailItem('rivers');
      setLayers((prev) => ({ ...prev, rivers: true }));
      setActivePanel('rivers');
      if (showToast) showToast('Rivers layer & downstream flow enabled');
    }
  };

  // Select incident from drawer or threat list
  const handleSelectIncident = (inc) => {
    setSelectedIncident(inc);
    setSelectedSector(inc.name);
    setCurrentCenter([...inc.center]);
    setCurrentZoom(9.5);
    if (showToast) showToast(`Centered on ${inc.name} (${inc.hazard})`);
  };

  // Select bookmark location
  const handleSelectBookmark = (loc) => {
    setSelectedSector(loc);
    if (SECTOR_COORDS[loc]) {
      setCurrentCenter([...SECTOR_COORDS[loc]]);
      setCurrentZoom(9.5);
      if (showToast) showToast(`Navigated to saved bookmark: ${loc}`);
    } else {
      if (showToast) showToast(`Selected bookmark: ${loc}`);
    }
  };

  // Add new bookmark
  const handleAddBookmark = (e) => {
    e?.preventDefault();
    const clean = newBookmarkText.trim() || selectedSector;
    if (clean && !bookmarks.includes(clean)) {
      setBookmarks((prev) => [clean, ...prev]);
      setNewBookmarkText('');
      if (showToast) showToast(`Saved location: ${clean}`);
    }
  };

  // Remove bookmark
  const handleRemoveBookmark = (item, e) => {
    e.stopPropagation();
    setBookmarks((prev) => prev.filter((b) => b !== item));
    if (showToast) showToast(`Removed bookmark: ${item}`);
  };

  // Recenter map handler
  const handleRecenter = () => {
    setCurrentCenter([...chamoliCenter]);
    setCurrentZoom(9);
    if (showToast) showToast('Recentered to Chamoli Incident Core');
  };

  // Toggle fullscreen
  const handleToggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else if (mapCardRef.current) {
      mapCardRef.current.requestFullscreen();
    }
  };

  // Dispatch alert action
  const handleDispatch = () => {
    if (onNavigateTab) {
      onNavigateTab('alerts');
    } else if (onDispatchAlert) {
      onDispatchAlert();
    } else if (showToast) {
      showToast('CAP Alert dispatched to NDMA SACHET gateway for Chamoli Sector');
    }
  };

  // Multi-band Doppler radar convective plume base contours (Chamoli - Alaknanda Valley)
  const baseRadarOuter = [
    [30.82, 79.15], [30.86, 79.35], [30.80, 79.58], [30.68, 79.72],
    [30.55, 79.88], [30.40, 80.05], [30.22, 80.08], [30.08, 79.92],
    [30.02, 79.70], [30.06, 79.45], [30.15, 79.22], [30.28, 79.08],
    [30.44, 78.96], [30.60, 78.98], [30.74, 79.05]
  ];

  const baseRadarGreen = [
    [30.74, 79.22], [30.76, 79.42], [30.68, 79.62], [30.52, 79.78],
    [30.36, 79.92], [30.20, 79.88], [30.12, 79.68], [30.15, 79.45],
    [30.24, 79.28], [30.38, 79.14], [30.55, 79.12], [30.66, 79.16]
  ];

  const baseRadarYellow = [
    [30.66, 79.28], [30.68, 79.45], [30.58, 79.62], [30.45, 79.72],
    [30.32, 79.78], [30.22, 79.65], [30.20, 79.48], [30.28, 79.32],
    [30.42, 79.22], [30.56, 79.22]
  ];

  const baseRadarOrange = [
    [30.58, 79.34], [30.58, 79.48], [30.48, 79.58], [30.38, 79.64],
    [30.28, 79.58], [30.26, 79.44], [30.32, 79.32], [30.44, 79.28],
    [30.52, 79.30]
  ];

  const baseRadarCore = [
    [30.52, 79.36], [30.50, 79.45], [30.42, 79.50], [30.34, 79.48],
    [30.30, 79.40], [30.32, 79.34], [30.40, 79.30], [30.48, 79.32]
  ];

  const baseRadarExtreme = [
    [30.46, 79.36], [30.44, 79.42], [30.38, 79.42], [30.34, 79.36],
    [30.36, 79.32], [30.42, 79.32]
  ];

  // Dynamic scaling based on current forecast timestep
  const currentStepData = TIMESTEP_DATA[selectedStep] || TIMESTEP_DATA['+2h'];
  const stepScale = currentStepData.scale || 1.0;

  const radarOuterHalo = scaleCoords(baseRadarOuter, stepScale);
  const radarGreenBand = scaleCoords(baseRadarGreen, stepScale);
  const radarYellowBand = scaleCoords(baseRadarYellow, stepScale);
  const radarOrangeBand = scaleCoords(baseRadarOrange, stepScale);
  const radarCorePlume = scaleCoords(baseRadarCore, stepScale);
  const radarExtremeCore = scaleCoords(baseRadarExtreme, stepScale);

  // Hydrological River Network (Alaknanda River)
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
    [30.285, 78.981]
  ];

  const tributaryPindar = [
    [30.060, 79.500],
    [30.150, 79.350],
    [30.258, 79.217]
  ];

  // Affected Catchment Boundary Polygon
  const catchmentBoundary = [
    [30.82, 79.10],
    [30.88, 79.52],
    [30.64, 79.80],
    [30.38, 79.85],
    [30.15, 79.60],
    [30.18, 79.15],
    [30.42, 78.92],
  ];

  // Wind streamline vectors across valley
  const windVectors = [
    [[30.55, 79.05], [30.48, 79.25], [30.42, 79.45]],
    [[30.40, 79.00], [30.35, 79.22], [30.30, 79.48]],
    [[30.68, 79.20], [30.62, 79.40], [30.55, 79.62]],
  ];

  return (
    <div className="tac-app-shell">
      {/* ================= OPERATIONAL BODY (Stops before the full-width footer) ================= */}
      <div className="tac-operational-body">
        {/* ================= 1. DEDICATED LEFT VERTICAL RAIL (EXACTLY 4 MAP CONTROLS) ================= */}
        <aside className="tac-left-rail">
        <div className="tac-rail-tools">
          {/* 1. MAP (WHERE) */}
          <button
            type="button"
            className={`tac-rail-btn ${activeRailItem === 'map' ? 'active' : ''}`}
            onClick={handleRailMapClick}
            title="Map (WHERE) - Return to default operational map"
          >
            <div className="tac-rail-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
            </div>
            <span className="tac-rail-label">Map</span>
          </button>

          {/* 2. LAYERS (WHAT) */}
          <button
            type="button"
            className={`tac-rail-btn ${activeRailItem === 'layers' ? 'active' : ''}`}
            onClick={handleRailLayersClick}
            title="Layers (WHAT) - Control which map information is visible"
          >
            <div className="tac-rail-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <span className="tac-rail-label">Layers</span>
          </button>

          {/* 3. FORECAST */}
          <button
            type="button"
            className={`tac-rail-btn ${isPlaying ? 'active' : ''}`}
            onClick={handleRailForecastClick}
            title={isPlaying ? 'Pause Forecast Simulation' : 'Play 6-Hour Forecast Simulation'}
          >
            <div className="tac-rail-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                <line x1="11" y1="19" x2="10" y2="23" strokeWidth="2" />
                <line x1="15" y1="19" x2="14" y2="23" strokeWidth="2" />
              </svg>
            </div>
            <span className="tac-rail-label">{isPlaying ? 'Pause' : 'Forecast'}</span>
          </button>

          {/* 4. RIVERS */}
          <button
            type="button"
            className={`tac-rail-btn ${activeRailItem === 'rivers' ? 'active' : ''}`}
            onClick={handleRailRiversClick}
            title="Rivers (WHERE WATER GOES) - Show river and downstream water-flow"
          >
            <div className="tac-rail-icon-wrap">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              </svg>
            </div>
            <span className="tac-rail-label">Rivers</span>
          </button>
        </div>
      </aside>

      {/* ================= 2. MAIN DASHBOARD CONTENT ================= */}
      <div className="tac-main-dashboard">
        {/* ================= MAIN 2-COLUMN OPERATIONAL GRID ================= */}
        <div className="tac-clean-grid">
          {/* LEFT COLUMN: MAP CARD + 2 OPERATIONAL CARDS */}
          <div className="tac-clean-col-left">
            {/* MAP CARD */}
            <div className="tac-clean-map-card" ref={mapCardRef}>
            
            {/* FLOATING TOP BAR */}
            <div className="tac-clean-map-topbar">
              {/* Sector / Search Dropdown */}
              <div className="tac-clean-sector-wrap">
                <button
                  type="button"
                  className="tac-clean-sector-btn"
                  onClick={() => setIsSectorOpen(!isSectorOpen)}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>{selectedSector}</span>
                  <span style={{ fontSize: '10px', marginLeft: '4px', opacity: 0.7 }}>▾</span>
                </button>

                {isSectorOpen && (
                  <div className="tac-clean-sector-menu">
                    {SECTOR_OPTIONS.map((opt) => (
                      <div
                        key={opt}
                        className={`tac-clean-sector-option ${selectedSector === opt ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedSector(opt);
                          setIsSectorOpen(false);
                          if (SECTOR_COORDS[opt]) {
                            setCurrentCenter([...SECTOR_COORDS[opt]]);
                            setCurrentZoom(9);
                          }
                          if (showToast) showToast(`Centered to ${opt}`);
                        }}
                      >
                        {opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Timesteps Filter Pills (Now | +1h | +2h | +3h | +4h | +5h | +6h) */}
              <div className="tac-clean-timesteps-group">
                {TIME_STEPS.map((step) => (
                  <button
                    key={step}
                    type="button"
                    className={`tac-clean-time-pill ${selectedStep === step ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedStep(step);
                      if (showToast) showToast(`Nowcast timestep: ${step}`);
                    }}
                  >
                    {step}
                  </button>
                ))}
              </div>

              {/* Live Timestamp Badge */}
              <div className="tac-clean-live-pill">
                <span>08 Sep 2026, 11:52 PM IST</span>
                <span className="tac-clean-live-dot" />
                <span style={{ color: '#f87171', fontWeight: 700 }}>Live</span>
              </div>
            </div>

            {/* FLOATING DRAWERS / POPOVER PANELS */}
            
            {/* 1. LAYERS PANEL */}
            {activePanel === 'layers' && (
              <div className="tac-floating-popover tac-popover-layers">
                <div className="tac-popover-header">
                  <div className="tac-popover-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
                      <polygon points="12 2 2 7 12 12 22 7 12 2" />
                      <polyline points="2 17 12 22 22 17" />
                      <polyline points="2 12 12 17 22 12" />
                    </svg>
                    <span>MAP LAYERS</span>
                  </div>
                  <button 
                    type="button" 
                    className="tac-popover-close" 
                    onClick={() => { setActivePanel(null); setActiveRailItem('map'); }}
                  >
                    ✕
                  </button>
                </div>
                <div className="tac-popover-body">
                  <label className={`tac-layer-toggle-row ${layers.precip ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={layers.precip}
                      onChange={() => handleToggleLayer('precip')}
                    />
                    <span className="tac-toggle-check" />
                    <span className="tac-toggle-text">Precipitation</span>
                  </label>

                  <label className={`tac-layer-toggle-row ${layers.satellite || basemap === 'satellite' ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={layers.satellite || basemap === 'satellite'}
                      onChange={() => handleToggleLayer('satellite')}
                    />
                    <span className="tac-toggle-check" />
                    <span className="tac-toggle-text">Satellite</span>
                  </label>

                  <label className={`tac-layer-toggle-row ${layers.radar ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={layers.radar}
                      onChange={() => handleToggleLayer('radar')}
                    />
                    <span className="tac-toggle-check" />
                    <span className="tac-toggle-text">Radar</span>
                  </label>

                  <label className={`tac-layer-toggle-row ${layers.terrain || basemap === 'terrain' ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={layers.terrain || basemap === 'terrain'}
                      onChange={() => handleToggleLayer('terrain')}
                    />
                    <span className="tac-toggle-check" />
                    <span className="tac-toggle-text">Terrain</span>
                  </label>

                  <label className={`tac-layer-toggle-row ${layers.rivers ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={layers.rivers}
                      onChange={() => handleToggleLayer('rivers')}
                    />
                    <span className="tac-toggle-check" />
                    <span className="tac-toggle-text">Rivers</span>
                  </label>

                  <label className={`tac-layer-toggle-row ${layers.wind ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={layers.wind}
                      onChange={() => handleToggleLayer('wind')}
                    />
                    <span className="tac-toggle-check" />
                    <span className="tac-toggle-text">Wind</span>
                  </label>

                  <label className={`tac-layer-toggle-row ${layers.affectedArea ? 'checked' : ''}`}>
                    <input
                      type="checkbox"
                      checked={layers.affectedArea}
                      onChange={() => handleToggleLayer('affectedArea')}
                    />
                    <span className="tac-toggle-check" />
                    <span className="tac-toggle-text">Affected Area</span>
                  </label>
                </div>
              </div>
            )}

            {/* 2. RIVERS PANEL */}
            {activePanel === 'rivers' && (
              <div className="tac-floating-popover tac-popover-rivers">
                <div className="tac-popover-header">
                  <div className="tac-popover-title">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2.2">
                      <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                      <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                      <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                    </svg>
                    <span>RIVER RISK</span>
                  </div>
                  <button 
                    type="button" 
                    className="tac-popover-close" 
                    onClick={() => { setActivePanel(null); setActiveRailItem('map'); setLayers(p => ({ ...p, rivers: false })); }}
                  >
                    ✕
                  </button>
                </div>
                <div className="tac-popover-body">
                  <div className="tac-river-spec-card">
                    <div className="tac-river-spec-name">Alaknanda River</div>
                    <div className="tac-river-spec-flow">↓ Downstream Flow</div>
                    <div className="tac-river-spec-badge">High Risk</div>
                  </div>
                  <div className="tac-river-stat-box" style={{ marginTop: '10px' }}>
                    <span className="tac-river-stat-lbl">Downstream Flow Path:</span>
                    <span className="tac-river-stat-val">Chamoli Hazard → Karnaprayag → Rudraprayag</span>
                  </div>
                  <div className="tac-river-stat-box">
                    <span className="tac-river-stat-lbl">Potentially Affected Areas:</span>
                    <span className="tac-river-stat-val" style={{ color: '#fca5a5' }}>
                      Karnaprayag Ghats, Alaknanda Riverbed Settlements
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. INCIDENTS PANEL */}
            {activePanel === 'incidents' && (
              <div className="tac-floating-popover tac-popover-incidents">
                <div className="tac-popover-header">
                  <div className="tac-popover-title">
                    <span style={{ color: '#ef4444' }}>⚠️</span>
                    <span>ACTIVE INCIDENTS ({INCIDENTS_DATA.length})</span>
                  </div>
                  <button 
                    type="button" 
                    className="tac-popover-close" 
                    onClick={() => setActivePanel(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="tac-popover-body tac-incidents-scroll">
                  {INCIDENTS_DATA.map((inc) => (
                    <div
                      key={inc.id}
                      className={`tac-incident-card-item ${selectedIncident.id === inc.id ? 'active' : ''}`}
                      onClick={() => handleSelectIncident(inc)}
                    >
                      <div className="tac-inc-item-top">
                        <div className="tac-inc-item-loc">
                          <span className="tac-inc-dot" style={{ background: inc.riskColor }} />
                          <span className="tac-inc-name">{inc.name.split(',')[0]}</span>
                        </div>
                        <span className="tac-inc-badge" style={{ color: inc.riskColor, borderColor: inc.riskColor }}>
                          {inc.riskLevel}
                        </span>
                      </div>
                      <div className="tac-inc-hazard">{inc.hazard}</div>
                      <div className="tac-inc-meta">
                        <span>ETA {inc.eta}</span>
                        <span>•</span>
                        <span>{inc.rainfall}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. BOOKMARKS PANEL */}
            {activePanel === 'bookmarks' && (
              <div className="tac-floating-popover tac-popover-bookmarks">
                <div className="tac-popover-header">
                  <div className="tac-popover-title">
                    <span style={{ color: '#eab308' }}>★</span>
                    <span>SAVED LOCATIONS</span>
                  </div>
                  <button 
                    type="button" 
                    className="tac-popover-close" 
                    onClick={() => setActivePanel(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="tac-popover-body">
                  <form onSubmit={handleAddBookmark} className="tac-bookmark-add-form">
                    <input
                      type="text"
                      className="tac-bookmark-input"
                      placeholder="Add sector (e.g. Kedarnath)..."
                      value={newBookmarkText}
                      onChange={(e) => setNewBookmarkText(e.target.value)}
                    />
                    <button type="submit" className="tac-bookmark-add-btn">
                      Add ★
                    </button>
                  </form>

                  <div className="tac-bookmarks-list">
                    {bookmarks.map((loc) => (
                      <div
                        key={loc}
                        className={`tac-bookmark-row ${selectedSector === loc ? 'active' : ''}`}
                        onClick={() => handleSelectBookmark(loc)}
                      >
                        <div className="tac-bookmark-left">
                          <span className="tac-bm-star">★</span>
                          <span className="tac-bm-name">{loc}</span>
                        </div>
                        <button
                          type="button"
                          className="tac-bm-del"
                          onClick={(e) => handleRemoveBookmark(loc, e)}
                          title="Remove bookmark"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. TELEMETRY SOURCE DETAIL MODAL */}
            {activePanel === 'telemetry' && selectedTelemetrySource && (
              <div className="tac-floating-popover tac-popover-telemetry">
                <div className="tac-popover-header">
                  <div className="tac-popover-title">
                    <span>📡</span>
                    <span>{selectedTelemetrySource.name}</span>
                  </div>
                  <button 
                    type="button" 
                    className="tac-popover-close" 
                    onClick={() => setActivePanel(null)}
                  >
                    ✕
                  </button>
                </div>
                <div className="tac-popover-body">
                  <div className="tac-telem-info-row">
                    <span className="tac-telem-lbl">Telemetry Stream</span>
                    <span className="tac-telem-val">{selectedTelemetrySource.stream}</span>
                  </div>
                  <div className="tac-telem-info-row">
                    <span className="tac-telem-lbl">Refresh Frequency</span>
                    <span className="tac-telem-val">{selectedTelemetrySource.frequency}</span>
                  </div>
                  <div className="tac-telem-info-row">
                    <span className="tac-telem-lbl">Latency</span>
                    <span className="tac-telem-val" style={{ color: '#22c55e' }}>{selectedTelemetrySource.latency}</span>
                  </div>
                  <div className="tac-telem-info-row">
                    <span className="tac-telem-lbl">Ingestion Health</span>
                    <span className="tac-telem-val" style={{ color: '#38bdf8' }}>99.98% High Precision Calibrated</span>
                  </div>
                </div>
              </div>
            )}

            {/* LEAFLET MAP */}
            <MapContainer
              center={chamoliCenter}
              zoom={9}
              scrollWheelZoom={false}
              className="tac-clean-leaflet-container"
              zoomControl={false}
              attributionControl={false}
            >
              <MapController center={currentCenter} zoom={currentZoom} />
              <MapToolControls
                onRecenter={handleRecenter}
                onToggleFullscreen={handleToggleFullscreen}
              />

              {/* Dynamic Basemap Switching (Satellite | Terrain | Hybrid) */}
              {basemap === 'satellite' && (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri World Imagery"
                  maxZoom={18}
                />
              )}

              {basemap === 'terrain' && (
                <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                  attribution="Esri Topo Map"
                  maxZoom={18}
                />
              )}

              {basemap === 'hybrid' && (
                <>
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Esri World Imagery"
                    maxZoom={18}
                  />
                  <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                    subdomains="abcd"
                    opacity={0.85}
                  />
                </>
              )}

              {/* Geographic labels (if in satellite mode) */}
              {basemap === 'satellite' && (
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  opacity={0.7}
                />
              )}

              {/* Radar Grid Layer */}
              {layers.radar && (
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  opacity={0.9}
                />
              )}

              {/* Affected Area Inundation Boundary */}
              {layers.affectedArea && (
                <Polygon
                  positions={catchmentBoundary}
                  pathOptions={{
                    color: '#f87171',
                    fillColor: '#ef4444',
                    fillOpacity: 0.18,
                    weight: 2,
                    dashArray: '6, 6',
                  }}
                />
              )}

              {/* Wind Flow Streamline Vectors */}
              {layers.wind && (
                windVectors.map((pts, idx) => (
                  <Polyline
                    key={idx}
                    positions={pts}
                    pathOptions={{
                      color: '#38bdf8',
                      weight: 2.2,
                      opacity: 0.75,
                      dashArray: '4, 6',
                    }}
                  />
                ))
              )}

              {/* Precipitation Doppler Multi-Band Radar Plume */}
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

              {/* Hydrological River Network */}
              {layers.rivers && (
                <>
                  {/* Highlighted Alaknanda Main Flow Channel */}
                  <Polyline
                    positions={alaknandaRiver}
                    pathOptions={{ color: '#00e5ff', weight: 4.2, opacity: 0.95 }}
                  />
                  <Polyline
                    positions={tributaryMandakini}
                    pathOptions={{ color: '#0284c7', weight: 2.2, opacity: 0.85 }}
                  />
                  <Polyline
                    positions={tributaryPindar}
                    pathOptions={{ color: '#0284c7', weight: 2.2, opacity: 0.85 }}
                  />

                  {/* River Flow Direction Markers (Alaknanda Gorge) */}
                  <Marker
                    position={[30.650, 79.520]}
                    icon={createHtmlIcon(`
                      <div style="color: #00e5ff; font-size: 13px; transform: rotate(210deg); text-shadow: 0 0 8px #0284c7; font-weight: bold;">➤</div>
                    `, [16, 16], [8, 8])}
                  />
                  <Marker
                    position={[30.490, 79.430]}
                    icon={createHtmlIcon(`
                      <div style="color: #00e5ff; font-size: 13px; transform: rotate(220deg); text-shadow: 0 0 8px #0284c7; font-weight: bold;">➤</div>
                    `, [16, 16], [8, 8])}
                  />
                  <Marker
                    position={[30.350, 79.260]}
                    icon={createHtmlIcon(`
                      <div style="color: #00e5ff; font-size: 13px; transform: rotate(205deg); text-shadow: 0 0 8px #0284c7; font-weight: bold;">➤</div>
                    `, [16, 16], [8, 8])}
                  />

                  {/* Downstream flow path connection from Chamoli Hazard area to River Path */}
                  <Polyline
                    positions={[
                      [30.41, 79.32],
                      [30.38, 79.33],
                      [30.32, 79.28],
                      [30.26, 79.22]
                    ]}
                    pathOptions={{ color: '#f43f5e', weight: 3, dashArray: '6, 6', opacity: 0.95 }}
                  />

                  {/* Downstream Affected Areas Callouts */}
                  <Marker
                    position={[30.26, 79.22]}
                    icon={createHtmlIcon(`
                      <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid #f59e0b; border-radius: 5px; padding: 3px 8px; font-size: 9.5px; font-weight: 700; color: #fbbf24; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.85);">
                        ⚠️ Karnaprayag (Downstream Watch)
                      </div>
                    `, [160, 22], [80, 11])}
                  />
                  <Marker
                    position={[30.285, 78.981]}
                    icon={createHtmlIcon(`
                      <div style="background: rgba(15, 23, 42, 0.95); border: 1px solid #38bdf8; border-radius: 5px; padding: 3px 8px; font-size: 9.5px; font-weight: 700; color: #38bdf8; white-space: nowrap; box-shadow: 0 4px 14px rgba(0,0,0,0.85);">
                        ℹ Rudraprayag (Downstream Advisory)
                      </div>
                    `, [160, 22], [80, 11])}
                  />
                </>
              )}

              {/* Chamoli Threat Marker & Pulsing Dot */}
              <Marker
                position={chamoliCenter}
                icon={createHtmlIcon(`
                  <div style="position: relative; display: flex; align-items: center;">
                    <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 10px #ffffff, 0 0 20px #ef4444; position: absolute; left: 0; top: 12px; z-index: 10;"></div>
                    <div style="margin-left: 20px; background: rgba(8, 14, 25, 0.94); border: 1px solid rgba(239, 68, 68, 0.6); border-radius: 6px; padding: 6px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.85); min-width: 96px;">
                      <div style="font-size: 11px; font-weight: 700; color: #ffffff;">Chamoli</div>
                      <div style="font-size: 10px; font-weight: 700; color: #ef4444;">${currentStepData.riskLevel}</div>
                      <div style="font-size: 9.5px; color: #94a3b8; font-family: monospace;">ETA ${currentStepData.eta}</div>
                    </div>
                  </div>
                `, [160, 48], [6, 18])}
              />

              {/* Downstream Flow Callout Along Alaknanda */}
              <Marker
                position={[30.27, 79.44]}
                icon={createHtmlIcon(`
                  <div style="background: rgba(8, 14, 25, 0.94); border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 5px; padding: 4px 10px; color: #f1f5f9; font-size: 10px; font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,0.75); white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                    <span>Alaknanda River</span>
                  </div>
                `, [120, 24], [60, 12])}
              />

              {/* Regional Geographic Labels */}
              <Marker
                position={[30.48, 78.75]}
                icon={createHtmlIcon(`
                  <div style="color: rgba(255, 255, 255, 0.55); font-size: 15px; font-weight: 800; letter-spacing: 3px; text-shadow: 0 2px 8px rgba(0,0,0,0.9);">
                    UTTARAKHAND
                  </div>
                `, [180, 24], [90, 12])}
              />

              <Marker
                position={[30.744, 79.493]}
                icon={createHtmlIcon(`
                  <div style="color: #ffffff; font-size: 10px; font-weight: 700; text-shadow: 0 1px 4px #000; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>
                    <span>Badrinath</span>
                  </div>
                `, [90, 18], [2, 9])}
              />

              <Marker
                position={[30.556, 79.566]}
                icon={createHtmlIcon(`
                  <div style="color: #ffffff; font-size: 10px; font-weight: 700; text-shadow: 0 1px 4px #000; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 5px; height: 5px; border-radius: 50%; background: #ffffff;"></div>
                    <span>Joshimath</span>
                  </div>
                `, [90, 18], [2, 9])}
              />

              <Marker
                position={[30.285, 78.981]}
                icon={createHtmlIcon(`
                  <div style="color: #ffffff; font-size: 10px; font-weight: 700; text-shadow: 0 1px 4px #000; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 5px; height: 5px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></div>
                    <span>Rudraprayag</span>
                  </div>
                `, [100, 18], [2, 9])}
              />

              <Marker
                position={[30.258, 79.217]}
                icon={createHtmlIcon(`
                  <div style="color: #ffffff; font-size: 9.5px; font-weight: 700; text-shadow: 0 1px 4px #000; display: flex; align-items: center; gap: 4px;">
                    <div style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></div>
                    <span>Karnaprayag</span>
                  </div>
                `, [90, 18], [2, 9])}
              />
            </MapContainer>

            {/* FLOATING PRECIPITATION INTENSITY LEGEND */}
            <div className="tac-clean-legend-box">
              <div className="tac-clean-legend-title">Precipitation Intensity (mm/hr)</div>
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

            {/* FLOATING BASEMAP SELECTOR & SCALE BAR */}
            <div className="tac-clean-map-bottom-right">
              <div className="tac-clean-basemap-pills">
                <button
                  type="button"
                  className={`tac-clean-basemap-pill-btn ${basemap === 'satellite' ? 'active' : ''}`}
                  onClick={() => {
                    setBasemap('satellite');
                    setLayers((prev) => ({ ...prev, satellite: true, terrain: false }));
                    if (showToast) showToast('Satellite Basemap Selected');
                  }}
                >
                  Satellite
                </button>

                <button
                  type="button"
                  className={`tac-clean-basemap-pill-btn ${basemap === 'terrain' ? 'active' : ''}`}
                  onClick={() => {
                    setBasemap('terrain');
                    setLayers((prev) => ({ ...prev, terrain: true, satellite: false }));
                    if (showToast) showToast('Terrain Topographic Basemap Selected');
                  }}
                >
                  Terrain
                </button>

                <button
                  type="button"
                  className={`tac-clean-basemap-pill-btn ${basemap === 'hybrid' ? 'active' : ''}`}
                  onClick={() => {
                    setBasemap('hybrid');
                    setLayers((prev) => ({ ...prev, satellite: true, terrain: false }));
                    if (showToast) showToast('Hybrid Basemap Selected');
                  }}
                >
                  Hybrid
                </button>
              </div>

              {/* Scale Bar */}
              <div className="tac-clean-scale-wrap">
                <div className="tac-clean-scale-ticks">
                  <span>0</span>
                  <span>10</span>
                  <span>20</span>
                  <span>40 km</span>
                </div>
                <div className="tac-clean-scale-bracket" />
              </div>
            </div>
          </div>
          {/* END MAP CARD */}

          {/* ================= BOTTOM ROW: 2 OPERATIONAL CARDS ================= */}
          <div className="tac-clean-bottom-row">
            {/* Card 1: Other Active Threats */}
            <div className="tac-clean-card">
              <div className="tac-clean-card-title-row">
                <span className="tac-clean-card-title">Other Active Threats (Next 6 Hours)</span>
                <button
                  type="button"
                  className="tac-clean-viewall-btn"
                  onClick={() => setActivePanel('incidents')}
                >
                  View All →
                </button>
              </div>

              <div className="tac-clean-threats-list">
                <div
                  className="tac-clean-threat-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectIncident(INCIDENTS_DATA[0])}
                  title="Select Cloudburst Threat"
                >
                  <div className="tac-clean-threat-left">
                    <span style={{ color: '#eab308', fontSize: '13px' }}>⚠️</span>
                    <span className="tac-clean-threat-name">Cloudburst</span>
                  </div>
                  <div className="tac-clean-threat-bar-wrap">
                    <div className="tac-clean-threat-bar-fill fill-cloudburst" />
                  </div>
                  <span className="tac-clean-threat-pct">48%</span>
                  <span className="tac-clean-threat-eta">ETA 2h 30m</span>
                </div>

                <div
                  className="tac-clean-threat-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectIncident(INCIDENTS_DATA[2])}
                  title="Select Thunderstorm Threat"
                >
                  <div className="tac-clean-threat-left">
                    <span style={{ color: '#38bdf8', fontSize: '13px' }}>🌧️</span>
                    <span className="tac-clean-threat-name">Thunderstorm</span>
                  </div>
                  <div className="tac-clean-threat-bar-wrap">
                    <div className="tac-clean-threat-bar-fill fill-thunderstorm" />
                  </div>
                  <span className="tac-clean-threat-pct">30%</span>
                  <span className="tac-clean-threat-eta">ETA 3h 10m</span>
                </div>

                <div
                  className="tac-clean-threat-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleSelectIncident(INCIDENTS_DATA[1])}
                  title="Select Heavy Rainfall Threat"
                >
                  <div className="tac-clean-threat-left">
                    <span style={{ color: '#0ea5e9', fontSize: '13px' }}>🌧️</span>
                    <span className="tac-clean-threat-name">Heavy Rainfall</span>
                  </div>
                  <div className="tac-clean-threat-bar-wrap">
                    <div className="tac-clean-threat-bar-fill fill-heavyrain" />
                  </div>
                  <span className="tac-clean-threat-pct">20%</span>
                  <span className="tac-clean-threat-eta">ETA 4h 20m</span>
                </div>
              </div>
            </div>

            {/* Card 2: Data Freshness */}
            <div className="tac-clean-card">
              <div className="tac-clean-card-title-row">
                <span className="tac-clean-card-title">Data Freshness</span>
                <span className="tac-clean-live-pill-sm">
                  <span className="tac-clean-live-dot" />
                  Live
                </span>
              </div>

              <div className="tac-clean-freshness-list">
                <div
                  className="tac-clean-fresh-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedTelemetrySource({
                      name: 'INSAT-3D / 3DR Geostationary Imager',
                      stream: 'Thermal Infrared (TIR-1) + Water Vapor (WV)',
                      frequency: '15 Minutes Scanning Interval',
                      latency: '2 minutes ago',
                    });
                    setActivePanel('telemetry');
                  }}
                  title="Inspect INSAT telemetry stream"
                >
                  <div className="tac-clean-fresh-left">
                    <span className="tac-clean-dot-green" />
                    <span className="tac-clean-feed-name">INSAT-3D/3DR</span>
                  </div>
                  <div className="tac-clean-feed-right">
                    <span className="tac-clean-fresh-time">2 min ago</span>
                    <span className="tac-clean-feed-chevron">›</span>
                  </div>
                </div>

                <div
                  className="tac-clean-fresh-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedTelemetrySource({
                      name: 'IMDAA High-Resolution Reanalysis',
                      stream: 'NCMRWF Unified Model Convective Variables',
                      frequency: 'Hourly Reanalysis Assimilation',
                      latency: '6 minutes ago',
                    });
                    setActivePanel('telemetry');
                  }}
                  title="Inspect IMDAA telemetry stream"
                >
                  <div className="tac-clean-fresh-left">
                    <span className="tac-clean-dot-green" />
                    <span className="tac-clean-feed-name">IMDAA Reanalysis</span>
                  </div>
                  <div className="tac-clean-feed-right">
                    <span className="tac-clean-fresh-time">6 min ago</span>
                    <span className="tac-clean-feed-chevron">›</span>
                  </div>
                </div>

                <div
                  className="tac-clean-fresh-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedTelemetrySource({
                      name: 'CartoDEM Elevation & Slope Mesh',
                      stream: 'ISRO National Remote Sensing Centre (NRSC)',
                      frequency: 'Dynamic Inundation DEM Mesh',
                      latency: '12 minutes ago',
                    });
                    setActivePanel('telemetry');
                  }}
                  title="Inspect CartoDEM mesh stream"
                >
                  <div className="tac-clean-fresh-left">
                    <span className="tac-clean-dot-green" />
                    <span className="tac-clean-feed-name">CartoDEM</span>
                  </div>
                  <div className="tac-clean-feed-right">
                    <span className="tac-clean-fresh-time">12 min ago</span>
                    <span className="tac-clean-feed-chevron">›</span>
                  </div>
                </div>

                <div
                  className="tac-clean-fresh-row"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedTelemetrySource({
                      name: 'IMD Automated Weather Stations (AWS)',
                      stream: 'Surface Pressure, Rain Gauge, Wind Vector',
                      frequency: 'Real-time telemetry pulse',
                      latency: '3 minutes ago',
                    });
                    setActivePanel('telemetry');
                  }}
                  title="Inspect IMD Observations"
                >
                  <div className="tac-clean-fresh-left">
                    <span className="tac-clean-dot-green" />
                    <span className="tac-clean-feed-name">IMD Observations</span>
                  </div>
                  <div className="tac-clean-feed-right">
                    <span className="tac-clean-fresh-time">3 min ago</span>
                    <span className="tac-clean-feed-chevron">›</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* END LEFT COLUMN */}

        {/* ================= RIGHT COLUMN: HIGHEST THREAT CARD + OPERATIONAL ACTIONS ================= */}
        <div className="tac-clean-col-right">
          <div className="tac-clean-threat-card">
            <div className="tac-clean-threat-head">
              <div className="tac-clean-flame-tag">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>{selectedIncident.badge}</span>
              </div>
              <div className="tac-clean-forecast-pill">Forecast: +{currentStepData.eta}</div>
            </div>

            {/* Warning Title with Left Alert Icon */}
            <div className="tac-clean-warn-title-group">
              <div className="tac-clean-warn-title-row">
                <div className="tac-clean-warn-icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="tac-clean-warn-text-col">
                  <div className="tac-clean-warn-main">{selectedIncident.hazard}</div>
                  <div className="tac-clean-warn-main">{currentStepData.riskLevel}</div>
                </div>
              </div>
              <div className="tac-clean-warn-loc">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{selectedIncident.name}</span>
              </div>
            </div>

            {/* Narrative */}
            <div className="tac-clean-narrative">
              {selectedIncident.narrative}
            </div>

            {/* 4 Metric Chips (2x2 Grid) */}
            <div className="tac-clean-chips-grid">
              <div className="tac-clean-chip">
                <div className="tac-clean-chip-top">
                  <span className="tac-clean-chip-icon">🌧️</span>
                  <span className="tac-clean-chip-val">{currentStepData.rainfall}</span>
                </div>
                <span className="tac-clean-chip-label">Est. rainfall ({selectedStep})</span>
              </div>

              <div className="tac-clean-chip">
                <div className="tac-clean-chip-top">
                  <span className="tac-clean-chip-icon">🕒</span>
                  <span className="tac-clean-chip-val">{currentStepData.arrival}</span>
                </div>
                <span className="tac-clean-chip-label">Estimated arrival</span>
              </div>

              <div className="tac-clean-chip">
                <div className="tac-clean-chip-top">
                  <span className="tac-clean-chip-icon">📊</span>
                  <span className="tac-clean-chip-val">{currentStepData.confidence}</span>
                </div>
                <span className="tac-clean-chip-label">Model confidence</span>
              </div>

              <div className="tac-clean-chip">
                <div className="tac-clean-chip-top">
                  <span className="tac-clean-chip-icon">🗺️</span>
                  <span className="tac-clean-chip-val">{currentStepData.area}</span>
                </div>
                <span className="tac-clean-chip-label">Affected area</span>
              </div>
            </div>

            {/* Recommended Action */}
            <div className="tac-clean-action-box">
              <div className="tac-clean-action-head">
                <span style={{ fontSize: '13px' }}>⚠️</span>
                <span>Recommended Action</span>
              </div>
              <ul className="tac-clean-action-list">
                <li>Move away from riverbeds and low-lying areas.</li>
                <li>Be prepared for possible evacuation.</li>
                <li>Follow local authority instructions.</li>
              </ul>
            </div>
          </div>

          {/* Operational Action Buttons (placed below the threat card, aligning with bottom cards) */}
          <div className="tac-clean-actions-group">
            <button
              type="button"
              className="tac-clean-investigate-btn"
              onClick={() => onNavigateTab && onNavigateTab('analysis')}
              title="Examine CTT, IWV, CAPE and atmospheric drivers in Analysis view"
            >
              <span style={{ fontSize: '14px' }}>📊</span>
              <span>Investigate Drivers (Why?) →</span>
            </button>

            <button
              type="button"
              className="tac-clean-dispatch-btn"
              onClick={handleDispatch}
              title="Open Alert & Incident Command to broadcast CAP 1.2 payload"
            >
              <span style={{ fontSize: '15px' }}>((•))</span>
              <span>Prepare &amp; Dispatch Alert (Act) →</span>
            </button>
          </div>
          </div>
        </div>
      </div>
      {/* END tac-main-dashboard */}
    </div>
    {/* END tac-operational-body */}
  </div>
  );
}
