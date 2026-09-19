import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture, Stars } from '@react-three/drei';
import * as THREE from 'three';

// Custom Fresnel shader for atmospheric glow
const AtmosphereShader = {
  uniforms: {
    c: { type: 'f', value: 0.6 },
    p: { type: 'f', value: 3.5 },
    glowColor: { type: 'c', value: new THREE.Color(0x38bdf8) },
    viewVector: { type: 'v3', value: new THREE.Vector3(0, 0, 5) },
  },
  vertexShader: `
    uniform vec3 viewVector;
    uniform float c;
    uniform float p;
    varying float intensity;
    void main() {
      vec3 vNormal = normalize( normalMatrix * normal );
      vec3 vNormel = normalize( normalMatrix * viewVector );
      intensity = pow( c - dot(vNormal, vNormel), p );
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,
  fragmentShader: `
    uniform vec3 glowColor;
    varying float intensity;
    void main() {
      vec3 glow = glowColor * intensity;
      gl_FragColor = vec4( glow, 1.0 );
    }
  `,
  side: THREE.BackSide,
  blending: THREE.AdditiveBlending,
  transparent: true,
};

export default function EarthScene({ earthGroupRef, earthRef }) {
  const [colorMap, bumpMap, specularMap, cloudsMap] = useTexture([
    '/assets/earth/earth-blue-marble.jpg',
    '/assets/earth/earth-topology.png',
    '/assets/earth/earth-water.png',
    '/assets/earth/earth-clouds.png'
  ]);

  const cloudsRef = useRef();
  const glowRef = useRef();

  useFrame((state, delta) => {
    if (earthRef.current) {
      earthRef.current.rotation.y += delta * 0.05;
    }
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.055; // Clouds move slightly faster
    }
    if (glowRef.current && glowRef.current.material.uniforms) {
      glowRef.current.material.uniforms.viewVector.value = new THREE.Vector3().subVectors(state.camera.position, glowRef.current.position);
    }
  });

  return (
    <>
      {/* Deep Space Stars */}
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Sun Light - Positioned to illuminate India nicely during the zoom */}
      <directionalLight position={[5, 2, 5]} intensity={2.5} color="#ffffff" />
      <ambientLight intensity={0.1} color="#0f172a" />

      <group ref={earthGroupRef}>
        {/* Core Earth Mesh */}
        <mesh ref={earthRef}>
          <sphereGeometry args={[1, 64, 64]} />
          <meshStandardMaterial 
            map={colorMap}
            bumpMap={bumpMap}
            bumpScale={0.015}
            roughnessMap={specularMap}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>

        {/* Cloud Layer */}
        <mesh ref={cloudsRef}>
          <sphereGeometry args={[1.01, 64, 64]} />
          <meshStandardMaterial 
            map={cloudsMap}
            transparent={true}
            opacity={0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Atmospheric Glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[1.1, 64, 64]} />
          <shaderMaterial 
            attach="material"
            args={[AtmosphereShader]}
            transparent
            depthWrite={false}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </>
  );
}
