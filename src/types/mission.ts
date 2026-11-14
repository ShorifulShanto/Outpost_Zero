export type AppRoute = 'home' | 'simulator' | 'learn' | 'observatory' | 'about';

export type ResourceKey = 'lifeSupport' | 'power' | 'radiationProtection';

export type ResourceStatus = 'Nominal' | 'Caution' | 'Critical';

export type MissionPhase =
  | 'briefing'
  | 'playing'
  | 'outcome'
  | 'sol-summary'
  | 'report';

export interface ResourceState {
  // Primary tracked percentages (0 - 100)
  lifeSupport: number;
  power: number;
  radiationProtection: number;

  // Detailed sub-metrics for educational transparency
  oxygenAvailability: number; // 0 - 100%
  foodReserves: number; // 0 - 100%
  greenhouseStatus: 'Thriving' | 'Strained' | 'Damaged';

  solarGeneration: number; // 0 - 100%
  batteryReserve: number; // 0 - 100%
  energyConsumption: 'Low' | 'Balanced' | 'High';

  shieldingCondition: number; // 0 - 100%
  crewExposureRisk: 'Low' | 'Moderate' | 'Elevated';
  solarWeatherAlert: 'Clear' | 'Advisory' | 'Storm Watch';
  shelterAvailable: boolean;
}

export interface CrewMember {
  id: string;
  name: string;
  role: string;
  specialty: string;
  health: number; // 0 - 100
  energy: number; // 0 - 100
  status:
    | 'Active'
    | 'Sheltered'
    | 'Resting'
    | 'Repair Duty'
    | 'Incapacitated'
    | 'Deceased';
}

export interface CrewState {
  members: CrewMember[];
  overallReadiness: number; // 0 - 100
  crewNote: string;
}

export interface ResourceDelta {
  lifeSupport: number;
  power: number;
  radiationProtection: number;
  oxygenAvailability?: number;
  foodReserves?: number;
  solarGeneration?: number;
  batteryReserve?: number;
  shieldingCondition?: number;
  dustAccumulation?: number;
  shelterReadiness?: number;
}

export type DecisionApproach =
  | 'approved-checklist'
  | 'wait-for-earth'
  | 'detailed-report'
  | 'standard-engineering';

export interface DecisionOption {
  id: string;
  label: string;
  actionSummary: string;
  tradeOffHint: string;
  approach?: DecisionApproach;
  deltas: ResourceDelta;
  crewEnergyDelta: number;
  crewStatusEffect?: CrewMember['status'];
  greenhouseEffect?: ResourceState['greenhouseStatus'];
  energyConsumptionEffect?: ResourceState['energyConsumption'];
  exposureRiskEffect?: ResourceState['crewExposureRisk'];
  solarAlertEffect?: ResourceState['solarWeatherAlert'];
  shelterEffect?: boolean;
  stormSeverityEffect?: PowerOperationsState['stormSeverity'];
  whyExplanation: string;
  lessonTag: string;
}

export interface CommunicationAdvice {
  headline: string;
  guidance: string;
  scienceFact: string;
}

export type EventCategory =
  | 'Life Support'
  | 'Power'
  | 'Radiation'
  | 'Communications'
  | 'Habitat'
  | 'Rover'
  | 'Crew & Supplies';

export interface MissionEvent {
  id: string;
  code?: string;
  title: string;
  category: EventCategory;
  severity: 'Advisory' | 'Alert' | 'Emergency';
  solWindow: [number, number];
  description: string;
  scientificExplanation: string;
  educationalTakeaway: string;
  affectedSystems: ResourceKey[];
  environmentCondition?: EnvironmentState['weatherCondition'];
  conjunctionRestricted?: boolean;
  options: DecisionOption[];
  earthAdvice: CommunicationAdvice;
}

export interface DecisionRecord {
  sol: number;
  eventId: string;
  eventTitle: string;
  eventCategory: EventCategory;
  optionId: string;
  optionLabel: string;
  approach: DecisionApproach;
  appliedDeltas: {
    lifeSupport: number;
    power: number;
    radiationProtection: number;
  };
  whyExplanation: string;
  lessonTag: string;
}

export interface SolHistoryPoint {
  sol: number;
  label: string;
  lifeSupport: number;
  power: number;
  radiationProtection: number;
}

export interface SolSummaryData {
  completedSol: number;
  dailyUpkeepDeltas: {
    lifeSupport: number;
    power: number;
    radiationProtection: number;
  };
  summaryNote: string;
  criticalWarning: string | null;
}

export type CropGrowthStage =
  | 'Seedling'
  | 'Vegetative'
  | 'Flowering'
  | 'Harvest Ready'
  | 'Spoiled';

export type GreenhouseActionId =
  | 'maintain-equipment'
  | 'allocate-power'
  | 'repair-irrigation'
  | 'harvest-crops'
  | 'reseed-crops';

export interface GreenhouseActionFeedback {
  actionId: GreenhouseActionId;
  title: string;
  explanation: string;
  deltas: {
    lifeSupport: number;
    power: number;
    radiationProtection: number;
    foodReserves: number;
    greenhouseHealth: number;
    waterAvailability: number;
    cropGrowthProgress: number;
  };
}

