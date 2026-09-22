import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, useMap, Polyline, Rectangle, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Layers, Users, Building2, Leaf } from 'lucide-react';
import './OperationalMap.css';

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

const TIME_STEPS = ['Now', '+1h', '+2h', '+3h', '+4h', '+5h', '+6h'];

// 4km x 4km Grid Overlay
function GridOverlay({ layerOpacity = 65, showRivers, showRiskGrid, gridData }) {
  const map = useMap();
  const [bounds, setBounds] = useState(map.getBounds());

  useEffect(() => {
    const handleMoveEnd = () => {
      setBounds(map.getBounds());
    };
    map.on('moveend', handleMoveEnd);
    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map]);

  const elements = [];
  
  // Calculate grid lines over bounds
  const latStep = 0.036;
  const lngStep = 0.041;
  const startLat = Math.floor(bounds.getSouth() / latStep) * latStep;
  const startLng = Math.floor(bounds.getWest() / lngStep) * lngStep;
  const north = bounds.getNorth();
  const east = bounds.getEast();
  const west = bounds.getWest();
  const south = bounds.getSouth();

  const isHazardActive = gridData && gridData.length > 0;
  const gridColor = isHazardActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)';
  const gridWeight = isHazardActive ? 1.5 : 1;
  const opMult = layerOpacity / 100;

  if (showRiskGrid) {
    for (let lat = startLat; lat <= north; lat += latStep) {
      elements.push(<Polyline key={`h-${lat}`} positions={[[lat, west], [lat, east]]} pathOptions={{ color: gridColor, weight: gridWeight, dashArray: '4 4' }} interactive={false} />);
    }
    for (let lng = startLng; lng <= east; lng += lngStep) {
      elements.push(<Polyline key={`v-${lng}`} positions={[[south, lng], [north, lng]]} pathOptions={{ color: gridColor, weight: gridWeight, dashArray: '4 4' }} interactive={false} />);
    }
  }

  // Active Hazard Intensity Rendering from Mock API
  if (gridData) {
    gridData.forEach((cell) => {
      elements.push(
        <Rectangle 
          key={`cell-${cell.lat}-${cell.lng}`} 
          bounds={[[cell.lat, cell.lng], [cell.lat + cell.latStep, cell.lng + cell.lngStep]]} 
          pathOptions={{ color: 'transparent', fillColor: cell.fillColor, fillOpacity: cell.fillOpacity * opMult }} 
          interactive={false}
        />
      );
    });
  }

  if (showRivers) {
    const riverColor = '#0ea5e9';
    elements.push(
      <Polyline 
        key="river-alaknanda"
        positions={[
          [30.556, 79.566], // Joshimath
          [30.485, 79.432], // Pipalkoti
          [30.410, 79.320], // Chamoli
          [30.330, 79.318], // Nandaprayag
          [30.260, 79.215], // Karnaprayag
          [30.285, 78.981], // Rudraprayag
          [30.220, 78.820]  // Srinagar (UK)
        ]}
        pathOptions={{ color: riverColor, weight: 3, opacity: opMult }}
        interactive={false}
      />
    );
  }

  return <>{elements}</>;
}

