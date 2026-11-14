import {
  createInitialCommSystemState,
  createInitialEnvironmentState,
  createInitialGreenhouseState,
  createInitialPowerOpsState,
  createInitialRadiationShelterState,
  getCropGrowthStage,
} from '../engine/gameEngine';
import { GameState, MissionPhase } from '../types/mission';

const STORAGE_KEY = 'outpost_zero_mission_state_v1';

const VALID_PHASES: MissionPhase[] = [
  'briefing',
  'playing',
  'outcome',
  'sol-summary',
  'report',
];

function isValidPercent(val: unknown): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0 && val <= 100;
}

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota or private mode errors safely
  }
}

export function parseAndValidateGameState(raw: string | null): GameState | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    if (
      !VALID_PHASES.includes(parsed.phase) ||
      !parsed.missionConfig ||
      typeof parsed.missionConfig.maxSols !== 'number' ||
      typeof parsed.currentSol !== 'number' ||
      !Number.isInteger(parsed.currentSol) ||
      parsed.currentSol < 1 ||
      parsed.currentSol > parsed.missionConfig.maxSols
    ) {
      return null;
    }

    const r = parsed.resources;
    if (
      !r ||
      !isValidPercent(r.lifeSupport) ||
      !isValidPercent(r.power) ||
      !isValidPercent(r.radiationProtection) ||
      !isValidPercent(r.oxygenAvailability) ||
      !isValidPercent(r.foodReserves)
    ) {
      return null;
    }

    if (
      !parsed.crew ||
      !Array.isArray(parsed.crew.members) ||
      parsed.crew.members.length !== 4
    ) {
      return null;
    }

    if (
      !Array.isArray(parsed.history) ||
      !Array.isArray(parsed.decisionHistory) ||
      !Array.isArray(parsed.usedEventIds)
    ) {
      return null;
    }

    if (parsed.phase === 'playing' && (!parsed.activeEvent || !parsed.activeEvent.id)) {
      return null;
    }

    if (typeof parsed.missionSeed !== 'number' || !Number.isFinite(parsed.missionSeed)) {
      parsed.missionSeed = 1042;
    }

    parsed.crew.members = parsed.crew.members.map((m) => ({
      ...m,
      health: typeof m.health === 'number' && Number.isFinite(m.health) ? m.health : 100,
    }));

    if (
      !parsed.greenhouse ||
      !isValidPercent(parsed.greenhouse.health) ||
      !isValidPercent(parsed.greenhouse.waterAvailability) ||
      !isValidPercent(parsed.greenhouse.cropGrowthProgress) ||
      !Array.isArray(parsed.greenhouse.actionsUsedThisSol)
    ) {
      parsed.greenhouse = createInitialGreenhouseState();
    } else {
      parsed.greenhouse.lowPowerStreak =
        typeof parsed.greenhouse.lowPowerStreak === 'number'
          ? parsed.greenhouse.lowPowerStreak
          : 0;
      parsed.greenhouse.cropsSpoiled = Boolean(parsed.greenhouse.cropsSpoiled);
      parsed.greenhouse.cropGrowthStage = getCropGrowthStage(
        parsed.greenhouse.cropGrowthProgress,
        parsed.greenhouse.cropsSpoiled
      );
      parsed.greenhouse.harvestReadiness =
        !parsed.greenhouse.cropsSpoiled &&
        parsed.greenhouse.cropGrowthProgress >= 100;
    }

    if (!parsed.environment || !parsed.environment.weatherCondition) {
      parsed.environment = createInitialEnvironmentState();
    }

    if (
      !parsed.powerOps ||
      !isValidPercent(parsed.powerOps.dustAccumulation) ||
      !Array.isArray(parsed.powerOps.actionsUsedThisSol)
    ) {
      parsed.powerOps = createInitialPowerOpsState();
    }

    if (
      !parsed.radiationShelter ||
      !isValidPercent(parsed.radiationShelter.shelterReadiness) ||
      !Array.isArray(parsed.radiationShelter.actionsUsedThisSol)
    ) {
      parsed.radiationShelter = createInitialRadiationShelterState();
    } else {
      parsed.radiationShelter.radiationLeakActive = Boolean(
        parsed.radiationShelter.radiationLeakActive
      );
      parsed.radiationShelter.cumulativeDoseMSv =
        typeof parsed.radiationShelter.cumulativeDoseMSv === 'number' &&
        Number.isFinite(parsed.radiationShelter.cumulativeDoseMSv)
          ? parsed.radiationShelter.cumulativeDoseMSv
          : 0.67;
    }

    if (
      !parsed.commSystem ||
      typeof parsed.commSystem.oneWayDelayMinutes !== 'number' ||
      !Array.isArray(parsed.commSystem.reportsSent)
    ) {
      parsed.commSystem = createInitialCommSystemState();
    }

    return parsed;
  } catch {
    return null;
  }
}

export function loadGameState(): GameState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return parseAndValidateGameState(raw);
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors safely
  }
}
