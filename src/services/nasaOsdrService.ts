import { readNasaCache, sanitizeSafeHttpUrl, writeNasaCache } from './nasaCache';
import { NasaDataSource } from './nasaDonkiService';

export type OsdrHealthDomain = 'bone' | 'muscle' | 'immune' | 'sleep';

export interface OsdrStudyRecord {
  accession: string;
  domain: OsdrHealthDomain;
  domainLabel: string;
  title: string;
  organism: string;
  experimentalContext: string;
  managingCenter: string;
  keyFindingSummary: string;
  outpostConnection: string;
  studyUrl: string;
}

export interface OsdrFetchResult {
  source: NasaDataSource;
  studies: OsdrStudyRecord[];
  statusMessage: string;
  fetchedAtIso: string;
}

const OSDR_CACHE_TTL_MS = 60 * 60 * 1000;
const OSDR_FETCH_TIMEOUT_MS = 4500;
let inFlightOsdrPromise: Promise<OsdrFetchResult> | null = null;

export const ARCHIVED_OSDR_STUDIES: OsdrStudyRecord[] = [
  {
    accession: 'OSD-352',
    domain: 'bone',
    domainLabel: 'Bone Health',
    title: 'Rodent Research-3 (RR-3): Bone Density in Space',
    organism: 'Mus musculus (ISS & ground-control study)',
    experimentalContext:
      'Orbital ISS microgravity experiment studying bone strength compared with Earth ground controls.',
    managingCenter: 'NASA Ames Research Center',
    keyFindingSummary:
      'Weightless spaceflight weakens weight-bearing bones, showing why daily exercise matters.',
    outpostConnection:
      'Mars has 38% Earth gravity, so crews need exercise and vitamin-rich menus to stay strong.',
    studyUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-352',
  },
  {
    accession: 'OSD-47',
    domain: 'muscle',
    domainLabel: 'Muscle Changes',
    title: 'Rodent Research-1 (RR-1): Muscle Changes in Space',
    organism: 'Mus musculus (ISS SpaceX-4 flight study)',
    experimentalContext:
      'ISS flight study comparing spaceflight muscle tissue against ground-control habitats.',
    managingCenter: 'NASA Ames Research Center',
    keyFindingSummary:
      'Muscles lose strength when they do not lift weight every day in space.',
    outpostConnection:
      'Protects astronaut stamina for spacewalk repairs by balancing rest, food, and workouts.',
    studyUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-47',
  },
  {
    accession: 'OSD-738',
    domain: 'immune',
    domainLabel: 'Immune Response',
    title: 'Spaceflight Stress & Immune System Signaling',
    organism: 'Mus musculus (Spaceflight stressor study)',
    experimentalContext:
      'NASA OSDR study checking how confinement, radiation, and unloading affect immune cells.',
    managingCenter: 'NASA OSDR',
    keyFindingSummary:
      'Spaceflight stress changes immune signaling, making clean air and water extra important.',
    outpostConnection:
      'Scrubbing CO2, filtering dust, and using storm shelters protect crew immunity.',
    studyUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-738',
  },
  {
    accession: 'OSD-253',
    domain: 'sleep',
    domainLabel: 'Sleep & Circadian Rhythm',
    title: 'Rodent Research-7 (RR-7): Sleep & Body Clocks',
    organism: 'Mus musculus (ISS SpaceX-15 study)',
    experimentalContext:
      'ISS experiment tracking sleep-wake cycles and gut health using extended cabin video.',
    managingCenter: 'NASA Ames Research Center',
    keyFindingSummary:
      'Changing light schedules and busy missions disrupt sleep clocks and focus.',
    outpostConnection:
      'A Martian Sol is 24h 39m, so steady indoor lighting and rest keep crews sharp.',
    studyUrl: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-253',
  },
];

const DOMAIN_QUERY_TERMS: Record<OsdrHealthDomain, string> = {
  bone: 'OSD-352',
  muscle: 'OSD-47',
  immune: 'OSD-738',
  sleep: 'OSD-253',
};

function matchesStudyAccession(
  source: Record<string, unknown>,
  expectedAccession: string
): boolean {
  const acc =
    typeof source.Accession === 'string' ? source.Accession.trim().toUpperCase() : '';
  return acc === expectedAccession.toUpperCase();
}

