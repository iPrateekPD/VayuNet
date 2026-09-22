import React, { useState, useEffect } from 'react';
import { Circle } from 'react-leaflet';
import OperationalMap from './OperationalMap';
import './EventsView.css';
import { MOCK_EVENTS, getEventsSummary } from '../data/eventsMockData';
import { eventsApi } from '../services/api/events';
import { 
  Search, Calendar, MapPin, AlertTriangle, CloudRain, Target, 
  Clock, BarChart2, Play, CheckCircle2, Mountain, FileText,
  TrendingUp, TrendingDown, Wind, Zap, Activity, Users, ShieldAlert, FileBarChart,
  Leaf, Building2, Layers
} from 'lucide-react';

export default function EventsView({ globalSelectedLocation, setGlobalSelectedLocation, onNavigateTab }) {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [connectionStatus, setConnectionStatus] = useState('live');
  const [selectedId, setSelectedId] = useState(MOCK_EVENTS[0].id);
  const [currentTab, setCurrentTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [hazardFilter, setHazardFilter] = useState('ALL HAZARDS');
  
  const [currentStep, setCurrentStep] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Impact Assessment Overlays
  const [showPopulation, setShowPopulation] = useState(false);
  const [showInfrastructure, setShowInfrastructure] = useState(false);
  const [showAgriculture, setShowAgriculture] = useState(false);

  // Sync global location
  useEffect(() => {
    if (globalSelectedLocation) {
      const match = events.find(e => e.location.includes(globalSelectedLocation));
      if (match) setSelectedId(match.id);
    }
  }, [globalSelectedLocation, events]);

  // Fetch API data
  useEffect(() => {
    const fetchEvents = async () => {
      setConnectionStatus('syncing');
      try {
        const response = await eventsApi.getAllEvents();
        if (response.data && Array.isArray(response.data)) {
          setEvents(response.data);
        }
        setConnectionStatus(response.status === 'fallback' ? 'fallback' : 'live');
      } catch (error) {
        setConnectionStatus('fallback');
      }
    };
    fetchEvents();
  }, []);

  // Handle Tab and Search filtering
  const filteredEvents = events.filter((e) => {
    if (currentTab !== 'ALL' && e.status !== currentTab) return false;
    if (hazardFilter !== 'ALL HAZARDS' && e.hazard !== hazardFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return e.name.toLowerCase().includes(q) || e.location.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    }
    return true;
  });

  const selectedEvent = events.find(e => e.id === selectedId) || events[0];
  
  const getEventsSummaryFromData = (eventsList) => {
    const active = eventsList.filter(e => e.status === 'ACTIVE').length;
    const developing = eventsList.filter(e => e.status === 'DEVELOPING').length;
    const resolved24h = eventsList.filter(e => e.status === 'RESOLVED').length;
    return { active, developing, resolved24h };
  };
  const summary = getEventsSummaryFromData(events);

  // Handle Timeline Replay
  useEffect(() => {
    if (selectedEvent.timeline && selectedEvent.timeline.length > 0) {
      setCurrentStep(selectedEvent.timeline[selectedEvent.timeline.length - 1].time); // default to last step
    }
  }, [selectedEvent.id]);

  useEffect(() => {
    let timer;
    if (isPlaying && selectedEvent.timeline) {
      timer = setInterval(() => {
        setCurrentStep((prev) => {
          const idx = selectedEvent.timeline.findIndex(s => s.time === prev);
          const next = (idx + 1) % selectedEvent.timeline.length;
          return selectedEvent.timeline[next].time;
        });
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isPlaying, selectedEvent]);

  const handleSelectEvent = (id) => {
    setSelectedId(id);
    setIsPlaying(false);
    const ev = events.find(e => e.id === id);
    if (ev && setGlobalSelectedLocation) {
      setGlobalSelectedLocation(ev.location.split(',')[0]);
    }
  };

  const getHazardIcon = (hazard, active = false) => {
    const color = active ? '#ef4444' : '#38bdf8';
    if (hazard.includes('Cloudburst') || hazard.includes('Rainfall')) return <CloudRain size={16} color={color} />;
    if (hazard.includes('Cyclone')) return <Wind size={16} color={color} />;
    if (hazard.includes('Landslide')) return <Mountain size={16} color="#eab308" />;
    return <AlertTriangle size={16} color={color} />;
  };

  return (
    <div className="hist-root">
      
      {/* PAGE HEADER */}
      <div className="ev-page-header">
        <div className="ev-header-titles">
          <div className="ev-header-title">
            Events
            {connectionStatus === 'syncing' && <span style={{ fontSize: '12px', marginLeft: '12px', color: '#eab308', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span className="ana-spinner" style={{ width: '10px', height: '10px', border: '2px solid rgba(234, 179, 8, 0.3)', borderTopColor: '#eab308', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span> Syncing...</span>}
            {connectionStatus === 'fallback' && <span style={{ fontSize: '12px', marginLeft: '12px', color: '#ef4444', display: 'inline-flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#ef4444' }}></span> Offline</span>}
          </div>
          <div className="ev-header-subtitle">Track developing, active and historical severe-weather events.</div>
        </div>
        
        <div className="ev-overview-metrics">
          <div className="ev-metric-box">
            <Activity size={18} color="#ef4444" />
            <div>
              <div className="ev-metric-val active">{summary.active}</div>
              <div className="ev-metric-label">Active</div>
            </div>
          </div>
          <div className="ev-metric-box">
            <Clock size={18} color="#f59e0b" />
            <div>
              <div className="ev-metric-val developing">{summary.developing}</div>
              <div className="ev-metric-label">Developing</div>
            </div>
          </div>
          <div className="ev-metric-box">
            <CheckCircle2 size={18} color="#38bdf8" />
            <div>
              <div className="ev-metric-val resolved">{summary.resolved24h}</div>
              <div className="ev-metric-label">Resolved (24h)</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="ev-filter-bar">
        <div className="ev-tabs">
          {['ALL', 'ACTIVE', 'DEVELOPING', 'RESOLVED', 'HISTORICAL'].map(tab => (
            <button 
              key={tab}
              className={`ev-tab ${currentTab === tab ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        
        <div className="ev-filters">
          <div className="ev-search-wrap">
            <Search size={14} color="#64748b" />
            <input 
              className="ev-search-input" 
              placeholder="Search ID, location..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select 
            className="ev-filter-select"
            value={hazardFilter}
            onChange={(e) => setHazardFilter(e.target.value)}
          >
            <option value="ALL HAZARDS">ALL HAZARDS</option>
            <option value="Flash Flood">Flash Flood</option>
            <option value="Heavy Rainfall">Heavy Rainfall</option>
            <option value="Cloudburst">Cloudburst</option>
            <option value="Cyclone">Cyclone</option>
          </select>
          <select className="ev-filter-select" defaultValue="ALL REGIONS">
            <option value="ALL REGIONS">ALL REGIONS</option>
            <option value="North">North</option>
            <option value="South">South</option>
            <option value="West">West</option>
          </select>
        </div>
      </div>

      {/* CONTENT LAYOUT */}
      <div className="ev-content-layout">
        
        {/* LEFT SIDEBAR: EVENT LIST */}
        <div className="hist-sidebar">
          <div className="hist-event-list">
            {filteredEvents.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '12px' }}>
                No events match current filters.
              </div>
            ) : (
              filteredEvents.map(evt => (
                <div 
                  key={evt.id} 
                  className={`hist-event-item ${evt.id === selectedId ? 'active' : ''}`}
                  onClick={() => handleSelectEvent(evt.id)}
                >
                  <div className="ev-item-header">
                    <span className="ev-item-id">{evt.id}</span>
                    <span className={`hist-badge hist-badge-${evt.status.toLowerCase()}`}>{evt.status}</span>
                  </div>
                  <div className="hist-event-name">{evt.name}</div>
                  <div className="ev-item-details">
                    <div className="ev-item-meta">
                      <div className="ev-item-row">
                        <MapPin size={11} className="ev-item-icon" />
                        <span>{evt.location.split(',')[0]}</span>
                      </div>
                      <div className="ev-item-row">
                        <Calendar size={11} className="ev-item-icon" />
                        <span>{evt.startedAt}</span>
                      </div>
                    </div>
                    <div className="ev-item-row" style={{ fontWeight: '600', color: '#cbd5e1' }}>
                      {getHazardIcon(evt.hazard, evt.status === 'ACTIVE')} {evt.hazard}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* RIGHT MAIN AREA */}
        <div className="hist-main">
          
          {/* Main Header */}
          <div className="hist-header">
            <div className="hist-header-left">
              <div className="hist-title-row">
                <h2 className="hist-main-title">{selectedEvent.name}</h2>
                <span className={`hist-badge hist-badge-${selectedEvent.status.toLowerCase()}`}>
                  {selectedEvent.status}
                </span>
                <span className={`hist-badge hist-badge-active`} style={{ background: 'rgba(239, 68, 68, 0.2)', border: 'none', color: '#fca5a5' }}>
                  {selectedEvent.severity}
                </span>
              </div>
              
              <div className="ev-lifecycle-track" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '12px' }}>
                {['DEVELOPING', 'ACTIVE', 'WEAKENING', 'RESOLVED'].map((stage, idx) => {
                  const isActive = selectedEvent.status === stage || (selectedEvent.status === 'HISTORICAL' && stage === 'RESOLVED');
                  return (
                    <React.Fragment key={stage}>
                      <div style={{
                        fontSize: '11px',
                        fontWeight: isActive ? '600' : '400',
                        color: isActive ? '#38bdf8' : '#64748b',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: isActive ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                        border: isActive ? '1px solid rgba(56, 189, 248, 0.3)' : '1px solid transparent'
                      }}>
                        {stage}
                      </div>
                      {idx < 3 && <div style={{ color: '#334155', fontSize: '12px' }}>→</div>}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
            <div className="hist-header-right">
              <button className="ev-action-btn" onClick={() => {
                if (setGlobalSelectedLocation) setGlobalSelectedLocation(selectedEvent.id);
                if (onNavigateTab) onNavigateTab('nowcast');
              }}>
                <Activity size={13} /> View in Nowcast
              </button>
              <button className="ev-action-btn" onClick={() => {
                if (setGlobalSelectedLocation) setGlobalSelectedLocation(selectedEvent.id);
                if (onNavigateTab) onNavigateTab('analysis');
              }}>
                <FileBarChart size={13} /> Open Analysis
              </button>
              <button className="ev-action-btn" onClick={() => {
                if (setGlobalSelectedLocation) setGlobalSelectedLocation(selectedEvent.id);
                if (onNavigateTab) onNavigateTab('alerts');
              }}>
                <ShieldAlert size={13} /> View Alerts
              </button>
            </div>
          </div>

          {/* 4 Stats Cards */}
          <div className="hist-stats-row">
            <div className="hist-stat-card">
              <div className="hist-stat-icon-wrap hist-stat-icon-red">
                <AlertTriangle size={18} />
              </div>
              <div className="hist-stat-details">
                <span className="hist-stat-label">Peak Risk</span>
                <span className="hist-stat-val">{selectedEvent.peakRisk}</span>
                <span className="hist-stat-sub">VAYUNET Model Max</span>
              </div>
            </div>
            <div className="hist-stat-card">
              <div className="hist-stat-icon-wrap hist-stat-icon-blue">
                <CloudRain size={18} />
              </div>
              <div className="hist-stat-details">
                <span className="hist-stat-label">Observed Rainfall</span>
                <span className="hist-stat-val">{selectedEvent.observedRainfall}</span>
                <span className="hist-stat-sub">Telemetry / Radar</span>
              </div>
            </div>
            <div className="hist-stat-card">
              <div className="hist-stat-icon-wrap hist-stat-icon-cyan">
                <Clock size={18} />
              </div>
              <div className="hist-stat-details">
                <span className="hist-stat-label">Lead Time</span>
                <span className="hist-stat-val">{selectedEvent.leadTime}</span>
                <span className="hist-stat-sub">Advance Notice Window</span>
              </div>
            </div>
            <div className="hist-stat-card">
              <div className="hist-stat-icon-wrap hist-stat-icon-green">
                <ShieldAlert size={18} />
              </div>
              <div className="hist-stat-details">
                <span className="hist-stat-label">Alert Status</span>
                <span className="hist-stat-val">{selectedEvent.alertStatus}</span>
                <span className="hist-stat-sub">Dissemination System</span>
              </div>
            </div>
          </div>

          {/* Middle Grid Layout */}
          <div className="ev-middle-layout">
            
            {/* Left Panel: Map & Timeline */}
            <div className="ev-left-panel">
              
              {/* Event Map */}
              <div className="ev-map-container">
                <OperationalMap 
                  mode="events"
                  eventData={{ ...selectedEvent, coords: selectedEvent.coords }}
                  showPopulation={showPopulation}
                  setShowPopulation={setShowPopulation}
                  showInfrastructure={showInfrastructure}
                  setShowInfrastructure={setShowInfrastructure}
                  showAgriculture={showAgriculture}
                  setShowAgriculture={setShowAgriculture}
                />
              </div>

              {/* Timeline Lifecycle */}
              <div className="hist-card hist-replay-panel">
                <div className="hist-replay-header">
                  <div>
                    <div className="hist-replay-title">Event Lifecycle</div>
                    <div className="hist-replay-subtitle">Sequential tracking of model detections and triggers</div>
                  </div>
                  <div className="hist-replay-actions">
                    <button className="ev-action-btn" onClick={() => setIsPlaying(!isPlaying)}>
                      <Play size={13} fill="currentColor" /> {isPlaying ? 'Pause' : 'Play Sequence'}
                    </button>
                  </div>
                </div>

                <div className="hist-timeline">
                  <div className="hist-timeline-line" />
                  {selectedEvent.timeline && (
                    <div 
                      className="hist-timeline-progress" 
                      style={{ 
                        width: `${(selectedEvent.timeline.findIndex(s => s.time === currentStep) / Math.max(1, selectedEvent.timeline.length - 1)) * 100}%` 
                      }} 
                    />
                  )}
                  {selectedEvent.timeline && selectedEvent.timeline.map((step) => (
                    <div 
                      key={step.time} 
                      className={`hist-timeline-step ${currentStep === step.time ? 'active' : ''}`}
                      onClick={() => setCurrentStep(step.time)}
                      title={step.label}
                    >
                      <span className="hist-timeline-label">{step.label}</span>
                      <span className="hist-timeline-time">{step.time}</span>
                      <div className="hist-timeline-dot" />
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Right Panel: Impact, Risk, Validation */}
            <div className="hist-right-panel">
              
              <div className="hist-card hist-info-card">
                <div className="hist-info-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Users size={14} color="#38bdf8"/> Potential Exposure
                  </div>
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '400', marginLeft: 'auto' }}>· Model estimate</span>
                </div>
                <div className="ev-impact-grid">
                  <div className="ev-impact-item">
                    <span className="ev-impact-val">{selectedEvent.impact.population}</span>
                    <span className="ev-impact-label">Pop. Exposed</span>
                  </div>
                  <div className="ev-impact-item">
                    <span className="ev-impact-val">{selectedEvent.impact.villages}</span>
                    <span className="ev-impact-label">Villages at Risk</span>
                  </div>
                  <div className="ev-impact-item">
                    <span className="ev-impact-val">{selectedEvent.impact.roads}</span>
                    <span className="ev-impact-label">Roads Affected</span>
                  </div>
                  <div className="ev-impact-item">
                    <span className="ev-impact-val">{selectedEvent.impact.criticalSites}</span>
                    <span className="ev-impact-label">Critical Infra</span>
                  </div>
                </div>
              </div>

              <div className="hist-card hist-info-card">
                <div className="hist-info-title"><MapPin size={14} color="#38bdf8"/> Affected Regions</div>
                <div className="ev-regions-list">
                  {selectedEvent.affectedRegions.map(reg => (
                    <span key={reg} className="ev-region-tag">{reg}</span>
                  ))}
                </div>
              </div>

              <div className="hist-card hist-info-card">
                <div className="hist-info-title"><TrendingUp size={14} color="#38bdf8"/> Risk Evolution</div>
                <div className="ev-risk-chart">
                  {selectedEvent.riskEvolution && selectedEvent.riskEvolution.map(pt => (
                    <div key={pt.time} className="ev-risk-bar-container">
                      <div className="ev-risk-time">{pt.time}</div>
                      <div 
                        className={`ev-risk-bar ${pt.risk > 80 ? 'high' : pt.risk > 50 ? 'med' : ''}`} 
                        style={{ height: `${pt.risk}%` }} 
                        title={`Risk: ${pt.risk}%`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="hist-card hist-info-card">
                <div className="hist-info-title"><FileText size={14} color="#38bdf8"/> Event Summary</div>
                <p className="ev-summary-text">{selectedEvent.summary}</p>
              </div>

              {selectedEvent.validation && (
                <div className="hist-card hist-info-card">
                  <div className="hist-info-title"><Target size={14} color="#38bdf8"/> Model Validation</div>
                  <div className="hist-perf-table">
                    <div className="hist-perf-row">
                      <span className="hist-perf-key">CSI (Critical Success)</span>
                      <span className="hist-perf-val">{selectedEvent.validation.csi}</span>
                    </div>
                    <div className="hist-perf-row">
                      <span className="hist-perf-key">POD (Detection Prob)</span>
                      <span className="hist-perf-val">{selectedEvent.validation.pod}</span>
                    </div>
                    <div className="hist-perf-row" style={{ borderBottom: 'none' }}>
                      <span className="hist-perf-key">FAR (False Alarm)</span>
                      <span className="hist-perf-val">{selectedEvent.validation.far}</span>
                    </div>
                  </div>
                  <div className="hist-perf-baseline" style={{ marginTop: '4px' }}>
                    <CheckCircle2 size={14} className="hist-perf-baseline-icon" />
                    <div>
                      <div className="hist-perf-baseline-title">Outcome: {selectedEvent.validation.outcome}</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
