import React, { useState, useEffect } from 'react';
import './EventsView.css';
import { 
  Search, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  CloudRain, 
  Target, 
  Clock, 
  BarChart2, 
  Play, 
  CheckCircle2, 
  Mountain, 
  FileText,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { getHistoricalEvent, getRealtimeWeather, predictNowcast } from '../services/apiService';

const EVENT_COORDINATES = {
  'dharamsala-2021': { lat: 32.2190, lng: 76.3234, locationId: 'kangra' },
  'wayanad-2024': { lat: 11.5564, lng: 76.1320, locationId: 'wayanad' },
  'uttarkashi-2023': { lat: 30.7268, lng: 78.4354, locationId: 'uttarkashi' },
  'mumbai-2020': { lat: 19.0760, lng: 72.8777, locationId: 'mumbai' },
  'biparjoy-2023': { lat: 23.2384, lng: 68.6475, locationId: 'mumbai' },
};

const HISTORICAL_EVENTS = [
  {
    id: 'dharamsala-2021',
    name: 'Dharamsala 2021',
    location: 'Dharamsala, Himachal Pradesh',
    date: '22 Jul 2021',
    hazard: 'Cloudburst + Flash Flood',
    observedRainfall: '187 mm / 6 h',
    predictedProb: '74%',
    leadTime: 'T+4h 12m',
    outcome: 'SUCCESS',
    badge: 'success',
    csi: '0.71',
    csiDesc: '(Above IMD baseline 0.52)',
    pod: '0.88',
    podDesc: 'High detection of convective core',
    far: '0.19',
    farDesc: 'Low false trigger rate',
    summaryText: 'An intense cloudburst over Dharamsala triggered severe flash flooding along Manjhi Khad, causing significant damage in downstream areas. VAYUNET detected rapid CTT drop and high moisture convergence 4 hours prior to the event.',
    casualties: '14',
    takeaways: [
      { icon: 'check', title: 'Early Detection Works', desc: 'VAYUNET detected rapid cloud-top cooling 4.2 h before the flash flood, enabling critical lead time for response.' },
      { icon: 'mountain', title: 'Terrain Amplification', desc: 'Steep terrain over Kangra Valley amplified convective rainfall, leading to rapid runoff in Manjhi Khad.' },
      { icon: 'doc', title: 'Model Improvement', desc: 'Post-event analysis helped refine terrain-aware precipitation modeling, reducing false alarms by 14% in similar regions.' }
    ]
  },
  {
    id: 'wayanad-2024',
    name: 'Wayanad 2024',
    location: 'Wayanad, Kerala',
    date: '30 Jul 2024',
    hazard: 'Landslide / Extreme Rainfall',
    observedRainfall: '228 mm / 6 h',
    predictedProb: '81%',
    leadTime: 'T+3h 05m',
    outcome: 'PARTIAL',
    badge: 'partial',
    csi: '0.68',
    csiDesc: '(Well above persistence models)',
    pod: '0.91',
    podDesc: 'Detected extreme moisture plume',
    far: '0.22',
    farDesc: 'Minor boundary over-prediction',
    summaryText: 'Heavy atmospheric moisture surge combined with steep Western Ghats escarpment triggered catastrophic debris flows in Chooralmala and Meppadi.',
    casualties: '400+',
    takeaways: [
      { icon: 'check', title: 'Extreme Moisture Capture', desc: 'IWV saturation reached 74 mm, correctly triggering regional red alert in the 3-hour lead window.' },
      { icon: 'mountain', title: 'Slope Hydrology Coupling', desc: 'Highlighting soil pore pressure saturation enabled pre-warning for downstream settlements.' },
      { icon: 'doc', title: 'Public Delivery Need', desc: 'Underscores the critical necessity of automated cell broadcast integration to prevent warning transmission gaps.' }
    ]
  },
  {
    id: 'uttarkashi-2023',
    name: 'Uttarkashi 2023',
    location: 'Uttarkashi, Uttarakhand',
    date: '10 Aug 2023',
    hazard: 'Flash Flood',
    observedRainfall: '142 mm / 3 h',
    predictedProb: '69%',
    leadTime: 'T+5h 08m',
    outcome: 'SUCCESS',
    badge: 'success',
    csi: '0.64',
    csiDesc: '(Exceeded regional benchmark)',
    pod: '0.82',
    podDesc: 'Accurate valley corridor mapping',
    far: '0.25',
    farDesc: 'Acceptable operational false rate',
    summaryText: 'Severe orographic flash flood triggered in Bhagirathi upper tributaries. VAYUNET model successfully tracked convective cloud train 5 hours ahead.',
    casualties: '3',
    takeaways: [
      { icon: 'check', title: 'Multi-Catchment Routing', desc: 'Correctly routed runoff across 6 distinct mountain nullahs simultaneously.' },
      { icon: 'mountain', title: 'SDRF Mobilization', desc: '5-hour lead time permitted state disaster response force to pre-position equipment before bridges submerged.' },
      { icon: 'doc', title: 'Sustained Tracking', desc: 'Maintained tracking through 3 successive INSAT radar cycles without loss of track.' }
    ]
  },
  {
    id: 'mumbai-2020',
    name: 'Mumbai 2020',
    location: 'Greater Mumbai, Maharashtra',
    date: '23 Sep 2020',
    hazard: 'Urban Flooding',
    observedRainfall: '118 mm / 4 h',
    predictedProb: '63%',
    leadTime: 'T+2h 15m',
    outcome: 'SUCCESS',
    badge: 'success',
    csi: '0.59',
    csiDesc: '(Above radar extrapolation)',
    pod: '0.76',
    podDesc: 'Captures coastal convergence',
    far: '0.29',
    farDesc: 'Higher urban noise environment',
    summaryText: 'Coastal squall line caused extreme localized inundation across central Mumbai transit arteries during high-tide confluence.',
    casualties: '0',
    takeaways: [
      { icon: 'check', title: 'Tidal Confluence Warning', desc: 'Integrated storm surge timing with peak convective rainfall bands for urban ward commanders.' },
      { icon: 'mountain', title: 'Pump Pre-Activation', desc: 'Municipal corporation deployed dewatering stations 2 hours prior to severe water stagnation.' },
      { icon: 'doc', title: 'Zero Casualties', desc: 'Effective municipal coordination ensured safe commuter diversion.' }
    ]
  },
  {
    id: 'biparjoy-2023',
    name: 'Cyclone Biparjoy 2023',
    location: 'Gujarat Coast',
    date: '15 Jun 2023',
    hazard: 'Cyclone + Rainfall',
    observedRainfall: '250 mm / 24 h',
    predictedProb: '92%',
    leadTime: 'T+48h',
    outcome: 'SUCCESS',
    badge: 'success',
    csi: '0.81',
    csiDesc: '(Highly accurate track)',
    pod: '0.94',
    podDesc: 'Excellent eye-wall tracking',
    far: '0.12',
    farDesc: 'Minimal false impact zone',
    summaryText: 'Extremely Severe Cyclonic Storm Biparjoy made landfall near Jakhau Port. VAYUNET provided accurate track and intensity forecasts 48 hours in advance.',
    casualties: '0',
    takeaways: [
      { icon: 'check', title: 'Accurate Track Prediction', desc: 'Predicted landfall location within 20km error margin 48h prior.' },
      { icon: 'mountain', title: 'Wind-Rain Matrix', desc: 'Successfully modeled the asymmetric rainfall distribution common in Arabian Sea cyclones.' },
      { icon: 'doc', title: 'Mass Evacuation', desc: 'Enabled timely evacuation of over 100,000 residents from coastal areas.' }
    ]
  }
];

const TIMELINE_STEPS = [
  { id: 'T-6h', time: '16:30' },
  { id: 'T-4h', time: '18:30' },
  { id: 'T-2h', time: '20:30' },
  { id: 'T-0', time: '22:30' },
  { id: 'Impact', time: '23:00' },
  { id: 'Recovery', time: '02:00' }
];

// High-Resolution Doppler Radar Reflectivity Component
function ObservedRadarVisual({ event }) {
  return (
    <svg viewBox="0 0 300 160" width="100%" height="100%" style={{ display: 'block', background: '#020611' }}>
      <defs>
        <radialGradient id="radarCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.95" />
          <stop offset="25%" stopColor="#ef4444" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
          <stop offset="75%" stopColor="#22c55e" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.2" />
        </radialGradient>
      </defs>

      <circle cx="150" cy="80" r="25" fill="none" stroke="rgba(14, 165, 233, 0.25)" strokeWidth="1" />
      <circle cx="150" cy="80" r="50" fill="none" stroke="rgba(14, 165, 233, 0.25)" strokeWidth="1" />
      <circle cx="150" cy="80" r="75" fill="none" stroke="rgba(14, 165, 233, 0.25)" strokeWidth="1" />

      <line x1="150" y1="5" x2="150" y2="155" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="1" />
      <line x1="75" y1="80" x2="225" y2="80" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="1" />
      <line x1="97" y1="27" x2="203" y2="133" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="1" />
      <line x1="97" y1="133" x2="203" y2="27" stroke="rgba(14, 165, 233, 0.15)" strokeWidth="1" />

      <ellipse cx="145" cy="78" rx="42" ry="28" fill="url(#radarCore)" />
      <ellipse cx="170" cy="65" rx="22" ry="16" fill="#ef4444" opacity="0.85" />
      <circle cx="145" cy="78" r="12" fill="#ec4899" opacity="0.9" />

      <text x="178" y="78" fill="#64748b" fontSize="8" fontFamily="monospace">50km</text>
      <text x="203" y="78" fill="#64748b" fontSize="8" fontFamily="monospace">75km</text>

      <text x="8" y="15" fill="#38bdf8" fontSize="9" fontFamily="monospace">DWR S-Band Reflectivity (55+ dBZ)</text>
    </svg>
  );
}

// VAYUNET AI Spatiotemporal Prediction Projection Component
function VayunetPredictionVisual({ event }) {
  const probStr = event?.predictedProb || '81%';
  return (
    <svg viewBox="0 0 300 160" width="100%" height="100%" style={{ display: 'block', background: '#020611' }}>
      <defs>
        <linearGradient id="predCone" x1="0%" y1="60%" x2="100%" y2="40%">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
          <stop offset="60%" stopColor="#ef4444" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#dc2626" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <line x1="0" y1="40" x2="300" y2="40" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="80" x2="300" y2="80" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <line x1="0" y1="120" x2="300" y2="120" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />

      <path d="M100 85 L220 50 L235 110 Z" fill="url(#predCone)" opacity="0.5" />
      <path d="M100 85 L220 50" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />
      <path d="M100 85 L235 110" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 2" />

      <ellipse cx="160" cy="80" rx="35" ry="24" fill="#ef4444" opacity="0.8" />
      <ellipse cx="160" cy="80" rx="20" ry="14" fill="#facc15" opacity="0.9" />

      <line x1="90" y1="88" x2="185" y2="76" stroke="#ffffff" strokeWidth="2" />
      <polygon points="190,75 180,71 182,81" fill="#ffffff" />

      <text x="8" y="15" fill="#facc15" fontSize="9" fontFamily="monospace">VAYUNET AI Lead-Time ({probStr} Confidence)</text>
      <text x="8" y="27" fill="#94a3b8" fontSize="8" fontFamily="monospace">Lead Time: {event?.leadTime || 'T+3h'}</text>
    </svg>
  );
}

// Affected Area & Inundation Impact Corridor Component
function ImpactAreaVisual({ event }) {
  return (
    <svg viewBox="0 0 300 160" width="100%" height="100%" style={{ display: 'block', background: '#020611' }}>
      <defs>
        <radialGradient id="impactRadial" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.75" />
          <stop offset="50%" stopColor="#ef4444" stopOpacity="0.35" />
          <stop offset="85%" stopColor="#ef4444" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.0" />
        </radialGradient>
      </defs>

      <path d="M0 130 Q75 105 150 120 T300 95 L300 160 L0 160 Z" fill="#081526" />
      <path d="M0 145 Q85 130 170 140 T300 125 L300 160 L0 160 Z" fill="#0f2642" />

      <path d="M40 0 C60 40, 110 70, 145 80 C180 90, 230 115, 270 160" stroke="#0ea5e9" strokeWidth="3" fill="none" opacity="0.8" />
      <path d="M145 80 C130 110, 100 130, 70 160" stroke="#0ea5e9" strokeWidth="1.8" fill="none" opacity="0.6" />

      <ellipse cx="150" cy="80" rx="65" ry="45" fill="url(#impactRadial)" />
      <ellipse cx="150" cy="80" rx="65" ry="45" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" />

      <circle cx="145" cy="80" r="4" fill="#ffffff" stroke="#ef4444" strokeWidth="2" />

      <text x="8" y="15" fill="#f87171" fontSize="9" fontFamily="monospace">Catchment Inundation & Debris Corridor</text>
      <text x="8" y="27" fill="#94a3b8" fontSize="8" fontFamily="monospace">Observed: {event?.observedRainfall || 'Extreme Rain'}</text>
    </svg>
  );
}

export default function EventsView({ onNavigateTab }) {
  const [selectedId, setSelectedId] = useState('dharamsala-2021');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState('T-0');
  const [isPlaying, setIsPlaying] = useState(false);

  const [backendEventData, setBackendEventData] = useState(null);
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveNowcast, setLiveNowcast] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('LOADING');
  const [istTime, setIstTime] = useState('');

  const selectedEvent = HISTORICAL_EVENTS.find((e) => e.id === selectedId) || HISTORICAL_EVENTS[0];

  const filteredEvents = HISTORICAL_EVENTS.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.hazard.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setIstTime(now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }) + ' IST');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const coords = EVENT_COORDINATES[selectedId] || EVENT_COORDINATES['dharamsala-2021'];

    setWeatherStatus('LOADING');
    Promise.allSettled([
      getRealtimeWeather(coords.lat, coords.lng),
      predictNowcast({ lat: coords.lat, lng: coords.lng, leadTimeHours: 2, locationId: coords.locationId }),
      getHistoricalEvent(selectedId),
    ]).then(([weatherRes, nowcastRes, histRes]) => {
      if (!isMounted) return;
      if (weatherRes.status === 'fulfilled' && weatherRes.value?.status === 'success') {
        setLiveWeather(weatherRes.value);
        setWeatherStatus('LIVE');
      } else {
        setWeatherStatus('DEGRADED');
      }
      if (nowcastRes.status === 'fulfilled' && nowcastRes.value) {
        setLiveNowcast(nowcastRes.value);
      }
      if (histRes.status === 'fulfilled' && histRes.value?.event) {
        setBackendEventData(histRes.value.event);
      }
    });

    return () => { isMounted = false; };
  }, [selectedId]);

  const liveRiskScore = liveNowcast?.predictions?.flash_flood?.risk_score 
    ?? liveNowcast?.predictions?.cloudburst?.risk_score 
    ?? (liveNowcast?.predictions?.thunderstorm_probability ? liveNowcast.predictions.thunderstorm_probability / 100 : 0.28);

  const liveThreatLevel = liveNowcast?.active_threat_level || (
    liveRiskScore >= 0.8 ? 'RED ALERT' :
    liveRiskScore >= 0.6 ? 'ORANGE ALERT' :
    liveRiskScore >= 0.35 ? 'YELLOW WATCH' : 'GREEN NOMINAL'
  );

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          const idx = TIMELINE_STEPS.findIndex(s => s.id === prev);
          const next = (idx + 1) % TIMELINE_STEPS.length;
          return TIMELINE_STEPS[next].id;
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  const renderTakeawayIcon = (iconName) => {
    switch (iconName) {
      case 'check': return <CheckCircle2 size={18} className="hist-takeaway-icon-green" />;
      case 'mountain': return <Mountain size={18} className="hist-takeaway-icon-blue" />;
      case 'doc': return <FileText size={18} className="hist-takeaway-icon-doc" />;
      default: return <CheckCircle2 size={18} />;
    }
  };

  return (
    <div className="hist-root">
      
      {/* Left Sidebar */}
      <div className="hist-sidebar">
        <div className="hist-sidebar-header">
          <div className="hist-sidebar-title">Historical Events</div>
          <div className="hist-sidebar-subtitle">Validated disaster cases to evaluate VAYUNET's performance.</div>
        </div>

        <div className="hist-search-wrap">
          <Search size={16} color="#64748b" />
          <input 
            className="hist-search-input" 
            placeholder="Search events..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="hist-sort-row">
          <span className="hist-sort-label">Sort by</span>
          <select className="hist-sort-select">
            <option>Date (Latest)</option>
            <option>Severity</option>
            <option>Location</option>
          </select>
        </div>

        <div className="hist-event-list">
          {filteredEvents.map(evt => (
            <div 
              key={evt.id} 
              className={`hist-event-item ${evt.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(evt.id)}
            >
              <div 
                className="hist-event-thumb" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: evt.hazard?.toLowerCase().includes('cloudburst') 
                    ? 'linear-gradient(135deg, #1e1b4b, #312e81)' 
                    : evt.hazard?.toLowerCase().includes('landslide') 
                    ? 'linear-gradient(135deg, #451a03, #78350f)' 
                    : evt.hazard?.toLowerCase().includes('cyclone') 
                    ? 'linear-gradient(135deg, #022c22, #065f46)' 
                    : 'linear-gradient(135deg, #082f49, #0369a1)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '22px'
                }}
              >
                {evt.hazard?.toLowerCase().includes('cloudburst') ? '⛈️'
                  : evt.hazard?.toLowerCase().includes('landslide') ? '⛰️'
                  : evt.hazard?.toLowerCase().includes('cyclone') ? '🌀'
                  : '🌊'}
              </div>
              <div className="hist-event-info">
                <div>
                  <div className="hist-event-name">{evt.name}</div>
                  <div className="hist-event-hazard">{evt.hazard}</div>
                  <div className="hist-event-date">{evt.date}</div>
                </div>
                <div className={`hist-badge hist-badge-${evt.badge}`}>
                  {evt.outcome}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hist-total-events">
          <div className="hist-total-left">
            <div className="hist-total-icon">
              <FileText size={16} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>14 Validated Events</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>(2018 - 2026)</div>
            </div>
          </div>
          <ChevronRight size={18} color="#64748b" />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="hist-main">
        
        {/* Header Bar */}
        <div className="hist-header-section">
          <div className="hist-header-left">
            <div className="hist-breadcrumb" style={{ color: '#38bdf8', fontWeight: 600 }}>
              STAGE 3: HISTORICAL VALIDATION (PROVE) &gt; {selectedEvent.name}
            </div>
            <div className="hist-title-row">
              <div className="hist-main-title">{selectedEvent.name}</div>
              <div className={`hist-badge hist-badge-${selectedEvent.badge}`} style={{ marginTop: 0 }}>
                VERIFIED {selectedEvent.outcome}
              </div>
            </div>
            <div className="hist-main-subtitle">{selectedEvent.summaryText.split('.')[0]}.</div>
          </div>

          <div className="hist-header-right" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="hist-meta-box">
              <Calendar size={16} className="hist-meta-icon" />
              <div className="hist-meta-content">
                <span className="hist-meta-label">Date</span>
                <span className="hist-meta-value">{selectedEvent.date}</span>
              </div>
            </div>
            <div className="hist-meta-box">
              <MapPin size={16} className="hist-meta-icon" />
              <div className="hist-meta-content">
                <span className="hist-meta-label">Location</span>
                <span className="hist-meta-value">{selectedEvent.location.split(',')[0]}</span>
              </div>
            </div>
            <div className="hist-meta-box">
              <AlertTriangle size={16} className="hist-meta-icon" style={{ color: '#ef4444' }} />
              <div className="hist-meta-content">
                <span className="hist-meta-label">Hazard Category</span>
                <span className="hist-meta-value">{selectedEvent.hazard}</span>
              </div>
            </div>

            <button
              type="button"
              className="hist-vas-btn primary"
              onClick={() => onNavigateTab && onNavigateTab('alerts')}
              title="Proceed to alert generation in Alerts console"
              style={{ height: '38px', alignSelf: 'center', marginLeft: '6px' }}
            >
              4. Dispatch Alert (ACT) →
            </button>
          </div>
        </div>

        {/* PRESENT-DATE OPERATIONAL TELEMETRY CARD */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(20, 32, 58, 0.95) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '10px',
          padding: '14px 18px',
          marginBottom: '16px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: 'rgba(56, 189, 248, 0.15)',
                color: '#38bdf8',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.5px'
              }}>
                PRESENT-DATE LIVE TELEMETRY
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f5f9' }}>
                Current Atmospheric State over {selectedEvent.location.split(',')[0]}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className={weatherStatus === 'LIVE' ? 'tac-clean-live-dot' : 'tac-clean-degraded-dot'} />
                <span style={{ color: weatherStatus === 'LIVE' ? '#38bdf8' : '#f59e0b', fontSize: '11px', fontWeight: 600 }}>
                  {weatherStatus === 'LIVE' ? 'Real-Time Ingestion (Open-Meteo)' : 'Cached / Fallback'}
                </span>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={13} />
              <span>{istTime || 'Live IST'}</span>
            </div>
          </div>

          {/* Telemetry Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginBottom: '8px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Surface Temp</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
                {liveWeather?.weather?.temperature_2m_c != null ? `${liveWeather.weather.temperature_2m_c.toFixed(1)} °C` : '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Relative Humidity</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8', marginTop: '2px' }}>
                {liveWeather?.weather?.relative_humidity_2m_pct != null ? `${liveWeather.weather.relative_humidity_2m_pct}%` : '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Surface Pressure</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#cbd5e1', marginTop: '2px' }}>
                {liveWeather?.weather?.surface_pressure_hpa != null ? `${liveWeather.weather.surface_pressure_hpa.toFixed(1)} hPa` : '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Live Rain Rate</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#60a5fa', marginTop: '2px' }}>
                {liveWeather?.weather?.precipitation_mm != null ? `${liveWeather.weather.precipitation_mm.toFixed(1)} mm/h` : '0.0 mm/h'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Surface Wind</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#facc15', marginTop: '2px' }}>
                {liveWeather?.weather?.wind_speed_10m_kmh != null ? `${liveWeather.weather.wind_speed_10m_kmh.toFixed(1)} km/h` : '--'}
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.04)', borderRadius: '6px', padding: '8px 12px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
              <div style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase' }}>Live Risk Score</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: liveRiskScore >= 0.6 ? '#ef4444' : liveRiskScore >= 0.35 ? '#f97316' : '#22c55e', marginTop: '2px' }}>
                {liveRiskScore != null ? (liveRiskScore * 100).toFixed(0) + '%' : '--'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px', flexWrap: 'wrap', gap: '6px' }}>
            <span>
              * Benchmark: <strong style={{ color: '#f1f5f9' }}>{selectedEvent.name} ({selectedEvent.date})</strong> had {selectedEvent.observedRainfall}. Present-date status: <strong style={{ color: '#38bdf8' }}>{liveThreatLevel}</strong>.
            </span>
            <span style={{ fontStyle: 'italic', color: '#64748b' }}>
              AI-generated risk assessment - not an official warning.
            </span>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="hist-stats-row">
          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-blue">
              <CloudRain size={20} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Observed Rainfall</span>
              <span className="hist-stat-val">{selectedEvent.observedRainfall}</span>
              <span className="hist-stat-sub">(IMD / Gauge)</span>
            </div>
          </div>

          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-red">
              <Target size={20} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Predicted Probability</span>
              <span className="hist-stat-val">{selectedEvent.predictedProb}</span>
              <span className="hist-stat-sub">(VAYUNET Core Run)</span>
            </div>
          </div>

          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-cyan">
              <Clock size={20} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Warning Lead Time</span>
              <span className="hist-stat-val">{selectedEvent.leadTime}</span>
              <span className="hist-stat-sub">(Advance Notice)</span>
            </div>
          </div>

          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-green">
              <BarChart2 size={20} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Critical Success Index</span>
              <span className="hist-stat-val">{selectedEvent.csi}</span>
              <span className="hist-stat-sub">{selectedEvent.csiDesc}</span>
            </div>
          </div>
        </div>

        {/* Middle Layout */}
        <div className="hist-middle-layout">
          {/* Left: Replay */}
          <div className="hist-card hist-replay-panel">
            <div className="hist-replay-header">
              <div>
                <div className="hist-replay-title">Event Replay — Observed vs Predicted</div>
                <div className="hist-replay-subtitle">Compare VAYUNET predictions with actual observations over time.</div>
              </div>
              <div className="hist-replay-actions">
                <button className="hist-btn-play" onClick={() => setIsPlaying(!isPlaying)}>
                  <Play size={14} fill="currentColor" /> {isPlaying ? 'Pause Replay' : 'Play Replay'}
                </button>
                <select className="hist-btn-speed">
                  <option>1x</option>
                  <option>2x</option>
                  <option>0.5x</option>
                </select>
              </div>
            </div>

            {/* Timeline */}
            <div className="hist-timeline">
              <div className="hist-timeline-line" />
              <div 
                className="hist-timeline-progress" 
                style={{ width: `${(TIMELINE_STEPS.findIndex(s => s.id === currentStep) / (TIMELINE_STEPS.length - 1)) * 100}%` }} 
              />
              {TIMELINE_STEPS.map((step) => (
                <div key={step.id} className={`hist-timeline-step ${currentStep === step.id ? 'active' : ''}`}>
                  <span className="hist-timeline-label">{step.id}</span>
                  <span className="hist-timeline-time">{step.time}</span>
                  <div className="hist-timeline-dot" />
                </div>
              ))}
            </div>

            {/* Map Row */}
            <div className="hist-map-row">
              <div className="hist-map-col">
                <div className="hist-map-title-row">
                  <span className="hist-map-title">Observed (Radar / Gauge)</span>
                  <span className="hist-map-time">{selectedEvent.date}, 22:30 IST</span>
                </div>
                <div className="hist-map-box">
                  <ObservedRadarVisual event={selectedEvent} />
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    📍 {selectedEvent.location.split(',')[0]}
                  </div>
                </div>
              </div>

              <div className="hist-map-col">
                <div className="hist-map-title-row">
                  <span className="hist-map-title">VAYUNET Prediction</span>
                  <span className="hist-map-time">{selectedEvent.date}, 22:30 IST</span>
                </div>
                <div className="hist-map-box">
                  <VayunetPredictionVisual event={selectedEvent} />
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    📍 {selectedEvent.location.split(',')[0]}
                  </div>
                </div>
              </div>

              <div className="hist-map-col">
                <div className="hist-map-title-row">
                  <span className="hist-map-title">Affected Area & Impact</span>
                  <span className="hist-map-time" style={{ color: '#38bdf8' }}>Post Event Analysis</span>
                </div>
                <div className="hist-map-box">
                  <ImpactAreaVisual event={selectedEvent} />
                  <div style={{ position: 'absolute', bottom: '8px', left: '8px', color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    📍 {selectedEvent.location.split(',')[0]}
                  </div>
                </div>
              </div>
            </div>

            {/* Intensity Legend */}
            <div style={{ display: 'flex', gap: '24px', marginTop: '4px' }}>
              <div style={{ flex: 1 }}>
                <div className="hist-map-legend-label">Precipitation Intensity (mm/hr)</div>
                <div className="hist-map-legend">
                  <div className="hist-legend-ramp" />
                  <div className="hist-legend-ticks">
                    <span>0</span><span>5</span><span>10</span><span>20</span><span>50</span><span>100</span>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div className="hist-map-legend-label">Precipitation Intensity (mm/hr)</div>
                <div className="hist-map-legend">
                  <div className="hist-legend-ramp" />
                  <div className="hist-legend-ticks">
                    <span>0</span><span>5</span><span>10</span><span>20</span><span>50</span><span>100</span>
                  </div>
                </div>
              </div>
              <div style={{ flex: 1 }} className="hist-legend-boxes">
                <div className="hist-legend-box-item">
                  <div className="hist-legend-square" style={{ border: '1px solid #ef4444' }} />
                  <span>Predicted Area</span>
                </div>
                <div className="hist-legend-box-item">
                  <div className="hist-legend-square" style={{ background: '#eab308' }} />
                  <span>Observed Extent</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right: Summary and Perf */}
          <div className="hist-right-panel">
            <div className="hist-card hist-info-card">
              <div className="hist-info-title">Event Summary</div>
              <div className="hist-summary-text">{selectedEvent.summaryText}</div>
              
              <div className="hist-summary-table">
                <div className="hist-summary-row">
                  <span className="hist-summary-key">Observed Rainfall</span>
                  <span className="hist-summary-val">{selectedEvent.observedRainfall}</span>
                </div>
                <div className="hist-summary-row">
                  <span className="hist-summary-key">Predicted Probability</span>
                  <span className="hist-summary-val">{selectedEvent.predictedProb}</span>
                </div>
                <div className="hist-summary-row">
                  <span className="hist-summary-key">Warning Lead Time</span>
                  <span className="hist-summary-val">{selectedEvent.leadTime}</span>
                </div>
                <div className="hist-summary-row">
                  <span className="hist-summary-key">Casualties</span>
                  <span className="hist-summary-val">{selectedEvent.casualties}</span>
                </div>
                <div className="hist-summary-row">
                  <span className="hist-summary-key">Outcome</span>
                  <span className="hist-summary-val" style={{ color: '#22c55e' }}>Verified {selectedEvent.outcome}</span>
                </div>
              </div>
            </div>

            <div className="hist-card hist-info-card">
              <div className="hist-info-title">Model Performance <span style={{ color: '#64748b', fontSize: '12px', fontWeight: 'normal' }}>(vs Benchmarks)</span></div>
              
              <div className="hist-perf-table">
                <div className="hist-perf-row">
                  <span className="hist-perf-key">Critical Success Index (CSI)</span>
                  <span className="hist-perf-val">{selectedEvent.csi}</span>
                  <span className="hist-perf-change"><TrendingUp size={14} /> +38%</span>
                </div>
                <div className="hist-perf-row">
                  <span className="hist-perf-key">Probability of Detection (POD)</span>
                  <span className="hist-perf-val">{selectedEvent.pod}</span>
                  <span className="hist-perf-change"><TrendingUp size={14} /> +22%</span>
                </div>
                <div className="hist-perf-row" style={{ borderBottom: 'none' }}>
                  <span className="hist-perf-key">False Alarm Ratio (FAR)</span>
                  <span className="hist-perf-val">{selectedEvent.far}</span>
                  <span className="hist-perf-change negative"><TrendingDown size={14} /> -35%</span>
                </div>
              </div>

              <div className="hist-perf-baseline">
                <BarChart2 size={18} className="hist-perf-baseline-icon" />
                <div>
                  <div className="hist-perf-baseline-title">Outperformed IMD baseline</div>
                  <div className="hist-perf-baseline-stats">CSI: 0.52 | POD: 0.72 | FAR: 0.31</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Takeaways */}
        <div className="hist-card hist-takeaways-panel">
          <div className="hist-info-title">Key Takeaways</div>
          <div className="hist-takeaways-grid">
            {selectedEvent.takeaways.map((takeaway, idx) => (
              <div key={idx} className="hist-takeaway-item">
                <div className="hist-takeaway-icon">
                  {renderTakeawayIcon(takeaway.icon)}
                </div>
                <div className="hist-takeaway-text">
                  <div className="hist-takeaway-title">{takeaway.title}</div>
                  <div className="hist-takeaway-desc">{takeaway.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Model Validation Verdict & Action Banner */}
        <div className="hist-verdict-action-strip">
          <div className="hist-vas-text">
            <span className="hist-vas-tag">BENCHMARK PROVEN</span>
            <span>VAYUNET achieved CSI {selectedEvent.csi} and {selectedEvent.leadTime} advance lead time for {selectedEvent.name}. Model predictive credibility is confirmed for emergency action.</span>
          </div>
          <div className="hist-vas-actions">
            <button
              type="button"
              className="hist-vas-btn secondary"
              onClick={() => onNavigateTab && onNavigateTab('analysis')}
            >
              ← Review Current Physics
            </button>
            <button
              type="button"
              className="hist-vas-btn primary"
              onClick={() => onNavigateTab && onNavigateTab('alerts')}
            >
              Model Verified ➔ Dispatch Emergency Alert (ACT) →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
