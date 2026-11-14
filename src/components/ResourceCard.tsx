import { useState } from 'react';
import { HelpCircle, HeartPulse, Shield, Zap } from 'lucide-react';
import { getResourceStatus, getStatusVisuals } from '../engine/gameEngine';
import { RESOURCE_TOOLTIPS } from '../engine/missionData';
import { ResourceKey, ResourceState } from '../types/mission';

interface ResourceCardProps {
  resourceKey: ResourceKey;
  resources: ResourceState;
  delta?: number | null;
}

export function ResourceCard({ resourceKey, resources, delta }: ResourceCardProps) {
  const [tooltipOpen, setTooltipOpen] = useState(false);

  const value =
    resourceKey === 'lifeSupport'
      ? resources.lifeSupport
      : resourceKey === 'power'
        ? resources.power
        : resources.radiationProtection;

  const status = getResourceStatus(value);
  const visuals = getStatusVisuals(status);
  const tooltip = RESOURCE_TOOLTIPS[resourceKey];

  const Icon =
    resourceKey === 'lifeSupport'
      ? HeartPulse
      : resourceKey === 'power'
        ? Zap
        : Shield;

  const title =
    resourceKey === 'lifeSupport'
      ? 'Life Support'
      : resourceKey === 'power'
        ? 'Power'
        : 'Radiation Protection';

  const subMetrics =
    resourceKey === 'lifeSupport'
      ? [
          { label: 'Oxygen Availability', value: `${resources.oxygenAvailability}%` },
          { label: 'Food Reserves', value: `${resources.foodReserves}%` },
          { label: 'Greenhouse', value: resources.greenhouseStatus },
        ]
      : resourceKey === 'power'
        ? [
            { label: 'Solar Generation', value: `${resources.solarGeneration}%` },
            { label: 'Battery Reserves', value: `${resources.batteryReserve}%` },
            { label: 'Energy Load', value: resources.energyConsumption },
          ]
        : [
            { label: 'Habitat Shielding', value: `${resources.shieldingCondition}%` },
            { label: 'Crew Exposure Risk', value: resources.crewExposureRisk },
            {
              label: 'Weather / Shelter',
              value: `${resources.solarWeatherAlert} · ${resources.shelterAvailable ? 'Shelter Ready' : 'Limited'}`,
            },
          ];

  return (
    <section
      aria-label={`${title} status`}
      className="rounded-xl bg-[#111C32] border border-[#293A54] p-4 sm:p-5 flex flex-col justify-between"
    >
      <div>
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[#29B6F6]" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF] truncate">
                {title}
              </h2>
              <p className={`text-xs font-medium ${visuals.textColor}`}>
                <span aria-hidden="true">{visuals.symbol}</span> {visuals.label}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTooltipOpen((prev) => !prev)}
            aria-expanded={tooltipOpen}
            aria-label={`Explain ${title}`}
            className="min-w-[44px] min-h-[44px] rounded-lg border border-[#293A54] bg-[#080D1B] hover:border-[#29B6F6] text-[#A8B6CC] hover:text-[#EAF2FF] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Plain-Language Expandable Tooltip */}
        {tooltipOpen && (
          <div className="mt-3 rounded-lg bg-[#080D1B] border border-[#29B6F6]/50 p-3 text-xs leading-relaxed">
            <p className="font-semibold text-[#EAF2FF]">{tooltip.title}</p>
            <p className="mt-1 text-[#A8B6CC]">{tooltip.summary}</p>
            <p className="mt-1.5 text-[#29B6F6]">{tooltip.realScience}</p>
          </div>
        )}

        {/* Numeric Value + Delta + Progress Bar */}
        <div className="mt-4 flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-mono-tabular text-2xl sm:text-3xl font-bold text-[#EAF2FF]">
              {value}%
            </span>
            {typeof delta === 'number' && delta !== 0 && (
              <span
                className={`font-mono-tabular text-xs font-semibold ${
                  delta > 0 ? 'text-[#29B6F6]' : 'text-[#E4774E]'
                }`}
              >
                {delta > 0 ? `+${delta}%` : `${delta}%`}
              </span>
            )}
          </div>
          <span className="text-xs font-mono-tabular text-[#A8B6CC]">0–100%</span>
        </div>

        <div
          className="mt-2 h-2.5 w-full rounded-full bg-[#080D1B] border border-[#293A54] overflow-hidden"
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${title} level ${value} percent`}
        >
          <div
            className={`h-full transition-all duration-300 ${visuals.barColor}`}
            style={{ width: `${value}%` }}
          />
        </div>
      </div>

      {/* Sub-Metrics */}
      <dl className="mt-4 pt-3 border-t border-[#293A54] space-y-1.5">
        {subMetrics.map((item) => (
          <div key={item.label} className="flex flex-wrap items-center justify-between gap-x-2 gap-y-0.5 text-xs">
            <dt className="text-[#A8B6CC]">{item.label}</dt>
            <dd className="font-mono-tabular font-medium text-[#EAF2FF] text-right">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