export async function fetchOsdrStudyCatalog(
  options: { forceRefresh?: boolean } = {}
): Promise<OsdrFetchResult> {
  const cacheKey = 'nasa_osdr_curated_v1';
  if (!options.forceRefresh) {
    const cached = readNasaCache<OsdrFetchResult>(cacheKey, OSDR_CACHE_TTL_MS);
    if (cached && cached.data.studies.length === ARCHIVED_OSDR_STUDIES.length) {
      return {
        ...cached.data,
        source: 'cached',
        fetchedAtIso: cached.cachedAtIso,
        statusMessage: `Showing cached NASA OSDR study metadata verified on ${cached.cachedAtIso.slice(0, 10)}.`,
      };
    }
  }

  if (!options.forceRefresh && inFlightOsdrPromise) {
    return inFlightOsdrPromise;
  }

  const runFetch = async (): Promise<OsdrFetchResult> => {
    const controller = new AbortController();
    const timeoutId = globalThis.setTimeout(
      () => controller.abort(),
      OSDR_FETCH_TIMEOUT_MS
    );

    try {
    const domains: OsdrHealthDomain[] = ['bone', 'muscle', 'immune', 'sleep'];
    const responses = await Promise.all(
      domains.map(async (domain) => {
        const accession = DOMAIN_QUERY_TERMS[domain];
        const url = new URL('https://osdr.nasa.gov/osdr/data/search');
        url.searchParams.set('term', accession);
        url.searchParams.set('from', '0');
        url.searchParams.set('size', '3');
        url.searchParams.set('type', 'cgene');

        const res = await fetch(url.toString(), {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!res.ok) {
          throw new Error(`OSDR HTTP ${res.status}`);
        }
        const json = (await res.json()) as {
          hits?: { hits?: Array<{ _source?: Record<string, unknown> }> };
        };
        const hitList = json?.hits?.hits;
        if (!Array.isArray(hitList)) {
          return null;
        }
        const matched = hitList.find(
          (h) => h?._source && matchesStudyAccession(h._source, accession)
        )?._source;
        return { domain, sourceDoc: matched ?? null };
      })
    );

    const anyMatched = responses.some((r) => r && r.sourceDoc !== null);
    if (!anyMatched) {
      return {
        source: 'archived',
        studies: ARCHIVED_OSDR_STUDIES,
        statusMessage:
          'From saved data (NASA OSDR live search unavailable).',
        fetchedAtIso: new Date().toISOString(),
      };
    }

    const enrichedStudies: OsdrStudyRecord[] = ARCHIVED_OSDR_STUDIES.map((base) => {
      const found = responses.find((r) => r?.domain === base.domain)?.sourceDoc;
      if (!found) return base;

      const liveTitle =
        typeof found['Study Title'] === 'string' && found['Study Title'].trim()
          ? found['Study Title'].trim()
          : base.title;
      const liveCenter =
        typeof found['Managing NASA Center'] === 'string' &&
        found['Managing NASA Center'].trim()
          ? found['Managing NASA Center'].trim()
          : base.managingCenter;
      const liveOrganism = Array.isArray(found.Organism)
        ? found.Organism.filter((o): o is string => typeof o === 'string').join(', ')
        : typeof found.Organism === 'string'
          ? found.Organism
          : base.organism;
      const safeStudyUrl =
        sanitizeSafeHttpUrl(
          `https://osdr.nasa.gov/bio/repo/data/studies/${base.accession}`
        ) ?? base.studyUrl;

      return {
        ...base,
        title: liveTitle,
        managingCenter: liveCenter,
        organism: liveOrganism || base.organism,
        studyUrl: safeStudyUrl,
      };
    });

    const liveResult: OsdrFetchResult = {
      source: 'live',
      studies: enrichedStudies,
      statusMessage: `Verified ${enrichedStudies.length} space-biology study records against NASA OSDR.`,
      fetchedAtIso: new Date().toISOString(),
    };
    writeNasaCache(cacheKey, liveResult);
    return liveResult;
  } catch {
    return {
      source: 'archived',
      studies: ARCHIVED_OSDR_STUDIES,
      statusMessage:
        'From saved data (NASA live OSDR metadata unavailable).',
      fetchedAtIso: new Date().toISOString(),
    };
    } finally {
      globalThis.clearTimeout(timeoutId);
    }
  };

  if (options.forceRefresh) {
    return runFetch();
  }
  const pending = runFetch().finally(() => {
    inFlightOsdrPromise = null;
  });
  inFlightOsdrPromise = pending;
  return pending;
}
