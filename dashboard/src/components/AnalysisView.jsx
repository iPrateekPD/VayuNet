import React, { useState, useRef } from 'react';
import './AnalysisView.css';
import { 
  MapPin, 
  ChevronDown, 
  AlertTriangle,
  Clock,
  Activity,
  Snowflake,
  Droplets,
  Zap,
  Mountain,
  Wind,
  Thermometer,
  Droplet,
  CloudSnow,
  Lightbulb,
  Plus,
  Minus
} from 'lucide-react';
import { Polygon, Polyline, Marker } from 'react-leaflet';
import L from 'leaflet';
import { SHARED_EVENTS } from '../data/sharedEventData';
import OperationalMap from './OperationalMap';
import { analysisApi } from '../services/api/analysis';

// Custom DivIcon creator for crisp map badges and markers
function createHtmlIcon(html, size = [20, 20], anchor = [10, 10]) {
  return L.divIcon({
    html,
    className: 'ana-leaflet-div-icon',
    iconSize: size,
    iconAnchor: anchor,
  });
}

const SECTOR_OPTIONS = [
  'Chamoli, Uttarakhand',
  'Kangra, Himachal Pradesh',
  'Wayanad, Kerala',
  'Mumbai MMR, Maharashtra',
  'Rudraprayag, Uttarakhand',
  'Pithoragarh, Uttarakhand',
  'Uttarkashi, Uttarakhand',
];

