import React from 'react';
import './InstitutionalFooter.css';

export default function InstitutionalFooter() {
  return (
    <footer className="ana-clean-footer">
      <div className="ana-footer-inner">
        <div className="ana-footer-left">
          <div className="ana-footer-brand">
            <span className="ana-footer-logo">VAYUNET</span>
          </div>
          <div className="ana-footer-divider" />
          <div className="ana-footer-inst">
            <img 
              src="/emblem-india.svg" 
              alt="Government of India" 
              className="ana-footer-emblem" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <span>Ministry of Earth Sciences | NCMRWF</span>
          </div>
        </div>

        <div className="ana-footer-center">
          <a href="#/help" className="ana-footer-link">Help</a>
          <span className="ana-footer-dot">•</span>
          <a href="#/feedback" className="ana-footer-link">Feedback</a>
          <span className="ana-footer-dot">•</span>
          <a href="#/terms" className="ana-footer-link">Terms</a>
          <span className="ana-footer-dot">•</span>
          <span className="ana-footer-sys-badge">
            <span className="ana-footer-sys-dot" />
            All Systems Operational
          </span>
        </div>

        <div className="ana-footer-right">
          <span className="ana-footer-motto-muted">From Data to Action</span>
          <span className="ana-footer-motto-bold">For a Safer Tomorrow</span>
        </div>
      </div>
    </footer>
  );
}
