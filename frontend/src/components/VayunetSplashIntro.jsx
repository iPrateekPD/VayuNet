import React, { useEffect, useState } from 'react';
import './VayunetSplashIntro.css';

export default function VayunetSplashIntro({ onComplete }) {
  const [phase, setPhase] = useState('active'); // 'active' | 'exiting' | 'done'

  useEffect(() => {
    // 1. Immediately lock all scrolling on body and html while splash logo screen is visible
    document.body.classList.add('splash-active');
    document.documentElement.classList.add('splash-active');
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    // Prevent wheel and touch scrolling on mobile during splash
    const preventScroll = (e) => {
      e.preventDefault();
    };
    window.addEventListener('touchmove', preventScroll, { passive: false });
    window.addEventListener('wheel', preventScroll, { passive: false });

    // 2. After 2.0s of animation, initiate smooth exit transition
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
    }, 2000);

    // 3. After 2.5s, fully finish, unlock scrolling, ensure top (0, 0) and unmount
    const doneTimer = setTimeout(() => {
      setPhase('done');
      document.body.classList.remove('splash-active');
      document.documentElement.classList.remove('splash-active');
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('wheel', preventScroll);
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
      document.body.classList.remove('splash-active');
      document.documentElement.classList.remove('splash-active');
      window.removeEventListener('touchmove', preventScroll);
      window.removeEventListener('wheel', preventScroll);
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div className={`vayunet-splash-screen ${phase === 'exiting' ? 'splash-exiting' : ''}`}>
      {/* Ambient Atmospheric Rings */}
      <div className="splash-ambient-glow" />
      <div className="splash-radar-ring ring-1" />
      <div className="splash-radar-ring ring-2" />
      <div className="splash-radar-ring ring-3" />

      <div className="splash-center-content">
        {/* VAYUNET Logo */}
        <div className="splash-logo-wrap">
          <img
            src="/VAYUNET_LOGO.png"
            alt="VAYUNET Logo"
            className="splash-logo-img"
          />
          <div className="splash-logo-shine" />
        </div>

        {/* Brand Name & Tagline */}
        <div className="splash-brand-text">
          <h1 className="splash-brand-title">VAYUNET</h1>
          <div className="splash-brand-subtitle">
            HYPER-LOCAL SEVERE WEATHER NOWCASTING
          </div>
        </div>

        {/* Scanning Telemetry Progress Beam */}
        <div className="splash-loader-track">
          <div className="splash-loader-bar" />
        </div>

        {/* Sovereign Attribution */}
        <div className="splash-gov-tag">
          Ministry of Earth Sciences · Government of India
        </div>
      </div>
    </div>
  );
}