export default function AnalysisView({ onNavigateTab, globalSelectedLocation, setGlobalSelectedLocation }) {
  const selectedEventId = globalSelectedLocation && globalSelectedLocation.startsWith('VN-EVT') 
    ? globalSelectedLocation 
    : 'VN-EVT-2026-0922-CHM';

  const eventData = SHARED_EVENTS.find(e => e.id === selectedEventId) || SHARED_EVENTS.find(e => e.id === 'VN-EVT-2026-0922-CHM');
  const selectedSector = eventData.location;
  const setSelectedSector = setGlobalSelectedLocation || (() => {});
  const [isSectorOpen, setIsSectorOpen] = useState(false);
  const [activeLayer, setActiveLayer] = useState('satellite'); // 'satellite' | 'radar'

  // Coordinates for Chamoli, Uttarakhand
  const chamoliCenter = [30.41, 79.32];
  const [currentCenter, setCurrentCenter] = useState(chamoliCenter);
  const [currentZoom, setCurrentZoom] = useState(9);

  const [analysisData, setAnalysisData] = useState(null);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('live');

  React.useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoadingAnalysis(true);
      setConnectionStatus('syncing');
      try {
         const data = await analysisApi.getRiskAnalysis(selectedSector);
         setAnalysisData(data);
         setConnectionStatus(data.status === 'fallback' ? 'fallback' : 'live');
      } catch (err) {
         setConnectionStatus('fallback');
      } finally {
         setIsLoadingAnalysis(false);
      }
    };
    fetchAnalysis();
  }, [selectedSector]);

  // Multi-band Doppler radar convective plume contours (Chamoli - Alaknanda Valley)
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

  // 5 Contributing Factors data
  const contributingFactors = [
    {
      name: 'Cloud-Top Temperature Drop',
      pct: 38,
      icon: Snowflake,
      color: '#f87171',
      barGradient: 'linear-gradient(90deg, #f87171, #ef4444)',
    },
    {
      name: 'Moisture (Integrated Water Vapor)',
      pct: 26,
      icon: Droplets,
      color: '#38bdf8',
      barGradient: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
    },
    {
      name: 'CAPE (Convective Instability)',
      pct: 22,
      icon: Zap,
      color: '#facc15',
      barGradient: 'linear-gradient(90deg, #eab308, #facc15)',
    },
    {
      name: 'Terrain / Orography',
      pct: 8,
      icon: Mountain,
      color: '#4ade80',
      barGradient: 'linear-gradient(90deg, #22c55e, #4ade80)',
    },
    {
      name: 'Wind Shear',
      pct: 6,
      icon: Wind,
      color: '#c084fc',
      barGradient: 'linear-gradient(90deg, #a855f7, #c084fc)',
    }
  ];

  return (
    <div className="ana-page-wrapper">
      <div className="ana-container">
        
        {/* =========================================================
            1. TOP BAR / TITLE & FILTER SECTION
            ========================================================= */}
        <div className="ana-top-bar">
          <div className="ana-top-left">
            <h1 className="ana-page-title">Analysis</h1>
            <p className="ana-page-subtitle">Understand why VAYUNET predicts this weather event</p>
            <div className="ana-event-id-tag">
              <span className="ana-event-id-label">EVENT</span>
              <span className="ana-event-id-val">{eventData.id} &middot; {eventData.location}</span>
            </div>
          </div>

          <div className="ana-top-center">
            {/* Sector Selector Dropdown */}
            <div className="ana-sector-wrapper">
              <button
                type="button"
                className="ana-sector-pill"
                onClick={() => setIsSectorOpen((prev) => !prev)}
                aria-expanded={isSectorOpen}
              >
                <MapPin size={14} className="ana-sector-pin" />
                <span className="ana-sector-name">{selectedSector}</span>
                <ChevronDown size={14} className="ana-sector-chevron" />
              </button>

              {isSectorOpen && (
                <div className="ana-sector-dropdown-menu">
                  {SECTOR_OPTIONS.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`ana-sector-option ${sec === selectedSector ? 'active' : ''}`}
                      onClick={() => {
                        const matchingEvent = SHARED_EVENTS.find(e => e.location === sec);
                        if (matchingEvent) {
                          setSelectedSector(matchingEvent.id);
                        } else {
                          setSelectedSector(sec);
                        }
                        setIsSectorOpen(false);
                      }}
                    >
                      <MapPin size={12} />
                      <span>{sec}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="ana-top-right">
            <div className="ana-live-pill">
              <span className="ana-timestamp-text">08 Sep 2026, 11:52 PM IST</span>
              {connectionStatus === 'syncing' && <span className="ana-live-dot" style={{ backgroundColor: '#eab308' }} />}
              {connectionStatus === 'syncing' && <span className="ana-live-text" style={{ color: '#eab308' }}>Syncing...</span>}
              {connectionStatus === 'live' && <span className="ana-live-dot" />}
              {connectionStatus === 'live' && <span className="ana-live-text">Live</span>}
              {connectionStatus === 'fallback' && <span className="ana-live-dot" style={{ backgroundColor: '#ef4444' }} />}
              {connectionStatus === 'fallback' && <span className="ana-live-text" style={{ color: '#ef4444' }}>Offline</span>}
            </div>
          </div>
        </div>

        {/* =========================================================
            2. MAIN DASHBOARD 2-COLUMN GRID
            ========================================================= */}
        <div className="ana-main-grid">
          
          {/* ---------------- LEFT COLUMN ---------------- */}
          <div className="ana-left-col">
            
            {/* CARD 1: Current Situation (Map) */}
            <div className="ana-card ana-map-card">
              <div className="ana-card-header">
                <div className="ana-card-header-left">
                  <div className="ana-icon-badge-blue">
                    <Activity size={18} color="#ffffff" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="ana-card-title">Current Situation</h2>
                    <p className="ana-card-subtitle">Satellite + Radar view with key atmospheric indicators</p>
                  </div>
                </div>

                <div className="ana-layer-toggle-group">
                  <button
                    type="button"
                    className={`ana-layer-toggle-btn ${activeLayer === 'satellite' ? 'active' : ''}`}
                    onClick={() => setActiveLayer('satellite')}
                  >
                    Satellite
                  </button>
                  <button
                    type="button"
                    className={`ana-layer-toggle-btn ${activeLayer === 'radar' ? 'active' : ''}`}
                    onClick={() => setActiveLayer('radar')}
                  >
                    Radar
                  </button>
                </div>
              </div>

              {/* Interactive Map View */}
              <div className="ana-map-container-inner">
                <OperationalMap 
                  mode="analysis" 
                  eventData={{ ...eventData, coords: currentCenter }}
                >
                  {/* Multi-Band Convective Radar Overlay */}
                  <Polygon
                    positions={radarOuterHalo}
                    pathOptions={{
                      color: '#00e5ff',
                      fillColor: '#00b4d8',
                      fillOpacity: 0.38,
                      weight: 1,
                    }}
                  />
                  <Polygon
                    positions={radarGreenBand}
                    pathOptions={{
                      color: '#22c55e',
                      fillColor: '#16a34a',
                      fillOpacity: 0.48,
                      weight: 1,
                    }}
                  />
                  <Polygon
                    positions={radarYellowBand}
                    pathOptions={{
                      color: '#eab308',
                      fillColor: '#ca8a04',
                      fillOpacity: 0.58,
                      weight: 1,
                    }}
                  />
                  <Polygon
                    positions={radarOrangeBand}
                    pathOptions={{
                      color: '#f97316',
                      fillColor: '#ea580c',
                      fillOpacity: 0.72,
                      weight: 1.2,
                    }}
                  />
                  <Polygon
                    positions={radarCorePlume}
                    pathOptions={{
                      color: '#ef4444',
                      fillColor: '#dc2626',
                      fillOpacity: 0.88,
                      weight: 1.5,
                    }}
                  />
                  <Polygon
                    positions={radarExtremeCore}
                    pathOptions={{
                      color: '#991b1b',
                      fillColor: '#7f1d1d',
                      fillOpacity: 0.96,
                      weight: 1.5,
                    }}
                  />

                  {/* Alaknanda River Polyline */}
                  <Polyline
                    positions={alaknandaRiver}
                    pathOptions={{ color: '#00b4d8', weight: 2.8, opacity: 0.9 }}
                  />

                  {/* Chamoli Target Marker with badge */}
                  <Marker
                    position={chamoliCenter}
                    icon={createHtmlIcon(`
                      <div class="ana-map-target-cluster">
                        <div class="ana-target-outer-ring">
                          <div class="ana-target-inner-core"></div>
                        </div>
                        <div class="ana-target-label-badge">Chamoli</div>
                      </div>
                    `, [120, 24], [8, 12])}
                  />

                  {/* Joshimath Marker */}
                  <Marker
                    position={[30.556, 79.566]}
                    icon={createHtmlIcon(`
                      <div class="ana-map-loc-cluster">
                        <div class="ana-loc-dot"></div>
                        <div class="ana-loc-text">Joshimath</div>
                      </div>
                    `, [90, 20], [4, 10])}
                  />

                  {/* Rudraprayag Marker */}
                  <Marker
                    position={[30.285, 78.981]}
                    icon={createHtmlIcon(`
                      <div class="ana-map-loc-cluster">
                        <div class="ana-loc-dot"></div>
                        <div class="ana-loc-text">Rudraprayag</div>
                      </div>
                    `, [100, 20], [4, 10])}
                  />

                  {/* Alaknanda River Marker Callout */}
                  <Marker
                    position={[30.27, 79.35]}
                    icon={createHtmlIcon(`
                      <div class="ana-map-river-cluster">
                        <div class="ana-river-dot"></div>
                        <div class="ana-river-text">Alaknanda River</div>
                      </div>
                    `, [120, 20], [4, 10])}
                  />
                </OperationalMap>

                {/* Overlaid Compass Rose (Top-Left) */}
                <div className="ana-map-compass-badge" title="North orientation">
                  <span className="ana-compass-arrow">▲</span>
                  <span className="ana-compass-n">N</span>
                </div>

                {/* Overlaid Distance Scale Bar (Bottom-Left) */}
                <div className="ana-map-scale-bar">
                  <div className="ana-scale-ticks">
                    <span className="ana-scale-tick tick-0">0</span>
                    <span className="ana-scale-tick tick-10">10</span>
                    <span className="ana-scale-tick tick-20">20</span>
                    <span className="ana-scale-tick tick-40">40 km</span>
                  </div>
                  <div className="ana-scale-ruler">
                    <div className="ana-ruler-segment seg-1" />
                    <div className="ana-ruler-segment seg-2" />
                    <div className="ana-ruler-segment seg-3" />
                  </div>
                </div>

                {/* Overlaid Precipitation Intensity Legend (Bottom-Right) */}
                <div className="ana-map-legend-box">
                  <div className="ana-legend-title">Precipitation Intensity (mm/hr)</div>
                  <div className="ana-legend-gradient-bar" />
                  <div className="ana-legend-values">
                    <span>0</span>
                    <span>10</span>
                    <span>20</span>
                    <span>50</span>
                    <span>100</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: Atmospheric Conditions (Current) */}
            <div className="ana-card ana-atmospheric-card">
              <h2 className="ana-section-title">Atmospheric Conditions (Current)</h2>

              <div className="ana-atm-metrics-grid">
                {/* Metric 1: CAPE */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Thermometer size={24} color="#ef4444" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">CAPE</span>
                    <span className="ana-atm-val" style={{ color: '#ef4444' }}>2450 J/kg</span>
                    <span className="ana-atm-badge badge-high">High</span>
                  </div>
                </div>

                {/* Metric 2: IWV */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Droplet size={24} color="#38bdf8" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">IWV</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>48 mm</span>
                    <span className="ana-atm-badge badge-high">High</span>
                  </div>
                </div>

                {/* Metric 3: Vertical Shear */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <Wind size={24} color="#38bdf8" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">Vertical Shear</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>18 m/s</span>
                    <span className="ana-atm-badge badge-mod">Moderate</span>
                  </div>
                </div>

                {/* Metric 4: CTT Drop Rate */}
                <div className="ana-atm-box">
                  <div className="ana-atm-box-left">
                    <CloudSnow size={24} color="#cbd5e1" className="ana-atm-icon" />
                  </div>
                  <div className="ana-atm-box-content">
                    <span className="ana-atm-label">CTT Drop Rate</span>
                    <span className="ana-atm-val" style={{ color: '#f8fafc' }}>-12 °C/hr</span>
                    <span className="ana-atm-badge badge-high">High</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ---------------- RIGHT COLUMN ---------------- */}
          <div className="ana-right-col">
            
            {/* CARD 1: AI Analysis */}
            <div className="ana-card ana-ai-analysis-card" style={{ position: 'relative' }}>
              {isLoadingAnalysis && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15,23,42,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                     <span className="ana-spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(56, 189, 248, 0.3)', borderTopColor: '#38bdf8', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                     Analyzing...
                  </span>
                </div>
              )}
              <div className="ana-ai-header-row">
                <div className="ana-ai-header-left">
                  <AlertTriangle size={24} color="#ef4444" strokeWidth={2.2} />
                  <span className="ana-ai-title">AI Analysis</span>
                  <span className="ana-ai-conf-badge">High Confidence ({analysisData?.confidence || eventData.confidence || '82%'})</span>
                </div>

                <div className="ana-ai-header-right">
                  <span className="ana-risk-label">Risk Level</span>
                  <span className="ana-risk-val">{analysisData?.riskLevel || eventData.peakRisk || eventData.currentRisk || 'HIGH'}</span>
                  <div className="ana-risk-time-row">
                    <Clock size={12} color="#94a3b8" />
                    <span>Likely within</span>
                    <strong>{eventData.leadTime || '1h 45m'}</strong>
                  </div>
                </div>
              </div>

              <div className="ana-ai-body">
                <h3 className="ana-ai-lead-headline">
                  <span className="ana-headline-alert">Elevated {eventData.hazard.toLowerCase()} risk</span>{' '}
                  <span className="ana-headline-cause">due to rapid cloud-top cooling and high moisture convergence.</span>
                </h3>
                <p className="ana-ai-paragraph">
                  Strong convective activity is developing over the {eventData.location.split(',')[0]} region, with favorable atmospheric conditions for intense rainfall in the next 1–3 hours.
                </p>
                <div className="ana-ai-actions">
                  <button 
                    className="ana-btn-secondary"
                    onClick={() => {
                      if(setGlobalSelectedLocation) setGlobalSelectedLocation(eventData.id);
                      if(onNavigateTab) onNavigateTab('events');
                    }}
                  >
                    View Event &rarr;
                  </button>
                  <button 
                    className="ana-btn-primary"
                    onClick={() => {
                      if(setGlobalSelectedLocation) setGlobalSelectedLocation(eventData.id);
                      if(onNavigateTab) onNavigateTab('alerts');
                    }}
                  >
                    Create Alert &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* CARD 2: Key Contributing Factors */}
            <div className="ana-card ana-factors-card">
              <div className="ana-card-header">
                <div className="ana-card-header-left">
                  <div className="ana-icon-badge-teal">
                    <Activity size={18} color="#2dd4bf" strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="ana-card-title">Key Contributing Factors</h2>
                    <p className="ana-card-subtitle">How much each factor influences the prediction</p>
                  </div>
                </div>
              </div>

              <div className="ana-factors-list">
                {contributingFactors.map((factor) => {
                  const IconComponent = factor.icon;
                  return (
                    <div key={factor.name} className="ana-factor-row">
                      <div className="ana-factor-info">
                        <IconComponent size={15} color="#38bdf8" className="ana-factor-icon" />
                        <span className="ana-factor-name">{factor.name}</span>
                      </div>

                      <div className="ana-factor-bar-wrapper">
                        <div className="ana-factor-bar-track">
                          <div 
                            className="ana-factor-bar-fill" 
                            style={{ 
                              width: `${factor.pct}%`, 
                              background: factor.barGradient 
                            }} 
                          />
                        </div>
                        <span className="ana-factor-pct" style={{ color: factor.color }}>
                          {factor.pct}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CARD 3: What This Means */}
            <div className="ana-card ana-what-means-card">
              <div className="ana-what-means-content">
                <div className="ana-bulb-badge">
                  <Lightbulb size={24} color="#2dd4bf" strokeWidth={2} />
                </div>
                <div className="ana-what-means-text">
                  <h3 className="ana-what-means-title">What This Means</h3>
                  <p className="ana-what-means-desc">
                    Rapid cloud-top cooling, high moisture and orographic uplift over the Himalayan terrain increase the probability of a cloudburst. Continued monitoring is advised.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================
            3. DATA SOURCES FOOTER
            ========================================================= */}
        <div className="ana-data-sources-footer">
          <div className="ana-ds-left">
            <span className="ana-ds-title">DATA SOURCES</span>
            <span className="ana-ds-list">INSAT-3D/3DR &middot; IMDAA &middot; CartoDEM &middot; IMD Observations</span>
          </div>
          <div className="ana-ds-right">
            <span className="ana-ds-live-dot" />
            <span className="ana-ds-live-text">LIVE &middot; Updated 2 min ago</span>
          </div>
        </div>

      </div>
    </div>
  );
}
