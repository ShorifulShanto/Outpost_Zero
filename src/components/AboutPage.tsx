import { ArrowRight, Compass, Cpu, Scale, ShieldAlert } from 'lucide-react';
import { AppRoute } from '../types/mission';
import { CompactWatermarkFooter, CornerWatermark } from './DataWatermark';
import { PageBackButton } from './PageBackButton';

interface AboutPageProps {
  onNavigate: (route: AppRoute) => void;
  previousRoute?: AppRoute | null;
  onGoBack?: () => void;
}

export function AboutPage({
  onNavigate,
  previousRoute = null,
  onGoBack,
}: AboutPageProps) {
  return (
    <div className="min-h-[calc(100vh-72px)] flex flex-col justify-between">
      <main className="max-w-[1120px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        <div>
          <PageBackButton
            previousRoute={previousRoute}
            onBack={onGoBack ?? (() => onNavigate('home'))}
          />
        </div>
        {/* Intro Hero */}
        <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8 space-y-2.5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#E4774E]">
            Blast Off to Something New
          </p>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-[#EAF2FF] [text-wrap:balance]">
            About Outpost Zero
          </h1>
          <p className="text-sm sm:text-base text-[#A8B6CC] leading-relaxed max-w-3xl">
            Outpost Zero helps young explorers aged 7–12 learn how astronauts keep a
            Mars research base alive through air, power, food, and radiation trade-offs.
          </p>
        </section>

        {/* Core Concept Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#29B6F6]">
              <Compass className="w-5 h-5" />
              <h2 className="font-display text-lg font-semibold text-[#EAF2FF]">
                Mission Purpose
              </h2>
            </div>
            <p className="text-sm text-[#A8B6CC] leading-relaxed">
              Guide four astronauts through 10 Martian Sols of real engineering challenges:
              oxygen recycling, hydroponic food, dust storms, and radio delays.
            </p>
          </section>

          <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#E4774E]">
              <Cpu className="w-5 h-5" />
              <h2 className="font-display text-lg font-semibold text-[#EAF2FF]">
                How the Simulator Works
              </h2>
            </div>
            <p className="text-sm text-[#A8B6CC] leading-relaxed">
              Our TypeScript engine balances Life Support, Power, Radiation Protection,
              the Greenhouse, and crew energy while saving progress locally.
            </p>
          </section>

          <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#FFB547]">
              <Scale className="w-5 h-5" />
              <h2 className="font-display text-lg font-semibold text-[#EAF2FF]">
                Real Engineering Trade-Offs
              </h2>
            </div>
            <p className="text-sm text-[#A8B6CC] leading-relaxed">
              No choice on Mars is free: grow lights spend power, spacewalks spend oxygen,
              and storm sheltering pauses outdoor repairs.
            </p>
          </section>

          <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 space-y-2.5">
            <div className="flex items-center gap-2.5 text-[#29B6F6]">
              <ShieldAlert className="w-5 h-5" />
              <h2 className="font-display text-lg font-semibold text-[#EAF2FF]">
                Kid-Friendly Scale
              </h2>
            </div>
            <p className="text-sm text-[#A8B6CC] leading-relaxed">
              Habitat systems use a 0–100% scale and Earth’s 6–44 minute radio delay runs
              as a quick 6-second countdown so gameplay stays fun and clear.
            </p>
          </section>
        </div>

        {/* Clean Data Watermark Summary & CTA */}
        <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[#EAF2FF]">
              Public Space Science Sources
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <CornerWatermark label="Data: NASA DONKI / APOD" />
              <CornerWatermark label="Data: NASA OSDR / RadLab" />
              <CornerWatermark label="Data: Mars Trek" />
              <CornerWatermark label="Resource: CSA" />
            </div>
          </div>

          <p className="text-sm text-[#A8B6CC] leading-relaxed">
            Imagery and space-weather records come from NASA Open APIs and the NASA
            Image Library, alongside historical research from OSDR, RadLab, Mars Trek, and
            the Canadian Space Agency—all unaltered and credited to their original
            sources. Per NASA Media Usage Guidelines (14 CFR Part 1221), official NASA
            insignias are not displayed; NASA and CSA do not endorse this project.
          </p>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('simulator')}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm font-semibold transition-colors cursor-pointer"
            >
              <span>Launch Mission Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate('observatory')}
              className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-lg bg-[#1E3353] hover:border-[#29B6F6] border border-[#293A54] text-[#EAF2FF] text-sm font-medium transition-colors cursor-pointer"
            >
              <span>Open NASA Observatory</span>
            </button>
          </div>
        </section>
      </main>

      <CompactWatermarkFooter onNavigate={onNavigate} />
    </div>
  );
}
