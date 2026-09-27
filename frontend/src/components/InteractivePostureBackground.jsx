import React, { useEffect, useRef } from 'react';

/**
 * InteractivePostureBackground
 * Renders a high-performance interactive biomechanical canvas background:
 * - Fluid undulating spinal contour curves (kyphosis/lordosis wave ribbons)
 * - Radiant warm sunset orange & rose pink light orbs that smoothly track the cursor
 * - Optical alignment crosshair markers that react to cursor proximity
 * - Responsive to mouse velocity and position with smooth spring lerp damping
 */
export default function InteractivePostureBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse coordinates with smooth lerp physics
    const mouse = {
      x: width * 0.5,
      y: height * 0.35,
      targetX: width * 0.5,
      targetY: height * 0.35,
      radius: 280,
      active: true
    };

    // Responsive resize handler with high DPI
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.active = true;
    };
    window.addEventListener('mousemove', handleMouseMove);

    // Floating glowing orbs data (rich radiant pink & warm sunset orange)
    const orbs = [
      {
        baseX: 0.22,
        baseY: 0.18,
        currentX: width * 0.22,
        currentY: height * 0.18,
        r: 520,
        colorStart: 'rgba(251, 146, 60, 0.38)', // sunset orange
        colorEnd: 'rgba(249, 115, 22, 0.0)',
        speedX: 0.0008,
        speedY: 0.0012,
        phase: 0,
        parallax: 0.10
      },
      {
        baseX: 0.78,
        baseY: 0.22,
        currentX: width * 0.78,
        currentY: height * 0.22,
        r: 580,
        colorStart: 'rgba(244, 63, 94, 0.36)', // rose pink
        colorEnd: 'rgba(244, 63, 94, 0.0)',
        speedX: 0.0011,
        speedY: 0.0009,
        phase: Math.PI * 0.5,
        parallax: 0.14
      },
      {
        baseX: 0.5,
        baseY: 0.60,
        currentX: width * 0.5,
        currentY: height * 0.60,
        r: 520,
        colorStart: 'rgba(251, 113, 133, 0.32)', // blush coral
        colorEnd: 'rgba(255, 241, 242, 0.0)',
        speedX: 0.0007,
        speedY: 0.001,
        phase: Math.PI,
        parallax: 0.08
      },
      {
        baseX: 0.88,
        baseY: 0.78,
        currentX: width * 0.88,
        currentY: height * 0.78,
        r: 480,
        colorStart: 'rgba(249, 115, 22, 0.30)', // warm amber
        colorEnd: 'rgba(249, 115, 22, 0.0)',
        speedX: 0.0009,
        speedY: 0.0008,
        phase: Math.PI * 1.5,
        parallax: 0.12
      }
    ];

    // Biomechanical spinal wave lines
    const lineCount = 9;
    let time = 0;

    const render = () => {
      time += 0.015;

      // Smooth mouse interpolation (lerp)
      mouse.x += (mouse.targetX - mouse.x) * 0.06;
      mouse.y += (mouse.targetY - mouse.y) * 0.06;

      // Clean canvas
      ctx.clearRect(0, 0, width, height);

      // 1. Draw glowing radiant fluid orbs
      orbs.forEach((orb) => {
        // Natural organic harmonic drift
        const driftX = Math.sin(time * orb.speedX * 100 + orb.phase) * 60;
        const driftY = Math.cos(time * orb.speedY * 100 + orb.phase) * 45;

        // Interactive cursor gravity & parallax
        const cursorOffsetX = (mouse.x - width * 0.5) * orb.parallax;
        const cursorOffsetY = (mouse.y - height * 0.5) * orb.parallax;

        const targetX = width * orb.baseX + driftX + cursorOffsetX;
        const targetY = height * orb.baseY + driftY + cursorOffsetY;

        orb.currentX += (targetX - orb.currentX) * 0.05;
        orb.currentY += (targetY - orb.currentY) * 0.05;

        const gradient = ctx.createRadialGradient(
          orb.currentX,
          orb.currentY,
          0,
          orb.currentX,
          orb.currentY,
          orb.r
        );
        gradient.addColorStop(0, orb.colorStart);
        gradient.addColorStop(0.5, orb.colorStart.replace(/[\d\.]+\)$/, '0.08)'));
        gradient.addColorStop(1, orb.colorEnd);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(orb.currentX, orb.currentY, orb.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // 2. Cursor aura highlight (diffuse lens follower)
      const cursorGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        0,
        mouse.x,
        mouse.y,
        340
      );
      cursorGlow.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      cursorGlow.addColorStop(0.25, 'rgba(251, 146, 60, 0.22)');
      cursorGlow.addColorStop(0.55, 'rgba(244, 63, 94, 0.14)');
      cursorGlow.addColorStop(1, 'transparent');

      ctx.fillStyle = cursorGlow;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, 340, 0, Math.PI * 2);
      ctx.fill();

      // 3. Draw Biomechanical Spinal Curvature Contours
      // Each line represents a layer of postural kinematics
      const step = 20; // horizontal sampling resolution
      const baseY = height * 0.45;

      for (let i = 0; i < lineCount; i++) {
        const lineOffset = (i - lineCount / 2) * 44;
        const progress = i / (lineCount - 1); // 0 to 1

        ctx.beginPath();
        let isFirst = true;

        for (let x = 0; x <= width + step; x += step) {
          // Autonomous biomechanical undulating wave
          const wave1 = Math.sin(x * 0.0022 + time * 0.6 + i * 0.35) * 22;
          const wave2 = Math.cos(x * 0.0045 - time * 0.4 + i * 0.2) * 12;

          // Mouse deformation: lines bow gracefully toward/away from the cursor
          const distToMouse = Math.hypot(x - mouse.x, baseY + lineOffset - mouse.y);
          const mouseInfluenceRadius = 260;
          let mouseDeform = 0;

          if (distToMouse < mouseInfluenceRadius) {
            const factor = Math.cos((distToMouse / mouseInfluenceRadius) * (Math.PI / 2));
            const dy = mouse.y - (baseY + lineOffset);
            // Elastic deflection
            mouseDeform = dy * factor * 0.35 * (1 - progress * 0.2);
          }

          const y = baseY + lineOffset + wave1 + wave2 + mouseDeform;

          if (isFirst) {
            ctx.moveTo(x, y);
            isFirst = false;
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Line color transition: sunset coral -> vibrant rose pink
        const alpha = 0.20 + Math.sin(time + i * 0.5) * 0.08;
        const strokeColor = i % 2 === 0
          ? `rgba(244, 63, 94, ${alpha.toFixed(3)})` // rose pink
          : `rgba(249, 115, 22, ${alpha.toFixed(3)})`; // sunset orange

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = i === 4 ? 2.6 : 1.6; // center spinal line is slightly thicker
        ctx.stroke();
      }

      // 4. Subtle Optical Alignment Sensor Points (Grid Matrix with Cursor Proximity Reaction)
      const gridSpacing = 85;
      const startX = (width % gridSpacing) * 0.5;
      const startY = (height % gridSpacing) * 0.5;

      for (let gx = startX; gx < width; gx += gridSpacing) {
        for (let gy = startY; gy < height; gy += gridSpacing) {
          const dx = gx - mouse.x;
          const dy = gy - mouse.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 220) {
            // Point activates when cursor approaches
            const proximity = 1 - dist / 220;
            const shiftX = (dx / dist) * proximity * 8;
            const shiftY = (dy / dist) * proximity * 8;

            ctx.fillStyle = `rgba(244, 63, 94, ${(proximity * 0.35).toFixed(3)})`;
            ctx.beginPath();
            ctx.arc(gx + shiftX, gy + shiftY, 1.8 + proximity * 1.5, 0, Math.PI * 2);
            ctx.fill();

            // Connect nearby points to cursor if very close
            if (dist < 100) {
              ctx.strokeStyle = `rgba(249, 115, 22, ${(0.15 * (1 - dist / 100)).toFixed(3)})`;
              ctx.lineWidth = 0.8;
              ctx.beginPath();
              ctx.moveTo(gx + shiftX, gy + shiftY);
              ctx.lineTo(mouse.x, mouse.y);
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10 w-full h-full"
      style={{ opacity: 0.95 }}
    />
  );
}
