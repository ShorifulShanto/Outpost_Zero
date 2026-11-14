import { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Home,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import {
  RADLAB_DOSIMETRY_BENCHMARKS,
  RADLAB_UNITS_EXPLANATION,
} from '../data/spaceResearchData';
import { GameState, ShelterActionId } from '../types/mission';
import { CornerWatermark } from './DataWatermark';

interface RadiationShelterPanelProps {
  gameState: GameState;
  onShelterAction: (actionId: ShelterActionId) => void;
}

export function RadiationShelterPanel({
  gameState,
  onShelterAction,
}: RadiationShelterPanelProps) {
  const [scienceOpen, setScienceOpen] = useState(false);

  const { radiationShelter, resources, phase, isPaused } = gameState;
  const canInteract = phase === 'playing' && !isPaused;
  const isSpeWarning = radiationShelter.radiationAlert === 'SPE Warning';
  const reinforceUsed =
    radiationShelter.actionsUsedThisSol.includes('reinforce-shelter');
  const moveUsed =
    radiationShelter.actionsUsedThisSol.includes('enter-shelter') ||
    radiationShelter.actionsUsedThisSol.includes('exit-shelter');

  return (
    <section
      aria-label="Radiation Protection and Storm Shelter"
      className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-[#080D1B] border border-[#293A54] flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-[#E4774E]" />
          </div>
          <div>
            <h3 className="font-display text-base sm:text-lg font-semibold text-[#EAF2FF]">
              Radiation Protection &amp; Storm Shelter
            </h3>
            <p className="text-xs text-[#A8B6CC]">
              Shielding reduces radiation dose—never eliminates space radiation 100%
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold font-mono-tabular ${
            radiationShelter.radiationLeakActive || isSpeWarning
              ? 'text-[#E4774E]'
              : radiationShelter.radiationAlert === 'SPE Advisory'
                ? 'text-[#FFB547]'
                : 'text-[#29B6F6]'
          }`}
        >
          {(isSpeWarning || radiationShelter.radiationLeakActive) && (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span>
            {radiationShelter.radiationLeakActive
              ? 'Radiation Leak Active'
              : radiationShelter.radiationAlert}
          </span>
        </span>
      </div>

      {/* Active Radiation Leak Alert */}
      {radiationShelter.radiationLeakActive && (
        <div
          role="alert"
          className="rounded-lg bg-[#080D1B] border border-[#E4774E] p-3.5 flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-[#E4774E] shrink-0 mt-0.5" />
          <p className="text-xs text-[#EAF2FF] leading-relaxed">
            <strong className="text-[#E4774E]">Radiation Leak Active:</strong>{' '}
            A gap in the shield wall is letting space rays inside! Click{' '}
            <strong>Seal Leak &amp; Fix Shielding</strong> below to protect your crew.
          </p>
        </div>
      )}

      {/* Visual Radiation Shield Diagram */}
      <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 flex flex-col sm:flex-row sm:items-center gap-4">
        <svg
          viewBox="0 0 210 72"
          className="w-full sm:w-[200px] h-auto shrink-0 rounded bg-[#0A1324] border border-[#293A54]/70"
          role="img"
          aria-label="Diagram showing water walls and Mars soil blocking solar rays"
        >
          {/* Incoming Solar Rays */}
          <g stroke={isSpeWarning ? '#E4774E' : '#FFB547'} strokeWidth="1.8" strokeLinecap="round">
            <line x1="12" y1="18" x2="64" y2="28" strokeDasharray="4 3" />
            <line x1="10" y1="36" x2="64" y2="36" strokeDasharray="4 3" />
            <line x1="12" y1="54" x2="64" y2="44" strokeDasharray="4 3" />
          </g>
          {/* Packed Mars Soil Layer */}
          <rect x="68" y="10" width="14" height="52" rx="3" fill="#9A482B" />
          {/* Water Tank Wall */}
          <rect x="84" y="10" width="14" height="52" rx="3" fill="#29B6F6" fillOpacity="0.72" />
          {/* Breach if leak active */}
          {radiationShelter.radiationLeakActive && (
            <line x1="65" y1="36" x2="128" y2="36" stroke="#E4774E" strokeWidth="2.4" />
          )}
          {/* Protected Crew Dots */}
          <g fill={radiationShelter.crewSheltered ? '#29B6F6' : '#EAF2FF'}>
            <circle cx="136" cy="30" r="4.5" />
            <circle cx="152" cy="30" r="4.5" />
            <circle cx="136" cy="46" r="4.5" />
            <circle cx="152" cy="46" r="4.5" />
          </g>
          <text x="176" y="34" textAnchor="middle" fill="#A8B6CC" fontSize="8">
            SOIL +
          </text>
          <text x="176" y="45" textAnchor="middle" fill="#29B6F6" fontSize="8" fontWeight="700">
            WATER
          </text>
        </svg>
        <p className="text-xs text-[#A8B6CC] leading-relaxed">
          <strong className="text-[#EAF2FF]">How Shelter Walls Work:</strong> Packed Mars dirt
          and water tanks block fast solar storm rays before they reach your astronauts.
        </p>
      </div>

      {/* Simple Shelter Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Shelter Ready</p>
          <p className="mt-1 font-mono-tabular text-lg font-bold text-[#29B6F6]">
            {radiationShelter.shelterReadiness}%
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Where Crew Is</p>
          <p className="mt-1 font-mono-tabular text-xs sm:text-sm font-bold text-[#EAF2FF]">
            {radiationShelter.crewSheltered
              ? '● Safe in Shelter'
              : '○ Working in Bays'}
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Shelter Seal</p>
          <p
            className={`mt-1 font-mono-tabular text-xs sm:text-sm font-bold ${
              radiationShelter.radiationLeakActive
                ? 'text-[#E4774E]'
                : 'text-[#29B6F6]'
            }`}
          >
            {radiationShelter.radiationLeakActive
              ? '✖ Leak Active'
              : '● Tightly Sealed'}
          </p>
        </div>

        <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3">
          <p className="text-xs text-[#A8B6CC]">Radiation Taken</p>
          <p className="mt-1 font-mono-tabular text-base sm:text-lg font-bold text-[#FFB547]">
            {(radiationShelter.cumulativeDoseMSv ?? 0.67).toFixed(2)} mSv
          </p>
        </div>
      </div>

      {/* Interactive Shelter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          type="button"
          disabled={!canInteract || moveUsed}
          onClick={() =>
            onShelterAction(
              radiationShelter.crewSheltered ? 'exit-shelter' : 'enter-shelter'
            )
          }
          className="text-left min-h-[44px] rounded-lg bg-[#080D1B] hover:bg-[#1E3353]/70 disabled:opacity-50 disabled:cursor-not-allowed border border-[#293A54] hover:border-[#29B6F6] p-3.5 transition-colors cursor-pointer"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
              <Home className="w-4 h-4 text-[#29B6F6] shrink-0" />
              <span>
                {radiationShelter.crewSheltered
                  ? 'Return Crew to Habitat Bays'
                  : 'Move Crew Into Shelter'}
              </span>
            </span>
            {moveUsed && (
              <span className="text-xs font-mono-tabular text-[#29B6F6]">Done</span>
            )}
          </div>
          <p className="mt-2 text-xs text-[#29B6F6]">
            {radiationShelter.crewSheltered
              ? '+2% Life Support (full bay access)'
              : '+6% Radiation Protection · Low exposure risk'}
          </p>
          <p className="mt-0.5 text-xs text-[#FFB547]">
            Trade-off:{' '}
            {radiationShelter.crewSheltered
              ? '-2% Radiation protection margin'
              : '-4% Power for shelter air fans'}
          </p>
        </button>

        <button
          type="button"
          disabled={!canInteract || reinforceUsed || resources.power < 12}
          onClick={() => onShelterAction('reinforce-shelter')}
          className={`text-left min-h-[44px] rounded-lg bg-[#080D1B] hover:bg-[#1E3353]/70 disabled:opacity-50 disabled:cursor-not-allowed border p-3.5 transition-colors cursor-pointer ${
            radiationShelter.radiationLeakActive
              ? 'border-[#E4774E] hover:border-[#29B6F6]'
              : 'border-[#293A54] hover:border-[#29B6F6]'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
              <ShieldCheck className="w-4 h-4 text-[#E4774E] shrink-0" />
              <span>
                {radiationShelter.radiationLeakActive
                  ? 'Seal Radiation Leak & Reinforce'
                  : 'Reinforce Shelter Shielding'}
              </span>
            </span>
            {reinforceUsed && (
              <span className="text-xs font-mono-tabular text-[#29B6F6]">Done</span>
            )}
          </div>
          <p className="mt-2 text-xs text-[#29B6F6]">
            {radiationShelter.radiationLeakActive
              ? 'Seals Active Leak · +14% Shelter Readiness · +10% Radiation'
              : '+14% Shelter Readiness · +6% Radiation Protection'}
          </p>
          <p className="mt-0.5 text-xs text-[#FFB547]">
            Trade-off: -6% Power · -5% Crew Energy
          </p>
          {resources.power < 12 && (
            <p className="mt-1.5 text-xs text-[#E4774E]">
              Needs at least 12% Power reserve.
            </p>
          )}
        </button>
      </div>

      {/* Action Feedback */}
      {radiationShelter.lastActionFeedback && (
        <div
          role="status"
          className="rounded-lg bg-[#080D1B] border border-[#29B6F6]/60 p-3.5"
        >
          <p className="text-xs font-semibold text-[#29B6F6]">
            {radiationShelter.lastActionFeedback.title}
          </p>
          <p className="mt-1 text-xs sm:text-sm text-[#EAF2FF]/95 leading-relaxed">
            {radiationShelter.lastActionFeedback.explanation}
          </p>
        </div>
      )}

      {/* Expandable GCR vs SPE & Mars Ice Home Guide */}
      <div className="border-t border-[#293A54] pt-4">
        <button
          type="button"
          onClick={() => setScienceOpen((prev) => !prev)}
          aria-expanded={scienceOpen}
          className="w-full flex items-center justify-between gap-3 text-left min-h-[42px] px-3 py-2 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] transition-colors cursor-pointer"
        >
          <span className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#EAF2FF]">
            <BookOpen className="w-4 h-4 text-[#29B6F6]" />
            <span>Daily Space Rays vs. Solar Storms (Science Guide)</span>
          </span>
          {scienceOpen ? (
            <ChevronUp className="w-4 h-4 text-[#A8B6CC]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#A8B6CC]" />
          )}
        </button>

        {scienceOpen && (
          <div className="mt-3 space-y-2.5 text-xs sm:text-sm">
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5">
              <p className="font-semibold text-[#29B6F6]">
                Daily Space Rays vs. Solar Storm Bursts
              </p>
              <p className="mt-1 text-[#A8B6CC] leading-relaxed">
                Gentle space rays arrive every day, while Solar Storms send sudden bright bursts.
                Water walls and packed Mars soil block most rays safely.
              </p>
            </div>
            <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-2 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold text-[#29B6F6]">
                  Real Radiation Benchmarks (mGy vs. mSv)
                </p>
                <CornerWatermark label="Data: NASA RadLab" />
              </div>
              <div className="space-y-1.5">
                {RADLAB_DOSIMETRY_BENCHMARKS.map((item) => (
                  <div
                    key={item.id}
                    className="rounded border border-[#293A54] bg-[#111C32]/60 p-2.5"
                  >
                    <p className="font-semibold text-[#EAF2FF]">
                      {item.environment} · {item.doseEquivalentRate}
                    </p>
                    <p className="text-[#A8B6CC]">{item.contextNote}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-2 text-[#A8B6CC]">
                <span>{RADLAB_UNITS_EXPLANATION.absorbedDose}</span>
                <a
                  href="https://visualization.osdr.nasa.gov/radlab/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-medium text-[#29B6F6] hover:text-[#EAF2FF] shrink-0"
                >
                  <span>RadLab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
