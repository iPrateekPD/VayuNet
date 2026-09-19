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
