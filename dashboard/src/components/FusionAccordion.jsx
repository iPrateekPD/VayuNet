import React, { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';

const SOVEREIGN_STREAMS = [
  {
    id: 'insat',
    num: '01',
    agency: 'MOSDAC / ISRO',
    title: 'INSAT-3D / 3DR',
    category: 'SATELLITE OBSERVATIONS',
    quickStat: 'Cadence: 15 – 30 min · 4 km WGS84',
    desc: 'Geostationary multi-spectral radiances delivering rapid Cloud Top Temperature (CTT) cooling rates, Water Vapor (6.7 µm) moisture pooling, and Thermal Infrared brightness temperatures.',
    img: '/satellite_insat.jpg',
    chipTag: 'GEOSTATIONARY 4 KM',
    specs: [
      { label: 'Temporal Cadence', value: '15 – 30 min' },
      { label: 'Primary Channels', value: 'WV 6.7 µm · TIR 10.8 µm' },
      { label: 'Resolution', value: '4 km (Sub-satellite)' },
    ],
    accentTint: 'rgba(56, 189, 248, 0.03)',
    accentBorder: 'rgba(56, 189, 248, 0.45)',
  },
  {
    id: 'imdaa',
    num: '02',
    agency: 'NCMRWF',
    title: 'IMDAA',
    category: 'ATMOSPHERIC REANALYSIS',
    quickStat: 'Assimilation: Hourly Regional Cycle',
    desc: 'High-resolution regional reanalysis providing foundational thermodynamic soundings: Convective Available Potential Energy (CAPE), Convective Inhibition (CIN), and 0–6 km deep-layer vertical wind shear.',
    img: '/imdaa_reanalysis.jpg',
    chipTag: 'REANALYSIS 12 KM',
    specs: [
      { label: 'Assimilation', value: 'Hourly Regional Cycle' },
      { label: 'Key Variables', value: 'CAPE · CIN · Shear · Moisture' },
      { label: 'Coverage', value: 'Pan-India & Indian Ocean' },
    ],
    accentTint: 'rgba(56, 189, 248, 0.03)',
    accentBorder: 'rgba(56, 189, 248, 0.42)',
  },
  {
    id: 'cartodem',
    num: '03',
    agency: 'ISRO / BHUVAN',
    title: 'CartoDEM',
    category: 'TERRAIN INTELLIGENCE',
    quickStat: 'Native Grid: 30 m Hydro-enforced',
    desc: 'Sub-meter accurate 30 m Digital Elevation Model enabling hydrological basin demarcation, slope steepness computation, aspect analysis, and D8 kinematic wave overland flow routing.',
    img: '/cartodem_elevation.jpg',
    chipTag: 'HYDRO-ENFORCED 30 M',
    specs: [
      { label: 'Native Grid', value: '30 m Hydro-enforced' },
      { label: 'Hydro Model', value: 'D8 Flow Accumulation' },
      { label: 'Basin Matrix', value: 'Pan-India River Basins' },
    ],
    accentTint: 'rgba(56, 189, 248, 0.03)',
    accentBorder: 'rgba(56, 189, 248, 0.42)',
  },
];

export default function FusionAccordion({ onEnterPortal }) {
  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const descRefs = useRef([]);
  const specRefs = useRef([]);
  const imageRefs = useRef([]);
  const ctaLabelRefs = useRef([]);

  // Mobile open state map: tracks open cards on mobile
  const [mobileOpenCards, setMobileOpenCards] = useState({ 0: true });

  // Desktop active hovered index
  const [desktopHoveredIdx, setDesktopHoveredIdx] = useState(null);

  // Check reduced motion preference
  const isReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Direct GSAP expansion on desktop
  const expandCard = useCallback((idx) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    setDesktopHoveredIdx(idx);
    const reduced = isReducedMotion();
    const duration = reduced ? 0.05 : 0.65;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      // Kill in-flight tweens on card and its sub-elements
      gsap.killTweensOf(card);
      if (descRefs.current[i]) gsap.killTweensOf(descRefs.current[i]);
      if (specRefs.current[i]) gsap.killTweensOf(specRefs.current[i]);
      if (imageRefs.current[i]) gsap.killTweensOf(imageRefs.current[i]);
      if (ctaLabelRefs.current[i]) gsap.killTweensOf(ctaLabelRefs.current[i]);

      if (i === idx) {
        // Active hovered card expands
        gsap.to(card, {
          flexGrow: 2.25,
          flexShrink: 1,
          flexBasis: '0%',
          opacity: 1,
          y: reduced ? 0 : -3,
          borderColor: SOVEREIGN_STREAMS[i].accentBorder || 'rgba(56, 189, 248, 0.5)',
          boxShadow: '0 24px 50px -12px rgba(0, 0, 0, 0.75), 0 0 28px rgba(56, 189, 248, 0.16)',
          duration,
          ease: 'power3.out',
        });

        // Description reveals with smooth height expansion
        if (descRefs.current[i]) {
          gsap.to(descRefs.current[i], {
            opacity: 1,
            y: 0,
            maxHeight: 120,
            marginTop: 10,
            marginBottom: 10,
            duration: reduced ? 0.05 : 0.48,
            delay: reduced ? 0 : 0.06,
            ease: 'power3.out',
          });
        }

        // Detailed Specs reveal
        if (specRefs.current[i]) {
          gsap.to(specRefs.current[i], {
            opacity: 1,
            y: 0,
            maxHeight: 140,
            paddingTop: 10,
            duration: reduced ? 0.05 : 0.48,
            delay: reduced ? 0 : 0.1,
            ease: 'power3.out',
          });
        }

        // Image zooms smoothly and clarifies
        if (imageRefs.current[i]) {
          gsap.to(imageRefs.current[i], {
            opacity: 1,
            scale: 1,
            x: 0,
            duration,
            ease: 'power3.out',
          });
        }

        // CTA label illuminates
        if (ctaLabelRefs.current[i]) {
          gsap.to(ctaLabelRefs.current[i], {
            opacity: 1,
            x: 2,
            color: '#38bdf8',
            duration: reduced ? 0.05 : 0.35,
            ease: 'power2.out',
          });
        }
      } else {
        // Non-hovered cards contract and become quieter
        gsap.to(card, {
          flexGrow: 0.8,
          flexShrink: 1,
          flexBasis: '0%',
          opacity: 0.72,
          y: 0,
          borderColor: 'rgba(255, 255, 255, 0.07)',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.4)',
          duration,
          ease: 'power3.out',
        });

        if (descRefs.current[i]) {
          gsap.to(descRefs.current[i], {
            opacity: 0,
            y: 8,
            maxHeight: 0,
            marginTop: 0,
            marginBottom: 0,
            duration: reduced ? 0.05 : 0.3,
            ease: 'power2.in',
          });
        }

        if (specRefs.current[i]) {
          gsap.to(specRefs.current[i], {
            opacity: 0,
            y: 8,
            maxHeight: 0,
            paddingTop: 0,
            duration: reduced ? 0.05 : 0.3,
            ease: 'power2.in',
          });
        }

        if (imageRefs.current[i]) {
          gsap.to(imageRefs.current[i], {
            opacity: 0.6,
            scale: 1,
            x: 0,
            duration: reduced ? 0.05 : 0.5,
            ease: 'power3.out',
          });
        }

        if (ctaLabelRefs.current[i]) {
          gsap.to(ctaLabelRefs.current[i], {
            opacity: 0.35,
            x: 0,
            color: '#64748b',
            duration: reduced ? 0.05 : 0.3,
            ease: 'power2.out',
          });
        }
      }
    });
  }, []);

  // Restore all cards to resting dimensions on container mouseleave (desktop)
  const restoreAllCards = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    setDesktopHoveredIdx(null);
    const reduced = isReducedMotion();
    const duration = reduced ? 0.05 : 0.65;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      gsap.killTweensOf(card);
      if (descRefs.current[i]) gsap.killTweensOf(descRefs.current[i]);
      if (specRefs.current[i]) gsap.killTweensOf(specRefs.current[i]);
      if (imageRefs.current[i]) gsap.killTweensOf(imageRefs.current[i]);
      if (ctaLabelRefs.current[i]) gsap.killTweensOf(ctaLabelRefs.current[i]);

      gsap.to(card, {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0%',
        opacity: 1,
        y: 0,
        borderColor: 'rgba(255, 255, 255, 0.09)',
        boxShadow: '0 14px 34px rgba(0, 0, 0, 0.45)',
        duration,
        ease: 'power3.out',
      });

      if (descRefs.current[i]) {
        gsap.to(descRefs.current[i], {
          opacity: 0,
          y: 8,
          maxHeight: 0,
          marginTop: 0,
          marginBottom: 0,
          duration: reduced ? 0.05 : 0.35,
          ease: 'power2.out',
        });
      }

      if (specRefs.current[i]) {
        gsap.to(specRefs.current[i], {
          opacity: 0,
          y: 8,
          maxHeight: 0,
          paddingTop: 0,
          duration: reduced ? 0.05 : 0.35,
          ease: 'power2.out',
        });
      }

      if (imageRefs.current[i]) {
        gsap.to(imageRefs.current[i], {
          opacity: 0.65,
          scale: 0.95,
          x: 0,
          duration: reduced ? 0.05 : 0.55,
          ease: 'power3.out',
        });
      }

      if (ctaLabelRefs.current[i]) {
        gsap.to(ctaLabelRefs.current[i], {
          opacity: 0.55,
          x: 0,
          color: '#94a3b8',
          duration: reduced ? 0.05 : 0.35,
          ease: 'power2.out',
        });
      }
    });
  }, []);

  // Mobile automatic scroll-driven downward expansion:
  // As user scrolls down in phone mode (< 768px), each card detects when its top enters the focus
  // zone and smoothly unfolds DOWNWARDS. Cards above remain open during downward scroll so the
  // content never jumps or moves upward. When scrolling back up, cards below the screen fold back up.
  useEffect(() => {
    let ticking = false;

    const handleMobileScroll = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return;
      if (!containerRef.current) return;

      const windowH = window.innerHeight;
      // Reveal threshold: when the card top is within the lower 30% of screen as user scrolls down
      const revealThreshold = windowH * 0.72;

      setMobileOpenCards((prev) => {
        const next = { ...prev };
        let changed = false;

        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();

          // When scrolling down: card reaches reveal threshold -> smoothly unfold downwards
          // Preceding cards remain open so the document height above the viewport never shrinks (zero upward jerk)
          if (rect.top <= revealThreshold && rect.bottom > 40) {
            if (!next[i]) {
              next[i] = true;
              changed = true;
            }
          }
          // When scrolling back UP: card moves completely below viewport -> fold closed
          // Since this card is below the screen, folding it causes zero shift to anything visible
          else if (rect.top > windowH * 0.94) {
            if (next[i]) {
              next[i] = false;
              changed = true;
            }
          }
        });

        return changed ? next : prev;
      });
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMobileScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial check on load
    handleMobileScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cardRefs.current.forEach((card) => {
        if (card) gsap.killTweensOf(card);
      });
      descRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
      specRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
      imageRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
      ctaLabelRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
    };
  }, []);

  // Mobile accordion manual toggle
  const toggleMobileCard = (idx) => {
    setMobileOpenCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCardClick = (idx) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      toggleMobileCard(idx);
    } else {
      if (onEnterPortal) {
        onEnterPortal('data-sources');
      }
    }
  };

  return (
    <section id="data-fusion" className="section-data-fusion">
      {/* Top Header Row */}
      <div className="fusion-header-wrap">
        <div className="fusion-header-left">
          <div className="section-eyebrow">OUR FEATURES</div>
          <h2 className="fusion-title">
            Multi-source.<br />
            <span className="fusion-title-blue">One intelligence layer.</span>
          </h2>
          <p className="fusion-desc">
            VAYUNET ingests three sovereign observation streams, harmonizing disparate
            cadences and projections onto a unified 4 km WGS84 spatiotemporal grid.
          </p>
        </div>

        <div className="fusion-header-right">
          <button
            type="button"
            className="fusion-explore-all-btn"
            onClick={() => onEnterPortal?.('data-sources')}
            aria-label="Explore all sovereign observation streams"
          >
            <span className="explore-btn-text">EXPLORE ALL</span>
            <span className="explore-btn-circle">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Horizontal Accordion Container */}
      <div
        ref={containerRef}
        className="fusion-accordion-container"
        onMouseLeave={restoreAllCards}
        role="region"
        aria-label="Sovereign observation streams horizontal accordion"
      >
        {SOVEREIGN_STREAMS.map((stream, idx) => {
          const isMobileActive = !!mobileOpenCards[idx];
          const isExpanded = desktopHoveredIdx === idx;
          const isContracted = desktopHoveredIdx !== null && desktopHoveredIdx !== idx;

          return (
            <div
              key={stream.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              className={`fusion-accordion-card ${isMobileActive ? 'is-mobile-active' : ''} ${isExpanded ? 'is-expanded' : ''} ${isContracted ? 'is-contracted' : ''}`}
              style={{ background: stream.accentTint }}
              onMouseEnter={() => expandCard(idx)}
              onFocus={() => expandCard(idx)}
              onBlur={restoreAllCards}
              onClick={() => handleCardClick(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(idx);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isMobileActive}
              aria-label={`${stream.title} — ${stream.category}`}
            >
              <div className="fusion-card-inner">
                {/* Left Content Column */}
                <div className="fusion-card-left-col">
                  {/* Top Bar with Agency Badge and Stream Number */}
                  <div className="fusion-card-topbar">
                    <div className="fusion-agency-pill">
                      <span className="fusion-agency-icon">
                        {idx === 0 && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        )}
                        {idx === 1 && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                          </svg>
                        )}
                        {idx === 2 && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="3 18 9 6 15 13 18 9 21 18 3 18" />
                          </svg>
                        )}
                      </span>
                      <span className="fusion-agency-name">{stream.agency}</span>
                    </div>

                    <div className="fusion-card-topbar-right">
                      <span className="fusion-card-idx">{stream.num}</span>
                      <span className={`fusion-mobile-chevron ${isMobileActive ? 'is-open' : ''}`} aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Title & Category & Summary Stat */}
                  <div className="fusion-card-head">
                    <h3 className="fusion-card-title">{stream.title}</h3>
                    <div className="fusion-card-sub">{stream.category}</div>
                    <div className="fusion-card-quick-stat">
                      <span className="quick-stat-dot" />
                      <span>{stream.quickStat}</span>
                    </div>
                  </div>

                  {/* Expandable Description */}
                  <div
                    ref={(el) => (descRefs.current[idx] = el)}
                    className="fusion-card-desc-wrap"
                  >
                    <p className="fusion-card-desc-text">{stream.desc}</p>
                  </div>

                  {/* Expandable Specs Grid */}
                  <div
                    ref={(el) => (specRefs.current[idx] = el)}
                    className="fusion-card-specs-wrap"
                  >
                    <div className="fusion-specs-matrix">
                      {stream.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="fusion-spec-item">
                          <span className="spec-label">{spec.label}</span>
                          <strong className="spec-val">{spec.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action / CTA */}
                  <div className="fusion-card-bottom">
                    <div
                      ref={(el) => (ctaLabelRefs.current[idx] = el)}
                      className="fusion-cta-label"
                    >
                      <span>Explore Stream →</span>
                    </div>
                  </div>
                </div>

                {/* Right Visual / Image Column */}
                <div
                  ref={(el) => (imageRefs.current[idx] = el)}
                  className="fusion-card-media-col"
                >
                  <div className="fusion-media-frame">
                    <img
                      src={stream.img}
                      alt={`${stream.title} - ${stream.category}`}
                      className="fusion-media-img"
                      loading="lazy"
                    />
                    <div className="fusion-media-vignette" />

                    {/* Chip Tag */}
                    <div className="fusion-media-chip">{stream.chipTag}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
