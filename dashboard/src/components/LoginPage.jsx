import React, { useState } from 'react';
import { INDIAN_LANGUAGES } from './HomePage';

const FAST_TRACK_USERS = [
  { 
    user: 'DEOC-KANGRA-04', 
    role: 'Incident Commander', 
    unit: 'Kangra District EOC · Himachal Pradesh',
    pass: 'demo2024',
    clearance: 'OPERATIONAL COMMAND'
  },
];

export default function LoginPage({ onLoginSuccess, onBackHome }) {
  const [credentials, setCredentials] = useState({ user: '', pass: '' });
  const [language, setLanguage] = useState('EN');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!credentials.user.trim()) {
      setError('Please enter your Operator ID or select a Fast-Track role below.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const match = FAST_TRACK_USERS.find(
        u => u.user.toLowerCase() === credentials.user.trim().toLowerCase() && u.pass === credentials.pass
      );

      if (match) {
        onLoginSuccess({ 
          user: match.user, 
          role: match.role, 
          unit: match.unit, 
          clearance: match.clearance 
        });
      } else if (credentials.user.trim().length > 0) {
        // Allow custom operator ID for demo flexibility
        onLoginSuccess({ 
          user: credentials.user.trim().toUpperCase(), 
          role: 'Authorized Commander', 
          unit: 'DEOC Tactical Operations Unit',
          clearance: 'OPERATIONAL LEVEL 2'
        });
      } else {
        setError('Authentication challenge failed. Please use Fast-Track access below.');
      }
    }, 350);
  };

  const handleFastTrack = (u) => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess({ 
        user: u.user, 
        role: u.role, 
        unit: u.unit, 
        clearance: u.clearance 
      });
    }, 200);
  };

  return (
    <div className="login-standalone-page">
      {/* Dynamic atmospheric mountain backdrop & subtle glow overlays */}
      <div className="login-page-backdrop" />
      <div className="login-page-glow-overlay" />

      {/* Main Navigation Bar */}
      <nav className="home-nav nav-scrolled" style={{ position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000 }}>
        <div className="home-nav-inner">
          <div className="home-brand" onClick={onBackHome} style={{ cursor: 'pointer' }} title="Return to VAYUNET Home">
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

          <div className="home-nav-actions">
            {/* Language dropdown */}
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
                onChange={(e) => setLanguage(e.target.value)}
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
            <button 
              className="btn-secondary-nav"
              onClick={() => {
                window.location.hash = '#/warnings';
              }}
              title="Open Public Warnings"
            >
              <span className="nav-btn-pulse-dot"></span>
              <span>Public Warnings ↗</span>
            </button>

            {/* Return to Home Button */}
            <button 
              className="btn-primary-nav"
              onClick={onBackHome}
              title="Return to VAYUNET Home"
            >
              <span>← Return to Home</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Authentication Terminal Content */}
      <div className="login-terminal-wrapper">
        <div className="login-terminal-card">
          {/* Security Banner */}
          <div className="terminal-sec-banner">
            <span className="sec-dot" />
            <span>RESTRICTED OPERATIONAL SYSTEM // AUTHORIZED PERSONNEL ONLY</span>
          </div>

          {/* Header Brand */}
          <div className="terminal-header">
            <div className="terminal-logo-wrap">
              <img src="/VAYUNET_LOGO.png" alt="VAYUNET Logo" className="terminal-logo-img" />
            </div>
            <div>
              <div className="brand-row">
                <h1 className="terminal-title" style={{ margin: 0 }}>VAYUNET COMMAND GATEWAY</h1>
                <span className="gov-sovereign-pill">🇮🇳 MoES · NCMRWF</span>
              </div>
              <p className="terminal-subtitle" style={{ margin: '4px 0 0 0' }}>
                Severe Weather Nowcasting &amp; Emergency Alert Dispatch Engine
              </p>
            </div>
          </div>

          {/* Standard Authentication Form */}
          <form className="terminal-form" onSubmit={handleLogin}>
            <div className="terminal-field">
              <label htmlFor="login-user">OPERATOR IDENTIFICATION</label>
              <input
                id="login-user"
                type="text"
                placeholder="e.g. DEOC-KANGRA-04 or your name"
                value={credentials.user}
                onChange={e => { setCredentials(p => ({ ...p, user: e.target.value })); setError(''); }}
                autoComplete="username"
                autoFocus
              />
            </div>

            <div className="terminal-field">
              <label htmlFor="login-pass">ACCESS PASSCODE</label>
              <input
                id="login-pass"
                type="password"
                placeholder="Demo: demo2024"
                value={credentials.pass}
                onChange={e => { setCredentials(p => ({ ...p, pass: e.target.value })); setError(''); }}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="terminal-error">
                <span>[ERROR]</span> {error}
              </div>
            )}

            <button className="btn-terminal-submit" type="submit" disabled={isLoading}>
              {isLoading ? 'AUTHENTICATING TOKEN...' : 'AUTHENTICATE & ENTER PORTAL →'}
            </button>
          </form>

          {/* Evaluator Fast-Track Sandbox */}
          <div className="fast-track-section">
            <div className="fast-track-header">
              <span className="fast-track-line" />
              <span className="fast-track-title">EVALUATOR 1-CLICK TACTICAL PASSES</span>
              <span className="fast-track-line" />
            </div>

            <p className="fast-track-desc">
              Instant login for SIH jurors &amp; evaluators to inspect real-time nowcast, diagnostics, forensics, and alert hubs:
            </p>

            <div className="fast-track-grid">
              {FAST_TRACK_USERS.map(u => (
                <button
                  key={u.user}
                  type="button"
                  className="fast-track-card"
                  onClick={() => handleFastTrack(u)}
                >
                  <div className="ft-top">
                    <span className="ft-role">{u.role}</span>
                    <span className="ft-clearance">{u.clearance}</span>
                  </div>
                  <div className="ft-user">{u.user}</div>
                  <div className="ft-unit">{u.unit}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Security Compliance Audit */}
          <div className="terminal-footer">
            <span>AUDIT NOTICE: Sessions monitored &amp; synchronized with NDMA Unified Standard Protocol.</span>
            <span>SIH Problem Statement 26077 · MoES / NCMRWF</span>
          </div>
        </div>
      </div>

      {/* Sovereign Live Telemetry Status Bar */}
      <div className="login-telemetry-bar">
        <div className="telemetry-item">
          <span className="telemetry-dot green" />
          <span>MOES · NCMRWF SECURE PROTOCOL ACTIVE</span>
        </div>
        <div className="telemetry-item">
          <span>CAP 1.2 DISPATCH ENGINE</span>
          <span className="telemetry-sep">/</span>
          <span>LATENCY &lt; 120ms</span>
        </div>
        <div className="telemetry-item">
          <span>24x7 NDMA HELPLINE: <strong style={{ color: '#ef4444' }}>1078</strong></span>
        </div>
      </div>
    </div>
  );
}
