import React, { useState, useEffect } from 'react';

const HISTORICAL_EVENTS = [
  {
    id: 'dharamsala-2021',
    name: 'Dharamsala 2021',
    location: 'Dharamsala, Himachal Pradesh',
    date: '22 Jul 2021',
    hazard: 'Cloudburst + Flash Flood',
    observedRainfall: '187 mm / 6h',
    predictedProb: '74%',
    leadTime: 'T+4h 12m',
    outcome: 'SUCCESS',
    badge: 'success',
    csi: '0.71',
    csiDesc: 'Above IMD baseline (0.52)',
    pod: '0.88',
    podDesc: 'High detection of convective core',
    far: '0.19',
    farDesc: 'Low false trigger rate',
    narrative: 'Explosive cloudburst over Kangra Valley resulted in severe flash flooding along Manjhi Khad. VAYUNET detected rapid CTT drop (-18°C/hr) and issued a high-confidence prediction 4 hours prior to ground river surge.',
    takeaways: [
      { title: 'Early Detection', desc: 'Convective cloud top cooling detected 4.2h before ground rain gauge tipping, giving DEOC critical evacuation lead time.' },
      { title: 'Terrain Amplification', desc: 'Hydro-enforced DEM accurately channeled predicted precipitation into narrow Bhagsu nullahs where ground damage occurred.' },
      { title: 'Model Improvement', desc: 'Spatiotemporal ViT architecture reduced false alarms by 14% compared to traditional numerical weather prediction (NWP).' }
    ]
  },
  {
    id: 'wayanad-2024',
    name: 'Wayanad 2024',
    location: 'Wayanad, Kerala',
    date: '30 Jul 2024',
    hazard: 'Extreme Rainfall & Landslide Trigger',
    observedRainfall: '228 mm / 6h',
    predictedProb: '81%',
    leadTime: 'T+3h 05m',
    outcome: 'PARTIAL',
    badge: 'partial',
    csi: '0.68',
    csiDesc: 'Well above persistence models',
    pod: '0.91',
    podDesc: 'Detected extreme moisture plume',
    far: '0.22',
    farDesc: 'Minor boundary over-prediction',
    narrative: 'Heavy atmospheric moisture surge (IWV 74 mm) combined with steep Western Ghats escarpment triggered catastrophic debris flows in Chooralmala and Meppadi.',
    takeaways: [
      { title: 'Extreme Moisture Capture', desc: 'IWV saturation reached 74 mm, correctly triggering regional red alert in the 3-hour lead window.' },
      { title: 'Slope Hydrology Coupling', desc: 'Highlighting soil pore pressure saturation enabled pre-warning for downstream settlements.' },
      { title: 'Public Delivery Need', desc: 'Underscores the critical necessity of automated cell broadcast integration to prevent warning transmission gaps.' }
    ]
  },
  {
    id: 'uttarkashi-2023',
    name: 'Uttarkashi 2023',
    location: 'Uttarkashi, Uttarakhand',
    date: '10 Aug 2023',
    hazard: 'Multi-nullah Flash Flood',
    observedRainfall: '142 mm / 3h',
    predictedProb: '69%',
    leadTime: 'T+5h 08m',
    outcome: 'SUCCESS',
    badge: 'success',
    csi: '0.64',
    csiDesc: 'Exceeded regional benchmark',
    pod: '0.82',
    podDesc: 'Accurate valley corridor mapping',
    far: '0.25',
    farDesc: 'Acceptable operational false rate',
    narrative: 'Severe orographic flash flood triggered in Bhagirathi upper tributaries. VAYUNET model successfully tracked convective cloud train 5 hours ahead.',
    takeaways: [
      { title: 'Multi-Catchment Routing', desc: 'Correctly routed runoff across 6 distinct mountain nullahs simultaneously.' },
      { title: 'SDRF Mobilization', desc: '5-hour lead time permitted state disaster response force to pre-position equipment before bridges submerged.' },
      { title: 'Sustained Tracking', desc: 'Maintained tracking through 3 successive INSAT radar cycles without loss of track.' }
    ]
  },
  {
    id: 'mumbai-2020',
    name: 'Mumbai 2020',
    location: 'Greater Mumbai, Maharashtra',
    date: '23 Sep 2020',
    hazard: 'Urban Flooding & Waterlogging',
    observedRainfall: '118 mm / 4h',
    predictedProb: '63%',
    leadTime: 'T+2h 15m',
    outcome: 'SUCCESS',
    badge: 'success',
    csi: '0.59',
    csiDesc: 'Above radar extrapolation',
    pod: '0.76',
    podDesc: 'Captures coastal convergence',
    far: '0.29',
    farDesc: 'Higher urban noise environment',
    narrative: 'Coastal squall line caused extreme localized inundation across central Mumbai transit arteries during high-tide confluence.',
    takeaways: [
      { title: 'Tidal Confluence Warning', desc: 'Integrated storm surge timing with peak convective rainfall bands for urban ward commanders.' },
      { title: 'Pump Pre-Activation', desc: 'Municipal corporation deployed dewatering stations 2 hours prior to severe water stagnation.' },
      { title: 'Zero Casualties', desc: 'Effective municipal coordination ensured safe commuter diversion.' }
    ]
  }
];

