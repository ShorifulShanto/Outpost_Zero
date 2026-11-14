import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MapPin,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Shuffle,
  Sprout,
  Sun,
  Users,
} from 'lucide-react';
import { buildMissionReport } from '../engine/gameEngine';
import { LANDING_SITES } from '../engine/missionData';
import {
  DonkiRadiationContext,
  fetchDonkiCmes,
  fetchDonkiSolarFlares,
  getDonkiRadiationContext,
} from '../services/nasaDonkiService';
import {
  AppRoute,
  DetailedEarthReport,
  GameState,
  GreenhouseActionId,
  LandingSiteId,
  PowerActionId,
  ShelterActionId,
  SpaceWeatherMode,
} from '../types/mission';
import { ExplorerProgressState } from '../utils/explorerProgress';
import { CommunicationDelayPanel } from './CommunicationDelayPanel';
import { GreenhousePanel } from './GreenhousePanel';
import { InfoHoverTip } from './InfoHoverTip';
import { MarsEnvironmentPanel } from './MarsEnvironmentPanel';
import { OutpostSchematic } from './OutpostSchematic';
import { PageBackButton } from './PageBackButton';
import { PowerOperationsPanel } from './PowerOperationsPanel';
import { RadiationShelterPanel } from './RadiationShelterPanel';
import { ResourceCard } from './ResourceCard';

const MissionReportView = lazy(() =>
  import('./MissionReportView').then((m) => ({ default: m.MissionReportView }))
);

interface MissionSimulatorProps {
  gameState: GameState;
  explorerProgress?: ExplorerProgressState;
  onStartMission: () => void;
  onConfigureMission: (config: {
    landingSite?: LandingSiteId;
    spaceWeatherMode?: SpaceWeatherMode;
    liveSpaceWeatherLabel?: string;
    customSeed?: number;
  }) => void;
  onSelectDecision: (optionId: string) => void;
  onGreenhouseAction: (actionId: GreenhouseActionId) => void;
  onPowerAction: (actionId: PowerActionId) => void;
  onShelterAction: (actionId: ShelterActionId) => void;
  onSendDetailedReport: (report: Omit<DetailedEarthReport, 'sol'>) => void;
  onProceedToSummary: () => void;
  onAdvanceNextSol: () => void;
  onTogglePause: () => void;
  onReplayMission: () => void;
  onFullDemoReset: () => void;
  onMarkCommUsed: () => void;
  onNavigate: (route: AppRoute) => void;
  previousRoute?: AppRoute | null;
  onGoBack?: () => void;
}

type SubsystemTab = 'greenhouse' | 'power' | 'shelter';

