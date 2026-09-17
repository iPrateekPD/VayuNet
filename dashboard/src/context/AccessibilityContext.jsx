import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import i18n, { SUPPORTED_LANGUAGES } from '../i18n';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  // 1. Language state (saved as 'vayunet_language', fallback 'en')
  const [language, setLanguageState] = useState(() => {
    const saved = localStorage.getItem('vayunet_language');
    if (saved) {
      const match = SUPPORTED_LANGUAGES.find(l => l.code.toLowerCase() === saved.toLowerCase());
      return match ? match.code : 'en';
    }
    return 'en';
  });

  // 2. Text Size state ('small' | 'normal' | 'large')
  const [textSize, setTextSizeState] = useState(() => {
    return localStorage.getItem('vayunet_text_size') || 'normal';
  });

  // 3. High Contrast state (boolean)
  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('vayunet_high_contrast') === 'true';
  });

  // 4. Reduce Motion state (boolean)
  const [reduceMotion, setReduceMotionState] = useState(() => {
    return localStorage.getItem('vayunet_reduce_motion') === 'true';
  });

  // 5. Read Aloud state (boolean)
  const [readAloud, setReadAloudState] = useState(() => {
    return localStorage.getItem('vayunet_read_aloud') === 'true';
  });

  // 6. Speaking state & notification toast
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechToast, setSpeechToast] = useState(null);

  const showA11yToast = useCallback((msg) => {
    setSpeechToast(msg);
    setTimeout(() => {
      setSpeechToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  }, []);

  // Update language handler (preserves user on current page and saves setting)
  const setLanguage = useCallback((code) => {
    const normalized = code.toLowerCase();
    setLanguageState(normalized);
    localStorage.setItem('vayunet_language', normalized);
    i18n.changeLanguage(normalized);
    document.documentElement.lang = normalized;
  }, []);

  // Update text size
  const setTextSize = useCallback((size) => {
    setTextSizeState(size);
    localStorage.setItem('vayunet_text_size', size);
    document.documentElement.setAttribute('data-vayunet-text-size', size);
  }, []);

  // Update high contrast
  const setHighContrast = useCallback((val) => {
    setHighContrastState(val);
    localStorage.setItem('vayunet_high_contrast', String(val));
    if (val) {
      document.documentElement.setAttribute('data-vayunet-contrast', 'high');
    } else {
      document.documentElement.removeAttribute('data-vayunet-contrast');
    }
  }, []);

  // Update reduce motion
  const setReduceMotion = useCallback((val) => {
    setReduceMotionState(val);
    localStorage.setItem('vayunet_reduce_motion', String(val));
    if (val) {
      document.documentElement.setAttribute('data-vayunet-motion', 'reduced');
    } else {
      document.documentElement.removeAttribute('data-vayunet-motion');
    }
  }, []);

  // Update read aloud toggle
  const setReadAloud = useCallback((val) => {
    setReadAloudState(val);
    localStorage.setItem('vayunet_read_aloud', String(val));
    if (!val && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Reset accessibility settings (does NOT reset selected language)
  const resetAccessibility = useCallback(() => {
    setTextSize('normal');
    setHighContrast(false);
    setReduceMotion(false);
    setReadAloud(false);
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    showA11yToast('Accessibility settings reset to default.');
  }, [setTextSize, setHighContrast, setReduceMotion, setReadAloud, showA11yToast]);

  // Read aloud speaker function using SpeechSynthesis
  const speakContent = useCallback((text) => {
    if (!('speechSynthesis' in window)) {
      showA11yToast('Voice speech synthesis is not supported on this browser.');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      if (!text || !text.trim()) return;

      const utterance = new SpeechSynthesisUtterance(text.trim());
      const langConfig = SUPPORTED_LANGUAGES.find(l => l.code === language);
      const voiceLang = langConfig ? langConfig.voiceLang : 'en-IN';
      utterance.lang = voiceLang;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Try to find a matching voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const matchingVoice = voices.find(v => v.lang && (v.lang === voiceLang || v.lang.startsWith(voiceLang.slice(0, 2))));
        if (matchingVoice) {
          utterance.voice = matchingVoice;
        }
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        showA11yToast('Speech synthesis encountered an audio error.');
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('SpeechSynthesis invocation failed:', err);
      setIsSpeaking(false);
      showA11yToast('Unable to start speech synthesis.');
    }
  }, [language, showA11yToast]);

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Initialize DOM attributes on first mount
  useEffect(() => {
    document.documentElement.setAttribute('data-vayunet-text-size', textSize);
    if (highContrast) {
      document.documentElement.setAttribute('data-vayunet-contrast', 'high');
    }
    if (reduceMotion) {
      document.documentElement.setAttribute('data-vayunet-motion', 'reduced');
    }
    document.documentElement.lang = language;
    i18n.changeLanguage(language);
  }, []);

  return (
    <AccessibilityContext.Provider
      value={{
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
        isSpeaking,
        speakContent,
        stopSpeaking,
        speechToast,
        showA11yToast,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
      {/* Non-blocking notification toast for speech synthesis */}
      {speechToast && (
        <div className="vayu-a11y-toast-banner" role="status" aria-live="polite">
          <span className="vayu-a11y-toast-icon">ℹ️</span>
          <span>{speechToast}</span>
        </div>
      )}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}
