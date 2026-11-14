import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CloudSun,
  ExternalLink,
  Thermometer,
} from 'lucide-react';
import { MARS_TREK_JEZERO_PROFILE } from '../data/spaceResearchData';
import { MARS_ENVIRONMENT_FACTS } from '../engine/missionData';
import { EnvironmentState } from '../types/mission';
import { CornerWatermark } from './DataWatermark';

interface MarsEnvironmentPanelProps {
  environment: EnvironmentState;
}

export function MarsEnvironmentPanel({ environment }: MarsEnvironmentPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <section
      aria-label="Mars Environment Telemetry"
      className="rounded-xl bg-[#111C32] border border-[#293A54] p-4 sm:p-5 space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
            <CloudSun className="w-4 h-4 text-[#E4774E]" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF]">
              Mars Environment
            </h3>
            <p className="text-xs text-[#29B6F6] font-medium">
              {environment.weatherCondition}
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 font-mono-tabular text-xs font-semibold text-[#EAF2FF] bg-[#080D1B] border border-[#293A54] rounded-md px-2.5 py-1.5 shrink-0">
          <Thermometer className="w-3.5 h-3.5 text-[#FFB547]" />
          <span>{environment.localTempCelsius}°C</span>
        </div>
      </div>

      <p className="text-xs text-[#A8B6CC] leading-relaxed">
        {environment.dustOpacityNote}
      </p>

      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        className="w-full min-h-[40px] px-3 py-2 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] flex items-center justify-between gap-2 text-xs font-semibold text-[#EAF2FF] transition-colors cursor-pointer"
      >
        <span>Explore Martian Environment Facts</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-[#A8B6CC]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[#A8B6CC]" />
        )}
      </button>

      {expanded && (
        <dl className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-2.5 text-xs">
          <div>
            <dt className="font-semibold text-[#29B6F6]">Atmosphere &amp; Pressure</dt>
            <dd className="mt-0.5 text-[#A8B6CC] leading-relaxed">
              {MARS_ENVIRONMENT_FACTS.atmosphere} {MARS_ENVIRONMENT_FACTS.pressure}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[#29B6F6]">Temperature &amp; Dust</dt>
            <dd className="mt-0.5 text-[#A8B6CC] leading-relaxed">
              {MARS_ENVIRONMENT_FACTS.temperature} {MARS_ENVIRONMENT_FACTS.dustStorms}
            </dd>
          </div>
          <div className="pt-2.5 border-t border-[#293A54] space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <dt className="font-semibold text-[#E4774E]">
                {MARS_TREK_JEZERO_PROFILE.siteName} ({MARS_TREK_JEZERO_PROFILE.coordinates})
              </dt>
              <CornerWatermark label="Data: Mars Trek" />
            </div>
            <dd className="text-[#A8B6CC] leading-relaxed">
              {MARS_TREK_JEZERO_PROFILE.habitatPlacementNote}
            </dd>
            <dd>
              <a
                href={MARS_TREK_JEZERO_PROFILE.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
              >
                <span>Open NASA Mars Trek</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
