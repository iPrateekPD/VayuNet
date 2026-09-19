import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useAccessibility } from '../context/AccessibilityContext';
import './AccessibilityMenu.css';

const A11Y_LABELS = {
  EN: {
    btn: 'Accessibility',
    title: 'Accessibility Options',
    language: 'Language',
    largeText: 'Large Text',
    smallText: 'Small Text',
    resetText: 'Reset Text',
    highContrast: 'High Contrast',
    reduceMotion: 'Reduce Motion',
    readAloud: 'Read Aloud (Voice)',
    resetAll: 'Reset All',
    defaultSettings: 'Default settings (0 active)',
    clearAll: 'Clear all',
    optionsEnabled: 'option(s) enabled'
  },
  HI: {
    btn: 'सुलभता',
    title: 'सुलभता विकल्प',
    language: 'भाषा',
    largeText: 'बड़ा अक्षर',
    smallText: 'छोटा अक्षर',
    resetText: 'सामान्य अक्षर',
    highContrast: 'उच्च कंट्रास्ट',
    reduceMotion: 'गतिशीलता घटाएं',
    readAloud: 'बोलकर सुनें (भाषिणी)',
    resetAll: 'सभी रीसेट करें',
    defaultSettings: 'डिफ़ॉल्ट सेटिंग्स (0 सक्रिय)',
    clearAll: 'हटाएं',
    optionsEnabled: 'विकल्प सक्रिय'
  }
};

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [desktopPos, setDesktopPos] = useState(null);
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

  const langKey = (language || 'en').toUpperCase();
  const a11yText = A11Y_LABELS[langKey] || A11Y_LABELS.EN;

  // Position calculation for desktop popup
  const updatePosition = () => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth > 768 && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      setDesktopPos({
        top: Math.round(rect.bottom + 8),
        right: Math.max(12, Math.round(window.innerWidth - rect.right))
      });
    } else {
      setDesktopPos(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    const handleResize = () => updatePosition();
    const handleScroll = () => updatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

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

  // Close panel on outside click or tap
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
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Count active options (matching "1 option enabled" in reference image)
  const activeCount = 
    (textSize !== 'normal' ? 1 : 0) +
    (highContrast ? 1 : 0) +
    (reduceMotion ? 1 : 0) +
    (readAloud ? 1 : 0);

  const toggleMenu = () => {
    if (!isOpen) {
      updatePosition();
    }
    setIsOpen((prev) => !prev);
  };

  const modalContent = isOpen && typeof document !== 'undefined' ? createPortal(
    <>
      {/* Subtle overlay with light background blur */}
      <div
        className="vayu-a11y-overlay"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* Accessibility Panel Modal styled exactly like reference image in VAYUNET colors */}
      <div
        className="vayu-a11y-panel"
        ref={panelRef}
        role="dialog"
        aria-label="Accessibility Options"
        style={
          desktopPos
            ? {
                position: 'fixed',
                top: `${desktopPos.top}px`,
                right: `${desktopPos.right}px`,
                bottom: 'auto',
                left: 'auto',
              }
            : undefined
        }
      >
        {/* Mobile handle indicator */}
        <div className="vayu-a11y-sheet-handle" aria-hidden="true" />

        {/* Header Bar */}
        <div className="vayu-a11y-card-header">
          <div className="vayu-a11y-card-title">
            <span className="vayu-a11y-header-glyph">♿</span>
            <span>{a11yText.title}</span>
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
            <span>{a11yText.language}</span>
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
            <span className="vayu-card-btn-text">{a11yText.largeText}</span>
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
            <span className="vayu-card-btn-text">{a11yText.smallText}</span>
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
            <span className="vayu-card-btn-text">{a11yText.resetText}</span>
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
            <span className="vayu-card-btn-text">{a11yText.highContrast}</span>
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
            <span className="vayu-card-btn-text">{a11yText.reduceMotion}</span>
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
            <span className="vayu-card-btn-text">{a11yText.readAloud}</span>
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
            <span className="vayu-card-btn-text">{a11yText.resetAll}</span>
          </button>
        </div>

        {/* Footer Bar matching reference image */}
        <div className="vayu-a11y-card-footer">
          <span className="vayu-a11y-count-text">
            {activeCount === 0 ? a11yText.defaultSettings : `${activeCount} ${a11yText.optionsEnabled}`}
          </span>
          {activeCount > 0 && (
            <button 
              type="button"
              className="vayu-a11y-footer-reset-link"
              onClick={resetAccessibility}
            >
              {a11yText.clearAll}
            </button>
          )}
        </div>
      </div>
    </>,
    document.body
  ) : null;

  return (
    <div className="vayu-a11y-wrap" ref={menuRef}>
      {/* ♿ Accessibility ▾ Header Control */}
      <button
        type="button"
        className={`vayu-a11y-btn ${isOpen ? 'active' : ''}`}
        onClick={toggleMenu}
        aria-label="Accessibility Options"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
      >
        <span className="vayu-a11y-icon" aria-hidden="true">♿</span>
        <span className="vayu-a11y-label">{a11yText.btn}</span>
        <span className="vayu-a11y-arrow" aria-hidden="true">▾</span>
      </button>

      {modalContent}
    </div>
  );
}
