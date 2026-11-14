import {
  getNasaApiKey,
  readNasaCache,
  sanitizeSafeHttpUrl,
  writeNasaCache,
} from './nasaCache';

export type NasaDataSource = 'live' | 'cached' | 'archived';

export interface SolarFlareRecord {
  id: string;
  beginTime: string;
  peakTime: string | null;
  classType: string;
  activeRegionNum: number | null;
  sourceLocation: string | null;
  link: string | null;
  instruments: string[];
}

export interface DonkiFetchResult {
  source: NasaDataSource;
  records: SolarFlareRecord[];
  statusMessage: string;
  fetchedAtIso: string;
  queryWindowLabel: string;
}

export interface CoronalMassEjectionRecord {
  id: string;
  startTime: string;
  sourceLocation: string | null;
  activeRegionNum: number | null;
  speedKmS: number | null;
  cmeType: string | null;
  halfAngleDeg: number | null;
  note: string;
  link: string | null;
  instruments: string[];
}

export interface DonkiCmeFetchResult {
  source: NasaDataSource;
  records: CoronalMassEjectionRecord[];
  statusMessage: string;
  fetchedAtIso: string;
  queryWindowLabel: string;
}

export interface DonkiRadiationContext {
  source: NasaDataSource;
  sourceLabel: 'Live NASA Data' | 'Cached NASA Data' | 'Archived NASA Data';
  latestFlare: SolarFlareRecord;
  latestCme: CoronalMassEjectionRecord;
  headline: string;
  scientificContext: string;
}

export interface DonkiFetchOptions {
  forceRefresh?: boolean;
}

const DONKI_CACHE_TTL_MS = 15 * 60 * 1000;

export const ARCHIVED_SOLAR_FLARE_DATASET: SolarFlareRecord[] = [
  {
    id: 'ARCH-2024-05-14-X8.7',
    beginTime: '2024-05-14T16:46Z',
    peakTime: '2024-05-14T16:51Z',
    classType: 'X8.7',
    activeRegionNum: 13664,
    sourceLocation: 'S18W89',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/30881/-1',
    instruments: ['GOES-P: EXIS 1.0-8.0'],
  },
  {
    id: 'ARCH-2024-05-11-X5.8',
    beginTime: '2024-05-11T01:10Z',
    peakTime: '2024-05-11T01:23Z',
    classType: 'X5.8',
    activeRegionNum: 13664,
    sourceLocation: 'S17W63',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/30750/-1',
    instruments: ['GOES-P: EXIS 1.0-8.0'],
  },
  {
    id: 'ARCH-2024-10-03-X9.0',
    beginTime: '2024-10-03T12:08Z',
    peakTime: '2024-10-03T12:18Z',
    classType: 'X9.0',
    activeRegionNum: 13842,
    sourceLocation: 'S17W02',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/33754/-1',
    instruments: ['GOES-P: EXIS 1.0-8.0'],
  },
  {
    id: 'ARCH-2024-08-14-X1.1',
    beginTime: '2024-08-14T06:28Z',
    peakTime: '2024-08-14T06:40Z',
    classType: 'X1.1',
    activeRegionNum: 13784,
    sourceLocation: 'N12E25',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/32578/-1',
    instruments: ['GOES-P: EXIS 1.0-8.0'],
  },
  {
    id: 'ARCH-2024-07-29-M9.4',
    beginTime: '2024-07-29T02:27Z',
    peakTime: '2024-07-29T02:37Z',
    classType: 'M9.4',
    activeRegionNum: 13766,
    sourceLocation: 'S14W09',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/FLR/32194/-1',
    instruments: ['GOES-P: EXIS 1.0-8.0'],
  },
];

