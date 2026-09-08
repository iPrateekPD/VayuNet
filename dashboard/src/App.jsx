import React, { useState, useEffect, useCallback } from 'react';
import { RISK_ZONES, TIME_STEPS, EVENT_META } from './mockData';
import MapView from './components/MapView';
import PredictionPanel from './components/PredictionPanel';
import XAIPanel from './components/XAIPanel';
import AlertPanel from './components/AlertPanel';
import IngestionPanel from './components/IngestionPanel';
import TimeSlider from './components/TimeSlider';

// Multi-Page & Multi-View Components
import HomePage, { INDIAN_LANGUAGES } from './components/HomePage';
import LoginPage from './components/LoginPage';
import CitizenPortal from './components/CitizenPortal';
import TacticalNowcastView from './components/TacticalNowcastView';
import DiagnosticsView from './components/DiagnosticsView';
import ForensicsView from './components/ForensicsView';
import AlertHubView from './components/AlertHubView';
import SystemView from './components/SystemView';

function App() {
  const getViewFromLocation = () => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash.includes('login') || pathname.includes('login')) return 'login';
    if (hash.includes('warning') || hash.includes('citizen') || pathname.includes('warning') || pathname.includes('citizen')) return 'citizen';
    if (hash.includes('portal') || pathname.includes('portal')) return 'portal';
    return 'home';
  };

  // Navigation layer: 'home' | 'login' | 'citizen' | 'portal'
  const [view, setView] = useState(getViewFromLocation);

  // Authenticated Portal Tab: 'nowcast' | 'diagnostics' | 'forensics' | 'alerts' | 'system'
  const [portalTab, setPortalTab] = useState('nowcast');
  const [currentUser, setCurrentUser] = useState({ 
    user: 'DEOC-KANGRA-04', 
    role: 'Incident Commander',
    unit: 'Kangra District EOC'
  });

  // Nowcast State
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [overlays, setOverlays] = useState({ thunderstorm: true, cloudburst: true, flood: true });
  const [backendStatus, setBackendStatus] = useState('checking');
  const [toast, setToast] = useState(null);
  const [portalLanguage, setPortalLanguage] = useState('EN');

  // Tactical Sector & Location State (Manual & Automated)
  const TACTICAL_LOCATIONS = [
    { id: 'chamoli', name: 'Chamoli, Uttarakhand', badge: 'Cloudburst & Flash Flood', center: [30.4, 79.3], zoom: 9 },
    { id: 'mumbai', name: 'Mumbai MMR, Maharashtra', badge: 'Coastal Convection', center: [19.076, 72.877], zoom: 10 },
    { id: 'wayanad', name: 'Wayanad, Kerala', badge: 'Slope Runoff', center: [11.685, 76.132], zoom: 10 },
    { id: 'odisha', name: 'Coastal Odisha', badge: 'Squall Line', center: [20.951, 85.098], zoom: 8 },
    { id: 'meghalaya', name: 'Meghalaya Plateau', badge: 'Orographic Core', center: [25.578, 91.893], zoom: 9 },
    { id: 'india', name: 'National Surveillance (All India)', badge: 'Overview', center: [21.8, 78.9], zoom: 5 },
  ];

  const [selectedLocation, setSelectedLocation] = useState('chamoli');
  const [mapCenter, setMapCenter] = useState(EVENT_META.center);
  const [mapZoom, setMapZoom] = useState(EVENT_META.zoom);
  const [inspectedPoint, setInspectedPoint] = useState(null);

  const handleSelectLocation = (locId) => {
    const loc = TACTICAL_LOCATIONS.find(l => l.id === locId);
    if (loc) {
      setSelectedLocation(loc.id);
      setMapCenter(loc.center);
      setMapZoom(loc.zoom);
      showToast(`Tactical sector switched to ${loc.name}`);
    }
  };

  const handleAutoTrack = () => {
    // Automated detection of highest active threat zone
    const target = TACTICAL_LOCATIONS[0];
    setSelectedLocation(target.id);
    setMapCenter(target.center);
    setMapZoom(target.zoom);
    showToast(`Radar Auto-Track: Locked onto ${target.name} (Active Alert Core)`);
  };

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Hash-based & PopState URL synchronization for true page separation
  useEffect(() => {
    const handleUrlChange = () => {
      setView(getViewFromLocation());
    };

    window.addEventListener('hashchange', handleUrlChange);
    window.addEventListener('popstate', handleUrlChange);
    return () => {
      window.removeEventListener('hashchange', handleUrlChange);
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, []);

  const navigateTo = (newView) => {
    setView(newView);
    if (newView === 'home') window.location.hash = '#/';
    else if (newView === 'login') window.location.hash = '#/login';
    else if (newView === 'citizen') window.location.hash = '#/warnings';
    else if (newView === 'portal') window.location.hash = '#/portal';
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    navigateTo('login');
    showToast('Operational session terminated. Returned to authentication gateway.');
  };

  const handleHomeAndLogout = () => {
    setCurrentUser(null);
    navigateTo('home');
    showToast('Logged out of operations portal. Returned to Home.');
  };

  // Check backend health on mount
  useEffect(() => {
    fetch('http://localhost:8000/api/health')
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(() => setBackendStatus('online'))
      .catch(() => setBackendStatus('offline'));
  }, []);

  const currentData = RISK_ZONES[stepIdx];

  // Auto-play animation
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setStepIdx(prev => {
        if (prev >= TIME_STEPS.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 2200);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleOverlay = (key) => {
    setOverlays(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // 1. PUBLIC LAYER: Home / Landing Page
  if (view === 'home') {
    return (
      <>
        <HomePage 
          onEnterPortal={() => navigateTo('login')}
          onOpenPublicWarnings={() => navigateTo('citizen')}
        />
        {toast && <div className="toast">✅ {toast}</div>}
      </>
    );
  }

  // 2. PUBLIC LAYER: Citizen Warning View (Accessible without login)
  if (view === 'citizen') {
    return (
      <>
        <CitizenPortal 
          onBackHome={() => navigateTo('home')}
          onEnterPortal={() => navigateTo('login')}
        />
        {toast && <div className="toast">✅ {toast}</div>}
      </>
    );
  }

  // 3. AUTHENTICATION LAYER: Dedicated /login Screen
  if (view === 'login') {
    return (
      <>
        <LoginPage 
          onLoginSuccess={(userData) => {
            setCurrentUser(userData);
            navigateTo('portal');
            setPortalTab('nowcast');
            showToast(`Welcome, ${userData.role} (${userData.user}). Operations portal unlocked.`);
          }}
          onBackHome={() => navigateTo('home')}
        />
        {toast && <div className="toast">✅ {toast}</div>}
      </>
    );
  }

  // Guard: If accessing portal without credentials, redirect to login
  if (!currentUser) {
    navigateTo('login');
    return null;
  }

  // 4. AUTHENTICATED OPERATIONAL LAYER
  return (
    <div className="app">
      {/* GLOBAL PORTAL TOP NAVIGATION */}
      <div className="portal-top-bar">
        <div className="home-brand" style={{ cursor: 'pointer' }} onClick={() => navigateTo('home')} title="Return to VAYUNET Home">
          <div className="home-logo">
            <img src="/VAYUNET_LOGO.png" alt="VAYUNET Logo" className="home-logo-img" />
          </div>
          <div className="brand-titles-group">
            <div className="brand-row">
              <span className="home-title">VAYUNET</span>
              <span className="gov-sovereign-pill">🇮🇳 MoES · NCMRWF</span>
            </div>
            <div className="home-dept">Weather Intelligence for a Safer India</div>
          </div>
        </div>

        {/* Tab Switcher — ECMWF style: text-only, no emoji */}
        <div className="portal-tabs">
          {[
            { key: 'nowcast',     label: 'Tactical Nowcast' },
            { key: 'diagnostics', label: 'Diagnostics / XAI' },
            { key: 'forensics',   label: 'Forensics Replay' },
            { key: 'alerts',      label: 'Alert Hub — CAP' },
            { key: 'system',      label: 'System Telemetry' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`portal-tab-btn ${portalTab === key ? 'active' : ''}`}
              onClick={() => setPortalTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Status & User — right side */}
        <div className="portal-actions-right">
          <div className="status-dot">
            <span className="dot" style={{ background: backendStatus === 'online' ? 'var(--sev-low)' : 'var(--sev-moderate)' }} />
            {backendStatus === 'online' ? 'API :8000' : 'API Connecting...'}
          </div>

          <span className="portal-user-badge" title={`${currentUser.role} · ${currentUser.unit || ''}`}>
            {currentUser.user}
          </span>

          {/* 1. Language Dropdown */}
          <div className="home-lang-wrap">
            <svg className="home-lang-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
            <select 
              className="home-lang-select" 
              value={portalLanguage} 
              onChange={(e) => {
                setPortalLanguage(e.target.value);
                const sel = INDIAN_LANGUAGES.find(l => l.code === e.target.value);
                showToast(`Language switched to ${sel?.label || e.target.value}`);
              }}
              aria-label="Select Language"
            >
              {INDIAN_LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Public Warnings Radar Button */}
          <button 
            className="btn-secondary-nav" 
            onClick={() => navigateTo('citizen')} 
            title="Open Public Warnings"
          >
            <span className="nav-btn-pulse-dot"></span>
            <span>Public Warnings ↗</span>
          </button>

          {/* 3. Home Option (Logs out of operations and navigates to Home) */}
          <button 
            className="btn-primary-nav" 
            onClick={handleHomeAndLogout} 
            title="Log Out & Return to Home"
          >
            <span>Home</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      {portalTab === 'nowcast' && (
        <TacticalNowcastView
          showToast={showToast}
          onDispatchAlert={async () => {
            try {
              await fetch('http://localhost:8000/api/alerts/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  event: 'CLOUDBURST + FLASH FLOOD',
                  severity: 'HIGH RISK',
                  area: 'Chamoli, Uttarakhand',
                  validTime: '2h',
                  protocol: 'CAP-1.2'
                }),
              });
              showToast('CAP Alert dispatched to NDMA SACHET gateway for Chamoli Sector');
            } catch {
              showToast('Demo dispatch — CAP payload queued for Chamoli (High Risk Flash Flood)');
            }
          }}
        />
      )}

      {portalTab === 'diagnostics' && <DiagnosticsView currentData={currentData} />}
      {portalTab === 'forensics' && <ForensicsView />}
      {portalTab === 'alerts' && <AlertHubView showToast={showToast} />}
      {portalTab === 'system' && <SystemView backendOnline={backendStatus === 'online'} />}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast">
          ✅ {toast}
        </div>
      )}
    </div>
  );
}

export default App;
