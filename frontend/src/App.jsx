import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import AnalysisView from './components/AnalysisView';
import EventsView from './components/EventsView';
import AlertsView from './components/AlertsView';
import SystemDrawer from './components/SystemDrawer';
import InstitutionalFooter from './components/InstitutionalFooter';
import AccessibilityMenu from './components/AccessibilityMenu';
import './components/OperationsPortal.css';

function App() {
  // Enforce Sovereign Dark Mode permanently across all browsers and devices
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
    localStorage.setItem('vayunet-theme', 'dark');
  }, []);

  const getViewFromLocation = () => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash.includes('login') || pathname.includes('login')) return 'login';
    if (hash.includes('warning') || hash.includes('citizen') || pathname.includes('warning') || pathname.includes('citizen')) return 'citizen';
    if (
      hash.includes('portal') || pathname.includes('portal') ||
      hash.includes('operations') || pathname.includes('operations') ||
      hash.includes('dashboard') || pathname.includes('dashboard') ||
      hash.includes('diagnostics') || pathname.includes('diagnostics') ||
      hash.includes('forensics') || pathname.includes('forensics')
    ) return 'portal';
    return 'home';
  };

  // Navigation layer: 'home' | 'login' | 'citizen' | 'portal'
  const [view, setView] = useState(getViewFromLocation);

  const getTabFromLocation = () => {
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    if (hash.includes('analysis') || hash.includes('diagnostics') || hash.includes('xai') || pathname.includes('analysis') || pathname.includes('diagnostics')) return 'analysis';
    if (hash.includes('events') || hash.includes('forensics') || hash.includes('replays') || pathname.includes('events') || pathname.includes('forensics')) return 'events';
    if (hash.includes('alerts') || pathname.includes('alerts')) return 'alerts';
    return 'nowcast';
  };

  // Authenticated Portal Tab: 'nowcast' | 'analysis' | 'events' | 'alerts'
  const [portalTab, setPortalTab] = useState(getTabFromLocation);

  // Ensure every page view and tab switch opens strictly from top of the page (0, 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, [view, portalTab]);
  const [isSystemDrawerOpen, setIsSystemDrawerOpen] = useState(() => {
    const h = window.location.hash.toLowerCase();
    return h.includes('system') || h.includes('telemetry');
  });
  const [isOperatorMenuOpen, setIsOperatorMenuOpen] = useState(false);
  const operatorMenuRef = useRef(null);

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

  // Close operator dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (operatorMenuRef.current && !operatorMenuRef.current.contains(e.target)) {
        setIsOperatorMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Hash-based & PopState URL synchronization
  useEffect(() => {
    const handleUrlChange = () => {
      const v = getViewFromLocation();
      setView(v);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      if (document.documentElement) document.documentElement.scrollTop = 0;
      if (document.body) document.body.scrollTop = 0;

      if (v === 'portal') {
        const t = getTabFromLocation();
        setPortalTab(t);
        const h = window.location.hash.toLowerCase();
        if (h.includes('system') || h.includes('telemetry')) {
          setIsSystemDrawerOpen(true);
        }
      }
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
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;

    if (newView === 'home') window.location.hash = '#/';
    else if (newView === 'login') window.location.hash = '#/login';
    else if (newView === 'citizen') window.location.hash = '#/warnings';
    else if (newView === 'portal') window.location.hash = '#/operations/nowcast';
  };

  const handleTabSwitch = (newTab) => {
    setPortalTab(newTab);
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
    window.location.hash = `#/operations/${newTab}`;
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
    fetch('https://vayunet-api.onrender.com/api/health')
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
          onEnterPortal={() => navigateTo('portal')}
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
      {/* OPERATIONS PORTAL HEADER (EXACT SAME CLASSES, SIZES, SHAPES & COLORS AS HOMEPAGE) */}
      <nav className="home-nav nav-scrolled ops-portal-nav" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 99999 }}>
        <div className="home-nav-inner" style={{ maxWidth: '100%' }}>
          {/* Brand Left */}
          <div className="home-brand" onClick={() => navigateTo('home')} title="Return to VAYUNET Home">
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

          {/* Middle Things: Operations Capsule Nav Links */}
          <div className="home-nav-links-capsule">
            {[
              { key: 'nowcast',  label: 'NOWCAST' },
              { key: 'analysis', label: 'ANALYSIS' },
              { key: 'events',   label: 'EVENTS' },
              { key: 'alerts',   label: 'ALERTS' },
            ].map(({ key, label }) => (
              <button
                key={key}
                className={`nav-link-item ${portalTab === key ? 'active' : ''}`}
                onClick={() => handleTabSwitch(key)}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right Side Things: Button shape, size, color keep same */}
          <div className="home-nav-actions">
            {/* ♿ Unified Accessibility & Language Control */}
            <AccessibilityMenu />

            {/* System Status (exact btn-secondary-nav shape, size, color) */}
            <button
              className="btn-secondary-nav"
              onClick={() => setIsSystemDrawerOpen(true)}
              title="Open System Status & Health Drawer"
            >
              <span className="nav-btn-pulse-dot" style={{ background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></span>
              <span style={{ color: '#86efac' }}>System Operational</span>
            </button>

            {/* Public Warnings (exact btn-secondary-nav shape, size, color) */}
            <button
              className="btn-secondary-nav"
              onClick={() => navigateTo('citizen')}
              title="Open Citizen Public Warning Portal"
            >
              <span className="nav-btn-pulse-dot"></span>
              <span>Public Warnings ↗</span>
            </button>

            {/* Operator Menu (exact btn-primary-nav shape, size, color) */}
            <div className="ops-operator-dropdown-wrap" ref={operatorMenuRef} style={{ position: 'relative' }}>
              <button
                className="btn-primary-nav"
                onClick={() => setIsOperatorMenuOpen(!isOperatorMenuOpen)}
                title="Operator & System Settings"
              >
                <span>{currentUser.user} ▾</span>
              </button>

              {isOperatorMenuOpen && (
                <div className="ops-operator-menu">
                  <div className="ops-menu-header">
                    <div className="ops-menu-user">{currentUser.user}</div>
                    <div className="ops-menu-role">{currentUser.role} · {currentUser.unit}</div>
                  </div>

                  <button
                    className="ops-menu-item"
                    onClick={() => {
                      setIsOperatorMenuOpen(false);
                      setIsSystemDrawerOpen(true);
                    }}
                  >
                    <span>🖥️</span>
                    <span>System Status & Telemetry</span>
                  </button>

                  <button
                    className="ops-menu-item"
                    onClick={() => {
                      setIsOperatorMenuOpen(false);
                      setIsSystemDrawerOpen(true);
                    }}
                  >
                    <span>📡</span>
                    <span>Ingested Data Sources</span>
                  </button>

                  <div className="ops-menu-divider" />

                  <button
                    className="ops-menu-item"
                    onClick={() => {
                      setIsOperatorMenuOpen(false);
                      handleHomeAndLogout();
                    }}
                  >
                    <span>🏠</span>
                    <span>Return to Public Home</span>
                  </button>

                  <button
                    className="ops-menu-item ops-menu-item-danger"
                    onClick={() => {
                      setIsOperatorMenuOpen(false);
                      handleSignOut();
                    }}
                  >
                    <span>⎋</span>
                    <span>Sign Out (Lock Console)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE OPERATIONAL TOGGLES (Exclusively displayed below header in phone view) */}
      <div className="ops-mobile-nav-bar">
        <div className="ops-mobile-capsule">
          {[
            { key: 'nowcast',  label: 'NOWCAST' },
            { key: 'analysis', label: 'ANALYSIS' },
            { key: 'events',   label: 'EVENTS' },
            { key: 'alerts',   label: 'ALERTS' },
          ].map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`nav-link-item ${portalTab === key ? 'active' : ''}`}
              onClick={() => handleTabSwitch(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* RENDER ACTIVE OPERATIONS VIEW (Offset by 60px for fixed header) */}
      <main className="ops-portal-body">
        {portalTab === 'nowcast' && (
          <TacticalNowcastView
            onNavigateTab={handleTabSwitch}
            showToast={showToast}
            onDispatchAlert={async () => {
              try {
                await fetch('https://vayunet-api.onrender.com/api/alerts/broadcast', {
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

        {portalTab === 'analysis' && (
          <AnalysisView 
            currentData={currentData} 
            onNavigateTab={handleTabSwitch} 
          />
        )}
        {portalTab === 'events' && (
          <EventsView 
            onNavigateTab={handleTabSwitch} 
          />
        )}
        {portalTab === 'alerts' && (
          <AlertsView 
            showToast={showToast} 
            onNavigateTab={handleTabSwitch} 
          />
        )}
      </main>

      {/* SHARED FULL-WIDTH INSTITUTIONAL FOOTER CONSISTENT ACROSS ALL 4 OPERATIONAL PAGES */}
      <InstitutionalFooter />

      {/* SYSTEM STATUS & TELEMETRY UTILITY DRAWER */}
      <SystemDrawer
        isOpen={isSystemDrawerOpen}
        onClose={() => setIsSystemDrawerOpen(false)}
        backendOnline={backendStatus === 'online'}
      />

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
