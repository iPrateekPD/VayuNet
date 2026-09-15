import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroMap from './HeroMap';
import FusionAccordion from './FusionAccordion';
import {
  WEATHER_LAYERS,
  FORECAST_TIME_STEPS,
} from '../services/weatherService';
import './CitizenPortal.css';

gsap.registerPlugin(ScrollTrigger);

export const INDIAN_LANGUAGES = [
  { code: 'EN', label: 'English' },
  { code: 'HI', label: 'हिन्दी — Hindi' },
  { code: 'BN', label: 'বাংলা — Bengali' },
  { code: 'MR', label: 'मराठी — Marathi' },
  { code: 'TE', label: 'తెలుగు — Telugu' },
  { code: 'TA', label: 'தமிழ் — Tamil' },
  { code: 'GU', label: 'ગુજરાતી — Gujarati' },
  { code: 'KN', label: 'ಕನ್ನಡ — Kannada' },
  { code: 'ML', label: 'മലയാളം — Malayalam' },
  { code: 'PA', label: 'ਪੰਜਾਬੀ — Punjabi' },
  { code: 'OR', label: 'ଓଡ଼ିଆ — Odia' },
  { code: 'AS', label: 'অসমীয়া — Assamese' },
];

export default function HomePage({ onEnterPortal, onOpenPublicWarnings }) {
  const [telemetryTime, setTelemetryTime] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [activeLayer, setActiveLayer] = useState('precipitation');
  const [scrubberIdx, setScrubberIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileLayerSheetOpen, setMobileLayerSheetOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero-section');
  const [language, setLanguage] = useState('EN');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const navLabels = {
    EN: {
      home: 'Home',
      hazards: 'Hazards',
      dataSources: 'Data Sources',
      howItWorks: 'How it Works',
      impact: 'Impact',
      publicWarnings: 'Public Warnings ↗',
      enterPortal: 'Enter Operations Portal →',
      brandSubtitle: 'Weather Intelligence for a Safer India',
      tickerTitle: 'LIVE WEATHER ALERT',
      ticker1Tag: 'FLASH FLOOD WARNING',
      ticker1Loc: 'Wayanad, Kerala (ETA 1–3h)',
      ticker1Desc: 'Extreme localized rainfall (>110 mm/hr) over high orographic relief.',
      ticker2Tag: 'CLOUDBURST WATCH',
      ticker2Loc: 'Chamoli & Rudraprayag, Uttarakhand',
      ticker2Desc: 'Convective instability CAPE > 2,100 J/kg, moisture entrapment.',
      ticker3Tag: 'SEVERE THUNDERSTORM',
      ticker3Loc: 'Western Ghats & Konkan',
      ticker3Desc: 'High lightning density and squall gusts > 85 km/h.',
    },
    HI: {
      home: 'मुख्य पृष्ठ',
      hazards: 'आपदाएँ',
      dataSources: 'डेटा स्रोत',
      howItWorks: 'कार्यप्रणाली',
      impact: 'प्रभाव',
      publicWarnings: 'सार्वजनिक चेतावनियाँ ↗',
      enterPortal: 'ऑपरेशंस पोर्टल →',
      brandSubtitle: 'सुरक्षित भारत के लिए मौसम बुद्धिमत्ता',
      tickerTitle: 'लाइव मौसम चेतावनी',
      ticker1Tag: 'अचानक बाढ़ चेतावनी',
      ticker1Loc: 'वायनाड, केरल (अनुमानित 1-3 घंटे)',
      ticker1Desc: 'तीव्र स्थानीय वर्षा (>110 मिमी/घंटा) अत्यधिक जोखिम वाले पर्वतीय ढलानों पर।',
      ticker2Tag: 'बादल फटने की निगरानी',
      ticker2Loc: 'चमोली एवं रुद्रप्रयाग, उत्तराखंड',
      ticker2Desc: 'संवहनीय अस्थिरता CAPE > 2,100 J/kg, नमी संचय।',
      ticker3Tag: 'गंभीर तड़ित-झंझावात',
      ticker3Loc: 'पश्चिमी घाट एवं कोंकण',
      ticker3Desc: 'उच्च आकाशीय बिजली घनत्व तथा 85 किमी/घंटा से अधिक हवा की गति।',
    }
  };

  const t = navLabels[language] || navLabels.EN;

  const [isIntroComplete, setIsIntroComplete] = useState(false);
  const introCompleteRef = useRef(false);
  const desktopMapControllerRef = useRef(null);
  const mobileMapControllerRef = useRef(null);

  const handleZoomIn = () => {
    desktopMapControllerRef.current?.zoomIn();
    mobileMapControllerRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    desktopMapControllerRef.current?.zoomOut();
    mobileMapControllerRef.current?.zoomOut();
  };

  const handleResetView = () => {
    desktopMapControllerRef.current?.resetView();
    mobileMapControllerRef.current?.resetView();
  };

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
      });
      const timeIST = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata',
      });
      setTelemetryTime(timeIST);
      setDisplayDate(dateStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Time scrubber auto-play
  useEffect(() => {
    if (!isPlaying) return;
    const iv = setInterval(() => {
      setScrubberIdx(i => {
        if (i >= FORECAST_TIME_STEPS.length - 1) {
          setIsPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, 1200);
    return () => clearInterval(iv);
  }, [isPlaying]);

  // GSAP subtle animations throughout the homepage
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Initial State: Hide all other elements before map zooms into position on Earth
      gsap.set(['.emergency-alert-ticker', '.home-nav'], { opacity: 0, y: -25 });
      gsap.set('.hero-text-readability-overlay', { opacity: 0 });
      gsap.set('.hero-eyebrow-tag', { opacity: 0, y: 15 });
      gsap.set('.hero-headline', { opacity: 0, y: 25 });
      gsap.set('.hero-lead-text', { opacity: 0, y: 20 });
      gsap.set('.hero-cta-group', { opacity: 0, y: 18 });
      gsap.set(['.hero-mission-badge', '.hero-national-data-provenance'], { opacity: 0, y: 15 });
      gsap.set([
        '.hero-live-status-bar',
        '.map-layer-panel',
        '.map-zoom-controls-panel',
        '.map-precip-legend-v3',
        '.hero-compact-scrubber',
        '.hero-map-cta-wrap'
      ], { opacity: 0, x: 30 });

      // Map backdrop starts slightly zoomed out from a close distance (not far away)
      gsap.set('.hero-map-backdrop', {
        scale: 0.92,
        transformOrigin: '68% 50%',
        force3D: true,
      });

      // Fast, silky smooth 60fps GPU zoom-in directly onto India
      const heroTl = gsap.timeline({
        defaults: { ease: 'power2.out' },
        delay: 0.05,
      });

      heroTl
        // 1. Fast zoom-in from close distance (0.92 -> 1.02) in just 0.85s (fast & zero jitter)
        .to('.hero-map-backdrop', {
          scale: 1.02,
          duration: 0.85,
          ease: 'power2.out',
          onComplete: () => {
            introCompleteRef.current = true;
            setIsIntroComplete(true);
          },
        })
        // 2. Overlap smoothly as map lands: readability overlay fades in
        .to('.hero-text-readability-overlay', {
          opacity: 1,
          duration: 0.45,
          ease: 'power2.out',
        }, '-=0.35')
        // 3. Primary navigation & alert ticker drop in from top
        .to(['.emergency-alert-ticker', '.home-nav'], {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power2.out',
        }, '-=0.35')
        // 4. Hero left content staggers in
        .to('.hero-eyebrow-tag', { opacity: 1, y: 0, duration: 0.35 }, '-=0.3')
        .to('.hero-headline', { opacity: 1, y: 0, duration: 0.45 }, '-=0.25')
        .to('.hero-lead-text', { opacity: 1, y: 0, duration: 0.4 }, '-=0.3')
        .to('.hero-cta-group', { opacity: 1, y: 0, duration: 0.35 }, '-=0.25')
        .to(['.hero-mission-badge', '.hero-national-data-provenance'], { opacity: 1, y: 0, duration: 0.35, stagger: 0.08 }, '-=0.2')
        // 5. Right side floating map controls slide in from right
        .to([
          '.hero-live-status-bar',
          '.map-layer-panel',
          '.map-zoom-controls-panel',
          '.map-precip-legend-v3',
          '.hero-compact-scrubber',
          '.hero-map-cta-wrap'
        ], {
          opacity: 1,
          x: 0,
          duration: 0.45,
          stagger: 0.05,
          ease: 'power2.out',
        }, '-=0.4');
      // 2. Section 01: Three Cascading Hazards
      gsap.fromTo(
        ['.hazards-header-left', '.hazards-header-right'],
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.section-hazards',
            start: 'top 82%',
          },
        }
      );

      gsap.fromTo(
        '.hazard-card-v3',
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.hazards-cards-grid',
            start: 'top 80%',
          },
        }
      );

      // Animate chart bars on scroll
      gsap.fromTo(
        '.convective-col .col-bar-fill',
        { scaleY: 0, transformOrigin: 'bottom' },
        {
          scaleY: 1,
          duration: 0.8,
          stagger: 0.05,
          ease: 'back.out(1.5)',
          scrollTrigger: {
            trigger: '.convective-bars-wrap',
            start: 'top 85%',
          },
        }
      );

      gsap.fromTo(
        '.spectrum-bar',
        { scaleY: 0, transformOrigin: 'bottom' },
        {
          scaleY: 1,
          duration: 0.7,
          stagger: 0.02,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.spectrum-bars-flex',
            start: 'top 85%',
          },
        }
      );

      // 4. Section 02: Multi-Source National Data Fusion
      gsap.fromTo(
        '.fusion-header-wrap',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          scrollTrigger: {
            trigger: '#data-fusion',
            start: 'top 82%',
          },
        }
      );

      gsap.fromTo(
        '.fusion-accordion-card',
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: '.fusion-accordion-container',
            start: 'top 82%',
          },
        }
      );

      // 5. Section 03: Operational Workflow
      gsap.fromTo(
        '.workflow-header-wrap',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          scrollTrigger: {
            trigger: '#how-it-works',
            start: 'top 82%',
          },
        }
      );

      gsap.fromTo(
        '.decision-step-v3',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.workflow-steps-horizontal',
            start: 'top 80%',
          },
        }
      );

      // 6. Section 04: National Impact
      gsap.fromTo(
        '.impact-header-wrap',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          scrollTrigger: {
            trigger: '#impact',
            start: 'top 82%',
          },
        }
      );

      gsap.fromTo(
        '.impact-card-v3',
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.15,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.impact-grid-v3',
            start: 'top 80%',
          },
        }
      );

      gsap.fromTo(
        '.portal-cta-banner-v3',
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: '.portal-cta-banner-v3',
            start: 'top 85%',
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  // GSAP Mouse Movement Parallax on Homepage Hero Map (Slight, organic motion response)
  useEffect(() => {
    const heroEl = document.getElementById('hero');
    const mapBackdrop = document.querySelector('.hero-map-backdrop');
    if (!heroEl || !mapBackdrop) return;

    const handleMouseMove = (e) => {
      // Never interfere with cinematic map rotation intro
      if (!introCompleteRef.current) return;

      const rect = heroEl.getBoundingClientRect();
      // Only track if cursor is near or inside the hero viewport
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;

      const normX = (e.clientX - rect.left) / rect.width - 0.5;
      const normY = (e.clientY - rect.top) / rect.height - 0.5;

      // Slight, smooth motion response on mouse movement (only on the map backdrop)
      gsap.to(mapBackdrop, {
        x: normX * 18,
        y: normY * 14,
        rotationZ: normX * 0.35,
        duration: 0.9,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    const handleMouseLeave = () => {
      if (!introCompleteRef.current) return;
      gsap.to(mapBackdrop, {
        x: 0,
        y: 0,
        rotationZ: 0,
        duration: 1.1,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    };

    heroEl.addEventListener('mousemove', handleMouseMove);
    heroEl.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      heroEl.removeEventListener('mousemove', handleMouseMove);
      heroEl.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Section-by-section keyboard navigation (Spacebar / PageDown / PageUp)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

      const sectionIds = ['hero-section', 'hazards', 'data-fusion', 'how-it-works', 'impact-section'];
      const sections = sectionIds.map(id => document.getElementById(id)).filter(Boolean);
      if (sections.length === 0) return;

      if (e.code === 'Space' || e.key === ' ' || e.code === 'PageDown') {
        e.preventDefault();
        const currentY = window.scrollY;
        const nextSec = sections.find(sec => {
          const targetY = sec.id === 'hero-section' ? 0 : Math.max(0, sec.offsetTop - 54);
          return targetY > currentY + 20;
        });
        if (nextSec) {
          const targetY = nextSec.id === 'hero-section' ? 0 : Math.max(0, nextSec.offsetTop - 54);
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      } else if (e.code === 'PageUp' || (e.shiftKey && (e.code === 'Space' || e.key === ' '))) {
        e.preventDefault();
        const currentY = window.scrollY;
        const prevSec = [...sections].reverse().find(sec => {
          const targetY = sec.id === 'hero-section' ? 0 : Math.max(0, sec.offsetTop - 54);
          return targetY < currentY - 20;
        });
        if (prevSec) {
          const targetY = prevSec.id === 'hero-section' ? 0 : Math.max(0, prevSec.offsetTop - 54);
          window.scrollTo({ top: targetY, behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Track whether user has scrolled past ticker to stick nav at top: 0
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  // Track active section for navigation highlights and slide dots
  useEffect(() => {
    const sectionIds = ['hero-section', 'hazards', 'data-fusion', 'how-it-works', 'impact-section'];
    const handleScroll = () => {
      setIsNavScrolled(window.scrollY > 30);
      if (window.scrollY < 200) {
        setActiveSection('hero-section');
        return;
      }
      const scrollPos = window.scrollY + 140;
      for (let i = sectionIds.length - 1; i >= 1; i--) {
        const sec = document.getElementById(sectionIds[i]);
        if (sec && sec.offsetTop > 0 && sec.offsetTop <= scrollPos) {
          setActiveSection(sectionIds[i]);
          return;
        }
      }
      setActiveSection('hero-section');
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const activeLayerMeta = WEATHER_LAYERS.find(l => l.id === activeLayer) || WEATHER_LAYERS[0];

  return (
    <div className={`home-page ${!isIntroComplete ? 'hero-intro-active' : ''}`}>

      {/* ============================================================
          1. LIVE EMERGENCY DISASTER / FLOOD WARNING NEWS TICKER
          ============================================================ */}
      <div className="emergency-alert-ticker" role="alert">
        <div className="ticker-badge">
          <span className="ticker-pulse-beacon" />
          <span className="ticker-badge-text">{t.tickerTitle}</span>
        </div>
        <div className="ticker-track">
          {/* Content duplicated for seamless infinite marquee loop */}
          <div className="ticker-content">
            <span className="ticker-item red-alert">
              <span className="alert-tag">{t.ticker1Tag}</span>
              <strong>{t.ticker1Loc}</strong> — {t.ticker1Desc}
            </span>
            <span className="ticker-dot">•</span>
            <span className="ticker-item orange-alert">
              <span className="alert-tag">{t.ticker2Tag}</span>
              <strong>{t.ticker2Loc}</strong> — {t.ticker2Desc}
            </span>
            <span className="ticker-dot">•</span>
            <span className="ticker-item yellow-alert">
              <span className="alert-tag">{t.ticker3Tag}</span>
              <strong>{t.ticker3Loc}</strong> — {t.ticker3Desc}
            </span>
            <span className="ticker-dot">•</span>
            <span className="ticker-item red-alert">
              <span className="alert-tag">{t.ticker1Tag}</span>
              <strong>{t.ticker1Loc}</strong> — {t.ticker1Desc}
            </span>
            <span className="ticker-dot">•</span>
            <span className="ticker-item orange-alert">
              <span className="alert-tag">{t.ticker2Tag}</span>
              <strong>{t.ticker2Loc}</strong> — {t.ticker2Desc}
            </span>
            <span className="ticker-dot">•</span>
            <span className="ticker-item yellow-alert">
              <span className="alert-tag">{t.ticker3Tag}</span>
              <strong>{t.ticker3Loc}</strong> — {t.ticker3Desc}
            </span>
            <span className="ticker-dot">•</span>
          </div>
        </div>
        <div className="ticker-helpline-wrap">
          <a href="tel:1078" className="ticker-helpline" title="Click to dial 24x7 NDMA Disaster Helpline">
            <span className="helpline-icon">🚨</span>
            <span>NDMA Helpline: <strong>1078</strong></span>
          </a>
        </div>
      </div>

      {/* ============================================================
          2. REDESIGNED SOVEREIGN PRIMARY NAVIGATION
          ============================================================ */}
      <nav className={`home-nav ${isNavScrolled ? 'nav-scrolled' : ''}`}>
        <div className="home-nav-inner">
          <div className="home-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} title="VAYUNET Sovereign Weather Platform">
            <div className="home-logo">
              <img src="/VAYUNET_LOGO.png" alt="VAYUNET Logo" className="home-logo-img" />
            </div>
            <div className="brand-titles-group">
              <div className="brand-row">
                <span className="home-title">VAYUNET</span>
                <span className="gov-sovereign-pill">🇮🇳 MoES · NCMRWF</span>
              </div>
              <div className="home-dept">{t.brandSubtitle}</div>
            </div>
          </div>

          {/* Desktop Capsule Nav Links */}
          <div className="home-nav-links-capsule">
            {[
              { id: 'hero-section', label: t.home },
              { id: 'hazards', label: t.hazards },
              { id: 'data-fusion', label: t.dataSources },
              { id: 'how-it-works', label: t.howItWorks },
              { id: 'impact-section', label: t.impact },
            ].map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`nav-link-item ${activeSection === link.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  const targetY = link.id === 'hero-section' ? 0 : Math.max(0, (document.getElementById(link.id)?.offsetTop || 0) - 52);
                  window.scrollTo({ top: targetY, behavior: 'smooth' });
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Header Actions */}
          <div className="home-nav-actions">
            {/* Language Option Dropdown */}
            <div className="home-lang-wrap">
              <svg className="home-lang-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="2" y1="12" x2="22" y2="12"/>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
              <select 
                className="home-lang-select" 
                value={language} 
                onChange={(e) => {
                  setLanguage(e.target.value);
                  const sel = INDIAN_LANGUAGES.find(l => l.code === e.target.value);
                  showToast(e.target.value === 'HI' ? 'भाषा बदलकर हिंदी (हिंदी) की गई' : `Language selected: ${sel?.label || e.target.value}`);
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

            {/* Public Warnings Radar Button */}
            <button className="btn-secondary-nav" onClick={onOpenPublicWarnings} id="nav-public-warnings-btn">
              <span className="nav-btn-pulse-dot"></span>
              <span>{t.publicWarnings}</span>
            </button>

            {/* Enter Operations Portal Button */}
            <button className="btn-primary-nav" onClick={onEnterPortal} id="nav-enter-portal-btn">
              <span>{t.enterPortal}</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer">
            <div className="mobile-nav-links">
              <div className="mobile-nav-lang-row">
                <span>{language === 'HI' ? 'भाषा चुनें (Select Language):' : 'Select Language:'}</span>
                <select 
                  className="home-lang-select" 
                  value={language} 
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    const sel = INDIAN_LANGUAGES.find(l => l.code === e.target.value);
                    showToast(e.target.value === 'HI' ? 'भाषा बदलकर हिंदी (हिंदी) की गई' : `Language selected: ${sel?.label || e.target.value}`);
                  }}
                >
                  {INDIAN_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mobile-nav-divider" />
              <a href="#hero-section" onClick={() => { setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>{t.home}</a>
              <a href="#hazards" onClick={() => { setMobileMenuOpen(false); document.getElementById('hazards')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.hazards}</a>
              <a href="#data-fusion" onClick={() => { setMobileMenuOpen(false); document.getElementById('data-fusion')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.dataSources}</a>
              <a href="#how-it-works" onClick={() => { setMobileMenuOpen(false); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.howItWorks}</a>
              <a href="#impact-section" onClick={() => { setMobileMenuOpen(false); document.getElementById('impact-section')?.scrollIntoView({ behavior: 'smooth' }); }}>{t.impact}</a>
              <div className="mobile-nav-divider" />
              <button
                className="btn-secondary-nav mobile-nav-btn"
                onClick={() => { setMobileMenuOpen(false); onOpenPublicWarnings(); }}
              >
                <span className="nav-btn-pulse-dot"></span>
                <span>{t.publicWarnings}</span>
              </button>
              <button
                className="btn-primary-nav mobile-nav-btn"
                onClick={() => { setMobileMenuOpen(false); onEnterPortal(); }}
              >
                <span>{t.enterPortal}</span>
              </button>
              <div className="mobile-gov-footer">
                <div>Ministry of Earth Sciences, Government of India</div>
                <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>
                  "Science in service of people."
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Floating Language Feedback Toast */}
      {toastMsg && (
        <div className="home-toast-pill">
          <span className="home-toast-dot"></span>
          <span>{toastMsg}</span>
        </div>
      )}


      {/* ============================================================
          3. HERO SECTION — REAL INTERACTIVE LEAFLET INDIA MAP
          ============================================================ */}
      <div id="hero-section" className="hero-viewport-section">
        <header id="hero" className="home-hero-container">

        {/* Real Interactive Leaflet Map Background */}
        <div className="hero-map-backdrop">
          <HeroMap
            activeLayer={activeLayer}
            scrubberIdx={scrubberIdx}
            mapControllerRef={desktopMapControllerRef}
            onIntroComplete={() => {
              introCompleteRef.current = true;
              setIsIntroComplete(true);
            }}
          />
        </div>

        {/* Subtle Dark Gradient Overlay for Left Column Text Readability */}
        <div className="hero-text-readability-overlay" />

        {/* Hero Content Inner Layout */}
        <div className="home-hero-inner">

          {/* ===== LEFT COLUMN: Mission Briefing ===== */}
          <div className="hero-left-content">
            <div className="hero-eyebrow-tag">REAL-TIME INSIGHTS. EARLIER ACTIONS.</div>

            <h1 className="hero-headline">
              Detect severe weather<br />
              <span className="hero-headline-accent">before it becomes</span><br />
              <span className="hero-headline-accent">a disaster.</span>
            </h1>

            <p className="hero-lead-text">
              VAYUNET combines satellite observations, atmospheric reanalysis and
              terrain intelligence to forecast severe thunderstorms, cloudbursts
              and flash floods at hyper-local scale — 2 to 6 hours before impact.
            </p>

            <div className="hero-cta-group">
              <button className="btn-hero-portal" onClick={onEnterPortal} id="hero-enter-portal-btn">
                Enter Operations Portal →
              </button>
              <button className="btn-hero-warnings" onClick={onOpenPublicWarnings} id="hero-view-warnings-btn">
                View Public Warnings ↗
              </button>
            </div>

            {/* Primary Action Info Pill */}
            <div className="hero-mission-badge">
              <span className="mission-badge-dot" />
              <span>Sovereign Earth Observation · AI Convective Intelligence</span>
            </div>

            {/* National Data Provenance Bar */}
            <div className="hero-national-data-provenance">
              <div className="national-data-label">POWERED BY NATIONAL DATA</div>
              <div className="national-data-sources-row">
                <div className="national-data-item">
                  <div className="national-data-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 7 9 3 5 7l4 4" />
                      <path d="m17 11 4 4-4 4-4-4" />
                      <path d="m8 12 4 4 6-6-4-4Z" />
                      <line x1="14" y1="10" x2="16" y2="8" />
                      <line x1="10" y1="14" x2="8" y2="16" />
                    </svg>
                  </div>
                  <div className="national-data-meta">
                    <span className="national-data-title">INSAT-3D/3DR</span>
                    <span className="national-data-agency">MOSDAC / ISRO</span>
                  </div>
                </div>

                <div className="national-data-divider" />

                <div className="national-data-item">
                  <div className="national-data-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                    </svg>
                  </div>
                  <div className="national-data-meta">
                    <span className="national-data-title">IMDAA</span>
                    <span className="national-data-agency">NCMRWF</span>
                  </div>
                </div>

                <div className="national-data-divider" />

                <div className="national-data-item">
                  <div className="national-data-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 20L12 4L21 20H3Z" />
                      <path d="M9 20L12 14L15 20" />
                    </svg>
                  </div>
                  <div className="national-data-meta">
                    <span className="national-data-title">CartoDEM</span>
                    <span className="national-data-agency">ISRO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== FLOATING MAP CONTROLS COLUMN (Status, Layers, Zoom, Legend, CTA) ===== */}
        <div className="hero-map-interactive-zone">

          {/* Live Status Bar (Top Right) */}
          <div className="hero-live-status-bar">
            <span className="hero-datetime">{displayDate} &nbsp;{telemetryTime} IST</span>
            <span className="hero-status-divider" />
            <span className="hero-live-pill">
              <span className="live-dot" />
              Live
            </span>
          </div>

          {/* Mobile Layer Drawer Toggle Button */}
          <button
            className="mobile-layer-toggle-btn"
            onClick={() => setMobileLayerSheetOpen(!mobileLayerSheetOpen)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
            <span>Layers: {activeLayerMeta.label}</span>
          </button>

          {/* Desktop Floating Layer Selector Menu Card */}
          <div className={`map-layer-panel ${mobileLayerSheetOpen ? 'mobile-sheet-open' : ''}`}>
            <div className="mobile-sheet-header">
              <span>Select Weather Layer</span>
              <button
                className="mobile-sheet-close"
                onClick={() => setMobileLayerSheetOpen(false)}
              >
                ✕
              </button>
            </div>

            {[
              {
                id: 'precipitation',
                label: 'Precipitation',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                ),
              },
              {
                id: 'cloud_tops',
                label: 'Cloud Tops',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  </svg>
                ),
              },
              {
                id: 'lightning',
                label: 'Lightning',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
              },
              {
                id: 'wind',
                label: 'Wind',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.7 7.7a2.5 2.5 0 1 1-1.8 4.3H2" />
                    <path d="M19.6 13.7a2.5 2.5 0 1 0-1.8-4.3H2" />
                    <path d="M15.7 17.7a2.5 2.5 0 1 1-1.8 4.3H2" />
                  </svg>
                ),
              },
              {
                id: 'terrain',
                label: 'Terrain',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
                  </svg>
                ),
              },
            ].map((layer, idx) => (
              <React.Fragment key={layer.id}>
                {idx > 0 && <span className="layer-btn-divider" />}
                <button
                  className={`layer-btn-v3 ${activeLayer === layer.id ? 'active' : ''}`}
                  onClick={() => {
                    setActiveLayer(layer.id);
                    setMobileLayerSheetOpen(false);
                  }}
                  title={layer.label}
                  aria-label={layer.label}
                >
                  <span className="layer-btn-icon">{layer.icon}</span>
                  <span className="layer-btn-text">{layer.label}</span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Compact GIS Zoom & Recenter Controls Panel */}
          <div className="map-zoom-controls-panel">
            <button
              className="zoom-ctrl-btn"
              onClick={handleZoomIn}
              title="Zoom In"
              aria-label="Zoom in"
            >
              +
            </button>
            <span className="zoom-ctrl-divider" />
            <button
              className="zoom-ctrl-btn"
              onClick={handleZoomOut}
              title="Zoom Out"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="zoom-ctrl-divider" />
            <button
              className="zoom-ctrl-btn"
              onClick={handleResetView}
              title="Reset View to India"
              aria-label="Recenter map"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>
          </div>

          {/* Bottom Group: Legend + View Live Map Button */}
          <div className="hero-map-bottom-group">
            {activeLayer === 'precipitation' && (
              <div className="map-precip-legend-v3">
                <div className="precip-legend-title">IMD Doppler Composite (dBZ / mm/hr)</div>
                <div className="precip-legend-spectrum-bar" />
                <div className="precip-legend-scale-labels">
                  <span>15</span>
                  <span>25</span>
                  <span>35</span>
                  <span>45</span>
                  <span>55</span>
                  <span>65+</span>
                </div>
              </div>
            )}
            {activeLayer === 'cloud_tops' && (
              <div className="map-precip-legend-v3">
                <div className="precip-legend-title">INSAT-3DR Cloud Top Temp (°C)</div>
                <div className="precip-legend-spectrum-bar" style={{ background: 'linear-gradient(90deg, #6366f1 0%, #312e81 30%, #818cf8 60%, #c084fc 85%, #ec4899 100%)' }} />
                <div className="precip-legend-scale-labels">
                  <span>-20°</span>
                  <span>-35°</span>
                  <span>-50°</span>
                  <span>-65°</span>
                  <span>-75°</span>
                  <span>-85°</span>
                </div>
              </div>
            )}
            {activeLayer === 'wind' && (
              <div className="map-precip-legend-v3">
                <div className="precip-legend-title">850 hPa Wind Velocity (knots)</div>
                <div className="precip-legend-spectrum-bar" style={{ background: 'linear-gradient(90deg, #0ea5e9 0%, #06b6d4 35%, #22d3ee 70%, #38bdf8 100%)' }} />
                <div className="precip-legend-scale-labels">
                  <span>10</span>
                  <span>18</span>
                  <span>24</span>
                  <span>30</span>
                  <span>36</span>
                  <span>42+</span>
                </div>
              </div>
            )}
            {activeLayer === 'lightning' && (
              <div className="map-precip-legend-v3">
                <div className="precip-legend-title">Flash Rate (strikes / 15 min)</div>
                <div className="precip-legend-spectrum-bar" style={{ background: 'linear-gradient(90deg, #fef08a 0%, #facc15 35%, #f59e0b 70%, #dc2626 100%)' }} />
                <div className="precip-legend-scale-labels">
                  <span>5</span>
                  <span>15</span>
                  <span>30</span>
                  <span>50</span>
                  <span>75</span>
                  <span>100+</span>
                </div>
              </div>
            )}

            {/* Compact Forecast Scrubber — Positioned Above View Live Map */}
            <div className="hero-compact-scrubber">
              <div className="compact-scrubber-header">
                <button
                  type="button"
                  className="compact-scrubber-play"
                  onClick={() => {
                    if (scrubberIdx >= FORECAST_TIME_STEPS.length - 1) {
                      setScrubberIdx(0);
                    }
                    setIsPlaying(v => !v);
                  }}
                  title={isPlaying ? 'Pause forecast' : 'Play 6h forecast cycle'}
                  aria-label={isPlaying ? 'Pause forecast' : 'Play 6h forecast cycle'}
                >
                  {isPlaying ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                  )}
                </button>
                <span className="compact-scrubber-title">Forecast Lead Time</span>
                <span className="compact-scrubber-time">{FORECAST_TIME_STEPS[scrubberIdx].validTime}</span>
              </div>

              <div className="compact-scrubber-steps">
                {FORECAST_TIME_STEPS.map((step, i) => (
                  <button
                    key={step.label}
                    type="button"
                    className={`compact-step-btn ${i === scrubberIdx ? 'step-active' : ''}`}
                    onClick={() => {
                      setScrubberIdx(i);
                      setIsPlaying(false);
                    }}
                    title={`Forecast at ${step.label} (${step.validTime})`}
                  >
                    {step.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="hero-map-cta-wrap">
              <button
                className="btn-view-live-map"
                onClick={onEnterPortal}
                title="Open Full Operational Weather Map"
              >
                <span>View Live Map</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dedicated Mobile Interactive Map (visible only on mobile viewports <768px) */}
        <div className="mobile-hero-map-block">
          <HeroMap
            activeLayer={activeLayer}
            scrubberIdx={scrubberIdx}
            isMobile={true}
            mapControllerRef={mobileMapControllerRef}
          />
        </div>
      </header>

    </div>



      {/* ============================================================
          5. THREE CASCADING HAZARDS
          ============================================================ */}
      <section id="hazards" className="section-hazards">
        <div className="hazards-backdrop-overlay" />
        <div className="hazards-inner-container">
          <div className="hazards-header-wrap">
            <div className="hazards-header-left">
              <div className="section-eyebrow">THREE CASCADING HAZARDS</div>
              <h2 className="hazards-title">
                Different threats.<br />
                <span className="hazards-title-blue">A connected future.</span>
              </h2>
              <p className="hazards-desc">
                Severe thunderstorms, cloudbursts, and flash floods are linked by the same atmospheric
                processes. VAYUNET unifies them into a single intelligence layer — from detection to early
                action, for a more resilient India.
              </p>
            </div>
          </div>

          <div className="hazards-cards-grid">
            {/* Card 1: Severe Thunderstorms */}
            <div className="hazard-card-v3">
              <div className="hazard-card-banner">
                <img
                  src="/hazard_thunderstorm.jpg"
                  alt="Severe Thunderstorms"
                  className="hazard-banner-img"
                />
                <div className="hazard-banner-vignette" />
                <div className="hazard-badge badge-amber">
                  CONVECTIVE TRIGGER
                </div>
              </div>

              <div className="hazard-card-body">
                <h3 className="hazard-v3-title">Severe Thunderstorms</h3>
                <p className="hazard-v3-text">
                  Convective storms, lightning, high winds and hail. Predicts atmospheric destabilization 2–6 hours before cloud breakout.
                </p>

                {/* Micro Chart: Convective Instability Profile */}
                <div className="hazard-chart-container">
                  <div className="chart-header-row">
                    <span className="chart-header-title">CONVECTIVE INSTABILITY PROFILE</span>
                  </div>
                  <div className="convective-bars-wrap">
                    {[
                      { time: 'Now', val: '12%', h: 14, active: false },
                      { time: '+1h', val: '38%', h: 38, active: true },
                      { time: '+2h', val: '87%', h: 87, active: true, peak: true },
                      { time: '+3h', val: '74%', h: 74, active: true },
                      { time: '+4h', val: '32%', h: 32, active: true },
                      { time: '+6h', val: '18%', h: 20, active: false }
                    ].map((col, idx) => (
                      <div key={idx} className="convective-col">
                        <span className={`col-pct ${col.active ? 'pct-amber' : ''}`}>{col.val}</span>
                        <div className="col-bar-bg">
                          <div
                            className={`col-bar-fill ${col.active ? (col.peak ? 'bar-peak-amber' : 'bar-amber') : 'bar-muted'}`}
                            style={{ height: `${col.h}%` }}
                          />
                        </div>
                        <span className="col-time">{col.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Info */}
                <div className="hazard-card-footer">
                  <div className="hazard-footer-meta">
                    <div className="meta-line">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                      <span><strong>Key Drivers:</strong> INSAT WV 6.7 µm + TIR 10.8 µm + CAPE &gt; 1800 J/kg</span>
                    </div>
                    <div className="meta-line">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span><strong>Lead Time:</strong> 2 to 6 hours before lightning onset</span>
                    </div>
                  </div>
                  <button
                    className="hazard-action-circle"
                    onClick={onEnterPortal}
                    aria-label="Enter Operations Portal for Severe Thunderstorms"
                    title="Enter Operations Portal"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 2: Cloudbursts */}
            <div className="hazard-card-v3">
              <div className="hazard-card-banner">
                <img
                  src="/hazard_cloudburst.jpg"
                  alt="Cloudbursts"
                  className="hazard-banner-img"
                />
                <div className="hazard-banner-vignette" />
                <div className="hazard-badge badge-blue">
                  EXTREME PRECIPITATION
                </div>
              </div>

              <div className="hazard-card-body">
                <h3 className="hazard-v3-title">Cloudbursts</h3>
                <p className="hazard-v3-text">
                  Extreme localized rainfall over mountainous regions. Identifies microscale moisture entrapment producing &gt; 100 mm/hr in concentrated areas.
                </p>

                {/* Micro Chart: Rainfall Intensity Forecast */}
                <div className="hazard-chart-container">
                  <div className="chart-header-row">
                    <span className="chart-header-title">RAINFALL INTENSITY FORECAST</span>
                    <span className="chart-badge-peak">142 mm/hr PEAK</span>
                  </div>
                  <div className="rainfall-spectrum-outer">
                    <div className="spectrum-yaxis">
                      <span>150</span>
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>
                    <div className="spectrum-chart-area">
                      <div className="spectrum-100-line" />
                      <div className="spectrum-bars-flex">
                        {[
                          8, 10, 13, 16, 20, 25, 32, 40, 52, 68, 88, 110, 128, 142, 136, 122, 102, 80, 62, 48, 38, 30, 24, 18, 14, 11, 8
                        ].map((mm, i) => {
                          const heightPct = Math.min(100, Math.round((mm / 150) * 100));
                          // Spectrum color calculation: Blue -> Cyan -> Orange -> Red
                          let bg = '#2563eb';
                          if (mm >= 130) bg = '#ef4444';
                          else if (mm >= 100) bg = '#f97316';
                          else if (mm >= 65) bg = '#fb923c';
                          else if (mm >= 45) bg = '#38bdf8';
                          else if (mm >= 25) bg = '#0284c7';
                          return (
                            <div key={i} className="spectrum-bar-slot">
                              <div
                                className="spectrum-bar"
                                style={{
                                  height: `${heightPct}%`,
                                  background: bg,
                                  boxShadow: mm >= 120 ? '0 0 6px rgba(239,68,68,0.5)' : 'none'
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="spectrum-xaxis">
                    <span>Now</span>
                    <span>+1h</span>
                    <span>+2h</span>
                    <span>+3h</span>
                    <span>+4h</span>
                    <span>+6h</span>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="hazard-card-footer">
                  <div className="hazard-footer-meta">
                    <div className="meta-line">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                      <span><strong>Key Drivers:</strong> IMDAA moisture flux + rapid CTT cooling &lt; −14 °C/hr</span>
                    </div>
                    <div className="meta-line">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span><strong>Lead Time:</strong> 1 to 3 hours high-confidence window</span>
                    </div>
                  </div>
                  <button
                    className="hazard-action-circle"
                    onClick={onEnterPortal}
                    aria-label="Enter Operations Portal for Cloudbursts"
                    title="Enter Operations Portal"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Card 3: Flash Floods */}
            <div className="hazard-card-v3">
              <div className="hazard-card-banner">
                <img
                  src="/hazard_flashflood.jpg"
                  alt="Flash Floods"
                  className="hazard-banner-img"
                />
                <div className="hazard-banner-vignette" />
                <div className="hazard-badge badge-cyan">
                  TERRAIN COUPLING
                </div>
              </div>

              <div className="hazard-card-body">
                <h3 className="hazard-v3-title">Flash Floods</h3>
                <p className="hazard-v3-text">
                  Terrain-aware inundation and downstream routing. Fuses cloudburst probability grids with ISRO CartoDEM 30m D8 flow accumulation to map flood corridors in real time.
                </p>

                {/* Micro Chart: Hydrological Routing Profile */}
                <div className="hazard-chart-container">
                  <div className="chart-header-row">
                    <span className="chart-header-title">HYDROLOGICAL ROUTING PROFILE</span>
                    <span className="chart-badge-cyan">SURGE LAG: 42 MIN</span>
                  </div>
                  <div className="hydro-vector-wrapper">
                    <svg viewBox="0 0 320 62" className="hydro-profile-svg" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="hydroFillGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="rgba(56, 189, 248, 0.25)" />
                          <stop offset="100%" stopColor="rgba(56, 189, 248, 0.02)" />
                        </linearGradient>
                      </defs>
                      {/* Gradient area under the line */}
                      <path
                        d="M 12,18 C 50,18 75,34 105,38 C 135,42 165,52 195,50 C 230,48 260,46 308,48 L 308,62 L 12,62 Z"
                        fill="url(#hydroFillGrad)"
                      />
                      {/* Flow line */}
                      <path
                        d="M 12,18 C 50,18 75,34 105,38 C 135,42 165,52 195,50 C 230,48 260,46 308,48"
                        fill="none"
                        stroke="#0ea5e9"
                        strokeWidth="2.5"
                      />
                      {/* Nodes on the path with glowing orange dots like reference */}
                      <circle cx="12" cy="18" r="3.5" fill="#f97316" stroke="#fff" strokeWidth="1" />
                      <circle cx="105" cy="38" r="3.5" fill="#f97316" stroke="#fff" strokeWidth="1" />
                      <circle cx="195" cy="50" r="3.5" fill="#38bdf8" stroke="#fff" strokeWidth="1.5" />
                      <circle cx="308" cy="48" r="3.5" fill="#f97316" stroke="#fff" strokeWidth="1" />
                    </svg>

                    {/* Active Valley Nullah Pill indicator */}
                    <div className="nullah-active-pill">
                      Valley Nullah
                    </div>
                  </div>
                  <div className="hydro-labels-row">
                    <span>Ridge</span>
                    <span>Gorge</span>
                    <span className="active-nullah-tag">Valley Nullah</span>
                    <span>Basin Flood</span>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="hazard-card-footer">
                  <div className="hazard-footer-meta">
                    <div className="meta-line">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>
                      <span><strong>Key Drivers:</strong> CartoDEM 30m slope + D8 kinematic wave routing</span>
                    </div>
                    <div className="meta-line">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                      <span><strong>Lead Time:</strong> 2 to 4 hours advance downstream notification</span>
                    </div>
                  </div>
                  <button
                    className="hazard-action-circle"
                    onClick={onEnterPortal}
                    aria-label="Enter Operations Portal for Flash Floods"
                    title="Enter Operations Portal"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          6. NATIONAL DATA FUSION (INTERACTIVE HORIZONTAL ACCORDION)
          ============================================================ */}
      <FusionAccordion onEnterPortal={onEnterPortal} />

      {/* ============================================================
          7. OPERATIONAL WORKFLOW
          ============================================================ */}
      <section id="how-it-works" className="section-workflow">
        <div className="workflow-header-wrap">
          <div className="workflow-header-left">
            <div className="section-eyebrow">OPERATIONAL WORKFLOW</div>
            <h2 className="workflow-title">
              From data to <span className="workflow-title-blue">decisions.</span>
            </h2>
            <p className="workflow-desc">
              An automated end-to-end pipeline linking sovereign observation streams
              with physics-grounded AI nowcasting and standardized emergency dispatch.
            </p>
          </div>
          <div className="workflow-header-right">
            <div className="workflow-breadcrumbs">OBSERVE → PREDICT → EXPLAIN → DISPATCH</div>
            <div className="workflow-breadcrumbs-sub">FASTER WARNINGS. SAFER COMMUNITIES.</div>
          </div>
        </div>

        <div className="workflow-steps-horizontal">
          {/* Step 01 */}
          <div className="decision-step-v3">
            <div className="step-v3-header">
              <div className="step-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4M12 16V8"/></svg>
                <span>01 OBSERVE</span>
              </div>
            </div>
            <div className="step-img-box">
              <img src="/satellite_insat.jpg" alt="01 Observe" className="step-img" />
              <div className="step-img-overlay" />
            </div>
            <h4 className="step-v3-title">Satellite, Reanalysis &amp; Terrain Data</h4>
            <p className="step-v3-desc">
              Continuous ingestion of INSAT-3D/3DR radiances, IMDAA atmospheric baselines,
              and CartoDEM topography harmonized into a 12-channel tensor.
            </p>
            <div className="step-highlight-pill">12-Channel Synchronized Tensor</div>
          </div>

          <div className="workflow-step-arrow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </div>

          {/* Step 02 */}
          <div className="decision-step-v3">
            <div className="step-v3-header">
              <div className="step-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
                <span>02 PREDICT</span>
              </div>
            </div>
            <div className="step-img-box">
              <img src="/workflow_predict.jpg" alt="02 Predict" className="step-img" />
              <div className="step-img-overlay" />
            </div>
            <h4 className="step-v3-title">Multi-Hazard Nowcasting (2–6 h)</h4>
            <p className="step-v3-desc">
              Cross-attention transformer computes joint probability grids for thunderstorms,
              cloudburst cores, and flash flood paths at 4 km resolution in &lt; 150 ms.
            </p>
            <div className="step-highlight-pill">Joint 4 km Probability Grids (&lt; 150 ms)</div>
          </div>

          <div className="workflow-step-arrow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </div>

          {/* Step 03 */}
          <div className="decision-step-v3">
            <div className="step-v3-header">
              <div className="step-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span>03 EXPLAIN</span>
              </div>
            </div>
            <div className="step-img-box">
              <img src="/workflow_explain.jpg" alt="03 Explain" className="step-img" />
              <div className="step-img-overlay" />
            </div>
            <h4 className="step-v3-title">Physical Drivers &amp; XAI Insights</h4>
            <p className="step-v3-desc">
              Captum Integrated Gradients decompose every alert polygon into verifiable
              physical contributions (IWV, CAPE, CTT rate, slope) eliminating black-box doubt.
            </p>
            <div className="step-highlight-pill">Captum Feature Attribution Weights</div>
          </div>

          <div className="workflow-step-arrow">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6" /></svg>
          </div>

          {/* Step 04 */}
          <div className="decision-step-v3">
            <div className="step-v3-header">
              <div className="step-pill alert-beacon-pill">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <span>04 DISPATCH</span>
              </div>
            </div>
            <div className="step-img-box">
              <img src="/workflow_dispatch.jpg" alt="04 Dispatch" className="step-img" />
              <div className="step-img-overlay" />
            </div>
            <h4 className="step-v3-title">CAP Alerts &amp; Emergency Response</h4>
            <p className="step-v3-desc">
              Automated ITU-T X.1303 / CAP 1.2 standardized warning payloads transmitted
              directly to NDMA SACHET, SDRF Battalion EOCs, and community sirens.
            </p>
            <div className="step-highlight-pill">Automated CAP 1.2 / SACHET Broadcast</div>
          </div>
        </div>
      </section>

      {/* ============================================================
          8. NATIONAL IMPACT & FOOTER
          ============================================================ */}
      <div id="impact-section" className="section-impact-wrapper">
        <section id="impact" className="section-impact">
        <div className="impact-header-wrap">
          <div className="impact-header-left">
            <div className="section-eyebrow">A SAFER INDIA</div>
            <h2 className="impact-title">
              From insight to <span className="impact-title-blue">impact.</span>
            </h2>
            <p className="impact-desc">
              Bridging the fatal gap between meteorological observation and emergency action
              with actionable lead time, disaster preparedness, and climate-resilient infrastructure.
            </p>
          </div>
          <div className="impact-header-right">
            <div className="impact-telemetry-map-box">
              {/* Constellation network graphic over India */}
              <svg viewBox="0 0 240 140" className="impact-constellation-svg">
                <path d="M 40,40 Q 80,20 120,50 T 180,30" fill="none" stroke="rgba(56, 189, 248, 0.4)" strokeDasharray="3 3" />
                <path d="M 60,90 Q 110,70 140,110 T 200,90" fill="none" stroke="rgba(56, 189, 248, 0.3)" />
                <path d="M 120,50 L 140,110" fill="none" stroke="rgba(56, 189, 248, 0.5)" />
                <path d="M 40,40 L 60,90" fill="none" stroke="rgba(56, 189, 248, 0.4)" />
                <path d="M 180,30 L 200,90" fill="none" stroke="rgba(56, 189, 248, 0.4)" />
                <circle cx="40" cy="40" r="3" fill="#38bdf8" />
                <circle cx="120" cy="50" r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1" />
                <circle cx="180" cy="30" r="3" fill="#38bdf8" />
                <circle cx="60" cy="90" r="3.5" fill="#38bdf8" />
                <circle cx="140" cy="110" r="4" fill="#38bdf8" stroke="#fff" strokeWidth="1" />
                <circle cx="200" cy="90" r="3" fill="#38bdf8" />
              </svg>
              <div className="impact-header-tags">
                <span>EARLIER WARNINGS</span>
                <span>SAFER COMMUNITIES</span>
                <span>STRONGER INDIA</span>
                <span className="telemetry-bar-divider" />
                <span className="impact-resilience-quote">“From data to disaster resilience.”</span>
              </div>
            </div>
          </div>
        </div>

        <div className="impact-grid-v3">
          {/* Card 1 */}
          <div className="impact-card-v3">
            <div className="impact-card-num-box">
              <span className="impact-card-num">01</span>
              <div className="impact-card-icon-circle">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
            </div>
            <div className="impact-card-img-box">
              <img src="/impact_rescue.jpg" alt="Lives Protected" className="impact-card-img" />
              <div className="impact-card-img-overlay" />
            </div>
            <div className="impact-card-content">
              <div className="impact-lead-tag">2 – 6 h Lead Time</div>
              <h3 className="impact-card-heading">Lives Protected</h3>
              <p className="impact-card-p">
                Earlier action enables district emergency operation centers (EOCs) and first responders
                to evacuate vulnerable riverbeds, divert mountain traffic, and stage rescue assets well
                before catastrophic cloudburst runoff strikes.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="impact-card-v3">
            <div className="impact-card-num-box">
              <span className="impact-card-num">02</span>
              <div className="impact-card-icon-circle">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><line x1="22" y1="12" x2="18" y2="12"/><line x1="6" y1="12" x2="2" y2="12"/><line x1="12" y1="6" x2="12" y2="2"/><line x1="12" y1="22" x2="12" y2="18"/></svg>
              </div>
            </div>
            <div className="impact-card-img-box">
              <img src="/impact_precision.jpg" alt="Reduced Risk" className="impact-card-img" />
              <div className="impact-card-img-overlay" />
            </div>
            <div className="impact-card-content">
              <div className="impact-lead-tag">4 km Precision</div>
              <h3 className="impact-card-heading">Reduced Risk</h3>
              <p className="impact-card-p">
                Hyper-local resolution eliminates the “crying wolf” effect of district-wide warnings.
                Pinpointing specific valleys and mountain nullahs maintains public trust and ensures
                rapid compliance with emergency bulletins.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="impact-card-v3">
            <div className="impact-card-num-box">
              <span className="impact-card-num">03</span>
              <div className="impact-card-icon-circle">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2"><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11M8 14v4M12 14v4M16 14v4"/></svg>
              </div>
            </div>
            <div className="impact-card-img-box">
              <img src="/hazard_cloudburst.jpg" alt="Stronger Resilience" className="impact-card-img" />
              <div className="impact-card-img-overlay" />
            </div>
            <div className="impact-card-content">
              <div className="impact-lead-tag">CAP 1.2 Ready</div>
              <h3 className="impact-card-heading">Stronger Resilience</h3>
              <p className="impact-card-p">
                Standardized interoperability empowers national, state, and local agencies to safeguard
                hydropower dams, highway corridors, and pilgrim routes against cascading multi-hazard catastrophes.
              </p>
            </div>
          </div>
        </div>

        {/* Real Data Real Impact CTA Box */}
        <div className="portal-cta-banner-v3">
          <div className="cta-banner-bg-earth">
            <img src="/globe_asia_telemetry.jpg" alt="" className="cta-bg-earth-img" />
            <div className="cta-bg-earth-vignette" />
          </div>

          <div className="cta-banner-left">
            <div className="cta-banner-eyebrow">REAL DATA. REAL IMPACT.</div>
            <h3 className="cta-banner-heading">Ready to inspect live hazard intelligence?</h3>
            <p className="cta-banner-desc">
              Access the full operations portal — Interactive GIS nowcast, XAI diagnostics,
              forensic event playback, CAP alert dispatch hub, and system telemetry.
            </p>
          </div>

          <div className="cta-banner-right">
            <button className="btn-cta-enter-v3" onClick={onEnterPortal}>
              Enter Operations Portal →
            </button>
            <button className="cta-link-public-warnings" onClick={onOpenPublicWarnings}>
              View Public Warnings ↗
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================
          9. SMART SOVEREIGN 4-COLUMN FOOTER (Warning Page Footer)
          ============================================================ */}
      <footer className="cp-footer">
        {/* Row 1: Live System Telemetry Strip */}
        <div className="cp-footer-telemetry">
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
            <div className="cp-footer-col cp-footer-brand-col">
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
                <svg className="cp-gov-emblem-svg" viewBox="0 0 24 28" fill="#94a3b8">
                  <path d="M12 2C8 2 6 5 6 8C6 11 8 13 12 14C16 13 18 11 18 8C18 5 16 2 12 2ZM12 15C7 15 3 18 3 22H21C21 18 17 15 12 15Z"/>
                </svg>
                <div className="cp-gov-text" style={{ color: '#cbd5e1' }}>
                  Ministry of Earth Sciences
                  <span style={{ color: '#94a3b8' }}>Government of India</span>
                </div>
              </div>
            </div>

            {/* Col 2: Public Warning Services */}
            <div className="cp-footer-col">
              <h3 className="cp-footer-heading">Public Warning Services</h3>
              <ul className="cp-footer-link-list">
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>Active District Warning Radar</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>Nearest Safe Shelter Locator</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>Flash Flood Safety Protocols</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>Cloudburst Evacuation Guidelines</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>CAP 1.2 Common Alerting Feed</button></li>
              </ul>
            </div>

            {/* Col 3: 24x7 Emergency Hotlines */}
            <div className="cp-footer-col">
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
            <div className="cp-footer-col">
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
        <div className="cp-footer-bottom">
          <div className="cp-footer-bottom-inner">
            <div className="cp-footer-legal">
              <span>© 2026 VAYUNET · Ministry of Earth Sciences, Government of India. All rights reserved.</span>
              <span>Compliant with ITU-T X.1303 CAP 1.2 Protocol · WCAG 2.1 Level AA</span>
            </div>
            <div className="cp-footer-bottom-links">
              <span onClick={onOpenPublicWarnings}>Privacy Policy</span>
              <span onClick={onOpenPublicWarnings}>Terms of Use</span>
              <span onClick={onEnterPortal}>Operations Portal</span>
              <span onClick={onOpenPublicWarnings}>Public Warnings</span>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  );
}
