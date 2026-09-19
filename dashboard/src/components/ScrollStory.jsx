import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useAccessibility } from '../context/AccessibilityContext';
import './ScrollStory.css';

gsap.registerPlugin(ScrollTrigger);

const STORY_TRANSLATIONS = {
  EN: [
    {
      id: 'observe',
      number: '01',
      label: 'OBSERVE',
      title: 'Satellite + Radar Intelligence',
      description: 'Fuse INSAT-3D/3DR observations, Doppler radar and environmental data to identify developing weather signals.',
      image: '/1.png',
      overlayLabel: 'INSAT-3D/3DR',
      overlayValue: 'LIVE'
    },
    {
      id: 'understand',
      number: '02',
      label: 'UNDERSTAND',
      title: 'Atmospheric Intelligence',
      description: 'Analyze moisture, instability, cloud evolution and terrain interactions driving severe weather.',
      image: '/2.png',
      overlayLabel: 'PRECIPITATION',
      overlayValue: '124 mm'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'NOWCAST',
      title: 'Hyper-Local Prediction',
      description: 'Generate actionable severe-weather forecasts with 2–6 hour lead time.',
      image: '/3.png',
      overlayLabel: 'ETA',
      overlayValue: '1h 45m'
    },
    {
      id: 'assess',
      number: '04',
      label: 'ASSESS',
      title: 'Risk & Impact',
      description: 'Estimate hazard intensity, affected areas, arrival time and model confidence.',
      image: '/4.png',
      overlayLabel: 'MODEL CONFIDENCE',
      overlayValue: '82%'
    },
    {
      id: 'act',
      number: '05',
      label: 'ACT',
      title: 'Public Warning',
      description: 'Turn validated weather intelligence into clear, timely and actionable warnings.',
      image: '/5.png',
      overlayLabel: 'ACTION REQUIRED',
      overlayValue: 'DISPATCH'
    }
  ],
  HI: [
    {
      id: 'observe',
      number: '01',
      label: 'अवलोकन',
      title: 'उपग्रह एवं रडार बुद्धिमत्ता',
      description: 'विकासशील मौसम संकेतों की पहचान के लिए इनसैट-3डी/3डीआर, डॉप्लर रडार और पर्यावरणीय डेटा का समन्वय।',
      image: '/1.png',
      overlayLabel: 'इनसैट-3डी/3डीआर',
      overlayValue: 'लाइव'
    },
    {
      id: 'understand',
      number: '02',
      label: 'विश्लेषण',
      title: 'वायुमंडलीय बुद्धिमत्ता',
      description: 'गंभीर मौसम को प्रेरित करने वाली नमी, संवहनीय अस्थिरता, बादलों के विकास और भू-भाग की अंतःक्रिया का विश्लेषण।',
      image: '/2.png',
      overlayLabel: 'वर्षा अनुमान',
      overlayValue: '124 मिमी'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'नाउकास्ट',
      title: 'अति-स्थानीय पूर्वानुमान',
      description: '2 से 6 घंटे के पूर्व-चेतावनी बफर के साथ त्वरित और सटीक गंभीर-मौसम पूर्वानुमान उत्पन्न करना।',
      image: '/3.png',
      overlayLabel: 'अनुमानित आगमन',
      overlayValue: '1घं 45मि'
    },
    {
      id: 'assess',
      number: '04',
      label: 'आकलन',
      title: 'जोखिम एवं प्रभाव',
      description: 'आपदा की तीव्रता, प्रभावित होने वाले क्षेत्रों, आगमन समय और मॉडल विश्वसनीयता का संपूर्ण आकलन।',
      image: '/4.png',
      overlayLabel: 'मॉडल विश्वसनीयता',
      overlayValue: '82%'
    },
    {
      id: 'act',
      number: '05',
      label: 'कार्रवाई',
      title: 'सार्वजनिक चेतावनी',
      description: 'सत्यापित मौसम बुद्धिमत्ता को स्पष्ट, समयबद्ध, बहुभाषी और जीवन-रक्षक चेतावनियों में परिवर्तित करना।',
      image: '/5.png',
      overlayLabel: 'कार्रवाई आवश्यक',
      overlayValue: 'अलर्ट प्रेषण'
    }
  ],
  BN: [
    {
      id: 'observe',
      number: '01',
      label: 'পর্যবেক্ষণ',
      title: 'উপগ্রহ ও রাডার বুদ্ধিমত্তা',
      description: 'আবহাওয়ার লক্ষণ দ্রুত শনাক্ত করতে ইনস্যাট-৩ডি/৩ডিআর এবং ডপলার রাডার ডেটা একত্রিত করা।',
      image: '/1.png',
      overlayLabel: 'ইনস্যাট-৩ডি/৩ডিআর',
      overlayValue: 'লাইভ'
    },
    {
      id: 'understand',
      number: '02',
      label: 'বিশ্লেষণ',
      title: 'বায়ুমণ্ডলীয় বুদ্ধিমত্তা',
      description: 'আর্দ্রতা, অস্থিরতা, মেঘের গঠন এবং ভূমিরূপের প্রভাব বিশ্লেষণ করে চরম আবহাওয়া চিহ্নিতকরণ।',
      image: '/2.png',
      overlayLabel: 'বৃষ্টিপাত',
      overlayValue: '১২৪ মিমি'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'নাউকাস্ট',
      title: 'হাইপার-লোকাল পূর্বাভাস',
      description: '২ থেকে ৬ ঘণ্টা আগে কার্যকর চরম আবহাওয়ার সঠিক পূর্বাভাস প্রদান।',
      image: '/3.png',
      overlayLabel: 'সম্ভাব্য সময়',
      overlayValue: '১ঘ ৪৭মি'
    },
    {
      id: 'assess',
      number: '04',
      label: 'মূল্যায়ন',
      title: 'ঝুঁকি ও প্রভাব',
      description: 'বিপদের তীব্রতা, ক্ষতিগ্রস্ত এলাকা, আঘাতের সময় এবং পূর্বাভাসের নির্ভুলতা নির্ধারণ।',
      image: '/4.png',
      overlayLabel: 'মডেল নির্ভরযোগ্যতা',
      overlayValue: '৮২%'
    },
    {
      id: 'act',
      number: '05',
      label: 'পদক্ষেপ',
      title: 'জনসাধারণের সতর্কতা',
      description: 'যাচাইকৃত আবহাওয়া তথ্যকে সুস্পষ্ট, সময়োপযোগী এবং জীবনরক্ষাকারী সতর্কতায় রূপান্তর।',
      image: '/5.png',
      overlayLabel: 'প্রয়োজনীয় পদক্ষেপ',
      overlayValue: 'সতর্কতা জারি'
    }
  ],
  MR: [
    {
      id: 'observe',
      number: '01',
      label: 'निरीक्षण',
      title: 'उपग्रह आणि रडार बुद्धिमत्ता',
      description: 'हवामान संकेतांचा वेध घेण्यासाठी इनसॅट-३डी/३डीआर, डॉपलर रडार आणि पर्यावरण डेटाचे संकलन.',
      image: '/1.png',
      overlayLabel: 'इनसॅट-३डी/३डीआर',
      overlayValue: 'थेट (लाइव्ह)'
    },
    {
      id: 'understand',
      number: '02',
      label: 'विश्लेषण',
      title: 'वातावरणीय बुद्धिमत्ता',
      description: 'हवेतील ओलावा, संवहनीय अस्थिरता, ढगांची निर्मिती आणि भूरचनेचा प्रभाव समजून घेणे.',
      image: '/2.png',
      overlayLabel: 'पर्जन्यमान',
      overlayValue: '१२४ मिमी'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'नाऊकास्ट',
      title: 'अति-स्थानिक अंदाज',
      description: '२ ते ६ तास अगोदर अतिवृष्टी व वादळाचा अचूक स्थानिक अंदाज तयार करणे.',
      image: '/3.png',
      overlayLabel: 'अपेक्षित वेळ',
      overlayValue: '१ता ४५मि'
    },
    {
      id: 'assess',
      number: '04',
      label: 'मूल्यांकन',
      title: 'धोका आणि परिणाम',
      description: 'आपत्तीची तीव्रता, प्रभावित क्षेत्रे, आगमन वेळ आणि मॉडेलच्या अचूकतेचे मोजमाप.',
      image: '/4.png',
      overlayLabel: 'मॉडेल अचूकता',
      overlayValue: '८२%'
    },
    {
      id: 'act',
      number: '05',
      label: 'कृती',
      title: 'सार्वजनिक इशारा',
      description: 'हवामान माहितीचे स्पष्ट, वेळेवर आणि जीवनरक्षक इशाऱ्यांमध्ये रूपांतर करणे.',
      image: '/5.png',
      overlayLabel: 'आवश्यक कृती',
      overlayValue: 'तातडीचा इशारा'
    }
  ],
  TA: [
    {
      id: 'observe',
      number: '01',
      label: 'கண்காணிப்பு',
      title: 'செயற்கைக்கோள் & ரேடார் நுண்ணறிவு',
      description: 'வானிலை மாற்றங்களை முன்கூட்டியே கண்டறிய இன்சாட்-3D/3DR மற்றும் டாப்ளர் ரேடார் தரவுகளை இணைத்தல்.',
      image: '/1.png',
      overlayLabel: 'இன்சாட்-3D/3DR',
      overlayValue: 'நேரலை'
    },
    {
      id: 'understand',
      number: '02',
      label: 'பகுப்பாய்வு',
      title: 'வளிமண்டல பகுப்பாய்வு',
      description: 'ஈரப்பதம், காற்று மண்டல உறுதியற்ற தன்மை மற்றும் மேக உருவாக்கத்தை விரிவாக ஆராய்தல்.',
      image: '/2.png',
      overlayLabel: 'மழைப்பொழிவு',
      overlayValue: '124 மிமீ'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'நவ்காஸ்ட்',
      title: 'துல்லிய உள்ளூர் முன்னறிவிப்பு',
      description: '2 முதல் 6 மணி நேரத்திற்கு முன்பே துல்லியமான தீவிர வானிலை எச்சரிக்கைகளை உருவாக்குதல்.',
      image: '/3.png',
      overlayLabel: 'வருகை நேரம்',
      overlayValue: '1ம 45நி'
    },
    {
      id: 'assess',
      number: '04',
      label: 'மதிப்பீடு',
      title: 'ஆபத்து மற்றும் தாக்கம்',
      description: 'பாதிப்பு தீவிரம், பாதிக்கப்படும் பகுதிகள் மற்றும் மாதிரியின் நம்பகத்தன்மையை மதிப்பிடுதல்.',
      image: '/4.png',
      overlayLabel: 'மாதிரி நம்பகத்தன்மை',
      overlayValue: '82%'
    },
    {
      id: 'act',
      number: '05',
      label: 'நடவடிக்கை',
      title: 'பொது எச்சரிக்கை',
      description: 'வானிலை நுண்ணறிவை தெளிவான, சரியான நேர மற்றும் உயிர்காக்கும் எச்சரிக்கைகளாக மாற்றுதல்.',
      image: '/5.png',
      overlayLabel: 'நடவடிக்கை தேவை',
      overlayValue: 'எச்சரிக்கை அனுப்பு'
    }
  ],
  TE: [
    {
      id: 'observe',
      number: '01',
      label: 'పరిశీలన',
      title: 'ఉపగ్రహ మరియు రాడార్ సమాచారం',
      description: 'వాతావరణ సంకేతాలను గుర్తించడానికి ఇన్సాట్-3D/3DR మరియు డాప్లర్ రాడార్ డేటాను అనుసంధానించడం.',
      image: '/1.png',
      overlayLabel: 'ఇన్సాట్-3D/3DR',
      overlayValue: 'లైవ్'
    },
    {
      id: 'understand',
      number: '02',
      label: 'విశ్లేషణ',
      title: 'వాతావరణ విశ్లేషణ',
      description: 'తేమ, అస్థిరత, మేఘాల పరిణామం మరియు తీవ్ర వాతావరణ కారకాల పరిశీలన.',
      image: '/2.png',
      overlayLabel: 'వర్షపాతం',
      overlayValue: '124 మిమీ'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'నౌకాస్ట్',
      title: 'హైపర్-లోకల్ అంచనా',
      description: '2 నుండి 6 గంటల ముందుగానే ఖచ్చితమైన తీవ్ర వాతావరణ ముందస్తు హెచ్చరికలు.',
      image: '/3.png',
      overlayLabel: 'చేరే సమయం',
      overlayValue: '1గం 45ని'
    },
    {
      id: 'assess',
      number: '04',
      label: 'అంచనా',
      title: 'ప్రమాదం & ప్రభావం',
      description: 'తీవ్రత, ప్రభావిత ప్రాంతాలు, రాక సమయం మరియు మోడల్ ఖచ్చితత్వాన్ని అంచనా వేయడం.',
      image: '/4.png',
      overlayLabel: 'మోడల్ విశ్వసనీయత',
      overlayValue: '82%'
    },
    {
      id: 'act',
      number: '05',
      label: 'చర్య',
      title: 'ప్రజా హెచ్చరిక',
      description: 'వాతావరణ సమాచారాన్ని స్పష్టమైన, సకాలంలో మరియు ప్రాణరక్షణ హెచ్చరికలుగా మార్చడం.',
      image: '/5.png',
      overlayLabel: 'చర్య అవసరం',
      overlayValue: 'హెచ్చరిక విడుదల'
    }
  ],
  GU: [
    {
      id: 'observe',
      number: '01',
      label: 'અવલોકન',
      title: 'ઉપગ્રહ અને રડાર ગુપ્તચર',
      description: 'હવામાનના સંકેતો ઓળખવા માટે ઇનસેટ-3D/3DR અને ડૉપ્લર રડાર ડેટાનું સંકલન.',
      image: '/1.png',
      overlayLabel: 'ઇનસેટ-3D/3DR',
      overlayValue: 'લાઇવ'
    },
    {
      id: 'understand',
      number: '02',
      label: 'સમજણ',
      title: 'વાતાવરણીય વિશ્લેષણ',
      description: 'ભેજ, અસ્થિરતા, વાદળોનો વિકાસ અને ભૂ-ભાગ વચ્ચેની પ્રક્રિયાઓનું વિશ્લેષણ.',
      image: '/2.png',
      overlayLabel: 'વરસાદ',
      overlayValue: '૧૨૪ મીમી'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'નાઉકાસ્ટ',
      title: 'સ્થાનિક ચોક્કસ આગાહી',
      description: '૨ થી ૬ કલાક પહેલાં તાત્કાલિક અને સચોટ ગંભીર હવામાન આગાહી.',
      image: '/3.png',
      overlayLabel: 'આગમન સમય',
      overlayValue: '૧ક ૪૫મિ'
    },
    {
      id: 'assess',
      number: '04',
      label: 'મૂલ્યાંકન',
      title: 'જોખમ અને અસર',
      description: 'જોખમની તીવ્રતા, અસરગ્રસ્ત વિસ્તારો, આગમન સમય અને મોડેલ વિશ્વસનીયતાનો અંદાજ.',
      image: '/4.png',
      overlayLabel: 'મોડેલ વિશ્વસનીયતા',
      overlayValue: '૮૨%'
    },
    {
      id: 'act',
      number: '05',
      label: 'પગલાં',
      title: 'જાહેર ચેતવણી',
      description: 'હવામાન માહિતીને સ્પષ્ટ, સમયસર અને જીવનરક્ષક ચેતવણીઓમાં રૂપાંતરિત કરવી.',
      image: '/5.png',
      overlayLabel: 'પગલું જરૂરી',
      overlayValue: 'ચેતવણી જારી'
    }
  ],
  KN: [
    {
      id: 'observe',
      number: '01',
      label: 'ವೀಕ್ಷಣೆ',
      title: 'ಉಪಗ್ರಹ ಮತ್ತು ರೇಡಾರ್ ಬುದ್ಧಿಮತ್ತೆ',
      description: 'ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಗಾಗಿ ಇನ್ಸಾಟ್-3D/3DR ಮತ್ತು ಡಾಪ್ಲರ್ ರೇಡಾರ್ ಡೇಟಾ ಸಂಯೋಜನೆ.',
      image: '/1.png',
      overlayLabel: 'ಇನ್ಸಾಟ್-3D/3DR',
      overlayValue: 'ಲೈವ್'
    },
    {
      id: 'understand',
      number: '02',
      label: 'ವಿಶ್ಲೇಷಣೆ',
      title: 'ವಾತಾವರಣದ ಒಳನೋಟ',
      description: 'ತೇವಾಂಶ, ಅಸ್ಥಿರತೆ, ಮೋಡಗಳ ರಚನೆ ಮತ್ತು ಭೂಪ್ರದೇಶದ ಪ್ರಭಾವದ ನಿಖರ ಅಧ್ಯಯನ.',
      image: '/2.png',
      overlayLabel: 'ಮಳೆ ಪ್ರಮಾಣ',
      overlayValue: '124 ಮಿಮೀ'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'ನೌಕಾಸ್ಟ್',
      title: 'ಸ್ಥಳೀಯ ನಿಖರ ಮುನ್ಸೂಚನೆ',
      description: '2 ರಿಂದ 6 ಗಂಟೆಗಳ ಮುಂಚಿತವಾಗಿ ತೀವ್ರ ಹವಾಮಾನ ಎಚ್ಚರಿಕೆ ಸೃಷ್ಟಿ.',
      image: '/3.png',
      overlayLabel: 'ನಿರೀಕ್ಷಿತ ಆಗಮನ',
      overlayValue: '1ಗಂ 45ನಿ'
    },
    {
      id: 'assess',
      number: '04',
      label: 'ಮೌಲ್ಯಮಾಪನ',
      title: 'ಅಪಾಯ ಮತ್ತು ಪರಿಣಾಮ',
      description: 'ತೀವ್ರತೆ, ಬಾಧಿತ ಪ್ರದೇಶಗಳು ಮತ್ತು ಮಾದರಿಯ ನಿಖರತೆಯ ಪೂರ್ಣ ಮೌಲ್ಯಮಾಪನ.',
      image: '/4.png',
      overlayLabel: 'ಮಾದರಿ ವಿಶ್ವಾಸಾರ್ಹತೆ',
      overlayValue: '82%'
    },
    {
      id: 'act',
      number: '05',
      label: 'ಕ್ರಮ',
      title: 'ಸಾರ್ವಜನಿಕ ಎಚ್ಚರಿಕೆ',
      description: 'ಹವಾಮಾನ ಮಾಹಿತಿಯನ್ನು ಸ್ಪಷ್ಟ, ಸಮಯೋಚಿತ ಮತ್ತು ಜೀವ ರಕ್ಷಕ ಎಚ್ಚರಿಕೆಗಳಾಗಿ ಪರಿವರ್ತಿಸುವುದು.',
      image: '/5.png',
      overlayLabel: 'ಕ್ರಮ ಅಗತ್ಯ',
      overlayValue: 'ರವಾನೆ'
    }
  ],
  ML: [
    {
      id: 'observe',
      number: '01',
      label: 'നിരീക്ഷണം',
      title: 'ഉപഗ്രഹ-റഡാർ ഇന്റലിജൻസ്',
      description: 'കാലാവസ്ഥാ മാറ്റങ്ങൾ മുൻകൂട്ടി അറിയാൻ ഇൻസാറ്റ്-3D/3DR, ഡോപ്ലർ റഡാർ ഡാറ്റ സംയോജിപ്പിക്കുന്നു.',
      image: '/1.png',
      overlayLabel: 'ഇൻസാറ്റ്-3D/3DR',
      overlayValue: 'തത്സമയം'
    },
    {
      id: 'understand',
      number: '02',
      label: 'വിശകലനം',
      title: 'അന്തരീക്ഷ വിശകലനം',
      description: 'ഈർപ്പം, അസ്ഥിരത, മേഘ രൂപീകരണം എന്നിവ ശാസ്ത്രീയമായി വിശകലനം ചെയ്യുന്നു.',
      image: '/2.png',
      overlayLabel: 'മഴയുടെ അളവ്',
      overlayValue: '124 മി.മീ'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'നൗകാസ്റ്റ്',
      title: 'പ്രാദേശിക പ്രവചനം',
      description: '2 മുതൽ 6 മണിക്കൂർ മുമ്പ് അതീവ ജാഗ്രതാ കാലാവസ്ഥാ മുന്നറിയിപ്പ് നൽകുന്നു.',
      image: '/3.png',
      overlayLabel: 'പ്രതീക്ഷിത സമയം',
      overlayValue: '1മ 45മി'
    },
    {
      id: 'assess',
      number: '04',
      label: 'വിലയിരുത്തൽ',
      title: 'അപകടസാധ്യതയും പ്രത്യാഘാതവും',
      description: 'തീവ്രത, ബാധിത പ്രദേശങ്ങൾ, എത്തുന്ന സമയം എന്നിവ കൃത്യമായി കണക്കാക്കുന്നു.',
      image: '/4.png',
      overlayLabel: 'മോഡൽ കൃത്യത',
      overlayValue: '82%'
    },
    {
      id: 'act',
      number: '05',
      label: 'നടപടി',
      title: 'പൊതു മുന്നറിയിപ്പ്',
      description: 'കാലാവസ്ഥാ വിവരങ്ങൾ വ്യക്തവും സമയബന്ധിതവുമായ മുന്നറിയിപ്പുകളാക്കി മാറ്റുന്നു.',
      image: '/5.png',
      overlayLabel: 'നടപടി ആവശ്യം',
      overlayValue: 'മുന്നറിയിപ്പ് നൽകുക'
    }
  ],
  PA: [
    {
      id: 'observe',
      number: '01',
      label: 'ਨਿਗਰਾਨੀ',
      title: 'ਸੈਟੇਲਾਈਟ ਅਤੇ ਰਾਡਾਰ ਜਾਣਕਾਰੀ',
      description: 'ਮੌਸਮੀ ਤਬਦੀਲੀਆਂ ਦੀ ਪਛਾਣ ਕਰਨ ਲਈ ਇਨਸੈਟ-3D/3DR ਅਤੇ ਡੌਪਲਰ ਰਾਡਾਰ ਡੇਟਾ ਦਾ ਸੁਮੇਲ।',
      image: '/1.png',
      overlayLabel: 'ਇਨਸੈਟ-3D/3DR',
      overlayValue: 'ਲਾਈਵ'
    },
    {
      id: 'understand',
      number: '02',
      label: 'ਸਮਝ',
      title: 'ਵਾਯੂਮੰਡਲੀ ਵਿਸ਼ਲੇਸ਼ਣ',
      description: 'ਨਮੀ, ਅਸਥਿਰਤਾ ਅਤੇ ਬੱਦਲਾਂ ਦੇ ਵਿਕਾਸ ਦਾ ਗੰਭੀਰ ਵਿਗਿਆਨਕ ਅਧਿਐਨ।',
      image: '/2.png',
      overlayLabel: 'ਮੀਂਹ ਦਾ ਅੰਦਾਜ਼ਾ',
      overlayValue: '124 ਮਿ.ਮੀ.'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'ਨਾਓਕਾਸਟ',
      title: 'ਸਥਾਨਕ ਸਹੀ ਭਵਿੱਖਬਾਣੀ',
      description: '2 ਤੋਂ 6 ਘੰਟੇ ਪਹਿਲਾਂ ਗੰਭੀਰ ਮੌਸਮ ਦੀ ਸਹੀ ਤੇ ਸਮੇਂ ਸਿਰ ਜਾਣਕਾਰੀ।',
      image: '/3.png',
      overlayLabel: 'ਸੰਭਾਵਿਤ ਸਮਾਂ',
      overlayValue: '1ਘੰ 45ਮਿੰ'
    },
    {
      id: 'assess',
      number: '04',
      label: 'ਮੁਲਾਂਕਣ',
      title: 'ਖਤਰਾ ਅਤੇ ਪ੍ਰਭਾਵ',
      description: 'ਖ਼ਤਰੇ ਦੀ ਤੀਬਰਤਾ, ਪ੍ਰਭਾਵਿਤ ਇਲਾਕੇ ਅਤੇ ਮਾਡਲ ਦੇ ਭਰੋਸੇ ਦਾ ਮੁਲਾਂਕਣ।',
      image: '/4.png',
      overlayLabel: 'ਮਾਡਲ ਭਰੋਸੇਯੋਗਤਾ',
      overlayValue: '82%'
    },
    {
      id: 'act',
      number: '05',
      label: 'ਕਾਰਵਾਈ',
      title: 'ਜਨਤਕ ਚਿਤਾਵਨੀ',
      description: 'ਮੌਸਮ ਦੀ ਜਾਣਕਾਰੀ ਨੂੰ ਸਪਸ਼ਟ, ਸਮੇਂ ਸਿਰ ਅਤੇ ਜੀਵਨ ਬਚਾਊ ਚਿਤਾਵਨੀਆਂ ਵਿੱਚ ਬਦਲਣਾ।',
      image: '/5.png',
      overlayLabel: 'ਲੋੜੀਂਦੀ ਕਾਰਵਾਈ',
      overlayValue: 'ਅਲਰਟ ਜਾਰੀ'
    }
  ],
  OR: [
    {
      id: 'observe',
      number: '01',
      label: 'ନିରୀକ୍ଷଣ',
      title: 'ଉପଗ୍ରହ ଓ ରାଡାର୍ ଗୁଇନ୍ଦା ତଥ୍ୟ',
      description: 'ପାଣିପାଗ ସଙ୍କେତ ଚିହ୍ନଟ କରିବାକୁ ଇନସାଟ୍-୩D/୩DR ଏବଂ ଡପଲର୍ ରାଡାର୍ ଡାଟା ସଂଯୋଗ।',
      image: '/1.png',
      overlayLabel: 'ଇନସାଟ୍-୩D/୩DR',
      overlayValue: 'ଲାଇଭ୍'
    },
    {
      id: 'understand',
      number: '02',
      label: 'ବିଶ୍ଳେଷଣ',
      title: 'ବାୟୁମଣ୍ଡଳୀୟ ବିଶ୍ଳେଷଣ',
      description: 'ଆର୍ଦ୍ରତା, ଅସ୍ଥିରତା, ମେଘ ବିକାଶ ଏବଂ ଭୂ-ପ୍ରକୃତିର ପ୍ରଭାବ ବିଶ୍ଳେଷଣ।',
      image: '/2.png',
      overlayLabel: 'ବୃଷ୍ଟିପାତ',
      overlayValue: '୧୨୪ ମିମି'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'ନାଓକାଷ୍ଟ',
      title: 'ଅତି-ସ୍ଥାନୀୟ ପୂର୍ବାନୁମାନ',
      description: '୨ ରୁ ୬ ଘଣ୍ଟା ପୂର୍ବରୁ କାର୍ଯ୍ୟକ୍ଷମ ବିପଦପୂର୍ଣ୍ଣ ପାଣିପାଗ ସୂଚନା ପ୍ରଦାନ।',
      image: '/3.png',
      overlayLabel: 'ଆଗମନ ସମୟ',
      overlayValue: '୧ଘ ୪୫ମି'
    },
    {
      id: 'assess',
      number: '04',
      label: 'ଆକଳନ',
      title: 'ବିପଦ ଓ ପ୍ରଭାବ',
      description: 'ବିପଦ ତୀବ୍ରତା, ପ୍ରଭାବିତ ଅଞ୍ଚଳ ଏବଂ ମଡେଲ ବିଶ୍ୱସନୀୟତାର ସମ୍ପୂର୍ଣ୍ଣ ଆକଳନ।',
      image: '/4.png',
      overlayLabel: 'ମଡେଲ୍ ବିଶ୍ୱାସନୀୟତା',
      overlayValue: '୮୨%'
    },
    {
      id: 'act',
      number: '05',
      label: 'ପଦକ୍ଷେପ',
      title: 'ସର୍ବସାଧାରଣ ଚେତାବନୀ',
      description: 'ପାଣିପାଗ ତଥ୍ୟକୁ ସ୍ପଷ୍ଟ, ଠିକ୍ ସମୟର ଏବଂ ଜୀବନ ରକ୍ଷାକାରୀ ଚେତାବନୀରେ ପରିଣତ କରିବା।',
      image: '/5.png',
      overlayLabel: 'ଆବଶ୍ୟକ କାର୍ଯ୍ୟାନୁଷ୍ଠାନ',
      overlayValue: 'ସତର୍କତା ପ୍ରେରଣ'
    }
  ],
  AS: [
    {
      id: 'observe',
      number: '01',
      label: 'পৰ্যবেক্ষণ',
      title: 'উপগ্ৰহ আৰু ৰাডাৰ বুদ্ধিমত্তা',
      description: 'বতৰৰ লক্ষণ চিনাক্ত কৰিবলৈ ইনচেট-৩ডি/৩ডিআৰ আৰু ডপলাৰ ৰাডাৰ তথ্যৰ সংমিশ্ৰণ।',
      image: '/1.png',
      overlayLabel: 'ইনচেট-৩ডি/৩ডিআৰ',
      overlayValue: 'লাইভ'
    },
    {
      id: 'understand',
      number: '02',
      label: 'বিশ্লেষণ',
      title: 'বায়ুমণ্ডলীয় বুদ্ধিমত্তা',
      description: 'আৰ্দ্ৰতা, অস্থিৰতা, মেঘৰ গঠন আৰু ভূ-প্ৰকৃতিৰ প্ৰভাৱৰ বিস্তৃত বিশ্লেষণ।',
      image: '/2.png',
      overlayLabel: 'বৰষুণৰ পৰিমাণ',
      overlayValue: '১২৪ মিমি'
    },
    {
      id: 'nowcast',
      number: '03',
      label: 'নাওকাষ্ট',
      title: 'অতি-স্থানীয় আগজাননী',
      description: '২ ৰ পৰা ৬ ঘণ্টা পূৰ্বে জৰুৰী জটিল বতৰৰ সঠিক আগজাননী প্ৰদান।',
      image: '/3.png',
      overlayLabel: 'সম্ভাব্য সময়',
      overlayValue: '১ঘ ৪৫মি'
    },
    {
      id: 'assess',
      number: '04',
      label: 'আকলন',
      title: 'বিপদ আৰু প্ৰভাৱ',
      description: 'বিপদৰ তীব্ৰতা, প্ৰভাৱিত অঞ্চল আৰু মডেলৰ বিশ্বাসযোগ্যতা নিৰ্ণয়।',
      image: '/4.png',
      overlayLabel: 'মডেল বিশ্বাসযোগ্যতা',
      overlayValue: '৮২%'
    },
    {
      id: 'act',
      number: '05',
      label: 'পদক্ষেপ',
      title: 'ৰাজহুৱা সতৰ্কবাণী',
      description: 'বতৰ তথ্যক স্পষ্ট, সময়োপযোগী আৰু জীৱনৰক্ষী সতৰ্কবাণীলৈ ৰূপান্তৰ কৰা।',
      image: '/5.png',
      overlayLabel: 'প্ৰয়োজনীয় পদক্ষেপ',
      overlayValue: 'সতৰ্কবাণী প্ৰেৰণ'
    }
  ]
};

