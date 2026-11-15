export type ResearchCategoryType =
  | 'Live Data'
  | 'Historical Research'
  | 'Terrain Information'
  | 'Educational Material';

export interface RadLabBenchmark {
  id: string;
  environment: string;
  missionOrStation: string;
  detector: string;
  absorbedDoseRate: string;
  doseEquivalentRate: string;
  contextNote: string;
  isMarsSurface: boolean;
  sourceUrl: string;
}

export interface MarsTrekSiteProfile {
  siteName: string;
  coordinates: string;
  craterDiameterKm: number;
  floorElevationDatum: string;
  rimReliefMeters: string;
  dataSources: string;
  habitatPlacementNote: string;
  mobilityHazardNote: string;
  missionPlanningNote: string;
  caveat: string;
  portalUrl: string;
}

export interface CsaResourceEntry {
  id: string;
  topic: 'Space Food & CEA' | 'Crew Health & Nutrition' | 'Youth STEM Learning';
  title: string;
  summary: string;
  connectionToOutpost: string;
  caveat: string;
  linkLabel: string;
  url: string;
}

export interface AgencyDirectoryResource {
  id: string;
  name: string;
  agency: 'NASA' | 'CSA';
  categoryType: ResearchCategoryType;
  dataSummary: string;
  scientificScope: string;
  url: string;
  linkLabel: string;
}

export const RADLAB_DOSIMETRY_BENCHMARKS: RadLabBenchmark[] = [
  {
    id: 'iss-tepc',
    environment: 'Low Earth Orbit (ISS)',
    missionOrStation: 'International Space Station',
    detector: 'TEPC',
    absorbedDoseRate: '~0.27 – 0.37 mGy/day',
    doseEquivalentRate: '~0.50 – 1.0+ mSv/day',
    contextNote:
      'Recorded inside Earth’s partial magnetic shield (not direct Mars surface data).',
    isMarsSurface: false,
    sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/',
  },
  {
    id: 'msl-cruise',
    environment: 'Deep Space Transit',
    missionOrStation: 'Curiosity Cruise (Earth to Mars)',
    detector: 'RAD',
    absorbedDoseRate: 'Measured inside spacecraft hull',
    doseEquivalentRate: '~1.84 mSv/day',
    contextNote:
      'Outside Earth’s magnetosphere, spacecraft face unshielded deep-space rays.',
    isMarsSurface: false,
    sourceUrl: 'https://science.nasa.gov/mission/msl-curiosity/',
  },
  {
    id: 'msl-surface',
    environment: 'Mars Surface (Gale Crater)',
    missionOrStation: 'Curiosity Rover',
    detector: 'RAD',
    absorbedDoseRate: '~0.21 – 0.48 mGy/day',
    doseEquivalentRate: '~0.64 – 0.67 mSv/day',
    contextNote:
      'Mars’s thin CO2 air and ground block roughly half of deep-space radiation, though solar storms add spikes.',
    isMarsSurface: true,
    sourceUrl: 'https://visualization.osdr.nasa.gov/radlab/',
  },
];

export const RADLAB_UNITS_EXPLANATION = {
  absorbedDose:
    'Absorbed Dose (mGy): Physical radiation energy absorbed by matter or tissue.',
  doseEquivalent:
    'Dose Equivalent (mSv): Biological risk score adjusted for particle type. Never swap mGy and mSv 1:1.',
  caveat:
    'Outpost Zero’s 0–100% shield meter is a simplified game index.',
};

export const MARS_TREK_JEZERO_PROFILE: MarsTrekSiteProfile = {
  siteName: 'Jezero Crater',
  coordinates: '18.38° N, 77.58° E',
  craterDiameterKm: 45,
  floorElevationDatum: '~2,700 m below Mars datum',
  rimReliefMeters: '~500 – 800+ m rim height',
  dataSources: 'MRO HiRISE / CTX & Mars Express HRSC',
  habitatPlacementNote:
    'Building on the lower Jezero floor (~2,700 m below datum) puts slightly more CO2 air overhead and offers flat ground near the ancient river delta.',
  mobilityHazardNote:
    'Nearby sand dunes, boulders, and steep crater walls can trap rover wheels and drain batteries.',
  missionPlanningNote:
    'Elevation maps help crews check sunlight angles, safe driving routes, and clear radio sightlines.',
  caveat:
    'Jezero Sector inspires Outpost Zero’s map while keeping movement simple for gameplay.',
  portalUrl: 'https://trek.nasa.gov/mars/',
};

