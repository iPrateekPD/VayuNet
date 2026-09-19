import React, { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import HeroMap from './HeroMap';
import FusionAccordion from './FusionAccordion';
import ScrollStory from './ScrollStory';
import VayunetSplashIntro from './VayunetSplashIntro';
import {
  WEATHER_LAYERS,
  FORECAST_TIME_STEPS,
} from '../services/weatherService';
import AccessibilityMenu from './AccessibilityMenu';
import ReadAloudButton from './ReadAloudButton';
import { useAccessibility } from '../context/AccessibilityContext';
import { DotPattern } from "@/registry/magicui/dot-pattern";
import { cn } from "@/lib/utils";
import { getNavTranslation } from '../translations';
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
  const { language } = useAccessibility();
  const [showSplash, setShowSplash] = useState(true);
  const [telemetryTime, setTelemetryTime] = useState('');
  const [displayDate, setDisplayDate] = useState('');
  const [activeLayer, setActiveLayer] = useState('precipitation');
  const [scrubberIdx, setScrubberIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mobileLayerSheetOpen, setMobileLayerSheetOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('hero-section');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const langKey = (language || 'en').toUpperCase();
  const t = getNavTranslation(language);

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
      // On mobile view, skip the desktop map zoom and reveal immediately
      if (typeof window !== 'undefined' && window.innerWidth <= 768) {
        introCompleteRef.current = true;
        setIsIntroComplete(true);
        return;
      }

      // 1. Initial State: Hide all other elements before map zooms into position on Earth
      gsap.set(['.home-nav', '.emergency-alert-ticker'], { opacity: 0, y: -25 });
      gsap.set('.hero-text-readability-overlay', { opacity: 0 });
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
        delay: 2.0,
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
        .to(['.home-nav', '.emergency-alert-ticker'], {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: 'power2.out',
        }, '-=0.35')
        // 4. Hero left content staggers in
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
      // 2. Section 01: Multi-Source National Data Fusion
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

      const sectionIds = ['hero-section', 'data-fusion', 'how-it-works'];
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

  // Always start HomePage from top (0, 0)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    if (document.documentElement) document.documentElement.scrollTop = 0;
    if (document.body) document.body.scrollTop = 0;
  }, []);

  // Track active section for navigation highlights and slide dots
  useEffect(() => {
    const sectionIds = ['hero-section', 'data-fusion', 'how-it-works'];
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
    <>
      {/* 2-Second Opening VAYUNET Logo Cinematic Splash */}
      {showSplash && (
        <VayunetSplashIntro onComplete={() => setShowSplash(false)} />
      )}

      <div className={`home-page ${!isIntroComplete ? 'hero-intro-active' : ''}`}>

      {/* ============================================================
          1. REDESIGNED SOVEREIGN PRIMARY NAVIGATION
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
              { id: 'data-fusion', label: t.dataSources },
              { id: 'how-it-works', label: t.howItWorks },
            ].map(link => (
              <a
                key={link.id}
                href={`#${link.id}`}
                className={`nav-link-item ${activeSection === link.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (link.id === 'hero-section') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    const el = document.getElementById(link.id);
                    if (el) {
                      const targetY = Math.max(0, el.getBoundingClientRect().top + window.pageYOffset - 52);
                      window.scrollTo({ top: targetY, behavior: 'smooth' });
                    }
                  }
                }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right Header Actions */}
          <div className="home-nav-actions">
            {/* ♿ Unified Accessibility & Language Control (replaces English dropdown) */}
            <AccessibilityMenu />

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
        </div>
      </nav>

      {/* ============================================================
          2. LIVE EMERGENCY DISASTER / FLOOD WARNING NEWS TICKER
          ============================================================ */}
      <div className="emergency-alert-ticker" role="alert">
        <div className="ticker-badge">
          <span className="ticker-pulse-beacon" />
          <span className="ticker-badge-text">{t.tickerTitle}</span>
          <ReadAloudButton text={`${t.ticker1Tag}: ${t.ticker1Loc}. ${t.ticker1Desc}`} label="Read live weather alert aloud" />
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

        {/* Dedicated Mobile Clean Alert Row (matches reference) */}
        <div className="ticker-mobile-preview" onClick={onOpenPublicWarnings}>
          <span className="ticker-mobile-text">{t.tickerMobileText}</span>
          <span className="ticker-mobile-arrow">›</span>
        </div>

        <div className="ticker-helpline-wrap">
          <a href="tel:1078" className="ticker-helpline" title="Click to dial 24x7 NDMA Disaster Helpline">
            <span className="helpline-icon">🚨</span>
            <span>{t.ndmaHelpline}: <strong>1078</strong></span>
          </a>
        </div>
      </div>

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
            <h1 className="hero-headline">
              {t.heroHeadline1}<br />
              <span className="hero-headline-accent">{t.heroHeadline2}</span><br />
              <span className="hero-headline-accent">{t.heroHeadline3}</span>
            </h1>

            <p className="hero-lead-text">
              {t.heroLeadText}
            </p>

            <div className="hero-cta-group">
              <button className="btn-hero-portal" onClick={onEnterPortal} id="hero-enter-portal-btn">
                {t.enterPortal}
              </button>
              <button className="btn-hero-warnings" onClick={onOpenPublicWarnings} id="hero-view-warnings-btn">
                {t.viewPublicWarnings}
              </button>
            </div>

            {/* Dedicated Mobile Interactive Map (Positioned cleanly between CTAs and Provenance bar) */}
            <div className="mobile-hero-map-wrap">
              <HeroMap
                activeLayer={activeLayer}
                scrubberIdx={scrubberIdx}
                isMobile={true}
                mapControllerRef={mobileMapControllerRef}
              />
              <button
                type="button"
                className="mobile-map-recenter-fab"
                onClick={handleResetView}
                title={t.recenterMap}
                aria-label={t.recenterMap}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="7" />
                  <line x1="12" y1="1" x2="12" y2="5" />
                  <line x1="12" y1="19" x2="12" y2="23" />
                  <line x1="1" y1="12" x2="5" y2="12" />
                  <line x1="19" y1="12" x2="23" y2="12" />
                </svg>
              </button>
            </div>

            {/* Primary Action Info Pill (Desktop Only) */}
            <div className="hero-mission-badge">
              <span className="mission-badge-dot" />
              <span>{t.missionBadge}</span>
            </div>

            {/* National Data Provenance Bar */}
            <div className="hero-national-data-provenance">
              <div className="national-data-label">{t.poweredByNationalData}</div>
              <div className="national-data-sources-row">
                <div className="national-data-item">
                  <div className="national-data-icon-box">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
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
              {t.live}
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
            <span>{t.layers}: {t[activeLayer] || activeLayerMeta.label}</span>
          </button>

          {/* Desktop Floating Layer Selector Menu Card */}
          <div className={`map-layer-panel ${mobileLayerSheetOpen ? 'mobile-sheet-open' : ''}`}>
            <div className="mobile-sheet-header">
              <span>{t.selectWeatherLayer}</span>
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
                label: t.precipitation,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                  </svg>
                ),
              },
              {
                id: 'cloud_tops',
                label: t.cloud_tops,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                  </svg>
                ),
              },
              {
                id: 'lightning',
                label: t.lightning,
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                  </svg>
                ),
              },
              {
                id: 'wind',
                label: t.wind,
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
                label: t.terrain,
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
              title={t.zoomIn}
              aria-label={t.zoomIn}
            >
              +
            </button>
            <span className="zoom-ctrl-divider" />
            <button
              className="zoom-ctrl-btn"
              onClick={handleZoomOut}
              title={t.zoomOut}
              aria-label={t.zoomOut}
            >
              −
            </button>
            <span className="zoom-ctrl-divider" />
            <button
              className="zoom-ctrl-btn"
              onClick={handleResetView}
              title={t.recenterMap}
              aria-label={t.recenterMap}
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
                <div className="precip-legend-title">{t.legendPrecip}</div>
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
                <div className="precip-legend-title">{t.legendCloudTops}</div>
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
                <div className="precip-legend-title">{t.legendWind}</div>
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
                <div className="precip-legend-title">{t.legendLightning}</div>
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
                  title={isPlaying ? t.pauseForecast : t.playForecast}
                  aria-label={isPlaying ? t.pauseForecast : t.playForecast}
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
                <span className="compact-scrubber-title">{t.forecastLeadTime}</span>
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
                title={t.viewLiveMap}
              >
                <span>{t.viewLiveMap}</span>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

    </div>



      {/* ============================================================
          1. NATIONAL DATA FUSION (INTERACTIVE HORIZONTAL ACCORDION)
          ============================================================ */}
      <FusionAccordion onEnterPortal={onEnterPortal} />

      {/* ============================================================
          7. OPERATIONAL WORKFLOW (Scroll Story)
          ============================================================ */}
      <div style={{ display: 'block', width: '100%', flexShrink: 0 }}>
        <ScrollStory />
      </div>

      {/* ============================================================
          3. SMART SOVEREIGN 4-COLUMN FOOTER (Warning Page Footer)
          ============================================================ */}
      <footer className="cp-footer relative overflow-hidden">
        {/* MagicUI Background Dot Pattern */}
        <DotPattern
          className={cn(
            "pointer-events-none absolute inset-0 h-full w-full text-cyan-400/20",
            "[mask-image:radial-gradient(600px_circle_at_center,white,transparent)]"
          )}
          glow={true}
          width={22}
          height={22}
          cr={1.2}
        />
        {/* Row 1: Live System Telemetry Strip */}
        <div className="cp-footer-telemetry">
          <div className="cp-telemetry-inner">
            <div className="cp-telemetry-status">
              <span className="cp-footer-telemetry-dot"></span>
              <span><strong>{t.telemetryTitle}:</strong> {t.telemetryNominal}</span>
            </div>
            <div className="cp-telemetry-metrics">
              <span>{t.telemetryInsat} <strong>{t.online100}</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>{t.telemetryImdaa} <strong>{t.coupled}</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>{t.telemetryLatency} <strong>&lt; 120 ms</strong></span>
              <span className="cp-telemetry-sep">•</span>
              <span>{t.telemetryCap} <strong>{t.activeStatus}</strong></span>
            </div>
          </div>
        </div>

        {/* Row 2: 4-Column Rich Information Architecture */}
        <div className="cp-footer-main">
          <div className="cp-footer-grid">
            {/* Col 1: Brand & Sovereign Mandate */}
            <div className="cp-footer-col cp-footer-brand-col">
              <div className="cp-footer-brand">
                <div className="home-logo" style={{ width: 52, height: 52 }}>
                  <img src="/VAYUNET_LOGO.png" alt="VAYUNET Logo" className="home-logo-img" />
                </div>
                <div>
                  <h2>VAYUNET</h2>
                  <p>{t.footerSubtitle}</p>
                </div>
              </div>
              <p className="cp-footer-desc">
                {t.footerDesc}
              </p>
              <div className="cp-footer-emblem-badge">
                <img src="/emblem-india.svg" alt="State Emblem of India" className="cp-gov-emblem-img" />
                <div className="cp-gov-text" style={{ color: '#cbd5e1' }}>
                  {t.moes}
                  <span style={{ color: '#94a3b8' }}>{t.goi}</span>
                </div>
              </div>
            </div>

            {/* Col 2: Public Warning Services */}
            <div className="cp-footer-col">
              <h3 className="cp-footer-heading">{t.footerCol2Title}</h3>
              <ul className="cp-footer-link-list">
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>{t.footerRadar}</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>{t.footerShelter}</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>{t.footerProtocols}</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>{t.footerEvac}</button></li>
                <li><button className="cp-footer-btn-link" onClick={onOpenPublicWarnings}>{t.footerCap}</button></li>
              </ul>
            </div>

            {/* Col 3: 24x7 Emergency Hotlines */}
            <div className="cp-footer-col">
              <h3 className="cp-footer-heading">{t.footerCol3Title}</h3>
              <div className="cp-footer-hotlines">
                <a href="tel:112" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">112</div>
                  <div className="cp-hotline-desc">
                    <strong>{t.hotline112Title}</strong>
                    <span>{t.hotline112Sub}</span>
                  </div>
                </a>
                <a href="tel:108" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">108</div>
                  <div className="cp-hotline-desc">
                    <strong>{t.hotline108Title}</strong>
                    <span>{t.hotline108Sub}</span>
                  </div>
                </a>
                <a href="tel:1078" className="cp-footer-hotline-card">
                  <div className="cp-hotline-num">1078</div>
                  <div className="cp-hotline-desc">
                    <strong>{t.hotline1078Title}</strong>
                    <span>{t.hotline1078Sub}</span>
                  </div>
                </a>
              </div>
            </div>

            {/* Col 4: Sovereign Institutional Partners */}
            <div className="cp-footer-col">
              <h3 className="cp-footer-heading">{t.footerCol4Title}</h3>
              <ul className="cp-footer-link-list">
                <li><a href="https://www.moes.gov.in" target="_blank" rel="noreferrer">{t.instMoes}</a></li>
                <li><a href="https://mausam.imd.gov.in" target="_blank" rel="noreferrer">{t.instImd}</a></li>
                <li><a href="https://www.ncmrwf.gov.in" target="_blank" rel="noreferrer">{t.instNcmrwf}</a></li>
                <li><a href="https://ndma.gov.in" target="_blank" rel="noreferrer">{t.instNdma}</a></li>
                <li><a href="https://www.mosdac.gov.in" target="_blank" rel="noreferrer">{t.instIsro}</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Row 3: Bottom Legal & Compliance */}
        <div className="cp-footer-bottom">
          <div className="cp-footer-bottom-inner">
            <div className="cp-footer-legal">
              <span>{t.legalCopyright}</span>
              <span>{t.legalCompliance}</span>
            </div>
            <div className="cp-footer-bottom-links">
              <span onClick={onOpenPublicWarnings}>{t.legalPrivacy}</span>
              <span onClick={onOpenPublicWarnings}>{t.legalTerms}</span>
              <span onClick={onEnterPortal}>{t.legalPortal}</span>
              <span onClick={onOpenPublicWarnings}>{t.legalWarnings}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </>
  );
}