export const ARCHIVED_CME_DATASET: CoronalMassEjectionRecord[] = [
  {
    id: 'ARCH-2024-05-14-CME-001',
    startTime: '2024-05-14T17:00Z',
    sourceLocation: 'S18W89',
    activeRegionNum: 13664,
    speedKmS: 1240,
    cmeType: 'O',
    halfAngleDeg: 45,
    note: 'Fast coronal mass ejection associated with Active Region 13664; tracked by coronagraphs across the inner solar system.',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/30885/-1',
    instruments: ['SOHO: LASCO/C2', 'SOHO: LASCO/C3'],
  },
  {
    id: 'ARCH-2024-05-11-CME-002',
    startTime: '2024-05-11T01:36Z',
    sourceLocation: 'S17W63',
    activeRegionNum: 13664,
    speedKmS: 1480,
    cmeType: 'O',
    halfAngleDeg: 52,
    note: 'Wide-angle energetic CME launched during May 2024 solar storm sequence; demonstrates how solar eruptions sweep past planetary orbits.',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/30754/-1',
    instruments: ['SOHO: LASCO/C2', 'STEREO-A: SECCHI/COR2'],
  },
  {
    id: 'ARCH-2024-10-03-CME-003',
    startTime: '2024-10-03T12:24Z',
    sourceLocation: 'S17W02',
    activeRegionNum: 13842,
    speedKmS: 920,
    cmeType: 'C',
    halfAngleDeg: 38,
    note: 'Moderate-fast Earth-directed CME following the X9.0 solar flare.',
    link: 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/view/CME/33758/-1',
    instruments: ['SOHO: LASCO/C2'],
  },
];

export const UNAVAILABLE_FALLBACK_MESSAGE =
  'NASA live data is temporarily unavailable. Showing archived educational information.';

function formatUtcDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isValidFlareItem(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return (
    typeof obj.beginTime === 'string' &&
    obj.beginTime.length >= 10 &&
    typeof obj.classType === 'string' &&
    obj.classType.trim().length > 0
  );
}

function isValidCmeItem(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') return false;
  const obj = item as Record<string, unknown>;
  return typeof obj.startTime === 'string' && obj.startTime.length >= 10;
}

export function describeFlareClass(classType: string): {
  tier: string;
  explanation: string;
  accentColor: string;
} {
  const upper = classType.trim().toUpperCase();
  if (upper.startsWith('X')) {
    return {
      tier: 'Major X-Class Flare',
      explanation:
        'Strongest flare tier—can trigger radio blackouts and solar radiation warnings when aimed at a planet.',
      accentColor: '#E4774E',
    };
  }
  if (upper.startsWith('M')) {
    return {
      tier: 'Moderate M-Class Flare',
      explanation:
        'Medium solar flare that can cause brief radio noise and space-weather watches.',
      accentColor: '#FFB547',
    };
  }
  return {
    tier: 'Minor C/B-Class Flare',
    explanation:
      'Small everyday flare with little impact on shielded crews.',
    accentColor: '#29B6F6',
  };
}

export function describeCmeSpeed(speedKmS: number | null): {
  tier: string;
  explanation: string;
  accentColor: string;
} {
  if (speedKmS === null || !Number.isFinite(speedKmS)) {
    return {
      tier: 'Tracked CME',
      explanation:
        'A cloud of magnetized solar plasma tracked as it leaves the Sun.',
      accentColor: '#29B6F6',
    };
  }
  if (speedKmS >= 1200) {
    return {
      tier: `Fast CME (${Math.round(speedKmS)} km/s)`,
      explanation:
        'Very fast plasma cloud that can push energetic radiation particles across the solar system.',
      accentColor: '#E4774E',
    };
  }
  if (speedKmS >= 700) {
    return {
      tier: `Moderate CME (${Math.round(speedKmS)} km/s)`,
      explanation:
        'Medium-speed solar cloud—forecasters check its path to see if it heads toward Mars.',
      accentColor: '#FFB547',
    };
  }
  return {
    tier: `Slow CME (${Math.round(speedKmS)} km/s)`,
    explanation:
      'Gentle solar cloud moving near normal solar wind speed with low storm risk.',
    accentColor: '#29B6F6',
  };
}

function extractInstruments(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((inst) =>
      inst &&
      typeof inst === 'object' &&
      'displayName' in inst &&
      typeof (inst as { displayName?: unknown }).displayName === 'string'
        ? (inst as { displayName: string }).displayName
        : null
    )
    .filter((v): v is string => v !== null);
}

