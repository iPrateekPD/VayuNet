import React, { useRef, useState, useEffect, useCallback } from 'react';
import gsap from 'gsap';
import { useAccessibility } from '../context/AccessibilityContext';

const FUSION_TRANSLATIONS = {
  EN: {
    eyebrow: 'CORE CAPABILITIES',
    titlePart1: 'Multi-source.',
    titlePart2: 'One intelligence layer.',
    desc: 'VAYUNET ingests three sovereign observation streams, harmonizing disparate cadences and projections onto a unified 4 km WGS84 spatiotemporal grid.',
    exploreAll: 'EXPLORE ALL',
    exploreStream: 'Explore Stream →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'MOSDAC / ISRO',
        title: 'INSAT-3D / 3DR',
        category: 'SATELLITE OBSERVATIONS',
        quickStat: 'Cadence: 15 – 30 min · 4 km WGS84',
        desc: 'Geostationary multi-spectral radiances delivering rapid Cloud Top Temperature (CTT) cooling rates, Water Vapor (6.7 µm) moisture pooling, and Thermal Infrared brightness temperatures.',
        img: '/satellite_insat.jpg',
        chipTag: 'GEOSTATIONARY 4 KM',
        specs: [
          { label: 'Temporal Cadence', value: '15 – 30 min' },
          { label: 'Primary Channels', value: 'WV 6.7 µm · TIR 10.8 µm' },
          { label: 'Resolution', value: '4 km (Sub-satellite)' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'IMDAA',
        category: 'ATMOSPHERIC REANALYSIS',
        quickStat: 'Assimilation: Hourly Regional Cycle',
        desc: 'High-resolution regional reanalysis providing foundational thermodynamic soundings: Convective Available Potential Energy (CAPE), Convective Inhibition (CIN), and 0–6 km deep-layer vertical wind shear.',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'REANALYSIS 12 KM',
        specs: [
          { label: 'Assimilation', value: 'Hourly Regional Cycle' },
          { label: 'Key Variables', value: 'CAPE · CIN · Shear · Moisture' },
          { label: 'Coverage', value: 'Pan-India & Indian Ocean' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ISRO / BHUVAN',
        title: 'CartoDEM',
        category: 'TERRAIN INTELLIGENCE',
        quickStat: 'Native Grid: 30 m Hydro-enforced',
        desc: 'Sub-meter accurate 30 m Digital Elevation Model enabling hydrological basin demarcation, slope steepness computation, aspect analysis, and D8 kinematic wave overland flow routing.',
        img: '/cartodem_elevation.jpg',
        chipTag: 'HYDRO-ENFORCED 30 M',
        specs: [
          { label: 'Native Grid', value: '30 m Hydro-enforced' },
          { label: 'Hydro Model', value: 'D8 Flow Accumulation' },
          { label: 'Basin Matrix', value: 'Pan-India River Basins' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  HI: {
    eyebrow: 'मुख्य क्षमताएँ',
    titlePart1: 'बहु-स्रोत डेटा।',
    titlePart2: 'एक एकीकृत बुद्धिमत्ता परत।',
    desc: 'वायुनेट तीन संप्रभु प्रेक्षण डेटा धाराओं को एकीकृत करता है, और विभिन्न आवृत्तियों एवं अनुमानों को 4 किमी ग्रिड पर संयोजित करता है।',
    exploreAll: 'सभी देखें',
    exploreStream: 'डेटा स्ट्रीम देखें →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'मोसडैक / इसरो',
        title: 'इनसैट-3डी / 3डीआर',
        category: 'उपग्रह प्रेक्षण',
        quickStat: 'आवृत्ति: 15 – 30 मिनट · 4 किमी WGS84',
        desc: 'भू-स्थिर मल्टी-स्पेक्ट्रल रेडिएंस जो क्लाउड टॉप तापमान में तीव्र गिरावट, 6.7 µm जलवाष्प नमी संचय और थर्मल इन्फ्रारेड ब्राइटनेस तापमान प्रदान करते हैं।',
        img: '/satellite_insat.jpg',
        chipTag: 'भू-स्थिर 4 किमी',
        specs: [
          { label: 'समय अंतराल', value: '15 – 30 मिनट' },
          { label: 'प्रमुख चैनल', value: 'जलवाष्प 6.7 µm · टीआईआर 10.8 µm' },
          { label: 'रिज़ॉल्यूशन', value: '4 किमी (उप-उपग्रह)' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'एनसीएमआरडब्ल्यूएफ',
        title: 'आईएमडीएए',
        category: 'वायुमंडलीय पुनर्वैश्लेषण',
        quickStat: 'समावेशन: प्रति घंटा क्षेत्रीय चक्र',
        desc: 'उच्च-रिज़ॉल्यूशन क्षेत्रीय पुनर्वैश्लेषण जो थर्मोडायनामिक साउंडिंग प्रदान करता है: संवहनीय अस्थिरता (CAPE), संवहनीय अवरोध (CIN), और ऊर्ध्वाधर पवन अपरूपण।',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'पुनर्वैश्लेषण 12 किमी',
        specs: [
          { label: 'समावेशन चक्र', value: 'प्रति घंटा क्षेत्रीय चक्र' },
          { label: 'मुख्य पैरामीटर', value: 'CAPE · CIN · पवन कतरनी · नमी' },
          { label: 'कवरेज', value: 'अखिल भारतीय एवं हिंद महासागर' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'इसरो / भुवन',
        title: 'कार्टोडेम',
        category: 'भू-भाग बुद्धिमत्ता',
        quickStat: 'मूल ग्रिड: 30 मीटर हाइड्रोलॉजिकल',
        desc: 'सटीक 30 मीटर डिजिटल एलिवेशन मॉडल जो जलवैज्ञानिक बेसिन सीमांकन, ढलान गणना और जल प्रवाह विश्लेषण को सक्षम बनाता है।',
        img: '/cartodem_elevation.jpg',
        chipTag: 'हाइड्रोलॉजिकल 30 मीटर',
        specs: [
          { label: 'मूल ग्रिड', value: '30 मीटर हाइड्रो-संवर्धित' },
          { label: 'हाइड्रो मॉडल', value: 'डी8 प्रवाह संचय' },
          { label: 'बेसिन मैट्रिक्स', value: 'अखिल भारतीय नदी बेसिन' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  BN: {
    eyebrow: 'মূল সক্ষমতা',
    titlePart1: 'বহু-উৎস ডেটা।',
    titlePart2: 'একটি সমন্বিত স্তর।',
    desc: 'বায়ূনেট তিনটি সার্বভৌম পর্যবেক্ষণ ডেটা একত্রিত করে এবং ৪ কিমি গ্রিডে সমন্বয় করে।',
    exploreAll: 'সবগুলি দেখুন',
    exploreStream: 'ডেটা স্ট্রিম দেখুন →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'মোসড্যাক / ইসরো',
        title: 'ইনস্যাট-৩ডি / ৩ডিআর',
        category: 'উপগ্রহ পর্যবেক্ষণ',
        quickStat: 'আবৃত্তি: ১৫ – ৩০ মিনিট · ৪ কিমি WGS84',
        desc: 'ভূ-স্থির মাল্টি-স্পেকট্রাল রেডিয়েন্স যা মেঘের শীর্ষ তাপমাত্রা দ্রুত হ্রাস এবং আর্দ্রতা সংকেত প্রদান করে।',
        img: '/satellite_insat.jpg',
        chipTag: 'ভূ-স্থির ৪ কিমি',
        specs: [
          { label: 'সময় ব্যবধান', value: '১৫ – ৩০ মিনিট' },
          { label: 'প্রধান চ্যানেল', value: 'জলীয় বাষ্প ৬.৭ µm · টিআইআর ১০.৮ µm' },
          { label: 'রেজোলিউশন', value: '৪ কিমি (উপগ্রহ)' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'এনসিএমআরডব্লিউএফ',
        title: 'আইএমডিএএ',
        category: 'বায়ুমণ্ডলীয় পুনঃবিশ্লেষণ',
        quickStat: 'সমন্বয়: প্রতি ঘণ্টার আঞ্চলিক চক্র',
        desc: 'উচ্চ-রেজোলিউশন আঞ্চলিক পুনঃবিশ্লেষণ যা তাপীয় অস্থিরতা (CAPE), সংবহন রোধ (CIN) এবং বায়ুর গতি প্রদান করে।',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'পুনঃবিশ্লেষণ ১২ কিমি',
        specs: [
          { label: 'সমন্বয় চক্র', value: 'ঘণ্টায় আঞ্চলিক চক্র' },
          { label: 'মূল চলক', value: 'CAPE · CIN · শিয়ার · আর্দ্রতা' },
          { label: 'কভারেজ', value: 'ভারত ও ভারত মহাসাগর' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ইসরো / ভুবন',
        title: 'কার্টোডেম',
        category: 'ভূমিরূপ বুদ্ধিমত্তা',
        quickStat: 'মূল গ্রিড: ৩০ মিটার জলবিজ্ঞান',
        desc: 'সুনির্দিষ্ট ৩০ মিটার ডিজিটাল এলিভেশন মডেল যা নদী অববাহিকা ও পাহাড়ি ঢাল বিশ্লেষণ নিশ্চিত করে।',
        img: '/cartodem_elevation.jpg',
        chipTag: 'জলতাত্ত্বিক ৩০ মি',
        specs: [
          { label: 'মূল গ্রিড', value: '৩০ মি জল-সমন্বিত' },
          { label: 'হাইড্রো মডেল', value: 'ডি৮ প্রবাহ সঞ্চয়' },
          { label: 'বেসিন ম্যাট্রিক্স', value: 'সর্বভারতীয় নদী অববাহিকা' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  MR: {
    eyebrow: 'मुख्य क्षमता',
    titlePart1: 'अनेक स्रोत.',
    titlePart2: 'एक एकात्मिक बुद्धिमत्ता स्तर.',
    desc: 'वायुनेट तीन सार्वभौम निरीक्षण प्रवाह एकत्र करते आणि ४ किमी ग्रिडवर समन्वित करते.',
    exploreAll: 'सर्व पहा',
    exploreStream: 'डेटा प्रवाह पहा →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'मोसडॅक / इस्रो',
        title: 'इनसॅट-३डी / ३डीआर',
        category: 'उपग्रह निरीक्षण',
        quickStat: 'वारंवारता: १५ – ३० मिनिटे · ४ किमी WGS84',
        desc: 'भू-स्थिर मल्टी-स्पेक्ट्रल रेडिएन्स जे ढगांच्या तापमानातील घट आणि जलबाष्प ओलावा मोजते.',
        img: '/satellite_insat.jpg',
        chipTag: 'भू-स्थिर ४ किमी',
        specs: [
          { label: 'वेळ अंतर', value: '१५ – ३० मिनिटे' },
          { label: 'प्रमुख चॅनेल्स', value: 'WV ६.७ µm · TIR १०.८ µm' },
          { label: 'रिझोल्यूशन', value: '४ किमी' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'एनसीएमआरडब्ल्यूएफ',
        title: 'आयएमडीएए',
        category: 'वातावरणीय पुनर्वैश्लेषण',
        quickStat: 'समावेश: प्रति तास प्रादेशिक चक्र',
        desc: 'उच्च-रिझोल्यूशन प्रादेशिक पुनर्वैश्लेषण जे संवहनीय ऊर्जा (CAPE) आणि वाऱ्याची दिशा प्रदान करते.',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'पुनर्वैश्लेषण १२ किमी',
        specs: [
          { label: 'समावेश चक्र', value: 'तासी प्रादेशिक चक्र' },
          { label: 'मुख्य घटक', value: 'CAPE · CIN · विंड शिअर · आर्द्रता' },
          { label: 'कव्हरेज', value: 'अखिल भारत व हिंदी महासागर' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'इस्रो / भुवन',
        title: 'कार्टोडेम',
        category: 'भूरचना बुद्धिमत्ता',
        quickStat: 'मूळ ग्रिड: ३० मीटर जलवैज्ञानिक',
        desc: 'अचूक ३० मीटर डिजिटल एलिव्हेशन मॉडेल जे नदी खोरे आणि तीव्र उतारांचा अचूक अंदाज देते.',
        img: '/cartodem_elevation.jpg',
        chipTag: 'जलवैज्ञानिक ३० मी',
        specs: [
          { label: 'मूळ ग्रिड', value: '३० मी जल-सुधारित' },
          { label: 'हायड्रो मॉडेल', value: 'D8 प्रवाह संचयन' },
          { label: 'बेसिन मॅट्रिक्स', value: 'सर्व भारतीय नदी खोरी' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  TA: {
    eyebrow: 'முக்கிய திறன்கள்',
    titlePart1: 'பல மூலங்கள்.',
    titlePart2: 'ஒருங்கிணைந்த நுண்ணறிவு அடுக்கு.',
    desc: 'வாயுநெட் மூன்று இறையாண்மை கண்காணிப்பு தரவுகளை இணைத்து 4 கிமீ கட்டமைப்பில் வழங்குகிறது.',
    exploreAll: 'அனைத்தையும் ஆராய்க',
    exploreStream: 'தரவு ஓட்டத்தை ஆராய்க →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'மோஸ்டாக் / இஸ்ரோ',
        title: 'இன்சாட்-3D / 3DR',
        category: 'செயற்கைக்கோள் அவதானிப்புகள்',
        quickStat: 'கால இடைவெளி: 15 – 30 நிமிடம் · 4 கிமீ WGS84',
        desc: 'மேகத்தின் மேல் வெப்பநிலை வீழ்ச்சி மற்றும் நீராவி திரட்சியை தீவிரமாகக் கண்காணிக்கும் செயற்கைக்கோள் தரவு.',
        img: '/satellite_insat.jpg',
        chipTag: 'புவிநிலை 4 கிமீ',
        specs: [
          { label: 'கால இடைவெளி', value: '15 – 30 நிமிடம்' },
          { label: 'முக்கிய சேனல்கள்', value: 'WV 6.7 µm · TIR 10.8 µm' },
          { label: 'தெளிவுத்திறன்', value: '4 கிமீ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'IMDAA',
        category: 'வளிமண்டல மறுபகுப்பாய்வு',
        quickStat: 'ஒருங்கிணைப்பு: மணிநேர சுழற்சி',
        desc: 'வெப்ப இயக்கவியல் ஆற்றல் (CAPE), சின் (CIN) மற்றும் காற்றின் வேக மாற்றங்களை வழங்கும் உயர் துல்லிய தரவு.',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'மறுபகுப்பாய்வு 12 கிமீ',
        specs: [
          { label: 'சுழற்சி முறை', value: 'மணிநேர சுழற்சி' },
          { label: 'முக்கிய காரணிகள்', value: 'CAPE · CIN · காற்று முறிவு · ஈரப்பதம்' },
          { label: 'பரப்பளவு', value: 'அகில இந்தியா & பெருங்கடல்' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'இஸ்ரோ / புவன்',
        title: 'கார்டோடெம்',
        category: 'நிலப்பரப்பு நுண்ணறிவு',
        quickStat: 'இயற்கை கட்டமைப்பு: 30 மீ நீர்நிலை மாதிரி',
        desc: 'ஆற்றுப் படுகைகள் மற்றும் மலையோர நீர் வழிந்தோட்டத்தை துல்லியமாக கணிக்கும் 30 மீட்டர் நிலப்பரப்பு மாதிரி.',
        img: '/cartodem_elevation.jpg',
        chipTag: 'நீரியல் 30 மீ',
        specs: [
          { label: 'இயற்கை கட்டமைப்பு', value: '30 மீ நீர்நிலை மாதிரி' },
          { label: 'நீரியல் மாதிரி', value: 'D8 ஓட்டக் குவிப்பு' },
          { label: 'படுகை வரைபடம்', value: 'அனைத்திந்திய நதிப் படுகைகள்' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  TE: {
    eyebrow: 'ప్రధాన సామర్థ్యాలు',
    titlePart1: 'బహుళ వనరులు.',
    titlePart2: 'ఒకే మేధో పొర.',
    desc: 'వాయునెట్ మూడు జాతీయ పరిశీలనా ప్రవాహాలను సమగ్ర 4 కిమీ గ్రిడ్‌పై సమన్వయం చేస్తుంది.',
    exploreAll: 'అన్నీ చూడండి',
    exploreStream: 'డేటాను పరిశీలించండి →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'మోస్డాక్ / ఇస్రో',
        title: 'ఇన్సాట్-3D / 3DR',
        category: 'ఉపగ్రహ పరిశీలనలు',
        quickStat: 'వ్యవధి: 15 – 30 నిమిషాలు · 4 కిమీ WGS84',
        desc: 'మేఘ పైభాగ ఉష్ణోగ్రత తగ్గుదల మరియు నీటి ఆవిరి సేకరణను అందించే జియోస్టేషనరీ ఉపగ్రహ రేడియన్స్‌లు.',
        img: '/satellite_insat.jpg',
        chipTag: 'జియోస్టేషనరీ 4 కిమీ',
        specs: [
          { label: 'కాల వ్యవధి', value: '15 – 30 నిమిషాలు' },
          { label: 'ప్రధాన ఛానెల్స్', value: 'WV 6.7 µm · TIR 10.8 µm' },
          { label: 'రిజల్యూషన్', value: '4 కిమీ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'ఐఎండిఎఎ',
        category: 'వాతావరణ పునఃవిశ్లేషణ',
        quickStat: 'సమీకరణ: గంటల ప్రాంతీయ చక్రం',
        desc: 'అస్థిరత (CAPE), నిరోధం (CIN), మరియు నిలువు పవన కోతను అందించే అధిక-రిజల్యూషన్ ప్రాంతీయ రీఅనాలిసిస్.',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'పునఃవిశ్లేషణ 12 కిమీ',
        specs: [
          { label: 'సమీకరణ చక్రం', value: 'గంటల ప్రాంతీయ చక్రం' },
          { label: 'కీలక చలరాశులు', value: 'CAPE · CIN · షియర్ · తేమ' },
          { label: 'పరిధి', value: 'భారతదేశం & హిందూ మహాసముద్రం' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ఇస్రో / భువన్',
        title: 'కార్టోడెమ్',
        category: 'భూభాగ మేధస్సు',
        quickStat: 'గ్రిడ్: 30 మీటర్ల హైడ్రో-ఎన్‌ఫోర్స్డ్',
        desc: 'నదీ పరీవాహక సరిహద్దులు మరియు ప్రవాహ మార్గాలను అంచనా వేసే ఖచ్చితమైన 30 మీటర్ల డిజిటల్ ఎలివేషన్ మోడల్.',
        img: '/cartodem_elevation.jpg',
        chipTag: 'హైడ్రో 30 మీ',
        specs: [
          { label: 'స్థానిక గ్రిడ్', value: '30 మీటర్ల హైడ్రో' },
          { label: 'హైడ్రో మోడల్', value: 'D8 ప్రవాహ సేకరణ' },
          { label: 'బేసిన్ మాతృక', value: 'అఖిల భారత నదీ పరీవాహక ప్రాంతాలు' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  GU: {
    eyebrow: 'મુખ્ય ક્ષમતાઓ',
    titlePart1: 'બહુ-સ્ત્રોત ડેટા.',
    titlePart2: 'એક સંકલિત સ્તર.',
    desc: 'વાયુનેટ ત્રણ રાષ્ટ્રીય અવલોકન પ્રવાહોને એકીકૃત 4 કિમી ગ્રીડ પર જોડે છે.',
    exploreAll: 'તમામ જુઓ',
    exploreStream: 'ડેટા સ્ટ્રીમ જુઓ →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'મોસડેક / ઇસરો',
        title: 'ઇનસેટ-3D / 3DR',
        category: 'ઉપગ્રહ અવલોકનો',
        quickStat: 'આવૃત્તિ: 15 – 30 મિનિટ · 4 કિમી WGS84',
        desc: 'ભૂ-સ્થિર મલ્ટિ-સ્પેક્ટ્રલ રેડિયન્સ જે ક્લાઉડ ટોપ તાપમાન ઘટાડો અને ભેજ સંકેતો પૂરા પાડે છે.',
        img: '/satellite_insat.jpg',
        chipTag: 'ભૂ-સ્થિર 4 કિમી',
        specs: [
          { label: 'સમય અંતરાલ', value: '15 – 30 મિનિટ' },
          { label: 'મુખ્ય ચેનલ્સ', value: 'WV 6.7 µm · TIR 10.8 µm' },
          { label: 'રિઝોલ્યુશન', value: '4 કિમી' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'આઇએમડીએએ',
        category: 'વાતાવરણીય પુનઃવિશ્લેષણ',
        quickStat: 'ચક્ર: કલાકદીઠ પ્રાદેશિક ચક્ર',
        desc: 'ઉચ્ચ-રિઝોલ્યુશન પુનઃવિશ્લેષણ જે વાતાવરણીય અસ્થિરતા (CAPE) અને પવન વેગ પૂરો પાડે છે.',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'પુનઃવિશ્લેષણ 12 કિમી',
        specs: [
          { label: 'ચક્ર', value: 'કલાકદીઠ પ્રાદેશિક ચક્ર' },
          { label: 'મુખ્ય પરિમાણો', value: 'CAPE · CIN · વિંડ શિઅર · ભેજ' },
          { label: 'કવરેજ', value: 'ભારત અને હિંદ મહાસાગર' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ઇસરો / ભુવન',
        title: 'કાર્ટોડેમ',
        category: 'ભૂ-ભાગ ઇન્ટેલિજન્સ',
        quickStat: 'ગ્રીડ: 30 મીટર હાઇડ્રોલોજિકલ',
        desc: 'ચોક્કસ 30 મીટર ડિજિટલ એલિવેશન મોડેલ જે નદીના બેસિન અને ઢોળાવ વિશ્લેષણને સક્ષમ કરે છે.',
        img: '/cartodem_elevation.jpg',
        chipTag: 'હાઇડ્રો 30 મી',
        specs: [
          { label: 'ગ્રીડ', value: '30 મીટર હાઇડ્રો-મોડેલ' },
          { label: 'હાઇડ્રો મોડેલ', value: 'D8 પ્રવાહ સંચય' },
          { label: 'બેસિન મેટ્રિક્સ', value: 'અખિલ ભારતીય નદી બેસિન' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  KN: {
    eyebrow: 'ಮುಖ್ಯ ಸಾಮರ್ಥ್ಯಗಳು',
    titlePart1: 'ಬಹು-ಮೂಲ ದತ್ತಾಂಶ.',
    titlePart2: 'ಏಕೀಕೃತ ಬುದ್ಧಿಮತ್ತೆ ಪದರ.',
    desc: 'ವಾಯುನೆಟ್ ಮೂರು ರಾಷ್ಟ್ರೀಯ ವೀಕ್ಷಣಾ ಪ್ರವಾಹಗಳನ್ನು 4 ಕಿಮೀ ಗ್ರಿಡ್‌ನಲ್ಲಿ ಸಂಯೋಜಿಸುತ್ತದೆ.',
    exploreAll: 'ಎಲ್ಲವನ್ನೂ ವೀಕ್ಷಿಸಿ',
    exploreStream: 'ಡೇಟಾ ಸ್ಟ್ರೀಮ್ ನೋಡಿ →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'ಮೊಸ್ಡಾಕ್ / ಇಸ್ರೋ',
        title: 'ಇನ್ಸಾಟ್-3D / 3DR',
        category: 'ಉಪಗ್ರಹ ವೀಕ್ಷಣೆಗಳು',
        quickStat: 'ಆವರ್ತನ: 15 – 30 ನಿಮಿಷ · 4 ಕಿಮೀ WGS84',
        desc: 'ಮೋಡದ ಮೇಲ್ಭಾಗದ ತಾಪಮಾನ ಕುಸಿತ ಮತ್ತು ತೇವಾಂಶ ಶೇಖರಣೆಯನ್ನು ಅಳೆಯುವ ಭೂಸ್ಥಿರ ಉಪಗ್ರಹ ದತ್ತಾಂಶ.',
        img: '/satellite_insat.jpg',
        chipTag: 'ಭೂಸ್ಥಿರ 4 ಕಿಮೀ',
        specs: [
          { label: 'ಸಮಯದ ಅಂತರ', value: '15 – 30 ನಿಮಿಷ' },
          { label: 'ಪ್ರಮುಖ ಚಾನಲ್‌ಗಳು', value: 'WV 6.7 µm · TIR 10.8 µm' },
          { label: 'ರೆಸಲ್ಯೂಶನ್', value: '4 ಕಿಮೀ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'ಐಎಂಡಿಎಎ',
        category: 'ವಾತಾವರಣದ ಮರು-ವಿಶ್ಲೇಷಣೆ',
        quickStat: 'ಅಳವಡಿಕೆ: ಗಂಟೆಯ ಪ್ರಾದೇಶಿಕ ಚಕ್ರ',
        desc: 'ವಾತಾವರಣದ ಅಸ್ಥಿರತೆ (CAPE) ಮತ್ತು ಗಾಳಿಯ ದಿಕ್ಕನ್ನು ಒದಗಿಸುವ ಉನ್ನತ-ರೆಸಲ್ಯೂಶನ್ ಪ್ರಾದೇಶಿಕ ವಿಶ್ಲೇಷಣೆ.',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'ಮರು-ವಿಶ್ಲೇಷಣೆ 12 ಕಿಮೀ',
        specs: [
          { label: 'ಚಕ್ರ', value: 'ಗಂಟೆಯ ಪ್ರಾದೇಶಿಕ ಚಕ್ರ' },
          { label: 'ಪ್ರಮುಖ ಅಂಶಗಳು', value: 'CAPE · CIN · ವಿಂಡ್‌ ಶಿಯರ್ · ತೇವಾಂಶ' },
          { label: 'ವ್ಯಾಪ್ತಿ', value: 'ಭಾರತ ಮತ್ತು ಹಿಂದೂ ಮಹಾಸಾಗರ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ಇಸ್ರೋ / ಭುವನ್',
        title: 'ಕಾರ್ಟೊಡೆಮ್',
        category: 'ಭೂಪ್ರದೇಶ ಬುದ್ಧಿಮತ್ತೆ',
        quickStat: 'ಮೂಲ ಗ್ರಿಡ್: 30 ಮೀಟರ್ ಜಲವಿಜ್ಞಾನ',
        desc: 'ನದಿಯ ಜಲಾನಯನ ಪ್ರದೇಶಗಳು ಮತ್ತು ಇಳಿಜಾರುಗಳನ್ನು ಅಂದಾಜಿಸುವ ನಿಖರವಾದ 30 ಮೀಟರ್ ಎತ್ತರದ ಮಾದರಿ.',
        img: '/cartodem_elevation.jpg',
        chipTag: 'ಹೈಡ್ರೋ 30 ಮೀ',
        specs: [
          { label: 'ಸ್ಥಳೀಯ ಗ್ರಿಡ್', value: '30 ಮೀ ಹೈಡ್ರೋ-ಮಾದರಿ' },
          { label: 'ಹೈಡ್ರೋ ಮಾದರಿ', value: 'D8 ಹರಿವಿನ ಶೇಖರಣೆ' },
          { label: 'ಜಲಾನಯನ ಮ್ಯಾಟ್ರಿಕ್ಸ್', value: 'ಅಖಿಲ ಭಾರತ ನದಿ ಪಾತ್ರಗಳು' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  ML: {
    eyebrow: 'പ്രധാന സവിശേഷതകൾ',
    titlePart1: 'ബഹുവിധ സ്രോതസ്സുകൾ.',
    titlePart2: 'ഏകീകൃത ഇന്റലിജൻസ് തലം.',
    desc: 'വായുനെറ്റ് മൂന്ന് നിരീക്ഷണ ഡാറ്റാ സ്രോതസ്സുകളെ 4 കി.മീ ഗ്രിഡിൽ സമന്വയിപ്പിക്കുന്നു.',
    exploreAll: 'എല്ലാം കാണുക',
    exploreStream: 'ഡാറ്റാ സ്ട്രീം കാണുക →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'മോസ്ഡാക് / ഐഎസ്ആർഒ',
        title: 'ഇൻസാറ്റ്-3D / 3DR',
        category: 'ഉപഗ്രഹ നിരീക്ഷണങ്ങൾ',
        quickStat: 'ഇടവേള: 15 – 30 മിനിറ്റ് · 4 കിമീ WGS84',
        desc: 'മേഘങ്ങളുടെ തണുപ്പിക്കൽ നിരക്കും ഈർപ്പവും അതിവേഗം നിരീക്ഷിക്കുന്ന ഉപഗ്രഹ സംവിധാനം.',
        img: '/satellite_insat.jpg',
        chipTag: 'ഭൂസ്ഥിര 4 കിമീ',
        specs: [
          { label: 'സമയ ഇടവേള', value: '15 – 30 മിനിറ്റ്' },
          { label: 'പ്രധാന ചാനലുകൾ', value: 'WV 6.7 µm · TIR 10.8 µm' },
          { label: 'റെസല്യൂഷൻ', value: '4 കിമീ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'ഐഎംഡിഎഎ',
        category: 'അന്തരീക്ഷ പുനർവിശകലനം',
        quickStat: 'ചക്രം: മണിക്കൂർ തോറുമുള്ള പ്രാദേശിക ചക്രം',
        desc: 'അന്തരീക്ഷ അസ്ഥിരതയും (CAPE) കാറ്റിന്റെ വേഗതയും നൽകുന്ന ഉയർന്ന കൃത്യതയുള്ള ഡാറ്റ.',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'പുനർവിശകലനം 12 കിമീ',
        specs: [
          { label: 'സമയ ചക്രം', value: 'മണിക്കൂർ തോറുമുള്ള ചക്രം' },
          { label: 'പ്രധാന ഘടകങ്ങൾ', value: 'CAPE · CIN · കാറ്റിന്റെ വേഗത · ഈർപ്പം' },
          { label: 'വ്യാപ്തി', value: 'ഇന്ത്യയും ഇന്ത്യൻ മഹാസമുദ്രവും' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ഐഎസ്ആർഒ / ഭുവൻ',
        title: 'കാർട്ടോഡെം',
        category: 'ഭൂപ്രകൃതി ഇന്റലിജൻസ്',
        quickStat: 'ഗ്രിഡ്: 30 മീറ്റർ ഹൈഡ്രോ-മോഡൽ',
        desc: 'നദീതടങ്ങളും വെള്ളപ്പൊക്ക സാധ്യതയുള്ള ചരിവുകളും കൃത്യമായി മാപ്പ് ചെയ്യുന്ന 30 മീറ്റർ മോഡൽ.',
        img: '/cartodem_elevation.jpg',
        chipTag: 'ഹൈഡ്രോ 30 മീറ്റർ',
        specs: [
          { label: 'പ്രാദേശിക ഗ്രിഡ്', value: '30 മീറ്റർ ഹൈഡ്രോ' },
          { label: 'ഹൈഡ്രോ മോഡൽ', value: 'D8 ഒഴുക്ക് ശേഖരണം' },
          { label: 'നദീതട മാട്രിക്സ്', value: 'അഖിലേന്ത്യാ നദീതടങ്ങൾ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  PA: {
    eyebrow: 'ਮੁੱਖ ਸਮਰੱਥਾਵਾਂ',
    titlePart1: 'ਬਹੁ-ਸਰੋਤ ਡਾਟਾ।',
    titlePart2: 'ਇੱਕ ਏਕੀਕ੍ਰਿਤ ਜਾਣਕਾਰੀ ਪਰਤ।',
    desc: 'ਵਾਯੂਨੇਟ ਤਿੰਨ ਨਿਗਰਾਨੀ ਸਟ੍ਰੀਮਾਂ ਨੂੰ 4 ਕਿਲੋਮੀਟਰ ਗਰਿੱਡ ਵਿੱਚ ਜੋੜਦਾ ਹੈ।',
    exploreAll: 'ਸਾਰੇ ਦੇਖੋ',
    exploreStream: 'ਡਾਟਾ ਸਟ੍ਰੀਮ ਦੇਖੋ →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'ਮੋਸਡੈਕ / ਇਸਰੋ',
        title: 'ਇਨਸੈਟ-3D / 3DR',
        category: 'ਸੈਟੇਲਾਈਟ ਨਿਰੀਖਣ',
        quickStat: 'ਅੰਤਰਾਲ: 15 – 30 ਮਿੰਟ · 4 ਕਿਮੀ WGS84',
        desc: 'ਬੱਦਲਾਂ ਦੇ ਤਾਪਮਾਨ ਵਿੱਚ ਗਿਰਾਵਟ ਅਤੇ ਨਮੀ ਦੀ ਨਿਗਰਾਨੀ ਕਰਨ ਵਾਲਾ ਭੂ-ਸਥਿਰ ਸੈਟੇਲਾਈਟ ਡਾਟਾ।',
        img: '/satellite_insat.jpg',
        chipTag: 'ਭੂ-ਸਥਿਰ 4 ਕਿਮੀ',
        specs: [
          { label: 'ਸਮਾਂ ਅੰਤਰਾਲ', value: '15 – 30 ਮਿੰਟ' },
          { label: 'ਮੁੱਖ ਚੈਨਲ', value: 'WV 6.7 µm · TIR 10.8 µm' },
          { label: 'ਰੈਜ਼ੋਲਿਊਸ਼ਨ', value: '4 ਕਿਮੀ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'ਆਈਐਮਡੀਏਏ',
        category: 'ਵਾਯੂਮੰਡਲੀ ਪੁਨਰ-ਵਿਸ਼ਲੇਸ਼ਣ',
        quickStat: 'ਚੱਕਰ: ਘੰਟੇਵਾਰ ਖੇਤਰੀ ਚੱਕਰ',
        desc: 'ਵਾਯੂਮੰਡਲ ਦੀ ਅਸਥਿਰਤਾ (CAPE) ਅਤੇ ਹਵਾ ਦੀ ਰਫ਼ਤਾਰ ਦਾ ਉੱਚ-ਰੈਜ਼ੋਲੂਸ਼ਨ ਵਿਸ਼ਲੇਸ਼ਣ।',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'ਪੁਨਰ-ਵਿਸ਼ਲੇਸ਼ਣ 12 ਕਿਮੀ',
        specs: [
          { label: 'ਚੱਕਰ', value: 'ਘੰਟੇਵਾਰ ਖੇਤਰੀ ਚੱਕਰ' },
          { label: 'ਮੁੱਖ ਪੈਰਾਮੀਟਰ', value: 'CAPE · CIN · ਹਵਾ ਸ਼ੀਅਰ · ਨਮੀ' },
          { label: 'ਕਵਰੇਜ', value: 'ਭਾਰਤ ਅਤੇ ਹਿੰਦ ਮਹਾਸਾਗਰ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ਇਸਰੋ / ਭੁਵਨ',
        title: 'ਕਾਰਟੋਡੈਮ',
        category: 'ਜ਼ਮੀਨੀ ਇੰਟੈਲੀਜੈਂਸ',
        quickStat: 'ਗਰਿੱਡ: 30 ਮੀਟਰ ਹਾਈਡ੍ਰੋਲੋਜੀਕਲ',
        desc: 'ਦਰਿਆਈ ਬੇਸਿਨਾਂ ਅਤੇ ਪਾਣੀ ਦੇ ਵਹਾਅ ਦਾ ਸਹੀ ਅੰਦਾਜ਼ਾ ਲਗਾਉਣ ਵਾਲਾ 30 ਮੀਟਰ ਮਾਡਲ।',
        img: '/cartodem_elevation.jpg',
        chipTag: 'ਹਾਈਡ੍ਰੋ 30 ਮੀਟਰ',
        specs: [
          { label: 'ਗਰਿੱਡ', value: '30 ਮੀਟਰ ਹਾਈਡ੍ਰੋ' },
          { label: 'ਹਾਈਡ੍ਰੋ ਮਾਡਲ', value: 'D8 ਵਹਾਅ ਇਕੱਠ' },
          { label: 'ਬੇਸਿਨ ਮੈਟ੍ਰਿਕਸ', value: 'ਸਰਬ ਭਾਰਤੀ ਦਰਿਆਈ ਬੇਸਿਨ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  OR: {
    eyebrow: 'ମୁଖ୍ୟ କ୍ଷମତା',
    titlePart1: 'ବହୁ-ଉତ୍ସ ତଥ୍ୟ।',
    titlePart2: 'ଗୋଟିଏ ଏକୀକୃତ ସ୍ତର।',
    desc: 'ବାୟୁନେଟ୍ ତିନୋଟି ଜାତୀୟ ନିରୀକ୍ଷଣ ପ୍ରବାହକୁ ଏକୀକୃତ ୪ କିମି ଗ୍ରୀଡରେ ସଂଯୋଗ କରେ।',
    exploreAll: 'ସବୁ ଦେଖନ୍ତୁ',
    exploreStream: 'ଡାଟା ଷ୍ଟ୍ରିମ୍ ଦେଖନ୍ତୁ →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'ମୋସଡାକ୍ / ଇସ୍ରୋ',
        title: 'ଇନସାଟ୍-୩D / ୩DR',
        category: 'ଉପଗ୍ରହ ନିରୀକ୍ଷଣ',
        quickStat: 'ଅନ୍ତରାଳ: ୧୫ – ୩୦ ମିନିଟ୍ · ୪ କିମି WGS84',
        desc: 'ମେଘ ଶୀର୍ଷ ତାପମାତ୍ରା ହ୍ରାସ ଏବଂ ଜଳୀୟ ବାଷ୍ପ ଚିହ୍ନଟ କରୁଥିବା ଉପଗ୍ରହ ତଥ୍ୟ।',
        img: '/satellite_insat.jpg',
        chipTag: 'ଭୂ-ସ୍ଥିର ୪ କିମି',
        specs: [
          { label: 'ସମୟ ବ୍ୟବଧାନ', value: '୧୫ – ୩୦ ମିନିଟ୍' },
          { label: 'ମୁଖ୍ୟ ଚ୍ୟାନେଲ୍', value: 'WV ୬.୭ µm · TIR ୧୦.୮ µm' },
          { label: 'ରେଜୋଲ୍ୟୁସନ୍', value: '୪ କିମି' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'ଆଇଏମ୍‌ଡିଏଏ',
        category: 'ବାୟୁମଣ୍ଡଳୀୟ ପୁନଃବିଶ୍ଳେଷଣ',
        quickStat: 'ଚକ୍ର: ଘଣ୍ଟା ଅନୁସାରେ ଆଞ୍ଚଳିକ ଚକ୍ର',
        desc: 'ବାୟୁମଣ୍ଡଳର ଅସ୍ଥିରତା (CAPE) ଏବଂ ପବନ ବେଗ ପ୍ରଦାନ କରୁଥିବା ଉଚ୍ଚ-ସଠିକତା ତଥ୍ୟ।',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'ପୁନଃବିଶ୍ଳେଷଣ ୧୨ କିମି',
        specs: [
          { label: 'ଚକ୍ର', value: 'ପ୍ରତି ଘଣ୍ଟା ଆଞ୍ଚଳିକ ଚକ୍ର' },
          { label: 'ମୁଖ୍ୟ ମାନଦଣ୍ଡ', value: 'CAPE · CIN · ପବନ ଶିଅର୍ · ଆର୍ଦ୍ରତା' },
          { label: 'କଭରେଜ୍', value: 'ଭାରତ ଏବଂ ଭାରତ ମହାସାଗର' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ଇସ୍ରୋ / ଭୁବନ',
        title: 'କାର୍ଟୋଡେମ୍',
        category: 'ଭୂ-ଭାଗ ଗୁଇନ୍ଦା',
        quickStat: 'ଗ୍ରୀଡ୍: ୩୦ ମିଟର ହାଇଡ୍ରୋଲୋଜିକାଲ୍',
        desc: 'ନଦୀ ଅବବାହିକା ଏବଂ ପ୍ରବାହ ବିଶ୍ଳେଷଣ ପାଇଁ ସଠିକ୍ ୩୦ ମିଟର ଡିଜିଟାଲ୍ ଏଲିଭେସନ୍ ମଡେଲ୍।',
        img: '/cartodem_elevation.jpg',
        chipTag: 'ହାଇଡ୍ରୋ ୩୦ ମି',
        specs: [
          { label: 'ଗ୍ରୀଡ୍', value: '୩୦ ମି ହାଇଡ୍ରୋ' },
          { label: 'ହାଇଡ୍ରୋ ମଡେଲ୍', value: 'D8 ପ୍ରବାହ ସଂଗ୍ରହ' },
          { label: 'ଅବବାହିକା ମ୍ୟାଟ୍ରିକ୍ସ', value: 'ସର୍ବଭାରତୀୟ ନଦୀ ଅବବାହିକା' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  },
  AS: {
    eyebrow: 'মুখ্য ক্ষমতা',
    titlePart1: 'বহু-উৎস তথ্য।',
    titlePart2: 'এটা একত্ৰিত স্তৰ।',
    desc: 'বায়ূনেটে তিনিটা ৰাষ্ট্ৰীয় পৰ্যবেক্ষণ তথ্য প্ৰবাহক ৪ কিমি গ্ৰিডত একত্ৰিত কৰে।',
    exploreAll: 'সকলো চাওক',
    exploreStream: 'তথ্য প্ৰবাহ চাওক →',
    streams: [
      {
        id: 'insat',
        num: '01',
        agency: 'মোছডাক / ইছৰো',
        title: 'ইনচেট-৩ডি / ৩ডিআৰ',
        category: 'উপগ্ৰহ পৰ্যবেক্ষণ',
        quickStat: 'ব্যৱধান: ১৫ – ৩০ মিনিট · ৪ কিমি WGS84',
        desc: 'মেঘৰ শীৰ্ষৰ উষ্ণতা হ্ৰাস আৰু আৰ্দ্ৰতাৰ সংকেত প্ৰদান কৰা উপগ্ৰহ তথ্য।',
        img: '/satellite_insat.jpg',
        chipTag: 'ভূ-স্থিৰ ৪ কিমি',
        specs: [
          { label: 'সময় ব্যৱধান', value: '১৫ – ৩০ মিনিট' },
          { label: 'মুখ্য চেনেল', value: 'WV ৬.৭ µm · TIR ১০.৮ µm' },
          { label: 'ৰিজলিউচন', value: '৪ কিমি' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.45)',
      },
      {
        id: 'imdaa',
        num: '02',
        agency: 'NCMRWF',
        title: 'আইএমডিএএ',
        category: 'বায়ুমণ্ডলীয় পুনৰ্বিশ্লেষণ',
        quickStat: 'চক্ৰ: ঘণ্টাৰ আঞ্চলিক চক্ৰ',
        desc: 'বায়ুমণ্ডলৰ অস্থিৰতা (CAPE) আৰু বতাহৰ গতি প্ৰদান কৰা উচ্চ-সঠিকতাৰ তথ্য।',
        img: '/imdaa_reanalysis.jpg',
        chipTag: 'পুনৰ্বিশ্লেষণ ১২ কিমি',
        specs: [
          { label: 'চক্ৰ', value: 'প্ৰতি ঘণ্টাৰ আঞ্চলিক চক্ৰ' },
          { label: 'মুখ্য চলক', value: 'CAPE · CIN · বতাহৰ শিয়াৰ · আৰ্দ্ৰতা' },
          { label: 'পৰিসৰ', value: 'ভাৰত আৰু ভাৰত মহাসাগৰ' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
      {
        id: 'cartodem',
        num: '03',
        agency: 'ইছৰো / ভুৱন',
        title: 'কাৰ্টোডেম',
        category: 'ভূ-ভাগ বুদ্ধিমত্তা',
        quickStat: 'গ্ৰিড: ৩০ মিটাৰ জলবিজ্ঞান',
        desc: 'নদী অৱবাহিকা আৰু পানীৰ ঢাল নিৰ্ণয় কৰিব পৰা সঠিক ৩০ মিটাৰ উচ্চতাৰ মডেল।',
        img: '/cartodem_elevation.jpg',
        chipTag: 'জলতাত্ত্বিক ৩০ মি',
        specs: [
          { label: 'গ্ৰিড', value: '৩০ মি জল-সমন্বিত' },
          { label: 'হাইড্ৰো মডেল', value: 'D8 প্ৰবাহ সংগ্ৰহ' },
          { label: 'অৱবাহিকা মেট্ৰিক্স', value: 'সৰ্বভাৰতীয় নদী অৱবাহিকা' },
        ],
        accentTint: 'rgba(56, 189, 248, 0.03)',
        accentBorder: 'rgba(56, 189, 248, 0.42)',
      },
    ]
  }
};

export default function FusionAccordion({ onEnterPortal }) {
  const { language } = useAccessibility();
  const langKey = (language || 'en').toUpperCase();
  const t = FUSION_TRANSLATIONS[langKey] || FUSION_TRANSLATIONS.EN;

  const containerRef = useRef(null);
  const cardRefs = useRef([]);
  const descRefs = useRef([]);
  const specRefs = useRef([]);
  const imageRefs = useRef([]);
  const ctaLabelRefs = useRef([]);

  // Mobile open state map: tracks open cards on mobile
  const [mobileOpenCards, setMobileOpenCards] = useState({ 0: true });

  // Desktop active hovered index
  const [desktopHoveredIdx, setDesktopHoveredIdx] = useState(null);

  // Check reduced motion preference
  const isReducedMotion = () =>
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Direct GSAP expansion on desktop
  const expandCard = useCallback((idx) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    setDesktopHoveredIdx(idx);
    const reduced = isReducedMotion();
    const duration = reduced ? 0.05 : 0.65;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      // Kill in-flight tweens on card and its sub-elements
      gsap.killTweensOf(card);
      if (descRefs.current[i]) gsap.killTweensOf(descRefs.current[i]);
      if (specRefs.current[i]) gsap.killTweensOf(specRefs.current[i]);
      if (imageRefs.current[i]) gsap.killTweensOf(imageRefs.current[i]);
      if (ctaLabelRefs.current[i]) gsap.killTweensOf(ctaLabelRefs.current[i]);

      if (i === idx) {
        // Active hovered card expands
        gsap.to(card, {
          flexGrow: 2.25,
          flexShrink: 1,
          flexBasis: '0%',
          opacity: 1,
          y: reduced ? 0 : -3,
          borderColor: t.streams[i].accentBorder || 'rgba(56, 189, 248, 0.5)',
          boxShadow: '0 24px 50px -12px rgba(0, 0, 0, 0.75), 0 0 28px rgba(56, 189, 248, 0.16)',
          duration,
          ease: 'power3.out',
        });

        // Description reveals
        if (descRefs.current[i]) {
          gsap.to(descRefs.current[i], {
            opacity: 1,
            y: 0,
            maxHeight: 140,
            marginTop: 10,
            marginBottom: 10,
            duration: reduced ? 0.05 : 0.55,
            delay: reduced ? 0 : 0.06,
            ease: 'power3.out',
          });
        }

        // Detailed Specs reveal
        if (specRefs.current[i]) {
          gsap.to(specRefs.current[i], {
            opacity: 1,
            y: 0,
            maxHeight: 180,
            paddingTop: 10,
            duration: reduced ? 0.05 : 0.55,
            delay: reduced ? 0 : 0.1,
            ease: 'power3.out',
          });
        }

        // Image zooms smoothly and clarifies
        if (imageRefs.current[i]) {
          gsap.to(imageRefs.current[i], {
            opacity: 1,
            scale: 1,
            x: 0,
            duration,
            ease: 'power3.out',
          });
        }

        // CTA label illuminates
        if (ctaLabelRefs.current[i]) {
          gsap.to(ctaLabelRefs.current[i], {
            opacity: 1,
            x: 2,
            color: '#62c0bf',
            duration: reduced ? 0.05 : 0.35,
            ease: 'power2.out',
          });
        }
      } else {
        // Non-hovered cards contract and become quieter
        gsap.to(card, {
          flexGrow: 0.8,
          flexShrink: 1,
          flexBasis: '0%',
          opacity: 0.72,
          y: 0,
          borderColor: 'rgba(255, 255, 255, 0.07)',
          boxShadow: '0 10px 28px rgba(0, 0, 0, 0.4)',
          duration,
          ease: 'power3.out',
        });

        if (descRefs.current[i]) {
          gsap.to(descRefs.current[i], {
            opacity: 0,
            y: 8,
            maxHeight: 0,
            marginTop: 0,
            marginBottom: 0,
            duration: reduced ? 0.05 : 0.4,
            ease: 'power3.inOut',
          });
        }

        if (specRefs.current[i]) {
          gsap.to(specRefs.current[i], {
            opacity: 0,
            y: 8,
            maxHeight: 0,
            paddingTop: 0,
            duration: reduced ? 0.05 : 0.4,
            ease: 'power3.inOut',
          });
        }

        if (imageRefs.current[i]) {
          gsap.to(imageRefs.current[i], {
            opacity: 0.6,
            scale: 1,
            x: 0,
            duration: reduced ? 0.05 : 0.5,
            ease: 'power3.out',
          });
        }

        if (ctaLabelRefs.current[i]) {
          gsap.to(ctaLabelRefs.current[i], {
            opacity: 0.35,
            x: 0,
            color: '#64748b',
            duration: reduced ? 0.05 : 0.3,
            ease: 'power2.out',
          });
        }
      }
    });
  }, []);

  // Restore all cards to resting dimensions on container mouseleave (desktop)
  const restoreAllCards = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    setDesktopHoveredIdx(null);
    const reduced = isReducedMotion();
    const duration = reduced ? 0.05 : 0.65;

    cardRefs.current.forEach((card, i) => {
      if (!card) return;

      gsap.killTweensOf(card);
      if (descRefs.current[i]) gsap.killTweensOf(descRefs.current[i]);
      if (specRefs.current[i]) gsap.killTweensOf(specRefs.current[i]);
      if (imageRefs.current[i]) gsap.killTweensOf(imageRefs.current[i]);
      if (ctaLabelRefs.current[i]) gsap.killTweensOf(ctaLabelRefs.current[i]);

      gsap.to(card, {
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '0%',
        opacity: 1,
        y: 0,
        borderColor: 'rgba(255, 255, 255, 0.09)',
        boxShadow: '0 14px 34px rgba(0, 0, 0, 0.45)',
        duration,
        ease: 'power3.out',
      });

      if (descRefs.current[i]) {
        gsap.to(descRefs.current[i], {
          opacity: 0,
          y: 8,
          maxHeight: 0,
          marginTop: 0,
          marginBottom: 0,
          duration: reduced ? 0.05 : 0.45,
          ease: 'power3.inOut',
        });
      }

      if (specRefs.current[i]) {
        gsap.to(specRefs.current[i], {
          opacity: 0,
          y: 8,
          maxHeight: 0,
          paddingTop: 0,
          duration: reduced ? 0.05 : 0.45,
          ease: 'power3.inOut',
        });
      }

      if (imageRefs.current[i]) {
        gsap.to(imageRefs.current[i], {
          opacity: 0.65,
          scale: 0.95,
          x: 0,
          duration: reduced ? 0.05 : 0.55,
          ease: 'power3.out',
        });
      }

      if (ctaLabelRefs.current[i]) {
        gsap.to(ctaLabelRefs.current[i], {
          opacity: 0.55,
          x: 0,
          color: '#94a3b8',
          duration: reduced ? 0.05 : 0.35,
          ease: 'power2.out',
        });
      }
    });
  }, []);

  // Mobile automatic scroll-driven downward expansion:
  // As user scrolls down in phone mode (< 768px), each card detects when its top enters the focus
  // zone and smoothly unfolds DOWNWARDS. Cards above remain open during downward scroll so the
  // content never jumps or moves upward. When scrolling back up, cards below the screen fold back up.
  useEffect(() => {
    let ticking = false;

    const handleMobileScroll = () => {
      if (typeof window === 'undefined' || window.innerWidth >= 768) return;
      if (!containerRef.current) return;

      const windowH = window.innerHeight;
      // Reveal threshold: when the card top is within the lower 30% of screen as user scrolls down
      const revealThreshold = windowH * 0.72;

      setMobileOpenCards((prev) => {
        const next = { ...prev };
        let changed = false;

        cardRefs.current.forEach((card, i) => {
          if (!card) return;
          const rect = card.getBoundingClientRect();

          // When scrolling down: card reaches reveal threshold -> smoothly unfold downwards
          // Preceding cards remain open so the document height above the viewport never shrinks (zero upward jerk)
          if (rect.top <= revealThreshold && rect.bottom > 40) {
            if (!next[i]) {
              next[i] = true;
              changed = true;
            }
          }
          // When scrolling back UP: card moves completely below viewport -> fold closed
          // Since this card is below the screen, folding it causes zero shift to anything visible
          else if (rect.top > windowH * 0.94) {
            if (next[i]) {
              next[i] = false;
              changed = true;
            }
          }
        });

        return changed ? next : prev;
      });
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleMobileScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });

    // Initial check on load
    handleMobileScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cardRefs.current.forEach((card) => {
        if (card) gsap.killTweensOf(card);
      });
      descRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
      specRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
      imageRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
      ctaLabelRefs.current.forEach((el) => {
        if (el) gsap.killTweensOf(el);
      });
    };
  }, []);

  // Mobile accordion manual toggle
  const toggleMobileCard = (idx) => {
    setMobileOpenCards((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handleCardClick = (idx) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      toggleMobileCard(idx);
    } else {
      if (onEnterPortal) {
        onEnterPortal('data-sources');
      }
    }
  };

  return (
    <section id="data-fusion" className="section-data-fusion">
      {/* Top Header Row */}
      <div className="fusion-header-wrap">
        <div className="fusion-header-left">
          <div className="section-eyebrow">{t.eyebrow}</div>
          <h2 className="fusion-title">
            {t.titlePart1}<br />
            <span className="fusion-title-blue">{t.titlePart2}</span>
          </h2>
          <p className="fusion-desc">
            {t.desc}
          </p>
        </div>

        <div className="fusion-header-right">
          <button
            type="button"
            className="fusion-explore-all-btn"
            onClick={() => onEnterPortal?.('data-sources')}
            aria-label="Explore all sovereign observation streams"
          >
            <span className="explore-btn-text">{t.exploreAll}</span>
            <span className="explore-btn-circle">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="7" y1="17" x2="17" y2="7" />
                <polyline points="7 7 17 7 17 17" />
              </svg>
            </span>
          </button>
        </div>
      </div>

      {/* Horizontal Accordion Container */}
      <div
        ref={containerRef}
        className="fusion-accordion-container"
        onMouseLeave={restoreAllCards}
        role="region"
        aria-label="Sovereign observation streams horizontal accordion"
      >
        {t.streams.map((stream, idx) => {
          const isMobileActive = !!mobileOpenCards[idx];
          const isExpanded = desktopHoveredIdx === idx;
          const isContracted = desktopHoveredIdx !== null && desktopHoveredIdx !== idx;

          return (
            <div
              key={stream.id}
              ref={(el) => (cardRefs.current[idx] = el)}
              className={`fusion-accordion-card ${isMobileActive ? 'is-mobile-active' : ''} ${isExpanded ? 'is-expanded' : ''} ${isContracted ? 'is-contracted' : ''}`}
              style={{ background: stream.accentTint }}
              onMouseEnter={() => expandCard(idx)}
              onFocus={() => expandCard(idx)}
              onBlur={restoreAllCards}
              onClick={() => handleCardClick(idx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(idx);
                }
              }}
              tabIndex={0}
              role="button"
              aria-expanded={isMobileActive}
              aria-label={`${stream.title} — ${stream.category}`}
            >
              <div className="fusion-card-inner">
                {/* Left Content Column */}
                <div className="fusion-card-left-col">
                  {/* Top Bar with Agency Badge and Stream Number */}
                  <div className="fusion-card-topbar">
                    <div className="fusion-agency-pill">
                      <span className="fusion-agency-icon">
                        {idx === 0 && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="2" y="3" width="20" height="14" rx="2" />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        )}
                        {idx === 1 && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
                          </svg>
                        )}
                        {idx === 2 && (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="3 18 9 6 15 13 18 9 21 18 3 18" />
                          </svg>
                        )}
                      </span>
                      <span className="fusion-agency-name">{stream.agency}</span>
                    </div>

                    <div className="fusion-card-topbar-right">
                      <span className="fusion-card-idx">{stream.num}</span>
                      <span className={`fusion-mobile-chevron ${isMobileActive ? 'is-open' : ''}`} aria-hidden="true">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </span>
                    </div>
                  </div>

                  {/* Title & Category & Summary Stat */}
                  <div className="fusion-card-head">
                    <h3 className="fusion-card-title">{stream.title}</h3>
                    <div className="fusion-card-sub">{stream.category}</div>
                    <div className="fusion-card-quick-stat">
                      <span className="quick-stat-dot" />
                      <span>{stream.quickStat}</span>
                    </div>
                  </div>

                  {/* Expandable Description */}
                  <div
                    ref={(el) => (descRefs.current[idx] = el)}
                    className="fusion-card-desc-wrap"
                  >
                    <p className="fusion-card-desc-text">{stream.desc}</p>
                  </div>

                  {/* Expandable Specs Grid */}
                  <div
                    ref={(el) => (specRefs.current[idx] = el)}
                    className="fusion-card-specs-wrap"
                  >
                    <div className="fusion-specs-matrix">
                      {stream.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="fusion-spec-item">
                          <span className="spec-label">{spec.label}</span>
                          <strong className="spec-val">{spec.value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Action / CTA */}
                  <div className="fusion-card-bottom">
                    <div
                      ref={(el) => (ctaLabelRefs.current[idx] = el)}
                      className="fusion-cta-label"
                    >
                      <span>{t.exploreStream}</span>
                    </div>
                  </div>
                </div>

                {/* Right Visual / Image Column */}
                <div
                  ref={(el) => (imageRefs.current[idx] = el)}
                  className="fusion-card-media-col"
                >
                  <div className="fusion-media-frame">
                    <img
                      src={stream.img}
                      alt={`${stream.title} - ${stream.category}`}
                      className="fusion-media-img"
                      loading="lazy"
                    />
                    <div className="fusion-media-vignette" />

                    {/* Chip Tag */}
                    <div className="fusion-media-chip">{stream.chipTag}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
