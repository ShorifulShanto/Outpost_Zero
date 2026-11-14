import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { HomePage } from './components/HomePage';
import { MedalsGuideModal } from './components/MedalsGuideModal';
import { Navbar } from './components/Navbar';
import {
  advanceToNextSol,
  applyDecision,
  applyGreenhouseAction,
  applyPowerAction,
  applyShelterAction,
  buildMissionReport,
  configureBriefingMission,
  createInitialGameState,
  markCommunicationUsed,
  proceedToSolSummary,
  sendDetailedEarthReport,
  startMission,
  togglePause,
} from './engine/gameEngine';
import { clearNasaCache } from './services/nasaCache';
import {
  AppRoute,
  DetailedEarthReport,
  GameState,
  GreenhouseActionId,
  LandingSiteId,
  PowerActionId,
  ShelterActionId,
  SpaceWeatherMode,
} from './types/mission';
import {
  EXPLORER_BADGES,
  loadExplorerProgress,
  recordCropHarvested,
  recordMissionFinished,
  recordPowerOpsAction,
  recordShelterAction,
  recordSolCompleted,
  recordTacticalDecision,
  resetExplorerProgress,
  subscribeExplorerProgress,
} from './utils/explorerProgress';
import { clearGameState, loadGameState, saveGameState } from './utils/storage';

const AboutPage = lazy(() =>
  import('./components/AboutPage').then((m) => ({ default: m.AboutPage }))
);
const AchievementCelebration = lazy(() =>
  import('./components/AchievementCelebration').then((m) => ({
    default: m.AchievementCelebration,
  }))
);
const LearnPage = lazy(() =>
  import('./components/LearnPage').then((m) => ({ default: m.LearnPage }))
);
const MissionSimulator = lazy(() =>
  import('./components/MissionSimulator').then((m) => ({
    default: m.MissionSimulator,
  }))
);
const ObservatoryPage = lazy(() =>
  import('./components/ObservatoryPage').then((m) => ({
    default: m.ObservatoryPage,
  }))
);

const ROUTE_TITLES: Record<AppRoute, string> = {
  home: 'Outpost Zero — Blast Off to Something New',
  simulator: 'Outpost Zero — 10-Sol Mars Mission Simulator',
  learn: 'Outpost Zero — Mars Science & Quiz Hub',
  observatory: 'Outpost Zero — NASA & Space Observatory',
  about: 'Outpost Zero — About the Project',
};

