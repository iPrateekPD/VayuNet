import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Circle, Marker, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  BASE_MAP_PROVIDERS,
  WeatherLayerProvider,
  FORECAST_TIME_STEPS,
  IMD_DWR_NETWORK,
  NATIONAL_AWS_STATIONS,
  SYNOPTIC_PRESSURE_SYSTEM,
  WIND_STREAMLINES,
} from '../services/weatherService';

// Fix default leaflet marker icon issue in bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// India default center & zoom (offset to the west so the Indian subcontinent appears prominently on the right, clear of the hero text)
const INDIA_CENTER = [22.4, 67.5];
const INDIA_ZOOM = 4.85;

// Severity styling for VAYUNET hazard prediction polygons
const HAZARD_STYLES = {
  thunderstorm: {
    fillColor: '#f59e0b',
    fillOpacity: 0.32,
    color: '#d97706',
    weight: 1.8,
  },
  cloudburst: {
    fillColor: '#3b82f6',
    fillOpacity: 0.40,
    color: '#2563eb',
    weight: 2.2,
  },
  flood: {
    fillColor: '#06b6d4',
    fillOpacity: 0.35,
    color: '#0891b2',
    weight: 2.2,
    dashArray: '6, 5',
  },
};

/**
 * Controller component inside MapContainer for GIS controls & programmatic actions
 */
function MapGISController({ mapRef, mapControllerRef, isMobile, onIntroComplete }) {
  const map = useMap();
  const onIntroCompleteRef = useRef(onIntroComplete);

  useEffect(() => {
    onIntroCompleteRef.current = onIntroComplete;
  }, [onIntroComplete]);

  useEffect(() => {
    if (!map) return;
    map.invalidateSize();

    if (mapRef) {
      mapRef.current = map;
    }
    if (mapControllerRef) {
      mapControllerRef.current = {
        zoomIn: () => {
          map.zoomIn(1);
        },
        zoomOut: () => {
          map.zoomOut(1);
        },
        resetView: () => {
          if (isMobile) {
            map.setView([21.8, 78.9], 4.2, { animate: true });
          } else {
            map.setView(INDIA_CENTER, INDIA_ZOOM, { animate: true });
          }
        },
        getMap: () => map,
      };
    }

    if (isMobile) {
      map.setView([21.8, 78.9], 4.2, { animate: false });
    }
    onIntroCompleteRef.current?.();
  }, [map, isMobile]);

  return null;
}

