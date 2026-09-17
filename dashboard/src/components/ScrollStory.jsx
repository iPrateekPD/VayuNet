import React, { useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './ScrollStory.css';

gsap.registerPlugin(ScrollTrigger);

const STORY_STATES = [
  {
    id: 'observe',
    number: '01',
    label: 'OBSERVE',
    title: 'Satellite + Radar Intelligence',
    description: 'Fuse INSAT-3D/3DR observations, Doppler radar and environmental data to identify developing weather signals.',
    image: '/satellite_insat.jpg',
    overlayLabel: 'INSAT-3D/3DR',
    overlayValue: 'LIVE'
  },
  {
    id: 'understand',
    number: '02',
    label: 'UNDERSTAND',
    title: 'Atmospheric Intelligence',
    description: 'Analyze moisture, instability, cloud evolution and terrain interactions driving severe weather.',
    image: '/imdaa_reanalysis.jpg',
    overlayLabel: 'PRECIPITATION',
    overlayValue: '124 mm'
  },
  {
    id: 'nowcast',
    number: '03',
    label: 'NOWCAST',
    title: 'Hyper-Local Prediction',
    description: 'Generate actionable severe-weather forecasts with 2–6 hour lead time.',
    image: '/workflow_predict.jpg',
    overlayLabel: 'ETA',
    overlayValue: '1h 45m'
  },
  {
    id: 'assess',
    number: '04',
    label: 'ASSESS',
    title: 'Risk & Impact',
    description: 'Estimate hazard intensity, affected areas, arrival time and model confidence.',
    image: '/impact_precision.jpg',
    overlayLabel: 'MODEL CONFIDENCE',
    overlayValue: '82%'
  },
  {
    id: 'act',
    number: '05',
    label: 'ACT',
    title: 'Public Warning',
    description: 'Turn validated weather intelligence into clear, timely and actionable warnings.',
    image: '/workflow_dispatch.jpg',
    overlayLabel: 'ACTION REQUIRED',
    overlayValue: 'DISPATCH'
  }
];

export default function ScrollStory() {
  const containerRef = useRef(null);
  const imagesRef = useRef([]);
  const textsRef = useRef([]);
  const dotsRef = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useLayoutEffect(() => {
    // Media query for reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const totalStates = STORY_STATES.length;
    
    // Set initial states for images and texts
    imagesRef.current.forEach((img, i) => {
      if (i === 0) {
        gsap.set(img, { xPercent: 0, opacity: 1, scale: 1, zIndex: 10 });
      } else {
        gsap.set(img, { xPercent: prefersReducedMotion ? 0 : -100, opacity: 0, scale: 0.98, zIndex: 1 });
      }
    });
    
    textsRef.current.forEach((txt, i) => {
      if (i === 0) {
        gsap.set(txt, { opacity: 1, y: 0 });
      } else {
        gsap.set(txt, { opacity: 0, y: 12 });
      }
    });

    // Create the ScrollTrigger Master Timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: () => "+=" + (window.innerHeight * 5), // 5 states
        pin: true,
        scrub: 1,
        onUpdate: (self) => {
          // Calculate active index based on scroll progress (0 to 1)
          const p = self.progress;
          // Split progress into chunks: 0-0.2 is state 0, 0.2-0.4 is state 1, etc.
          let newIndex = Math.floor(p * totalStates);
          if (newIndex >= totalStates) newIndex = totalStates - 1;
          
          setActiveIndex(prevIndex => prevIndex !== newIndex ? newIndex : prevIndex);
        }
      }
    });

    // Build the timeline animations for each transition
    for (let i = 0; i < totalStates - 1; i++) {
      const currentImg = imagesRef.current[i];
      const nextImg = imagesRef.current[i + 1];
      const currentTxt = textsRef.current[i];
      const nextTxt = textsRef.current[i + 1];

      // We add a label for snapping if we wanted to, or just to organize the timeline
      tl.addLabel(`step${i}`);

      // Setup the next image z-index so it appears OVER the previous one
      tl.set(nextImg, { zIndex: i + 11 }, `step${i}`);
      
      const tlStep = gsap.timeline();

      if (prefersReducedMotion) {
        // Simple crossfade for reduced motion
        tlStep.to(currentImg, { opacity: 0, duration: 1 }, 0)
              .to(nextImg, { opacity: 1, duration: 1 }, 0);
      } else {
        // Cinematic Slide Transition
        tlStep.to(currentImg, { 
                xPercent: -6, 
                scale: 0.97, 
                opacity: 0, 
                duration: 1,
                ease: "power2.inOut"
              }, 0)
              .to(nextImg, { 
                xPercent: 0, 
                scale: 1, 
                opacity: 1, 
                duration: 1,
                ease: "power2.inOut"
              }, 0);
      }

      // Text transition
      tlStep.to(currentTxt, { 
              opacity: 0, 
              y: -12, 
              duration: 0.5,
              ease: "power1.in"
            }, 0)
            .to(nextTxt, { 
              opacity: 1, 
              y: 0, 
              duration: 0.5,
              ease: "power1.out"
            }, 0.5);

      tl.add(tlStep, `step${i}`);
    }

    return () => {
      // Cleanup ScrollTrigger on unmount
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <section className="scroll-story-wrapper" ref={containerRef} id="how-it-works">
      <div className="scroll-story-container">
        
        {/* LEFT VISUAL SIDE */}
        <div className="story-visual-side">
          <div className="story-visual-container">
            {STORY_STATES.map((state, index) => (
              <div 
                key={`img-${state.id}`} 
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
            {STORY_STATES.map((state, index) => (
              <div 
                key={`txt-${state.id}`} 
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

          <div className="story-progress-indicator">
            {STORY_STATES.map((state, index) => (
              <React.Fragment key={`dot-${state.id}`}>
                <div 
                  className={`progress-dot ${activeIndex === index ? 'active' : ''}`} 
                  ref={el => dotsRef.current[index] = el}
                  aria-label={`Step ${index + 1}`}
                />
                {index < STORY_STATES.length - 1 && (
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
