import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function ReadAloudButton({ 
  text, 
  lang,
  label = 'Read alert aloud with Bhashini voice', 
  className = '',
  forceShow = false 
}) {
  const { readAloud, isSpeaking, bhashiniActive, speakContent, stopSpeaking } = useAccessibility();

  if ((!readAloud && !forceShow) || !text) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakContent(text, lang);
    }
  };

  return (
    <button
      type="button"
      className={`vayu-speaker-btn ${isSpeaking ? 'speaking' : ''} ${bhashiniActive && isSpeaking ? 'bhashini-live' : ''} ${className}`}
      onClick={handleClick}
      title={isSpeaking ? 'Stop broadcast' : label}
      aria-label={isSpeaking ? 'Stop broadcast' : label}
    >
      {isSpeaking ? '⏹' : '🔊'}
    </button>
  );
}
