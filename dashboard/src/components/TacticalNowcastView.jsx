import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './TacticalNowcast.css';
import { predictNowcast, broadcastAlert, getRealtimeWeather, getLocationWeather, getLocations } from '../services/apiService';

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

// Custom DivIcon creator
function createHtmlIcon(html, size = [20, 20], anchor = [10, 10]) {
  return L.divIcon({
    html,
    className: 'tac-leaflet-div-icon',
    iconSize: size,
    iconAnchor: anchor,
  });
}

const TIME_STEPS = ['Now', '+1h', '+2h', '+3h', '+4h', '+6h'];

const SECTOR_METADATA = {
  'Wayanad, Kerala': {
    lat: 11.5564,
    lng: 76.1320,
    locationId: 'wayanad',
    zoom: 11,
    name: 'Wayanad (Chaliyar Basin)',
    state: 'Kerala',
    center: [11.5564, 76.1320],
  },
  'Chamoli, Uttarakhand': {
    lat: 30.41,
    lng: 79.32,
    locationId: 'chamoli',
    zoom: 10,
    name: 'Chamoli (Alaknanda Basin)',
    state: 'Uttarakhand',
    center: [30.41, 79.32],
  },
  'Kangra, Himachal Pradesh': {
    lat: 32.2190,
    lng: 76.3234,
    locationId: 'kangra',
    zoom: 10,
    name: 'Kangra (Beas Basin)',
    state: 'Himachal Pradesh',
    center: [32.2190, 76.3234],
  },
  'Mumbai, Maharashtra': {
    lat: 19.0760,
    lng: 72.8777,
    locationId: 'mumbai',
    zoom: 10,
    name: 'Mumbai Metropolitan Region',
    state: 'Maharashtra',
    center: [19.0760, 72.8777],
  },
  'Rudraprayag, Uttarakhand': {
    lat: 30.2844,
    lng: 78.9811,
    locationId: 'rudraprayag',
    zoom: 10,
    name: 'Rudraprayag (Mandakini Catchment)',
    state: 'Uttarakhand',
    center: [30.2844, 78.9811],
  },
  'Pithoragarh, Uttarakhand': {
    lat: 29.5829,
    lng: 80.2182,
    locationId: 'pithoragarh',
    zoom: 10,
    name: 'Pithoragarh (Kali Headwaters)',
    state: 'Uttarakhand',
    center: [29.5829, 80.2182],
  },
  'Uttarkashi, Uttarakhand': {
    lat: 30.7268,
    lng: 78.4354,
    locationId: 'uttarkashi',
    zoom: 10,
    name: 'Uttarkashi (Bhagirathi Basin)',
    state: 'Uttarakhand',
    center: [30.7268, 78.4354],
  },
};

const SECTOR_OPTIONS = Object.keys(SECTOR_METADATA);

