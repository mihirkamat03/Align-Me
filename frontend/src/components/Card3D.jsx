import React, { useRef, useState } from 'react';

/**
 * Card3D
 * An interactive 3D physical glass card with:
 * - Real-time perspective tilt matching mouse cursor position
 * - Dynamic specular light sheen layer that follows the light angle
 * - Multi-layered 3D depth shadows and beveled edge illumination
 */
export default function Card3D({ children, className = '', maxTilt = 6, ...props }) {
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [sheenPos, setSheenPos] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1; // -1 to 1
    const normY = (y / rect.height) * 2 - 1; // -1 to 1

    setTilt({
      x: -normY * maxTilt,
      y: normX * maxTilt
    });

    setSheenPos({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.22
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setSheenPos((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      style={{ perspective: '1100px' }}
      className="relative"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.x.toFixed(2)}deg) rotateY(${tilt.y.toFixed(2)}deg)`,
          transformStyle: 'preserve-3d',
          transition: tilt.x === 0 && tilt.y === 0
            ? 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s ease'
            : 'transform 0.08s ease-out, box-shadow 0.2s ease'
        }}
        className={`card-3d relative overflow-hidden ${className}`}
        {...props}
      >
        {/* Dynamic Specular Sheen Reflection Layer */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 -z-0"
          style={{
            background: `radial-gradient(circle 320px at ${sheenPos.x}% ${sheenPos.y}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 241, 242, 0.25) 40%, transparent 80%)`,
            opacity: sheenPos.opacity
          }}
        />

        {/* Content with Z-Depth separation */}
        <div className="relative z-10" style={{ transform: 'translateZ(12px)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