export const CSA_RESOURCES: CsaResourceEntry[] = [
  {
    id: 'csa-cea',
    topic: 'Space Food & CEA',
    title: 'Food Production on the Moon & Remote Areas',
    summary:
      'CSA tests compact indoor farms (like Naurvik in Arctic Canada) that grow greens with little water or power.',
    connectionToOutpost:
      'Mirrors our Greenhouse: LED grow lights make fresh food while spending battery power.',
    caveat: 'Earth Arctic and orbital farms are analogies, not Mars greenhouses.',
    linkLabel: 'CSA Eating in Space',
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/eating-in-space.asp',
  },
  {
    id: 'csa-nutrition',
    topic: 'Crew Health & Nutrition',
    title: 'Astronaut Calories & Health',
    summary:
      'Astronaut menus target ~1,900 to 3,200 kcal/day with exercise to keep bones and muscles strong.',
    connectionToOutpost:
      'Packaged meals supply steady energy when power is low, while fresh greens boost nutrition.',
    caveat: 'Calorie targets come from ISS flights; Mars nutrition is still researched.',
    linkLabel: 'CSA Living in Space',
    url: 'https://www.asc-csa.gc.ca/eng/astronauts/living-in-space/',
  },
  {
    id: 'csa-stem',
    topic: 'Youth STEM Learning',
    title: 'CSA Youth & Future of Food',
    summary:
      'Student programs like Future of Food teach plant science, water recycling, and space farming.',
    connectionToOutpost:
      'Links our 10-Sol Greenhouse and Learning Hub to classroom STEM projects.',
    caveat: 'Designed as hands-on student STEM activities.',
    linkLabel: 'CSA Youth & Educators',
    url: 'https://www.asc-csa.gc.ca/eng/youth-educators/',
  },
];

export const OFFICIAL_DATA_SOURCES_DIRECTORY: AgencyDirectoryResource[] = [
  {
    id: 'nasa-open-apis',
    name: 'NASA Open APIs',
    agency: 'NASA',
    categoryType: 'Live Data',
    dataSummary:
      'Supplies daily Astronomy Picture of the Day (APOD) photos and space descriptions.',
    scientificScope: 'Live feed with local caching and offline fallback.',
    url: 'https://api.nasa.gov/',
    linkLabel: 'NASA Open APIs',
  },
  {
    id: 'nasa-donki',
    name: 'NASA DONKI',
    agency: 'NASA',
    categoryType: 'Live Data',
    dataSummary:
      'Tracks real Solar Flares (FLR) and Coronal Mass Ejections (CME) from the Sun.',
    scientificScope: 'Adds real space-weather context without changing game math.',
    url: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/',
    linkLabel: 'NASA DONKI',
  },
  {
    id: 'nasa-osdr',
    name: 'NASA OSDR',
    agency: 'NASA',
    categoryType: 'Historical Research',
    dataSummary:
      'Shares space-biology studies on bone, muscle, immune, and sleep health.',
    scientificScope: 'ISS rodent and lab datasets (not human Mars trials).',
    url: 'https://osdr.nasa.gov/',
    linkLabel: 'NASA OSDR',
  },
  {
    id: 'nasa-radlab',
    name: 'NASA RadLab',
    agency: 'NASA',
    categoryType: 'Historical Research',
    dataSummary:
      'Collects radiation readings from ISS detectors and Curiosity’s RAD sensor on Mars.',
    scientificScope: 'Preserves mGy/day vs. mSv/day units and location context.',
    url: 'https://visualization.osdr.nasa.gov/radlab/',
    linkLabel: 'NASA RadLab',
  },
  {
    id: 'nasa-mars-trek',
    name: 'NASA Mars Trek',
    agency: 'NASA',
    categoryType: 'Terrain Information',
    dataSummary:
      'Maps Mars craters and elevation, including Jezero Crater’s -2,700 m basin floor.',
    scientificScope: 'Guides habitat placement and rover hazard awareness.',
    url: 'https://trek.nasa.gov/mars/',
    linkLabel: 'NASA Mars Trek',
  },
  {
    id: 'nasa-image-library',
    name: 'NASA Image Library',
    agency: 'NASA',
    categoryType: 'Live Data',
    dataSummary:
      'Delivers real Perseverance, Curiosity, and Mars surface photography.',
    scientificScope: 'Live mission images via images-api.nasa.gov/search.',
    url: 'https://images.nasa.gov/',
    linkLabel: 'NASA Image Library',
  },
  {
    id: 'csa-resources',
    name: 'Canadian Space Agency',
    agency: 'CSA',
    categoryType: 'Educational Material',
    dataSummary:
      'Publishes space food menus (1,900–3,200 kcal/day), indoor farming, and youth STEM guides.',
    scientificScope: 'Connects greenhouse power/water trade-offs to crew health.',
    url: 'https://www.asc-csa.gc.ca/eng/youth-educators/',
    linkLabel: 'CSA Youth & Educators',
  },
];

export const SCIENTIFIC_DISCLAIMER =
  'Independent educational simulation—not endorsed or sponsored by NASA or CSA. Real spaceflight numbers stay separate from Outpost Zero’s 0–100% gameplay meters.';
