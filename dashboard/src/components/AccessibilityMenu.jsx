import React, { useState, useEffect, useRef } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import './AccessibilityMenu.css';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const panelRef = useRef(null);

  const {
    language,
    setLanguage,
    textSize,
    setTextSize,
    highContrast,
    setHighContrast,
    reduceMotion,
    setReduceMotion,
    readAloud,
    setReadAloud,
    resetAccessibility,
    supportedLanguages
  } = useAccessibility();

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isOpen &&
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        panelRef.current &&
        !panelRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="vayu-a11y-wrap" ref={menuRef}>
      {/* ♿ Accessibility ▾ Button (Replaces Language dropdown in header) */}
      <button
        type="button"
        className={`vayu-a11y-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Accessibility & Language"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="vayu-a11y-icon" aria-hidden="true">♿</span>
        <span className="vayu-a11y-label">Accessibility</span>
        <span className="vayu-a11y-arrow" aria-hidden="true">▾</span>
      </button>

      {/* Subtle overlay with light background blur (blur: 4px - 6px) */}
      {isOpen && (
        <div
          className="vayu-a11y-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Compact Accessibility Panel */}
      {isOpen && (
        <div
          className="vayu-a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility & Language Settings"
        >
          {/* Panel Header */}
          <div className="vayu-a11y-header">
            <div className="vayu-a11y-header-left">
              <div className="vayu-a11y-header-title">
                <span>♿</span>
                <span>Accessibility</span>
              </div>
              <div className="vayu-a11y-header-subtitle">Accessibility & Language</div>
            </div>
            <button
              type="button"
              className="vayu-a11y-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Accessibility Panel"
            >
              &times;
            </button>
          </div>

          {/* Section 1: 🌐 Language */}
          <div className="vayu-a11y-section">
            <label className="vayu-a11y-section-label" htmlFor="vayu-a11y-lang-select">
              <span>🌐</span>
              <span>Language</span>
            </label>
            <div className="vayu-a11y-lang-select-box">
              <select
                id="vayu-a11y-lang-select"
                className="vayu-a11y-lang-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {supportedLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.native} {lang.native !== lang.label ? `(${lang.label})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 2: Aa Text Size */}
          <div className="vayu-a11y-section">
            <div className="vayu-a11y-section-label">
              <span>Aa</span>
              <span>Text Size</span>
            </div>
            <div className="vayu-a11y-size-pills" role="group" aria-label="Text size options">
              <button
                type="button"
                className={`vayu-a11y-size-pill ${textSize === 'small' ? 'active' : ''}`}
                onClick={() => setTextSize('small')}
                aria-pressed={textSize === 'small'}
                title="Decrease Text Size"
              >
                A−
              </button>
              <button
                type="button"
                className={`vayu-a11y-size-pill ${textSize === 'normal' ? 'active' : ''}`}
                onClick={() => setTextSize('normal')}
                aria-pressed={textSize === 'normal'}
                title="Default Text Size"
              >
                A
              </button>
              <button
                type="button"
                className={`vayu-a11y-size-pill ${textSize === 'large' ? 'active' : ''}`}
                onClick={() => setTextSize('large')}
                aria-pressed={textSize === 'large'}
                title="Increase Text Size"
              >
                A+
              </button>
            </div>
          </div>

          {/* Section 3: Feature Toggles */}
          <div className="vayu-a11y-toggles-group">
            {/* 🔊 Read Aloud */}
            <div
              className="vayu-a11y-toggle-row"
              onClick={() => setReadAloud(!readAloud)}
              role="switch"
              aria-checked={readAloud}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setReadAloud(!readAloud)}
            >
              <div className="vayu-a11y-toggle-info">
                <span className="vayu-a11y-icon-glyph">🔊</span>
                <span>Read Aloud</span>
              </div>
              <div className={`vayu-a11y-switch ${readAloud ? 'on' : ''}`}>
                <div className="vayu-a11y-switch-knob" />
              </div>
            </div>

            {/* 👁 High Contrast */}
            <div
              className="vayu-a11y-toggle-row"
              onClick={() => setHighContrast(!highContrast)}
              role="switch"
              aria-checked={highContrast}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setHighContrast(!highContrast)}
            >
              <div className="vayu-a11y-toggle-info">
                <span className="vayu-a11y-icon-glyph">👁</span>
                <span>High Contrast</span>
              </div>
              <div className={`vayu-a11y-switch ${highContrast ? 'on' : ''}`}>
                <div className="vayu-a11y-switch-knob" />
              </div>
            </div>

            {/* ◐ Reduce Motion */}
            <div
              className="vayu-a11y-toggle-row"
              onClick={() => setReduceMotion(!reduceMotion)}
              role="switch"
              aria-checked={reduceMotion}
              tabIndex={0}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setReduceMotion(!reduceMotion)}
            >
              <div className="vayu-a11y-toggle-info">
                <span className="vayu-a11y-icon-glyph">◐</span>
                <span>Reduce Motion</span>
              </div>
              <div className={`vayu-a11y-switch ${reduceMotion ? 'on' : ''}`}>
                <div className="vayu-a11y-switch-knob" />
              </div>
            </div>
          </div>

          {/* Section 4: Reset Accessibility Settings */}
          <button
            type="button"
            className="vayu-a11y-reset-btn"
            onClick={resetAccessibility}
          >
            <span>↺</span>
            <span>Reset Accessibility Settings</span>
          </button>
        </div>
      )}
    </div>
  );
}
