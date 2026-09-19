import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import EarthScene from './scene/EarthScene';
import SatelliteScene from './scene/SatelliteScene';
import AtmosphereScene from './scene/AtmosphereScene';
import TerrainScene from './scene/TerrainScene';

gsap.registerPlugin(ScrollTrigger);

export default function CinematicDataJourney({ onEnterPortal, onOpenPublicWarnings }) {
  const [sceneReady, setSceneReady] = useState(false);
  const containerRef = useRef(null);
  const earthGroupRef = useRef(null);
  const earthRef = useRef(null);
  const satGroupRef = useRef(null);
  
  // New Refs for Phase 3 & 4
  const atmoGroupRef = useRef(null);
  const atmoMaterialRef = useRef(null);
  const terrainGroupRef = useRef(null);
  const terrainMaterialRef = useRef(null);
  
  const uiLayerRef = useRef(null);

  useEffect(() => {
    // 1. Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    // Integrate Lenis with GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    if (!sceneReady) return;

    // 2. Setup GSAP Timelines for Camera/Earth Choreography
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1, // Smooth scrubbing
        }
      });

      // Initially earth is small and far
      if (earthGroupRef.current) {
        gsap.set(earthGroupRef.current.position, { z: -10, y: -2 });
        gsap.set(earthGroupRef.current.scale, { x: 0.5, y: 0.5, z: 0.5 });
      }

      // Initially satellite is out of frame on the right
      if (satGroupRef.current) {
        gsap.set(satGroupRef.current.position, { x: 10, y: 0, z: -5 });
        gsap.set(satGroupRef.current.scale, { x: 0.1, y: 0.1, z: 0.1 });
      }

      if (atmoGroupRef.current && terrainGroupRef.current) {
        gsap.set(atmoGroupRef.current.position, { z: -10, y: -2 });
        gsap.set(atmoGroupRef.current.scale, { x: 0.5, y: 0.5, z: 0.5 });
        gsap.set(terrainGroupRef.current.position, { z: -10, y: -2 });
        gsap.set(terrainGroupRef.current.scale, { x: 0.5, y: 0.5, z: 0.5 });
      }

      // 0-20% scroll: Earth slowly approaches
      tl.to([earthGroupRef.current.position, atmoGroupRef.current.position, terrainGroupRef.current.position], {
        z: -5,
        y: 0,
        ease: 'power1.inOut'
      }, 0);
      
      tl.to([earthGroupRef.current.scale, atmoGroupRef.current.scale, terrainGroupRef.current.scale], {
        x: 1,
        y: 1,
        z: 1,
        ease: 'power1.inOut'
      }, 0);

      // 20-45% scroll: Zoom into India
      tl.to([earthGroupRef.current.position, atmoGroupRef.current.position, terrainGroupRef.current.position], {
        z: 2,
        x: -1,
        y: -1,
        ease: 'power2.inOut'
      }, 0.2);

      tl.to([earthGroupRef.current.rotation, atmoGroupRef.current.rotation, terrainGroupRef.current.rotation], {
        x: 0.2,
        y: -0.5, // Rotate to face India
        ease: 'power2.inOut'
      }, 0.2);
      
      // UI Fade out the Hero text at 20%
      tl.to('.hero-text-overlay', {
        opacity: 0,
        y: -50,
        duration: 0.1
      }, 0.15);

      // UI Fade in India Data at 40%
      tl.to('.india-data-overlay', {
        opacity: 1,
        y: 0,
        duration: 0.1
      }, 0.4);

      // 50-70% scroll: Camera pulls back, Earth moves left, Satellite enters from right
      tl.to('.india-data-overlay', {
        opacity: 0,
        y: -20,
        duration: 0.1
      }, 0.5);

      tl.to([earthGroupRef.current.position, atmoGroupRef.current.position, terrainGroupRef.current.position], {
        z: -8,
        x: -3,
        y: 0,
        ease: 'power2.inOut'
      }, 0.5);

      tl.to([earthGroupRef.current.rotation, atmoGroupRef.current.rotation, terrainGroupRef.current.rotation], {
        x: 0,
        y: 0,
        ease: 'power2.inOut'
      }, 0.5);

      if (satGroupRef.current) {
        tl.to(satGroupRef.current.position, {
          x: 2,
          y: 0,
          z: 0,
          ease: 'power2.out'
        }, 0.6);

        tl.to(satGroupRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          ease: 'power2.out'
        }, 0.6);
      }

      // UI Fade in Satellite Data at 70%
      tl.to('.satellite-data-overlay', {
        opacity: 1,
        x: 0,
        duration: 0.1
      }, 0.65);

      // 75-85% scroll: IMDAA Atmosphere Transition
      tl.to('.satellite-data-overlay', {
        opacity: 0,
        x: 20,
        duration: 0.1
      }, 0.75);

      if (satGroupRef.current) {
        tl.to(satGroupRef.current.position, {
          x: 10,
          y: 5,
          ease: 'power2.in'
        }, 0.75);
      }

      // Center Earth again
      tl.to([earthGroupRef.current.position, atmoGroupRef.current.position, terrainGroupRef.current.position], {
        x: 0,
        z: -5,
        ease: 'power2.inOut'
      }, 0.75);

      if (atmoMaterialRef.current) {
        tl.to(atmoMaterialRef.current, {
          opacity: 0.8,
          ease: 'power1.inOut'
        }, 0.78);
      }

      tl.to('.imdaa-data-overlay', {
        opacity: 1,
        x: 0,
        duration: 0.1
      }, 0.82);

      // 88-100% scroll: CartoDEM Terrain Transition
      tl.to('.imdaa-data-overlay', {
        opacity: 0,
        x: 20,
        duration: 0.1
      }, 0.88);

      if (atmoMaterialRef.current) {
        tl.to(atmoMaterialRef.current, {
          opacity: 0,
          ease: 'power1.inOut'
        }, 0.88);
      }

      if (terrainMaterialRef.current) {
        tl.to(terrainMaterialRef.current, {
          opacity: 0.9,
          ease: 'power1.inOut'
        }, 0.9);
      }

      // Rotate camera downward (simulated by rotating Earth upward)
      tl.to([earthGroupRef.current.rotation, atmoGroupRef.current.rotation, terrainGroupRef.current.rotation], {
        x: 0.8, // Tilt down to look at terrain
        ease: 'power2.inOut'
      }, 0.9);

      // Zoom into terrain
      tl.to([earthGroupRef.current.position, atmoGroupRef.current.position, terrainGroupRef.current.position], {
        z: 0,
        y: 2,
        ease: 'power2.inOut'
      }, 0.9);

      tl.to('.terrain-data-overlay', {
        opacity: 1,
        y: 0,
        duration: 0.1
      }, 0.95);

    }, containerRef.current);

    return () => {
      ctx.revert();
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, [sceneReady]);

