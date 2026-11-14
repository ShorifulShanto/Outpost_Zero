import {
  getNasaApiKey,
  readNasaCache,
  sanitizeSafeHttpUrl,
  writeNasaCache,
} from './nasaCache';
import { NasaDataSource, UNAVAILABLE_FALLBACK_MESSAGE } from './nasaDonkiService';

export interface ApodRecord {
  date: string;
  title: string;
  explanation: string;
  fullExplanation?: string;
  mediaType: 'image' | 'video';
  url: string | null;
  hdUrl: string | null;
  copyright: string | null;
}

export interface ApodFetchResult {
  source: NasaDataSource;
  record: ApodRecord;
  statusMessage: string;
  fetchedAtIso: string;
}

export type MarsMissionFilter = 'all' | 'Perseverance' | 'Curiosity' | 'Mars';

export interface NasaImageItem {
  nasaId: string;
  title: string;
  description: string;
  fullDescription?: string;
  dateCreated: string;
  center: string | null;
  keywords: string[];
  imageUrl: string | null;
  missionTag: 'Perseverance' | 'Curiosity' | 'Mars Exploration';
}

export interface NasaImageLibraryResult {
  source: NasaDataSource;
  items: NasaImageItem[];
  statusMessage: string;
  fetchedAtIso: string;
  queryLabel: string;
}

export interface FeaturedMarsPhoto {
  imageUrl: string | null;
  isLiveNasa: boolean;
  source: NasaDataSource;
  title: string;
  caption: string;
  fullDescription: string;
  nasaId: string;
  dateCreated?: string;
  missionTag?: string;
}

const APOD_CACHE_TTL_MS = 30 * 60 * 1000;
const IMAGES_CACHE_TTL_MS = 30 * 60 * 1000;

export function toOneSentence(rawText: string, maxChars = 150): string {
  const cleaned = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  const match = cleaned.match(/^.*?[.!?](?=\s|$)/);
  const first = match ? match[0].trim() : cleaned;
  if (first.length <= maxChars) {
    return first;
  }
  const clipped = first.slice(0, maxChars - 1).replace(/\s+\S*$/, '');
  return `${clipped}…`;
}

export function cleanNasaDescription(rawText: string, maxChars = 650): string {
  const cleaned = rawText.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  if (cleaned.length <= maxChars) return cleaned;
  const clipped = cleaned.slice(0, maxChars - 1).replace(/\s+\S*$/, '');
  return `${clipped}…`;
}

export const ARCHIVED_APOD_FALLBACK: ApodRecord = {
  date: '2024-05-14',
  title: 'Mars Horizon & Thin CO2 Sky',
  explanation:
    'Mars has a thin, dusty carbon-dioxide sky that scatters warm amber light near the horizon.',
  fullExplanation:
    'Mars has a thin, dusty carbon-dioxide sky that scatters warm amber light near the horizon. Unlike Earth’s blue daytime sky, fine iron-oxide dust suspended high in the Martian atmosphere gives daytime skies a rusty butterscotch glow and turns sunsets cool blue-gray.',
  mediaType: 'image',
  url: null,
  hdUrl: null,
  copyright: 'Educational Archive Reference',
};

