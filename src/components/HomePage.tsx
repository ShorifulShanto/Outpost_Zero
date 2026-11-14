import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  HeartPulse,
  Shield,
  Zap,
} from 'lucide-react';
import {
  FeaturedMarsPhoto,
  fetchFeaturedMarsSurfacePhoto,
} from '../services/nasaMediaService';
import { AppRoute } from '../types/mission';
import {
  EXPLORER_BADGES,
  getExplorerRank,
  loadExplorerProgress,
  subscribeExplorerProgress,
} from '../utils/explorerProgress';
import {
  CompactWatermarkFooter,
  CornerWatermark,
  MARS_FALLBACK_IMAGE,
} from './DataWatermark';
import { MarsSpaceCanvas } from './MarsSpaceCanvas';
import { MedalCrestSvg } from './MedalsGuideModal';
import { OutpostSchematic } from './OutpostSchematic';
import { PageBackButton } from './PageBackButton';

interface HomePageProps {
  onNavigate: (route: AppRoute) => void;
  hasActiveMission: boolean;
  previousRoute?: AppRoute | null;
  onGoBack?: () => void;
  onOpenMedalsGuide?: () => void;
}

const MARS_CHALLENGE_METRICS = [
  {
    value: '24h 39m',
    label: 'One Martian Sol',
  },
  {
    value: '95% CO2',
    label: 'Thin Unbreathable Air',
  },
  {
    value: '~45%',
    label: 'Max Sunlight vs. Earth',
  },
  {
    value: '3–22 min',
    label: 'One-Way Radio Delay',
  },
];

interface HazardDeckItem {
  id: 'dust' | 'streaks' | 'radiation' | 'cold';
  label: string;
  challenge: string;
  solution: string;
  targetRoute: AppRoute;
  ctaLabel: string;
}

const MARS_HAZARD_DECK: HazardDeckItem[] = [
  {
    id: 'dust',
    label: 'Dust Storms',
    challenge:
      'Fine rusty dust coats solar panels and cuts sunlight when Martian winds pick up.',
    solution:
      'Clean solar wings regularly and keep battery reserves above 35% before storm fronts arrive.',
    targetRoute: 'simulator',
    ctaLabel: 'Manage Solar Power',
  },
  {
    id: 'streaks',
    label: 'Slope Streaks',
    challenge:
      'Thick dust blankets slide down steep crater walls, forming dark streaks and tricky rover paths.',
    solution:
      'Place habitats on flat basin floors like Jezero Crater and inspect NASA surface photos first.',
    targetRoute: 'observatory',
    ctaLabel: 'Explore Surface Photos',
  },
  {
    id: 'radiation',
    label: 'Solar Flares',
    challenge:
      'Mars lacks a global magnetic field, so solar flares send radiation bursts to the surface.',
    solution:
      'Water-filled dome walls and packed Martian soil absorb high-energy particles inside the shelter.',
    targetRoute: 'observatory',
    ctaLabel: 'Check Live Solar Storms',
  },
  {
    id: 'cold',
    label: '-63°C Nights',
    challenge:
      'Average surface temperatures plunge far below freezing every single Martian night.',
    solution:
      'Insulated airlocks and greenhouse heat exchangers share power so crops and crew stay warm.',
    targetRoute: 'learn',
    ctaLabel: 'Read Thermal Lesson',
  },
];

const FEATURED_TOPICS = [
  {
    id: 'life-support',
    title: 'Life Support',
    subtitle: 'Oxygen · Water · Food',
    watermark: 'Data: NASA OSDR · Resource: CSA',
    icon: HeartPulse,
    accentColor: '#29B6F6',
    description:
      'Clean air scrubbers, recycled water, and hydroponic greens keep your four astronauts healthy.',
  },
  {
    id: 'power',
    title: 'Power',
    subtitle: 'Solar · Batteries · Heat',
    watermark: 'Data: Mars Trek',
    icon: Zap,
    accentColor: '#FFB547',
    description:
      'Martian sunlight is weaker and dusty. Batteries keep cabin heaters and air systems running.',
  },
  {
    id: 'radiation',
    title: 'Radiation',
    subtitle: 'Solar Storms · Shelter',
    watermark: 'Data: NASA DONKI / RadLab',
    icon: Shield,
    accentColor: '#E4774E',
    description:
      'Water walls and packed Martian soil shield your crew when solar storms send radiation bursts.',
  },
];

