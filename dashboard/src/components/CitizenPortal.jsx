import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import gsap from 'gsap';
import './CitizenPortal.css';
import { INDIAN_LANGUAGES } from './HomePage';

// Pre-defined database of Severe Weather Zones & Safe Zones across India
const LOCATION_DATABASE = {
  mcleodganj: {
    id: 'mcleodganj',
    name: 'McLeodganj',
    district: 'Kangra District, Himachal Pradesh',
    pincode: '176219',
    center: [32.2426, 76.3213],
    isAffected: true,
    riskLevel: 'HIGH RISK',
    riskClass: 'risk-high',
    riskColor: '#dc2626',
    timeframe: 'Within 2 – 4 hours',
    hazard: 'Flash Flood + Cloudburst',
    description: 'Your location is inside the warning area. Heavy rainfall may cause flash floods, sudden rises in streams and dangerous travel conditions.',
    safeShelter: {
      name: 'Govt. Polytechnic College',
      distance: '2.4 km away, McLeodganj',
      address: 'Upper Dharamkot Road, McLeodganj',
      elevation: '2,082 m (Safe Highland Plateau)',
      capacity: '850 Persons',
      facilities: 'Drinking Water, Medical Post, DG Power Backup',
      contact: 'DEOC Helpline: 01892-229000',
      coords: [32.2460, 76.3260]
    },
    nearbyWarnings: [
      { name: 'Dharamsala', dist: '~ 8 km', level: 'High', color: '#dc2626' },
      { name: 'Kangra', dist: '~ 20 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Palampur', dist: '~ 45 km', level: 'Moderate', color: '#ca8a04' }
    ]
  },
  dharamsala: {
    id: 'dharamsala',
    name: 'Dharamsala',
    district: 'Kangra District, Himachal Pradesh',
    pincode: '176215',
    center: [32.2190, 76.3234],
    isAffected: true,
    riskLevel: 'HIGH RISK',
    riskClass: 'risk-high',
    riskColor: '#dc2626',
    timeframe: 'Within 2 – 4 hours',
    hazard: 'Flash Flood & Valley Torrent',
    description: 'Convective storm cloud developing above Dhauladhar ridge. Rapid runoff entering Bhagsunag stream and lower nullahs.',
    safeShelter: {
      name: 'Dharamsala Indoor Sports Complex',
      distance: '1.8 km away, Dharamsala',
      address: 'Civil Lines, Lower Dharamsala',
      elevation: '1,457 m (Reinforced Relief Camp)',
      capacity: '1,200 Persons',
      facilities: 'First Aid Dispensary, Satellite Phone, Clean Water',
      contact: 'Kangra Police: 112 / 01892-222244',
      coords: [32.2150, 76.3200]
    },
    nearbyWarnings: [
      { name: 'McLeodganj', dist: '~ 8 km', level: 'High', color: '#dc2626' },
      { name: 'Kangra', dist: '~ 18 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Shahpur', dist: '~ 24 km', level: 'Advisory', color: '#0284c7' }
    ]
  },
  chamoli: {
    id: 'chamoli',
    name: 'Chamoli / Joshimath',
    district: 'Chamoli District, Uttarakhand',
    pincode: '246443',
    center: [30.4124, 79.3243],
    isAffected: true,
    riskLevel: 'EXTREME RISK',
    riskClass: 'risk-extreme',
    riskColor: '#dc2626',
    timeframe: 'Immediate (1 – 3 hours)',
    hazard: 'Cloudburst & Debris Flow',
    description: 'High-altitude convective cell collapse. Alaknanda catchment water levels rising rapidly. Mandatory evacuation of riverbanks.',
    safeShelter: {
      name: 'Gopeshwar District Sports Pavilion',
      distance: '3.1 km away, Gopeshwar',
      address: 'Main Bazar High Ground, Gopeshwar',
      elevation: '1,550 m (Above River Flood Line)',
      capacity: '1,500 Persons',
      facilities: 'NDRF Base, Emergency Medical Tents, Rations',
      contact: 'Uttarakhand SEOC: 1070 / 0135-2710334',
      coords: [30.4050, 79.3300]
    },
    nearbyWarnings: [
      { name: 'Joshimath', dist: '~ 22 km', level: 'Extreme', color: '#dc2626' },
      { name: 'Karnaprayag', dist: '~ 32 km', level: 'High', color: '#ea580c' },
      { name: 'Rudraprayag', dist: '~ 48 km', level: 'Moderate', color: '#ca8a04' }
    ]
  },
  wayanad: {
    id: 'wayanad',
    name: 'Wayanad (Meppadi)',
    district: 'Wayanad District, Kerala',
    pincode: '673577',
    center: [11.5564, 76.1320],
    isAffected: true,
    riskLevel: 'EXTREME RISK',
    riskClass: 'risk-extreme',
    riskColor: '#dc2626',
    timeframe: 'Within 1 – 3 hours',
    hazard: 'Extreme Orographic Rain & Landslide',
    description: 'Torrential Western Ghats downpour producing saturated soil runoff. Chooralmala and Mundakkai river corridors in red danger.',
    safeShelter: {
      name: 'St. Joseph Higher Secondary School Relief Camp',
      distance: '2.1 km away, Meppadi',
      address: 'Ooty Road, Meppadi Central',
      elevation: '920 m (Safe Ridge Elevation)',
      capacity: '900 Persons',
      facilities: 'Kitchen, SDRF Logistics, Medical Station',
      contact: 'Wayanad District Control: 1077 / 04936-204151',
      coords: [11.5520, 76.1280]
    },
    nearbyWarnings: [
      { name: 'Kalpetta', dist: '~ 14 km', level: 'High', color: '#ea580c' },
      { name: 'Sulthan Bathery', dist: '~ 26 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Mananthavady', dist: '~ 42 km', level: 'Moderate', color: '#ca8a04' }
    ]
  },
  mumbai: {
    id: 'mumbai',
    name: 'Mumbai Coastal Delta',
    district: 'Mumbai Suburban, Maharashtra',
    pincode: '400001',
    center: [19.0760, 72.8777],
    isAffected: true,
    riskLevel: 'HIGH RISK',
    riskClass: 'risk-high',
    riskColor: '#ea580c',
    timeframe: 'Within 2 – 4 hours',
    hazard: 'Severe Squall & Coastal Inundation',
    description: 'High-tide sync with intense convective rain bands over Mithi river basin. Extreme waterlogging expected in low-lying corridors.',
    safeShelter: {
      name: 'Dadar Central Municipal Relief Pavilion',
      distance: '2.8 km away, Dadar West',
      address: 'Dr. B. Ambedkar Road, Dadar',
      elevation: '28 m (Elevated Concrete Multi-Story Complex)',
      capacity: '2,500 Persons',
      facilities: 'Emergency Generator, BMC Food Supplies, Medical Unit',
      contact: 'BMC Disaster Management: 1916 (Toll-Free)',
      coords: [19.0178, 72.8478]
    },
    nearbyWarnings: [
      { name: 'Thane', dist: '~ 24 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Navi Mumbai', dist: '~ 28 km', level: 'Moderate', color: '#ca8a04' },
      { name: 'Palghar', dist: '~ 48 km', level: 'Advisory', color: '#0284c7' }
    ]
  },
  delhi: {
    id: 'delhi',
    name: 'New Delhi',
    district: 'National Capital Region (NCR)',
    pincode: '110001',
    center: [28.6139, 77.2090],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Atmospheric stability indices (CAPE, IWV, CTT) are within nominal thresholds. No flood, cloudburst or squall alerts in effect.',
    safeShelter: {
      name: 'Connaught Place Civil Defense Center',
      distance: '1.2 km away, New Delhi',
      address: 'Palika Kendra, Sansad Marg',
      elevation: '216 m (Standard Urban Ground)',
      capacity: 'Civil Defense Headquarters',
      facilities: 'Information Hub, Emergency Operations Relay',
      contact: 'Delhi Disaster Management: 1077',
      coords: [28.6280, 77.2150]
    },
    nearbyWarnings: []
  },
  bengaluru: {
    id: 'bengaluru',
    name: 'Bengaluru Urban',
    district: 'Bengaluru Urban, Karnataka',
    pincode: '560001',
    center: [12.9716, 77.5946],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Atmospheric parameters are nominal across the Deccan Plateau. Light intermittent drizzle possible, well below alert thresholds.',
    safeShelter: {
      name: 'BBMP Central Relief Center',
      distance: '2.0 km away, Corporation Circle',
      address: 'Hudson Circle, Bengaluru',
      elevation: '920 m (Safe Plateau Ground)',
      capacity: 'Municipal Disaster Center',
      facilities: 'Civil Defense Reserve, Karnataka SDRF Liaison',
      contact: 'BBMP Control Room: 080-22221188',
      coords: [12.9650, 77.5850]
    },
    nearbyWarnings: []
  },
  chandigarh: {
    id: 'chandigarh',
    name: 'Chandigarh Tri-City',
    district: 'Union Territory of Chandigarh',
    pincode: '160017',
    center: [30.7333, 76.7794],
    isAffected: false,
    riskLevel: 'SAFE ZONE',
    riskClass: 'risk-safe',
    riskColor: '#16a34a',
    timeframe: 'Conditions Nominal',
    hazard: 'No Active Severe Warnings',
    description: 'Fair weather conditions prevailing in the plain foothills. Upstream mountain catchments under observation.',
    safeShelter: {
      name: 'Sector 17 Civil Defense Facility',
      distance: '1.5 km away, Sector 17',
      address: 'Bridge Market, Chandigarh',
      elevation: '321 m (Safe Urban Plain)',
      capacity: 'Disaster Coordination Cell',
      facilities: 'Relief Supplies, Communication Hub',
      contact: 'Chandigarh Emergency: 112',
      coords: [30.7400, 76.7850]
    },
    nearbyWarnings: []
  }
};

