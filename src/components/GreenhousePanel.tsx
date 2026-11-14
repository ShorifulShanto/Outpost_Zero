import { useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Droplets,
  ExternalLink,
  Sprout,
  Wheat,
  Wrench,
  Zap,
} from 'lucide-react';
import { CSA_RESOURCES } from '../data/spaceResearchData';
import {
  GameState,
  GreenhouseActionId,
} from '../types/mission';
import { CornerWatermark } from './DataWatermark';

interface GreenhousePanelProps {
  gameState: GameState;
  onGreenhouseAction: (actionId: GreenhouseActionId) => void;
}

const GREENHOUSE_ACTIONS: {
  id: GreenhouseActionId;
  label: string;
  benefit: string;
  cost: string;
  icon: typeof Wrench;
}[] = [
  {
    id: 'maintain-equipment',
    label: 'Maintain Greenhouse Equipment',
    benefit: '+14% Greenhouse Health · +2% Life Support',
    cost: '-5% Power · -4% Crew Energy',
    icon: Wrench,
  },
  {
    id: 'allocate-power',
    label: 'Allocate Power to Plant Growth',
    benefit: '+30% Crop Growth · +4% Health · +3% Life Support',
    cost: '-8% Power (Boosts Grow Lights)',
    icon: Zap,
  },
  {
    id: 'repair-irrigation',
    label: 'Repair Irrigation Systems',
    benefit: 'Flowing Irrigation · +18% Water · +6% Health',
    cost: '-4% Radiation Shielding · -4% Power · -4% Crew Energy',
    icon: Droplets,
  },
  {
    id: 'harvest-crops',
    label: 'Harvest Available Crops',
    benefit: '+18% Food Reserves · +8% Life Support',
    cost: 'Requires 100% Growth · -10% Water · -3% Power · -5% Crew Energy',
    icon: Wheat,
  },
];

const GREENHOUSE_SCIENCE_LESSONS = [
  {
    question: 'Why not plant seeds straight into Martian dirt?',
    answer:
      'Martian dirt has salty perchlorates that harm plants, so crews grow crops indoors in clean nutrient water (hydroponics).',
  },
  {
    question: 'Why do Mars greenhouses need so much power?',
    answer:
      'Mars averages -53°C outside, so LED grow lights, heaters, and water pumps share battery power.',
  },
  {
    question: 'Why is stored Earth food still needed?',
    answer:
      'Crops take time to grow, so stored rations feed the crew safely during dust storms.',
  },
];

