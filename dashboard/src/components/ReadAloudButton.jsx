import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';

export default function ReadAloudButton({ text, label = 'Read alert aloud', className = '' }) {
  const { readAloud, isSpeaking, speakContent, stopSpeaking } = useAccessibility();

  if (!readAloud || !text) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    if (isSpeaking) {
      stopSpeaking();
    } else {
      speakContent(text);
    }
  };

  return (
    <button
      type="button"
      className={`vayu-speaker-btn ${isSpeaking ? 'speaking' : ''} ${className}`}
      onClick={handleClick}
      title={isSpeaking ? 'Stop reading' : label}
      aria-label={isSpeaking ? 'Stop reading' : label}
    >
      {isSpeaking ? '⏹' : '🔊'}
    </button>
  );
}
