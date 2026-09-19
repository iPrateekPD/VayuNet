import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Polygon, Tooltip, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Color helpers
const severityColors = {
  thunderstorm: { fill: '#f59e0b', stroke: '#d97706' },
  cloudburst: { fill: '#3b82f6', stroke: '#2563eb' },
  flood: { fill: '#06b6d4', stroke: '#0891b2' },
};

function opacityForProb(p) {
  return 0.15 + p * 0.45;
}

// Controller to smoothly fly to center/zoom when changed
function MapFlyController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || map.getZoom(), { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

// Click-to-inspect handler
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick([e.latlng.lat, e.latlng.lng]);
      }
    },
  });
  return null;
}

// Custom inspection pin icon
const inspectionIcon = L.divIcon({
  className: 'custom-inspection-pin',
  html: `<div style="
    width: 22px; 
    height: 22px; 
    background: rgba(59, 130, 246, 0.25); 
    border: 2px solid #38bdf8; 
    border-radius: 50%; 
    box-shadow: 0 0 14px rgba(56, 189, 248, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
  ">
    <div style="width: 6px; height: 6px; background: #fff; border-radius: 50%;"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

export default function MapView({ stepData, overlays, center, zoom, inspectedPoint, onMapClick }) {
  const overlayTypes = [
    { key: 'thunderstorm', zones: stepData.thunderstorm || [] },
    { key: 'cloudburst', zones: stepData.cloudburst || [] },
    { key: 'flood', zones: stepData.flood || [] },
  ];

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className="leaflet-map"
      style={{ height: '100%', width: '100%', zIndex: 1, background: '#0a0f1d' }}
      zoomControl={true}
    >
      <MapFlyController center={center} zoom={zoom} />
      <MapClickHandler onMapClick={onMapClick} />

      {/* Clean Esri Dark Gray Base Map - No API Key Required */}
      <TileLayer
        attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
        maxZoom={16}
      />
      {/* Esri Reference Labels */}
      <TileLayer
        url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
        opacity={0.8}
        maxZoom={16}
      />

      {/* Polygons */}
      {overlayTypes.map(({ key, zones }) =>
        overlays[key]
          ? zones.map((zone, i) => (
              <Polygon
                key={`${key}-${i}`}
                positions={zone.coords}
                pathOptions={{
                  fillColor: severityColors[key].fill,
                  fillOpacity: opacityForProb(zone.probability),
                  color: severityColors[key].stroke,
                  weight: 1.5,
                  dashArray: key === 'flood' ? '6 4' : null,
                }}
              >
                <Tooltip sticky>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12 }}>
                    <strong style={{ textTransform: 'capitalize' }}>{key} Risk</strong>
                    <br />
                    Probability: <strong>{Math.round(zone.probability * 100)}%</strong>
                  </div>
                </Tooltip>
              </Polygon>
            ))
          : null
      )}

      {/* Inspected Point Marker */}
      {inspectedPoint && (
        <Marker position={inspectedPoint} icon={inspectionIcon}>
          <Popup autoPan={false}>
            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#0f172a' }}>
              <strong>Tactical Sensor Intercept</strong>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                Lat: {inspectedPoint[0].toFixed(4)}°N, Lon: {inspectedPoint[1].toFixed(4)}°E
              </div>
              <div style={{ fontSize: 11, color: '#0284c7', marginTop: 4, fontWeight: 600 }}>
                Status: Grid 4km Active Monitoring
              </div>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
