import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Compass,
  Lock,
  X,
} from 'lucide-react';
import { AppRoute } from '../types/mission';
import {
  EXPLORER_BADGES,
  ExplorerBadgeDefinition,
  ExplorerProgressState,
  getExplorerRank,
  MedalTier,
} from '../utils/explorerProgress';

interface MedalsGuideModalProps {
  isOpen: boolean;
  progress: ExplorerProgressState;
  onClose: () => void;
  onNavigate: (route: AppRoute) => void;
}

const TIER_COLORS: Record<
  MedalTier,
  { ring: string; fill: string; text: string }
> = {
  Bronze: { ring: '#CD7F32', fill: '#3B2314', text: '#F4A261' },
  Silver: { ring: '#C0D6F5', fill: '#1B2D48', text: '#D9E8FF' },
  Gold: { ring: '#FFB547', fill: '#3A280D', text: '#FFD07B' },
  Platinum: { ring: '#29B6F6', fill: '#0E2E47', text: '#7FE0FF' },
};

export function MedalCrestSvg({
  tier,
  unlocked,
  size = 44,
}: {
  tier: MedalTier;
  unlocked: boolean;
  size?: number;
}) {
  const palette = TIER_COLORS[tier];
  const stroke = unlocked ? palette.ring : '#334663';
  const fill = unlocked ? palette.fill : '#0B1324';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* Ribbon top */}
      <path
        d="M16 4 L24 14 L32 4"
        fill="none"
        stroke={unlocked ? palette.ring : '#293A54'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Outer Medal Ring */}
      <circle
        cx="24"
        cy="28"
        r="16"
        fill={fill}
        stroke={stroke}
        strokeWidth="2.4"
      />
      {/* Inner Orbital Ring */}
      <circle
        cx="24"
        cy="28"
        r="11.5"
        fill="none"
        stroke={stroke}
        strokeOpacity={unlocked ? '0.55' : '0.28'}
        strokeWidth="1"
        strokeDasharray="3 2"
      />
      {/* Center Star Emblem */}
      <polygon
        points="24,18 26.8,24.2 33.4,24.9 28.4,29.3 29.8,35.8 24,32.3 18.2,35.8 19.6,29.3 14.6,24.9 21.2,24.2"
        fill={unlocked ? palette.ring : '#293A54'}
      />
    </svg>
  );
}

type GuideFilter = 'all' | 'mind-game' | 'discovery' | 'unlocked';

export function MedalsGuideModal({
  isOpen,
  progress,
  onClose,
  onNavigate,
}: MedalsGuideModalProps) {
  const [filter, setFilter] = useState<GuideFilter>('all');
  const [expandedGuides, setExpandedGuides] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const unlockedSet = new Set(progress.unlockedBadges);
  const unlockedCount = unlockedSet.size;
  const rank = getExplorerRank(unlockedCount);
  const pct = Math.round((unlockedCount / EXPLORER_BADGES.length) * 100);

  const filteredBadges = EXPLORER_BADGES.filter((b) => {
    if (filter === 'mind-game') return b.category === 'Mind-Game Strategy';
    if (filter === 'discovery') return b.category === 'Discovery & Science';
    if (filter === 'unlocked') return unlockedSet.has(b.id);
    return true;
  });

  const toggleGuide = (id: string) => {
    setExpandedGuides((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleGo = (badge: ExplorerBadgeDefinition) => {
    onClose();
    onNavigate(badge.targetRoute);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#080D1B]/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="medals-guide-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#111C32] border border-[#293A54] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#111C32] border-b border-[#293A54] px-5 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-[#FFB547]" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono-tabular text-[#29B6F6]">
                Rank: {rank} · {unlockedCount} / {EXPLORER_BADGES.length} Medals
              </p>
              <h2
                id="medals-guide-title"
                className="font-display text-lg sm:text-xl font-bold text-[#EAF2FF] truncate"
              >
                Medals, Mind Challenges &amp; Unlock Guide
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Medals and Guide"
            className="w-10 h-10 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] text-[#A8B6CC] hover:text-[#EAF2FF] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Progress Bar & Mind-Game Intro */}
          <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-[#EAF2FF] font-medium">
                Solve engineering clues across the 3D habitat, Learn quizzes, NASA Observatory, and 10-Sol Simulator.
              </span>
              <span className="font-mono-tabular font-bold text-[#FFB547]">
                {pct}% Complete
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-[#111C32] border border-[#293A54] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#29B6F6] to-[#FFB547] transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          {/* Filter Bar */}
          <div
            className="inline-flex flex-wrap p-1 rounded-lg bg-[#080D1B] border border-[#293A54] gap-1"
            role="tablist"
            aria-label="Filter achievement medals"
          >
            {(
              [
                { id: 'all', label: `All Medals (${EXPLORER_BADGES.length})` },
                { id: 'mind-game', label: 'Mind-Game Strategy (5)' },
                { id: 'discovery', label: 'Discovery & Science (4)' },
                { id: 'unlocked', label: `Unlocked (${unlockedCount})` },
              ] as { id: GuideFilter; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  filter === tab.id
                    ? 'bg-[#1E3353] text-[#29B6F6]'
                    : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Medals Grid */}
          {filteredBadges.length === 0 ? (
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-8 text-center space-y-2">
              <p className="text-sm font-medium text-[#EAF2FF]">
                No medals unlocked in this view yet.
              </p>
              <p className="text-xs text-[#A8B6CC]">
                Switch back to All Medals and follow any clue or step-by-step guide to earn your first medal.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredBadges.map((badge) => {
                const unlocked = unlockedSet.has(badge.id);
                const guideOpen = Boolean(expandedGuides[badge.id]);
                const tierColor = TIER_COLORS[badge.tier];

                return (
                  <article
                    key={badge.id}
                    className={`rounded-lg bg-[#080D1B] border p-4 flex flex-col justify-between gap-3 transition-colors ${
                      unlocked ? 'border-[#29B6F6]/70' : 'border-[#293A54]'
                    }`}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <MedalCrestSvg tier={badge.tier} unlocked={unlocked} />
                          <div className="min-w-0">
                            <p
                              className="text-[11px] font-mono-tabular font-semibold"
                              style={{
                                color: unlocked ? tierColor.text : '#A8B6CC',
                              }}
                            >
                              {badge.tier} Medal · {badge.category}
                            </p>
                            <h3 className="font-display text-base font-bold text-[#EAF2FF] leading-snug">
                              {badge.title}
                            </h3>
                          </div>
                        </div>

                        {unlocked ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#29B6F6] shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Unlocked</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-[#A8B6CC] shrink-0">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Locked</span>
                          </span>
                        )}
                      </div>

                      {/* Mind-Game Clue */}
                      <p className="text-xs text-[#EAF2FF]/90 leading-relaxed">
                        {badge.mindClue}
                      </p>

                      {/* Collapsible Step-by-Step Unlock Guide */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => toggleGuide(badge.id)}
                          aria-expanded={guideOpen}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#FFB547] hover:text-[#EAF2FF] transition-colors cursor-pointer"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>
                            {guideOpen ? 'Hide How-to Guide' : 'Show How-to Guide'}
                          </span>
                          {guideOpen ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {guideOpen && (
                          <p className="mt-2 rounded-md bg-[#111C32] border border-[#293A54] p-3 text-xs text-[#A8B6CC] leading-relaxed">
                            {badge.howToGuide}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#293A54] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-[#A8B6CC]">
                        {badge.hint}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleGo(badge)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#29B6F6] hover:text-[#EAF2FF] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>{badge.actionLabel}</span>
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
