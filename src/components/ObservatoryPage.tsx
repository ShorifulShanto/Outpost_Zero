import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Camera,
  Compass,
  ExternalLink,
  Image as ImageIcon,
  Maximize2,
  Microscope,
  RefreshCw,
  Shield,
  Sprout,
  Sun,
  Telescope,
} from 'lucide-react';
import {
  CSA_RESOURCES,
  MARS_TREK_JEZERO_PROFILE,
  OFFICIAL_DATA_SOURCES_DIRECTORY,
  RADLAB_DOSIMETRY_BENCHMARKS,
  RADLAB_UNITS_EXPLANATION,
  SCIENTIFIC_DISCLAIMER,
} from '../data/spaceResearchData';
import {
  describeCmeSpeed,
  describeFlareClass,
  DonkiCmeFetchResult,
  DonkiFetchResult,
  fetchDonkiCmes,
  fetchDonkiSolarFlares,
  NasaDataSource,
} from '../services/nasaDonkiService';
import {
  ApodFetchResult,
  FeaturedMarsPhoto,
  fetchMarsImageLibrary,
  fetchNasaApod,
  fetchRealtimeMarsRoverPhotos,
  MarsMissionFilter,
  NasaImageLibraryResult,
  RealtimeMarsFeedResult,
  toOneSentence,
} from '../services/nasaMediaService';
import {
  fetchOsdrStudyCatalog,
  OsdrFetchResult,
  OsdrHealthDomain,
} from '../services/nasaOsdrService';
import { AppRoute } from '../types/mission';
import {
  recordObservatoryVisited,
  recordPhotoInspected,
} from '../utils/explorerProgress';
import {
  CompactWatermarkFooter,
  CornerWatermark,
  MARS_FALLBACK_IMAGE,
} from './DataWatermark';
import { PageBackButton } from './PageBackButton';

const LazyMarsPhotoModal = lazy(() =>
  import('./MarsPhotoModal').then((m) => ({ default: m.MarsPhotoModal }))
);

interface ObservatoryPageProps {
  onNavigate: (route: AppRoute) => void;
  previousRoute?: AppRoute | null;
  onGoBack?: () => void;
}

function SourceBadge({ source }: { source: NasaDataSource }) {
  if (source === 'live') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular font-bold text-[#29B6F6] border border-[#29B6F6] bg-[#080D1B] px-2.5 py-1 rounded">
        LIVE NASA DATA
      </span>
    );
  }
  if (source === 'cached') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular font-semibold text-[#29B6F6] border border-[#293A54] bg-[#080D1B] px-2.5 py-1 rounded">
        CACHED NASA DATA
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-mono-tabular font-semibold text-[#FFB547] border border-[#FFB547]/60 bg-[#080D1B] px-2.5 py-1 rounded">
      FROM SAVED DATA
    </span>
  );
}

function formatUtcTimestamp(rawIso: string): string {
  const parsed = new Date(rawIso);
  if (Number.isNaN(parsed.getTime())) {
    return rawIso;
  }
  return parsed.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface AsyncNasaImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: 'high' | 'low';
  onError?: () => void;
}

