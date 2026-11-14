import marsFallbackImg from '../assets/images/mars_surface_fallback_1794632037251.jpg';
import { AppRoute } from '../types/mission';

export const MARS_FALLBACK_IMAGE = marsFallbackImg;

interface CornerWatermarkProps {
  label: string;
  className?: string;
}

export function CornerWatermark({ label, className = '' }: CornerWatermarkProps) {
  return (
    <span
      className={`inline-block text-[10px] sm:text-[11px] font-mono-tabular tracking-wide text-[#A8B6CC]/75 bg-[#080D1B]/75 border border-[#293A54]/70 px-2 py-0.5 rounded select-none ${className}`}
    >
      {label}
    </span>
  );
}

interface CompactWatermarkFooterProps {
  onNavigate?: (route: AppRoute) => void;
}

const FOOTER_WATERMARKS = [
  'Data: NASA APOD',
  'Data: NASA DONKI',
  'Data: NASA Image Library',
  'Data: NASA OSDR / RadLab',
  'Data: Mars Trek',
  'Resource: CSA',
];

export function CompactWatermarkFooter({
  onNavigate,
}: CompactWatermarkFooterProps) {
  return (
    <footer className="border-t border-[#293A54] bg-[#080D1B]/95">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="font-display text-xs sm:text-sm font-semibold text-[#EAF2FF]">
              Outpost Zero
            </span>
            <span className="text-xs text-[#A8B6CC]/80">
              Independent STEM simulator · Not endorsed by NASA or CSA.
            </span>
          </div>

          {onNavigate && (
            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-[#A8B6CC]"
            >
              <button
                type="button"
                onClick={() => onNavigate('simulator')}
                className="hover:text-[#EAF2FF] transition-colors cursor-pointer"
              >
                Simulator
              </button>
              <button
                type="button"
                onClick={() => onNavigate('learn')}
                className="hover:text-[#EAF2FF] transition-colors cursor-pointer"
              >
                Learn
              </button>
              <button
                type="button"
                onClick={() => onNavigate('observatory')}
                className="hover:text-[#EAF2FF] transition-colors cursor-pointer"
              >
                NASA Observatory
              </button>
              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="hover:text-[#EAF2FF] transition-colors cursor-pointer"
              >
                About
              </button>
            </nav>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#293A54]/60">
          {FOOTER_WATERMARKS.map((tag) => (
            <CornerWatermark key={tag} label={tag} />
          ))}
        </div>
      </div>
    </footer>
  );
}
