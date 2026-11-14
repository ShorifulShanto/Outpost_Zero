import { useState } from 'react';
import {
  AlertTriangle,
  Atom,
  BatteryCharging,
  ChevronDown,
  ChevronUp,
  Sun,
  Wind,
} from 'lucide-react';
import { ALTERNATIVE_POWER_CONCEPTS } from '../engine/missionData';
import { GameState, PowerActionId } from '../types/mission';
import { InfoHoverTip } from './InfoHoverTip';

interface PowerOperationsPanelProps {
  gameState: GameState;
  onPowerAction: (actionId: PowerActionId) => void;
}

export function PowerOperationsPanel({
  gameState,
  onPowerAction,
}: PowerOperationsPanelProps) {
  const [conceptsOpen, setConceptsOpen] = useState(false);

  const { resources, powerOps, greenhouse, phase, isPaused } = gameState;
  const canInteract = phase === 'playing' && !isPaused;
  const savingUsed = powerOps.actionsUsedThisSol.includes('toggle-power-saving');
  const cleanUsed = powerOps.actionsUsedThisSol.includes('clean-solar-panels');
  const blockedByStorm = powerOps.stormSeverity === 'Regional Storm';
  const dustPct = Math.max(0, Math.min(100, powerOps.dustAccumulation));
  const dustOverlayOpacity = Math.min(0.88, dustPct / 75);

  return (
    <section
      aria-label="Mars Power and Dust Operations"
      className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
            <Sun className="w-4 h-4 text-[#FFB547]" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-[#EAF2FF]">
              Solar Power &amp; Mars Dust
            </h3>
            <p className="text-xs text-[#A8B6CC]">
              Mars gets less than half of Earth&apos;s sunlight, and red dust coats panels every day
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <InfoHoverTip
            label="Shared Batteries"
            title="One Battery Feeds the Whole Base"
            body={`Greenhouse grow lights (${greenhouse.powerConsumption} use), cabin heaters, and air fans all share the same batteries.`}
            accent="amber"
          />
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-semibold font-mono-tabular ${
              blockedByStorm
                ? 'text-[#E4774E]'
                : powerOps.stormSeverity === 'Light Dust'
                  ? 'text-[#FFB547]'
                  : 'text-[#29B6F6]'
            }`}
          >
            {blockedByStorm && <AlertTriangle className="w-3.5 h-3.5" />}
            <span>Sky: {powerOps.stormSeverity}</span>
          </span>
        </div>
      </div>

      {/* Kid-Friendly Visual Diagram: How Dust Falling on Solar Panels Blocks Sunlight */}
      <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <svg
          viewBox="0 0 220 78"
          className="w-full sm:w-[210px] h-auto shrink-0 rounded bg-[#0A1324] border border-[#293A54]/70"
          role="img"
          aria-label={`Visual solar panel showing ${dustPct}% Martian dust coating`}
        >
          {/* Sun & Light Rays */}
          <circle cx="28" cy="20" r="9" fill="#FFB547" fillOpacity={blockedByStorm ? 0.35 : 0.9} />
          <g
            stroke="#FFB547"
            strokeWidth="1.6"
            strokeDasharray="3 3"
            strokeOpacity={blockedByStorm ? 0.28 : 0.75}
          >
            <line x1="40" y1="22" x2="88" y2="34" />
            <line x1="36" y1="30" x2="72" y2="44" />
          </g>

          {/* Tilted Solar Panel */}
          <polygon
            points="66,46 154,28 176,56 88,72"
            fill="#17355E"
            stroke="#29B6F6"
            strokeWidth="1.4"
          />
          {/* Blue Solar Cell Grid */}
          <g stroke="#62B6FF" strokeOpacity="0.45" strokeWidth="1">
            <line x1="95" y1="40" x2="117" y2="66" />
            <line x1="125" y1="34" x2="147" y2="60" />
            <line x1="77" y1="59" x2="165" y2="42" />
          </g>

          {/* Falling / Settled Red Mars Dust Layer */}
          {dustPct > 0 && (
            <g>
              <polygon
                points="66,46 154,28 176,56 88,72"
                fill="#C9643B"
                fillOpacity={dustOverlayOpacity}
              />
              <g fill="#F09A6E" fillOpacity={Math.min(0.95, dustOverlayOpacity + 0.2)}>
                <circle cx="98" cy="48" r="1.6" />
                <circle cx="118" cy="44" r="2" />
                <circle cx="142" cy="39" r="1.5" />
                <circle cx="110" cy="59" r="1.8" />
                <circle cx="135" cy="54" r="2.1" />
                <circle cx="154" cy="49" r="1.4" />
                <circle cx="122" cy="18" r="1.2" />
                <circle cx="148" cy="15" r="1.3" />
                <circle cx="164" cy="22" r="1.1" />
              </g>
            </g>
          )}

          {/* Status Pill Inside SVG */}
          <text
            x="196"
            y="24"
            textAnchor="middle"
            fill={dustPct >= 20 ? '#FFB547' : '#29B6F6'}
            fontSize="11"
            fontWeight="700"
            fontFamily="JetBrains Mono, monospace"
          >
            {dustPct}%
          </text>
          <text
            x="196"
            y="36"
            textAnchor="middle"
            fill="#A8B6CC"
            fontSize="8.5"
          >
            DUST
          </text>
        </svg>

        <div className="space-y-1 text-xs">
          <p className="font-semibold text-[#EAF2FF]">
            {blockedByStorm
              ? 'Dust Storm Blowing: Sunlight Is Dimmed!'
              : dustPct >= 25
                ? 'Panels Are Dusty — Sunlight Is Blocked!'
                : dustPct >= 10
                  ? 'Light Mars Dust Settling on Panels'
                  : 'Solar Panels Are Clean & Charging Fast!'}
          </p>
          <p className="text-[#A8B6CC] leading-relaxed">
            {blockedByStorm
              ? 'High winds scatter red dust in the sky and coat solar wings. Wait for calm weather before stepping outside to brush them.'
              : 'Fine red Mars dust settles onto blue solar cells like powder, blocking sunlight. Brushing them clean boosts your power right away!'}
          </p>
        </div>
      </div>

      {/* Power Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Sunlight Power</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#EAF2FF]">
            {resources.solarGeneration}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Battery Charge</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#29B6F6]">
            {resources.batteryReserve}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Dust on Panels</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#FFB547]">
            {powerOps.dustAccumulation}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Power Saver</p>
          <p className="mt-1 font-mono-tabular text-sm font-bold text-[#EAF2FF]">
            {powerOps.powerSavingMode ? 'On (Saving)' : resources.energyConsumption}
          </p>
        </div>
      </div>

      {/* Interactive Power Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!canInteract || savingUsed}
          onClick={() => onPowerAction('toggle-power-saving')}
          className="text-left min-h-[44px] rounded-lg bg-[#080D1B] hover:bg-[#1E3353]/70 disabled:opacity-50 disabled:cursor-not-allowed border border-[#293A54] hover:border-[#29B6F6] p-3.5 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
              <BatteryCharging className="w-4 h-4 text-[#29B6F6] shrink-0" />
              <span>
                {powerOps.powerSavingMode
                  ? 'Turn Off Power-Saving Mode'
                  : 'Turn On Power-Saving Mode'}
              </span>
            </span>
            {savingUsed && (
              <span className="text-xs font-mono-tabular text-[#29B6F6]">Done</span>
            )}
          </div>
          <p className="mt-2 text-xs text-[#29B6F6]">
            {powerOps.powerSavingMode
              ? 'Turns full greenhouse & science power back on'
              : 'Saves battery overnight (+3% Power saved)'}
          </p>
          <p className="mt-0.5 text-xs text-[#FFB547]">
            Trade-off:{' '}
            {powerOps.powerSavingMode
              ? 'Uses more battery overnight'
              : 'Plants grow a little slower overnight'}
          </p>
        </button>

        <button
          type="button"
          disabled={!canInteract || cleanUsed || blockedByStorm}
          onClick={() => onPowerAction('clean-solar-panels')}
          className="text-left min-h-[44px] rounded-lg bg-[#080D1B] hover:bg-[#1E3353]/70 disabled:opacity-50 disabled:cursor-not-allowed border border-[#293A54] hover:border-[#29B6F6] p-3.5 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
              <Wind className="w-4 h-4 text-[#E4774E] shrink-0" />
              <span>Brush Dust Off Solar Panels</span>
            </span>
            {cleanUsed && (
              <span className="text-xs font-mono-tabular text-[#29B6F6]">Done</span>
            )}
          </div>
          <p className="mt-2 text-xs text-[#29B6F6]">
            -25% Dust · +12% Sunlight Power · +8% Power
          </p>
          <p className="mt-0.5 text-xs text-[#FFB547]">
            Trade-off: Uses 4% air (spacewalk suit) · -5% Crew Energy
          </p>
          {blockedByStorm && (
            <p className="mt-1.5 text-xs text-[#E4774E] font-medium">
              Unsafe during Regional Storm — wait for calm skies first.
            </p>
          )}
        </button>
      </div>

      {/* Feedback Banner */}
      {powerOps.lastActionFeedback && (
        <div
          role="status"
          className="rounded-lg bg-[#080D1B] border border-[#29B6F6]/60 p-3.5"
        >
          <p className="text-xs font-semibold text-[#29B6F6]">
            {powerOps.lastActionFeedback.title}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-[#EAF2FF]/95 leading-relaxed">
            {powerOps.lastActionFeedback.explanation}
          </p>
        </div>
      )}

      {/* Expandable Future Mars Power Ideas */}
      <div className="border-t border-[#293A54] pt-4">
        <button
          type="button"
          onClick={() => setConceptsOpen((prev) => !prev)}
          aria-expanded={conceptsOpen}
          className="w-full flex items-center justify-between gap-3 text-left min-h-[42px] px-3 py-2 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
            <Atom className="w-4 h-4 text-[#29B6F6]" />
            <span>Other Ways Future Bases Make Power (Science Info)</span>
          </span>
          {conceptsOpen ? (
            <ChevronUp className="w-4 h-4 text-[#A8B6CC]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#A8B6CC]" />
          )}
        </button>

        {conceptsOpen && (
          <div className="mt-3 space-y-2.5">
            <p className="text-xs text-[#FFB547] leading-relaxed">
              Just for learning—Outpost Zero runs on solar panels and batteries, not these future systems:
            </p>
            {ALTERNATIVE_POWER_CONCEPTS.map((concept) => (
              <div
                key={concept.name}
                className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5"
              >
                <p className="text-xs sm:text-sm font-semibold text-[#29B6F6]">
                  {concept.name}
                </p>
                <p className="mt-1 text-xs sm:text-sm text-[#A8B6CC] leading-relaxed">
                  {concept.summary}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
