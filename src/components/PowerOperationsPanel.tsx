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
              Solar Power &amp; Dust Operations
            </h3>
            <p className="text-xs text-[#A8B6CC]">
              Max Martian solar flux is ~45% of Earth · Dust builds ~0.2%/Sol in rover
              studies
            </p>
          </div>
        </div>

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

      {/* Power Telemetry Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Solar Output</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#EAF2FF]">
            {resources.solarGeneration}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Battery Reserve</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#29B6F6]">
            {resources.batteryReserve}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Panel Dust</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#FFB547]">
            {powerOps.dustAccumulation}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Power Mode</p>
          <p className="mt-1 font-mono-tabular text-sm font-bold text-[#EAF2FF]">
            {powerOps.powerSavingMode ? 'Power-Saving' : resources.energyConsumption}
          </p>
        </div>
      </div>

      {/* Competing Load Note */}
      <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 text-xs text-[#A8B6CC] leading-relaxed">
        <strong className="text-[#EAF2FF]">Competing Power Loads:</strong> Greenhouse
        grow lights (<strong className="text-[#FFB547]">{greenhouse.powerConsumption}</strong>
        ), life-support heaters, and air scrubbers share the same batteries. Dust storms
        reduce solar charging partially—not to zero—making load management vital.
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
                  ? 'Restore Standard Power Mode'
                  : 'Enable Emergency Power-Saving Mode'}
              </span>
            </span>
            {savingUsed && (
              <span className="text-xs font-mono-tabular text-[#29B6F6]">Done</span>
            )}
          </div>
          <p className="mt-2 text-xs text-[#29B6F6]">
            {powerOps.powerSavingMode
              ? 'Restores normal science & greenhouse light levels'
              : 'Conserves overnight batteries (+3% Power upkeep)'}
          </p>
          <p className="mt-0.5 text-xs text-[#FFB547]">
            Trade-off:{' '}
            {powerOps.powerSavingMode
              ? 'Increases overnight battery draw'
              : 'Slows overnight greenhouse growth slightly'}
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
              <span>Perform Solar-Panel Maintenance</span>
            </span>
            {cleanUsed && (
              <span className="text-xs font-mono-tabular text-[#29B6F6]">Done</span>
            )}
          </div>
          <p className="mt-2 text-xs text-[#29B6F6]">
            -25% Dust · +12% Solar Output · +8% Power
          </p>
          <p className="mt-0.5 text-xs text-[#FFB547]">
            Trade-off: -4% Life Support (EVA suit O2) · -5% Crew Energy
          </p>
          {blockedByStorm && (
            <p className="mt-1.5 text-xs text-[#E4774E] font-medium">
              Blocked during Regional Storm — wait for calm skies before EVA brushing.
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

      {/* Expandable Alternative Power Concepts (Educational Only) */}
      <div className="border-t border-[#293A54] pt-4">
        <button
          type="button"
          onClick={() => setConceptsOpen((prev) => !prev)}
          aria-expanded={conceptsOpen}
          className="w-full flex items-center justify-between gap-3 text-left min-h-[42px] px-3 py-2 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
            <Atom className="w-4 h-4 text-[#29B6F6]" />
            <span>Alternative Mars Power Concepts (Educational Only)</span>
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
              Educational Concepts — Outpost Zero currently relies on solar arrays and
              batteries, not the future or specialized power technologies below:
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
