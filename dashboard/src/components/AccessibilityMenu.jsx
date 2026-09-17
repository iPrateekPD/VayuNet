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

  // Count active options (matching "1 option enabled" in reference image)
  const activeCount = 
    (textSize !== 'normal' ? 1 : 0) +
    (highContrast ? 1 : 0) +
    (reduceMotion ? 1 : 0) +
    (readAloud ? 1 : 0);

  return (
    <div className="vayu-a11y-wrap" ref={menuRef}>
      {/* ♿ Accessibility ▾ Header Control */}
      <button
        type="button"
        className={`vayu-a11y-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Accessibility Options"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="vayu-a11y-icon" aria-hidden="true">♿</span>
        <span className="vayu-a11y-label">Accessibility</span>
        <span className="vayu-a11y-arrow" aria-hidden="true">▾</span>
      </button>

      {/* Subtle overlay with light background blur */}
      {isOpen && (
        <div
          className="vayu-a11y-overlay"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Accessibility Panel Modal styled exactly like reference image in VAYUNET colors */}
      {isOpen && (
        <div
          className="vayu-a11y-panel"
          ref={panelRef}
          role="dialog"
          aria-label="Accessibility Options"
        >
          {/* Header Bar */}
          <div className="vayu-a11y-card-header">
            <div className="vayu-a11y-card-title">
              <span className="vayu-a11y-header-glyph">♿</span>
              <span>Accessibility Options</span>
            </div>
            <button
              type="button"
              className="vayu-a11y-close-icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close Accessibility Panel"
            >
              &times;
            </button>
          </div>

          {/* Language Selector Strip */}
          <div className="vayu-a11y-lang-strip">
            <div className="vayu-a11y-lang-label">
              <span>🌐</span>
              <span>Language</span>
            </div>
            <select
              className="vayu-a11y-lang-select-clean"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              aria-label="Select Language"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.native} {lang.native !== lang.label ? `(${lang.label})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* 3-Column Grid matching reference image layout */}
          <div className="vayu-a11y-grid">
            {/* 1. Large Text */}
            <button
              type="button"
              className={`vayu-a11y-card-btn ${textSize === 'large' ? 'active' : ''}`}
              onClick={() => setTextSize(textSize === 'large' ? 'normal' : 'large')}
              aria-pressed={textSize === 'large'}
            >
              <div className="vayu-a11y-squircle">
                <span className="vayu-squircle-icon">A+</span>
                {textSize === 'large' && <span className="vayu-active-check">✓</span>}
              </div>
              <span className="vayu-card-btn-text">Large Text</span>
            </button>

            {/* 2. Small Text */}
            <button
              type="button"
              className={`vayu-a11y-card-btn ${textSize === 'small' ? 'active' : ''}`}
              onClick={() => setTextSize(textSize === 'small' ? 'normal' : 'small')}
              aria-pressed={textSize === 'small'}
            >
              <div className="vayu-a11y-squircle">
                <span className="vayu-squircle-icon">A−</span>
                {textSize === 'small' && <span className="vayu-active-check">✓</span>}
              </div>
              <span className="vayu-card-btn-text">Small Text</span>
            </button>

            {/* 3. Reset Text */}
            <button
              type="button"
              className={`vayu-a11y-card-btn ${textSize === 'normal' ? 'active' : ''}`}
              onClick={() => setTextSize('normal')}
              aria-pressed={textSize === 'normal'}
            >
              <div className="vayu-a11y-squircle">
                <span className="vayu-squircle-icon">↺</span>
                {textSize === 'normal' && <span className="vayu-active-check">✓</span>}
              </div>
              <span className="vayu-card-btn-text">Reset Text</span>
            </button>

            {/* 4. High Contrast */}
            <button
              type="button"
              className={`vayu-a11y-card-btn ${highContrast ? 'active' : ''}`}
              onClick={() => setHighContrast(!highContrast)}
              aria-pressed={highContrast}
            >
              <div className="vayu-a11y-squircle">
                <span className="vayu-squircle-icon">👁</span>
                {highContrast && <span className="vayu-active-check">✓</span>}
              </div>
              <span className="vayu-card-btn-text">High Contrast</span>
            </button>

            {/* 5. Reduce Motion */}
            <button
              type="button"
              className={`vayu-a11y-card-btn ${reduceMotion ? 'active' : ''}`}
              onClick={() => setReduceMotion(!reduceMotion)}
              aria-pressed={reduceMotion}
            >
              <div className="vayu-a11y-squircle">
                <span className="vayu-squircle-icon">◐</span>
                {reduceMotion && <span className="vayu-active-check">✓</span>}
              </div>
              <span className="vayu-card-btn-text">Reduce Motion</span>
            </button>

            {/* 6. Read Aloud */}
            <button
              type="button"
              className={`vayu-a11y-card-btn ${readAloud ? 'active' : ''}`}
              onClick={() => setReadAloud(!readAloud)}
              aria-pressed={readAloud}
            >
              <div className="vayu-a11y-squircle">
                <span className="vayu-squircle-icon">🔊</span>
                {readAloud && <span className="vayu-active-check">✓</span>}
              </div>
              <span className="vayu-card-btn-text">Read Aloud</span>
            </button>

            {/* 7. Reset All Options */}
            <button
              type="button"
              className="vayu-a11y-card-btn vayu-reset-span-btn"
              onClick={resetAccessibility}
            >
              <div className="vayu-a11y-squircle">
                <span className="vayu-squircle-icon">↺</span>
              </div>
              <span className="vayu-card-btn-text">Reset All</span>
            </button>
          </div>

          {/* Footer Bar matching reference image */}
          <div className="vayu-a11y-card-footer">
            <span className="vayu-a11y-count-text">
              {activeCount === 0 ? 'Default settings (0 active)' : `${activeCount} option${activeCount === 1 ? '' : 's'} enabled`}
            </span>
            {activeCount > 0 && (
              <button 
                type="button"
                className="vayu-a11y-footer-reset-link"
                onClick={resetAccessibility}
              >
                Clear all
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
