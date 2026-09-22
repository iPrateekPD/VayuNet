import React, { useRef } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

export default function TerrainScene({ terrainGroupRef, terrainMaterialRef }) {
  const [colorMap, topologyMap] = useTexture([
    '/assets/earth/earth-blue-marble.jpg',
    '/assets/earth/earth-topology.png'
  ]);

  return (
    <group ref={terrainGroupRef}>
      <mesh>
        {/* High segment count for physical vertex displacement */}
        <sphereGeometry args={[1.005, 512, 512]} />
        <meshStandardMaterial 
          ref={terrainMaterialRef}
          map={colorMap}
          displacementMap={topologyMap}
          displacementScale={0.15} // Physically extrude the mountains
          roughness={1.0}
          metalness={0.0}
          transparent={true}
          opacity={0} // Initially hidden, GSAP fades this in
          // A dark greenish/earthy tint to differentiate from the base Earth
          color="#a3e635" 
        />
      </mesh>
    </group>
  );
}
