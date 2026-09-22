import React, { useEffect, useRef, useState } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const PARTICLE_COUNT = window.innerWidth < 768 ? 800 : 2000;
const PARTICLE_MAX_AGE = 60;
const PARTICLE_MULTIPLIER = 0.5;
const FADE_OPACITY = 0.92; // 0.92 leaves trails, 1.0 removes trails

function createParticles(width, height, count) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      age: Math.floor(Math.random() * PARTICLE_MAX_AGE)
    });
  }
  return particles;
}

function bilinearInterpolate(x, y, g00, g10, g01, g11) {
  const rx = x - Math.floor(x);
  const ry = y - Math.floor(y);
  
  const top = g00 * (1 - rx) + g10 * rx;
  const bottom = g01 * (1 - rx) + g11 * rx;
  
  return top * (1 - ry) + bottom * ry;
}

export default function WindOverlay({ enabled, onDataStatus }) {
  const map = useMap();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const gridRef = useRef(null);
  const particlesRef = useRef([]);
  const abortControllerRef = useRef(null);
  
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    const handler = (e) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }

    // Initialize Canvas
    const mapContainer = map.getContainer();
    let canvas = canvasRef.current;
    
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '400';
      canvas.className = 'wind-overlay-canvas';
      mapContainer.appendChild(canvas);
      canvasRef.current = canvas;
    }

    const resizeCanvas = () => {
      if (!canvas) return;
      const size = map.getSize();
      canvas.width = size.x;
      canvas.height = size.y;
      particlesRef.current = createParticles(size.x, size.y, PARTICLE_COUNT);
    };
    resizeCanvas();

    const fetchWindField = async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const bounds = map.getBounds();
        // Add slight padding to bounds so particles don't disappear exactly at edge
        const pad = 0.5;
        const n = bounds.getNorth() + pad;
        const s = bounds.getSouth() - pad;
        const e = bounds.getEast() + pad;
        const w = bounds.getWest() - pad;

        const res = await fetch(
          `/api/weather/wind-field?north=${n}&south=${s}&east=${e}&west=${w}&resolution=12`,
          { signal: abortControllerRef.current.signal }
        );
        
        if (!res.ok) throw new Error('Wind field fetch failed');
        const data = await res.json();
        
        // Transform grid data for easy Canvas lookup
        const grid = data.grid;
        const latStep = (n - s) / 11;
        const lonStep = (e - w) / 11;
        
        gridRef.current = {
          u: grid.u,
          v: grid.v,
          latitudes: grid.latitudes,
          longitudes: grid.longitudes,
          s, n, w, e, latStep, lonStep,
          timestamp: data.timestamp
        };
        
        if (onDataStatus) onDataStatus('live', data.timestamp);
        
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error("Failed to load wind field", err);
          gridRef.current = null;
          if (onDataStatus) onDataStatus('unavailable', null);
        }
      }
    };

    fetchWindField();

    let timeout;
    const handleMoveEnd = () => {
      clearTimeout(timeout);
      timeout = setTimeout(fetchWindField, 500); // Debounce
      resizeCanvas(); // Reset particles on screen resize/pan
    };

    map.on('moveend', handleMoveEnd);
    map.on('resize', handleMoveEnd);

    // Animation Loop
    const draw = () => {
      if (!canvasRef.current) return;
      const ctx = canvasRef.current.getContext('2d');
      const width = canvasRef.current.width;
      const height = canvasRef.current.height;

      // Fade existing trails
      ctx.fillStyle = `rgba(0, 0, 0, ${1 - FADE_OPACITY})`;
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillRect(0, 0, width, height);
      ctx.globalCompositeOperation = 'source-over';

      const grid = gridRef.current;
      if (grid && !reducedMotion) {
        ctx.lineWidth = 1.5;
        // White with slight blue tint
        ctx.strokeStyle = 'rgba(240, 248, 255, 0.8)';
        ctx.beginPath();

        particlesRef.current.forEach(p => {
          if (p.age > PARTICLE_MAX_AGE) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.age = 0;
          }

          // Project pixel to LatLng
          const latLng = map.containerPointToLatLng(L.point(p.x, p.y));
          
          // Map LatLng to Grid Indices
          // Latitude array goes from south to north (0 to 11)
          // Longitude array goes from west to east (0 to 11)
          const fi = (latLng.lat - grid.s) / grid.latStep;
          const fj = (latLng.lng - grid.w) / grid.lonStep;

          if (fi >= 0 && fi < 11 && fj >= 0 && fj < 11) {
            const i0 = Math.floor(fi);
            const j0 = Math.floor(fj);
            const i1 = i0 + 1;
            const j1 = j0 + 1;
            
            // Bilinear interpolation for U and V
            const u = bilinearInterpolate(fj, fi, grid.u[i0][j0], grid.u[i0][j1], grid.u[i1][j0], grid.u[i1][j1]);
            const v = bilinearInterpolate(fj, fi, grid.v[i0][j0], grid.v[i0][j1], grid.v[i1][j0], grid.v[i1][j1]);
            
            // u is East/West (m/s), v is North/South (m/s)
            // On screen, x increases to East, y increases to South (inverted lat)
            // So pixel dy = -v
            const dx = u * PARTICLE_MULTIPLIER;
            const dy = -v * PARTICLE_MULTIPLIER;

            ctx.moveTo(p.x, p.y);
            p.x += dx;
            p.y += dy;
            ctx.lineTo(p.x, p.y);
            p.age++;
          } else {
            p.age = PARTICLE_MAX_AGE + 1; // force respawn
          }
        });
        
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };
    
    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (timeout) clearTimeout(timeout);
      map.off('moveend', handleMoveEnd);
      map.off('resize', handleMoveEnd);
      if (canvasRef.current && mapContainer.contains(canvasRef.current)) {
        mapContainer.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
    };
  }, [map, enabled, reducedMotion]);

  return null;
}
