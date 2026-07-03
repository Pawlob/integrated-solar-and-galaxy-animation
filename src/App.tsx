/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment } from '@react-three/drei';

function Scene({ position, scale }: { position: [number, number, number]; scale: number }) {
  const { scene } = useGLTF('/earth_with_moon12.glb');
  return <primitive object={scene} position={position} scale={scale} />;
}

export default function App() {
  const [scale, setScale] = useState(window.innerWidth < 768 ? 1.95 : 2.58);

  useEffect(() => {
    const handleResize = () => {
      setScale(window.innerWidth < 768 ? 1.95 : 2.58);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#0a0a0a] overflow-hidden font-sans">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0 cursor-move">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <directionalLight position={[5, 3, 5]} intensity={2} />
          <Suspense fallback={null}>
            <Scene position={[0, -2.2, 0]} scale={scale} />
            <Environment preset="city" />
          </Suspense>
          <OrbitControls 
            autoRotate 
            autoRotateSpeed={0.5} 
            enableDamping 
            enablePan={false} 
            enableZoom={false}
            minPolarAngle={Math.PI / 2}
            maxPolarAngle={Math.PI / 2}
          />
        </Canvas>
      </div>

      {/* Foreground Text */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="text-center space-y-4 px-6">
          <h1 className="text-5xl md:text-7xl font-semibold text-white tracking-tighter drop-shadow-2xl">
            Orbital View
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto drop-shadow-lg font-light tracking-wide">
            A beautiful glimpse of our home planet and its lunar companion in the vastness of space.
          </p>
        </div>
      </div>
    </div>
  );
}