function AsyncNasaImage({
  src,
  alt,
  className = '',
  priority = 'low',
  onError,
}: AsyncNasaImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [src]);

  return (
    <div className="relative w-full h-full bg-[#0A1324]">
      {!loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#13223D]/70 animate-pulse"
        />
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={priority === 'high' ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority === 'high' ? 'high' : 'low'}
        referrerPolicy="no-referrer"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setLoaded(true);
          onError?.();
        }}
        className={`${className} transition-opacity duration-200 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export function ObservatoryPage({
  onNavigate,
  previousRoute = null,
  onGoBack,
}: ObservatoryPageProps) {
  const [donkiLoading, setDonkiLoading] = useState(true);
  const [daysWindow, setDaysWindow] = useState<30 | 90>(30);
  const [donkiTab, setDonkiTab] = useState<'flr' | 'cme'>('flr');
  const [flrResult, setFlrResult] = useState<DonkiFetchResult | null>(null);
  const [cmeResult, setCmeResult] = useState<DonkiCmeFetchResult | null>(null);

  const [spotlightTab, setSpotlightTab] = useState<'mars-live' | 'apod'>('mars-live');
  const [realtimeLoading, setRealtimeLoading] = useState(true);
  const [realtimeMarsResult, setRealtimeMarsResult] =
    useState<RealtimeMarsFeedResult | null>(null);
  const [selectedRealtimeIdx, setSelectedRealtimeIdx] = useState(0);
  const [brokenRealtimeIds, setBrokenRealtimeIds] = useState<
    Record<string, boolean>
  >({});

  const [apodDate, setApodDate] = useState<string>('');
  const [apodLoading, setApodLoading] = useState(false);
  const [apodResult, setApodResult] = useState<ApodFetchResult | null>(null);
  const [apodImgError, setApodImgError] = useState(false);

  const [marsImgLoading, setMarsImgLoading] = useState(true);
  const [marsFilter, setMarsFilter] = useState<MarsMissionFilter>('all');
  const [marsImgResult, setMarsImgResult] =
    useState<NasaImageLibraryResult | null>(null);
  const [brokenMarsIds, setBrokenMarsIds] = useState<Record<string, boolean>>({});

  const [osdrLoading, setOsdrLoading] = useState(true);
  const [osdrDomainFilter, setOsdrDomainFilter] = useState<'all' | OsdrHealthDomain>('all');
  const [osdrResult, setOsdrResult] = useState<OsdrFetchResult | null>(null);

  const [photoModalState, setPhotoModalState] = useState<{
    photos: FeaturedMarsPhoto[];
    initialIndex: number;
  } | null>(null);

  const loadDonki = useCallback(
    async (days: 30 | 90, forceRefresh = false) => {
      setDonkiLoading(true);
      const [flr, cme] = await Promise.all([
        fetchDonkiSolarFlares(days, { forceRefresh }),
        fetchDonkiCmes(days, { forceRefresh }),
      ]);
      setFlrResult((prev) =>
        forceRefresh && flr.source === 'archived' && prev && prev.source !== 'archived'
          ? { ...prev, source: 'cached' }
          : flr
      );
      setCmeResult((prev) =>
        forceRefresh && cme.source === 'archived' && prev && prev.source !== 'archived'
          ? { ...prev, source: 'cached' }
          : cme
      );
      setDonkiLoading(false);
    },
    []
  );

  const loadRealtimeMars = useCallback(async (forceRefresh = false) => {
    setRealtimeLoading(true);
    const data = await fetchRealtimeMarsRoverPhotos({ forceRefresh });
    setRealtimeMarsResult((prev) => {
      if (
        forceRefresh &&
        data.source === 'archived' &&
        prev &&
        prev.source !== 'archived'
      ) {
        return { ...prev, source: 'cached' };
      }
      setBrokenRealtimeIds({});
      setSelectedRealtimeIdx(0);
      return data;
    });
    setRealtimeLoading(false);
  }, []);

  const loadApod = useCallback(
    async (forceRefresh = false, targetDate = '') => {
      setApodLoading(true);
      setApodImgError(false);
      const data = await fetchNasaApod({
        forceRefresh,
        date: targetDate || undefined,
      });
      setApodResult((prev) =>
        forceRefresh &&
        !targetDate &&
        data.source === 'archived' &&
        prev &&
        prev.source !== 'archived'
          ? { ...prev, source: 'cached' }
          : data
      );
      setApodLoading(false);
    },
    []
  );

  const loadMarsImages = useCallback(
    async (filter: MarsMissionFilter, forceRefresh = false) => {
      setMarsImgLoading(true);
      const data = await fetchMarsImageLibrary(filter, { forceRefresh });
      setMarsImgResult((prev) => {
        if (
          forceRefresh &&
          data.source === 'archived' &&
          prev &&
          prev.source !== 'archived'
        ) {
          return { ...prev, source: 'cached' };
        }
        setBrokenMarsIds({});
        return data;
      });
      setMarsImgLoading(false);
    },
    []
  );

  const loadOsdr = useCallback(async (forceRefresh = false) => {
    setOsdrLoading(true);
    const data = await fetchOsdrStudyCatalog({ forceRefresh });
    setOsdrResult(data);
    setOsdrLoading(false);
  }, []);

  useEffect(() => {
    void loadDonki(daysWindow);
  }, [daysWindow, loadDonki]);

  useEffect(() => {
    void loadRealtimeMars();
  }, [loadRealtimeMars]);

  useEffect(() => {
    if (spotlightTab === 'apod' && !apodResult && !apodLoading) {
      void loadApod(false, apodDate);
    }
  }, [spotlightTab, apodResult, apodLoading, apodDate, loadApod]);

  useEffect(() => {
    void loadMarsImages(marsFilter);
  }, [marsFilter, loadMarsImages]);

  useEffect(() => {
    void loadOsdr();
    recordObservatoryVisited();
  }, [loadOsdr]);

  const openMarsGalleryModal = (index: number) => {
    if (!marsImgResult || marsImgResult.items.length === 0) return;
    recordPhotoInspected();
    const mapped: FeaturedMarsPhoto[] = marsImgResult.items.map((item) => ({
      imageUrl: item.imageUrl,
      isLiveNasa: Boolean(item.imageUrl),
      source: marsImgResult.source,
      title: item.title,
      caption: item.description,
      fullDescription: item.fullDescription ?? item.description,
      nasaId: item.nasaId,
      dateCreated: item.dateCreated,
      missionTag: item.missionTag,
    }));
    setPhotoModalState({ photos: mapped, initialIndex: index });
  };

  const openRealtimeModal = (index: number) => {
    if (!realtimeMarsResult || realtimeMarsResult.photos.length === 0) return;
    recordPhotoInspected();
    const mapped: FeaturedMarsPhoto[] = realtimeMarsResult.photos.map((photo) => {
      const hasLive = Boolean(photo.imageUrl && !brokenRealtimeIds[photo.id]);
      return {
        imageUrl: hasLive ? photo.hdUrl ?? photo.imageUrl : null,
        isLiveNasa: hasLive,
        source: realtimeMarsResult.source,
        title: photo.title,
        caption: photo.caption,
        fullDescription: photo.fullCaption,
        nasaId: photo.id,
        dateCreated:
          photo.sol !== null ? `Sol ${photo.sol} (${photo.dateTaken})` : photo.dateTaken,
        missionTag: photo.camera,
      };
    });
    setPhotoModalState({ photos: mapped, initialIndex: index });
  };

  const openApodModal = () => {
    if (!apodResult) return;
    recordPhotoInspected();
    const rec = apodResult.record;
    setPhotoModalState({
      photos: [
        {
          imageUrl: usingLiveApodImage ? rec.url ?? rec.hdUrl : null,
          isLiveNasa: usingLiveApodImage,
          source: apodResult.source,
          title: rec.title,
          caption: rec.explanation,
          fullDescription: rec.fullExplanation ?? rec.explanation,
          nasaId: `APOD-${rec.date}`,
          dateCreated: rec.date,
          missionTag: 'NASA APOD',
        },
      ],
      initialIndex: 0,
    });
  };

  const activeDonkiResult = donkiTab === 'flr' ? flrResult : cmeResult;
  const filteredOsdrStudies =
    osdrResult?.studies.filter(
      (s) => osdrDomainFilter === 'all' || s.domain === osdrDomainFilter
    ) ?? [];

  const usingLiveApodImage = Boolean(apodResult?.record.url && !apodImgError);
  const activeRealtimePhotos = realtimeMarsResult?.photos ?? [];
  const activeRealtimePhoto =
    activeRealtimePhotos[selectedRealtimeIdx] ?? activeRealtimePhotos[0] ?? null;
  const usingLiveRealtimeImage = Boolean(
    activeRealtimePhoto?.imageUrl && !brokenRealtimeIds[activeRealtimePhoto.id]
  );

  return (
    <div className="min-h-[calc(100vh-72px)] flex flex-col justify-between">
      <main className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        <div>
          <PageBackButton
            previousRoute={previousRoute}
            onBack={onGoBack ?? (() => onNavigate('home'))}
          />
        </div>
        {/* Clean Header Banner */}
        <section className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-medium text-[#29B6F6]">
              <Telescope className="w-4 h-4" />
              <span>Space Photos, Solar Storms &amp; Science Data</span>
            </div>
            <h1 className="mt-2 font-display text-2xl sm:text-4xl font-bold text-[#EAF2FF] [text-wrap:balance]">
              NASA &amp; Space Observatory
            </h1>
            <p className="mt-2.5 text-sm sm:text-base text-[#A8B6CC] leading-relaxed">
              Browse Mars rover photos, Astronomy Picture of the Day, solar flares,
              and space-biology findings—switching automatically to saved data if live
              feeds are unavailable.
            </p>
          </div>

          <button
            type="button"
            disabled={
              donkiLoading ||
              realtimeLoading ||
              apodLoading ||
              marsImgLoading ||
              osdrLoading
            }
            onClick={() => {
              void loadDonki(daysWindow, true);
              void loadRealtimeMars(true);
              if (spotlightTab === 'apod') {
                void loadApod(true, apodDate);
              }
              void loadMarsImages(marsFilter, true);
              void loadOsdr(true);
            }}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg bg-[#29B6F6] hover:bg-[#4dc4f8] disabled:opacity-60 text-[#080D1B] text-xs sm:text-sm font-semibold transition-colors cursor-pointer self-start lg:self-center shrink-0"
          >
            <RefreshCw
              className={`w-4 h-4 ${
                donkiLoading ||
                realtimeLoading ||
                apodLoading ||
                marsImgLoading ||
                osdrLoading
                  ? 'animate-spin'
                  : ''
              }`}
            />
            <span>Refresh All Feeds</span>
          </button>
        </section>

        {/* 1. REAL-TIME MARS ROVER SURFACE PHOTOS & NASA APOD */}
        <section
          aria-label="Real-Time Mars Surface Photos and Astronomy Picture of the Day"
          className="relative rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-7 space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#293A54]">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-5 h-5 text-[#29B6F6] shrink-0" />
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-[#EAF2FF]">
                  {spotlightTab === 'mars-live'
                    ? 'Real-Time Mars Surface Photos (Perseverance)'
                    : 'Astronomy Picture of the Day (APOD)'}
                </h2>
                <p className="text-xs text-[#A8B6CC]">
                  {spotlightTab === 'mars-live'
                    ? activeRealtimePhoto
                      ? `${activeRealtimePhoto.sol !== null ? `Sol ${activeRealtimePhoto.sol} · ` : ''}${activeRealtimePhoto.dateTaken} · ${activeRealtimePhoto.camera}`
                      : 'Checking latest Mars rover downlink...'
                    : apodResult?.record.date ?? 'Loading date...'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div
                className="inline-flex p-1 rounded-lg bg-[#080D1B] border border-[#293A54]"
                role="tablist"
                aria-label="Featured space photo feed"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={spotlightTab === 'mars-live'}
                  onClick={() => setSpotlightTab('mars-live')}
                  className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    spotlightTab === 'mars-live'
                      ? 'bg-[#1E3353] text-[#29B6F6]'
                      : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                  }`}
                >
                  Live Mars Rover
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={spotlightTab === 'apod'}
                  onClick={() => setSpotlightTab('apod')}
                  className={`min-h-[34px] px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    spotlightTab === 'apod'
                      ? 'bg-[#1E3353] text-[#29B6F6]'
                      : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                  }`}
                >
                  NASA APOD
                </button>
              </div>

              {spotlightTab === 'mars-live' &&
                !realtimeLoading &&
                realtimeMarsResult && (
                  <>
                    <SourceBadge source={realtimeMarsResult.source} />
                    {realtimeMarsResult.source !== 'archived' && (
                      <CornerWatermark label="Data: NASA Mars 2020" />
                    )}
                  </>
                )}

              {spotlightTab === 'apod' && !apodLoading && apodResult && (
                <>
                  <SourceBadge source={apodResult.source} />
                  {apodResult.source !== 'archived' && (
                    <CornerWatermark label="Data: NASA APOD" />
                  )}
                </>
              )}
            </div>
          </div>

          {spotlightTab === 'mars-live' && realtimeLoading && !realtimeMarsResult && (
            <div
              role="status"
              className="rounded-lg bg-[#080D1B] border border-[#293A54] p-6 text-center text-sm text-[#29B6F6]"
            >
              Loading real-time Mars photos from Perseverance Rover...
            </div>
          )}

          {spotlightTab === 'mars-live' && activeRealtimePhoto && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-5 space-y-2.5">
                  <button
                    type="button"
                    onClick={() => openRealtimeModal(selectedRealtimeIdx)}
                    aria-label={`Inspect real-time Mars photo: ${activeRealtimePhoto.title}`}
                    className="relative w-full rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] overflow-hidden group cursor-pointer text-left transition-colors block"
                  >
                    <div className="w-full h-56 overflow-hidden">
                      <AsyncNasaImage
                        priority="high"
                        src={
                          usingLiveRealtimeImage
                            ? activeRealtimePhoto.imageUrl!
                            : MARS_FALLBACK_IMAGE
                        }
                        alt={
                          usingLiveRealtimeImage
                            ? activeRealtimePhoto.title
                            : 'AI-generated Martian landscape fallback while live feed is offline'
                        }
                        onError={() =>
                          setBrokenRealtimeIds((prev) => ({
                            ...prev,
                            [activeRealtimePhoto.id]: true,
                          }))
                        }
                        className="w-full h-56 object-cover block transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-md bg-[#080D1B]/80 border border-[#293A54] text-[#EAF2FF] flex items-center justify-center opacity-85 group-hover:opacity-100">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                    {!usingLiveRealtimeImage && (
                      <div className="absolute bottom-2 right-2">
                        <CornerWatermark label="AI-Generated Image · Saved" />
                      </div>
                    )}
                  </button>

                  {activeRealtimePhotos.length > 1 && (
                    <div
                      className="grid grid-cols-4 gap-2"
                      role="group"
                      aria-label="Latest real-time Mars photos"
                    >
                      {activeRealtimePhotos.map((photo, idx) => {
                        const isSelected = idx === selectedRealtimeIdx;
                        const hasThumb = Boolean(
                          (photo.thumbUrl ?? photo.imageUrl) &&
                            !brokenRealtimeIds[photo.id]
                        );
                        return (
                          <button
                            key={photo.id}
                            type="button"
                            onClick={() => setSelectedRealtimeIdx(idx)}
                            aria-label={`Select Mars photo ${idx + 1}: ${photo.title}`}
                            aria-pressed={isSelected}
                            className={`relative h-14 rounded-md overflow-hidden border transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-[#29B6F6] ring-1 ring-[#29B6F6]'
                                : 'border-[#293A54] hover:border-[#29B6F6]/60 opacity-75 hover:opacity-100'
                            }`}
                          >
                            <AsyncNasaImage
                              src={
                                hasThumb
                                  ? (photo.thumbUrl ?? photo.imageUrl)!
                                  : MARS_FALLBACK_IMAGE
                              }
                              alt={photo.title}
                              onError={() =>
                                setBrokenRealtimeIds((prev) => ({
                                  ...prev,
                                  [photo.id]: true,
                                }))
                              }
                              className="w-full h-full object-cover block"
                            />
                            {photo.sol !== null && (
                              <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-[#080D1B]/85 text-[9px] font-mono-tabular text-[#EAF2FF]">
                                Sol {photo.sol}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="lg:col-span-7 space-y-3 self-center">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#29B6F6]">
                    <span>{activeRealtimePhoto.camera}</span>
                    {activeRealtimePhoto.sol !== null && (
                      <span className="text-[#FFB547]">
                        · Mars Sol {activeRealtimePhoto.sol}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#EAF2FF]">
                    {activeRealtimePhoto.title}
                  </h3>
                  <p className="text-sm text-[#A8B6CC] leading-relaxed">
                    {activeRealtimePhoto.caption}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2.5 border-t border-[#293A54] text-xs text-[#A8B6CC]">
                    <span>Credit: {activeRealtimePhoto.credit}</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => openRealtimeModal(selectedRealtimeIdx)}
                        className="font-medium text-[#EAF2FF] hover:text-[#29B6F6] cursor-pointer"
                      >
                        Inspect Larger
                      </button>
                      {(activeRealtimePhoto.link || activeRealtimePhoto.hdUrl) && (
                        <a
                          href={
                            activeRealtimePhoto.link ?? activeRealtimePhoto.hdUrl!
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
                        >
                          <span>Open NASA Source</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          {spotlightTab === 'apod' && apodLoading && !apodResult && (
            <div
              role="status"
              className="rounded-lg bg-[#080D1B] border border-[#293A54] p-6 text-center text-sm text-[#29B6F6]"
            >
              Loading NASA Astronomy Picture of the Day...
            </div>
          )}

          {spotlightTab === 'apod' && apodResult && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#080D1B] border border-[#293A54] px-3.5 py-2 text-xs">
                <span className="text-[#A8B6CC]">
                  Showing APOD for{' '}
                  <strong className="font-mono-tabular text-[#EAF2FF]">
                    {apodResult.record.date}
                  </strong>
                  {apodResult.source === 'archived' && ' (Saved fallback)'}
                </span>
                <div className="flex items-center gap-2">
                  <label htmlFor="apod-date-picker" className="text-[#A8B6CC]">
                    Check Date:
                  </label>
                  <input
                    id="apod-date-picker"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    min="2015-01-01"
                    value={apodDate}
                    onChange={(e) => {
                      const nextDate = e.target.value;
                      setApodDate(nextDate);
                      void loadApod(false, nextDate);
                    }}
                    className="rounded border border-[#293A54] bg-[#111C32] px-2 py-1 text-xs font-mono-tabular text-[#EAF2FF]"
                  />
                  {apodDate && (
                    <button
                      type="button"
                      onClick={() => {
                        setApodDate('');
                        void loadApod(false, '');
                      }}
                      className="text-xs font-semibold text-[#29B6F6] hover:text-[#EAF2FF] cursor-pointer"
                    >
                      Latest
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                <button
                  type="button"
                  onClick={openApodModal}
                  aria-label={`Inspect full APOD image: ${apodResult.record.title}`}
                  className="relative lg:col-span-5 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] overflow-hidden group cursor-pointer text-left transition-colors"
                >
                  <div className="w-full h-56 overflow-hidden">
                    <AsyncNasaImage
                      priority="high"
                      src={usingLiveApodImage ? apodResult.record.url! : MARS_FALLBACK_IMAGE}
                      alt={
                        usingLiveApodImage
                          ? apodResult.record.title
                          : 'AI-generated Martian landscape fallback while APOD is offline'
                      }
                      onError={() => setApodImgError(true)}
                      className="w-full h-56 object-cover block transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-md bg-[#080D1B]/80 border border-[#293A54] text-[#EAF2FF] flex items-center justify-center opacity-85 group-hover:opacity-100">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  {!usingLiveApodImage && (
                    <div className="absolute bottom-2 right-2">
                      <CornerWatermark label="AI-Generated Image · Saved" />
                    </div>
                  )}
                </button>

                <div className="lg:col-span-7 space-y-2.5">
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#EAF2FF]">
                    {apodResult.record.title}
                  </h3>
                  <p className="text-sm text-[#A8B6CC] leading-relaxed">
                    {toOneSentence(apodResult.record.explanation, 165)}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#293A54] text-xs text-[#A8B6CC]">
                    <span>
                      Credit: {apodResult.record.copyright ?? 'NASA Public Archive'}
                    </span>
                    {apodResult.record.hdUrl && (
                      <a
                        href={apodResult.record.hdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
                      >
                        <span>Open Full Image</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 2. REAL MARS ROVER & SURFACE PHOTOS */}
        <section
          aria-label="NASA Image Library Mars Gallery"
          className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-7 space-y-5"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#293A54]">
            <div className="flex items-center gap-2.5">
              <Camera className="w-5 h-5 text-[#E4774E] shrink-0" />
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-[#EAF2FF]">
                  {marsImgResult?.source === 'archived'
                    ? 'Saved Mars Rover & Surface Photos'
                    : 'Mars Rover & Surface Photos'}
                </h2>
                <p className="text-xs text-[#A8B6CC]">
                  Perseverance, Curiosity &amp; Jezero Crater imagery
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className="inline-flex flex-wrap p-1 rounded-lg bg-[#080D1B] border border-[#293A54] gap-1"
                role="group"
                aria-label="Filter Mars mission photos"
              >
                {(
                  [
                    { id: 'all', label: 'All Rovers' },
                    { id: 'Perseverance', label: 'Perseverance' },
                    { id: 'Curiosity', label: 'Curiosity' },
                    { id: 'Mars', label: 'Mars Surface' },
                  ] as { id: MarsMissionFilter; label: string }[]
                ).map((filter) => (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setMarsFilter(filter.id)}
                    className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      marsFilter === filter.id
                        ? 'bg-[#1E3353] text-[#29B6F6]'
                        : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {!marsImgLoading && marsImgResult && (
                <SourceBadge source={marsImgResult.source} />
              )}
              {!marsImgLoading &&
                marsImgResult &&
                marsImgResult.source !== 'archived' && (
                  <CornerWatermark label="Data: NASA Image Library" />
                )}
            </div>
          </div>

          {marsImgLoading && (
            <div
              role="status"
              className="rounded-lg bg-[#080D1B] border border-[#293A54] p-6 text-center text-sm text-[#29B6F6]"
            >
              Loading real Mars rover photography...
            </div>
          )}

          {!marsImgLoading &&
            marsImgResult &&
            marsImgResult.source === 'archived' && (
              <div
                role="alert"
                className="rounded-lg bg-[#080D1B] border border-[#FFB547]/70 p-3.5 flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-[#FFB547] shrink-0" />
                <p className="text-xs text-[#FFB547]">
                  {marsImgResult.statusMessage}
                </p>
              </div>
            )}

          {!marsImgLoading && marsImgResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {marsImgResult.items.map((item, idx) => {
                const hasLiveImg = Boolean(item.imageUrl && !brokenMarsIds[item.nasaId]);
                return (
                  <button
                    key={item.nasaId}
                    type="button"
                    onClick={() => openMarsGalleryModal(idx)}
                    aria-label={`Inspect photo ${item.title}`}
                    className="rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] overflow-hidden flex flex-col justify-between text-left group cursor-pointer transition-colors"
                  >
                    <div className="relative w-full h-44 overflow-hidden border-b border-[#293A54]">
                      <AsyncNasaImage
                        src={hasLiveImg ? item.imageUrl! : MARS_FALLBACK_IMAGE}
                        alt={
                          hasLiveImg
                            ? item.title
                            : `${item.title} (AI-generated terrain placeholder)`
                        }
                        onError={() =>
                          setBrokenMarsIds((prev) => ({
                            ...prev,
                            [item.nasaId]: true,
                          }))
                        }
                        className="w-full h-44 object-cover block transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute top-2.5 right-2.5 w-8 h-8 rounded-md bg-[#080D1B]/80 border border-[#293A54] text-[#EAF2FF] flex items-center justify-center opacity-85 group-hover:opacity-100">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                      {!hasLiveImg && (
                        <div className="absolute bottom-2 right-2">
                          <CornerWatermark label="AI-Generated Image · Saved" />
                        </div>
                      )}
                    </div>

                    <div className="p-4 space-y-1.5 flex-1 flex flex-col justify-between w-full">
                      <div>
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono-tabular font-semibold text-[#29B6F6]">
                            {item.missionTag}
                          </span>
                          <span className="font-mono-tabular text-[#A8B6CC]">
                            {item.dateCreated}
                          </span>
                        </div>
                        <h3 className="mt-1 font-display text-sm sm:text-base font-semibold text-[#EAF2FF] line-clamp-2 group-hover:text-[#29B6F6] transition-colors">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-xs text-[#A8B6CC] leading-relaxed">
                          {toOneSentence(item.description, 130)}
                        </p>
                      </div>
                      <p className="pt-2 border-t border-[#293A54] text-[11px] font-mono-tabular text-[#A8B6CC]/80 flex items-center justify-between gap-2">
                        <span>ID: {item.nasaId}</span>
                        <span className="text-[#29B6F6] font-sans font-medium">
                          Click to inspect
                        </span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* 3. NASA DONKI SPACE WEATHER MONITOR (FLR & CME) */}
        <section
          aria-label="NASA DONKI Space Weather Events"
          className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-7 space-y-5 [content-visibility:auto] [contain-intrinsic-size:auto_380px]"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#293A54]">
            <div className="flex items-center gap-2.5">
              <Sun className="w-5 h-5 text-[#FFB547] shrink-0" />
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-[#EAF2FF]">
                  Solar Storms &amp; Space Weather (DONKI)
                </h2>
                <p className="text-xs text-[#A8B6CC]">
                  {activeDonkiResult?.queryWindowLabel ?? 'Checking solar feed...'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className="inline-flex p-1 rounded-lg bg-[#080D1B] border border-[#293A54]"
                role="tablist"
                aria-label="DONKI observation type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={donkiTab === 'flr'}
                  onClick={() => {
                    setDonkiTab('flr');
                    recordObservatoryVisited(true);
                  }}
                  className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    donkiTab === 'flr'
                      ? 'bg-[#1E3353] text-[#29B6F6]'
                      : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                  }`}
                >
                  Solar Flares
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={donkiTab === 'cme'}
                  onClick={() => {
                    setDonkiTab('cme');
                    recordObservatoryVisited(true);
                  }}
                  className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    donkiTab === 'cme'
                      ? 'bg-[#1E3353] text-[#E4774E]'
                      : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                  }`}
                >
                  Solar Clouds (CMEs)
                </button>
              </div>

              <div
                className="inline-flex p-1 rounded-lg bg-[#080D1B] border border-[#293A54]"
                role="group"
                aria-label="Solar weather search window"
              >
                {([30, 90] as const).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDaysWindow(days)}
                    className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      daysWindow === days
                        ? 'bg-[#1E3353] text-[#29B6F6]'
                        : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>

              {!donkiLoading && activeDonkiResult && (
                <SourceBadge source={activeDonkiResult.source} />
              )}
              {!donkiLoading &&
                activeDonkiResult &&
                activeDonkiResult.source !== 'archived' && (
                  <CornerWatermark label="Data: NASA DONKI" />
                )}
            </div>
          </div>

          {donkiLoading && (
            <div
              role="status"
              className="rounded-lg bg-[#080D1B] border border-[#293A54] p-6 text-center text-sm text-[#29B6F6]"
            >
              Checking NASA DONKI solar flares &amp; CMEs...
            </div>
          )}

          {!donkiLoading && donkiTab === 'flr' && flrResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {flrResult.records.slice(0, 6).map((flare) => {
                const info = describeFlareClass(flare.classType);
                return (
                  <article
                    key={flare.id}
                    className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-mono-tabular text-base font-bold"
                          style={{ color: info.accentColor }}
                        >
                          Class {flare.classType}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#A8B6CC] leading-relaxed">
                        {info.explanation}
                      </p>
                      <p className="mt-2 text-xs font-mono-tabular text-[#EAF2FF]/85">
                        {formatUtcTimestamp(flare.beginTime)}
                        {flare.activeRegionNum ? ` · AR ${flare.activeRegionNum}` : ''}
                      </p>
                    </div>
                    {flare.link && (
                      <a
                        href={flare.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
                      >
                        <span>View Record</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}

          {!donkiLoading && donkiTab === 'cme' && cmeResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cmeResult.records.slice(0, 6).map((cme) => {
                const info = describeCmeSpeed(cme.speedKmS);
                return (
                  <article
                    key={cme.id}
                    className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 flex flex-col justify-between gap-2.5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="font-mono-tabular text-base font-bold"
                          style={{ color: info.accentColor }}
                        >
                          {info.tier}
                        </span>
                      </div>
                      <p className="mt-1.5 text-xs text-[#A8B6CC] leading-relaxed">
                        {info.explanation}
                      </p>
                      <p className="mt-2 text-xs font-mono-tabular text-[#EAF2FF]/85">
                        {formatUtcTimestamp(cme.startTime)}
                        {cme.halfAngleDeg !== null ? ` · ${cme.halfAngleDeg}° wide` : ''}
                      </p>
                    </div>
                    {cme.link && (
                      <a
                        href={cme.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
                      >
                        <span>View Record</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* 4. NASA OSDR SPACE BIOLOGY STUDIES */}
        <section
          aria-label="NASA OSDR Space Biology Studies"
          className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-7 space-y-5 [content-visibility:auto] [contain-intrinsic-size:auto_420px]"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#293A54]">
            <div className="flex items-center gap-2.5">
              <Microscope className="w-5 h-5 text-[#29B6F6] shrink-0" />
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-[#EAF2FF]">
                  Space Biology Studies (OSDR)
                </h2>
                <p className="text-xs text-[#A8B6CC]">
                  How spaceflight affects bone, muscle, immunity, and sleep
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div
                className="inline-flex flex-wrap p-1 rounded-lg bg-[#080D1B] border border-[#293A54] gap-1"
                role="tablist"
                aria-label="Filter OSDR study domains"
              >
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'bone', label: 'Bone' },
                    { id: 'muscle', label: 'Muscle' },
                    { id: 'immune', label: 'Immune' },
                    { id: 'sleep', label: 'Sleep' },
                  ] as { id: 'all' | OsdrHealthDomain; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={osdrDomainFilter === tab.id}
                    onClick={() => {
                      setOsdrDomainFilter(tab.id);
                      recordObservatoryVisited(true);
                    }}
                    className={`min-h-[36px] px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      osdrDomainFilter === tab.id
                        ? 'bg-[#1E3353] text-[#29B6F6]'
                        : 'text-[#A8B6CC] hover:text-[#EAF2FF]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              {!osdrLoading && osdrResult && <SourceBadge source={osdrResult.source} />}
              {!osdrLoading && osdrResult && osdrResult.source !== 'archived' && (
                <CornerWatermark label="Data: NASA OSDR" />
              )}
            </div>
          </div>

          {!osdrLoading && osdrResult && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOsdrStudies.map((study) => (
                <article
                  key={study.accession}
                  className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 sm:p-5 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-mono-tabular font-bold text-[#29B6F6]">
                        {study.accession} · {study.domainLabel}
                      </span>
                    </div>
                    <h3 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF]">
                      {study.title}
                    </h3>
                    <p className="text-xs text-[#A8B6CC] leading-relaxed">
                      {study.keyFindingSummary}
                    </p>
                    <p className="text-xs text-[#EAF2FF]/85 leading-relaxed">
                      {study.outpostConnection}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#293A54] flex items-center justify-between gap-2 text-xs">
                    <span className="text-[#FFB547] truncate">{study.organism}</span>
                    <a
                      href={study.studyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-medium text-[#29B6F6] hover:text-[#EAF2FF] shrink-0"
                    >
                      <span>{study.accession}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* 5. RADLAB DOSIMETRY & MARS TREK TERRAIN */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch [content-visibility:auto] [contain-intrinsic-size:auto_420px]">
          <section
            aria-label="NASA RadLab Radiation Dosimetry Benchmarks"
            className="lg:col-span-7 rounded-xl bg-[#111C32] border border-[#293A54] p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#293A54]">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#E4774E] shrink-0" />
                  <h2 className="font-display text-lg font-semibold text-[#EAF2FF]">
                    Radiation Levels (RadLab &amp; MSL RAD)
                  </h2>
                </div>
                <CornerWatermark label="Data: NASA RadLab" />
              </div>

              <div className="space-y-2.5">
                {RADLAB_DOSIMETRY_BENCHMARKS.map((bench) => (
                  <div
                    key={bench.id}
                    className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-1"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#EAF2FF]">
                        {bench.environment}
                      </span>
                      <span className="font-mono-tabular text-[#FFB547]">
                        {bench.detector}
                      </span>
                    </div>
                    <p className="text-xs font-mono-tabular text-[#29B6F6]">
                      {bench.absorbedDoseRate} · {bench.doseEquivalentRate}
                    </p>
                    <p className="text-xs text-[#A8B6CC]">{bench.contextNote}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#293A54] text-xs text-[#A8B6CC]">
              <span>
                {RADLAB_UNITS_EXPLANATION.absorbedDose}{' '}
                {RADLAB_UNITS_EXPLANATION.doseEquivalent}
              </span>
              <a
                href="https://visualization.osdr.nasa.gov/radlab/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-medium text-[#29B6F6] hover:text-[#EAF2FF] shrink-0"
              >
                <span>Open RadLab</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </section>

          <section
            aria-label="NASA Mars Trek Terrain and Elevation"
            className="lg:col-span-5 rounded-xl bg-[#111C32] border border-[#293A54] p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#293A54]">
                <div className="flex items-center gap-2">
                  <Compass className="w-5 h-5 text-[#29B6F6] shrink-0" />
                  <h2 className="font-display text-lg font-semibold text-[#EAF2FF]">
                    Mars Trek Terrain (Jezero Crater)
                  </h2>
                </div>
                <CornerWatermark label="Data: Mars Trek" />
              </div>

              <dl className="rounded-lg bg-[#080D1B] border border-[#293A54] p-3.5 space-y-1.5 text-xs">
                <div className="flex justify-between gap-2">
                  <dt className="text-[#A8B6CC]">Coordinates</dt>
                  <dd className="font-mono-tabular text-[#EAF2FF]">
                    {MARS_TREK_JEZERO_PROFILE.coordinates}
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#A8B6CC]">Crater Width</dt>
                  <dd className="font-mono-tabular text-[#EAF2FF]">
                    {MARS_TREK_JEZERO_PROFILE.craterDiameterKm} km
                  </dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="text-[#A8B6CC]">Basin Floor</dt>
                  <dd className="font-mono-tabular text-[#29B6F6]">
                    {MARS_TREK_JEZERO_PROFILE.floorElevationDatum}
                  </dd>
                </div>
              </dl>

              <p className="text-xs text-[#A8B6CC] leading-relaxed">
                {MARS_TREK_JEZERO_PROFILE.habitatPlacementNote}{' '}
                {MARS_TREK_JEZERO_PROFILE.mobilityHazardNote}
              </p>
            </div>

            <div className="pt-3 border-t border-[#293A54] flex items-center justify-between gap-2">
              <span className="text-xs text-[#A8B6CC]">
                {MARS_TREK_JEZERO_PROFILE.dataSources}
              </span>
              <a
                href={MARS_TREK_JEZERO_PROFILE.portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF] shrink-0"
              >
                <span>Open Mars Trek</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </section>
        </div>

        {/* 6. CANADIAN SPACE AGENCY (CSA) */}
        <section
          aria-label="Canadian Space Agency Resources"
          className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-7 space-y-4 [content-visibility:auto] [contain-intrinsic-size:auto_320px]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#293A54]">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-[#29B6F6] shrink-0" />
              <h2 className="font-display text-lg sm:text-xl font-semibold text-[#EAF2FF]">
                Space Food &amp; Youth STEM (CSA)
              </h2>
            </div>
            <CornerWatermark label="Resource: CSA" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CSA_RESOURCES.map((res) => (
              <article
                key={res.id}
                className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 flex flex-col justify-between gap-3"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono-tabular text-[#29B6F6]">
                      {res.topic}
                    </span>
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF]">
                    {res.title}
                  </h3>
                  <p className="text-xs text-[#A8B6CC] leading-relaxed">
                    {res.summary}
                  </p>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
                >
                  <span>{res.linkLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </article>
            ))}
          </div>
        </section>

        {/* 7. COMPACT DATA DIRECTORY */}
        <section
          aria-label="Official Data Sources and Space Agency Resources"
          className="rounded-xl bg-[#111C32] border border-[#293A54] p-6 sm:p-7 space-y-4 [content-visibility:auto] [contain-intrinsic-size:auto_420px]"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#E4774E] shrink-0" />
            <h2 className="font-display text-lg sm:text-xl font-semibold text-[#EAF2FF]">
              Official Data Directory
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OFFICIAL_DATA_SOURCES_DIRECTORY.map((source) => (
              <article
                key={source.id}
                className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4 flex flex-col justify-between gap-2.5"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-sm font-semibold text-[#EAF2FF]">
                      {source.name}
                    </h3>
                    <CornerWatermark
                      label={
                        source.agency === 'CSA'
                          ? 'Resource: CSA'
                          : `Data: ${source.agency}`
                      }
                    />
                  </div>
                  <p className="text-xs text-[#A8B6CC] leading-relaxed">
                    {source.dataSummary}
                  </p>
                </div>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
                >
                  <span>{source.linkLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </article>
            ))}
          </div>

          <p className="text-xs text-[#A8B6CC]">{SCIENTIFIC_DISCLAIMER}</p>
        </section>

        <div className="pt-1 flex justify-center">
          <button
            type="button"
            onClick={() => onNavigate('simulator')}
            className="min-h-[44px] px-6 py-2.5 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-[#080D1B] text-sm font-semibold transition-colors cursor-pointer"
          >
            Return to 10-Sol Mission Simulator
          </button>
        </div>
      </main>

      <CompactWatermarkFooter onNavigate={onNavigate} />

      {photoModalState && (
        <Suspense fallback={null}>
          <LazyMarsPhotoModal
            isOpen
            photos={photoModalState.photos}
            initialIndex={photoModalState.initialIndex}
            onClose={() => setPhotoModalState(null)}
            onOpenSimulator={() => onNavigate('simulator')}
          />
        </Suspense>
      )}
    </div>
  );
}