export default function ScrollStory() {
  const { language } = useAccessibility();
  const langKey = (language || 'en').toUpperCase();
  const storyStates = STORY_TRANSLATIONS[langKey] || STORY_TRANSLATIONS.EN;

  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const textsRef = useRef([]);
  const dotsRef = useRef([]);
  const tlRef = useRef(null);

  useLayoutEffect(() => {
    const totalStates = storyStates.length;
    const getHeaderOffset = () => (window.innerWidth <= 768 ? 54 : 60);

    const ctx = gsap.context(() => {
      // 1. Initialize Visual States
      imagesRef.current.forEach((img, i) => {
        if (!img) return;
        if (i === 0) {
          gsap.set(img, { opacity: 1, scale: 1, zIndex: 10 });
        } else {
          gsap.set(img, { opacity: 0, scale: 1.04, zIndex: 1 });
        }
      });

      // 2. Initialize Text States
      textsRef.current.forEach((txt, i) => {
        if (!txt) return;
        if (i === 0) {
          gsap.set(txt, { opacity: 1, y: 0 });
        } else {
          gsap.set(txt, { opacity: 0, y: 14 });
        }
      });

      // Synchronize active dot to the current timeline step
      const updateActiveDot = (step) => {
        dotsRef.current.forEach((dot, idx) => {
          if (!dot) return;
          if (idx === step) {
            dot.classList.add('active');
          } else {
            dot.classList.remove('active');
          }
        });
      };

      // Create Master ScrollTrigger Timeline
      // Total timeline duration is 4.0 (4 transitions between 5 states) + 0.4 end hold
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: () => `top ${getHeaderOffset()}px`,
          end: () => `+=${window.innerHeight * 4}`,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          scrub: 0.5,
          onUpdate: () => {
            const currentTime = tl.time();
            // Transitions start at i + 0.50, midpoint is i + 0.75
            const currentStep = Math.min(
              totalStates - 1,
              Math.max(0, Math.floor(currentTime + 0.25))
            );
            updateActiveDot(currentStep);
          }
        }
      });

      tlRef.current = tl;

      // 3. Build step transitions
      // Step duration = 1.0
      // 0.0 - 0.50: Hold current step
      // 0.50 - 0.95: Cinematic transition
      // 0.95 - 1.0: Settle into next step
      for (let i = 0; i < totalStates - 1; i++) {
        const currentImg = imagesRef.current[i];
        const nextImg = imagesRef.current[i + 1];
        const currentTxt = textsRef.current[i];
        const nextTxt = textsRef.current[i + 1];

        const transitionStart = i + 0.50;
        const transitionDuration = 0.45;
        const textFadeOutDuration = 0.20;
        const textFadeInDuration = 0.25;

        // Image Transition: next image stacks on top, zooms smoothly from 1.04 to 1.0
        tl.set(nextImg, { zIndex: 10 + i + 1 }, transitionStart);

        tl.to(currentImg, {
          opacity: 0,
          scale: 1.02,
          duration: transitionDuration * 0.85,
          ease: 'power1.inOut'
        }, transitionStart);

        tl.fromTo(nextImg,
          { opacity: 0, scale: 1.04 },
          { opacity: 1, scale: 1.0, duration: transitionDuration, ease: 'power1.inOut' },
          transitionStart
        );

        // Text Transition: current fades up & out, next enters from down & fades in
        tl.to(currentTxt, {
          opacity: 0,
          y: -12,
          duration: textFadeOutDuration,
          ease: 'power1.in'
        }, transitionStart);

        tl.fromTo(nextTxt,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: textFadeInDuration, ease: 'power1.out' },
          transitionStart + textFadeOutDuration
        );

        // Timeline anchor
        tl.set({}, {}, i + 1);
      }

      // Buffer at the end of the last step before unpinning
      tl.to({}, { duration: 0.4 });

    }, containerRef);

    return () => ctx.revert();
  }, [langKey]);

  const handleDotClick = (targetIndex) => {
    const tl = tlRef.current;
    if (!tl || !tl.scrollTrigger) return;
    const st = tl.scrollTrigger;
    const totalStates = storyStates.length;
    // Map index 0..4 to scroll position
    const targetScroll = st.start + (targetIndex / (totalStates - 1)) * (st.end - st.start);
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  };

  return (
    <section className="scroll-story-wrapper" ref={containerRef} id="how-it-works">
      <div className="scroll-story-container">
        
        {/* LEFT VISUAL SIDE */}
        <div className="story-visual-side">
          <div className="story-visual-container">
            {storyStates.map((state, index) => (
              <div 
                key={`img-${langKey}-${state.id}`} 
                className="story-image-layer"
                ref={el => imagesRef.current[index] = el}
              >
                <img 
                  src={state.image} 
                  alt={state.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
                <div className="story-visual-overlay">
                  <span className="overlay-label">{state.overlayLabel}</span>
                  <span className="overlay-value">{state.overlayValue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT CONTENT SIDE */}
        <div className="story-content-side">
          <div className="story-text-container">
            {storyStates.map((state, index) => (
              <div 
                key={`txt-${langKey}-${state.id}`} 
                className="story-text-layer"
                ref={el => textsRef.current[index] = el}
              >
                <div className="story-step-number">{state.number} / 05</div>
                <div className="story-step-subtitle">{state.label}</div>
                <h3 className="story-step-title">{state.title}</h3>
                <p className="story-step-desc">{state.description}</p>
              </div>
            ))}
          </div>

          <div className="story-progress-indicator" role="tablist" aria-label="Operational Workflow Steps">
            {storyStates.map((state, index) => (
              <React.Fragment key={`dot-${langKey}-${state.id}`}>
                <button 
                  type="button"
                  className={`progress-dot ${index === 0 ? 'active' : ''}`} 
                  ref={el => dotsRef.current[index] = el}
                  onClick={() => handleDotClick(index)}
                  aria-label={`Jump to Step ${state.number}: ${state.title}`}
                />
                {index < storyStates.length - 1 && (
                  <div className="progress-line" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}
