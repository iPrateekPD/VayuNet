import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import './InstitutionalFooter.css';

export default function InstitutionalFooter() {
  const { language } = useAccessibility();
  const isHi = (language || '').toLowerCase().startsWith('hi');

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
            <span>{isHi ? 'पृथ्वी विज्ञान मंत्रालय | एनसीएमआरडब्ल्यूएफ' : 'Ministry of Earth Sciences | NCMRWF'}</span>
          </div>
        </div>

        <div className="ana-footer-center">
          <a href="#/help" className="ana-footer-link">{isHi ? 'सहायता' : 'Help'}</a>
          <span className="ana-footer-dot">•</span>
          <a href="#/feedback" className="ana-footer-link">{isHi ? 'प्रतिक्रिया' : 'Feedback'}</a>
          <span className="ana-footer-dot">•</span>
          <a href="#/terms" className="ana-footer-link">{isHi ? 'शर्तें' : 'Terms'}</a>
          <span className="ana-footer-dot">•</span>
          <span className="ana-footer-sys-badge">
            <span className="ana-footer-sys-dot" />
            {isHi ? 'सभी प्रणालियाँ सामान्य' : 'All Systems Operational'}
          </span>
        </div>

        <div className="ana-footer-right">
          <span className="ana-footer-motto-muted">{isHi ? 'डेटा से त्वरित कार्यवाही' : 'From Data to Action'}</span>
          <span className="ana-footer-motto-bold">{isHi ? 'सुरक्षित कल के लिए' : 'For a Safer Tomorrow'}</span>
        </div>
      </div>
    </footer>
  );
}
