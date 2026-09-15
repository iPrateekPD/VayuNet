import React from 'react';
import './DayNightToggle.css';

export default function DayNightToggle({ isDark, onToggle }) {
  return (
    <button
      type="button"
      className={`day-night-toggle ${isDark ? 'is-dark' : 'is-light'}`}
      onClick={onToggle}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {/* Sky Background Track */}
      <div className="dnt-track">
        {/* Clouds for Day Mode */}
        <div className="dnt-clouds-wrap" aria-hidden="true">
          <div className="dnt-cloud dnt-cloud-1" />
          <div className="dnt-cloud dnt-cloud-2" />
          <div className="dnt-cloud dnt-cloud-3" />
        </div>

        {/* Stars for Night Mode */}
        <div className="dnt-stars-wrap" aria-hidden="true">
          <span className="dnt-star dnt-star-1" />
          <span className="dnt-star dnt-star-2" />
          <span className="dnt-star dnt-star-3" />
          <span className="dnt-star dnt-star-4" />
          <span className="dnt-star dnt-star-5" />
          <span className="dnt-star dnt-star-6" />
          <span className="dnt-star dnt-star-7" />
          <span className="dnt-star dnt-star-8" />
        </div>

        {/* Sliding Celestial Disc (Moon in Dark Mode / Sun in Light Mode) */}
        <div className="dnt-thumb">
          {/* Moon surface details (craters) */}
          <div className="dnt-moon-craters">
            <span className="dnt-crater dnt-crater-1" />
            <span className="dnt-crater dnt-crater-2" />
            <span className="dnt-crater dnt-crater-3" />
            <span className="dnt-crater dnt-crater-4" />
          </div>

          {/* Sun inner glow */}
          <div className="dnt-sun-glow" />
        </div>
      </div>
    </button>
  );
}
