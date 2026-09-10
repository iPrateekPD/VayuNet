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
              <img 
                src={`https://images.unsplash.com/photo-1548684786-fb039b563fbd?q=80&w=200&auto=format&fit=crop`} 
                className="hist-event-thumb" 
                alt="Event thumbnail" 
                style={evt.id === 'mumbai-2020' ? { filter: 'hue-rotate(180deg)'} : {}}
              />
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
                  <img src="https://images.unsplash.com/photo-1548684786-fb039b563fbd?q=80&w=400&auto=format&fit=crop" className="hist-map-img" alt="Observed" style={{ filter: 'saturate(2) hue-rotate(-20deg)' }} />
                  <div style={{ position: 'absolute', color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
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
                  <img src="https://images.unsplash.com/photo-1548684786-fb039b563fbd?q=80&w=400&auto=format&fit=crop" className="hist-map-img" alt="Prediction" style={{ filter: 'saturate(2) hue-rotate(-10deg)' }} />
                  <div style={{ position: 'absolute', color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
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
                  <img src="https://images.unsplash.com/photo-1548684786-fb039b563fbd?q=80&w=400&auto=format&fit=crop" className="hist-map-img" alt="Impact" style={{ filter: 'grayscale(1) brightness(0.6)' }} />
                  <div style={{ position: 'absolute', width: '80%', height: '80%', background: 'radial-gradient(circle, rgba(239,68,68,0.4) 0%, rgba(239,68,68,0) 70%)', border: '1px dashed #ef4444', borderRadius: '50%' }} />
                  <div style={{ position: 'absolute', color: 'white', fontSize: '11px', fontWeight: '600', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
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
