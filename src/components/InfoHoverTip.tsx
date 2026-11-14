import { useEffect, useRef, useState } from 'react';
import { ExternalLink, Info } from 'lucide-react';

interface InfoHoverTipProps {
  label: string;
  title: string;
  body: string;
  badge?: string;
  note?: string;
  sourceUrl?: string;
  accent?: 'blue' | 'amber' | 'orange';
}

export function InfoHoverTip({
  label,
  title,
  body,
  badge,
  note,
  sourceUrl,
  accent = 'blue',
}: InfoHoverTipProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const accentText =
    accent === 'amber'
      ? 'text-[#FFB547] border-[#FFB547]/40 hover:border-[#FFB547]'
      : accent === 'orange'
        ? 'text-[#E4774E] border-[#E4774E]/40 hover:border-[#E4774E]'
        : 'text-[#29B6F6] border-[#293A54] hover:border-[#29B6F6]';

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 min-h-[30px] px-2.5 py-1 rounded-md bg-[#080D1B] border text-xs font-medium transition-colors cursor-pointer ${accentText}`}
      >
        <Info className="w-3.5 h-3.5 shrink-0" />
        <span>{label}</span>
      </button>

      {open && (
        <div
          role="tooltip"
          className="absolute left-0 top-full mt-1.5 z-30 w-72 sm:w-80 max-w-[calc(100vw-2rem)] rounded-lg bg-[#080D1B] border border-[#29B6F6]/60 shadow-2xl p-3.5 space-y-2 text-xs text-left"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="font-semibold text-[#EAF2FF] leading-snug">
              {title}
            </span>
            {badge && (
              <span className="font-mono-tabular text-[11px] font-semibold text-[#FFB547]">
                {badge}
              </span>
            )}
          </div>

          <p className="text-[#A8B6CC] leading-relaxed">{body}</p>

          {note && (
            <p className="text-[11px] text-[#A8B6CC]/80 italic border-t border-[#293A54] pt-1.5">
              {note}
            </p>
          )}

          {sourceUrl && (
            <a
              href={sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
            >
              <span>Inspect Source</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
