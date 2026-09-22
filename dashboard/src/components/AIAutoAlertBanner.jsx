import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './AIAutoAlertBanner.css';

export default function AIAutoAlertBanner({ onClose, onViewInNowcast }) {
  return (
    <div className="tac-global-alert-wrap">
      <div className="tac-global-alert-banner">
        <div className="tac-global-alert-head">
          <div className="tac-global-alert-icon">
            <AlertTriangle size={24} />
          </div>
          <div className="tac-global-alert-title">
            <span className="tac-global-alert-title-main">CRITICAL: AI Auto-Detection Triggered</span>
            <span className="tac-global-alert-title-sub">Rapid Escalation Detected — Action Recommended</span>
          </div>
        </div>
        
        <div className="tac-global-alert-content">
          <div className="tac-global-alert-metric">
            <span>Hazard Type</span>
            <span>Flash Flood & Cloudburst</span>
          </div>
          <div className="tac-global-alert-metric">
            <span>Location</span>
            <span>Chamoli, Uttarakhand</span>
          </div>
          <div className="tac-global-alert-metric">
            <span>Model Confidence</span>
            <span style={{ color: '#ef4444' }}>94% (High Risk)</span>
          </div>
          <div className="tac-global-alert-metric">
            <span>Predicted Peak</span>
            <span>T+ 45 mins</span>
          </div>
        </div>

        <div className="tac-global-alert-actions">
          <button className="tac-global-alert-btn dismiss" onClick={onClose}>
            Acknowledge
          </button>
          <button className="tac-global-alert-btn view" onClick={onViewInNowcast}>
            View in Nowcast →
          </button>
        </div>
      </div>
    </div>
  );
}
