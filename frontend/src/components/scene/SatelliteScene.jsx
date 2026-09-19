import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function SatelliteScene({ satGroupRef }) {
  const meshRef = useRef(null);
  const solarPanelsRef = useRef(null);

  // Slow continuous rotation of the satellite and subtle tracking for panels
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.z += delta * 0.05;
    }
  });

  return (
    <group ref={satGroupRef}>
      <group ref={meshRef}>
        
        {/* Main Body (Gold Foil) */}
        <mesh>
          <boxGeometry args={[0.6, 0.6, 0.6]} />
          <meshStandardMaterial 
            color="#fbbf24" // Gold
            metalness={0.9}
            roughness={0.3}
            bumpScale={0.02}
          />
        </mesh>
        <mesh>
          <boxGeometry args={[0.62, 0.62, 0.62]} />
          <meshStandardMaterial 
            color="#f59e0b"
            wireframe={true}
            transparent={true}
            opacity={0.3}
          />
        </mesh>

        {/* Sensor Payload / Base */}
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Solar Panels */}
        <group ref={solarPanelsRef}>
          {/* Left Panel */}
          <mesh position={[-1.2, 0, 0]}>
            <boxGeometry args={[1.6, 0.8, 0.05]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Right Panel */}
          <mesh position={[1.2, 0, 0]}>
            <boxGeometry args={[1.6, 0.8, 0.05]} />
            <meshStandardMaterial color="#1e3a8a" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Connectors */}
          <mesh position={[-0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            <meshStandardMaterial color="#475569" metalness={1} roughness={0.2} />
          </mesh>
          <mesh position={[0.4, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
            <meshStandardMaterial color="#475569" metalness={1} roughness={0.2} />
          </mesh>
        </group>

        {/* Communication Dish */}
        <mesh position={[0, 0.4, 0]} rotation={[Math.PI / 6, 0, 0]}>
          <cylinderGeometry args={[0.4, 0.05, 0.1, 16]} />
          <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.5} />
        </mesh>

        {/* Antenna */}
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.01, 0.01, 0.6, 8]} />
          <meshStandardMaterial color="#cbd5e1" metalness={1} roughness={0.1} />
        </mesh>

      </group>
      
      {/* Observation Data Beam pointing towards Earth */}
      <mesh position={[-2, -2, -2]} rotation={[Math.PI/4, Math.PI/4, 0]}>
         <cylinderGeometry args={[0.01, 0.05, 10, 8]} />
         <meshBasicMaterial color="#38bdf8" transparent={true} opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}