function RouteLoadingFallback() {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 text-center text-sm text-[#29B6F6]">
        Loading Outpost Zero module...
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>('home');
  const [routeHistory, setRouteHistory] = useState<AppRoute[]>([]);
  const [medalsModalOpen, setMedalsModalOpen] = useState(false);
  const [explorerProgress, setExplorerProgress] = useState(() =>
    loadExplorerProgress()
  );
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = loadGameState();
    return saved ?? createInitialGameState();
  });

  // Persist mission state safely to localStorage
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  useEffect(() => {
    return subscribeExplorerProgress(setExplorerProgress);
  }, []);

  useEffect(() => {
    document.title = ROUTE_TITLES[route];
  }, [route]);

  const handleNavigate = useCallback(
    (nextRoute: AppRoute) => {
      if (nextRoute === route) return;
      setRouteHistory((prev) => [...prev.slice(-19), route]);
      setRoute(nextRoute);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [route]
  );

  const handleGoBack = useCallback(() => {
    setRouteHistory((prev) => {
      if (prev.length === 0) {
        setRoute('home');
        return prev;
      }
      const previous = prev[prev.length - 1];
      setRoute(previous);
      return prev.slice(0, -1);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const previousRoute =
    routeHistory.length > 0 ? routeHistory[routeHistory.length - 1] : null;

  const handleStartMission = useCallback(() => {
    setGameState((prev) => startMission(prev));
  }, []);

  const handleSelectDecision = useCallback((optionId: string) => {
    setGameState((prev) => {
      const chosen = prev.activeEvent?.options.find((o) => o.id === optionId);
      if (
        chosen?.approach === 'approved-checklist' ||
        chosen?.approach === 'detailed-report'
      ) {
        recordTacticalDecision();
      }
      const next = applyDecision(prev, optionId);
      if (next.phase === 'report') {
        const rep = buildMissionReport(next);
        recordMissionFinished(rep.outcome, rep.scoreBreakdown.totalScore);
      }
      return next;
    });
  }, []);

  const handleGreenhouseAction = useCallback((actionId: GreenhouseActionId) => {
    setGameState((prev) => {
      const next = applyGreenhouseAction(prev, actionId);
      if (actionId === 'harvest-crops' && prev.greenhouse.harvestReadiness) {
        recordCropHarvested();
      }
      if (next.phase === 'report') {
        const rep = buildMissionReport(next);
        recordMissionFinished(rep.outcome, rep.scoreBreakdown.totalScore);
      }
      return next;
    });
  }, []);

  const handlePowerAction = useCallback((actionId: PowerActionId) => {
    setGameState((prev) => {
      const next = applyPowerAction(prev, actionId);
      recordPowerOpsAction();
      if (next.phase === 'report') {
        const rep = buildMissionReport(next);
        recordMissionFinished(rep.outcome, rep.scoreBreakdown.totalScore);
      }
      return next;
    });
  }, []);

  const handleShelterAction = useCallback((actionId: ShelterActionId) => {
    setGameState((prev) => {
      const next = applyShelterAction(prev, actionId);
      if (actionId === 'enter-shelter' || actionId === 'reinforce-shelter') {
        recordShelterAction();
      }
      if (next.phase === 'report') {
        const rep = buildMissionReport(next);
        recordMissionFinished(rep.outcome, rep.scoreBreakdown.totalScore);
      }
      return next;
    });
  }, []);

  const handleSendDetailedReport = useCallback(
    (report: Omit<DetailedEarthReport, 'sol'>) => {
      setGameState((prev) => {
        recordTacticalDecision();
        return sendDetailedEarthReport(prev, report);
      });
    },
    []
  );

  const handleProceedToSummary = useCallback(() => {
    setGameState((prev) => {
      recordSolCompleted(prev.currentSol);
      const next = proceedToSolSummary(prev);
      if (next.phase === 'report') {
        const rep = buildMissionReport(next);
        recordMissionFinished(rep.outcome, rep.scoreBreakdown.totalScore);
      }
      return next;
    });
  }, []);

  const handleAdvanceNextSol = useCallback(() => {
    setGameState((prev) => {
      recordSolCompleted(prev.currentSol);
      const next = advanceToNextSol(prev);
      if (next.phase === 'report') {
        const rep = buildMissionReport(next);
        recordMissionFinished(rep.outcome, rep.scoreBreakdown.totalScore);
      }
      return next;
    });
  }, []);

  const handleTogglePause = useCallback(() => {
    setGameState((prev) => togglePause(prev));
  }, []);

  const handleMarkCommUsed = useCallback(() => {
    setGameState((prev) => markCommunicationUsed(prev));
  }, []);

  const handleReplayMission = useCallback(() => {
    clearGameState();
    setGameState(createInitialGameState());
  }, []);

  const handleFullDemoReset = useCallback(() => {
    clearGameState();
    clearNasaCache();
    resetExplorerProgress();
    setGameState(createInitialGameState());
  }, []);

  const handleConfigureMission = useCallback(
    (config: {
      landingSite?: LandingSiteId;
      spaceWeatherMode?: SpaceWeatherMode;
      liveSpaceWeatherLabel?: string;
      customSeed?: number;
    }) => {
      setGameState((prev) => configureBriefingMission(prev, config));
    },
    []
  );

  const hasActiveMission =
    gameState.phase !== 'briefing' && gameState.phase !== 'report';

  return (
    <div className="min-h-screen starfield-canvas text-[#EAF2FF] flex flex-col">
      <Navbar
        activeRoute={route}
        onNavigate={handleNavigate}
        hasActiveMission={hasActiveMission}
        unlockedMedalsCount={explorerProgress.unlockedBadges.length}
        totalMedalsCount={EXPLORER_BADGES.length}
        onOpenMedalsGuide={() => setMedalsModalOpen(true)}
      />

      <div className="flex-1">
        {route === 'home' && (
          <HomePage
            onNavigate={handleNavigate}
            hasActiveMission={hasActiveMission}
            previousRoute={previousRoute}
            onGoBack={handleGoBack}
            onOpenMedalsGuide={() => setMedalsModalOpen(true)}
          />
        )}

        <Suspense fallback={<RouteLoadingFallback />}>
          {route === 'simulator' && (
            <MissionSimulator
              gameState={gameState}
              explorerProgress={explorerProgress}
              onStartMission={handleStartMission}
              onConfigureMission={handleConfigureMission}
              onSelectDecision={handleSelectDecision}
              onGreenhouseAction={handleGreenhouseAction}
              onPowerAction={handlePowerAction}
              onShelterAction={handleShelterAction}
              onSendDetailedReport={handleSendDetailedReport}
              onProceedToSummary={handleProceedToSummary}
              onAdvanceNextSol={handleAdvanceNextSol}
              onTogglePause={handleTogglePause}
              onReplayMission={handleReplayMission}
              onFullDemoReset={handleFullDemoReset}
              onMarkCommUsed={handleMarkCommUsed}
              onNavigate={handleNavigate}
              previousRoute={previousRoute}
              onGoBack={handleGoBack}
            />
          )}

          {route === 'learn' && (
            <LearnPage
              onNavigate={handleNavigate}
              previousRoute={previousRoute}
              onGoBack={handleGoBack}
            />
          )}

          {route === 'observatory' && (
            <ObservatoryPage
              onNavigate={handleNavigate}
              previousRoute={previousRoute}
              onGoBack={handleGoBack}
            />
          )}

          {route === 'about' && (
            <AboutPage
              onNavigate={handleNavigate}
              previousRoute={previousRoute}
              onGoBack={handleGoBack}
            />
          )}
        </Suspense>
      </div>

      <Suspense fallback={null}>
        {medalsModalOpen && (
          <MedalsGuideModal
            isOpen={medalsModalOpen}
            progress={explorerProgress}
            onClose={() => setMedalsModalOpen(false)}
            onNavigate={handleNavigate}
          />
        )}

        <AchievementCelebration
          onOpenMedalsGuide={() => setMedalsModalOpen(true)}
        />
      </Suspense>
    </div>
  );
}