export function HomePage({
  onNavigate,
  hasActiveMission,
  previousRoute = null,
  onGoBack,
  onOpenMedalsGuide,
}: HomePageProps) {
  const [marsPhoto, setMarsPhoto] = useState<FeaturedMarsPhoto | null>(null);
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [activeHazardId, setActiveHazardId] = useState<HazardDeckItem['id']>('streaks');
  const [progress, setProgress] = useState(() => loadExplorerProgress());

  useEffect(() => {
    let active = true;
    void fetchFeaturedMarsSurfacePhoto().then((photo) => {
      if (active) setMarsPhoto(photo);
    });
    const unsubscribe = subscribeExplorerProgress(setProgress);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const usingLiveHeroPhoto = Boolean(marsPhoto?.imageUrl && !heroImgFailed);
  const heroBgSrc = usingLiveHeroPhoto ? marsPhoto!.imageUrl! : MARS_FALLBACK_IMAGE;
  const activeHazard =
    MARS_HAZARD_DECK.find((h) => h.id === activeHazardId) ?? MARS_HAZARD_DECK[0];
  const earnedCount = progress.unlockedBadges.length;

  return (
    <div className="min-h-[calc(100vh-72px)] flex flex-col justify-between">
      <main>
        {/* Hero Split Section with Mars Surface Backdrop & Animated Space Canvas */}
        <section className="relative overflow-hidden border-b border-[#293A54] bg-[#080D1B]">
          {/* Real NASA Mars Surface Backdrop (or Offline Terrain Fallback) */}
          <img
            src={heroBgSrc}
            alt={
              usingLiveHeroPhoto
                ? marsPhoto?.title ?? 'Mars surface terrain photographed by NASA'
                : 'Simulated Martian Jezero Crater horizon'
            }
            referrerPolicy="no-referrer"
            onError={() => setHeroImgFailed(true)}
            className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none select-none"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-[#080D1B]/85 via-[#080D1B]/72 to-[#080D1B] pointer-events-none"
          />

          {/* Smooth HTML5 Deep-Space Stars, Dust & Glowing Mars Horizon Canvas */}
          <MarsSpaceCanvas />

          <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-14 sm:pb-16">
            {previousRoute && onGoBack && (
              <div className="mb-6">
                <PageBackButton previousRoute={previousRoute} onBack={onGoBack} />
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
              {/* Left Copy Column */}
              <div className="lg:col-span-6 flex flex-col justify-center">
                <p className="text-xs sm:text-sm font-medium text-[#29B6F6]">
                  Outpost Zero · Explore. Build. Survive. Discover.
                </p>

                <h1 className="mt-3 font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#EAF2FF] leading-[1.12] [text-wrap:balance]">
                  Command Mars. Keep Your Crew Alive.
                </h1>

                <p className="mt-4 text-base sm:text-lg text-[#A8B6CC] leading-relaxed max-w-xl">
                  Lead four astronauts for 10 Martian Sols. Click the 3D habitat domes or
                  Mars Surface View photo to explore real space engineering.
                </p>

                {/* Mission Parameters Summary */}
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs sm:text-sm text-[#A8B6CC] font-mono-tabular">
                  <span>Planet: Mars</span>
                  <span aria-hidden="true">·</span>
                  <span>10 Sols</span>
                  <span aria-hidden="true">·</span>
                  <span>4 Astronauts</span>
                  <span aria-hidden="true">·</span>
                  <span>Ages 7–12</span>
                </div>

                {/* Action Buttons */}
                <div className="mt-7 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('simulator')}
                    className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm sm:text-base font-semibold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29B6F6]"
                  >
                    <span>
                      {hasActiveMission ? 'Continue Your Mission' : 'Start Your Mission'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('learn')}
                    className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg border border-[#293A54] bg-[#111C32]/90 hover:bg-[#1E3353] hover:border-[#29B6F6] text-[#EAF2FF] text-sm sm:text-base font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29B6F6]"
                  >
                    <Compass className="w-4 h-4 text-[#29B6F6]" />
                    <span>Explore Space</span>
                  </button>
                </div>

                <div className="mt-6">
                  <CornerWatermark
                    label={
                      usingLiveHeroPhoto
                        ? 'Backdrop: NASA Image Library'
                        : 'Backdrop: Simulated Mars Terrain'
                    }
                  />
                </div>
              </div>

              {/* Right Interactive 3D-Style Habitat Schematic + Clickable Mars Surface View */}
              <div className="lg:col-span-6 flex">
                <div className="w-full">
                  <OutpostSchematic marsPhoto={marsPhoto} onNavigate={onNavigate} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Mars Hazard & Survival Explorer + 4 Core Metrics */}
        <section className="relative border-b border-[#293A54] bg-[#111C32]/65">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-6 space-y-4">
                <div>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#EAF2FF] [text-wrap:balance]">
                    Mars Tests Every Machine You Build
                  </h2>
                  <p className="mt-2 text-sm sm:text-base text-[#A8B6CC] leading-relaxed">
                    Click a Martian hazard to see how astronauts protect their outpost.
                  </p>
                </div>

                {/* Interactive Hazard Selector */}
                <div
                  className="inline-flex flex-wrap p-1 rounded-lg bg-[#080D1B] border border-[#293A54] gap-1"
                  role="tablist"
                  aria-label="Martian survival hazards"
                >
                  {MARS_HAZARD_DECK.map((hazard) => {
                    const active = hazard.id === activeHazard.id;
                    return (
                      <button
                        key={hazard.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setActiveHazardId(hazard.id)}
                        className={`min-h-[36px] px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                          active
                            ? 'bg-[#1E3353] text-[#29B6F6] border border-[#29B6F6]/60'
                            : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                        }`}
                      >
                        {hazard.label}
                      </button>
                    );
                  })}
                </div>

                <div className="rounded-xl bg-[#080D1B] border border-[#293A54] p-4 space-y-2">
                  <p className="text-xs sm:text-sm text-[#EAF2FF] leading-relaxed">
                    <span className="font-semibold text-[#FFB547]">Mars Challenge: </span>
                    {activeHazard.challenge}
                  </p>
                  <p className="text-xs sm:text-sm text-[#A8B6CC] leading-relaxed">
                    <span className="font-semibold text-[#29B6F6]">Crew Fix: </span>
                    {activeHazard.solution}
                  </p>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onNavigate(activeHazard.targetRoute)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#E4774E] hover:text-[#EAF2FF] transition-colors cursor-pointer"
                    >
                      <span>{activeHazard.ctaLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 grid grid-cols-2 gap-4">
                {MARS_CHALLENGE_METRICS.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl bg-[#080D1B] border border-[#293A54] p-5 flex flex-col justify-between"
                  >
                    <p className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#EAF2FF]">
                      {metric.value}
                    </p>
                    <p className="mt-1.5 text-xs sm:text-sm text-[#A8B6CC] leading-snug">
                      {metric.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Three Featured Topic Cards */}
        <section className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="mb-7">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#EAF2FF]">
              Three Systems Keeping Your Crew Alive
            </h2>
            <p className="mt-1.5 text-sm sm:text-base text-[#A8B6CC]">
              Balance air, power, and shielding across every Sol.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED_TOPICS.map((topic) => {
              const IconComponent = topic.icon;
              return (
                <article
                  key={topic.id}
                  className="relative rounded-xl bg-[#111C32] border border-[#293A54] p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center">
                        <IconComponent
                          className="w-5 h-5"
                          style={{ color: topic.accentColor }}
                        />
                      </div>
                      <span className="text-xs text-[#A8B6CC]">{topic.subtitle}</span>
                    </div>

                    <h3 className="mt-5 font-display text-xl font-semibold text-[#EAF2FF]">
                      {topic.title}
                    </h3>

                    <p className="mt-2 text-sm text-[#A8B6CC] leading-relaxed">
                      {topic.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#293A54] flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => onNavigate('simulator')}
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-[#29B6F6] hover:text-[#EAF2FF] transition-colors cursor-pointer"
                    >
                      <span>Open Simulator</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                    <CornerWatermark label={topic.watermark} />
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Medals & Mind Challenges Strip */}
        <section
          aria-label="Mars Explorer Medals and Mind Challenges"
          className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pb-12"
        >
          <div className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Award className="w-5 h-5 text-[#FFB547] shrink-0" />
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#EAF2FF]">
                    Medals &amp; Mind Challenges · Rank: {getExplorerRank(earnedCount)}
                  </h2>
                  <p className="text-xs text-[#A8B6CC]">
                    Solve discovery clues and Mars survival puzzles to earn all {EXPLORER_BADGES.length} medals.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono-tabular text-sm font-bold text-[#29B6F6]">
                  {earnedCount} / {EXPLORER_BADGES.length} Unlocked
                </span>
                {onOpenMedalsGuide && (
                  <button
                    type="button"
                    onClick={onOpenMedalsGuide}
                    className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-[#1E3353] hover:bg-[#29436b] border border-[#293A54] text-xs font-semibold text-[#FFB547] hover:text-[#EAF2FF] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Open Medals &amp; Guide
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {EXPLORER_BADGES.map((badge) => {
                const earned = progress.unlockedBadges.includes(badge.id);
                return (
                  <button
                    key={badge.id}
                    type="button"
                    onClick={() =>
                      onOpenMedalsGuide
                        ? onOpenMedalsGuide()
                        : onNavigate(badge.targetRoute)
                    }
                    className={`text-left rounded-lg border p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                      earned
                        ? 'bg-[#080D1B] border-[#29B6F6]/70'
                        : 'bg-[#080D1B]/75 border-[#293A54] hover:border-[#29B6F6]'
                    }`}
                  >
                    <MedalCrestSvg tier={badge.tier} unlocked={earned} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-xs font-semibold truncate ${
                            earned ? 'text-[#29B6F6]' : 'text-[#EAF2FF]'
                          }`}
                        >
                          {badge.title}
                        </span>
                        {earned && (
                          <CheckCircle2 className="w-4 h-4 text-[#29B6F6] shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] font-mono-tabular text-[#FFB547]/90">
                        {badge.tier} · {badge.category}
                      </p>
                      <p className="mt-1 text-[11px] text-[#A8B6CC] line-clamp-2 leading-snug">
                        {badge.mindClue}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Sleek Compact Watermark Footer */}
      <CompactWatermarkFooter onNavigate={onNavigate} />
    </div>
  );
}