export async function fetchDonkiSolarFlares(
  daysWindow = 30,
  options: DonkiFetchOptions = {}
): Promise<DonkiFetchResult> {
  const cacheKey = `donki_flr_${daysWindow}`;
  if (!options.forceRefresh) {
    const cached = readNasaCache<DonkiFetchResult>(cacheKey, DONKI_CACHE_TTL_MS);
    if (cached && cached.data.records.length > 0) {
      return {
        ...cached.data,
        source: 'cached',
        fetchedAtIso: cached.cachedAtIso,
        statusMessage: `Showing cached NASA DONKI solar flare data from ${cached.cachedAtIso.slice(0, 10)}.`,
      };
    }
  }

  const apiKey = getNasaApiKey();
  const now = new Date();
  const startDateObj = new Date(
    now.getTime() - daysWindow * 24 * 60 * 60 * 1000
  );

  const startDate = formatUtcDate(startDateObj);
  const endDate = formatUtcDate(now);
  const queryWindowLabel = `${startDate} to ${endDate} (UTC)`;

  const url = new URL('https://api.nasa.gov/DONKI/FLR');
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (response.status === 429 || !response.ok) {
      return {
        source: 'archived',
        records: ARCHIVED_SOLAR_FLARE_DATASET,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryWindowLabel: 'Archived NASA DONKI reference events (2024)',
      };
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return {
        source: 'archived',
        records: ARCHIVED_SOLAR_FLARE_DATASET,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryWindowLabel: 'Archived NASA DONKI reference events (2024)',
      };
    }

    const validatedRecords: SolarFlareRecord[] = payload
      .filter(isValidFlareItem)
      .map((item, idx) => ({
        id:
          typeof item.flrID === 'string' && item.flrID
            ? item.flrID
            : `FLR-${idx}-${item.beginTime}`,
        beginTime: item.beginTime as string,
        peakTime: typeof item.peakTime === 'string' ? item.peakTime : null,
        classType: (item.classType as string).trim(),
        activeRegionNum:
          typeof item.activeRegionNum === 'number' ? item.activeRegionNum : null,
        sourceLocation:
          typeof item.sourceLocation === 'string' && item.sourceLocation.trim()
            ? item.sourceLocation.trim()
            : null,
        link: sanitizeSafeHttpUrl(item.link),
        instruments: extractInstruments(item.instruments),
      }))
      .sort((a, b) => b.beginTime.localeCompare(a.beginTime))
      .slice(0, 8);

    if (validatedRecords.length === 0) {
      return {
        source: 'archived',
        records: ARCHIVED_SOLAR_FLARE_DATASET,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryWindowLabel: 'Archived NASA DONKI reference events (2024)',
      };
    }

    const liveResult: DonkiFetchResult = {
      source: 'live',
      records: validatedRecords,
      statusMessage: `Retrieved ${validatedRecords.length} verified solar flare event(s) from NASA DONKI.`,
      fetchedAtIso: new Date().toISOString(),
      queryWindowLabel,
    };
    writeNasaCache(cacheKey, liveResult);
    return liveResult;
  } catch {
    return {
      source: 'archived',
      records: ARCHIVED_SOLAR_FLARE_DATASET,
      statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
      fetchedAtIso: new Date().toISOString(),
      queryWindowLabel: 'Archived NASA DONKI reference events (2024)',
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function fetchDonkiCmes(
  daysWindow = 30,
  options: DonkiFetchOptions = {}
): Promise<DonkiCmeFetchResult> {
  const cacheKey = `donki_cme_${daysWindow}`;
  if (!options.forceRefresh) {
    const cached = readNasaCache<DonkiCmeFetchResult>(cacheKey, DONKI_CACHE_TTL_MS);
    if (cached && cached.data.records.length > 0) {
      return {
        ...cached.data,
        source: 'cached',
        fetchedAtIso: cached.cachedAtIso,
        statusMessage: `Showing cached NASA DONKI CME observations from ${cached.cachedAtIso.slice(0, 10)}.`,
      };
    }
  }

  const apiKey = getNasaApiKey();
  const now = new Date();
  const startDateObj = new Date(
    now.getTime() - daysWindow * 24 * 60 * 60 * 1000
  );

  const startDate = formatUtcDate(startDateObj);
  const endDate = formatUtcDate(now);
  const queryWindowLabel = `${startDate} to ${endDate} (UTC)`;

  const url = new URL('https://api.nasa.gov/DONKI/CME');
  url.searchParams.set('startDate', startDate);
  url.searchParams.set('endDate', endDate);
  url.searchParams.set('api_key', apiKey);

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (response.status === 429 || !response.ok) {
      return {
        source: 'archived',
        records: ARCHIVED_CME_DATASET,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryWindowLabel: 'Archived NASA DONKI CME reference events (2024)',
      };
    }

    const payload: unknown = await response.json();
    if (!Array.isArray(payload)) {
      return {
        source: 'archived',
        records: ARCHIVED_CME_DATASET,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryWindowLabel: 'Archived NASA DONKI CME reference events (2024)',
      };
    }

    const validatedRecords: CoronalMassEjectionRecord[] = payload
      .filter(isValidCmeItem)
      .map((item, idx) => {
        const analyses = Array.isArray(item.cmeAnalyses)
          ? (item.cmeAnalyses as Record<string, unknown>[])
          : [];
        const primaryAnalysis =
          analyses.find((a) => a && a.isMostAccurate === true) ?? analyses[0];

        const speedKmS =
          primaryAnalysis && typeof primaryAnalysis.speed === 'number'
            ? primaryAnalysis.speed
            : null;
        const cmeType =
          primaryAnalysis && typeof primaryAnalysis.type === 'string'
            ? primaryAnalysis.type
            : null;
        const halfAngleDeg =
          primaryAnalysis && typeof primaryAnalysis.halfAngle === 'number'
            ? primaryAnalysis.halfAngle
            : null;

        return {
          id:
            typeof item.activityID === 'string' && item.activityID
              ? item.activityID
              : `CME-${idx}-${item.startTime}`,
          startTime: item.startTime as string,
          sourceLocation:
            typeof item.sourceLocation === 'string' && item.sourceLocation.trim()
              ? item.sourceLocation.trim()
              : null,
          activeRegionNum:
            typeof item.activeRegionNum === 'number' ? item.activeRegionNum : null,
          speedKmS,
          cmeType,
          halfAngleDeg,
          note:
            typeof item.note === 'string' && item.note.trim()
              ? item.note.trim().slice(0, 260)
              : 'Tracked coronal mass ejection recorded in NASA DONKI space weather catalog.',
          link: sanitizeSafeHttpUrl(item.link),
          instruments: extractInstruments(item.instruments),
        };
      })
      .sort((a, b) => b.startTime.localeCompare(a.startTime))
      .slice(0, 8);

    if (validatedRecords.length === 0) {
      return {
        source: 'archived',
        records: ARCHIVED_CME_DATASET,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryWindowLabel: 'Archived NASA DONKI CME reference events (2024)',
      };
    }

    const liveResult: DonkiCmeFetchResult = {
      source: 'live',
      records: validatedRecords,
      statusMessage: `Retrieved ${validatedRecords.length} verified CME event(s) from NASA DONKI.`,
      fetchedAtIso: new Date().toISOString(),
      queryWindowLabel,
    };
    writeNasaCache(cacheKey, liveResult);
    return liveResult;
  } catch {
    return {
      source: 'archived',
      records: ARCHIVED_CME_DATASET,
      statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
      fetchedAtIso: new Date().toISOString(),
      queryWindowLabel: 'Archived NASA DONKI CME reference events (2024)',
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export function getDonkiRadiationContext(): DonkiRadiationContext {
  const cachedFlr =
    readNasaCache<DonkiFetchResult>('donki_flr_30', DONKI_CACHE_TTL_MS) ??
    readNasaCache<DonkiFetchResult>('donki_flr_90', DONKI_CACHE_TTL_MS);
  const cachedCme =
    readNasaCache<DonkiCmeFetchResult>('donki_cme_30', DONKI_CACHE_TTL_MS) ??
    readNasaCache<DonkiCmeFetchResult>('donki_cme_90', DONKI_CACHE_TTL_MS);

  const hasCached =
    (cachedFlr && cachedFlr.data.records.length > 0) ||
    (cachedCme && cachedCme.data.records.length > 0);

  const latestFlare =
    cachedFlr?.data.records[0] ?? ARCHIVED_SOLAR_FLARE_DATASET[0];
  const latestCme = cachedCme?.data.records[0] ?? ARCHIVED_CME_DATASET[0];

  const source: NasaDataSource = hasCached ? 'cached' : 'archived';
  const sourceLabel = hasCached ? 'Cached NASA Data' : 'Archived NASA Data';

  const speedText =
    latestCme.speedKmS !== null ? `${Math.round(latestCme.speedKmS)} km/s` : 'tracked';

  return {
    source,
    sourceLabel,
    latestFlare,
    latestCme,
    headline: `NASA DONKI Reference: Class ${latestFlare.classType} Flare & ${speedText} CME`,
    scientificContext: `Real space weather—like Class ${latestFlare.classType} flares and ${speedText} CMEs—shows why crews watch the Sun. Not every storm hits Mars, yet particle bursts require shelter behind water walls.`,
  };
}