// Smooth Leaflet Controller
function MapFlyController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 11, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

export default function CitizenPortal({ onBackHome, onEnterPortal }) {
  // Active selected location state (defaults to McLeodganj as seen in reference image)
  const [selectedId, setSelectedId] = useState('mcleodganj');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetecting, setIsDetecting] = useState(false);
  const [showNearbyOnMap, setShowNearbyOnMap] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [guidanceModalOpen, setGuidanceModalOpen] = useState(false);
  const [shelterModalOpen, setShelterModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [language, setLanguage] = useState('EN');
  const [liveIstTime, setLiveIstTime] = useState('');

  const headerRef = useRef(null);
  const footerRef = useRef(null);

  const loc = LOCATION_DATABASE[selectedId] || LOCATION_DATABASE.mcleodganj;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Real-time dynamic IST clock for sovereign ticker
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setLiveIstTime(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST');
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  // GSAP Entrance & Pulse Animations for Smart Header and Footer
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Header entrance animation
      if (headerRef.current) {
        gsap.from(headerRef.current, {
          y: -24,
          opacity: 0,
          duration: 0.75,
          ease: 'power3.out'
        });

        gsap.from('.cp-nav-anim-item', {
          y: -10,
          opacity: 0,
          stagger: 0.05,
          duration: 0.45,
          delay: 0.15,
          ease: 'power2.out'
        });

        // Pulsing live beacon
        gsap.to('.cp-live-pulse-beacon', {
          scale: 1.4,
          opacity: 0.35,
          repeat: -1,
          yoyo: true,
          duration: 0.85,
          ease: 'sine.inOut'
        });
      }

      // Footer entrance animation
      if (footerRef.current) {
        gsap.from('.cp-footer-anim-item', {
          y: 20,
          opacity: 0,
          stagger: 0.06,
          duration: 0.6,
          delay: 0.25,
          ease: 'power2.out'
        });

        gsap.to('.cp-footer-telemetry-dot', {
          boxShadow: '0 0 10px #22c55e',
          repeat: -1,
          yoyo: true,
          duration: 1.1,
          ease: 'sine.inOut'
        });
      }
    });

    return () => ctx.revert();
  }, []);

  // Auto-Detect Location on initial component mount
  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // Find nearest location from our database
          let nearestKey = 'mcleodganj';
          let minDistance = Infinity;

          Object.keys(LOCATION_DATABASE).forEach((key) => {
            const item = LOCATION_DATABASE[key];
            const dist = Math.hypot(item.center[0] - latitude, item.center[1] - longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearestKey = key;
            }
          });

          // If within ~0.6 degrees (~65 km), select nearest
          if (minDistance < 0.6) {
            setSelectedId(nearestKey);
            showToast(`📍 Auto-detected your location: ${LOCATION_DATABASE[nearestKey].name}`);
          }
        },
        () => {
          // If permission denied or fallback, keep default McLeodganj
        },
        { timeout: 4000 }
      );
    }
  }, []);

  // Search handler
  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.toLowerCase().trim();

    // Find match by name, district, pincode
    const foundKey = Object.keys(LOCATION_DATABASE).find((key) => {
      const item = LOCATION_DATABASE[key];
      return (
        item.name.toLowerCase().includes(query) ||
        item.district.toLowerCase().includes(query) ||
        item.pincode.includes(query)
      );
    });

    if (foundKey) {
      setSelectedId(foundKey);
      setSearchQuery('');
      showToast(`Switched view to ${LOCATION_DATABASE[foundKey].name}`);
    } else {
      showToast(`No specific station found for "${searchQuery}". Showing national regional view.`);
    }
  };

  // Use My Location click handler
  const handleUseMyLocation = () => {
    setIsDetecting(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsDetecting(false);
          const { latitude, longitude } = pos.coords;
          let nearestKey = 'mcleodganj';
          let minDistance = Infinity;

          Object.keys(LOCATION_DATABASE).forEach((key) => {
            const item = LOCATION_DATABASE[key];
            const dist = Math.hypot(item.center[0] - latitude, item.center[1] - longitude);
            if (dist < minDistance) {
              minDistance = dist;
              nearestKey = key;
            }
          });

          setSelectedId(nearestKey);
          showToast(`📍 Located: ${LOCATION_DATABASE[nearestKey].name} (${LOCATION_DATABASE[nearestKey].isAffected ? 'Warning Zone' : 'Safe Zone'})`);
        },
        (err) => {
          setIsDetecting(false);
          showToast('GPS detection unavailable or denied. Showing default region.');
        },
        { timeout: 6000 }
      );
    } else {
      setIsDetecting(false);
      showToast('Geolocation not supported by browser.');
    }
  };

  // Share functionality
  const handleShare = () => {
    const shareTitle = `⚠️ VAYUNET Weather Warning: ${loc.name}`;
    const shareText = `${loc.isAffected ? '⚠️ SEVERE WEATHER WARNING' : '✅ Safe Status'} for ${loc.name} (${loc.district}): ${loc.hazard}. Check your nearest safe shelter on VAYUNET.`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      }).catch(() => {
        setShareModalOpen(true);
      });
    } else {
      setShareModalOpen(true);
    }
  };

  const copyPageLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('🔗 Warning portal link copied to clipboard!');
    setShareModalOpen(false);
  };

  const openGoogleDirections = () => {
    const dest = `${loc.safeShelter.coords[0]},${loc.safeShelter.coords[1]}`;
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}`, '_blank');
  };

  // Custom pulsing pin for target location
  const targetPinIcon = L.divIcon({
    className: 'cp-target-map-pin',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${loc.riskColor}; opacity: 0.25; animation: cpPulse 1.8s infinite;"></div>
        <div style="position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #ffffff; border: 3px solid ${loc.riskColor}; box-shadow: 0 0 10px rgba(0,0,0,0.35);"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });

  return (
    <div className="cp-wrapper">
      {/* 1. SMART REDEFINED SOVEREIGN HEADER WITH GSAP ANIMATIONS */}
      <header className="cp-header-container" ref={headerRef}>
        {/* Main Smart Navigation Bar */}
        <nav className="cp-navbar">
          <div className="cp-nav-inner">
            <div className="home-brand" onClick={onBackHome} title="Return to VAYUNET Home" style={{ cursor: 'pointer' }}>
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

            <div className="home-nav-links-capsule cp-nav-anim-item">
              <button className="nav-link-item" onClick={onBackHome}>Home</button>
              <button className="nav-link-item active">Public Warnings</button>
              <button className="nav-link-item" onClick={() => setGuidanceModalOpen(true)}>Safety Guide</button>
              <button className="nav-link-item" onClick={() => setShelterModalOpen(true)}>Resources</button>
            </div>

            <div className="home-nav-actions cp-nav-anim-item">
              <div className="home-lang-wrap" title="Select Language">
                <svg className="home-lang-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span className="home-lang-code-mobile">{language}</span>
                <select 
                  className="home-lang-select" 
                  value={language} 
                  onChange={(e) => {
                    setLanguage(e.target.value);
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

              {/* 2. Home Navigation Option */}
              <button 
                className="btn-secondary-nav"
                onClick={onBackHome}
                id="nav-home-btn"
                title="Return to VAYUNET Home"
              >
                <span>← Home</span>
              </button>

              {/* 3. Enter Operations Portal Option */}
              <button
                className="btn-primary-nav"
                onClick={onEnterPortal}
                id="nav-enter-portal-btn"
                title="Enter Operations Portal"
              >
                <span>Enter Operations Portal →</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Top Sovereign Emergency Broadcast Ticker (Below Header) */}
        <div className="cp-header-ticker">
          <div className="cp-ticker-inner">
            <div className="cp-ticker-left cp-nav-anim-item">
              <span className="cp-tricolor-flag">🇮🇳</span>
              <span className="cp-gov-title">भारत सरकार | GOVERNMENT OF INDIA</span>
              <span className="cp-ticker-divider">/</span>
              <span className="cp-dept-title">Ministry of Earth Sciences (MoES)</span>
            </div>

            <div className="cp-ticker-center cp-nav-anim-item">
              <span className="cp-live-pulse-beacon"></span>
              <span className="cp-live-beacon-text">LIVE NOWCAST INGEST</span>
              <span className="cp-ticker-chip">4km Convective Grid</span>
              <span className="cp-ticker-time">{liveIstTime || '08:30:00 PM IST'}</span>
            </div>

            <div className="cp-ticker-right cp-nav-anim-item">
              <a href="tel:1078" className="cp-ticker-helpline" title="Click to dial 24x7 NDMA Disaster Helpline">
                <span className="cp-helpline-icon">🚨</span>
                <span>NDMA Helpline: <strong>1078</strong></span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* 2. HERO BANNER WITH SEARCH BAR OVERLAY */}
      <section 
        className="cp-hero" 
        style={{ backgroundImage: `url(/hazards_mountain_backdrop.jpg)` }}
      >
        <div className="cp-hero-overlay"></div>
        <div className="cp-hero-content">
          {/* Quick Navigation: Current Page Badge & Outbound Navigation Links */}
          <div className="cp-quick-nav-bar">
            {/* Active Current Page Badge */}
            <div className="cp-current-page-pill" title="Current Location: Public Severe Weather Warnings">
              <span className="cp-pulse-warning-dot" />
              <span>Public Warnings</span>
            </div>

            {/* Quick Navigation Actions */}
            <div className="cp-quick-nav-links">
              <button 
                type="button" 
                className="cp-quick-nav-btn cp-quick-home-btn"
                onClick={onBackHome}
                title="Return to VAYUNET Home"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <span>Home</span>
              </button>

              <button 
                type="button" 
                className="cp-quick-nav-btn cp-quick-ops-link-btn"
                onClick={onEnterPortal}
                title="Navigate to Operational Console"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                <span>Operational Page</span>
                <span className="cp-quick-btn-arrow">↗</span>
              </button>
            </div>
          </div>

          <div className="cp-hero-top">
            <div>
              <div className="cp-hero-eyebrow">Severe Weather Warning</div>
              <h1 className="cp-hero-title">Severe Weather Warning</h1>
              <p className="cp-hero-subtitle">Check your area. Stay informed. Stay safe.</p>
            </div>
            <div className="cp-hero-tagline">
              <div className="cp-hero-tagline-text">Safer People<br />Stronger Communities</div>
              <div className="cp-hero-tagline-bar">
                <div className="cp-tagline-segment orange"></div>
                <div className="cp-tagline-segment green"></div>
              </div>
            </div>
          </div>

          {/* Search Card */}
          <form className="cp-search-card" onSubmit={handleSearch}>
            <div className="cp-search-input-wrap">
              <svg className="cp-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input 
                type="text" 
                className="cp-search-input"
                placeholder="Search your city, district, PIN code or landmark"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button type="submit" className="cp-search-btn">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              Search
            </button>

            <span className="cp-search-or">or</span>

            <button 
              type="button" 
              className="cp-locate-btn"
              onClick={handleUseMyLocation}
              disabled={isDetecting}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="22" y1="12" x2="18" y2="12"></line>
                <line x1="6" y1="12" x2="2" y2="12"></line>
                <line x1="12" y1="6" x2="12" y2="2"></line>
                <line x1="12" y1="22" x2="12" y2="18"></line>
              </svg>
              {isDetecting ? 'Locating...' : 'Use My Location'}
            </button>
          </form>

          <div className="cp-search-examples">
            e.g.{' '}
            <span onClick={() => setSelectedId('mcleodganj')}>McLeodganj</span>,{' '}
            <span onClick={() => setSelectedId('dharamsala')}>Dharamsala</span>,{' '}
            <span onClick={() => setSelectedId('chamoli')}>Chamoli</span>,{' '}
            <span onClick={() => setSelectedId('wayanad')}>Wayanad</span>,{' '}
            <span onClick={() => setSelectedId('delhi')}>Delhi</span>, 176215
          </div>

          <div className="cp-location-pill-banner">
            <div className="cp-pulse-dot"></div>
            <span>
              Viewing area: <strong>{loc.name}</strong> ({loc.district}) &mdash;{' '}
              {loc.isAffected ? '⚠️ Active Alert Zone' : '✅ Nominal Conditions (Safe Zone)'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. MAIN INTERACTIVE CONTENT CONTAINER */}
      <main className="cp-main-container">
        {/* Top Grid: Warning Card + Interactive Map */}
        <div className="cp-top-grid">
          {/* Left: Status / Warning Card */}
          <div className={`cp-warning-card ${loc.riskClass}`}>
            <div>
              <div className="cp-badge-row">
                <div className={`cp-risk-badge ${loc.isAffected ? (loc.riskLevel.includes('EXTREME') ? 'red' : 'red') : 'green'}`}>
                  {loc.isAffected ? (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                      </svg>
                      {loc.riskLevel}
                    </>
                  ) : (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        <polyline points="9 12 11 14 15 10"></polyline>
                      </svg>
                      {loc.riskLevel}
                    </>
                  )}
                </div>

                <div className={`cp-lead-pill ${loc.isAffected ? '' : 'green'}`}>
                  {loc.timeframe}
                </div>
              </div>

              <h2 className="cp-warning-loc-title">{loc.name}</h2>
              <p className="cp-warning-loc-sub">{loc.district}</p>

              <div className="cp-hazard-name">
                {loc.isAffected ? (
                  <>
                    <span className="highlight">{loc.hazard.split(' + ')[0]}</span>
                    {loc.hazard.includes(' + ') && ` + ${loc.hazard.split(' + ')[1]}`}
                  </>
                ) : (
                  <span style={{ color: '#16a34a' }}>{loc.hazard}</span>
                )}
              </div>

              <p className="cp-hazard-desc">{loc.description}</p>

              {/* Safe State Alert helper if user is not in danger zone */}
              {!loc.isAffected && (
                <div className="cp-safe-state-box">
                  <div className="cp-safe-icon">🛡️</div>
                  <div>
                    <h4 className="cp-safe-title">You are currently in a Safe Zone</h4>
                    <p className="cp-safe-desc">
                      Atmospheric stability and precipitation radars show normal baseline readings in this area.
                      If you plan to travel, review current active warning zones below.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="cp-warning-actions">
                {loc.isAffected ? (
                  <>
                    <button 
                      className="cp-btn-primary-action"
                      onClick={() => setGuidanceModalOpen(true)}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      What Should I Do Now?
                    </button>

                    <button 
                      className="cp-btn-secondary-action"
                      onClick={() => {
                        const mapEl = document.getElementById('cp-leaflet-map');
                        mapEl?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      View on Map &rarr;
                    </button>
                  </>
                ) : (
                  <button 
                    className="cp-btn-primary-action"
                    style={{ background: '#16a34a' }}
                    onClick={() => {
                      setSelectedId('mcleodganj');
                      showToast('Switched to active warning zone: McLeodganj');
                    }}
                  >
                    View Active Disaster Zones &rarr;
                  </button>
                )}

                <button 
                  className="cp-btn-share-action"
                  onClick={handleShare}
                  title="Share Warning Alert"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  Share Alert
                </button>
              </div>

              {/* Quick links to active affected zones if safe */}
              {!loc.isAffected && (
                <div className="cp-active-zones-banner">
                  <div className="cp-active-zones-title">
                    <span>⚠️</span> Current Active Warning Zones in India:
                  </div>
                  <div className="cp-active-zones-list">
                    <button className="cp-zone-chip" onClick={() => setSelectedId('mcleodganj')}>
                      🔴 McLeodganj (HP)
                    </button>
                    <button className="cp-zone-chip" onClick={() => setSelectedId('chamoli')}>
                      🔴 Chamoli (UK)
                    </button>
                    <button className="cp-zone-chip" onClick={() => setSelectedId('wayanad')}>
                      🔴 Wayanad (KL)
                    </button>
                    <button className="cp-zone-chip" onClick={() => setSelectedId('mumbai')}>
                      🟠 Mumbai (MH)
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="cp-warning-footer">
              <span>Last updated: 08 Sep 2026, 08:15 PM IST</span>
              <span>Source: VAYUNET (MoES) ⓘ</span>
            </div>
          </div>

          {/* Right: Map Card */}
          <div className="cp-map-card" id="cp-leaflet-map">
            <div className="cp-map-viewport">

              <MapContainer
                center={loc.center}
                zoom={11}
                scrollWheelZoom={true}
                style={{ width: '100%', height: '100%' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />

                <MapFlyController center={loc.center} zoom={loc.isAffected ? 12 : 10} />

                {/* Concentric Risk Heat Zones if affected */}
                {loc.isAffected && (
                  <>
                    {/* Outermost: Advisory Blue */}
                    <Circle
                      center={loc.center}
                      radius={12000}
                      pathOptions={{
                        color: '#3b82f6',
                        fillColor: '#3b82f6',
                        fillOpacity: 0.15,
                        weight: 1,
                        dashArray: '4 4'
                      }}
                    />
                    {/* Outer: Moderate Yellow */}
                    <Circle
                      center={loc.center}
                      radius={8500}
                      pathOptions={{
                        color: '#eab308',
                        fillColor: '#eab308',
                        fillOpacity: 0.28,
                        weight: 1.5
                      }}
                    />
                    {/* Mid: High Orange */}
                    <Circle
                      center={loc.center}
                      radius={5000}
                      pathOptions={{
                        color: '#f97316',
                        fillColor: '#f97316',
                        fillOpacity: 0.45,
                        weight: 2
                      }}
                    />
                    {/* Core: Extreme Red */}
                    <Circle
                      center={loc.center}
                      radius={2800}
                      pathOptions={{
                        color: '#dc2626',
                        fillColor: '#dc2626',
                        fillOpacity: 0.65,
                        weight: 2.5
                      }}
                    />
                  </>
                )}

                {/* Safe Shelter Marker */}
                <Marker
                  position={loc.safeShelter.coords}
                  icon={L.divIcon({
                    className: 'cp-shelter-marker',
                    html: `
                      <div style="background: #16a34a; color: #fff; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #ffffff; box-shadow: 0 2px 8px rgba(0,0,0,0.3); font-size: 14px;">
                        🏛️
                      </div>
                    `,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                  })}
                >
                  <Popup>
                    <div style={{ padding: '4px' }}>
                      <strong style={{ color: '#16a34a' }}>🏛️ Designated Safe Shelter</strong>
                      <div style={{ fontWeight: 700, fontSize: '13px', marginTop: '2px' }}>{loc.safeShelter.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{loc.safeShelter.address}</div>
                      <button 
                        onClick={openGoogleDirections}
                        style={{ marginTop: '6px', background: '#0284c7', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '11px', cursor: 'pointer' }}
                      >
                        Navigate &rarr;
                      </button>
                    </div>
                  </Popup>
                </Marker>

                {/* Central Location Pin */}
                <Marker position={loc.center} icon={targetPinIcon}>
                  <Popup>
                    <div>
                      <strong>{loc.name}</strong>
                      <div>{loc.hazard}</div>
                      <div style={{ fontSize: '11px', color: loc.riskColor, fontWeight: 700 }}>{loc.riskLevel}</div>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>

              {/* Map Floating Legend */}
              <div className="cp-map-legend-box">
                <div className="cp-map-legend-title">Warning Level</div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot extreme"></div>
                  <span>Extreme</span>
                </div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot high"></div>
                  <span>High</span>
                </div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot moderate"></div>
                  <span>Moderate</span>
                </div>
                <div className="cp-legend-item">
                  <div className="cp-legend-dot advisory"></div>
                  <span>Advisory</span>
                </div>
              </div>

              {/* Show Nearby Areas button */}
              <button 
                className="cp-map-nearby-toggle"
                onClick={() => {
                  setShowNearbyOnMap(!showNearbyOnMap);
                  showToast(showNearbyOnMap ? 'Hidden nearby points' : 'Showing all nearby regional zones');
                }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
                {showNearbyOnMap ? 'Hide Nearby Areas' : 'Show Nearby Areas'}
              </button>

              <div className="cp-map-scale-badge">5 km scale</div>
            </div>
          </div>
        </div>

        {/* Middle Triplet Row: 3 Action Cards */}
        <div className="cp-triplet-grid">
          {/* Card 1: What This Means */}
          <div className="cp-action-card">
            <div className="cp-card-header">
              <span className="cp-card-icon">🌧️</span>
              <h3 className="cp-card-title">What This Means</h3>
            </div>
            <ul className="cp-means-list">
              <li className="cp-means-item">
                <span className="cp-means-icon">👤</span>
                <span>{loc.isAffected ? 'Flash flooding in low-lying areas' : 'Normal water flow in rivers and local drains'}</span>
              </li>
              <li className="cp-means-item">
                <span className="cp-means-icon">〰️</span>
                <span>{loc.isAffected ? 'Sudden rises in streams and rivers' : 'Streams operating within seasonal bounds'}</span>
              </li>
              <li className="cp-means-item">
                <span className="cp-means-icon">⚠️</span>
                <span>{loc.isAffected ? 'Road closures and unsafe travel' : 'Standard transit routes fully operational'}</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Do This Now */}
          <div className="cp-action-card">
            <div className="cp-card-header">
              <span className="cp-card-icon">🛡️</span>
              <h3 className="cp-card-title">Do This Now</h3>
            </div>
            <ul className="cp-steps-list">
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>1</div>
                <span>{loc.isAffected ? 'Move to higher and safer ground' : 'Keep emergency numbers saved'}</span>
              </li>
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>2</div>
                <span>{loc.isAffected ? 'Avoid rivers, streams and low-lying roads' : 'Charge power banks and mobile devices'}</span>
              </li>
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>3</div>
                <span>{loc.isAffected ? 'Do not travel unless necessary' : 'Check regional warnings before traveling'}</span>
              </li>
              <li className="cp-step-item">
                <div className="cp-step-num" style={{ background: loc.isAffected ? '#dc2626' : '#16a34a' }}>4</div>
                <span>{loc.isAffected ? 'Follow official instructions' : 'Stay tuned to official weather advisories'}</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Nearest Safe Location (Tailored to citizen's location!) */}
          <div className="cp-action-card">
            <div className="cp-card-header">
              <span className="cp-card-icon">🏛️</span>
              <h3 className="cp-card-title">Nearest Safe Location</h3>
              <span className="cp-card-badge">Verified Shelter</span>
            </div>

            <h4 className="cp-safe-shelter-name">{loc.safeShelter.name}</h4>
            <div className="cp-safe-shelter-dist">{loc.safeShelter.distance}</div>

            <div className="cp-shelter-actions">
              <button className="cp-btn-directions" onClick={openGoogleDirections}>
                Get Directions
              </button>
              <button className="cp-btn-view-more" onClick={() => setShelterModalOpen(true)}>
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Lower Row: Nearby Warnings + Emergency Contacts */}
        <div className="cp-lower-grid">
          {/* Nearby Warnings */}
          <div className="cp-lower-card">
            <div className="cp-nearby-header">
              <div className="cp-nearby-header-left">
                <span>🎯</span>
                <span>Nearby Warnings (within 50 km)</span>
              </div>
              <span 
                className="cp-view-all-link"
                onClick={() => showToast('Displaying full regional cluster stations')}
              >
                View All &rarr;
              </span>
            </div>

            {loc.nearbyWarnings.length > 0 ? (
              <div className="cp-nearby-pills-row">
                {loc.nearbyWarnings.map((nw, i) => (
                  <div 
                    key={i} 
                    className="cp-nearby-pill-card"
                    onClick={() => {
                      const key = nw.name.toLowerCase().replace(/[^a-z]/g, '');
                      if (LOCATION_DATABASE[key]) {
                        setSelectedId(key);
                        showToast(`Switched view to ${nw.name}`);
                      } else {
                        showToast(`Station ${nw.name}: Current Status ${nw.level}`);
                      }
                    }}
                  >
                    <div className="cp-nearby-pill-top">
                      <div className="cp-nearby-dot" style={{ background: nw.color }}></div>
                      <span>{nw.name}</span>
                    </div>
                    <div className="cp-nearby-dist">{nw.dist}</div>
                    <div className={`cp-nearby-badge ${nw.level.toLowerCase()}`}>
                      {nw.level}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#64748b', padding: '12px 0' }}>
                No severe warning zones within 50 km of this location. Surroundings are nominal.
              </div>
            )}
          </div>

          {/* Emergency Contacts */}
          <div className="cp-lower-card">
            <div className="cp-nearby-header">
              <div className="cp-nearby-header-left">
                <span>📞</span>
                <span>Emergency Contacts</span>
              </div>
            </div>

            <div className="cp-emergency-row">
              <a href="tel:112" className="cp-contact-btn">
                <span className="cp-contact-icon">📞</span>
                <div className="cp-contact-info">
                  <span className="cp-contact-num red">112</span>
                  <span className="cp-contact-label">Emergency</span>
                </div>
              </a>

              <a href="tel:108" className="cp-contact-btn">
                <span className="cp-contact-icon">🚑</span>
                <div className="cp-contact-info">
                  <span className="cp-contact-num red">108</span>
                  <span className="cp-contact-label">Ambulance</span>
                </div>
              </a>

              <a href="tel:100" className="cp-contact-btn">
                <span className="cp-contact-icon">👮</span>
                <div className="cp-contact-info">
                  <span className="cp-contact-num blue">100</span>
                  <span className="cp-contact-label">Police</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Official Source & Transparency Banner */}
        <div className="cp-info-banner">
          <div className="cp-info-left">
            <span className="cp-info-icon">ℹ️</span>
            <span>
              <strong>VAYUNET</strong> provides predictive weather intelligence to support early awareness.
              Follow instructions issued by local authorities and official emergency agencies.
            </span>
          </div>
          <a 
            href="https://mausam.imd.gov.in" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="cp-info-link"
          >
            View Official Source &rarr;
          </a>
        </div>
      </main>

      {/* 4. SMART REDEFINED SOVEREIGN FOOTER WITH GSAP ANIMATIONS */}
      <footer className="cp-footer" ref={footerRef}>
        {/* Row 1: Live System Telemetry Strip */}
        <div className="cp-footer-telemetry cp-footer-anim-item">
          <div className="cp-telemetry-inner">
            <div className="cp-telemetry-status">
              <span className="cp-footer-telemetry-dot"></span>
              <span><strong>VAYUNET OPERATIONAL TELEMETRY:</strong> All Ingest Pipelines Nominal</span>
            </div>
            <div className="cp-telemetry-metrics">
              <span>🛰️ INSAT-3DR Multispectral: <strong>ONLINE (100%)</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>🌪️ IMDAA 4km Reanalysis: <strong>COUPLED</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>⚡ Inference Latency: <strong>&lt; 120 ms</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>📡 ITU-T X.1303 CAP 1.2: <strong>ACTIVE</strong></span>
            </div>
          </div>
        </div>

        {/* Row 2: 4-Column Rich Information Architecture */}
        <div className="cp-footer-main">
          <div className="cp-footer-grid">
            {/* Col 1: Brand & Sovereign Mandate */}
            <div className="cp-footer-col cp-footer-brand-col cp-footer-anim-item">
              <div className="cp-footer-brand">
                <div className="home-logo" style={{ width: 38, height: 38 }}>
                  <img src="/VAYUNET_LOGO.png" alt="VAYUNET Logo" className="home-logo-img" />
                </div>
                <div>
                  <h2>VAYUNET</h2>
                  <p>National Severe Weather Nowcasting Engine</p>
                </div>
              </div>
              <p className="cp-footer-desc">
                An atmospheric artificial intelligence platform developed under the Ministry of Earth Sciences (MoES), Government of India. Providing life-saving 2–6 hour lead times against cloudbursts, severe thunderstorms, and flash floods.
              </p>
              <div className="cp-footer-emblem-badge">
                <img src="/emblem-india.svg" alt="State Emblem of India" className="cp-gov-emblem-img" />
                <div className="cp-gov-text" style={{ color: '#cbd5e1' }}>
                  Ministry of Earth Sciences
                  <span style={{ color: '#94a3b8' }}>Government of India</span>
                </div>
              </div>
            </div>

            {/* Col 2: Public Safety & Early Warnings */}
            <div className="cp-footer-col cp-footer-anim-item">
              <h3 className="cp-footer-heading">Public Warning Services</h3>
              <ul className="cp-footer-link-list">
                <li><button className="cp-footer-btn-link" onClick={() => setSelectedId('mcleodganj')}>Active District Warning Radar</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => setShelterModalOpen(true)}>Nearest Safe Shelter Locator</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => setGuidanceModalOpen(true)}>Flash Flood Safety Protocols</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => setGuidanceModalOpen(true)}>Cloudburst Evacuation Guidelines</button></li>
                <li><button className="cp-footer-btn-link" onClick={() => showToast('CAP 1.2 XML Feed is broadcasting on /api/cap-feed')}>CAP 1.2 Common Alerting Feed</button></li>
              </ul>
            </div>

            {/* Col 3: 24x7 Emergency Hotlines */}
            <div className="cp-footer-col cp-footer-anim-item">
              <h3 className="cp-footer-heading">Emergency Hotlines (24x7)</h3>
              <div className="cp-footer-hotlines">
                <a href="tel:112" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">112</div>
                  <div className="cp-hotline-desc">
                    <strong>National Emergency</strong>
                    <span>Police, Fire & Medical</span>
                  </div>
                </a>
                <a href="tel:108" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">108</div>
                  <div className="cp-hotline-desc">
                    <strong>Disaster Ambulance</strong>
                    <span>Emergency Medical Response</span>
                  </div>
                </a>
                <a href="tel:1078" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">1078</div>
                  <div className="cp-hotline-desc">
                    <strong>NDMA Disaster Line</strong>
                    <span>National Control Center</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Col 4: Sovereign Institutional Partners */}
            <div className="cp-footer-col cp-footer-anim-item">
              <h3 className="cp-footer-heading">Institutional Governance</h3>
              <ul className="cp-footer-link-list">
                <li><a href="https://www.moes.gov.in" target="_blank" rel="noreferrer">Ministry of Earth Sciences (MoES) ↗</a></li>
                <li><a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer">India Meteorological Department (IMD) ↗</a></li>
                <li><a href="https://www.ncmrwf.gov.in" target="_blank" rel="noreferrer">NCMRWF Weather Computing ↗</a></li>
                <li><a href="https://ndma.gov.in" target="_blank" rel="noreferrer">National Disaster Management Authority ↗</a></li>
                <li><a href="https://www.mosdac.gov.in" target="_blank" rel="noreferrer">ISRO / MOSDAC Satellite Data ↗</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Row 3: Bottom Legal & Compliance */}
        <div className="cp-footer-bottom cp-footer-anim-item">
          <div className="cp-footer-bottom-inner">
            <div className="cp-footer-legal">
              <span>© 2026 VAYUNET · Ministry of Earth Sciences, Government of India. All rights reserved.</span>
              <span>Compliant with ITU-T X.1303 CAP 1.2 Protocol · WCAG 2.1 Level AA</span>
            </div>
            <div className="cp-footer-bottom-links">
              <span onClick={() => showToast('VAYUNET Privacy Policy: No personal location data is stored permanently.')}>Privacy Policy</span>
              <span onClick={() => showToast('Terms of Service: Public alerts provided for early safety awareness.')}>Terms of Use</span>
              <span onClick={onEnterPortal}>Operations Portal</span>
              <span onClick={() => setShareModalOpen(true)}>Share Warning</span>
            </div>
          </div>
        </div>
      </footer>

      {/* 5. SHARE ALERT MODAL */}
      {shareModalOpen && (
        <div className="cp-modal-backdrop" onClick={() => setShareModalOpen(false)}>
          <div className="cp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">
                <span>📢</span> Share Weather Alert
              </h3>
              <button className="cp-modal-close" onClick={() => setShareModalOpen(false)}>✕</button>
            </div>
            <div className="cp-modal-body">
              <p style={{ fontSize: '13.5px', color: '#475569', marginBottom: '18px', lineHeight: 1.5 }}>
                Help keep your community safe. Share this official severe weather warning with family, neighbors, and travel groups.
              </p>

              <div className="cp-share-options">
                <a 
                  className="cp-share-btn whatsapp"
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`⚠️ VAYUNET ALERT for ${loc.name} (${loc.district}): ${loc.hazard}. Read official warning & safe shelter details: ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShareModalOpen(false)}
                >
                  <span>💬</span> Share on WhatsApp
                </a>

                <a 
                  className="cp-share-btn twitter"
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`⚠️ Emergency Weather Warning for ${loc.name} (${loc.district}): ${loc.hazard}. Check nearest safe location via VAYUNET: ${window.location.href}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShareModalOpen(false)}
                >
                  <span>🐦</span> Share on X (Twitter)
                </a>

                <button className="cp-share-btn" onClick={copyPageLink}>
                  <span>🔗</span> Copy Portal Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. "WHAT SHOULD I DO NOW?" SAFETY GUIDANCE MODAL */}
      {guidanceModalOpen && (
        <div className="cp-modal-backdrop" onClick={() => setGuidanceModalOpen(false)}>
          <div className="cp-modal-card" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">
                <span>🛡️</span> Immediate Action Checklist
              </h3>
              <button className="cp-modal-close" onClick={() => setGuidanceModalOpen(false)}>✕</button>
            </div>
            <div className="cp-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '16px', padding: '12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#991b1b', fontSize: '13px' }}>
                <strong>⚠️ Time-Critical Warning:</strong> Rapid flash floods can surge with zero acoustic warning in mountain nullahs. Complete these actions immediately.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>1</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Evacuate Low-Lying Riverbeds & Gullies</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Move uphill immediately. Do not park vehicles near nullahs or camp on river islands.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>2</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Assemble Emergency Go-Bag</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Essential medicines, drinking water bottle, power bank, whistle, waterproof torch, and ID cards.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>3</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Head to {loc.safeShelter.name}</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Located {loc.safeShelter.distance}. Equipped with power backup, clean water, and SDRF contact.</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <span style={{ background: '#dc2626', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px', flexShrink: 0 }}>4</span>
                  <div>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>Do NOT Walk or Drive Through Floodwaters</strong>
                    <p style={{ margin: '2px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>Just 6 inches of rushing mountain water can sweep an adult away; 12 inches can carry an SUV.</p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', gap: '12px' }}>
                <button 
                  className="cp-btn-primary-action"
                  style={{ flex: 1 }}
                  onClick={openGoogleDirections}
                >
                  Navigate to Safe Shelter &rarr;
                </button>
                <button 
                  className="cp-btn-secondary-action"
                  onClick={() => setGuidanceModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. SHELTER DETAILS MODAL */}
      {shelterModalOpen && (
        <div className="cp-modal-backdrop" onClick={() => setShelterModalOpen(false)}>
          <div className="cp-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">
                <span>🏛️</span> Designated Shelter Details
              </h3>
              <button className="cp-modal-close" onClick={() => setShelterModalOpen(false)}>✕</button>
            </div>
            <div className="cp-modal-body">
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '18px', color: '#0f172a', margin: '0 0 4px 0' }}>{loc.safeShelter.name}</h4>
                <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{loc.safeShelter.distance}</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', color: '#334155' }}>
                <div><strong>Address:</strong> {loc.safeShelter.address}</div>
                <div><strong>Elevation:</strong> {loc.safeShelter.elevation}</div>
                <div><strong>Authorized Capacity:</strong> {loc.safeShelter.capacity}</div>
                <div><strong>Available Facilities:</strong> {loc.safeShelter.facilities}</div>
                <div><strong>Helpline:</strong> <span style={{ color: '#0284c7', fontWeight: 700 }}>{loc.safeShelter.contact}</span></div>
              </div>

              <div style={{ marginTop: '22px', display: 'flex', gap: '12px' }}>
                <button 
                  className="cp-btn-primary-action"
                  style={{ flex: 1, background: '#0284c7' }}
                  onClick={openGoogleDirections}
                >
                  Open in Google Maps &rarr;
                </button>
                <button 
                  className="cp-btn-secondary-action"
                  onClick={() => setShelterModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="cp-toast">
          <span>🔔</span> {toastMessage}
        </div>
      )}
    </div>
  );
}
