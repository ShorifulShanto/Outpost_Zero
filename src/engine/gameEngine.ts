import {
  CommunicationSystemState,
  CrewMember,
  CropGrowthStage,
  DecisionRecord,
  DetailedEarthReport,
  EnvironmentState,
  GameState,
  GreenhouseActionId,
  GreenhouseState,
  LandingSiteId,
  MissionEvent,
  MissionReport,
  PowerActionId,
  PowerOperationsState,
  RadiationShelterState,
  ResourceState,
  ResourceStatus,
  ShelterActionId,
  SpaceWeatherMode,
} from '../types/mission';
import { DonkiRadiationContext } from '../services/nasaDonkiService';
import { evaluateMissionAdvisor } from './missionAdvisor';
import {
  INITIAL_CREW,
  LANDING_SITES,
  MISSION_CONFIG,
  MISSION_EVENTS,
} from './missionData';

export function getCropGrowthStage(
  progress: number,
  cropsSpoiled = false
): CropGrowthStage {
  if (cropsSpoiled) return 'Spoiled';
  if (progress >= 100) return 'Harvest Ready';
  if (progress >= 65) return 'Flowering';
  if (progress >= 30) return 'Vegetative';
  return 'Seedling';
}

export function createInitialGreenhouseState(): GreenhouseState {
  return {
    health: 84,
    waterAvailability: 78,
    cropGrowthProgress: 45,
    cropGrowthStage: 'Vegetative',
    powerConsumption: 'Standard',
    irrigationStatus: 'Flowing',
    harvestReadiness: false,
    lowPowerStreak: 0,
    cropsSpoiled: false,
    actionsUsedThisSol: [],
    lastActionFeedback: null,
  };
}

export function createInitialEnvironmentState(): EnvironmentState {
  return {
    weatherCondition: 'Clear Martian Sky',
    localTempCelsius: -53,
    dustOpacityNote: 'Low atmospheric dust; solar panels receiving clear Martian daylight.',
  };
}

export function createInitialPowerOpsState(): PowerOperationsState {
  return {
    dustAccumulation: 12,
    stormSeverity: 'Clear',
    powerSavingMode: false,
    actionsUsedThisSol: [],
    lastActionFeedback: null,
  };
}

export function createInitialRadiationShelterState(): RadiationShelterState {
  return {
    shelterReadiness: 80,
    crewSheltered: false,
    shieldingMaterials: [
      'Water Wall Jacket',
      'Polyethylene Lining',
      'Packed Martian Regolith',
    ],
    radiationAlert: 'Background GCR',
    radiationLeakActive: false,
    cumulativeDoseMSv: 0.67,
    actionsUsedThisSol: [],
    lastActionFeedback: null,
  };
}

export function createInitialCommSystemState(): CommunicationSystemState {
  return {
    oneWayDelayMinutes: 8,
    conjunctionActive: false,
    reportsSent: [],
    adviceReceivedCount: 0,
  };
}

