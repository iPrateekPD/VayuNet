import React, { useEffect, useState } from 'react';
import './VayunetSplashIntro.css';

export default function VayunetSplashIntro({ onComplete }) {
  const [phase, setPhase] = useState('active'); // 'active' | 'exiting' | 'done'

  useEffect(() => {
    // 1. After 2.0s of animation, initiate smooth exit transition
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
    }, 2000);

    // 2. After 2.5s, fully finish and notify parent to unmount
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete?.();
    }, 2500);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
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