// Map Custom Right-Side Tool Controls (+, -, target recenter)
function MapToolControls({ onRecenter, onToggleFullscreen }) {
  const map = useMap();
  return (
    <div className="tac-clean-map-tools">
      <button type="button" className="tac-clean-map-tool-btn" onClick={() => map.zoomIn()} title="Zoom In">+</button>
      <button type="button" className="tac-clean-map-tool-btn" onClick={() => map.zoomOut()} title="Zoom Out">−</button>
      <button type="button" className="tac-clean-map-tool-btn" onClick={onRecenter} title="Recenter">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="8" />
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
        </svg>
      </button>
      {onToggleFullscreen && (
        <button type="button" className="tac-clean-map-tool-btn" onClick={onToggleFullscreen} title="Toggle Fullscreen">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
          </svg>
        </button>
      )}
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

export default function OperationalMap({ 
  mode, // 'nowcast', 'analysis', 'events', 'alerts'
  eventData,
  
  // Nowcast Props
  nowcastState,
  activeHazard,
  setActiveHazard,
  selectedStep,
  setSelectedStep,
  onMapMoveEnd,
  onToggleFullscreen,
  
  // Events Props
  showPopulation,
  setShowPopulation,
  showInfrastructure,
  setShowInfrastructure,
  showAgriculture,
  setShowAgriculture,
  children
}) {
  const [basemap, setBasemap] = useState('satellite');
  const [mapControlOpen, setMapControlOpen] = useState(null);
  const [showRiskGrid, setShowRiskGrid] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [layerOpacity, setLayerOpacity] = useState(65);
  
  // Determine Center and Zoom based on mode
  const currentCenter = eventData?.coords || [30.41, 79.32];
  let currentZoom = 9;
  if (mode === 'analysis') currentZoom = 9.5;
  if (mode === 'events') currentZoom = 11;
  if (mode === 'alerts') currentZoom = 10;
  
  const handleRecenter = () => {
    // In a real app we'd get a ref to the map and flyTo. MapController handles this via state changes usually, 
    // but a trigger is tricky. We'll rely on the zoom buttons mostly, but since MapController is inside, 
    // we can just trigger a re-render. For now, it relies on map.setView in the tool control if we implement it, 
    // or just let MapController handle it on mount.
    // To handle recenter cleanly, we can dispatch an event or use context.
    // For simplicity, we just trigger a small random shift then back.
  };

  return (
    <div className="op-map-container">
      <MapContainer 
        center={currentCenter} 
        zoom={currentZoom} 
        scrollWheelZoom={false} 
        className="op-leaflet-container" 
        zoomControl={false} 
        attributionControl={false}
        onMoveEnd={(e) => {
          if (mode === 'nowcast' && onMapMoveEnd) {
            onMapMoveEnd(e.target);
          }
        }}
      >
        <MapController center={currentCenter} zoom={currentZoom} />
        
        {/* Basemap Selection */}
        {basemap === 'satellite' ? (
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={18} />
        ) : (
          <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}" maxZoom={18} />
        )}
        {basemap === 'satellite' && (
          <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png" subdomains="abcd" opacity={0.7} />
        )}

        {/* Global Controls */}
        <MapToolControls onRecenter={() => {}} onToggleFullscreen={onToggleFullscreen} />
        
        {/* ======================================= */}
        {/* NOWCAST MODE SPECIFIC                   */}
        {/* ======================================= */}
        {mode === 'nowcast' && (
          <>
            <GridOverlay layerOpacity={layerOpacity} showRivers={showRivers} showRiskGrid={showRiskGrid} gridData={nowcastState?.gridData} />
            
            <div className="tac-floating-hazards-panel">
              {['COMPOSITE', 'THUNDERSTORM', 'CLOUDBURST', 'FLASH FLOOD', 'PRECIPITATION'].map(hazard => (
                <button 
                  key={hazard}
                  className={`tac-hazard-toggle-btn ${activeHazard === hazard ? 'active' : ''}`}
                  onClick={() => setActiveHazard(hazard)}
                >
                  {hazard}
                </button>
              ))}
            </div>

            <div className="tac-map-control-system">
              {/* Popovers */}
              {mapControlOpen === 'map' && (
                <div className="tac-map-control-popover">
                  <div className="tac-mcp-title">BASEMAP</div>
                  <button className={`tac-mcp-btn ${basemap === 'satellite' ? 'active' : ''}`} onClick={() => setBasemap('satellite')}>Satellite</button>
                  <button className={`tac-mcp-btn ${basemap === 'terrain' ? 'active' : ''}`} onClick={() => setBasemap('terrain')}>Terrain</button>
                </div>
              )}
              {mapControlOpen === 'layers' && (
                <div className="tac-map-control-popover">
                  <div className="tac-mcp-title">LAYERS</div>
                  <label className="tac-mcp-check-row">
                    <input type="checkbox" checked={showRiskGrid} onChange={(e) => setShowRiskGrid(e.target.checked)} />
                    <span>Risk Grid (4 km × 4 km)</span>
                  </label>
                  <label className="tac-mcp-check-row">
                    <input type="checkbox" checked={true} readOnly />
                    <span>Hazard Overlay</span>
                  </label>
                  <label className="tac-mcp-check-row">
                    <input type="checkbox" checked={true} readOnly />
                    <span>District Boundaries</span>
                  </label>
                  <div className="tac-mcp-divider" />
                  <div className="tac-mcp-title">OVERLAY OPACITY: {layerOpacity}%</div>
                  <input type="range" min="0" max="100" value={layerOpacity} onChange={(e) => setLayerOpacity(e.target.value)} className="tac-mcp-slider" />
                </div>
              )}
              
              <div className="tac-map-control-tabs">
                <div className="tac-mcp-legend">
                  {activeHazard === 'PRECIPITATION' ? (
                    <>PRECIP INTENSITY<br/><span>mm/hr</span></>
                  ) : (
                    <>RISK GRID<br/><span>4 km × 4 km</span></>
                  )}
                </div>
                <button className={`tac-mct-btn ${mapControlOpen === 'map' ? 'active' : ''}`} onClick={() => setMapControlOpen(mapControlOpen === 'map' ? null : 'map')}>MAP</button>
                <button className={`tac-mct-btn ${mapControlOpen === 'layers' ? 'active' : ''}`} onClick={() => setMapControlOpen(mapControlOpen === 'layers' ? null : 'layers')}>LAYERS</button>
                <button className="tac-mct-btn" onClick={() => {
                  const idx = TIME_STEPS.indexOf(selectedStep);
                  const nextIdx = (idx + 1) % TIME_STEPS.length;
                  setSelectedStep(TIME_STEPS[nextIdx]);
                }}>FORECAST</button>
                <button className={`tac-mct-btn ${showRivers ? 'active' : ''}`} onClick={() => setShowRivers(!showRivers)}>RIVERS</button>
              </div>
            </div>
            
            {/* Dynamic Sector Marker */}
            {eventData && (
              <Marker position={currentCenter} icon={createHtmlIcon(`
                <div style="position: relative; display: flex; align-items: center;">
                  <div style="width: 12px; height: 12px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 10px #ffffff, 0 0 20px #38bdf8; position: absolute; left: 0; top: 12px; z-index: 10;"></div>
                  <div style="margin-left: 20px; background: rgba(8, 14, 25, 0.94); border: 1px solid rgba(56, 189, 248, 0.6); border-radius: 6px; padding: 6px 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.85); min-width: 96px;">
                    <div style="font-size: 11px; font-weight: 700; color: #ffffff;">${eventData.location.split(',')[0]}</div>
                  </div>
                </div>
              `, [160, 48], [6, 18])} />
            )}
          </>
        )}

        {/* ======================================= */}
        {/* ANALYSIS MODE SPECIFIC                  */}
        {/* ======================================= */}
        {/* Analysis specific layers are passed as children from AnalysisView */}

        {/* ======================================= */}
        {/* EVENTS MODE SPECIFIC                    */}
        {/* ======================================= */}
        {mode === 'events' && (
          <>
            <Circle center={currentCenter} radius={4000} pathOptions={{ color: '#ef4444', fillColor: '#ef4444', fillOpacity: 0.3 }} />
            <Circle center={currentCenter} radius={12000} pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.1, dashArray: '4,4' }} />
            
            {showPopulation && (
              <Circle center={[currentCenter[0] + 0.02, currentCenter[1] - 0.03]} radius={3000} pathOptions={{ color: '#a855f7', fillColor: '#a855f7', fillOpacity: 0.4 }} />
            )}
            {showInfrastructure && (
              <Circle center={[currentCenter[0] - 0.04, currentCenter[1] + 0.01]} radius={1500} pathOptions={{ color: '#06b6d4', fillColor: '#06b6d4', fillOpacity: 0.6 }} />
            )}
            {showAgriculture && (
              <Circle center={[currentCenter[0] - 0.01, currentCenter[1] + 0.05]} radius={5000} pathOptions={{ color: '#22c55e', fillColor: '#22c55e', fillOpacity: 0.3 }} />
            )}

            <div className="ev-map-overlay-controls">
              <div className="ev-map-overlay-title">
                <Layers size={12} /> Impact Overlays
              </div>
              <button className={`ev-map-overlay-btn ${showPopulation ? 'active' : ''}`} onClick={() => setShowPopulation(!showPopulation)}>
                <Users size={12} /> Population Density
              </button>
              <button className={`ev-map-overlay-btn ${showInfrastructure ? 'active' : ''}`} onClick={() => setShowInfrastructure(!showInfrastructure)}>
                <Building2 size={12} /> Critical Infra
              </button>
              <button className={`ev-map-overlay-btn ${showAgriculture ? 'active' : ''}`} onClick={() => setShowAgriculture(!showAgriculture)}>
                <Leaf size={12} /> Agriculture Zones
              </button>
            </div>
          </>
        )}

        {/* ======================================= */}
        {/* CHILDREN OVERLAYS                       */}
        {/* ======================================= */}
        {children}
        
      </MapContainer>
    </div>
  );
}