export function MissionSimulator({
  gameState,
  explorerProgress,
  onStartMission,
  onConfigureMission,
  onSelectDecision,
  onGreenhouseAction,
  onPowerAction,
  onShelterAction,
  onSendDetailedReport,
  onProceedToSummary,
  onAdvanceNextSol,
  onTogglePause,
  onReplayMission,
  onFullDemoReset,
  onMarkCommUsed,
  onNavigate,
  previousRoute = null,
  onGoBack,
}: MissionSimulatorProps) {
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [activeSubsystem, setActiveSubsystem] = useState<SubsystemTab>('greenhouse');
  const [scienceNoteOpen, setScienceNoteOpen] = useState(false);
  const [donkiContext, setDonkiContext] = useState<DonkiRadiationContext>(() =>
    getDonkiRadiationContext()
  );
  const actionLockRef = useRef(false);

  // Non-blocking background refresh of NASA DONKI FLR/CME context for educational display only
  useEffect(() => {
    let active = true;
    void Promise.all([fetchDonkiSolarFlares(30), fetchDonkiCmes(30)]).then(
      ([flr, cme]) => {
        if (!active) return;
        const latestFlare = flr.records[0];
        const latestCme = cme.records[0];
        if (!latestFlare || !latestCme) return;

        const isLive = flr.source === 'live' || cme.source === 'live';
        const isCached =
          !isLive && (flr.source === 'cached' || cme.source === 'cached');
        const speedText =
          latestCme.speedKmS !== null
            ? `${Math.round(latestCme.speedKmS)} km/s`
            : 'tracked';

        setDonkiContext({
          source: isLive ? 'live' : isCached ? 'cached' : 'archived',
          sourceLabel: isLive
            ? 'Live NASA Data'
            : isCached
              ? 'Cached NASA Data'
              : 'Archived NASA Data',
          latestFlare,
          latestCme,
          headline: `NASA DONKI Space Weather: Class ${latestFlare.classType} Flare & ${speedText} CME`,
          scientificContext: `Real space-weather observations—like Class ${latestFlare.classType} solar flares (${latestFlare.beginTime.slice(0, 10)}) and ${speedText} Coronal Mass Ejections (${latestCme.startTime.slice(0, 10)})—show why Mars missions monitor solar eruptions. Not every flare or CME impacts Mars directly, yet high-energy particle events require water-and-polyethylene shelters.`,
        });
      }
    );
    return () => {
      active = false;
    };
  }, []);

  // Prevent rapid double-clicks from executing two turns back-to-back
  const runGuardedAction = useCallback((fn: () => void) => {
    if (actionLockRef.current) return;
    actionLockRef.current = true;
    fn();
    window.setTimeout(() => {
      actionLockRef.current = false;
    }, 250);
  }, []);

  const {
    phase,
    currentSol,
    missionConfig,
    isPaused,
    resources,
    greenhouse,
    environment,
    powerOps,
    radiationShelter,
    commSystem,
    crew,
    activeEvent,
    lastDecision,
    lastSolSummary,
    commAdviceUsedForCurrentEvent,
  } = gameState;

  const canPause = phase === 'playing' || phase === 'outcome' || phase === 'sol-summary';

  const deceasedCount = crew.members.filter((m) => m.status === 'Deceased').length;
  const incapacitatedCount = crew.members.filter(
    (m) => m.status === 'Incapacitated'
  ).length;
  const livingCrewCount = crew.members.length - deceasedCount;
  const radiationLeakActive = Boolean(radiationShelter?.radiationLeakActive);
  const cropsSpoiled = Boolean(greenhouse?.cropsSpoiled);
  const frostWarning =
    !cropsSpoiled && (greenhouse.lowPowerStreak >= 1 || resources.power < 25);

  const activeAlerts: {
    id: string;
    label: string;
    tone: 'critical' | 'warning';
    targetTab?: SubsystemTab;
  }[] = [];
  if (radiationLeakActive) {
    activeAlerts.push({
      id: 'rad-leak',
      label: `Radiation Leak Active (${(radiationShelter.cumulativeDoseMSv ?? 0.67).toFixed(2)} mSv) — Seal in Rad Shelter`,
      tone: 'critical',
      targetTab: 'shelter',
    });
  }
  if (cropsSpoiled) {
    activeAlerts.push({
      id: 'crops-spoiled',
      label: 'Greenhouse Crops Spoiled — Clear & Re-seed to restore food growth',
      tone: 'critical',
      targetTab: 'greenhouse',
    });
  } else if (frostWarning) {
    activeAlerts.push({
      id: 'frost-risk',
      label: 'Frost Risk (Power < 25%) — Boost power before night or crops will freeze',
      tone: 'warning',
      targetTab: 'power',
    });
  }
  if (deceasedCount > 0 || incapacitatedCount > 0) {
    activeAlerts.push({
      id: 'crew-health',
      label:
        deceasedCount > 0
          ? `${deceasedCount} astronaut(s) lost${incapacitatedCount > 0 ? ` · ${incapacitatedCount} too weak to work` : ''} — stabilize base now`
          : `${incapacitatedCount} astronaut(s) too weak to work (<25% health)`,
      tone: 'critical',
    });
  }

  const latestDeltas =
    phase === 'outcome' && lastDecision
      ? lastDecision.appliedDeltas
      : phase === 'sol-summary' && lastSolSummary
        ? lastSolSummary.dailyUpkeepDeltas
        : phase === 'playing' && greenhouse?.lastActionFeedback
          ? {
              lifeSupport: greenhouse.lastActionFeedback.deltas.lifeSupport,
              power: greenhouse.lastActionFeedback.deltas.power,
              radiationProtection:
                greenhouse.lastActionFeedback.deltas.radiationProtection,
            }
          : null;

  return (
    <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div>
        <PageBackButton
          previousRoute={previousRoute}
          onBack={onGoBack ?? (() => onNavigate('home'))}
        />
      </div>
      {/* Top Simulator Control Ribbon */}
      <section
        aria-label="Mission action controls"
        className="rounded-xl bg-[#111C32] border border-[#293A54] px-4 py-3.5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <h1 className="font-display text-lg sm:text-xl font-bold text-[#EAF2FF]">
            {missionConfig.outpostName} Simulator
          </h1>
          <span className="text-xs sm:text-sm font-mono-tabular text-[#29B6F6]">
            Sol {currentSol} of {missionConfig.maxSols}
          </span>
          <span className="text-xs text-[#A8B6CC]">
            {missionConfig.planet} · {missionConfig.crewCount} Astronauts ·{' '}
            {LANDING_SITES.find((s) => s.id === missionConfig.landingSite)?.name ??
              'Jezero Crater Floor'}
          </span>
          {missionConfig.spaceWeatherMode === 'live-nasa' && (
            <span className="text-xs font-mono-tabular text-[#FFB547]">
              ·{' '}
              {donkiContext.source === 'archived'
                ? 'Saved Solar Storm Mode'
                : 'NASA DONKI Mode'}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canPause && (
            <button
              type="button"
              onClick={onTogglePause}
              className={`inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                isPaused
                  ? 'bg-[#29B6F6] text-[#080D1B] border-[#29B6F6]'
                  : 'bg-[#080D1B] hover:border-[#29B6F6] text-[#EAF2FF] border-[#293A54]'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </>
              )}
            </button>
          )}

          {phase !== 'briefing' && (
            <>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg border border-[#293A54] bg-[#080D1B] hover:border-[#E4774E] text-[#A8B6CC] hover:text-[#EAF2FF] text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restart</span>
                </button>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmReset(false);
                      onReplayMission();
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#E4774E] text-[#080D1B] text-xs font-semibold cursor-pointer"
                  >
                    Restart Mission
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmReset(false);
                      onFullDemoReset();
                    }}
                    title="Clears current mission, Explorer Medals, Quiz score, and NASA cache"
                    className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#FFB547] bg-[#080D1B] hover:bg-[#1E3353] text-[#FFB547] text-xs font-semibold cursor-pointer"
                  >
                    Full Reset (Demo)
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#293A54] bg-[#080D1B] text-[#A8B6CC] text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Pause State Banner */}
      {isPaused && (
        <div
          role="status"
          className="rounded-xl bg-[#1E3353] border border-[#FFB547] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <p className="text-sm font-medium text-[#EAF2FF]">
            Simulation Paused — Decision buttons and communication timers are frozen while
            you inspect outpost systems.
          </p>
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex items-center justify-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#FFB547] text-[#080D1B] text-xs font-semibold shrink-0 cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Resume Simulation</span>
          </button>
        </div>
      )}

      {/* Report View replaces active turn stage when finished */}
      {phase === 'report' ? (
        <Suspense
          fallback={
            <div className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 text-center text-sm text-[#29B6F6]">
              Preparing Mission Report &amp; Charts...
            </div>
          }
        >
          <MissionReportView
            report={buildMissionReport(gameState, donkiContext)}
            explorerProgress={explorerProgress}
            onReplay={() => runGuardedAction(onReplayMission)}
            onNavigate={onNavigate}
          />
        </Suspense>
      ) : (
        <>
          {/* 3 Primary Resource Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <ResourceCard
              resourceKey="lifeSupport"
              resources={resources}
              delta={latestDeltas?.lifeSupport ?? null}
            />
            <ResourceCard
              resourceKey="power"
              resources={resources}
              delta={latestDeltas?.power ?? null}
            />
            <ResourceCard
              resourceKey="radiationProtection"
              resources={resources}
              delta={latestDeltas?.radiationProtection ?? null}
            />
          </div>

          {/* Compact Active Habitat Alerts Strip (Only shown when hazards exist) */}
          {phase !== 'briefing' && activeAlerts.length > 0 && (
            <section
              aria-label="Active habitat alerts"
              className="rounded-xl bg-[#080D1B] border border-[#E4774E]/80 px-4 py-3 flex flex-wrap items-center gap-2.5"
            >
              <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular font-bold text-[#E4774E] shrink-0">
                <AlertTriangle className="w-4 h-4" />
                <span>HABITAT ALERTS:</span>
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {activeAlerts.map((alert) =>
                  alert.targetTab ? (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => setActiveSubsystem(alert.targetTab!)}
                      className={`text-left text-xs px-2.5 py-1 rounded border transition-colors cursor-pointer ${
                        alert.tone === 'critical'
                          ? 'bg-[#111C32] border-[#E4774E]/70 text-[#EAF2FF] hover:border-[#29B6F6]'
                          : 'bg-[#111C32] border-[#FFB547]/70 text-[#FFB547] hover:border-[#29B6F6]'
                      }`}
                    >
                      {alert.label}
                    </button>
                  ) : (
                    <span
                      key={alert.id}
                      className="text-xs px-2.5 py-1 rounded bg-[#111C32] border border-[#E4774E]/70 text-[#EAF2FF]"
                    >
                      {alert.label}
                    </span>
                  )
                )}
              </div>
            </section>
          )}

          {/* Main Simulator Stage + Side Telemetry Column */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Main Mission Control Stage */}
            <div className="lg:col-span-7 space-y-6">
              {/* PHASE 1: INTRODUCTORY BRIEFING */}
              {phase === 'briefing' && (
                <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8">
                  <p className="text-xs font-medium text-[#29B6F6]">
                    Pre-Mission Briefing · Jezero Sector, Mars
                  </p>
                  <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-[#EAF2FF]">
                    Keep Outpost Zero Alive for 10 Sols.
                  </h2>
                  <p className="mt-2 text-sm text-[#A8B6CC] leading-relaxed">
                    Command four astronauts across 10 Martian Sols—balancing Life Support,
                    Power, and Radiation.
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <InfoHoverTip
                      label="No Free Choices Rule"
                      title="Every Action Has a Trade-Off"
                      body="Solving one crisis always spends Power, Life Support, Radiation Shielding, or Crew Energy. Watch your resource margins!"
                      accent="orange"
                    />
                    <InfoHoverTip
                      label="3–22 min Earth Link"
                      title="Crew Autonomy & Radio Delay"
                      body="Radio signals take 3–22 minutes one-way (6–44 min round-trip). Follow approved safety checklists when urgent action is needed."
                      accent="blue"
                    />
                  </div>

                  {/* Landing Site Picker (Mars Trek Jezero Sector) */}
                  <div className="mt-6 pt-5 border-t border-[#293A54] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#EAF2FF]">
                        <MapPin className="w-3.5 h-3.5 text-[#29B6F6]" />
                        <span>1. Pick Your Mars Landing Spot</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {LANDING_SITES.map((site) => {
                        const selected =
                          (missionConfig.landingSite ?? 'jezero-floor') === site.id;
                        return (
                          <button
                            key={site.id}
                            type="button"
                            onClick={() =>
                              onConfigureMission({ landingSite: site.id })
                            }
                            aria-pressed={selected}
                            className={`text-left rounded-lg border p-3.5 transition-colors cursor-pointer ${
                              selected
                                ? 'bg-[#1E3353] border-[#29B6F6]'
                                : 'bg-[#080D1B] border-[#293A54] hover:border-[#29B6F6]/60'
                            }`}
                          >
                            <p className="text-xs font-semibold text-[#EAF2FF]">
                              {site.name}
                            </p>
                            <p className="mt-0.5 font-mono-tabular text-[11px] text-[#29B6F6]">
                              {site.elevationLabel}
                            </p>
                            <p className="mt-1.5 text-[11px] text-[#FFB547] leading-relaxed">
                              {site.tradeOff}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Space Weather Mode & Mission Code */}
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-stretch">
                    <div className="sm:col-span-8 rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-[#EAF2FF]">
                          2. Solar Storm Challenge
                        </span>
                        <span className="font-mono-tabular text-[11px] text-[#29B6F6]">
                          {donkiContext.source === 'archived'
                            ? 'From Saved Data'
                            : donkiContext.sourceLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            onConfigureMission({ spaceWeatherMode: 'standard' })
                          }
                          aria-pressed={
                            (missionConfig.spaceWeatherMode ?? 'standard') ===
                            'standard'
                          }
                          className={`min-h-[38px] px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                            (missionConfig.spaceWeatherMode ?? 'standard') ===
                            'standard'
                              ? 'bg-[#1E3353] border-[#29B6F6] text-[#EAF2FF]'
                              : 'bg-[#111C32] border-[#293A54] text-[#A8B6CC]'
                          }`}
                        >
                          Standard 10-Sol
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onConfigureMission({
                              spaceWeatherMode: 'live-nasa',
                              liveSpaceWeatherLabel: donkiContext.headline,
                            })
                          }
                          aria-pressed={
                            missionConfig.spaceWeatherMode === 'live-nasa'
                          }
                          className={`min-h-[38px] px-3 py-1.5 rounded-md border text-xs font-semibold transition-colors cursor-pointer ${
                            missionConfig.spaceWeatherMode === 'live-nasa'
                              ? 'bg-[#1E3353] border-[#FFB547] text-[#FFB547]'
                              : 'bg-[#111C32] border-[#293A54] text-[#A8B6CC]'
                          }`}
                        >
                          {donkiContext.source === 'archived'
                            ? 'Saved Solar Storm (DONKI)'
                            : 'Live NASA DONKI Storm'}
                        </button>
                      </div>
                      <p className="text-[11px] text-[#A8B6CC] leading-relaxed">
                        {missionConfig.spaceWeatherMode === 'live-nasa'
                          ? `Injects a Solar Particle Event on Sol 2 (${donkiContext.source === 'archived' ? 'from saved solar flare record' : `live Class ${donkiContext.latestFlare?.classType ?? 'X'} flare`}).`
                          : 'Balanced seeded 10-Sol timeline recommended for first-time commanders.'}
                      </p>
                    </div>

                    <div className="sm:col-span-4 rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 flex flex-col justify-between gap-2">
                      <div>
                        <span className="text-xs font-semibold text-[#EAF2FF]">
                          Mission Code
                        </span>
                        <p className="mt-1 font-mono-tabular text-base font-bold text-[#29B6F6]">
                          OZ-{gameState.missionSeed}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onConfigureMission({
                            customSeed: Math.floor(Math.random() * 9000) + 1000,
                          })
                        }
                        className="inline-flex items-center justify-center gap-1.5 min-h-[34px] px-2.5 py-1 rounded-md border border-[#293A54] hover:border-[#29B6F6] bg-[#111C32] text-xs font-medium text-[#A8B6CC] hover:text-[#EAF2FF] cursor-pointer transition-colors"
                      >
                        <Shuffle className="w-3.5 h-3.5" />
                        <span>New Code</span>
                      </button>
                    </div>
                  </div>

                  <div className="mt-7">
                    <button
                      type="button"
                      onClick={() => runGuardedAction(onStartMission)}
                      className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm sm:text-base font-semibold transition-colors cursor-pointer"
                    >
                      <span>Start Sol 1 Mission</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

              {/* PHASE 2: ACTIVE EVENT & TRADE-OFF DECISIONS */}
              {phase === 'playing' && activeEvent && (
                <section
                  aria-label={`Sol ${currentSol} mission event`}
                  className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-7"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-mono-tabular font-semibold text-[#29B6F6]">
                      Sol {currentSol} Event
                      {activeEvent.code ? ` · ${activeEvent.code}` : ''} ·{' '}
                      {activeEvent.category}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${
                        activeEvent.severity === 'Emergency'
                          ? 'text-[#E4774E]'
                          : activeEvent.severity === 'Alert'
                            ? 'text-[#FFB547]'
                            : 'text-[#29B6F6]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {activeEvent.severity}
                    </span>
                  </div>

                  <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-[#EAF2FF]">
                    {activeEvent.title}
                  </h2>

                  <p className="mt-3 text-sm sm:text-base text-[#EAF2FF]/90 leading-relaxed">
                    {activeEvent.description}
                  </p>

                  {/* Minimal Hover/Expandable Science Context */}
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setScienceNoteOpen((prev) => !prev)}
                      aria-expanded={scienceNoteOpen}
                      className="inline-flex items-center gap-1.5 min-h-[32px] px-2.5 py-1 rounded-md bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] text-xs font-medium text-[#29B6F6] transition-colors cursor-pointer"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>
                        {scienceNoteOpen ? 'Hide Mars Science' : 'Mars Science'}
                      </span>
                    </button>

                    {(activeEvent.category === 'Radiation' ||
                      activeEvent.id === 'solar-conjunction-comms' ||
                      activeEvent.id === 'comm-equipment-failure') && (
                      <InfoHoverTip
                        label={
                          donkiContext.source === 'archived'
                            ? 'Saved Solar Data'
                            : `NASA DONKI${donkiContext.latestFlare ? `: Class ${donkiContext.latestFlare.classType}` : ''}`
                        }
                        title={donkiContext.headline}
                        badge={
                          donkiContext.source === 'archived'
                            ? 'From Saved Data'
                            : donkiContext.sourceLabel
                        }
                        body={donkiContext.scientificContext}
                        note="Scientific context only — does not alter deterministic simulator percentages."
                        accent="amber"
                      />
                    )}
                  </div>

                  {scienceNoteOpen && (
                    <div className="mt-2.5 rounded-lg bg-[#080D1B] border border-[#29B6F6]/40 p-3.5 space-y-2 text-xs">
                      <p className="text-[#EAF2FF]/90 leading-relaxed">
                        {activeEvent.scientificExplanation}
                      </p>
                      <p className="text-[#FFB547] leading-relaxed">
                        <strong>Key Takeaway:</strong> {activeEvent.educationalTakeaway}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 space-y-3.5">
                    <p className="text-xs font-medium text-[#A8B6CC]">
                      Choose your engineering response (every option has a trade-off):
                    </p>

                    {activeEvent.options.map((option, idx) => (
                      <button
                        key={option.id}
                        type="button"
                        disabled={isPaused}
                        onClick={() =>
                          runGuardedAction(() => {
                            setScienceNoteOpen(false);
                            onSelectDecision(option.id);
                          })
                        }
                        className="w-full text-left rounded-xl bg-[#080D1B] hover:bg-[#1E3353]/70 disabled:opacity-50 disabled:cursor-not-allowed border border-[#293A54] hover:border-[#E4774E] p-4 sm:p-5 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#29B6F6]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm sm:text-base font-semibold text-[#EAF2FF]">
                              <span className="font-mono-tabular text-[#E4774E] mr-2">
                                {idx + 1}.
                              </span>
                              {option.label}
                            </p>
                            <p className="mt-1.5 text-xs sm:text-sm text-[#A8B6CC]">
                              {option.actionSummary}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-[#A8B6CC] shrink-0 mt-1" />
                        </div>

                        <p className="mt-3 pt-2.5 border-t border-[#293A54] text-xs font-medium text-[#FFB547]">
                          Trade-off: {option.tradeOffHint}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* PHASE 3: POST-DECISION EXPLANATION */}
              {phase === 'outcome' && lastDecision && (
                <section
                  aria-label="Decision consequences"
                  className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-7"
                >
                  <div className="flex items-center gap-2 text-xs font-semibold text-[#29B6F6]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sol {lastDecision.sol} Action Completed</span>
                  </div>

                  <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-[#EAF2FF]">
                    {lastDecision.optionLabel}
                  </h2>

                  {/* Immediate Resource Deltas */}
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Life Support',
                        val: lastDecision.appliedDeltas.lifeSupport,
                      },
                      { label: 'Power', val: lastDecision.appliedDeltas.power },
                      {
                        label: 'Radiation',
                        val: lastDecision.appliedDeltas.radiationProtection,
                      },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3"
                      >
                        <p className="text-xs text-[#A8B6CC]">{d.label}</p>
                        <p
                          className={`mt-1 font-mono-tabular text-base sm:text-lg font-bold ${
                            d.val > 0
                              ? 'text-[#29B6F6]'
                              : d.val < 0
                                ? 'text-[#E4774E]'
                                : 'text-[#EAF2FF]'
                          }`}
                        >
                          {d.val > 0 ? `+${d.val}%` : `${d.val}%`}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Why Those Consequences Occurred */}
                  <div className="mt-5 rounded-lg bg-[#080D1B] border border-[#293A54] p-4 sm:p-5 space-y-2">
                    <h3 className="font-display text-sm font-semibold text-[#29B6F6]">
                      Why This Happened
                    </h3>
                    <p className="text-sm text-[#EAF2FF]/95 leading-relaxed">
                      {lastDecision.whyExplanation}
                    </p>
                    <p className="pt-2 border-t border-[#293A54] text-xs text-[#FFB547] leading-relaxed">
                      <strong>Engineering Lesson:</strong> {lastDecision.lessonTag}
                    </p>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      disabled={isPaused}
                      onClick={() => runGuardedAction(onProceedToSummary)}
                      className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] disabled:opacity-50 disabled:cursor-not-allowed text-[#080D1B] text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <span>
                        {gameState.failureReason
                          ? 'View Mission Report'
                          : 'View End-of-Sol Summary'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

              {/* PHASE 4: END-OF-SOL SUMMARY */}
              {phase === 'sol-summary' && lastSolSummary && (
                <section
                  aria-label={`End of Sol ${lastSolSummary.completedSol} summary`}
                  className="rounded-xl bg-[#111C32] border border-[#293A54] p-5 sm:p-7"
                >
                  <p className="text-xs font-mono-tabular font-semibold text-[#29B6F6]">
                    End of Sol {lastSolSummary.completedSol} Summary
                  </p>
                  <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-[#EAF2FF]">
                    Martian Night Cycle Complete
                  </h2>

                  <p className="mt-2.5 text-sm text-[#A8B6CC] leading-relaxed">
                    {lastSolSummary.summaryNote}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {[
                      {
                        label: 'Overnight Life Support',
                        val: lastSolSummary.dailyUpkeepDeltas.lifeSupport,
                      },
                      {
                        label: 'Overnight Power',
                        val: lastSolSummary.dailyUpkeepDeltas.power,
                      },
                      {
                        label: 'Overnight Shielding',
                        val: lastSolSummary.dailyUpkeepDeltas.radiationProtection,
                      },
                    ].map((d) => (
                      <div
                        key={d.label}
                        className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3"
                      >
                        <p className="text-xs text-[#A8B6CC]">{d.label}</p>
                        <p
                          className={`mt-1 font-mono-tabular text-base font-bold ${
                            d.val > 0
                              ? 'text-[#29B6F6]'
                              : d.val < 0
                                ? 'text-[#FFB547]'
                                : 'text-[#EAF2FF]'
                          }`}
                        >
                          {d.val > 0 ? `+${d.val}%` : `${d.val}%`}
                        </p>
                      </div>
                    ))}
                  </div>

                  {lastSolSummary.criticalWarning && (
                    <div className="mt-4 rounded-lg bg-[#080D1B] border border-[#E4774E] p-3.5 text-xs sm:text-sm font-medium text-[#E4774E]">
                      Warning: {lastSolSummary.criticalWarning}
                    </div>
                  )}

                  <div className="mt-6">
                    <button
                      type="button"
                      disabled={isPaused}
                      onClick={() => runGuardedAction(onAdvanceNextSol)}
                      className="inline-flex items-center justify-center gap-2 min-h-[46px] px-6 py-3 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] disabled:opacity-50 disabled:cursor-not-allowed text-[#080D1B] text-sm font-semibold transition-colors cursor-pointer"
                    >
                      <span>
                        {gameState.failureReason ||
                        currentSol >= missionConfig.maxSols
                          ? 'Open Final Mission Report'
                          : `Begin Sol ${currentSol + 1}`}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </section>
              )}

              {/* ORGANIZED OUTPOST SUBSYSTEMS DECK (Greenhouse, Power & Dust, Radiation Shelter) */}
              <div className="space-y-3">
                <div
                  role="tablist"
                  aria-label="Outpost Subsystems"
                  className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-xl bg-[#111C32] border border-[#293A54] p-2"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeSubsystem === 'greenhouse'}
                    onClick={() => setActiveSubsystem('greenhouse')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      activeSubsystem === 'greenhouse'
                        ? 'bg-[#1E3353] border border-[#29B6F6] text-[#EAF2FF]'
                        : 'bg-[#080D1B] border border-transparent text-[#A8B6CC] hover:text-[#EAF2FF]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Sprout className="w-4 h-4 text-[#29B6F6]" />
                      <span>Greenhouse</span>
                    </span>
                    <span
                      className={`font-mono-tabular ${
                        cropsSpoiled ? 'text-[#E4774E]' : 'text-[#29B6F6]'
                      }`}
                    >
                      {cropsSpoiled ? 'Spoiled' : `${greenhouse.cropGrowthProgress}%`}
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeSubsystem === 'power'}
                    onClick={() => setActiveSubsystem('power')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      activeSubsystem === 'power'
                        ? 'bg-[#1E3353] border border-[#29B6F6] text-[#EAF2FF]'
                        : 'bg-[#080D1B] border border-transparent text-[#A8B6CC] hover:text-[#EAF2FF]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Sun className="w-4 h-4 text-[#FFB547]" />
                      <span>Power &amp; Dust</span>
                    </span>
                    <span className="font-mono-tabular text-[#FFB547]">
                      {powerOps.dustAccumulation}% dust
                    </span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeSubsystem === 'shelter'}
                    onClick={() => setActiveSubsystem('shelter')}
                    className={`min-h-[44px] px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                      activeSubsystem === 'shelter'
                        ? 'bg-[#1E3353] border border-[#29B6F6] text-[#EAF2FF]'
                        : 'bg-[#080D1B] border border-transparent text-[#A8B6CC] hover:text-[#EAF2FF]'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#E4774E]" />
                      <span>Rad Shelter</span>
                    </span>
                    <span className="font-mono-tabular text-[#E4774E]">
                      {radiationLeakActive
                        ? 'Leak!'
                        : radiationShelter.crewSheltered
                          ? 'Sheltered'
                          : `${radiationShelter.shelterReadiness}%`}
                    </span>
                  </button>
                </div>

                {activeSubsystem === 'greenhouse' && (
                  <GreenhousePanel
                    gameState={gameState}
                    onGreenhouseAction={(actionId) =>
                      runGuardedAction(() => onGreenhouseAction(actionId))
                    }
                  />
                )}

                {activeSubsystem === 'power' && (
                  <PowerOperationsPanel
                    gameState={gameState}
                    onPowerAction={(actionId) =>
                      runGuardedAction(() => onPowerAction(actionId))
                    }
                  />
                )}

                {activeSubsystem === 'shelter' && (
                  <RadiationShelterPanel
                    gameState={gameState}
                    onShelterAction={(actionId) =>
                      runGuardedAction(() => onShelterAction(actionId))
                    }
                  />
                )}
              </div>

              {/* 4-Astronaut Crew Status Panel */}
              <section
                aria-label="Crew status"
                className="rounded-xl bg-[#111C32] border border-[#293A54] p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#29B6F6]" />
                    <h3 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF]">
                      Outpost Crew ({livingCrewCount} / {crew.members.length} Alive)
                    </h3>
                  </div>
                  <span className="text-xs font-mono-tabular text-[#A8B6CC]">
                    Readiness: {crew.overallReadiness}%
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {crew.members.map((member) => {
                    const memberHealth =
                      typeof member.health === 'number' ? member.health : 100;
                    const isDeceased = member.status === 'Deceased';
                    const isIncapacitated = member.status === 'Incapacitated';
                    const healthColor =
                      memberHealth >= 60
                        ? 'text-[#29B6F6]'
                        : memberHealth >= 25
                          ? 'text-[#FFB547]'
                          : 'text-[#E4774E]';
                    const barColor =
                      memberHealth >= 60
                        ? 'bg-[#29B6F6]'
                        : memberHealth >= 25
                          ? 'bg-[#FFB547]'
                          : 'bg-[#E4774E]';

                    return (
                      <div
                        key={member.id}
                        className={`rounded-lg bg-[#080D1B] border p-3 space-y-2 ${
                          isDeceased || isIncapacitated
                            ? 'border-[#E4774E]/80'
                            : 'border-[#293A54]'
                        } ${isDeceased ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#EAF2FF] truncate">
                              {member.name}
                            </p>
                            <p className="text-xs text-[#A8B6CC] truncate">
                              {member.role}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p
                              className={`font-mono-tabular text-xs font-semibold ${
                                isDeceased || isIncapacitated
                                  ? 'text-[#E4774E]'
                                  : 'text-[#29B6F6]'
                              }`}
                            >
                              {member.status}
                            </p>
                            <p className="font-mono-tabular text-[11px] text-[#A8B6CC]">
                              Energy {member.energy}%
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono-tabular">
                            <span className="text-[#A8B6CC]">Health</span>
                            <span className={`font-semibold ${healthColor}`}>
                              {memberHealth}%
                            </span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-[#111C32] overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${barColor}`}
                              style={{ width: `${memberHealth}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs text-[#A8B6CC]">{crew.crewNote}</p>
              </section>
            </div>

            {/* Right Column: Earth Communication Delay + Mars Environment + Habitat Schematic */}
            <aside className="lg:col-span-5 space-y-6">
              <CommunicationDelayPanel
                currentSol={currentSol}
                activeEvent={activeEvent}
                advice={activeEvent?.earthAdvice ?? null}
                commSystem={commSystem}
                resources={resources}
                crew={crew}
                canRequest={phase === 'playing' && !!activeEvent}
                isPaused={isPaused}
                alreadyReceived={commAdviceUsedForCurrentEvent}
                onAdviceReceived={onMarkCommUsed}
                onSendDetailedReport={(report) =>
                  runGuardedAction(() => onSendDetailedReport(report))
                }
                onTransmissionStateChange={setIsTransmitting}
              />

              <MarsEnvironmentPanel environment={environment} />

              <OutpostSchematic
                resources={resources}
                isTransmitting={isTransmitting}
                isPaused={isPaused}
                radiationLeakActive={radiationLeakActive}
                cropsSpoiled={cropsSpoiled}
                frostWarning={resources.power < 25}
                panelDustLevel={powerOps.dustAccumulation}
                stormSeverity={powerOps.stormSeverity}
                crewSheltered={radiationShelter.crewSheltered}
                compact
                onNavigate={onNavigate}
              />
            </aside>
          </div>
        </>
      )}

      {/* Compact Simulation Disclaimer */}
      <footer className="text-center py-1">
        <p className="text-[11px] text-[#A8B6CC]/80">
          Simplified mission planning values · Hover info badges for NASA science context.
        </p>
      </footer>
    </main>
  );
}
