import { useEffect, useRef, useState } from 'react';
import { Award, Sparkles, X } from 'lucide-react';
import {
  ExplorerBadgeDefinition,
  subscribeMedalUnlocked,
} from '../utils/explorerProgress';
import { MedalCrestSvg } from './MedalsGuideModal';

interface AchievementCelebrationProps {
  onOpenMedalsGuide: () => void;
}

interface BurstParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

const PARTICLE_COLORS = ['#FFB547', '#29B6F6', '#E4774E', '#EAF2FF', '#34D399'];

export function AchievementCelebration({
  onOpenMedalsGuide,
}: AchievementCelebrationProps) {
  const [queue, setQueue] = useState<ExplorerBadgeDefinition[]>([]);
  const [visible, setVisible] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeMedalUnlocked((badge) => {
      setQueue((prev) => {
        if (prev.some((item) => item.id === badge.id)) return prev;
        return [...prev, badge];
      });
    });
    return unsubscribe;
  }, []);

  const activeBadge = queue[0] ?? null;

  useEffect(() => {
    if (!activeBadge) {
      setVisible(false);
      return;
    }

    setVisible(true);

    const dismissTimer = window.setTimeout(() => {
      setQueue((prev) => prev.slice(1));
    }, 6200);

    return () => window.clearTimeout(dismissTimer);
  }, [activeBadge]);

  // Lightweight HTML5 canvas orbital particle burst on unlock
  useEffect(() => {
    if (!activeBadge) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Burst originates near top-center / upper-right notification banner
    const originX = Math.min(width - 140, Math.max(width * 0.5, width - 220));
    const originY = 128;

    const particles: BurstParticle[] = Array.from({ length: 48 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 48 + (Math.random() - 0.5) * 0.35;
      const speed = 1.8 + Math.random() * 4.6;
      return {
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.1,
        size: 2 + Math.random() * 3.2,
        color: PARTICLE_COLORS[i % PARTICLE_COLORS.length],
        alpha: 0.95,
        decay: 0.015 + Math.random() * 0.012,
      };
    });

    let rafId = 0;
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      let alive = false;
      for (const p of particles) {
        if (p.alpha <= 0.02) continue;
        alive = true;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.07; // gentle gravity
        p.vx *= 0.985;
        p.alpha = Math.max(0, p.alpha - p.decay);

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      if (alive) {
        rafId = window.requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, width, height);
      }
    };

    rafId = window.requestAnimationFrame(render);
    return () => {
      window.cancelAnimationFrame(rafId);
      ctx.clearRect(0, 0, width, height);
    };
  }, [activeBadge]);

  if (!activeBadge || !visible) return null;

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 z-[60] pointer-events-none"
      />

      <div
        role="status"
        aria-live="polite"
        className="fixed top-20 right-4 sm:right-6 z-[65] w-[calc(100vw-2rem)] max-w-sm rounded-xl bg-[#111C32] border-2 border-[#FFB547] shadow-[0_0_32px_rgba(255,181,71,0.28)] p-4 transition-all duration-300"
      >
        <div className="flex items-start gap-3.5">
          <div className="relative shrink-0">
            <MedalCrestSvg tier={activeBadge.tier} unlocked size={50} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono-tabular font-bold text-[#FFB547]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Medal Unlocked · {activeBadge.tier}</span>
              </span>

              <button
                type="button"
                onClick={() => setQueue((prev) => prev.slice(1))}
                aria-label="Dismiss medal notification"
                className="text-[#A8B6CC] hover:text-[#EAF2FF] p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h3 className="mt-0.5 font-display text-base font-bold text-[#EAF2FF]">
              {activeBadge.title}
            </h3>
            <p className="mt-0.5 text-xs text-[#A8B6CC] leading-snug">
              {activeBadge.hint}
            </p>

            <div className="mt-3 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setQueue((prev) => prev.slice(1));
                  onOpenMedalsGuide();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#FFB547] hover:bg-[#ffc36b] text-[#080D1B] text-xs font-semibold transition-colors cursor-pointer"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Open Medals &amp; Guide</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