const TIMELINE_STEPS = ['T-6h', 'T-4h', 'T-2h', 'T-0', 'Impact', 'Recovery'];

export default function EventsView() {
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

  // Auto-play replay animation
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          const idx = TIMELINE_STEPS.indexOf(prev);
          const next = (idx + 1) % TIMELINE_STEPS.length;
          return TIMELINE_STEPS[next];
        });
      }, 1600);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="ops-events-container">
      {/* Header */}
      <div className="ops-events-header">
        <div className="ops-events-title-group">
          <h1>Historical Events & Verification Forensics</h1>
          <div className="ops-events-subtitle">
            Review how VAYUNET performs against real severe-weather disaster ground-truth events.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11.5px', color: 'var(--ops-text-muted)', fontFamily: 'var(--ops-font-mono)' }}>
            Benchmark Database: 14 Validated Disasters (2018–2026)
          </span>
        </div>
      </div>

      {/* Main Layout */}
      <div className="ops-events-layout">
        {/* Left Column: Searchable Event Selector Cards */}
        <div className="ops-event-selector-column">
          <input
            type="text"
            className="ops-search-input"
            placeholder="Search disaster case studies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filteredEvents.map((evt) => (
              <div
                key={evt.id}
                className={`ops-event-item-card ${evt.id === selectedId ? 'active' : ''}`}
                onClick={() => setSelectedId(evt.id)}
              >
                <div className="ops-event-card-header">
                  <span className="ops-event-card-title">{evt.name}</span>
                  <span className={`ops-event-card-badge ops-badge-${evt.badge}`}>
                    {evt.outcome}
                  </span>
                </div>
                <div className="ops-event-card-meta">
                  <span>{evt.location}</span> · <span>{evt.date}</span>
                </div>
                <div className="ops-event-card-desc">
                  {evt.hazard}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Event Scorecard + Replay + Model Performance */}
        <div className="ops-event-detail-column">
          {/* Selected Event Scorecard */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <div>
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
                  {selectedEvent.name} — {selectedEvent.location}
                </span>
                <div style={{ fontSize: '11px', color: 'var(--ops-text-muted)', marginTop: '2px' }}>
                  Date of Event: {selectedEvent.date} · Hazard Category: {selectedEvent.hazard}
                </div>
              </div>
              <span className={`ops-event-card-badge ops-badge-${selectedEvent.badge}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                VERIFIED {selectedEvent.outcome}
              </span>
            </div>

            {/* Scorecard Metrics Grid */}
            <div className="ops-scorecard-grid">
              <div className="ops-score-tile">
                <span className="ops-score-label">Observed Rainfall</span>
                <span className="ops-score-val">{selectedEvent.observedRainfall}</span>
                <span className="ops-score-sub">IMD Ground Truth</span>
              </div>

              <div className="ops-score-tile">
                <span className="ops-score-label">Predicted Probability</span>
                <span className="ops-score-val" style={{ color: '#38bdf8' }}>{selectedEvent.predictedProb}</span>
                <span className="ops-score-sub">VAYUNET Core Run</span>
              </div>

              <div className="ops-score-tile">
                <span className="ops-score-label">Warning Lead Time</span>
                <span className="ops-score-val" style={{ color: '#86efac' }}>{selectedEvent.leadTime}</span>
                <span className="ops-score-sub">Advance Notice</span>
              </div>

              <div className="ops-score-tile">
                <span className="ops-score-label">Critical Success Index</span>
                <span className="ops-score-val">{selectedEvent.csi}</span>
                <span className="ops-score-sub">{selectedEvent.csiDesc}</span>
              </div>
            </div>

            <div style={{ fontSize: '12.5px', color: '#cbd5e1', lineHeight: 1.5, background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--ops-radius-sm)', border: '1px solid var(--ops-border-subtle)' }}>
              {selectedEvent.narrative}
            </div>
          </div>

          {/* Event Replay Controller */}
          <div className="ops-replay-controls-card">
            <div className="ops-replay-head-row">
              <div>
                <span className="ops-card-title">Event Temporal Replay: Observed vs Predicted</span>
                <div style={{ fontSize: '11px', color: 'var(--ops-text-muted)' }}>
                  Current Scrubbing Position: <strong style={{ color: '#38bdf8' }}>{currentStep}</strong>
                </div>
              </div>

              <button
                className="ops-play-btn"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? '⏸ Pause Replay' : '▶ Play Replay'}
              </button>
            </div>

            {/* Timeline Scrubber */}
            <div className="ops-timeline-steps">
              {TIMELINE_STEPS.map((step) => (
                <button
                  key={step}
                  className={`ops-timeline-step-btn ${currentStep === step ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentStep(step);
                    setIsPlaying(false);
                  }}
                >
                  {step}
                </button>
              ))}
            </div>

            {/* Spatial Evolution Visual Snapshot */}
            <div className="ops-spatial-frame">
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '6px' }}>
                  Spatial Evolution at {currentStep} ({selectedEvent.name})
                </div>
                <div style={{ fontSize: '11px', color: 'var(--ops-text-muted)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
                  {currentStep === 'T-6h' && 'Inflow of maritime moisture boundary enters catchment; incipient orographic uplift begins.'}
                  {currentStep === 'T-4h' && 'VAYUNET alerts trigger: Rapid CTT cooling detected. Hazard polygon initialized over drainage core.'}
                  {currentStep === 'T-2h' && 'Convective cell reaches 14 km MSL. Model prediction reaches peak probability. Evacuation dispatched.'}
                  {currentStep === 'T-0' && 'Heavy cloudburst onset matches predicted high-risk polygon within 1.8 km margin.'}
                  {currentStep === 'Impact' && 'Severe surface runoff concentrates down primary nullahs as forecasted by CartoDEM D8.'}
                  {currentStep === 'Recovery' && 'Cell dissipates eastward. Drainage levels return below emergency thresholds.'}
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <span style={{ width: '12px', height: '12px', background: 'rgba(56, 189, 248, 0.4)', border: '1px solid #38bdf8', borderRadius: '2px' }} />
                    <span style={{ color: '#cbd5e1' }}>Observed Radar Plume</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <span style={{ width: '12px', height: '12px', background: 'rgba(239, 68, 68, 0.35)', border: '1px solid #ef4444', borderRadius: '2px' }} />
                    <span style={{ color: '#cbd5e1' }}>VAYUNET Predicted Polygon</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                    <span style={{ width: '12px', height: '12px', background: 'rgba(249, 115, 22, 0.4)', border: '1px dashed #f97316', borderRadius: '2px' }} />
                    <span style={{ color: '#cbd5e1' }}>Ground Impact Corridor</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Model Performance Deep Dive */}
          <div className="ops-card">
            <div className="ops-card-title-row">
              <span className="ops-card-title">Meteorological Model Skill Metrics (Verification)</span>
              <span style={{ fontSize: '10.5px', color: 'var(--ops-text-muted)' }}>Contingency Table Analysis (2x2 Matrix)</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              <div style={{ background: '#070e1c', border: '1px solid var(--ops-border-subtle)', borderRadius: 'var(--ops-radius-sm)', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ops-text-muted)', textTransform: 'uppercase' }}>
                  Critical Success Index (CSI)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--ops-font-mono)', color: '#38bdf8', margin: '4px 0' }}>
                  {selectedEvent.csi}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ops-text-secondary)', lineHeight: 1.4 }}>
                  Measures overall accuracy taking hits, misses, and false alarms into account. Benchmark NWP: 0.52.
                </div>
              </div>

              <div style={{ background: '#070e1c', border: '1px solid var(--ops-border-subtle)', borderRadius: 'var(--ops-radius-sm)', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ops-text-muted)', textTransform: 'uppercase' }}>
                  Probability of Detection (POD)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--ops-font-mono)', color: '#86efac', margin: '4px 0' }}>
                  {selectedEvent.pod}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ops-text-secondary)', lineHeight: 1.4 }}>
                  Proportion of actual severe occurrences that were successfully forecasted.
                </div>
              </div>

              <div style={{ background: '#070e1c', border: '1px solid var(--ops-border-subtle)', borderRadius: 'var(--ops-radius-sm)', padding: '12px' }}>
                <div style={{ fontSize: '11px', color: 'var(--ops-text-muted)', textTransform: 'uppercase' }}>
                  False Alarm Ratio (FAR)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--ops-font-mono)', color: '#fca5a5', margin: '4px 0' }}>
                  {selectedEvent.far}
                </div>
                <div style={{ fontSize: '10.5px', color: 'var(--ops-text-secondary)', lineHeight: 1.4 }}>
                  Proportion of forecasted severe warnings where no actual event materialized.
                </div>
              </div>
            </div>
          </div>

          {/* Key Takeaways */}
          <div className="ops-takeaways-card">
            <span className="ops-card-title">Forensic Key Takeaways</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {selectedEvent.takeaways.map((item) => (
                <div key={item.title} className="ops-takeaway-item">
                  <span className="ops-takeaway-bullet">●</span>
                  <div className="ops-takeaway-text">
                    <h4>{item.title}</h4>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