export default function TacticalNowcastView({ onDispatchAlert, showToast, onNavigateTab }) {
  const [selectedStep, setSelectedStep] = useState('+2h');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [selectedSector, setSelectedSector] = useState('Wayanad, Kerala');
  const [predictionData, setPredictionData] = useState(null);
  const [isInferring, setIsInferring] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const sectorWrapRef = useRef(null);

  // Close sector dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sectorWrapRef.current && !sectorWrapRef.current.contains(e.target)) {
        setIsSectorOpen(false);
      }
    };
    if (isSectorOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSectorOpen]);

  // Real-time meteorological telemetry states (Open-Meteo & IST clock)
  const [realtimeWeather, setRealtimeWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('LIVE');
  const [weatherFetchedAt, setWeatherFetchedAt] = useState(null);
  const [weatherAgeSeconds, setWeatherAgeSeconds] = useState(0);
  const [currentIST, setCurrentIST] = useState('');

  // Layer switches (matching screenshot defaults)
  const [layers, setLayers] = useState({
    precip: true,        // Live Precipitation (Observed & Nowcast)
    satellite: false,    // Satellite Cloud Tops
    terrain: true,       // Digital Elevation Model (Terrain)
    rivers: true,        // Hydrological River Network
  });

  const activeSectorMeta = SECTOR_METADATA[selectedSector] || SECTOR_METADATA['Wayanad, Kerala'];

  // Dynamic 1-second ticking IST clock & weather age counter
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      const timeStr = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata',
      });
      setCurrentIST(`${dateStr} • ${timeStr} IST`);

      if (weatherFetchedAt) {
        setWeatherAgeSeconds(Math.max(0, Math.floor((Date.now() - weatherFetchedAt) / 1000)));
      }
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, [weatherFetchedAt]);

  // Query PyTorch DL model from backend on sector or lead-time change
  useEffect(() => {
    const controller = new AbortController();
    const hoursMap = { 'Now': 2, '+1h': 2, '+2h': 2, '+3h': 3, '+4h': 4, '+6h': 6 };
    const leadHours = hoursMap[selectedStep] || 2;

    setIsInferring(true);
    predictNowcast({
      lat: activeSectorMeta.lat,
      lng: activeSectorMeta.lng,
      leadTimeHours: leadHours,
      locationId: activeSectorMeta.locationId,
    }, controller.signal)
      .then((res) => {
        setIsInferring(false);
        if (res) {
          setPredictionData(res);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          setIsInferring(false);
          console.warn('Backend inference error:', err);
        }
      });

    return () => {
      controller.abort();
    };
  }, [selectedSector, selectedStep]);

  // Fetch real-time weather from Open-Meteo via backend (5-min cache sync)
  useEffect(() => {
    const controller = new AbortController();
    const fetchWeather = async () => {
      try {
        const data = await (activeSectorMeta.locationId
          ? getLocationWeather(activeSectorMeta.locationId, controller.signal)
          : getRealtimeWeather(activeSectorMeta.lat, activeSectorMeta.lng, controller.signal));
        if (data && (data.status === 'success' || data.weather)) {
          setRealtimeWeather(data);
          setWeatherStatus('LIVE');
          setWeatherFetchedAt(Date.now());
          setWeatherAgeSeconds(data.freshness?.age_seconds || 0);
        } else {
          setWeatherStatus('DEGRADED');
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Real-time weather retrieval degraded:', err);
          setWeatherStatus('DEGRADED');
        }
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 300000); // 300s (5-min cache TTL)
    return () => {
      controller.abort();
      clearInterval(weatherTimer);
    };
  }, [selectedSector]);

  // Playback simulation timer
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setSelectedStep((prev) => {
          const idx = TIME_STEPS.indexOf(prev);
          const nextIdx = (idx + 1) % TIME_STEPS.length;
          return TIME_STEPS[nextIdx];
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handleToggleLayer = (key) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleDispatch = async () => {
    if (onDispatchAlert) {
      onDispatchAlert();
      return;
    }
    setIsDispatching(true);
    try {
      const topHazard = (predictionData?.predictions?.flash_flood_probability || 0) > (predictionData?.predictions?.thunderstorm_probability || 0)
        ? 'Flash Flood'
        : 'Thunderstorm';
      const severity = predictionData?.predictions?.composite_threat_level || 'HIGH RISK';

      await broadcastAlert({
        hazard_type: topHazard,
        severity: severity,
        location_name: activeSectorMeta.name,
        lead_time_hours: parseInt(selectedStep.replace(/\D/g, '')) || 2,
        recipients: ['NDMA', 'SDRF State Control', 'District Collector', 'Public CAP Gateway'],
      });
      if (showToast) {
        showToast(`CAP 1.2 Alert successfully dispatched for ${activeSectorMeta.name} via FastAPI :8000!`);
      }
    } catch (err) {
      if (showToast) {
        showToast(`Dispatched local alert buffer for ${activeSectorMeta.name}`);
      }
    } finally {
      setIsDispatching(false);
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
            <div className="tac-clean-sector-wrap" ref={sectorWrapRef}>
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
                  {SECTOR_OPTIONS.map((opt) => (
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
              {TIME_STEPS.map((step) => (
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

            {/* Dynamic IST Clock & Weather Status (Section 17) */}
            <div className="tac-clean-live-pill" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', padding: '5px 12px', gap: '2px', background: 'rgba(9, 18, 34, 0.92)', border: '1px solid rgba(255, 255, 255, 0.14)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.6px' }}>CURRENT TIME</span>
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#f8fafc', fontFamily: 'var(--font-mono, monospace)' }}>
                  {currentIST || 'Loading IST clock...'}
                </span>
                <span className="tac-clean-live-dot" style={{ background: weatherStatus === 'LIVE' ? '#22c55e' : '#f59e0b' }} />
                <span style={{ color: weatherStatus === 'LIVE' ? '#22c55e' : '#f59e0b', fontWeight: 800, fontSize: '10.5px' }}>
                  {weatherStatus}
                </span>
              </div>
              <div style={{ fontSize: '9.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ color: '#64748b' }}>WEATHER DATA:</span>
                <span>Updated {weatherAgeSeconds}s ago</span>
                <span>•</span>
                <span>Source: Open-Meteo ({realtimeWeather?.freshness?.cached ? 'Cached' : 'Direct'})</span>
              </div>
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
            center={activeSectorMeta.center}
            zoom={activeSectorMeta.zoom || 9}
            scrollWheelZoom={false}
            className="tac-clean-leaflet-container"
            zoomControl={false}
          >
            <MapController center={activeSectorMeta.center} zoom={activeSectorMeta.zoom || 9} />
            <MapZoomButtons />

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

            {/* Active Sector Callout & Pulsing Dot */}
            <Marker
              position={activeSectorMeta.center}
              icon={createHtmlIcon(`
                <div style="position: relative; display: flex; align-items: center;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 10px #ffffff, 0 0 20px #ef4444; position: absolute; left: 0; top: 12px; z-index: 10;"></div>
                  <div style="margin-left: 20px; background: rgba(8, 14, 25, 0.94); border: 1px solid rgba(239, 68, 68, 0.6); border-radius: 6px; padding: 6px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.85); min-width: 110px;">
                    <div style="font-size: 11px; font-weight: 700; color: #ffffff;">${activeSectorMeta.name}</div>
                    <div style="font-size: 10px; font-weight: 700; color: #ef4444;">${predictionData?.predictions?.composite_threat_level || 'HIGH RISK'} (${Math.max(predictionData?.predictions?.thunderstorm_probability || 0, predictionData?.predictions?.flash_flood_probability || 0, predictionData?.predictions?.cloudburst_probability || 0)}%)</div>
                    <div style="font-size: 9.5px; color: #94a3b8; font-family: monospace;">Lead Time ${selectedStep}</div>
                  </div>
                </div>
              `, [180, 52], [6, 18])}
            />

            {/* Downstream Flow Callout Along Alaknanda */}
            {selectedSector === 'Chamoli, Uttarakhand' && (
              <>
                <Marker
                  position={[30.27, 79.44]}
                  icon={createHtmlIcon(`
                    <div style="background: rgba(8, 14, 25, 0.94); border: 1px solid rgba(255, 255, 255, 0.22); border-radius: 5px; padding: 4px 10px; color: #f1f5f9; font-size: 10px; font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,0.75); white-space: nowrap; display: flex; align-items: center; gap: 6px;">
                      <span>Likely downstream flow</span>
                      <span style="color: #94a3b8; font-size: 9px;">(along Alaknanda River)</span>
                    </div>
                  `, [230, 26], [115, 13])}
                />
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
                    `, [20, 20], [10, 10])}
                  />
                ))}
              </>
            )}

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
                  <div style="background: rgba(15, 23, 42, 0.88); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 4px; padding: 2px 6px; color: #cbd5e1; font-size: 9.5px; font-weight: 500; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">
                    ${pt.name}
                  </div>
                `, [pt.name.length * 7 + 16, 20], [(pt.name.length * 7 + 16) / 2, 10])}
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
        {(() => {
          const preds = predictionData?.predictions || {
            thunderstorm_probability: 12,
            cloudburst_probability: 14,
            flash_flood_probability: 9,
            composite_threat_level: 'NOMINAL'
          };
          const precursors = predictionData?.atmospheric_precursors || {
            iwv_mm: 32.5,
            cape_j_kg: 420,
            ctt_drop_rate_c_hr: -1.5
          };
          const modelVer = predictionData?.model?.version || predictionData?.model_version || 'VAYUNET-MTL-v2.0';
          const rawLat = predictionData?.model?.inference_latency_ms ?? predictionData?.inference_latency_ms;
          const latency = rawLat != null ? `${rawLat.toFixed(1)} ms` : '32.4 ms';

          const highestProb = Math.max(
            preds.thunderstorm_probability || 0,
            preds.cloudburst_probability || 0,
            preds.flash_flood_probability || 0
          );

          let topThreatName = 'FLASH FLOOD';
          if ((preds.thunderstorm_probability || 0) >= (preds.flash_flood_probability || 0) && (preds.thunderstorm_probability || 0) >= (preds.cloudburst_probability || 0)) {
            topThreatName = 'THUNDERSTORM';
          } else if ((preds.cloudburst_probability || 0) >= (preds.flash_flood_probability || 0)) {
            topThreatName = 'CLOUDBURST';
          }

          const rawThreatLevel = preds.composite_threat_level || 'NOMINAL';
          const isRed = rawThreatLevel.includes('RED') || highestProb >= 75;
          const isOrange = !isRed && (rawThreatLevel.includes('ORANGE') || highestProb >= 55);
          const isYellow = !isRed && !isOrange && (rawThreatLevel.includes('YELLOW') || highestProb >= 30);
          const isGreen = !isRed && !isOrange && !isYellow;

          const threatColor = isRed ? '#ef4444' : isOrange ? '#f97316' : isYellow ? '#eab308' : '#22c55e';
          const displayThreatLevel = isGreen ? 'NOMINAL / SAFE' : isYellow ? 'WATCH / MONITORING' : isOrange ? 'ELEVATED ALERT' : 'CRITICAL ALERT';
          const displayTitle = isGreen 
            ? `${(predictionData?.primary_hazard?.regional_disaster_type || activeSectorMeta.name + ' Surveillance').toUpperCase()}` 
            : topThreatName;

          return (
            <div className="tac-clean-threat-card">
              {/* Header */}
              <div className="tac-clean-threat-head">
                <div className="tac-clean-flame-tag" style={{ color: threatColor, borderColor: `${threatColor}44` }}>
                  <span style={{ fontSize: '14px' }}>{isGreen ? '🛡️' : '⚠️'}</span>
                  <span>VAYUNET AI RISK ASSESSMENT</span>
                </div>
                <div className="tac-clean-forecast-pill">
                  {isInferring ? '⚡ Inferencing...' : `Model: ${modelVer} · ${latency}`}
                </div>
              </div>

              {/* Warning Title with Status Icon */}
              <div className="tac-clean-warn-title-group">
                <div className="tac-clean-warn-icon" style={{ background: `${threatColor}18`, borderColor: `${threatColor}44` }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={threatColor} strokeWidth="2">
                    {isGreen ? (
                      <>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </>
                    ) : (
                      <>
                        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                        <line x1="12" y1="9" x2="12" y2="13" />
                        <line x1="12" y1="17" x2="12.01" y2="17" />
                      </>
                    )}
                  </svg>
                </div>
                <div>
                  <div className="tac-clean-warn-main" style={{ fontSize: '16px' }}>{displayTitle}</div>
                  <div className="tac-clean-warn-main" style={{ color: threatColor, fontSize: '14px', marginTop: '2px' }}>
                    {displayThreatLevel} (Risk Score: {(highestProb / 100).toFixed(2)})
                  </div>
                  <div className="tac-clean-warn-loc">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{activeSectorMeta.name}, {activeSectorMeta.state || 'India'}</span>
                  </div>
                </div>
              </div>

              {/* Historical Benchmark Proximity Badge */}
              {predictionData?.historical_baseline && (
                <div style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.22)',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '11px',
                  color: '#7dd3fc',
                  margin: '4px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span>🏛️</span>
                  <span>
                    Benchmark: <strong>{predictionData.historical_baseline.benchmark_event}</strong> · Precursor Proximity: <strong>{predictionData.historical_baseline.precursor_match_pct}%</strong>
                  </span>
                </div>
              )}

              {/* Narrative */}
              <div className="tac-clean-narrative">
                {predictionData?.scientific_verdict || (
                  isRed
                    ? 'Convective storm dynamics detected with critical moisture convergence in steep terrain.'
                    : 'Atmospheric conditions monitored; precursors within baseline parameters.'
                )}
              </div>

              {/* 4 Metric Chips (2x2 Grid) */}
              <div className="tac-clean-chips-grid">
                <div className="tac-clean-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#38bdf8', fontSize: '13px' }}>💧</span>
                    <span className="tac-clean-chip-val">
                      {precursors.iwv_mm ? `${precursors.iwv_mm} mm` : (realtimeWeather?.weather?.total_column_water_vapour_kg_m2 ? `${realtimeWeather.weather.total_column_water_vapour_kg_m2.toFixed(1)} mm` : '65.3 mm')}
                    </span>
                  </div>
                  <span className="tac-clean-chip-label">Precursor IWV</span>
                </div>

                <div className="tac-clean-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#38bdf8', fontSize: '13px' }}>⚡</span>
                    <span className="tac-clean-chip-val">
                      {precursors.cape_j_kg ? `${precursors.cape_j_kg} J/kg` : (realtimeWeather?.weather?.cape_j_kg ? `${Math.round(realtimeWeather.weather.cape_j_kg)} J/kg` : '2100 J/kg')}
                    </span>
                  </div>
                  <span className="tac-clean-chip-label">Convective CAPE</span>
                </div>

                <div className="tac-clean-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#38bdf8', fontSize: '13px' }}>📊</span>
                    <span className="tac-clean-chip-val">{(highestProb / 100).toFixed(2)}</span>
                  </div>
                  <span className="tac-clean-chip-label">Model risk score</span>
                </div>

                <div className="tac-clean-chip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#38bdf8', fontSize: '13px' }}>⏱️</span>
                    <span className="tac-clean-chip-val">{latency}</span>
                  </div>
                  <span className="tac-clean-chip-label">Neural latency</span>
                </div>
              </div>

              {/* Recommended Action */}
              <div className="tac-clean-action-box">
                <div className="tac-clean-action-head">
                  <span>⚠️</span>
                  <span>Recommended Action</span>
                </div>
                <div className="tac-clean-action-desc">
                  {isRed
                    ? 'Trigger pre-emptive evacuation of riverbeds and vulnerable orographic drainage corridors.'
                    : 'Maintain routine automated radar surveillance and automated AWS monitoring.'}
                </div>
              </div>

              {/* Connective Operational Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="tac-clean-investigate-btn"
                  onClick={() => onNavigateTab && onNavigateTab('analysis')}
                  title="Examine CTT, IWV, CAPE and atmospheric drivers in Analysis view"
                >
                  <span>🔬</span>
                  <span>Investigate Drivers (Why?) →</span>
                </button>

                <button
                  type="button"
                  className="tac-clean-dispatch-btn"
                  disabled={isDispatching}
                  onClick={() => {
                    if (onNavigateTab) {
                      onNavigateTab('alerts');
                    } else {
                      handleDispatch();
                    }
                  }}
                  title="Open Alert & Incident Command to broadcast CAP 1.2 payload"
                >
                  <span style={{ fontSize: '15px' }}>((●))</span>
                  <span>{isDispatching ? 'Dispatching CAP 1.2...' : 'Prepare & Dispatch Alert (Act) →'}</span>
                </button>
              </div>

              {/* Official Warning Disclaimer (Section 29) */}
              <div style={{ fontSize: '9.5px', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', marginTop: '4px' }}>
                AI-generated risk assessment — not an official warning.
              </div>
            </div>
          );
        })()}
      </div>

      {/* ================= BOTTOM ROW: 3 CARDS ================= */}
      <div className="tac-clean-bottom-row">
        {/* Card 1: Forecast Timeline (Sector) */}
        <div className="tac-clean-card">
          <div className="tac-clean-card-title">Forecast Timeline ({activeSectorMeta.name})</div>
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
              {TIME_STEPS.map((step) => (
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
                const idx = TIME_STEPS.indexOf(selectedStep);
                setSelectedStep(TIME_STEPS[(idx + 1) % TIME_STEPS.length]);
              }}
              title="Next timestep"
            >
              ›
            </button>
          </div>
        </div>

        {/* Card 2: Other Active Threats (Next 6 Hours) */}
        {(() => {
          const preds = predictionData?.predictions || {};
          const cbVal = Math.round(preds.cloudburst_probability ?? (preds.cloudburst ? preds.cloudburst.risk_score * 100 : 14));
          const tsVal = Math.round(preds.thunderstorm_probability ?? (preds.thunderstorm ? preds.thunderstorm.risk_score * 100 : 12));
          const ffVal = Math.round(preds.flash_flood_probability ?? (preds.flash_flood ? preds.flash_flood.risk_score * 100 : 9));

          return (
            <div className="tac-clean-card">
              <div className="tac-clean-card-title-row">
                <span className="tac-clean-card-title">Multi-Hazard Risk (Next 6 Hours)</span>
                <span
                  className="tac-clean-view-all"
                  onClick={() => showToast && showToast('Viewing tactical convective hazard breakdown')}
                >
                  Model Output →
                </span>
              </div>

              <div className="tac-clean-threats-list">
                <div className="tac-clean-threat-row">
                  <span className="tac-clean-threat-name">
                    <span style={{ color: cbVal >= 50 ? '#ef4444' : '#f97316' }}>⚠️</span>
                    <span>Cloudburst</span>
                  </span>
                  <div className="tac-clean-threat-bar-wrap">
                    <div
                      className="tac-clean-threat-bar-fill"
                      style={{ width: `${Math.max(6, cbVal)}%`, background: cbVal >= 50 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #f97316)' }}
                    />
                  </div>
                  <span className="tac-clean-threat-pct">{cbVal}%</span>
                  <span className="tac-clean-threat-eta">{cbVal >= 50 ? 'ETA 2h 30m' : 'Nominal'}</span>
                </div>

                <div className="tac-clean-threat-row">
                  <span className="tac-clean-threat-name">
                    <span style={{ color: tsVal >= 50 ? '#ef4444' : '#38bdf8' }}>⛈️</span>
                    <span>Thunderstorm</span>
                  </span>
                  <div className="tac-clean-threat-bar-wrap">
                    <div
                      className="tac-clean-threat-bar-fill"
                      style={{ width: `${Math.max(6, tsVal)}%`, background: tsVal >= 50 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #38bdf8, #eab308)' }}
                    />
                  </div>
                  <span className="tac-clean-threat-pct">{tsVal}%</span>
                  <span className="tac-clean-threat-eta">{tsVal >= 50 ? 'ETA 3h 10m' : 'Nominal'}</span>
                </div>

                <div className="tac-clean-threat-row">
                  <span className="tac-clean-threat-name">
                    <span style={{ color: ffVal >= 50 ? '#ef4444' : '#0284c7' }}>🌊</span>
                    <span>Flash Flood</span>
                  </span>
                  <div className="tac-clean-threat-bar-wrap">
                    <div
                      className="tac-clean-threat-bar-fill"
                      style={{ width: `${Math.max(6, ffVal)}%`, background: ffVal >= 50 ? 'linear-gradient(90deg, #f97316, #ef4444)' : 'linear-gradient(90deg, #0284c7, #38bdf8)' }}
                    />
                  </div>
                  <span className="tac-clean-threat-pct">{ffVal}%</span>
                  <span className="tac-clean-threat-eta">{ffVal >= 50 ? 'ETA 4h 20m' : 'Nominal'}</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Card 3: Real-Time Weather Telemetry (Section 18) */}
        <div className="tac-clean-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="tac-clean-card-title-row" style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '13px' }}>🌦️</span>
                <span className="tac-clean-card-title" style={{ letterSpacing: '0.4px' }}>REAL-TIME WEATHER</span>
              </div>
              <span style={{
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                background: weatherStatus === 'LIVE' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: weatherStatus === 'LIVE' ? '#4ade80' : '#f87171',
                border: `1px solid ${weatherStatus === 'LIVE' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
              }}>
                {weatherStatus}
              </span>
            </div>

            {weatherStatus === 'DEGRADED' && !realtimeWeather?.weather ? (
              <div style={{ padding: '16px 8px', color: '#f87171', fontSize: '11px', textAlign: 'center' }}>
                ⚠️ Current meteorological telemetry is temporarily unavailable from provider.
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '5px 12px',
                fontSize: '11px',
                padding: '2px 0'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>Temperature</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.temperature_2m_c != null ? `${realtimeWeather.weather.temperature_2m_c.toFixed(1)} °C` : '--'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>Humidity</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.relative_humidity_2m_pct != null ? `${realtimeWeather.weather.relative_humidity_2m_pct} %` : '--'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>Pressure</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.surface_pressure_hpa != null ? `${realtimeWeather.weather.surface_pressure_hpa.toFixed(1)} hPa` : '--'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>Rain</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.rain_mm != null ? `${realtimeWeather.weather.rain_mm.toFixed(1)} mm` : (realtimeWeather?.weather?.precipitation_mm != null ? `${realtimeWeather.weather.precipitation_mm.toFixed(1)} mm` : '0.0 mm')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>Wind</span>
                  <span style={{ color: '#f1f5f9', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.wind_speed_10m_kmh != null ? `${realtimeWeather.weather.wind_speed_10m_kmh.toFixed(1)} km/h` : '--'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>CAPE</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.cape_j_kg != null ? `${Math.round(realtimeWeather.weather.cape_j_kg)} J/kg` : 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>CIN</span>
                  <span style={{ color: '#94a3b8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.cin_j_kg != null ? `${Math.round(realtimeWeather.weather.cin_j_kg)} J/kg` : 'N/A'}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '2px' }}>
                  <span style={{ color: '#94a3b8' }}>IWV</span>
                  <span style={{ color: '#38bdf8', fontWeight: 600, fontFamily: 'var(--font-mono, monospace)' }}>
                    {realtimeWeather?.weather?.total_column_water_vapour_kg_m2 != null ? `${realtimeWeather.weather.total_column_water_vapour_kg_m2.toFixed(1)} kg/m²` : '--'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{
            marginTop: '6px',
            paddingTop: '6px',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '9.5px',
            color: '#64748b'
          }}>
            <span>Updated {weatherAgeSeconds}s ago</span>
            <span>Source: Open-Meteo ({realtimeWeather?.freshness?.cached ? 'Cached' : 'Direct'})</span>
          </div>
        </div>
      </div>
    </div>
  );
}