export function clampResource(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getResourceStatus(value: number): ResourceStatus {
  if (value >= 60) return 'Nominal';
  if (value >= 30) return 'Caution';
  return 'Critical';
}

export function getStatusVisuals(status: ResourceStatus): {
  symbol: string;
  label: string;
  textColor: string;
  barColor: string;
} {
  switch (status) {
    case 'Nominal':
      return {
        symbol: '●',
        label: 'Nominal',
        textColor: 'text-[#29B6F6]',
        barColor: 'bg-[#29B6F6]',
      };
    case 'Caution':
      return {
        symbol: '▲',
        label: 'Caution',
        textColor: 'text-[#FFB547]',
        barColor: 'bg-[#FFB547]',
      };
    case 'Critical':
      return {
        symbol: '✖',
        label: 'Critical',
        textColor: 'text-[#E4774E]',
        barColor: 'bg-[#E4774E]',
      };
  }
}

function getLandingSiteProfile(id?: LandingSiteId) {
  return LANDING_SITES.find((s) => s.id === id) ?? LANDING_SITES[0];
}

function selectEventForSol(
  sol: number,
  usedEventIds: string[],
  seed: number,
  spaceWeatherMode?: SpaceWeatherMode
): MissionEvent {
  if (
    spaceWeatherMode === 'live-nasa' &&
    sol === 2 &&
    !usedEventIds.includes('solar-storm-warning')
  ) {
    const speEvent = MISSION_EVENTS.find((ev) => ev.id === 'solar-storm-warning');
    if (speEvent) {
      return speEvent;
    }
  }

  const unused = MISSION_EVENTS.filter((ev) => !usedEventIds.includes(ev.id));
  const windowMatches = unused.filter(
    (ev) => sol >= ev.solWindow[0] && sol <= ev.solWindow[1]
  );

  const pool =
    windowMatches.length > 0
      ? windowMatches
      : unused.length > 0
        ? unused
        : MISSION_EVENTS;

  const index = Math.abs(seed + sol * 7) % pool.length;
  return pool[index];
}

function applyEventEnvironmentEffects(
  state: GameState,
  event: MissionEvent,
  sol: number
): Pick<GameState, 'environment' | 'powerOps' | 'radiationShelter' | 'commSystem'> {
  const condition = event.environmentCondition ?? 'Clear Martian Sky';
  const isStorm = condition === 'Regional Dust Storm';
  const isHaze = condition === 'Dust Haze';
  const isSpe = condition === 'Solar Particle Advisory';
  const isConjunction = Boolean(event.conjunctionRestricted);
  const site = getLandingSiteProfile(state.missionConfig.landingSite);

  // One-way delay varies realistically across the 3-22 min range as planets orbit
  const baseDelay = 6 + ((sol * 2 + (state.missionSeed % 5)) % 16);
  const oneWayDelayMinutes = Math.min(
    22,
    Math.max(3, baseDelay + site.startingDeltas.commDelayOffsetMin)
  );

  return {
    environment: {
      weatherCondition: condition,
      localTempCelsius: isStorm ? -61 : isHaze ? -56 : -53,
      dustOpacityNote: isStorm
        ? 'Regional storm clouds scatter sunlight partially (not to zero) and deposit extra dust.'
        : isHaze
          ? 'Light suspended Martian dust slightly dims midday sunlight.'
          : isConjunction
            ? 'Sun sits near Earth–Mars line of sight, degrading radio signals.'
            : isSpe
              ? 'Elevated solar particle flux detected; background GCR continues steadily.'
              : 'Clear thin CO2 sky (~95% CO2, <1% Earth pressure).',
    },
    powerOps: {
      ...state.powerOps,
      stormSeverity: isStorm ? 'Regional Storm' : isHaze ? 'Light Dust' : 'Clear',
      actionsUsedThisSol: [],
      lastActionFeedback: null,
    },
    radiationShelter: {
      ...state.radiationShelter,
      radiationAlert: isSpe ? 'SPE Warning' : isHaze ? 'SPE Advisory' : 'Background GCR',
      actionsUsedThisSol: [],
      lastActionFeedback: null,
    },
    commSystem: {
      ...state.commSystem,
      oneWayDelayMinutes,
      conjunctionActive: isConjunction,
    },
  };
}

export interface MissionInitOptions {
  landingSite?: LandingSiteId;
  spaceWeatherMode?: SpaceWeatherMode;
  liveSpaceWeatherLabel?: string;
}

export function createInitialGameState(
  customSeed?: number,
  options?: MissionInitOptions
): GameState {
  const missionSeed =
    typeof customSeed === 'number' && Number.isFinite(customSeed) && customSeed > 0
      ? Math.abs(Math.floor(customSeed))
      : Math.floor(Math.random() * 10000) + 1;

  const site = getLandingSiteProfile(options?.landingSite);
  const spaceWeatherMode: SpaceWeatherMode = options?.spaceWeatherMode ?? 'standard';

  const startLife = clampResource(78 + site.startingDeltas.lifeSupport);
  const startPower = clampResource(76 + site.startingDeltas.power);
  const startRad = clampResource(80 + site.startingDeltas.radiationProtection);

  const initialResources: ResourceState = {
    lifeSupport: startLife,
    power: startPower,
    radiationProtection: startRad,
    oxygenAvailability: clampResource(82 + site.startingDeltas.lifeSupport),
    foodReserves: 74,
    greenhouseStatus: 'Thriving',
    solarGeneration: clampResource(78 + site.startingDeltas.power),
    batteryReserve: clampResource(74 + site.startingDeltas.power),
    energyConsumption: 'Balanced',
    shieldingCondition: clampResource(82 + site.startingDeltas.radiationProtection),
    crewExposureRisk: 'Low',
    solarWeatherAlert: 'Clear',
    shelterAvailable: true,
  };

  const baseGreenhouse = createInitialGreenhouseState();
  const basePowerOps = createInitialPowerOpsState();
  const baseComm = createInitialCommSystemState();

  return {
    missionConfig: {
      ...MISSION_CONFIG,
      landingSite: site.id,
      spaceWeatherMode,
      liveSpaceWeatherLabel: options?.liveSpaceWeatherLabel,
    },
    missionSeed,
    phase: 'briefing',
    currentSol: 1,
    isPaused: false,
    isProcessingAction: false,
    resources: initialResources,
    greenhouse: {
      ...baseGreenhouse,
      waterAvailability: clampResource(
        baseGreenhouse.waterAvailability + site.startingDeltas.greenhouseWater
      ),
    },
    environment: createInitialEnvironmentState(),
    powerOps: {
      ...basePowerOps,
      dustAccumulation: clampResource(
        basePowerOps.dustAccumulation + site.startingDeltas.dustAccumulation
      ),
    },
    radiationShelter: createInitialRadiationShelterState(),
    commSystem: {
      ...baseComm,
      oneWayDelayMinutes: Math.min(
        22,
        Math.max(3, baseComm.oneWayDelayMinutes + site.startingDeltas.commDelayOffsetMin)
      ),
    },
    crew: {
      members: INITIAL_CREW.map((m) => ({ ...m })),
      overallReadiness: 91,
      crewNote: `All 4 astronauts are healthy and ready for Sol 1 operations at ${site.name}.`,
    },
    activeEvent: null,
    lastDecision: null,
    lastSolSummary: null,
    history: [
      {
        sol: 0,
        label: 'Landing',
        lifeSupport: initialResources.lifeSupport,
        power: initialResources.power,
        radiationProtection: initialResources.radiationProtection,
      },
    ],
    decisionHistory: [],
    usedEventIds: [],
    commAdviceUsedForCurrentEvent: false,
    failureReason: null,
  };
}

export function configureBriefingMission(
  state: GameState,
  config: MissionInitOptions & { customSeed?: number }
): GameState {
  if (state.phase !== 'briefing') return state;
  return createInitialGameState(config.customSeed ?? state.missionSeed, {
    landingSite: config.landingSite ?? state.missionConfig.landingSite,
    spaceWeatherMode:
      config.spaceWeatherMode ?? state.missionConfig.spaceWeatherMode,
    liveSpaceWeatherLabel:
      config.liveSpaceWeatherLabel ?? state.missionConfig.liveSpaceWeatherLabel,
  });
}

export function startMission(state: GameState): GameState {
  if (state.phase !== 'briefing') return state;
  const firstEvent = selectEventForSol(
    1,
    [],
    state.missionSeed,
    state.missionConfig.spaceWeatherMode
  );
  const envEffects = applyEventEnvironmentEffects(state, firstEvent, 1);

  return {
    ...state,
    ...envEffects,
    phase: 'playing',
    currentSol: 1,
    isPaused: false,
    isProcessingAction: false,
    activeEvent: firstEvent,
    usedEventIds: [firstEvent.id],
    commAdviceUsedForCurrentEvent: false,
  };
}

export function togglePause(state: GameState): GameState {
  if (state.phase === 'briefing' || state.phase === 'report') {
    return state;
  }
  return {
    ...state,
    isPaused: !state.isPaused,
  };
}

export function markCommunicationUsed(state: GameState): GameState {
  if (state.commAdviceUsedForCurrentEvent) return state;
  return {
    ...state,
    commAdviceUsedForCurrentEvent: true,
    commSystem: {
      ...state.commSystem,
      adviceReceivedCount: (state.commSystem?.adviceReceivedCount ?? 0) + 1,
    },
  };
}

export function sendDetailedEarthReport(
  state: GameState,
  report: Omit<DetailedEarthReport, 'sol'>
): GameState {
  if (state.phase !== 'playing' || state.isPaused) return state;
  const existingForSol = state.commSystem.reportsSent.some(
    (r) => r.sol === state.currentSol
  );
  if (existingForSol) return state;

  const entry: DetailedEarthReport = {
    sol: state.currentSol,
    ...report,
  };

  return {
    ...state,
    commSystem: {
      ...state.commSystem,
      reportsSent: [...state.commSystem.reportsSent, entry],
    },
  };
}

function updateCrewMembers(
  members: CrewMember[],
  options: {
    healthDelta?: number;
    energyDelta?: number;
    preferredStatus?: CrewMember['status'];
  }
): CrewMember[] {
  const healthDelta = options.healthDelta ?? 0;
  const energyDelta = options.energyDelta ?? 0;

  return members.map((member) => {
    const baseHealth = typeof member.health === 'number' ? member.health : 100;
    if (member.status === 'Deceased' || baseHealth <= 0) {
      return {
        ...member,
        health: 0,
        energy: 0,
        status: 'Deceased' as const,
      };
    }

    const nextHealth = clampResource(baseHealth + healthDelta);
    if (nextHealth <= 0) {
      return {
        ...member,
        health: 0,
        energy: 0,
        status: 'Deceased' as const,
      };
    }

    const nextEnergy = clampResource(member.energy + energyDelta);
    const nextStatus: CrewMember['status'] =
      nextHealth < 25
        ? 'Incapacitated'
        : options.preferredStatus ??
          (member.status === 'Incapacitated' ? 'Active' : member.status);

    return {
      ...member,
      health: nextHealth,
      energy: nextEnergy,
      status: nextStatus,
    };
  });
}

function computeCrewReadiness(members: CrewMember[]): number {
  const living = members.filter((m) => m.status !== 'Deceased');
  if (living.length === 0) return 0;
  const avgEnergy =
    living.reduce((sum, m) => sum + m.energy, 0) / living.length;
  const incapacitatedCount = living.filter(
    (m) => m.status === 'Incapacitated'
  ).length;
  const capacityFactor = living.length / members.length;
  return clampResource(avgEnergy * capacityFactor - incapacitatedCount * 6);
}

function buildCrewNote(members: CrewMember[], avgEnergy: number): string {
  const deceased = members.filter((m) => m.status === 'Deceased').length;
  const incapacitated = members.filter((m) => m.status === 'Incapacitated').length;
  if (deceased > 0) {
    return `${deceased} astronaut(s) lost to Martian hazards. Remaining crew (${members.length - deceased}/${members.length}) are carrying heavier emergency shifts.`;
  }
  if (incapacitated > 0) {
    return `${incapacitated} astronaut(s) incapacitated from low health. Stabilize Life Support, Radiation, and Power immediately.`;
  }
  if (avgEnergy < 50) {
    return 'The crew is getting tired from heavy engineering shifts and needs rest.';
  }
  return 'Crew completed the repair and is watching station sensors.';
}

function checkFailureReason(
  resources: ResourceState,
  members?: CrewMember[]
): string | null {
  if (members) {
    const deceasedCount = members.filter((m) => m.status === 'Deceased').length;
    const operableCount = members.filter(
      (m) => m.status !== 'Deceased' && m.status !== 'Incapacitated'
    ).length;
    if (deceasedCount >= 2) {
      return `Critical crew casualty: ${deceasedCount} astronauts were lost due to severe Mars hazards, forcing an immediate mission abort.`;
    }
    if (operableCount === 0) {
      return 'All crew members are incapacitated or lost, leaving Outpost Zero unable to operate.';
    }
  }
  if (resources.lifeSupport <= 0) {
    return 'Life Support oxygen and food reserves dropped to 0%, requiring an emergency evacuation return.';
  }
  if (resources.power <= 0) {
    return 'Habitat Power reserves reached 0%, shutting down outpost heating and air systems.';
  }
  if (resources.radiationProtection <= 0) {
    return 'Radiation Protection reached 0%, prompting Mission Control to end the mission early for crew safety.';
  }
  return null;
}

export function applyDecision(state: GameState, optionId: string): GameState {
  if (
    state.phase !== 'playing' ||
    state.isPaused ||
    state.isProcessingAction ||
    !state.activeEvent
  ) {
    return state;
  }

  const chosenOption = state.activeEvent.options.find((opt) => opt.id === optionId);
  if (!chosenOption) return state;

  const prev = state.resources;
  const d = chosenOption.deltas;

  const nextLifeSupport = clampResource(prev.lifeSupport + d.lifeSupport);
  const nextPower = clampResource(prev.power + d.power);
  const nextRadiation = clampResource(prev.radiationProtection + d.radiationProtection);

  // Solar generation never automatically drops to 0 during dust storms
  const rawSolar = prev.solarGeneration + (d.solarGeneration ?? Math.round(d.power * 0.4));
  const nextSolarGeneration = Math.max(15, clampResource(rawSolar));

  const nextResources: ResourceState = {
    ...prev,
    lifeSupport: nextLifeSupport,
    power: nextPower,
    radiationProtection: nextRadiation,
    oxygenAvailability: clampResource(
      prev.oxygenAvailability + (d.oxygenAvailability ?? Math.round(d.lifeSupport * 0.8))
    ),
    foodReserves: clampResource(
      prev.foodReserves + (d.foodReserves ?? Math.round(d.lifeSupport * 0.5))
    ),
    greenhouseStatus: chosenOption.greenhouseEffect ?? prev.greenhouseStatus,
    solarGeneration: nextSolarGeneration,
    batteryReserve: clampResource(prev.batteryReserve + (d.batteryReserve ?? d.power)),
    energyConsumption: chosenOption.energyConsumptionEffect ?? prev.energyConsumption,
    shieldingCondition: clampResource(
      prev.shieldingCondition + (d.shieldingCondition ?? d.radiationProtection)
    ),
    crewExposureRisk: chosenOption.exposureRiskEffect ?? prev.crewExposureRisk,
    solarWeatherAlert: chosenOption.solarAlertEffect ?? prev.solarWeatherAlert,
    shelterAvailable: chosenOption.shelterEffect ?? prev.shelterAvailable,
  };

  const prevShelter =
    state.radiationShelter ?? createInitialRadiationShelterState();
  const nextSheltered =
    chosenOption.crewStatusEffect === 'Sheltered'
      ? true
      : prevShelter.crewSheltered;

  // Calculate immediate crew health impact from reckless/delayed choices or critical drops
  let immediateHealthDelta = 0;
  if (chosenOption.approach === 'wait-for-earth') {
    immediateHealthDelta -=
      state.activeEvent.severity === 'Emergency' ? 10 : 5;
  }
  if (nextLifeSupport < 30) immediateHealthDelta -= 8;
  if (nextRadiation < 35) immediateHealthDelta -= 8;
  if (nextResources.solarWeatherAlert === 'Storm Watch' && !nextSheltered) {
    immediateHealthDelta -= 8;
  }

  const updatedMembers = updateCrewMembers(state.crew.members, {
    healthDelta: immediateHealthDelta,
    energyDelta: chosenOption.crewEnergyDelta,
    preferredStatus: chosenOption.crewStatusEffect,
  });

  const avgEnergy = computeCrewReadiness(updatedMembers);

  const record: DecisionRecord = {
    sol: state.currentSol,
    eventId: state.activeEvent.id,
    eventTitle: state.activeEvent.title,
    eventCategory: state.activeEvent.category,
    optionId: chosenOption.id,
    optionLabel: chosenOption.label,
    approach: chosenOption.approach ?? 'standard-engineering',
    appliedDeltas: {
      lifeSupport: nextLifeSupport - prev.lifeSupport,
      power: nextPower - prev.power,
      radiationProtection: nextRadiation - prev.radiationProtection,
    },
    whyExplanation: chosenOption.whyExplanation,
    lessonTag: chosenOption.lessonTag,
  };

  const prevGh = state.greenhouse ?? createInitialGreenhouseState();
  let ghHealthDelta = 0;
  let nextIrrigation = prevGh.irrigationStatus;
  if (chosenOption.greenhouseEffect === 'Damaged') {
    ghHealthDelta = -14;
    nextIrrigation = 'Low Pressure';
  } else if (chosenOption.greenhouseEffect === 'Strained') {
    ghHealthDelta = -6;
  } else if (chosenOption.greenhouseEffect === 'Thriving') {
    ghHealthDelta = 6;
  }

  const nextGhHealth = clampResource(prevGh.health + ghHealthDelta);
  const nextGreenhouse: GreenhouseState = {
    ...prevGh,
    health: nextGhHealth,
    irrigationStatus: nextIrrigation,
  };

  const nextPowerOps: PowerOperationsState = {
    ...state.powerOps,
    dustAccumulation: clampResource(
      state.powerOps.dustAccumulation + (d.dustAccumulation ?? 0)
    ),
    stormSeverity: chosenOption.stormSeverityEffect ?? state.powerOps.stormSeverity,
    powerSavingMode:
      chosenOption.energyConsumptionEffect === 'Low'
        ? true
        : chosenOption.energyConsumptionEffect === 'High'
          ? false
          : state.powerOps.powerSavingMode,
  };

  const leakTriggeredByDecision =
    Boolean(prevShelter.radiationLeakActive) ||
    nextRadiation < 35 ||
    (nextResources.solarWeatherAlert === 'Storm Watch' && !nextSheltered);

  const nextShelter: RadiationShelterState = {
    ...prevShelter,
    shelterReadiness: clampResource(
      prevShelter.shelterReadiness + (d.shelterReadiness ?? 0)
    ),
    crewSheltered: nextSheltered,
    radiationLeakActive: leakTriggeredByDecision,
  };

  const failureReason = checkFailureReason(nextResources, updatedMembers);

  return {
    ...state,
    phase: 'outcome',
    resources: nextResources,
    greenhouse: nextGreenhouse,
    powerOps: nextPowerOps,
    radiationShelter: nextShelter,
    crew: {
      members: updatedMembers,
      overallReadiness: avgEnergy,
      crewNote: buildCrewNote(updatedMembers, avgEnergy),
    },
    lastDecision: record,
    decisionHistory: [...state.decisionHistory, record],
    failureReason,
  };
}

export function proceedToSolSummary(state: GameState): GameState {
  if (state.phase !== 'outcome' || state.isPaused) return state;

  if (state.failureReason) {
    const failedPoint = {
      sol: state.currentSol,
      label: `Sol ${state.currentSol}`,
      lifeSupport: state.resources.lifeSupport,
      power: state.resources.power,
      radiationProtection: state.resources.radiationProtection,
    };
    return {
      ...state,
      phase: 'report',
      history: [...state.history, failedPoint],
    };
  }

  const prev = state.resources;
  const prevGh = state.greenhouse ?? createInitialGreenhouseState();
  const prevShelter =
    state.radiationShelter ?? createInitialRadiationShelterState();
  const isStorm = state.powerOps.stormSeverity === 'Regional Storm';
  const powerSaving = state.powerOps.powerSavingMode;

  const incapacitatedOrLost = state.crew.members.filter(
    (m) => m.status === 'Incapacitated' || m.status === 'Deceased'
  ).length;
  const lifeSupportUpkeep =
    (prev.greenhouseStatus === 'Thriving' && !prevGh.cropsSpoiled ? -2 : -4) -
    (incapacitatedOrLost > 0 ? 1 : 0);

  // Power-saving mode saves battery energy overnight; storm reduces daytime charging partially
  const powerUpkeep = powerSaving
    ? 3
    : isStorm
      ? -4
      : prev.energyConsumption === 'High'
        ? -4
        : prev.energyConsumption === 'Low'
          ? 2
          : -1;

  const unshieldedSpe =
    prev.solarWeatherAlert === 'Storm Watch' && !prevShelter.crewSheltered;
  const leakActive =
    Boolean(prevShelter.radiationLeakActive) ||
    prev.radiationProtection < 35 ||
    unshieldedSpe;

  const radiationUpkeep =
    (prev.solarWeatherAlert === 'Storm Watch' ? -3 : -1) -
    (leakActive ? 4 : 0);

  const nextLifeSupport = clampResource(prev.lifeSupport + lifeSupportUpkeep);
  const nextPower = clampResource(prev.power + powerUpkeep);
  const nextRadiation = clampResource(prev.radiationProtection + radiationUpkeep);

  const nextLeakActive = leakActive || nextRadiation < 35;
  const dailyDose = unshieldedSpe
    ? 5.5
    : nextLeakActive
      ? 2.4
      : prevShelter.crewSheltered
        ? 0.25
        : 0.67;
  const nextCumulativeDose = Number(
    ((prevShelter.cumulativeDoseMSv ?? 0.67) + dailyDose).toFixed(2)
  );

  // Realistic dust buildup: small daily drift (~2% scaled for 10-Sol gameplay, referencing ~0.2%/Sol benchmark)
  const dustGain = isStorm ? 8 : 2;
  const nextDust = clampResource(state.powerOps.dustAccumulation + dustGain);
  const nextSolarGen = Math.max(
    18,
    clampResource(prev.solarGeneration - (isStorm ? 4 : 1))
  );

  const nextWater = clampResource(prevGh.waterAvailability - 4);
  const nextLowPowerStreak = nextPower < 25 ? (prevGh.lowPowerStreak ?? 0) + 1 : 0;
  const newlySpoiled =
    !prevGh.cropsSpoiled && (nextLowPowerStreak >= 2 || nextWater < 15);
  const nextCropsSpoiled = Boolean(prevGh.cropsSpoiled) || newlySpoiled;

  let nextGhHealth = clampResource(
    prevGh.health + (prevGh.irrigationStatus === 'Clogged' || nextWater < 25 ? -6 : 0)
  );
  if (newlySpoiled) {
    nextGhHealth = clampResource(nextGhHealth - 16);
  }

  const baseGrowth =
    nextCropsSpoiled
      ? 0
      : prevGh.irrigationStatus === 'Clogged' || nextWater < 25
        ? 4
        : nextGhHealth >= 70 && prevGh.powerConsumption === 'Boosted'
          ? 22
          : nextGhHealth >= 60
            ? 16
            : 8;
  const growthGain = nextCropsSpoiled
    ? 0
    : powerSaving
      ? Math.max(4, baseGrowth - 4)
      : baseGrowth;
  const nextGrowth = nextCropsSpoiled
    ? 0
    : clampResource(prevGh.cropGrowthProgress + growthGain);

  const nextIrrigation: GreenhouseState['irrigationStatus'] =
    newlySpoiled || nextWater < 25
      ? 'Clogged'
      : nextWater < 45 && prevGh.irrigationStatus === 'Flowing'
        ? 'Low Pressure'
        : prevGh.irrigationStatus;

  const syncedGreenhouseStatus: ResourceState['greenhouseStatus'] = nextCropsSpoiled
    ? 'Damaged'
    : nextGhHealth >= 70
      ? 'Thriving'
      : nextGhHealth >= 40
        ? 'Strained'
        : 'Damaged';

  const foodDelta = newlySpoiled
    ? -6
    : nextCropsSpoiled
      ? -3
      : prev.greenhouseStatus === 'Thriving'
        ? 1
        : -3;

  const nextResources: ResourceState = {
    ...prev,
    lifeSupport: nextLifeSupport,
    power: nextPower,
    radiationProtection: nextRadiation,
    oxygenAvailability: clampResource(prev.oxygenAvailability + lifeSupportUpkeep),
    foodReserves: clampResource(prev.foodReserves + foodDelta),
    greenhouseStatus: syncedGreenhouseStatus,
    solarGeneration: nextSolarGen,
    batteryReserve: clampResource(prev.batteryReserve + powerUpkeep),
    shieldingCondition: clampResource(prev.shieldingCondition + radiationUpkeep),
    crewExposureRisk: nextLeakActive
      ? 'Elevated'
      : nextRadiation >= 60
        ? 'Low'
        : nextRadiation >= 35
          ? 'Moderate'
          : 'Elevated',
    solarWeatherAlert: prev.solarWeatherAlert === 'Storm Watch' ? 'Advisory' : 'Clear',
  };

  // Overnight Crew Health Effects
  let overnightHealthDelta = 0;
  if (nextLifeSupport < 20) overnightHealthDelta -= 16;
  else if (nextLifeSupport < 35) overnightHealthDelta -= 10;

  if (nextResources.foodReserves < 20) overnightHealthDelta -= 6;
  if (unshieldedSpe) overnightHealthDelta -= 15;
  else if (nextLeakActive) overnightHealthDelta -= 10;

  if (nextPower < 20) overnightHealthDelta -= 8;

  if (
    overnightHealthDelta === 0 &&
    nextLifeSupport >= 65 &&
    nextRadiation >= 55 &&
    nextPower >= 45 &&
    nextResources.foodReserves >= 35
  ) {
    overnightHealthDelta = 5;
  }

  const restedMembers = updateCrewMembers(state.crew.members, {
    healthDelta: overnightHealthDelta,
    energyDelta: 5,
    preferredStatus: prevShelter.crewSheltered ? 'Sheltered' : 'Active',
  });

  const avgEnergy = computeCrewReadiness(restedMembers);
  const failureAfterUpkeep = checkFailureReason(nextResources, restedMembers);

  const criticalWarnings: string[] = [];
  if (nextLifeSupport < 30 && nextLifeSupport > 0) criticalWarnings.push('Life Support is critical');
  if (nextPower < 30 && nextPower > 0) criticalWarnings.push('Power reserves are critical');
  if (nextRadiation < 30 && nextRadiation > 0) criticalWarnings.push('Radiation shielding is critical');
  if (nextLeakActive) criticalWarnings.push('Radiation leak active inside habitat');
  if (newlySpoiled) {
    criticalWarnings.push('Greenhouse crops spoiled from low power or frozen pipes');
  } else if (nextLowPowerStreak === 1) {
    criticalWarnings.push(
      'Frost warning: Power below 25% — another low-power Sol will spoil Greenhouse crops'
    );
  }
  const newCasualties = restedMembers.filter((m) => m.status === 'Deceased').length;
  const injuredCrew = restedMembers.filter((m) => m.status === 'Incapacitated').length;
  if (newCasualties > 0) {
    criticalWarnings.push(`${newCasualties} astronaut(s) lost`);
  } else if (injuredCrew > 0) {
    criticalWarnings.push(`${injuredCrew} astronaut(s) incapacitated`);
  }

  const nextGreenhouse: GreenhouseState = {
    ...prevGh,
    health: nextGhHealth,
    waterAvailability: nextWater,
    cropGrowthProgress: nextGrowth,
    cropGrowthStage: getCropGrowthStage(nextGrowth, nextCropsSpoiled),
    harvestReadiness: !nextCropsSpoiled && nextGrowth >= 100,
    irrigationStatus: nextIrrigation,
    powerConsumption: powerSaving ? 'Low' : 'Standard',
    lowPowerStreak: nextLowPowerStreak,
    cropsSpoiled: nextCropsSpoiled,
  };

  const solPoint = {
    sol: state.currentSol,
    label: `Sol ${state.currentSol}`,
    lifeSupport: nextLifeSupport,
    power: nextPower,
    radiationProtection: nextRadiation,
  };

  return {
    ...state,
    phase: 'sol-summary',
    resources: nextResources,
    greenhouse: nextGreenhouse,
    powerOps: {
      ...state.powerOps,
      dustAccumulation: nextDust,
    },
    radiationShelter: {
      ...prevShelter,
      radiationLeakActive: nextLeakActive,
      cumulativeDoseMSv: nextCumulativeDose,
    },
    crew: {
      members: restedMembers,
      overallReadiness: avgEnergy,
      crewNote:
        overnightHealthDelta < 0
          ? 'Hazardous overnight conditions hurt crew health. Stabilize Life Support, Power, and Shielding.'
          : overnightHealthDelta > 0
            ? 'Healthy habitat conditions restored +5% crew health and +5% energy overnight.'
            : 'Overnight sleep cycle restored +5% crew energy for the next Martian morning.',
    },
    history: [...state.history, solPoint],
    lastSolSummary: {
      completedSol: state.currentSol,
      dailyUpkeepDeltas: {
        lifeSupport: nextLifeSupport - prev.lifeSupport,
        power: nextPower - prev.power,
        radiationProtection: nextRadiation - prev.radiationProtection,
      },
      summaryNote: newlySpoiled
        ? 'Overnight frost and low power froze irrigation lines and spoiled Greenhouse crops.'
        : nextLeakActive
          ? 'Radiation leak increased cabin exposure overnight; repair shelter shielding on the next Sol.'
          : 'Overnight habitat heating, air circulation, dust accumulation, and greenhouse crop growth updated across Outpost Zero.',
      criticalWarning:
        criticalWarnings.length > 0
          ? `${criticalWarnings.join(' · ')}. Prioritize recovery next Sol.`
          : null,
    },
    failureReason: failureAfterUpkeep,
  };
}

export function advanceToNextSol(state: GameState): GameState {
  if (state.phase !== 'sol-summary' || state.isPaused) return state;

  if (state.failureReason || state.currentSol >= state.missionConfig.maxSols) {
    return {
      ...state,
      phase: 'report',
      activeEvent: null,
    };
  }

  const nextSol = state.currentSol + 1;
  const nextEvent = selectEventForSol(
    nextSol,
    state.usedEventIds,
    state.missionSeed,
    state.missionConfig.spaceWeatherMode
  );
  const prevGh = state.greenhouse ?? createInitialGreenhouseState();
  const envEffects = applyEventEnvironmentEffects(state, nextEvent, nextSol);

  return {
    ...state,
    ...envEffects,
    phase: 'playing',
    currentSol: nextSol,
    activeEvent: nextEvent,
    lastDecision: null,
    greenhouse: {
      ...prevGh,
      actionsUsedThisSol: [],
      lastActionFeedback: null,
    },
    usedEventIds: [...state.usedEventIds, nextEvent.id],
    commAdviceUsedForCurrentEvent: false,
  };
}

export function applyGreenhouseAction(
  state: GameState,
  actionId: GreenhouseActionId
): GameState {
  if (state.phase !== 'playing' || state.isPaused || state.isProcessingAction) {
    return state;
  }

  const prevRes = state.resources;
  const prevGh = state.greenhouse ?? createInitialGreenhouseState();

  if (
    prevGh.actionsUsedThisSol.includes(actionId) ||
    prevGh.actionsUsedThisSol.length >= 2
  ) {
    return state;
  }

  if (actionId === 'harvest-crops' && (!prevGh.harvestReadiness || prevGh.cropsSpoiled)) {
    return state;
  }

  if (actionId === 'allocate-power' && (prevRes.power < 15 || prevGh.cropsSpoiled)) {
    return state;
  }

  if (actionId === 'reseed-crops' && !prevGh.cropsSpoiled) {
    return state;
  }

  let lifeDelta = 0;
  let powerDelta = 0;
  let radDelta = 0;
  let foodDelta = 0;
  let ghHealthDelta = 0;
  let waterDelta = 0;
  let growthDelta = 0;
  let crewEnergyDelta = 0;
  let nextPowerMode = prevGh.powerConsumption;
  let nextIrrigation = prevGh.irrigationStatus;
  let nextCropsSpoiled = Boolean(prevGh.cropsSpoiled);
  let nextLowPowerStreak = prevGh.lowPowerStreak ?? 0;
  let title = '';
  let explanation = '';

  switch (actionId) {
    case 'maintain-equipment':
      title = 'Greenhouse Equipment Maintained';
      ghHealthDelta = 14;
      lifeDelta = 2;
      powerDelta = -5;
      crewEnergyDelta = -4;
      explanation =
        'Cleaning LED lenses, checking thermal seals, and calibrating nutrient sensors boosted Greenhouse Health (+14%) and air balance (+2% Life Support), while using 5% Power and crew labor.';
      break;

    case 'allocate-power':
      title = 'Power Allocated to Plant Growth';
      growthDelta = 30;
      ghHealthDelta = 4;
      lifeDelta = 3;
      powerDelta = -8;
      nextPowerMode = 'Boosted';
      explanation =
        'Boosting full-spectrum grow lights and heaters accelerated Crop Growth (+30%) and raised plant oxygen output (+3% Life Support), at the cost of 8% Power from outpost batteries.';
      break;

    case 'repair-irrigation':
      title = 'Irrigation System Repaired';
      nextIrrigation = 'Flowing';
      waterDelta = 18;
      ghHealthDelta = 6;
      radDelta = -4;
      powerDelta = -4;
      crewEnergyDelta = -4;
      explanation =
        'Clearing pump valves restored Irrigation to Flowing (+18% Water Availability, +6% Greenhouse Health). Refilling the loop borrowed water from the habitat jacket (-4% Radiation Protection) and used 4% Power.';
      break;

    case 'harvest-crops':
      title = 'Fresh Crops Harvested';
      foodDelta = 18;
      lifeDelta = 8;
      waterDelta = -10;
      powerDelta = -3;
      crewEnergyDelta = -5;
      growthDelta = 20 - prevGh.cropGrowthProgress;
      explanation =
        'Harvesting mature greens added +18% Food Reserves and boosted Life Support (+8%), then replanted fresh seedlings. Processing and replanting spent 10% Water, 3% Power, and crew energy.';
      break;

    case 'reseed-crops':
      title = 'Spoiled Crops Cleared & Re-seeded';
      nextCropsSpoiled = false;
      nextLowPowerStreak = 0;
      ghHealthDelta = 10;
      powerDelta = -6;
      waterDelta = -8;
      crewEnergyDelta = -6;
      growthDelta = 15;
      explanation =
        'Crew cleared frozen spoiled biomass, flushed nutrient trays, and planted new seedlings (15% Growth). Re-seeding spent 6% Power, 8% Water, and crew energy.';
      break;
  }

  const nextLife = clampResource(prevRes.lifeSupport + lifeDelta);
  const nextPower = clampResource(prevRes.power + powerDelta);
  const nextRad = clampResource(prevRes.radiationProtection + radDelta);
  const nextFood = clampResource(prevRes.foodReserves + foodDelta);
  const nextGhHealth = clampResource(prevGh.health + ghHealthDelta);
  const nextWater = clampResource(prevGh.waterAvailability + waterDelta);
  const nextGrowth =
    actionId === 'harvest-crops'
      ? 20
      : actionId === 'reseed-crops'
        ? 15
        : nextCropsSpoiled
          ? 0
          : clampResource(prevGh.cropGrowthProgress + growthDelta);

  const nextGreenhouseStatus: ResourceState['greenhouseStatus'] = nextCropsSpoiled
    ? 'Damaged'
    : nextGhHealth >= 70
      ? 'Thriving'
      : nextGhHealth >= 40
        ? 'Strained'
        : 'Damaged';

  const nextResources: ResourceState = {
    ...prevRes,
    lifeSupport: nextLife,
    power: nextPower,
    radiationProtection: nextRad,
    foodReserves: nextFood,
    batteryReserve: clampResource(prevRes.batteryReserve + powerDelta),
    shieldingCondition: clampResource(prevRes.shieldingCondition + radDelta),
    greenhouseStatus: nextGreenhouseStatus,
  };

  const updatedCrewMembers =
    crewEnergyDelta !== 0
      ? updateCrewMembers(state.crew.members, { energyDelta: crewEnergyDelta })
      : state.crew.members;
  const avgEnergy = computeCrewReadiness(updatedCrewMembers);

  const nextGreenhouse: GreenhouseState = {
    health: nextGhHealth,
    waterAvailability: nextWater,
    cropGrowthProgress: nextGrowth,
    cropGrowthStage: getCropGrowthStage(nextGrowth, nextCropsSpoiled),
    powerConsumption: nextPowerMode,
    irrigationStatus: nextIrrigation,
    harvestReadiness: !nextCropsSpoiled && nextGrowth >= 100,
    lowPowerStreak: nextLowPowerStreak,
    cropsSpoiled: nextCropsSpoiled,
    actionsUsedThisSol: [...prevGh.actionsUsedThisSol, actionId],
    lastActionFeedback: {
      actionId,
      title,
      explanation,
      deltas: {
        lifeSupport: nextLife - prevRes.lifeSupport,
        power: nextPower - prevRes.power,
        radiationProtection: nextRad - prevRes.radiationProtection,
        foodReserves: nextFood - prevRes.foodReserves,
        greenhouseHealth: nextGhHealth - prevGh.health,
        waterAvailability: nextWater - prevGh.waterAvailability,
        cropGrowthProgress: nextGrowth - prevGh.cropGrowthProgress,
      },
    },
  };

  const failureReason = checkFailureReason(nextResources, updatedCrewMembers);
  const nextPhase = failureReason ? 'report' : state.phase;
  const nextHistory = failureReason
    ? [
        ...state.history,
        {
          sol: state.currentSol,
          label: `Sol ${state.currentSol}`,
          lifeSupport: nextLife,
          power: nextPower,
          radiationProtection: nextRad,
        },
      ]
    : state.history;

  return {
    ...state,
    phase: nextPhase,
    resources: nextResources,
    greenhouse: nextGreenhouse,
    crew: {
      ...state.crew,
      members: updatedCrewMembers,
      overallReadiness: avgEnergy,
    },
    history: nextHistory,
    failureReason,
  };
}

export function applyPowerAction(
  state: GameState,
  actionId: PowerActionId
): GameState {
  if (state.phase !== 'playing' || state.isPaused || state.isProcessingAction) {
    return state;
  }

  const prevPowerOps = state.powerOps ?? createInitialPowerOpsState();
  if (prevPowerOps.actionsUsedThisSol.includes(actionId)) {
    return state;
  }

  const prevRes = state.resources;

  if (actionId === 'toggle-power-saving') {
    const nextSaving = !prevPowerOps.powerSavingMode;
    return {
      ...state,
      resources: {
        ...prevRes,
        energyConsumption: nextSaving ? 'Low' : 'Balanced',
      },
      powerOps: {
        ...prevPowerOps,
        powerSavingMode: nextSaving,
        actionsUsedThisSol: [...prevPowerOps.actionsUsedThisSol, actionId],
        lastActionFeedback: {
          title: nextSaving
            ? 'Emergency Power-Saving Mode Enabled'
            : 'Standard Power Mode Restored',
          explanation: nextSaving
            ? 'Non-essential lab lights and high-draw equipment are dimmed to protect essential life support and conserve batteries overnight (slows overnight crop growth slightly).'
            : 'Normal power allocation restored for standard science and greenhouse lighting.',
        },
      },
    };
  }

  // clean-solar-panels: blocked during active Regional Storm for crew safety
  if (prevPowerOps.stormSeverity === 'Regional Storm') {
    return state;
  }

  const nextDust = clampResource(prevPowerOps.dustAccumulation - 25);
  const nextSolar = clampResource(prevRes.solarGeneration + 12);
  const nextPower = clampResource(prevRes.power + 8);
  const nextLife = clampResource(prevRes.lifeSupport - 4);
  const updatedCrew = updateCrewMembers(state.crew.members, {
    energyDelta: -5,
  });
  const avgEnergy = computeCrewReadiness(updatedCrew);

  const nextResources: ResourceState = {
    ...prevRes,
    solarGeneration: nextSolar,
    power: nextPower,
    batteryReserve: clampResource(prevRes.batteryReserve + 8),
    lifeSupport: nextLife,
    oxygenAvailability: clampResource(prevRes.oxygenAvailability - 4),
  };

  const failureReason = checkFailureReason(nextResources, updatedCrew);

  return {
    ...state,
    phase: failureReason ? 'report' : state.phase,
    resources: nextResources,
    powerOps: {
      ...prevPowerOps,
      dustAccumulation: nextDust,
      actionsUsedThisSol: [...prevPowerOps.actionsUsedThisSol, actionId],
      lastActionFeedback: {
        title: 'Solar Panel Maintenance Completed',
        explanation:
          'Brushing dust off solar wings cut Dust Accumulation (-25%), boosted Solar Generation (+12%) and Power (+8%), while spending spacesuit oxygen (-4% Life Support) and crew energy.',
      },
    },
    crew: {
      ...state.crew,
      members: updatedCrew,
      overallReadiness: avgEnergy,
    },
    failureReason,
  };
}

export function applyShelterAction(
  state: GameState,
  actionId: ShelterActionId
): GameState {
  if (state.phase !== 'playing' || state.isPaused || state.isProcessingAction) {
    return state;
  }

  const prevShelter =
    state.radiationShelter ?? createInitialRadiationShelterState();
  if (prevShelter.actionsUsedThisSol.includes(actionId)) {
    return state;
  }

  const prevRes = state.resources;
  let nextRad = prevRes.radiationProtection;
  let nextPower = prevRes.power;
  let nextLife = prevRes.lifeSupport;
  let nextReadiness = prevShelter.shelterReadiness;
  let nextSheltered = prevShelter.crewSheltered;
  let nextExposure = prevRes.crewExposureRisk;
  let nextLeakActive = Boolean(prevShelter.radiationLeakActive);
  let crewEnergyDelta = 0;
  let title = '';
  let explanation = '';

  switch (actionId) {
    case 'enter-shelter':
      if (prevShelter.crewSheltered) return state;
      nextSheltered = true;
      nextRad = clampResource(prevRes.radiationProtection + 6);
      nextPower = clampResource(prevRes.power - 4);
      nextExposure = 'Low';
      title = 'Crew Moved into Radiation Shelter';
      explanation =
        'Moving inside the water-and-polyethylene core reduces radiation dose (+6% Radiation Protection; never eliminates radiation 100%) while using 4% Power for shelter air circulation and delaying outer tasks.';
      break;

    case 'exit-shelter':
      if (!prevShelter.crewSheltered) return state;
      nextSheltered = false;
      nextLife = clampResource(prevRes.lifeSupport + 2);
      nextRad = clampResource(prevRes.radiationProtection - 2);
      title = 'Crew Returned to Nominal Habitat Operations';
      explanation =
        'Returning to full habitat bays restores normal maintenance and greenhouse access (+2% Life Support) while leaving thicker storm shelter walls (-2% Radiation margin).';
      break;

    case 'reinforce-shelter': {
      if (prevRes.power < 12) return state;
      const wasLeaking = Boolean(prevShelter.radiationLeakActive);
      nextLeakActive = false;
      nextReadiness = clampResource(prevShelter.shelterReadiness + 14);
      nextRad = clampResource(prevRes.radiationProtection + (wasLeaking ? 10 : 6));
      nextPower = clampResource(prevRes.power - 6);
      nextExposure = nextRad >= 50 ? 'Low' : 'Moderate';
      crewEnergyDelta = -5;
      title = wasLeaking
        ? 'Radiation Leak Sealed & Shelter Reinforced'
        : 'Shelter Shielding Reinforced';
      explanation = wasLeaking
        ? 'Patched breached polyethylene bladders and topped off water-wall shielding, sealing the active Radiation Leak (+10% Radiation Protection, +14% Shelter Readiness) at the cost of 6% Power and crew labor.'
        : 'Adding polyethylene storage packs and checking water-wall bladders improved Shelter Readiness (+14%) and Radiation Protection (+6%), at the cost of 6% Power and crew construction time.';
      break;
    }
  }

  const nextResources: ResourceState = {
    ...prevRes,
    radiationProtection: nextRad,
    shieldingCondition: clampResource(
      prevRes.shieldingCondition + (nextRad - prevRes.radiationProtection)
    ),
    power: nextPower,
    batteryReserve: clampResource(prevRes.batteryReserve + (nextPower - prevRes.power)),
    lifeSupport: nextLife,
    crewExposureRisk: nextExposure,
  };

  const updatedCrew = updateCrewMembers(state.crew.members, {
    energyDelta: crewEnergyDelta,
    preferredStatus: nextSheltered ? 'Sheltered' : 'Active',
  });
  const avgEnergy = computeCrewReadiness(updatedCrew);

  const failureReason = checkFailureReason(nextResources, updatedCrew);

  return {
    ...state,
    phase: failureReason ? 'report' : state.phase,
    resources: nextResources,
    radiationShelter: {
      ...prevShelter,
      shelterReadiness: nextReadiness,
      crewSheltered: nextSheltered,
      radiationLeakActive: nextLeakActive,
      actionsUsedThisSol: [...prevShelter.actionsUsedThisSol, actionId],
      lastActionFeedback: {
        title,
        explanation,
      },
    },
    crew: {
      ...state.crew,
      members: updatedCrew,
      overallReadiness: avgEnergy,
    },
    failureReason,
  };
}

export function buildMissionReport(
  state: GameState,
  donkiContext?: DonkiRadiationContext
): MissionReport {
  const succeeded = !state.failureReason && state.currentSol >= state.missionConfig.maxSols;
  const solsSurvived = succeeded
    ? state.missionConfig.maxSols
    : Math.max(1, state.currentSol - (state.phase === 'report' && state.failureReason ? 0 : 1));

  const { lifeSupport, power, radiationProtection } = state.resources;
  const averageScore = Math.round((lifeSupport + power + radiationProtection) / 3);

  const { scoreBreakdown, recommendations } = evaluateMissionAdvisor(
    state,
    donkiContext
  );

  const uniqueLessons = Array.from(
    new Set(state.decisionHistory.map((d) => d.lessonTag))
  ).slice(0, 5);

  if (uniqueLessons.length === 0) {
    uniqueLessons.push(
      'Every engineering choice on Mars balances competing life-support, power, and safety needs.'
    );
  }

  const crewAlive = state.crew.members.filter((m) => m.status !== 'Deceased').length;
  const crewTotal = state.crew.members.length;
  const operableCount = state.crew.members.filter(
    (m) => m.status !== 'Deceased' && m.status !== 'Incapacitated'
  ).length;

  let failedSystem: string | null = null;
  if (!succeeded) {
    if (crewAlive <= crewTotal - 2 || operableCount === 0) failedSystem = 'Crew Health';
    else if (lifeSupport <= 0) failedSystem = 'Life Support';
    else if (power <= 0) failedSystem = 'Power';
    else if (radiationProtection <= 0) failedSystem = 'Radiation Protection';
  }

  const site = getLandingSiteProfile(state.missionConfig.landingSite);

  return {
    outcome: succeeded ? 'success' : 'failure',
    title: succeeded
      ? 'Mission Accomplished: Outpost Zero Survived All 10 Sols'
      : 'Mission Ended Early — Valuable Engineering Data Collected',
    summary: succeeded
      ? 'Your crew balanced oxygen, food, solar power, dust storms, communication delays, and radiation shelter safety across ten Martian days.'
      : state.failureReason ||
        'One of the outpost systems dropped to critical zero. Real space missions run simulations like this hundreds of times to learn how to protect crews!',
    solsSurvived,
    maxSols: state.missionConfig.maxSols,
    missionSeed: state.missionSeed,
    landingSiteName: site.name,
    spaceWeatherMode: state.missionConfig.spaceWeatherMode ?? 'standard',
    crewAlive,
    crewTotal,
    cumulativeDoseMSv: state.radiationShelter?.cumulativeDoseMSv ?? 0.67,
    finalResources: {
      lifeSupport,
      power,
      radiationProtection,
    },
    averageScore,
    scoreBreakdown,
    advisorRecommendations: recommendations,
    history: state.history,
    decisions: state.decisionHistory,
    lessonsLearned: uniqueLessons,
    failedSystem,
  };
}