export function GreenhousePanel({
  gameState,
  onGreenhouseAction,
}: GreenhousePanelProps) {
  const [scienceOpen, setScienceOpen] = useState(false);

  const { greenhouse, resources, phase, isPaused } = gameState;
  const actionsRemaining = Math.max(0, 2 - greenhouse.actionsUsedThisSol.length);
  const canInteract = phase === 'playing' && !isPaused;

  const irrigationColor =
    greenhouse.irrigationStatus === 'Flowing'
      ? 'text-[#29B6F6]'
      : greenhouse.irrigationStatus === 'Low Pressure'
        ? 'text-[#FFB547]'
        : 'text-[#E4774E]';

  return (
    <section
      aria-label="Mars Greenhouse Subsystem"
      className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
            <Sprout className="w-4 h-4 text-[#29B6F6]" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-[#EAF2FF]">
              Mars Hydroponic Greenhouse
            </h3>
            <p className="text-xs text-[#A8B6CC]">
              Connected to Life Support &amp; Power ·{' '}
              <span className="font-mono-tabular text-[#29B6F6]">
                {actionsRemaining} of 2 actions left this Sol
              </span>
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-semibold font-mono-tabular ${
            greenhouse.harvestReadiness ? 'text-[#29B6F6]' : 'text-[#A8B6CC]'
          }`}
        >
          {greenhouse.harvestReadiness
            ? '● Harvest Ready'
            : `Stage: ${greenhouse.cropGrowthStage}`}
        </span>
      </div>

      {/* 7 Required Greenhouse Telemetry Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Food Reserves</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#EAF2FF]">
            {resources.foodReserves}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Greenhouse Health</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#EAF2FF]">
            {greenhouse.health}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Water Availability</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#29B6F6]">
            {greenhouse.waterAvailability}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Power Draw</p>
          <p className="mt-1 font-mono-tabular text-sm sm:text-base font-bold text-[#FFB547]">
            {greenhouse.powerConsumption}
          </p>
        </div>
      </div>

      {/* Crop Growth Stage + Irrigation + Harvest Readiness Strip */}
      <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-medium text-[#EAF2FF]">
            Crop Growth Stage:{' '}
            <strong className="text-[#29B6F6]">{greenhouse.cropGrowthStage}</strong>
          </span>
          <span className="font-mono-tabular text-[#EAF2FF]">
            {greenhouse.cropGrowthProgress}% / 100%
          </span>
        </div>

        <div
          className="h-2.5 w-full rounded-full bg-[#111C32] border border-[#293A54] overflow-hidden"
          role="progressbar"
          aria-valuenow={greenhouse.cropGrowthProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Crop growth ${greenhouse.cropGrowthProgress} percent`}
        >
          <div
            className="h-full bg-[#29B6F6] transition-all duration-300"
            style={{ width: `${greenhouse.cropGrowthProgress}%` }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <span className="text-[#A8B6CC]">
            Irrigation Status:{' '}
            <strong className={irrigationColor}>{greenhouse.irrigationStatus}</strong>
          </span>
          <span className="text-[#A8B6CC]">
            Harvest Readiness:{' '}
            <strong
              className={
                greenhouse.harvestReadiness ? 'text-[#29B6F6]' : 'text-[#EAF2FF]'
              }
            >
              {greenhouse.harvestReadiness
                ? 'Ready to Harvest'
                : `${100 - greenhouse.cropGrowthProgress}% growth remaining`}
            </strong>
          </span>
        </div>
      </div>

      {/* Four Interactive Greenhouse Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GREENHOUSE_ACTIONS.map((action) => {
          const IconComponent = action.icon;
          const alreadyUsed = greenhouse.actionsUsedThisSol.includes(action.id);
          const unreadyHarvest =
            action.id === 'harvest-crops' && !greenhouse.harvestReadiness;
          const lowPowerBoost =
            action.id === 'allocate-power' && resources.power < 15;
          const disabled =
            !canInteract ||
            alreadyUsed ||
            actionsRemaining === 0 ||
            unreadyHarvest ||
            lowPowerBoost;

          return (
            <button
              key={action.id}
              type="button"
              disabled={disabled}
              onClick={() => onGreenhouseAction(action.id)}
              className="text-left rounded-lg bg-[#080D1B] hover:bg-[#1E3353]/70 disabled:opacity-50 disabled:cursor-not-allowed border border-[#293A54] hover:border-[#29B6F6] p-3.5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29B6F6]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-[#E4774E] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-[#EAF2FF]">
                    {action.label}
                  </span>
                </div>
                {alreadyUsed && (
                  <span className="text-xs font-mono-tabular text-[#29B6F6] shrink-0">
                    Done
                  </span>
                )}
              </div>

              <p className="mt-2 text-xs text-[#29B6F6]">{action.benefit}</p>
              <p className="mt-0.5 text-xs text-[#FFB547]">
                Trade-off: {action.cost}
              </p>

              {unreadyHarvest && (
                <p className="mt-1.5 text-xs text-[#A8B6CC]">
                  Locked until crops reach 100% Harvest Ready.
                </p>
              )}
              {lowPowerBoost && (
                <p className="mt-1.5 text-xs text-[#E4774E]">
                  Needs at least 15% Power reserve to boost lights.
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Consequence Feedback */}
      {greenhouse.lastActionFeedback && (
        <div
          role="status"
          className="rounded-lg bg-[#080D1B] border border-[#29B6F6]/60 p-3.5"
        >
          <p className="text-xs font-semibold text-[#29B6F6]">
            {greenhouse.lastActionFeedback.title}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-[#EAF2FF]/95 leading-relaxed">
            {greenhouse.lastActionFeedback.explanation}
          </p>
        </div>
      )}

      {/* Scientific Learning Panel Toggle & Content */}
      <div className="border-t border-[#293A54] pt-4">
        <button
          type="button"
          onClick={() => setScienceOpen((prev) => !prev)}
          aria-expanded={scienceOpen}
          className="w-full flex items-center justify-between gap-3 text-left min-h-[40px] px-3 py-2 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
            <BookOpen className="w-4 h-4 text-[#29B6F6]" />
            <span>Why Growing Food on Mars Is Tricky (Science Guide)</span>
          </span>
          {scienceOpen ? (
            <ChevronUp className="w-4 h-4 text-[#A8B6CC]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#A8B6CC]" />
          )}
        </button>

        {scienceOpen && (
          <div className="mt-3 space-y-2.5">
            {GREENHOUSE_SCIENCE_LESSONS.map((lesson) => (
              <div
                key={lesson.question}
                className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5"
              >
                <p className="text-xs sm:text-sm font-semibold text-[#29B6F6]">
                  {lesson.question}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-[#A8B6CC] leading-relaxed">
                  {lesson.answer}
                </p>
              </div>
            ))}
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-[#EAF2FF]">
                  {CSA_RESOURCES[0].title}
                </span>
                <CornerWatermark label="Resource: CSA" />
              </div>
              <p className="text-xs text-[#A8B6CC] leading-relaxed">
                {CSA_RESOURCES[0].summary} {CSA_RESOURCES[1].summary}
              </p>
              <a
                href={CSA_RESOURCES[0].url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
              >
                <span>{CSA_RESOURCES[0].linkLabel}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>

      <p className="text-xs text-[#A8B6CC]">
        Simulated gameplay values—crop speed and harvest boosts are tuned for a 10-Sol game.
      </p>
    </section>
  );
}