function SceneReadyReporter({ setSceneReady }) {
  useEffect(() => {
    setSceneReady(true);
  }, [setSceneReady]);
  return null;
}

  return (
    <div ref={containerRef} className="cinematic-container" style={{ height: '1400vh', position: 'relative' }}>
      
      {/* Fixed WebGL Canvas */}
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <React.Suspense fallback={null}>
            <EarthScene earthGroupRef={earthGroupRef} earthRef={earthRef} />
            <AtmosphereScene atmoGroupRef={atmoGroupRef} atmoMaterialRef={atmoMaterialRef} />
            <TerrainScene terrainGroupRef={terrainGroupRef} terrainMaterialRef={terrainMaterialRef} />
            <SatelliteScene satGroupRef={satGroupRef} />
            <SceneReadyReporter setSceneReady={setSceneReady} />
          </React.Suspense>
        </Canvas>
      </div>

      {/* Scrollable DOM Overlay */}
      <div ref={uiLayerRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 10, pointerEvents: 'none' }}>
        
        {/* Intro Space text */}
        <div className="hero-text-overlay" style={{
          position: 'fixed', top: '40%', left: '10%', color: 'white', maxWidth: '600px'
        }}>
          <h1 style={{ fontSize: '4rem', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '1rem', fontFamily: 'var(--font-sans)', letterSpacing: '-0.02em' }}>
            VAYUNET <br/>
            <span style={{ color: '#38bdf8' }}>WEATHER INTELLIGENCE</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#94a3b8', letterSpacing: '0.1em' }}>FOR A SAFER INDIA</p>
          <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', pointerEvents: 'auto' }}>
             <button onClick={onEnterPortal} style={{ padding: '12px 24px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
               Enter Operations Portal →
             </button>
             <button onClick={onOpenPublicWarnings} style={{ padding: '12px 24px', background: 'transparent', color: '#38bdf8', border: '1px solid #38bdf8', borderRadius: '4px', cursor: 'pointer' }}>
               View Public Warnings ↗
             </button>
          </div>
        </div>

        {/* India Hover Data (Hidden initially) */}
        <div className="india-data-overlay" style={{
          position: 'fixed', top: '30%', right: '10%', color: 'white', maxWidth: '300px', opacity: 0, transform: 'translateY(20px)'
        }}>
          <div style={{ padding: '20px', background: 'rgba(11, 18, 32, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid #263449', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '0.8rem', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '15px' }}>INDIA / NOWCAST</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span>CONVECTIVE ACTIVITY</span>
              <span style={{ color: '#f87171' }}>82%</span>
            </div>
            <div style={{ width: '100%', height: '4px', background: '#1e293b', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ width: '82%', height: '100%', background: '#f87171' }}></div>
            </div>
            <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#cbd5e1' }}>
              Expected +2h: 16:30 IST
            </div>
          </div>
        </div>

        {/* Satellite Info (Hidden initially) */}
        <div className="satellite-data-overlay" style={{
          position: 'fixed', top: '30%', left: '10%', color: 'white', maxWidth: '400px', opacity: 0, transform: 'translateX(-20px)'
        }}>
          <h2 style={{ fontSize: '1rem', color: '#38bdf8', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>01 / OBSERVE</h2>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '15px' }}>
            INSAT-3D / 3DR
          </h1>
          <p style={{ fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: '25px' }}>
            Geostationary meteorological satellite providing high-resolution imaging and atmospheric data for weather monitoring and disaster warning.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '1rem', color: '#cbd5e1' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>◆</span> Multi-spectral Imaging</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>◆</span> Atmospheric Sounding</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>◆</span> Cyclone Monitoring</div>
             <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><span style={{ color: '#0ea5e9' }}>◆</span> Real-time Observation</div>
          </div>
        </div>

        {/* IMDAA Atmosphere Info (Hidden initially) */}
        <div className="imdaa-data-overlay" style={{
          position: 'fixed', top: '30%', right: '10%', color: 'white', maxWidth: '400px', opacity: 0, transform: 'translateX(20px)'
        }}>
          <h2 style={{ fontSize: '1rem', color: '#34d399', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>02 / ATMOSPHERE</h2>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '15px' }}>
            IMDAA
          </h1>
          <h3 style={{ fontSize: '1rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>NCMRWF Atmospheric Reanalysis</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', padding: '20px', background: 'rgba(11, 18, 32, 0.8)', backdropFilter: 'blur(10px)', border: '1px solid #263449', borderRadius: '8px' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>TEMPERATURE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#f87171' }}>27.4 °C</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>CAPE</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>1,982 J/kg</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>RH</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#38bdf8' }}>74%</div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '5px' }}>WIND</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#cbd5e1' }}>18 km/h</div>
            </div>
          </div>
        </div>

        {/* CartoDEM Terrain Info (Hidden initially) */}
        <div className="terrain-data-overlay" style={{
          position: 'fixed', bottom: '10%', left: '10%', color: 'white', maxWidth: '500px', opacity: 0, transform: 'translateY(20px)'
        }}>
          <h2 style={{ fontSize: '1rem', color: '#4ade80', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>03 / TERRAIN</h2>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', lineHeight: 1.1, marginBottom: '10px' }}>
            CartoDEM
          </h1>
          <h3 style={{ fontSize: '1.2rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '20px' }}>ISRO / BHUVAN DIGITAL ELEVATION MODEL</h3>
          <p style={{ fontSize: '1.1rem', color: '#cbd5e1', lineHeight: 1.6 }}>
            High-resolution 30m posting terrain intelligence enabling terrain-aware risk analysis, flood modeling, and landslide susceptibility mapping across the Himalayas and coastal plains.
          </p>
        </div>

      </div>
    </div>
  );
}