export default function HeroMap({
  activeLayer = 'precipitation',
  scrubberIdx = 0,
  onSelectHazard,
  isMobile = false,
  mapControllerRef,
  onIntroComplete,
}) {
  const internalMapRef = useRef(null);

  // Layer toggle switches
  const [showDwrRings, setShowDwrRings] = useState(true);
  const [showIsobars, setShowIsobars] = useState(true);
  const [showAwsStations, setShowAwsStations] = useState(true);

  // Determine current active basemap
  const baseTile = useMemo(() => {
    if (activeLayer === 'satellite') {
      return BASE_MAP_PROVIDERS.satellite;
    }
    if (activeLayer === 'terrain') {
      return BASE_MAP_PROVIDERS.terrain;
    }
    return BASE_MAP_PROVIDERS.dark;
  }, [activeLayer]);

  // Current hazard scenario data for active scrubber step
  const stepHazardData = useMemo(() => {
    return WeatherLayerProvider.getHazardZones(scrubberIdx);
  }, [scrubberIdx]);

  // Current regional pins with time-adjusted ETA
  const regionalMarkers = useMemo(() => {
    return WeatherLayerProvider.getRegionalMarkers(scrubberIdx);
  }, [scrubberIdx]);

  // Static meteorological layers
  const dwrStations = useMemo(() => WeatherLayerProvider.getDwrNetwork(), []);
  const awsStations = useMemo(() => WeatherLayerProvider.getAwsStations(), []);
  const synopticFeatures = useMemo(() => WeatherLayerProvider.getSynopticFeatures(), []);
  const windStreamlines = useMemo(() => WeatherLayerProvider.getWindStreamlines(), []);

  // Helper to create custom Leaflet DivIcon for pins
  const createPinIcon = (pin) => {
    return L.divIcon({
      className: 'leaflet-custom-marker',
      html: `
        <div class="map-pin-v2 map-pin-leaflet">
          <span class="pin-pulse-dot" style="background: ${pin.dotColor}; box-shadow: 0 0 10px ${pin.dotColor};"></span>
          <div class="pin-text-wrap">
            <span class="pin-title">${pin.name}</span>
            <span class="pin-risk-label ${pin.riskClass}">${pin.risk}</span>
            <span class="pin-hazard">${pin.hazard}</span>
            <span class="pin-eta">${pin.eta}</span>
          </div>
        </div>
      `,
      iconSize: [160, 64],
      iconAnchor: [12, 28],
    });
  };

  // Lightning icon creator
  const createLightningIcon = () => {
    return L.divIcon({
      className: 'leaflet-lightning-marker',
      html: `
        <div class="lightning-strike-dot">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#fbbf24" stroke="#d97706" stroke-width="1.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };

  // IMD Doppler Weather Radar DivIcon
  const createDwrIcon = (radar) => {
    return L.divIcon({
      className: 'leaflet-dwr-marker',
      html: `
        <div class="dwr-radar-pin">
          <span class="dwr-pulse-ring"></span>
          <span class="dwr-center-dot"></span>
          <span class="dwr-label">${radar.name.split(' ')[0]}</span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  };

  // National AWS City Station DivIcon
  const createAwsIcon = (station) => {
    return L.divIcon({
      className: 'leaflet-aws-marker',
      html: `
        <div class="aws-city-badge">
          <span class="aws-dot"></span>
          <span class="aws-city-name">${station.name.split(' ')[0]}</span>
          <span class="aws-city-temp">${station.temp}</span>
        </div>
      `,
      iconSize: [96, 24],
      iconAnchor: [48, 12],
    });
  };

  // Synoptic Depression Low Center Marker
  const createLowCenterIcon = (low) => {
    return L.divIcon({
      className: 'leaflet-synoptic-low-marker',
      html: `
        <div class="synoptic-low-badge">
          <span class="synoptic-l-letter">L</span>
          <span class="synoptic-l-val">${low.pressure}</span>
        </div>
      `,
      iconSize: [52, 26],
      iconAnchor: [26, 13],
    });
  };

  return (
    <div className="hero-leaflet-wrapper">
      <MapContainer
        center={isMobile ? [21.8, 78.9] : INDIA_CENTER}
        zoom={isMobile ? 4.2 : INDIA_ZOOM}
        zoomSnap={0.05}
        zoomDelta={0.5}
        zoomControl={false}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        dragging={true}
        attributionControl={false}
        className="hero-leaflet-container"
        style={{ width: '100%', height: '100%', background: '#020712' }}
      >
        <MapGISController mapRef={internalMapRef} mapControllerRef={mapControllerRef} isMobile={isMobile} onIntroComplete={onIntroComplete} />

        {/* Dynamic Basemap (Dark / Satellite / Terrain) */}
        <TileLayer
          key={baseTile.name}
          url={baseTile.url}
          attribution={baseTile.attribution}
          subdomains={baseTile.subdomains || 'abc'}
          maxZoom={baseTile.maxZoom || 18}
        />

        {/* Geographic & Country Reference Labels (Crisp Dark Boundaries) */}
        {activeLayer !== 'satellite' && (
          <TileLayer
            key="esri-reference-labels"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
            opacity={0.88}
            maxZoom={16}
          />
        )}

        {/* ============================================================
            1. CONTINUOUS METEOROLOGICAL RADAR REFLECTIVITY MOSAIC
            Spans across the entire subcontinent: Western Ghats, Bay of Bengal,
            Central Trough, Himalayas, Northeast, Gangetic Belt, Deccan Plateau
            ============================================================ */}
        {activeLayer === 'precipitation' && (
          <>
            {/* Widespread Convective Bands across the Subcontinent */}
            {/* (a) Western Ghats Orographic Deluge Corridor */}
            <Polygon
              positions={[
                [8.4, 76.8], [9.8, 76.1], [11.8, 75.6], [14.0, 74.3],
                [16.2, 73.2], [18.8, 72.6], [20.8, 72.7], [20.6, 73.3],
                [18.5, 73.5], [15.8, 74.2], [13.5, 75.3], [11.2, 76.6],
                [9.2, 77.2], [8.4, 76.8]
              ]}
              pathOptions={{
                fillColor: '#0284c7',
                fillOpacity: 0.32,
                color: '#38bdf8',
                weight: 1.8,
                opacity: 0.75,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Western Ghats Orographic Cloud Wall</strong><br />
                  Continuously feeding moisture from Arabian Sea LLJ<br />
                  Reflectivity: 35–55 dBZ
                </div>
              </Tooltip>
            </Polygon>

            {/* (b) Bay of Bengal Depression Inflow Spiral */}
            <Polygon
              positions={[
                [18.0, 84.5], [19.2, 85.8], [20.5, 87.2], [22.0, 88.8],
                [23.5, 89.6], [23.2, 90.5], [21.5, 90.0], [19.5, 88.2],
                [18.2, 86.2], [17.5, 84.8], [18.0, 84.5]
              ]}
              pathOptions={{
                fillColor: '#0891b2',
                fillOpacity: 0.35,
                color: '#22d3ee',
                weight: 1.8,
                opacity: 0.8,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Bay of Bengal Cyclonic Inflow Arm</strong><br />
                  Moisture convergence into Gangetic Bengal & Odisha<br />
                  Reflectivity: 40–58 dBZ
                </div>
              </Tooltip>
            </Polygon>

            {/* (c) Central India Monsoon Trough Band */}
            <Polygon
              positions={[
                [21.8, 72.5], [22.8, 76.0], [23.5, 80.5], [22.2, 85.0],
                [21.0, 87.0], [20.2, 85.5], [21.5, 80.0], [21.0, 75.5],
                [21.2, 72.8], [21.8, 72.5]
              ]}
              pathOptions={{
                fillColor: '#16a34a',
                fillOpacity: 0.28,
                color: '#4ade80',
                weight: 1.6,
                opacity: 0.7,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Central Indian Monsoon Trough Convective Belt</strong><br />
                  Vidarbha, MP & Chhattisgarh moisture convergence<br />
                  Reflectivity: 30–48 dBZ
                </div>
              </Tooltip>
            </Polygon>

            {/* (d) Northeast Megadrop Zone (Cherrapunji & Brahmaputra) */}
            <Polygon
              positions={[
                [25.0, 90.5], [26.8, 91.5], [27.5, 94.5], [26.8, 95.5],
                [25.8, 93.5], [24.8, 91.8], [25.0, 90.5]
              ]}
              pathOptions={{
                fillColor: '#9333ea',
                fillOpacity: 0.30,
                color: '#c084fc',
                weight: 1.8,
                opacity: 0.75,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Northeastern Cherrapunji Mega-Convective Wedge</strong><br />
                  Brahmaputra basin & Khasi Hills orographic trap<br />
                  Reflectivity: 45–65 dBZ
                </div>
              </Tooltip>
            </Polygon>

            {/* (e) Himalayan Foothills Convective Line */}
            <Polygon
              positions={[
                [32.8, 74.8], [32.0, 76.2], [31.0, 77.6], [29.8, 79.5],
                [28.8, 81.2], [29.2, 81.6], [30.5, 79.8], [31.8, 77.8],
                [32.6, 76.4], [33.2, 75.0], [32.8, 74.8]
              ]}
              pathOptions={{
                fillColor: '#f59e0b',
                fillOpacity: 0.26,
                color: '#fbbf24',
                weight: 1.6,
                opacity: 0.7,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Himalayan Orographic Lifting Zone</strong><br />
                  Pir Panjal to Kumaon Hills<br />
                  Reflectivity: 38–60 dBZ
                </div>
              </Tooltip>
            </Polygon>

            {/* High-density nationwide Doppler Radar cells (24+ regions) */}
            {stepHazardData.radarIntensity?.map((cell, idx) => (
              <React.Fragment key={`radar-cell-${idx}-${cell.center[0]}`}>
                {/* Outer echo ring (Stratiform / Light-Moderate Rain) */}
                <Circle
                  center={cell.center}
                  radius={cell.radius}
                  pathOptions={{
                    fillColor: cell.color,
                    fillOpacity: 0.38,
                    color: cell.color,
                    weight: 1.4,
                    opacity: 0.75,
                  }}
                />

                {/* Intermediate intense convective echo ring */}
                <Circle
                  center={cell.center}
                  radius={cell.radius * 0.48}
                  pathOptions={{
                    fillColor: cell.dbz >= 52 ? '#ef4444' : cell.color,
                    fillOpacity: 0.62,
                    color: '#ffffff',
                    weight: 1.5,
                    opacity: 0.88,
                  }}
                />

                {/* Severe updraft convective core (if dbz >= 50) */}
                {cell.dbz >= 50 && (
                  <Circle
                    center={cell.center}
                    radius={cell.radius * 0.22}
                    pathOptions={{
                      fillColor: cell.dbz >= 58 ? '#c084fc' : '#ffffff',
                      fillOpacity: 0.92,
                      color: '#ffffff',
                      weight: 2,
                      opacity: 0.98,
                    }}
                  >
                    <Tooltip sticky>
                      <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11, minWidth: 150 }}>
                        <div style={{ fontWeight: 700, color: cell.color, fontSize: 12 }}>
                          {cell.region}
                        </div>
                        <div>Doppler Reflectivity: <strong>{cell.dbz} dBZ</strong></div>
                        <div>Rainfall Rate: <strong>{cell.intensity} mm/hr</strong></div>
                        <div>Severity: <strong>{cell.level}</strong></div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
                          IMD National Radar Mosaic
                        </div>
                      </div>
                    </Tooltip>
                  </Circle>
                )}
              </React.Fragment>
            ))}
          </>
        )}

        {/* ============================================================
            2. SYNOPTIC PRESSURE SYSTEMS (Isobars, Low Centers, Monsoon Trough)
            ============================================================ */}
        {showIsobars && activeLayer !== 'satellite' && (
          <>
            {/* Monsoon Trough Axis across Northern & Central India */}
            <Polyline
              positions={synopticFeatures.monsoonTrough}
              pathOptions={{
                color: '#f43f5e',
                weight: 2.2,
                dashArray: '8, 6',
                opacity: 0.85,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong style={{ color: '#f43f5e' }}>MONSOON TROUGH AXIS</strong><br />
                  Surface Convergence Line (Ganganagar to Head Bay)<br />
                  High Convective Shear Active
                </div>
              </Tooltip>
            </Polyline>

            {/* Synoptic Isobars (998, 1000, 1002, 1004, 1006 hPa) */}
            {synopticFeatures.isobars.map((iso, idx) => (
              <React.Fragment key={`isobar-${idx}`}>
                <Polyline
                  positions={iso.coords}
                  pathOptions={{
                    color: '#94a3b8',
                    weight: 1.4,
                    opacity: 0.45,
                    dashArray: '4, 4',
                  }}
                >
                  <Tooltip sticky>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10 }}>
                      Isobar: <strong>{iso.value}</strong>
                    </div>
                  </Tooltip>
                </Polyline>
              </React.Fragment>
            ))}

            {/* Bay of Bengal Synoptic Low Center Marker */}
            <Marker
              position={synopticFeatures.lowCenter.coords}
              icon={createLowCenterIcon(synopticFeatures.lowCenter)}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong style={{ color: '#ef4444' }}>{synopticFeatures.lowCenter.title}</strong><br />
                  Central Pressure: <strong>{synopticFeatures.lowCenter.pressure}</strong><br />
                  Associated with Well-Marked Surface Low
                </div>
              </Tooltip>
            </Marker>
          </>
        )}

        {/* ============================================================
            3. IMD DOPPLER WEATHER RADAR (DWR) NETWORK RINGS (37 Radars)
            ============================================================ */}
        {showDwrRings && (
          <>
            {dwrStations.map(radar => (
              <React.Fragment key={radar.id}>
                {/* 250km Radar Sweep Beam Radius Ring */}
                <Circle
                  center={radar.coords}
                  radius={radar.rangeKm * 1000}
                  pathOptions={{
                    color: 'rgba(56, 189, 248, 0.35)',
                    weight: 1,
                    dashArray: '5, 5',
                    fillColor: 'rgba(56, 189, 248, 0.02)',
                    fillOpacity: 0.05,
                  }}
                />

                {/* Radar Station Marker Icon */}
                <Marker
                  position={radar.coords}
                  icon={createDwrIcon(radar)}
                >
                  <Tooltip sticky>
                    <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                      <strong style={{ color: '#38bdf8' }}>IMD Doppler Weather Radar (DWR)</strong><br />
                      Station: <strong>{radar.name}</strong><br />
                      Hardware: <strong>{radar.band}</strong><br />
                      Scan Radius: <strong>{radar.rangeKm} km</strong><br />
                      Mode: <span style={{ color: '#10b981' }}>{radar.status}</span>
                    </div>
                  </Tooltip>
                </Marker>
              </React.Fragment>
            ))}
          </>
        )}

        {/* ============================================================
            4. NATIONAL AWS CITY TELEMETRY STATIONS
            ============================================================ */}
        {showAwsStations && (
          <>
            {awsStations.map(station => (
              <Marker
                key={station.id}
                position={station.coords}
                icon={createAwsIcon(station)}
              >
                <Tooltip sticky direction="top" offset={[0, -10]}>
                  <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11, minWidth: 140 }}>
                    <strong style={{ color: '#f8fafc', fontSize: 12 }}>{station.name}</strong><br />
                    Temperature: <strong>{station.temp}</strong><br />
                    Rainfall Rate: <strong style={{ color: '#38bdf8' }}>{station.rain}</strong><br />
                    Pressure: <strong>{station.pressure}</strong><br />
                    Humidity: <strong>{station.humidity}</strong> | Wind: <strong>{station.wind}</strong><br />
                    Status: <strong style={{ color: '#fbbf24' }}>{station.status}</strong>
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </>
        )}

        {/* ============================================================
            5. CLOUD TOPS LAYER (INSAT-3DR Multispectral Thermal Infrared)
            ============================================================ */}
        {activeLayer === 'cloud_tops' && (
          <>
            {/* Arabian Sea & Western Ghats Cloud Wall */}
            <Circle
              center={[16.5, 73.5]}
              radius={380000}
              pathOptions={{
                fillColor: '#1e1b4b',
                fillOpacity: 0.48,
                color: '#6366f1',
                weight: 1.8,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>INSAT-3DR Multispectral Thermal IR</strong><br />
                  Convective Complex: Western Ghats Corridor<br />
                  CTT: −68 °C (Severe Overshooting Tops)
                </div>
              </Tooltip>
            </Circle>

            {/* Bay of Bengal Depressive Cloud Mass */}
            <Circle
              center={[20.5, 88.5]}
              radius={420000}
              pathOptions={{
                fillColor: '#312e81',
                fillOpacity: 0.52,
                color: '#a855f7',
                weight: 2,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Bay of Bengal Monsoonal Cloud Shield</strong><br />
                  CTT: −74 °C (Deep Mesoscale Convective System)<br />
                  Cloud Water Path: 4.8 kg/m²
                </div>
              </Tooltip>
            </Circle>

            {/* Himalayan Orographic Cloud Mass */}
            <Circle
              center={[30.5, 79.2]}
              radius={240000}
              pathOptions={{
                fillColor: '#0f172a',
                fillOpacity: 0.55,
                color: '#c084fc',
                weight: 2,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Himalayan Orographic Cloud Barrier</strong><br />
                  CTT Drop: −18 °C / hr (Rapid Updraft Feeding)
                </div>
              </Tooltip>
            </Circle>

            {/* Northeast Cherrapunji Convective Core */}
            <Circle
              center={[25.8, 92.0]}
              radius={260000}
              pathOptions={{
                fillColor: '#1e1b4b',
                fillOpacity: 0.50,
                color: '#ec4899',
                weight: 2,
              }}
            >
              <Tooltip sticky>
                <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                  <strong>Northeast Orographic Mega-Cluster</strong><br />
                  CTT: −72 °C (Torrential Cloudburst Inundation)
                </div>
              </Tooltip>
            </Circle>
          </>
        )}

        {/* ============================================================
            6. LIGHTNING STRIKES (ISRO/IITM Lightning Location Network)
            ============================================================ */}
        {activeLayer === 'lightning' && (
          <>
            {stepHazardData.lightningStrikes?.map((pos, idx) => (
              <Marker
                key={`strike-${idx}-${pos[0]}`}
                position={pos}
                icon={createLightningIcon()}
              >
                <Tooltip sticky>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10 }}>
                    ⚡ Strike: {pos[0].toFixed(2)}°N, {pos[1].toFixed(2)}°E<br />
                    Peak Current: −{(35 + (idx * 3) % 45).toFixed(1)} kA (Cloud-to-Ground)<br />
                    Rate: 42 flashes / min
                  </div>
                </Tooltip>
              </Marker>
            ))}
          </>
        )}

        {/* ============================================================
            7. WIND STREAMLINES & MONSOON LOW-LEVEL JET
            ============================================================ */}
        {activeLayer === 'wind' && (
          <>
            {windStreamlines.map((stream, idx) => (
              <Polyline
                key={`wind-stream-${idx}`}
                positions={stream.path}
                pathOptions={{
                  color: stream.speed >= 30 ? '#38bdf8' : '#22d3ee',
                  weight: stream.speed >= 30 ? 2.5 : 1.8,
                  opacity: 0.8,
                  dashArray: '8, 6',
                }}
              >
                <Tooltip sticky>
                  <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                    <strong>Monsoon Boundary-Layer Wind Vector</strong><br />
                    Velocity: <strong>{stream.label}</strong> ({Math.round(stream.speed * 1.852)} km/h)<br />
                    Level: 850 hPa (Low-Level Jet)
                  </div>
                </Tooltip>
              </Polyline>
            ))}
          </>
        )}

        {/* ============================================================
            8. VAYUNET PREDICTION LAYER (Thunderstorm, Cloudburst, Flood)
            ============================================================ */}
        {/* Severe Thunderstorm Polygons */}
        {stepHazardData.thunderstorm?.map((poly, idx) => (
          <Polygon
            key={`ts-${scrubberIdx}-${idx}`}
            positions={poly.coords}
            pathOptions={HAZARD_STYLES.thunderstorm}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>⚡ Severe Thunderstorm Risk</span><br />
                Zone: <strong>{poly.label}</strong><br />
                Model Probability: <strong>{Math.round(poly.prob * 100)}%</strong><br />
                Lead Time: <strong>{FORECAST_TIME_STEPS[scrubberIdx].offset}</strong>
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* Cloudburst Polygons */}
        {stepHazardData.cloudburst?.map((poly, idx) => (
          <Polygon
            key={`cb-${scrubberIdx}-${idx}`}
            positions={poly.coords}
            pathOptions={HAZARD_STYLES.cloudburst}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                <span style={{ color: '#60a5fa', fontWeight: 700 }}>🌧 Cloudburst Warning Core</span><br />
                Zone: <strong>{poly.label}</strong><br />
                Model Probability: <strong>{Math.round(poly.prob * 100)}%</strong><br />
                Rate: &gt; 100 mm/hr trigger
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* Flash Flood Inundation Routing */}
        {stepHazardData.flood?.map((poly, idx) => (
          <Polygon
            key={`ff-${scrubberIdx}-${idx}`}
            positions={poly.coords}
            pathOptions={HAZARD_STYLES.flood}
          >
            <Tooltip sticky>
              <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                <span style={{ color: '#22d3ee', fontWeight: 700 }}>🌊 Flash Flood Corridor</span><br />
                Catchment: <strong>{poly.label}</strong><br />
                Surge Risk: <strong>{Math.round(poly.prob * 100)}%</strong><br />
                Kinematic Wave Routing Active
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* Regional Operational Hazard Markers */}
        {regionalMarkers.map(pin => (
          <Marker
            key={pin.id}
            position={pin.coords}
            icon={createPinIcon(pin)}
            eventHandlers={{
              click: () => onSelectHazard && onSelectHazard(pin),
            }}
          >
            <Tooltip direction="top" offset={[0, -20]}>
              <div style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: 11 }}>
                <strong>{pin.name}</strong> — {pin.basin}<br />
                {pin.details}
              </div>
            </Tooltip>
          </Marker>
        ))}

      </MapContainer>

      {/* Floating Subcontinent Map Overlays Quick-Toggle Bar */}
      <div className="subcontinent-map-quick-toggles">
        <button
          type="button"
          className={`quick-toggle-pill ${showDwrRings ? 'active' : ''}`}
          onClick={() => setShowDwrRings(!showDwrRings)}
          title="Toggle IMD Doppler Weather Radar Network Rings"
        >
          <span className="toggle-indicator-dot" />
          <span>IMD Radars</span>
        </button>

        <button
          type="button"
          className={`quick-toggle-pill ${showIsobars ? 'active' : ''}`}
          onClick={() => setShowIsobars(!showIsobars)}
          title="Toggle Synoptic Pressure Isobars & Monsoon Trough"
        >
          <span className="toggle-indicator-dot" />
          <span>Isobars</span>
        </button>

        <button
          type="button"
          className={`quick-toggle-pill ${showAwsStations ? 'active' : ''}`}
          onClick={() => setShowAwsStations(!showAwsStations)}
          title="Toggle National Automatic Weather Station (AWS) Network"
        >
          <span className="toggle-indicator-dot" />
          <span>AWS Cities</span>
        </button>
      </div>
    </div>
  );
}