export interface GreenhouseState {
  health: number; // 0 - 100
  waterAvailability: number; // 0 - 100
  cropGrowthProgress: number; // 0 - 100 (100 = Harvest Ready)
  cropGrowthStage: CropGrowthStage;
  powerConsumption: 'Low' | 'Standard' | 'Boosted';
  irrigationStatus: 'Flowing' | 'Low Pressure' | 'Clogged';
  harvestReadiness: boolean;
  lowPowerStreak: number;
  cropsSpoiled: boolean;
  actionsUsedThisSol: GreenhouseActionId[];
  lastActionFeedback: GreenhouseActionFeedback | null;
}

export interface EnvironmentState {
  weatherCondition:
    | 'Clear Martian Sky'
    | 'Dust Haze'
    | 'Regional Dust Storm'
    | 'Solar Conjunction Window'
    | 'Solar Particle Advisory';
  localTempCelsius: number;
  dustOpacityNote: string;
}

export type PowerActionId = 'toggle-power-saving' | 'clean-solar-panels';

export interface PowerOperationsState {
  dustAccumulation: number; // 0 - 100
  stormSeverity: 'Clear' | 'Light Dust' | 'Regional Storm';
  powerSavingMode: boolean;
  actionsUsedThisSol: PowerActionId[];
  lastActionFeedback: {
    title: string;
    explanation: string;
  } | null;
}

export type ShelterActionId =
  | 'enter-shelter'
  | 'exit-shelter'
  | 'reinforce-shelter';

export interface RadiationShelterState {
  shelterReadiness: number; // 0 - 100
  crewSheltered: boolean;
  shieldingMaterials: string[];
  radiationAlert: 'Background GCR' | 'SPE Advisory' | 'SPE Warning';
  radiationLeakActive: boolean;
  cumulativeDoseMSv: number;
  actionsUsedThisSol: ShelterActionId[];
  lastActionFeedback: {
    title: string;
    explanation: string;
  } | null;
}

export interface DetailedEarthReport {
  sol: number;
  problemDetected: string;
  actionsTaken: string;
  remainingResources: string;
  crewCondition: string;
  assistanceRequired: string;
}

export interface CommunicationSystemState {
  oneWayDelayMinutes: number; // 3 - 22 minutes simulated orbital distance
  conjunctionActive: boolean;
  reportsSent: DetailedEarthReport[];
  adviceReceivedCount: number;
}

export interface AdvisorRecommendation {
  domain:
    | 'Communication'
    | 'Power'
    | 'Radiation'
    | 'Habitat'
    | 'Greenhouse'
    | 'Life Support';
  status: 'Strength' | 'Improvement';
  message: string;
  nasaContext?: {
    sourceLabel: 'Live NASA Data' | 'Cached NASA Data' | 'Archived NASA Data';
    observationTitle: string;
    detail: string;
  };
  researchNote?: {
    agency: string;
    dataType: 'Historical Research' | 'Terrain Information' | 'Educational Material';
    title: string;
    detail: string;
    sourceUrl?: string;
  };
}

export interface MissionScoreBreakdown {
  lifeSupportScore: number; // max 30
  powerScore: number; // max 25
  radiationScore: number; // max 25
  decisionMakingScore: number; // max 20
  totalScore: number; // max 100
  lostPointsNotes: string[];
}

export type LandingSiteId = 'jezero-floor' | 'neretva-delta' | 'crater-rim';

export type SpaceWeatherMode = 'standard' | 'live-nasa';

export interface MissionReport {
  outcome: 'success' | 'failure';
  title: string;
  summary: string;
  solsSurvived: number;
  maxSols: number;
  missionSeed: number;
  landingSiteName: string;
  spaceWeatherMode: SpaceWeatherMode;
  crewAlive: number;
  crewTotal: number;
  cumulativeDoseMSv: number;
  finalResources: {
    lifeSupport: number;
    power: number;
    radiationProtection: number;
  };
  averageScore: number;
  scoreBreakdown: MissionScoreBreakdown;
  advisorRecommendations: AdvisorRecommendation[];
  history: SolHistoryPoint[];
  decisions: DecisionRecord[];
  lessonsLearned: string[];
  failedSystem: string | null;
}

export interface GameState {
  missionConfig: {
    planet: 'Mars';
    outpostName: string;
    maxSols: number;
    crewCount: number;
    outpostType: string;
    landingSite?: LandingSiteId;
    spaceWeatherMode?: SpaceWeatherMode;
    liveSpaceWeatherLabel?: string;
  };
  missionSeed: number;
  phase: MissionPhase;
  currentSol: number;
  isPaused: boolean;
  isProcessingAction: boolean;
  resources: ResourceState;
  greenhouse: GreenhouseState;
  environment: EnvironmentState;
  powerOps: PowerOperationsState;
  radiationShelter: RadiationShelterState;
  commSystem: CommunicationSystemState;
  crew: CrewState;
  activeEvent: MissionEvent | null;
  lastDecision: DecisionRecord | null;
  lastSolSummary: SolSummaryData | null;
  history: SolHistoryPoint[];
  decisionHistory: DecisionRecord[];
  usedEventIds: string[];
  commAdviceUsedForCurrentEvent: boolean;
  failureReason: string | null;
}