export const ARCHIVED_MARS_GALLERY_FALLBACK: NasaImageItem[] = [
  {
    nasaId: 'PIA25681-ARCHIVED',
    title: 'Perseverance Rover in Jezero Crater',
    description:
      'NASA’s Perseverance rover studies layered rocks in Jezero Crater where ancient rivers once formed a lake.',
    fullDescription:
      'NASA’s Perseverance rover studies layered rocks in Jezero Crater where ancient rivers once formed a lake billions of years ago. Exploring delta sediments helps scientists understand Mars terrain, water history, and safe landing zones for future astronauts.',
    dateCreated: '2023-02-16',
    center: 'JPL',
    keywords: ['Mars', 'Perseverance', 'Jezero Crater'],
    imageUrl: null,
    missionTag: 'Perseverance',
  },
  {
    nasaId: 'PIA25969-ARCHIVED',
    title: 'Curiosity Rover on Mount Sharp',
    description:
      'NASA’s nuclear-powered Curiosity rover climbs Mount Sharp inside Gale Crater to study ancient Martian climate.',
    fullDescription:
      'NASA’s nuclear-powered Curiosity rover climbs Mount Sharp inside Gale Crater to study how Mars changed from a wetter world into a cold desert. Its radiation detector (RAD) also measures surface radiation doses for future human crews.',
    dateCreated: '2023-08-22',
    center: 'JPL',
    keywords: ['Mars', 'Curiosity', 'Gale Crater'],
    imageUrl: null,
    missionTag: 'Curiosity',
  },
  {
    nasaId: 'PIA24924-ARCHIVED',
    title: 'Martian Dust Devils & Thin Air',
    description:
      'Wind lifts fine rusty dust across Mars, dimming sunlight on solar panels over time.',
    fullDescription:
      'Wind lifts fine rusty dust across Mars, dimming sunlight on solar panels over time. Ironically, passing dust devils can also sweep dust off solar arrays—giving robots and habitats a surprise power boost!',
    dateCreated: '2022-04-10',
    center: 'JPL',
    keywords: ['Mars', 'Dust', 'Atmosphere'],
    imageUrl: null,
    missionTag: 'Mars Exploration',
  },
];

function inferMissionTag(
  title: string,
  description: string,
  keywords: string[]
): NasaImageItem['missionTag'] {
  const combined = `${title} ${description} ${keywords.join(' ')}`.toLowerCase();
  if (combined.includes('perseverance') || combined.includes('mars 2020')) {
    return 'Perseverance';
  }
  if (combined.includes('curiosity') || combined.includes('msl')) {
    return 'Curiosity';
  }
  return 'Mars Exploration';
}

