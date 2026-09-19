import React from 'react';
import { TIME_STEPS } from '../mockData';

export default function TimeSlider({ stepIdx, setStepIdx, timeSteps, isPlaying, setIsPlaying, currentData }) {
  const leadLabel = timeSteps[stepIdx]?.leadTime || 'T+2h';
  const timeLabel = timeSteps[stepIdx]?.label || '--:--';

  return (
    <div className="time-scrubber">
      {/* Lead time display */}
      <div className="scrubber-time-display">
        <span className="scrubber-lead">{leadLabel}</span>
        <div>
          <div className="scrubber-label">LEAD</div>
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {timeLabel}
          </div>
        </div>
      </div>

      {/* Playback controls */}
      <div className="scrubber-controls">
        <button
          className="scrubber-btn"
          onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}
          title="Step back"
        >
          ◀
        </button>
        <button
          className={`scrubber-btn play`}
          onClick={() => setIsPlaying(p => !p)}
          title={isPlaying ? 'Pause' : 'Play forecast sequence'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="scrubber-btn"
          onClick={() => setStepIdx(Math.min(timeSteps.length - 1, stepIdx + 1))}
          title="Step forward"
        >
          ▶
        </button>
      </div>

      {/* Step indicators */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="scrubber-steps">
          {timeSteps.map((_, i) => (
            <div
              key={i}
              className={`scrubber-step ${i === stepIdx ? 'active' : i < stepIdx ? 'past' : ''}`}
              onClick={() => setStepIdx(i)}
              title={timeSteps[i]?.leadTime}
            />
          ))}
        </div>
        <div className="scrubber-step-labels">
          {timeSteps.map((step, i) => (
            <div key={i} className="step-label">{step.leadTime}</div>
          ))}
        </div>
      </div>

      {/* Live pill */}
      <div className="live-pill">
        <span className="live-dot" />
        LIVE
      </div>
    </div>
  );
}
