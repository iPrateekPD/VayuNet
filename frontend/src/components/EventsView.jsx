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
  TrendingUp,
  TrendingDown,
  Wind,
  Zap
} from 'lucide-react';

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
      { icon: 'check', title: 'Early Detection Proven', desc: 'VAYUNET detected rapid cloud-top cooling 4.2 h before the flash flood, providing critical advance notice.' },
      { icon: 'mountain', title: 'Terrain Amplification', desc: 'Steep terrain over Kangra Valley amplified convective rainfall, causing rapid runoff in Manjhi Khad.' },
      { icon: 'doc', title: 'Model Improvement', desc: 'Post-event analysis helped refine terrain-aware precipitation modeling, reducing false alarms by 14%.' }
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

export default function EventsView({ onNavigateTab }) {
  const [selectedId, setSelectedId] = useState('dharamsala-2021');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentStep, setCurrentStep] = useState('T-0');
  const [isPlaying, setIsPlaying] = useState(false);

  const selectedEvent = HISTORICAL_EVENTS.find((e) => e.id === selectedId) || HISTORICAL_EVENTS[0];

  const filteredEvents = HISTORICAL_EVENTS.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.hazard.toLowerCase().includes(searchQuery.toLowerCase())
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

  const getHazardIcon = (hazard) => {
    if (hazard.includes('Cloudburst')) return <CloudRain size={16} color="#38bdf8" />;
    if (hazard.includes('Cyclone')) return <Wind size={16} color="#06b6d4" />;
    if (hazard.includes('Landslide')) return <Mountain size={16} color="#eab308" />;
    return <AlertTriangle size={16} color="#ef4444" />;
  };

  return (
    <div className="hist-root">
      {/* LEFT SIDEBAR: EVENT SELECTOR */}
      <div className="hist-sidebar">
        <div className="hist-sidebar-header">
          <div className="hist-sidebar-title">Historical Disasters</div>
          <div className="hist-sidebar-subtitle">Validated disaster archives evaluating VAYUNET model accuracy</div>
        </div>

        <div className="hist-search-wrap">
          <Search size={14} color="#64748b" />
          <input 
            className="hist-search-input" 
            placeholder="Search verified events..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="hist-event-list">
          {filteredEvents.map(evt => (
            <div 
              key={evt.id} 
              className={`hist-event-item ${evt.id === selectedId ? 'active' : ''}`}
              onClick={() => setSelectedId(evt.id)}
            >
              <div className="hist-event-icon-box">
                {getHazardIcon(evt.hazard)}
              </div>
              <div className="hist-event-info">
                <div className="hist-event-name">{evt.name}</div>
                <div className="hist-event-meta-row">
                  <span className="hist-event-hazard">{evt.hazard.split('+')[0].trim()}</span>
                  <span className="hist-event-date">{evt.date}</span>
                </div>
              </div>
              <div className={`hist-badge hist-badge-${evt.badge}`}>
                {evt.outcome}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT MAIN AREA */}
      <div className="hist-main">
        {/* Event Header Bar */}
        <div className="hist-header">
          <div className="hist-header-left">
            <div className="hist-title-row">
              <h2 className="hist-main-title">{selectedEvent.name}</h2>
              <span className={`hist-badge-pill hist-badge-${selectedEvent.badge}`}>
                VERIFIED {selectedEvent.outcome}
              </span>
            </div>
            <p className="hist-main-subtitle">{selectedEvent.summaryText}</p>
          </div>

          <div className="hist-header-right">
            <div className="hist-meta-pill">
              <Calendar size={13} className="hist-meta-icon" />
              <span>{selectedEvent.date}</span>
            </div>
            <div className="hist-meta-pill">
              <MapPin size={13} className="hist-meta-icon" />
              <span>{selectedEvent.location.split(',')[0]}</span>
            </div>
            <div className="hist-meta-pill">
              <AlertTriangle size={13} className="hist-meta-icon" style={{ color: '#f59e0b' }} />
              <span>{selectedEvent.hazard}</span>
            </div>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="hist-stats-row">
          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-blue">
              <CloudRain size={18} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Observed Rainfall</span>
              <span className="hist-stat-val">{selectedEvent.observedRainfall}</span>
              <span className="hist-stat-sub">IMD Doppler &amp; Gauge</span>
            </div>
          </div>

          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-red">
              <Target size={18} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Predicted Probability</span>
              <span className="hist-stat-val">{selectedEvent.predictedProb}</span>
              <span className="hist-stat-sub">VAYUNET Core Run</span>
            </div>
          </div>

          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-cyan">
              <Clock size={18} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Warning Lead Time</span>
              <span className="hist-stat-val">{selectedEvent.leadTime}</span>
              <span className="hist-stat-sub">Advance Notice Window</span>
            </div>
          </div>

          <div className="hist-stat-card">
            <div className="hist-stat-icon-wrap hist-stat-icon-green">
              <BarChart2 size={18} />
            </div>
            <div className="hist-stat-details">
              <span className="hist-stat-label">Critical Success Index</span>
              <span className="hist-stat-val">{selectedEvent.csi}</span>
              <span className="hist-stat-sub">{selectedEvent.csiDesc}</span>
            </div>
          </div>
        </div>

        {/* Replay Section (Observed vs Predicted vs Impact) */}
        <div className="hist-middle-layout">
          <div className="hist-card hist-replay-panel">
            <div className="hist-replay-header">
              <div>
                <div className="hist-replay-title">Event Replay — Observed vs Predicted</div>
                <div className="hist-replay-subtitle">Temporal comparison of radar observations and model output</div>
              </div>
              <div className="hist-replay-actions">
                <button className="hist-btn-play" onClick={() => setIsPlaying(!isPlaying)}>
                  <Play size={13} fill="currentColor" /> {isPlaying ? 'Pause' : 'Play Replay'}
                </button>
              </div>
            </div>

            {/* Timeline Scrubber */}
            <div className="hist-timeline">
              <div className="hist-timeline-line" />
              <div 
                className="hist-timeline-progress" 
                style={{ width: `${(TIMELINE_STEPS.findIndex(s => s.id === currentStep) / (TIMELINE_STEPS.length - 1)) * 100}%` }} 
              />
              {TIMELINE_STEPS.map((step) => (
                <div 
                  key={step.id} 
                  className={`hist-timeline-step ${currentStep === step.id ? 'active' : ''}`}
                  onClick={() => setCurrentStep(step.id)}
                >
                  <span className="hist-timeline-label">{step.id}</span>
                  <span className="hist-timeline-time">{step.time}</span>
                  <div className="hist-timeline-dot" />
                </div>
              ))}
            </div>

            {/* 3 Crisp Vector Visualizations (NO BROKEN IMAGES) */}
            <div className="hist-map-row">
              {/* Box 1: Observed */}
              <div className="hist-map-col">
                <div className="hist-map-title-row">
                  <span className="hist-map-title">Observed Radar Echo</span>
                  <span className="hist-map-time">{selectedEvent.date}, 22:30 IST</span>
                </div>
                <div className="hist-vector-box">
                  <svg viewBox="0 0 200 120" width="100%" height="100%">
                    <rect width="200" height="120" fill="#040914" />
                    <circle cx="100" cy="55" r="48" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
                    <circle cx="100" cy="55" r="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
                    <ellipse cx="100" cy="54" rx="55" ry="32" fill="#0284c7" opacity="0.35" />
                    <ellipse cx="100" cy="53" rx="36" ry="20" fill="#22c55e" opacity="0.55" />
                    <ellipse cx="100" cy="52" rx="22" ry="13" fill="#eab308" opacity="0.75" />
                    <ellipse cx="100" cy="51" rx="12" ry="7" fill="#ef4444" opacity="0.95" />
                    <circle cx="100" cy="51" r="2.5" fill="#ffffff" />
                    <text x="100" y="80" fill="#f1f5f9" fontSize="9" fontWeight="700" textAnchor="middle">📍 {selectedEvent.location.split(',')[0]}</text>
                  </svg>
                </div>
              </div>

              {/* Box 2: Prediction */}
              <div className="hist-map-col">
                <div className="hist-map-title-row">
                  <span className="hist-map-title">VAYUNET Model Forecast</span>
                  <span className="hist-map-time">Lead: {selectedEvent.leadTime}</span>
                </div>
                <div className="hist-vector-box">
                  <svg viewBox="0 0 200 120" width="100%" height="100%">
                    <rect width="200" height="120" fill="#040914" />
                    <circle cx="100" cy="55" r="48" stroke="rgba(255,255,255,0.06)" strokeWidth="1" fill="none" />
                    <circle cx="100" cy="55" r="28" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
                    <ellipse cx="98" cy="53" rx="50" ry="30" fill="#0ea5e9" opacity="0.35" />
                    <ellipse cx="98" cy="52" rx="32" ry="18" fill="#10b981" opacity="0.55" />
                    <ellipse cx="98" cy="52" rx="19" ry="11" fill="#f59e0b" opacity="0.75" />
                    <ellipse cx="98" cy="51" rx="10" ry="6" fill="#dc2626" opacity="0.95" />
                    <circle cx="98" cy="51" r="2.5" fill="#ffffff" />
                    <text x="100" y="80" fill="#f1f5f9" fontSize="9" fontWeight="700" textAnchor="middle">Prediction (CSI: {selectedEvent.csi})</text>
                  </svg>
                </div>
              </div>

              {/* Box 3: Impact */}
              <div className="hist-map-col">
                <div className="hist-map-title-row">
                  <span className="hist-map-title">Runoff &amp; Impact Zone</span>
                  <span className="hist-map-time" style={{ color: '#38bdf8' }}>Post Event Analysis</span>
                </div>
                <div className="hist-vector-box">
                  <svg viewBox="0 0 200 120" width="100%" height="100%">
                    <rect width="200" height="120" fill="#040914" />
                    <path d="M20 95 Q70 65 100 52 Q140 45 180 20" stroke="#0284c7" strokeWidth="2.5" fill="none" opacity="0.6" />
                    <ellipse cx="100" cy="53" rx="42" ry="24" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3,3" />
                    <circle cx="100" cy="52" r="3" fill="#ef4444" />
                    <text x="100" y="80" fill="#fca5a5" fontSize="9" fontWeight="700" textAnchor="middle">Casualties: {selectedEvent.casualties}</text>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Right Summary Column */}
          <div className="hist-right-panel">
            <div className="hist-card hist-info-card">
              <div className="hist-info-title">Model Performance vs Baseline</div>
              <div className="hist-perf-table">
                <div className="hist-perf-row">
                  <span className="hist-perf-key">Critical Success Index (CSI)</span>
                  <span className="hist-perf-val">{selectedEvent.csi}</span>
                  <span className="hist-perf-change"><TrendingUp size={13} /> +38%</span>
                </div>
                <div className="hist-perf-row">
                  <span className="hist-perf-key">Probability of Detection</span>
                  <span className="hist-perf-val">{selectedEvent.pod}</span>
                  <span className="hist-perf-change"><TrendingUp size={13} /> +22%</span>
                </div>
                <div className="hist-perf-row" style={{ borderBottom: 'none' }}>
                  <span className="hist-perf-key">False Alarm Ratio (FAR)</span>
                  <span className="hist-perf-val">{selectedEvent.far}</span>
                  <span className="hist-perf-change negative"><TrendingDown size={13} /> -35%</span>
                </div>
              </div>

              <div className="hist-perf-baseline">
                <BarChart2 size={16} className="hist-perf-baseline-icon" />
                <div>
                  <div className="hist-perf-baseline-title">Outperformed IMD Baseline</div>
                  <div className="hist-perf-baseline-stats">CSI: 0.52 | POD: 0.72 | FAR: 0.31</div>
                </div>
              </div>
            </div>

            {/* Key Takeaways */}
            <div className="hist-card hist-info-card">
              <div className="hist-info-title">Key Takeaway</div>
              <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                {selectedEvent.takeaways[0].desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