export async function fetchNasaApod(
  options: { forceRefresh?: boolean } = {}
): Promise<ApodFetchResult> {
  const cacheKey = 'nasa_apod_latest';
  if (!options.forceRefresh) {
    const cached = readNasaCache<ApodFetchResult>(cacheKey, APOD_CACHE_TTL_MS);
    if (cached) {
      return {
        ...cached.data,
        source: 'cached',
        fetchedAtIso: cached.cachedAtIso,
        statusMessage: `Cached NASA APOD (${cached.cachedAtIso.slice(0, 10)}).`,
      };
    }
  }

  const url = new URL('https://api.nasa.gov/planetary/apod');
  url.searchParams.set('api_key', getNasaApiKey());
  url.searchParams.set('thumbs', 'true');

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
        record: ARCHIVED_APOD_FALLBACK,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
      };
    }

    const payload = (await response.json()) as Record<string, unknown>;
    if (
      !payload ||
      typeof payload !== 'object' ||
      typeof payload.title !== 'string' ||
      typeof payload.explanation !== 'string' ||
      typeof payload.date !== 'string'
    ) {
      return {
        source: 'archived',
        record: ARCHIVED_APOD_FALLBACK,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
      };
    }

    const mediaType: 'image' | 'video' =
      payload.media_type === 'video' ? 'video' : 'image';
    const rawDisplayUrl =
      mediaType === 'video' && typeof payload.thumbnail_url === 'string'
        ? payload.thumbnail_url
        : payload.url;

    const record: ApodRecord = {
      date: payload.date,
      title: payload.title.trim(),
      explanation: toOneSentence(payload.explanation, 190),
      fullExplanation: cleanNasaDescription(payload.explanation, 680),
      mediaType,
      url: sanitizeSafeHttpUrl(rawDisplayUrl ?? payload.url),
      hdUrl: sanitizeSafeHttpUrl(payload.hdurl ?? payload.url),
      copyright:
        typeof payload.copyright === 'string' && payload.copyright.trim()
          ? payload.copyright.trim()
          : null,
    };

    const liveResult: ApodFetchResult = {
      source: 'live',
      record,
      statusMessage: `NASA APOD (${record.date}).`,
      fetchedAtIso: new Date().toISOString(),
    };
    writeNasaCache(cacheKey, liveResult);
    return liveResult;
  } catch {
    return {
      source: 'archived',
      record: ARCHIVED_APOD_FALLBACK,
      statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
      fetchedAtIso: new Date().toISOString(),
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function fetchMarsImageLibrary(
  missionFilter: MarsMissionFilter = 'all',
  options: { forceRefresh?: boolean } = {}
): Promise<NasaImageLibraryResult> {
  const queryMap: Record<MarsMissionFilter, { q: string; label: string }> = {
    all: {
      q: 'Mars Perseverance Curiosity rover surface',
      label: 'Mars Rovers (Perseverance & Curiosity)',
    },
    Perseverance: {
      q: 'Mars Perseverance rover Jezero',
      label: 'Mars 2020 Perseverance Rover',
    },
    Curiosity: {
      q: 'Mars Curiosity rover Gale Crater',
      label: 'Mars Curiosity Rover',
    },
    Mars: {
      q: 'Mars surface terrain atmosphere dust',
      label: 'Mars Surface & Atmosphere',
    },
  };

  const selected = queryMap[missionFilter];
  const cacheKey = `nasa_images_${missionFilter}`;

  if (!options.forceRefresh) {
    const cached = readNasaCache<NasaImageLibraryResult>(
      cacheKey,
      IMAGES_CACHE_TTL_MS
    );
    if (cached && cached.data.items.length > 0) {
      return {
        ...cached.data,
        source: 'cached',
        fetchedAtIso: cached.cachedAtIso,
        statusMessage: `Cached NASA Image Library (${cached.cachedAtIso.slice(0, 10)}).`,
      };
    }
  }

  const url = new URL('https://images-api.nasa.gov/search');
  url.searchParams.set('q', selected.q);
  url.searchParams.set('media_type', 'image');
  url.searchParams.set('page_size', '8');

  const controller = new AbortController();
  const timeoutId = globalThis.setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (response.status === 429 || !response.ok) {
      const filteredFallback =
        missionFilter === 'all'
          ? ARCHIVED_MARS_GALLERY_FALLBACK
          : ARCHIVED_MARS_GALLERY_FALLBACK.filter(
              (item) =>
                missionFilter === 'Mars' || item.missionTag === missionFilter
            );
      return {
        source: 'archived',
        items:
          filteredFallback.length > 0
            ? filteredFallback
            : ARCHIVED_MARS_GALLERY_FALLBACK,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryLabel: selected.label,
      };
    }

    const payload = (await response.json()) as {
      collection?: { items?: unknown[] };
    };
    const rawItems = payload?.collection?.items;
    if (!Array.isArray(rawItems)) {
      return {
        source: 'archived',
        items: ARCHIVED_MARS_GALLERY_FALLBACK,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryLabel: selected.label,
      };
    }

    const validatedItems: NasaImageItem[] = [];
    for (const entry of rawItems) {
      if (!entry || typeof entry !== 'object') continue;
      const itemObj = entry as { data?: unknown[]; links?: unknown[] };
      const meta = Array.isArray(itemObj.data)
        ? (itemObj.data[0] as Record<string, unknown> | undefined)
        : undefined;
      if (!meta || typeof meta.title !== 'string') continue;

      const primaryLink =
        Array.isArray(itemObj.links) &&
        itemObj.links[0] &&
        typeof itemObj.links[0] === 'object' &&
        'href' in itemObj.links[0] &&
        typeof (itemObj.links[0] as { href?: unknown }).href === 'string'
          ? (itemObj.links[0] as { href: string })
          : undefined;

      const fallbackLink = Array.isArray(itemObj.links)
        ? (itemObj.links.find(
            (l) =>
              l &&
              typeof l === 'object' &&
              'href' in l &&
              typeof (l as { href?: unknown }).href === 'string'
          ) as { href?: string } | undefined)
        : undefined;

      const imageUrl = sanitizeSafeHttpUrl(
        primaryLink?.href ?? fallbackLink?.href
      );
      if (!imageUrl) continue;

      const title = meta.title.trim();
      const rawDesc =
        typeof meta.description === 'string' && meta.description.trim()
          ? meta.description.trim()
          : 'Official NASA Mars mission image.';
      const description = toOneSentence(rawDesc, 145);
      const fullDescription = cleanNasaDescription(rawDesc, 650);
      const keywords = Array.isArray(meta.keywords)
        ? meta.keywords.filter((k): k is string => typeof k === 'string').slice(0, 4)
        : [];

      validatedItems.push({
        nasaId:
          typeof meta.nasa_id === 'string' && meta.nasa_id
            ? meta.nasa_id
            : `NASA-IMG-${validatedItems.length}`,
        title,
        description,
        fullDescription,
        dateCreated:
          typeof meta.date_created === 'string'
            ? meta.date_created.slice(0, 10)
            : 'Unknown date',
        center: typeof meta.center === 'string' ? meta.center : null,
        keywords,
        imageUrl,
        missionTag: inferMissionTag(title, description, keywords),
      });

      if (validatedItems.length >= 6) break;
    }

    if (validatedItems.length === 0) {
      return {
        source: 'archived',
        items: ARCHIVED_MARS_GALLERY_FALLBACK,
        statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
        fetchedAtIso: new Date().toISOString(),
        queryLabel: selected.label,
      };
    }

    const liveResult: NasaImageLibraryResult = {
      source: 'live',
      items: validatedItems,
      statusMessage: `Loaded ${validatedItems.length} NASA Mars photo(s).`,
      fetchedAtIso: new Date().toISOString(),
      queryLabel: selected.label,
    };
    writeNasaCache(cacheKey, liveResult);
    return liveResult;
  } catch {
    return {
      source: 'archived',
      items: ARCHIVED_MARS_GALLERY_FALLBACK,
      statusMessage: UNAVAILABLE_FALLBACK_MESSAGE,
      fetchedAtIso: new Date().toISOString(),
      queryLabel: selected.label,
    };
  } finally {
    globalThis.clearTimeout(timeoutId);
  }
}

export async function fetchFeaturedMarsSurfaceDeck(): Promise<FeaturedMarsPhoto[]> {
  const result = await fetchMarsImageLibrary('Mars');
  const liveWithUrls = result.items.filter((item) => Boolean(item.imageUrl));
  if (liveWithUrls.length > 0) {
    return liveWithUrls.map((item) => ({
      imageUrl: item.imageUrl,
      isLiveNasa: true,
      source: result.source,
      title: item.title,
      caption: item.description,
      fullDescription: item.fullDescription ?? item.description,
      nasaId: item.nasaId,
      dateCreated: item.dateCreated,
      missionTag: item.missionTag,
    }));
  }

  return ARCHIVED_MARS_GALLERY_FALLBACK.map((item) => ({
    imageUrl: null,
    isLiveNasa: false,
    source: 'archived' as NasaDataSource,
    title: item.title,
    caption: item.description,
    fullDescription: item.fullDescription ?? item.description,
    nasaId: item.nasaId,
    dateCreated: item.dateCreated,
    missionTag: item.missionTag,
  }));
}

export async function fetchFeaturedMarsSurfacePhoto(): Promise<FeaturedMarsPhoto> {
  const deck = await fetchFeaturedMarsSurfaceDeck();
  const firstLive = deck.find((item) => item.isLiveNasa && Boolean(item.imageUrl));
  if (firstLive) {
    return firstLive;
  }

  return {
    imageUrl: null,
    isLiveNasa: false,
    source: 'archived',
    title: 'Jezero Crater Landing Zone',
    caption: 'Simulated Mars horizon view at dusk while offline.',
    fullDescription:
      'Simulated Mars terrain at Jezero Crater while offline. Real Mars missions face fine rusty dust, steep crater walls, and freezing nights that test solar arrays and habitat seals.',
    nasaId: 'SIM-TERRAIN-FALLBACK',
    dateCreated: 'Simulated Reference',
    missionTag: 'Mars Exploration',
  };
}
