import { useState } from 'react';
import {
  AlertTriangle,
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
    label: 'Check Pumps & Grow Lights',
    benefit: '+14% Plant Health · +2% Air & Water',
    cost: '-5% Power · -4% Crew Energy',
    icon: Wrench,
  },
  {
    id: 'allocate-power',
    label: 'Boost Grow Lights',
    benefit: '+30% Plant Growth · +4% Health · +3% Air',
    cost: '-8% Power (Brightens LED Lights)',
    icon: Zap,
  },
  {
    id: 'repair-irrigation',
    label: 'Unclog Water Pipes',
    benefit: 'Smooth Water Flow · +18% Water · +6% Health',
    cost: '-4% Shield Water · -4% Power · -4% Crew Energy',
    icon: Droplets,
  },
  {
    id: 'harvest-crops',
    label: 'Harvest Fresh Food',
    benefit: '+18% Food Supply · +8% Life Support',
    cost: 'Needs 100% Growth · -10% Water · -3% Power · -5% Energy',
    icon: Wheat,
  },
];

const GREENHOUSE_SCIENCE_LESSONS = [
  {
    question: 'Why not plant seeds straight into Mars dirt?',
    answer:
      'Mars dirt has salty chemicals that hurt plants, so astronauts grow food indoors using clean water and nutrients (hydroponics).',
  },
  {
    question: 'Why do Mars greenhouses need so much electricity?',
    answer:
      'Mars nights drop far below freezing, so heaters, water pumps, and bright grow lights all run on battery power.',
  },
  {
    question: 'Why do astronauts still bring packaged food from Earth?',
    answer:
      'Vegetables take days to sprout and ripen, so stored Earth meals keep the crew fed during dust storms.',
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
            greenhouse.cropsSpoiled
              ? 'text-[#E4774E]'
              : greenhouse.harvestReadiness
                ? 'text-[#29B6F6]'
                : 'text-[#A8B6CC]'
          }`}
        >
          {greenhouse.cropsSpoiled
            ? '✖ Crops Spoiled'
            : greenhouse.harvestReadiness
              ? '● Harvest Ready'
              : `Stage: ${greenhouse.cropGrowthStage}`}
        </span>
      </div>

      {/* Frost / Crop Spoilage Alert Banner */}
      {(greenhouse.cropsSpoiled || greenhouse.lowPowerStreak >= 1 || resources.power < 25) && (
        <div
          role="alert"
          className={`rounded-lg bg-[#080D1B] border p-3.5 flex items-start gap-2.5 ${
            greenhouse.cropsSpoiled ? 'border-[#E4774E]' : 'border-[#FFB547]'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 shrink-0 mt-0.5 ${
              greenhouse.cropsSpoiled ? 'text-[#E4774E]' : 'text-[#FFB547]'
            }`}
          />
          <div className="text-xs leading-relaxed">
            {greenhouse.cropsSpoiled ? (
              <p className="text-[#EAF2FF]">
                <strong className="text-[#E4774E]">Crops Spoiled:</strong> Frozen pipes
                or prolonged low power ruined this harvest. Use{' '}
                <strong>Clear Spoiled Crops &amp; Re-seed</strong> below to plant fresh
                seedlings.
              </p>
            ) : (
              <p className="text-[#EAF2FF]">
                <strong className="text-[#FFB547]">Frost Risk: Power &lt; 25%:</strong>{' '}
                {greenhouse.lowPowerStreak >= 1
                  ? 'Another low-power night (<25%) will freeze pipes and spoil all crops.'
                  : 'Raise Power to at least 25% before nightfall to protect greenhouse heaters.'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 4 Simple Greenhouse Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Food Supply</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#EAF2FF]">
            {resources.foodReserves}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Plant Health</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#EAF2FF]">
            {greenhouse.health}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Water Tank</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#29B6F6]">
            {greenhouse.waterAvailability}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Electricity Used</p>
          <p className="mt-1 font-mono-tabular text-sm sm:text-base font-bold text-[#FFB547]">
            {greenhouse.powerConsumption}
          </p>
        </div>
      </div>

      {/* Visual Plant Tray + Crop Growth Bar */}
      <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <svg
              viewBox="0 0 74 36"
              className="w-[74px] h-[36px] shrink-0 rounded bg-[#0B172A] border border-[#293A54]"
              aria-hidden="true"
            >
              {/* LED light bar */}
              <line
                x1="8"
                y1="6"
                x2="66"
                y2="6"
                stroke={
                  greenhouse.cropsSpoiled
                    ? '#E4774E'
                    : resources.power < 25
                      ? '#FFB547'
                      : '#6FE3FF'
                }
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Soil tray */}
              <rect x="8" y="27" width="58" height="5" rx="2" fill="#233754" />
              {/* Three sprouts reflecting current plant state */}
              {[20, 37, 54].map((cx) => (
                <g key={cx}>
                  <line
                    x1={cx}
                    y1="27"
                    x2={cx}
                    y2={greenhouse.cropsSpoiled ? '21' : '15'}
                    stroke={greenhouse.cropsSpoiled ? '#9A3412' : '#34D399'}
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  <ellipse
                    cx={cx - 4}
                    cy={greenhouse.cropsSpoiled ? 22 : 17}
                    rx="4"
                    ry="2.2"
                    fill={
                      greenhouse.cropsSpoiled
                        ? '#B94A32'
                        : resources.power < 25
                          ? '#93C5FD'
                          : '#34D399'
                    }
                  />
                  <ellipse
                    cx={cx + 4}
                    cy={greenhouse.cropsSpoiled ? 22 : 16}
                    rx="4"
                    ry="2.2"
                    fill={
                      greenhouse.cropsSpoiled
                        ? '#E4774E'
                        : resources.power < 25
                          ? '#60A5FA'
                          : '#2DD4BF'
                    }
                  />
                </g>
              ))}
            </svg>
            <div className="text-xs">
              <span className="font-medium text-[#EAF2FF]">
                Plant Stage:{' '}
                <strong
                  className={
                    greenhouse.cropsSpoiled ? 'text-[#E4774E]' : 'text-[#29B6F6]'
                  }
                >
                  {greenhouse.cropGrowthStage}
                </strong>
              </span>
              <p className="text-[11px] text-[#A8B6CC]">
                {greenhouse.cropsSpoiled
                  ? 'Frozen crops — clear tray and plant new seeds'
                  : resources.power < 25
                    ? 'Cold warning: keep Power at 25%+ so heaters stay on'
                    : 'Warm LED lights helping crops grow'}
              </p>
            </div>
          </div>
          <span className="font-mono-tabular text-xs font-bold text-[#EAF2FF]">
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
            className={`h-full transition-all duration-300 ${
              greenhouse.cropsSpoiled ? 'bg-[#E4774E]' : 'bg-[#29B6F6]'
            }`}
            style={{
              width: `${greenhouse.cropsSpoiled ? 100 : greenhouse.cropGrowthProgress}%`,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <span className="text-[#A8B6CC]">
            Water Pipes:{' '}
            <strong className={irrigationColor}>{greenhouse.irrigationStatus}</strong>
          </span>
          <span className="text-[#A8B6CC]">
            Harvest:{' '}
            <strong
              className={
                greenhouse.cropsSpoiled
                  ? 'text-[#E4774E]'
                  : greenhouse.harvestReadiness
                    ? 'text-[#29B6F6]'
                    : 'text-[#EAF2FF]'
              }
            >
              {greenhouse.cropsSpoiled
                ? 'Needs Re-seeding'
                : greenhouse.harvestReadiness
                  ? 'Ready Now!'
                  : `${100 - greenhouse.cropGrowthProgress}% more to grow`}
            </strong>
          </span>
        </div>
      </div>

      {/* Emergency Recovery Action when Crops Are Spoiled */}
      {greenhouse.cropsSpoiled && (
        <button
          type="button"
          disabled={
            !canInteract ||
            actionsRemaining === 0 ||
            greenhouse.actionsUsedThisSol.includes('reseed-crops')
          }
          onClick={() => onGreenhouseAction('reseed-crops')}
          className="w-full text-left rounded-lg bg-[#080D1B] hover:bg-[#1E3353]/70 disabled:opacity-50 disabled:cursor-not-allowed border border-[#E4774E] hover:border-[#29B6F6] p-3.5 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sprout className="w-4 h-4 text-[#E4774E] shrink-0" />
              <span className="text-xs sm:text-sm font-semibold text-[#EAF2FF]">
                Clear Spoiled Crops &amp; Re-seed
              </span>
            </div>
            <span className="text-xs font-mono-tabular text-[#E4774E] shrink-0">
              Recovery Action
            </span>
          </div>
          <p className="mt-2 text-xs text-[#29B6F6]">
            Clears frozen biomass · +15% Seedling Growth · +10% Greenhouse Health
          </p>
          <p className="mt-0.5 text-xs text-[#FFB547]">
            Trade-off: -6% Power · -8% Water · -6% Crew Energy
          </p>
        </button>
      )}

      {/* Four Interactive Greenhouse Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {GREENHOUSE_ACTIONS.map((action) => {
          const IconComponent = action.icon;
          const alreadyUsed = greenhouse.actionsUsedThisSol.includes(action.id);
          const unreadyHarvest =
            action.id === 'harvest-crops' &&
            (!greenhouse.harvestReadiness || greenhouse.cropsSpoiled);
          const spoiledBoost =
            action.id === 'allocate-power' && greenhouse.cropsSpoiled;
          const lowPowerBoost =
            action.id === 'allocate-power' && resources.power < 15;
          const disabled =
            !canInteract ||
            alreadyUsed ||
            actionsRemaining === 0 ||
            unreadyHarvest ||
            spoiledBoost ||
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
                  {greenhouse.cropsSpoiled
                    ? 'Locked while crops are spoiled — re-seed first.'
                    : 'Locked until crops reach 100% Harvest Ready.'}
                </p>
              )}
              {spoiledBoost && (
                <p className="mt-1.5 text-xs text-[#E4774E]">
                  Clear spoiled crops and re-seed before boosting grow lights.
                </p>
              )}
              {!spoiledBoost && lowPowerBoost && (
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
