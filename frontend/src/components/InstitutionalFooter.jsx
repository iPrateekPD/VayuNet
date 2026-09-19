import React from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import './InstitutionalFooter.css';

const FOOTER_TRANSLATIONS = {
  EN: {
    inst: 'Ministry of Earth Sciences | NCMRWF',
    help: 'Help',
    feedback: 'Feedback',
    terms: 'Terms',
    sysOperational: 'All Systems Operational',
    mottoMuted: 'From Data to Action',
    mottoBold: 'For a Safer Tomorrow',
  },
  HI: {
    inst: 'पृथ्वी विज्ञान मंत्रालय | एनसीएमआरडब्ल्यूएफ',
    help: 'सहायता',
    feedback: 'प्रतिक्रिया',
    terms: 'शर्तें',
    sysOperational: 'सभी प्रणालियाँ सामान्य',
    mottoMuted: 'डेटा से त्वरित कार्यवाही',
    mottoBold: 'सुरक्षित कल के लिए',
  },
  BN: {
    inst: 'ভূবিজ্ঞান মন্ত্ৰালয় | এনসিএমআরডব্লিউএফ',
    help: 'সাহায্য',
    feedback: 'প্রতিক্রিয়া',
    terms: 'শর্তাবলী',
    sysOperational: 'সমস্ত সিস্টেম সক্রিয়',
    mottoMuted: 'ডেটা থেকে দ্রুত পদক্ষেপ',
    mottoBold: 'একটি নিরাপদ আগামীর জন্য',
  },
  MR: {
    inst: 'भूविज्ञान मंत्रालय | एनसीएमआरडब्ल्यूएफ',
    help: 'मदत',
    feedback: 'अभिप्राय',
    terms: 'अटी व शर्ती',
    sysOperational: 'सर्व प्रणाली कार्यरत',
    mottoMuted: 'डेटा ते थेट कृती',
    mottoBold: 'सुरक्षित भविष्यासाठी',
  },
  TA: {
    inst: 'புவி அறிவியல் அமைச்சகம் | NCMRWF',
    help: 'உதவி',
    feedback: 'கருத்து',
    terms: 'விதிமுறைகள்',
    sysOperational: 'அனைத்து அமைப்புகளும் சீராக இயங்குகின்றன',
    mottoMuted: 'தரவிலிருந்து உடனடி நடவடிக்கை',
    mottoBold: 'பாதுகாப்பான எதிர்காலத்திற்காக',
  },
  TE: {
    inst: 'భూ విజ్ఞాన మంత్రిత్వ శాఖ | NCMRWF',
    help: 'సహాయం',
    feedback: 'అభిప్రాయం',
    terms: 'నిబంధనలు',
    sysOperational: 'అన్ని వ్యవస్థలు సాధారణం',
    mottoMuted: 'డేటా నుండి తక్షణ చర్య',
    mottoBold: 'సురక్షిత రేపటి కోసం',
  },
  GU: {
    inst: 'પૃથ્વી વિજ્ઞાન મંત્રાલય | NCMRWF',
    help: 'સહાય',
    feedback: 'પ્રતિસાદ',
    terms: 'શરતો',
    sysOperational: 'તમામ સિસ્ટમ્સ કાર્યરત',
    mottoMuted: 'ડેટાથી તાત્કાલિક પગલાં',
    mottoBold: 'સુરક્ષિત આવતીકાલ માટે',
  },
  KN: {
    inst: 'ಭೂ ವಿಜ್ಞಾನ ಸಚಿವಾಲಯ | NCMRWF',
    help: 'ಸಹಾಯ',
    feedback: 'ಪ್ರತಿಕ್ರಿಯೆ',
    terms: 'ನಿಯಮಗಳು',
    sysOperational: 'ಎಲ್ಲಾ ವ್ಯವಸ್ಥೆಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ',
    mottoMuted: 'ಡೇಟಾದಿಂದ ತ್ವರಿತ ಕ್ರಮ',
    mottoBold: 'ಸುರಕ್ಷಿತ ನಾಳೆಗಾಗಿ',
  },
  ML: {
    inst: 'ഭൗമശാസ്ത്ര മന്ത്രാലയം | NCMRWF',
    help: 'സഹായം',
    feedback: 'അഭിപ്രായം',
    terms: 'വ്യവസ്ഥകൾ',
    sysOperational: 'എല്ലാ സംവിധാനങ്ങളും സജീവം',
    mottoMuted: 'ഡാറ്റയിൽ നിന്ന് നേരിട്ടുള്ള നടപടി',
    mottoBold: 'സുരക്ഷിതമായ നാളേയ്ക്കായി',
  },
  PA: {
    inst: 'ਧਰਤੀ ਵਿਗਿਆਨ ਮੰਤਰਾਲਾ | NCMRWF',
    help: 'ਮਦਦ',
    feedback: 'ਫੀਡਬੈਕ',
    terms: 'ਸ਼ਰਤਾਂ',
    sysOperational: 'ਸਾਰੇ ਸਿਸਟਮ ਕਿਰਿਆਸ਼ੀਲ',
    mottoMuted: 'ਡਾਟਾ ਤੋਂ ਤੁਰੰਤ ਕਾਰਵਾਈ',
    mottoBold: 'ਇੱਕ ਸੁਰੱਖਿਅਤ ਭਲਕ ਲਈ',
  },
  OR: {
    inst: 'ପୃଥିବୀ ବିଜ୍ଞାନ ମନ୍ତ୍ରଣାଳୟ | NCMRWF',
    help: 'ସାହାଯ୍ୟ',
    feedback: 'ମତାମତ',
    terms: 'ନିୟମାବଳୀ',
    sysOperational: 'ସମସ୍ତ ପ୍ରଣାଳୀ କାର୍ଯ୍ୟକ୍ଷମ',
    mottoMuted: 'ତଥ୍ୟରୁ ତ୍ୱରିତ ପଦକ୍ଷେପ',
    mottoBold: 'ଏକ ସୁରକ୍ଷିତ ଆଗାମୀ ପାଇଁ',
  },
  AS: {
    inst: 'পৃথিৱী বিজ্ঞান মন্ত্ৰালয় | NCMRWF',
    help: 'সহায়',
    feedback: 'মতামত',
    terms: 'চৰ্তাৱলী',
    sysOperational: 'সকলো প্ৰণালী সক্ৰিয়',
    mottoMuted: 'তথ্যৰ পৰা প্ৰত্যক্ষ পদক্ষেপ',
    mottoBold: 'এক সুৰক্ষিত কাইলৈৰ বাবে',
  }
};

export default function InstitutionalFooter() {
  const { language } = useAccessibility();
  const langKey = (language || 'en').toUpperCase();
  const t = FOOTER_TRANSLATIONS[langKey] || FOOTER_TRANSLATIONS.EN;

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
            <span>{t.inst}</span>
          </div>
        </div>

        <div className="ana-footer-center">
          <a href="#/help" className="ana-footer-link">{t.help}</a>
          <span className="ana-footer-dot">•</span>
          <a href="#/feedback" className="ana-footer-link">{t.feedback}</a>
          <span className="ana-footer-dot">•</span>
          <a href="#/terms" className="ana-footer-link">{t.terms}</a>
          <span className="ana-footer-dot">•</span>
          <span className="ana-footer-sys-badge">
            <span className="ana-footer-sys-dot" />
            {t.sysOperational}
          </span>
        </div>

        <div className="ana-footer-right">
          <span className="ana-footer-motto-muted">{t.mottoMuted}</span>
          <span className="ana-footer-motto-bold">{t.mottoBold}</span>
        </div>
      </div>
    </footer>
  );
}
