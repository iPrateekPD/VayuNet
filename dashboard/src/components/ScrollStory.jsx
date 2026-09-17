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
        // Next images are positioned off-screen to the left, fully opaque, ready to slide in over the current one
        gsap.set(img, { xPercent: prefersReducedMotion ? 0 : -105, opacity: prefersReducedMotion ? 0 : 1, scale: 1, zIndex: 10 + i });
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
        scrub: 0.8, // 0.8 scrub provides natural smoothing without lagging
        onUpdate: (self) => {
          // Calculate active index based on scroll progress (0 to 1)
          const p = self.progress;
          // Split progress into chunks
          let newIndex = Math.floor(p * totalStates);
          if (newIndex >= totalStates) newIndex = totalStates - 1;
          
          setActiveIndex(prevIndex => prevIndex !== newIndex ? newIndex : prevIndex);
        }
      }
    });

    // Build the timeline animations for each transition
    // A single scroll segment has a conceptual duration of 1.
    // 0.0 - 0.35: Hold
    // 0.35 - 0.65: Transition
    // 0.65 - 1.0: Hold
    
    for (let i = 0; i < totalStates - 1; i++) {
      const currentImg = imagesRef.current[i];
      const nextImg = imagesRef.current[i + 1];
      const currentTxt = textsRef.current[i];
      const nextTxt = textsRef.current[i + 1];

      const startTime = i + 0.35;
      const transitionDuration = 0.30;
      
      if (prefersReducedMotion) {
        // Simple crossfade for reduced motion
        tl.to(currentImg, { opacity: 0, duration: transitionDuration }, startTime)
          .to(nextImg, { opacity: 1, duration: transitionDuration }, startTime);
      } else {
        // Cinematic Physical Slide Transition
        // Outgoing moves slightly left and back
        tl.to(currentImg, { 
          xPercent: -6, 
          scale: 0.985, 
          opacity: 0.8, 
          duration: transitionDuration,
          ease: "none"
        }, startTime);

        // Incoming enters completely from the left
        tl.to(nextImg, { 
          xPercent: 0, 
          scale: 1, 
          opacity: 1, 
          duration: transitionDuration,
          ease: "none"
        }, startTime);
      }

      // Text transition: 
      // Image transition takes 0.30. 45% into transition = 0.30 * 0.45 = ~0.135
      // Text fades out starting at +0.135, taking 0.07 (ends at +0.205)
      // Text fades in starting at +0.205, taking 0.095 (ends at +0.30)
      const textFadeOutStart = startTime + 0.135;
      const textFadeOutDuration = 0.07;
      const textFadeInStart = textFadeOutStart + textFadeOutDuration;
      const textFadeInDuration = transitionDuration - (0.135 + textFadeOutDuration); // ~0.095

      tl.to(currentTxt, { 
        opacity: 0, 
        y: -12, 
        duration: textFadeOutDuration,
        ease: "none"
      }, textFadeOutStart);

      tl.to(nextTxt, { 
        opacity: 1, 
        y: 0, 
        duration: textFadeInDuration,
        ease: "none"
      }, textFadeInStart);
      
      // Ensure the timeline spans all the way to i + 1 even if the last animation ended at i + 0.65
      // by inserting a dummy set if necessary, though GSAP automatically pads if we just let the loop continue.
      tl.set({}, {}, i + 1);
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
