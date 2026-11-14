import { useEffect, useRef } from 'react';

interface StarParticle {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
  twinklePhase: number;
  tint: 'white' | 'blue' | 'amber';
}

interface DustMote {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  alpha: number;
}

export function MarsSpaceCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animId = 0;
    let isVisible = true;
    let isTabActive = typeof document === 'undefined' ? true : !document.hidden;
    let stars: StarParticle[] = [];
    let dust: DustMote[] = [];

    // Cached gradients & planet geometry computed only on resize
    let skyGlow: CanvasGradient | null = null;
    let horizonHalo: CanvasGradient | null = null;
    let surfaceGrad: CanvasGradient | null = null;
    let planetRadius = 1100;
    let planetCx = 0;
    let planetCy = 0;

    const initParticles = () => {
      const starCount = Math.min(42, Math.max(22, Math.floor((width * height) / 24000)));
      stars = Array.from({ length: starCount }, (_, i) => {
        const tintRoll = i % 9;
        return {
          x: Math.random() * width,
          y: Math.random() * height * 0.85,
          radius: tintRoll === 0 ? 1.8 : Math.random() * 1.1 + 0.5,
          vx: -(Math.random() * 0.24 + 0.05),
          vy: (Math.random() - 0.5) * 0.05,
          alpha: Math.random() * 0.55 + 0.3,
          twinklePhase: Math.random() * Math.PI * 2,
          tint: tintRoll === 1 ? 'blue' : tintRoll === 2 ? 'amber' : 'white',
        };
      });

      const dustCount = Math.min(14, Math.max(6, Math.floor(width / 80)));
      dust = Array.from({ length: dustCount }, () => ({
        x: Math.random() * width,
        y: height * 0.58 + Math.random() * height * 0.42,
        radius: Math.random() * 1.7 + 0.7,
        vx: Math.random() * 0.45 + 0.14,
        vy: -(Math.random() * 0.14 + 0.04),
        alpha: Math.random() * 0.25 + 0.08,
      }));
    };

    const buildGradients = () => {
      skyGlow = ctx.createRadialGradient(
        width * 0.72,
        height * 0.22,
        10,
        width * 0.72,
        height * 0.22,
        width * 0.65
      );
      skyGlow.addColorStop(0, 'rgba(41, 182, 246, 0.08)');
      skyGlow.addColorStop(1, 'rgba(8, 13, 27, 0)');

      planetRadius = Math.max(width * 1.35, 1100);
      planetCx = width * 0.52;
      planetCy = height + planetRadius - Math.min(82, height * 0.14);

      horizonHalo = ctx.createRadialGradient(
        planetCx,
        planetCy,
        planetRadius * 0.96,
        planetCx,
        planetCy,
        planetRadius * 1.045
      );
      horizonHalo.addColorStop(0, 'rgba(228, 119, 78, 0.34)');
      horizonHalo.addColorStop(0.45, 'rgba(228, 119, 78, 0.14)');
      horizonHalo.addColorStop(0.78, 'rgba(41, 182, 246, 0.06)');
      horizonHalo.addColorStop(1, 'rgba(8, 13, 27, 0)');

      surfaceGrad = ctx.createLinearGradient(0, height - 100, 0, height);
      surfaceGrad.addColorStop(0, 'rgba(48, 24, 21, 0.9)');
      surfaceGrad.addColorStop(1, 'rgba(8, 13, 27, 0.98)');
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      width = Math.max(300, rect.width);
      height = Math.max(260, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGradients();
      initParticles();
    };

    const drawFrame = (timeMs: number) => {
      ctx.clearRect(0, 0, width, height);

      if (skyGlow) {
        ctx.fillStyle = skyGlow;
        ctx.fillRect(0, 0, width, height);
      }

      // Drifting stars
      for (const star of stars) {
        if (!prefersReducedMotion) {
          star.x += star.vx;
          star.y += star.vy;
          if (star.x < -4) star.x = width + 4;
          if (star.y < -4) star.y = height * 0.85;
          if (star.y > height * 0.85) star.y = 0;
        }
        const twinkle = prefersReducedMotion
          ? 1
          : 0.75 + 0.25 * Math.sin(timeMs * 0.0014 + star.twinklePhase);
        const alpha = star.alpha * twinkle;
        ctx.fillStyle =
          star.tint === 'blue'
            ? `rgba(41, 182, 246, ${alpha})`
            : star.tint === 'amber'
              ? `rgba(255, 181, 71, ${alpha * 0.85})`
              : `rgba(234, 242, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Glowing Martian planet horizon arc along bottom
      if (horizonHalo) {
        ctx.fillStyle = horizonHalo;
        ctx.beginPath();
        ctx.arc(planetCx, planetCy, planetRadius * 1.045, Math.PI * 1.15, Math.PI * 1.85);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
      }

      // Solid dark-Martian surface curve with glowing rim
      if (surfaceGrad) {
        ctx.fillStyle = surfaceGrad;
        ctx.beginPath();
        ctx.arc(planetCx, planetCy, planetRadius, Math.PI * 1.18, Math.PI * 1.82);
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
      }

      ctx.strokeStyle = 'rgba(228, 119, 78, 0.52)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(planetCx, planetCy, planetRadius, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

      // Subtle Martian dust motes above the horizon
      for (const mote of dust) {
        if (!prefersReducedMotion) {
          mote.x += mote.vx;
          mote.y += mote.vy;
          if (mote.x > width + 6) mote.x = -6;
          if (mote.y < height * 0.45) {
            mote.y = height * 0.96;
            mote.x = Math.random() * width;
          }
        }
        ctx.fillStyle = `rgba(228, 119, 78, ${mote.alpha})`;
        ctx.beginPath();
        ctx.arc(mote.x, mote.y, mote.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    resize();
    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => resize())
        : null;
    if (ro && canvas.parentElement) {
      ro.observe(canvas.parentElement);
    } else {
      window.addEventListener('resize', resize);
    }

    let lastFrameTime = 0;
    const startLoop = () => {
      if (prefersReducedMotion || animId || !isVisible || !isTabActive) return;
      const tick = (t: number) => {
        if (!isVisible || !isTabActive) {
          animId = 0;
          return;
        }
        if (t - lastFrameTime >= 32) {
          lastFrameTime = t;
          drawFrame(t);
        }
        animId = window.requestAnimationFrame(tick);
      };
      animId = window.requestAnimationFrame(tick);
    };

    const stopLoop = () => {
      if (animId) {
        window.cancelAnimationFrame(animId);
        animId = 0;
      }
    };

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              const entry = entries[0];
              isVisible = Boolean(entry?.isIntersecting ?? true);
              if (isVisible && isTabActive) {
                startLoop();
              } else {
                stopLoop();
              }
            },
            { threshold: 0.02 }
          )
        : null;
    if (io) io.observe(canvas);

    const handleVisibility = () => {
      isTabActive = !document.hidden;
      if (isVisible && isTabActive) {
        startLoop();
      } else {
        stopLoop();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    if (prefersReducedMotion) {
      drawFrame(0);
    } else {
      startLoop();
    }

    return () => {
      stopLoop();
      if (io) io.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      if (ro) ro.disconnect();
      else window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}
