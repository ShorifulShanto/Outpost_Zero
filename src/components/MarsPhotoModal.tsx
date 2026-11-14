import { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  ExternalLink,
  X,
} from 'lucide-react';
import { FeaturedMarsPhoto } from '../services/nasaMediaService';
import { CornerWatermark, MARS_FALLBACK_IMAGE } from './DataWatermark';

interface MarsPhotoModalProps {
  isOpen: boolean;
  photos: FeaturedMarsPhoto[];
  initialIndex?: number;
  onClose: () => void;
  onOpenObservatory?: () => void;
  onOpenSimulator?: () => void;
}

function getCrewEngineeringInsight(photo: FeaturedMarsPhoto): string {
  const combined = `${photo.title} ${photo.fullDescription}`.toLowerCase();
  if (combined.includes('dust') || combined.includes('streak') || combined.includes('wind')) {
    return 'Crew Engineering Note: Fine Martian dust settles on solar wings and shifts down steep crater slopes. Outpost Zero engineers schedule dust sweeps and reinforce rover traction before driving near slope streaks.';
  }
  if (combined.includes('perseverance') || combined.includes('jezero') || combined.includes('lake')) {
    return 'Crew Engineering Note: Jezero Crater offers flat basin landing ground plus rocky delta minerals, though its crater rim walls create dusty wind currents your habitat filters must trap.';
  }
  if (combined.includes('curiosity') || combined.includes('gale') || combined.includes('mount sharp')) {
    return 'Crew Engineering Note: Curiosity’s Radiation Assessment Detector (RAD) on Mount Sharp measured ~0.67 mSv/day—proving why your crew’s water-wall dome is critical during solar storms.';
  }
  return 'Crew Engineering Note: Every rock, slope, and dust cloud captured by NASA spacecraft helps mission planners choose safer habitats, clearer solar sites, and smart driving paths.';
}

export function MarsPhotoModal({
  isOpen,
  photos,
  initialIndex = 0,
  onClose,
  onOpenObservatory,
  onOpenSimulator,
}: MarsPhotoModalProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [failedUrls, setFailedUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setActiveIndex(
        Math.min(Math.max(0, initialIndex), Math.max(0, photos.length - 1))
      );
    }
  }, [isOpen, initialIndex, photos.length]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && photos.length > 1) {
        setActiveIndex((prev) => (prev + 1) % photos.length);
      } else if (e.key === 'ArrowLeft' && photos.length > 1) {
        setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, photos.length, onClose]);

  if (!isOpen || photos.length === 0) return null;

  const photo = photos[activeIndex] ?? photos[0];
  const hasLiveUrl = Boolean(photo.imageUrl && !failedUrls[photo.nasaId]);
  const displaySrc = hasLiveUrl ? photo.imageUrl! : MARS_FALLBACK_IMAGE;
  const isApod = photo.nasaId.startsWith('APOD-');
  const nasaArchiveUrl =
    !isApod && photo.isLiveNasa && !photo.nasaId.includes('SIM-')
      ? `https://images.nasa.gov/details/${encodeURIComponent(photo.nasaId)}`
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#080D1B]/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mars-photo-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#111C32] border border-[#293A54] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Modal Header */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#293A54]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#29B6F6] font-mono-tabular">
              <span>Mars Surface Explorer</span>
              <span aria-hidden="true">·</span>
              <span>
                {activeIndex + 1} / {photos.length}
              </span>
              {photo.dateCreated && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#A8B6CC]">{photo.dateCreated}</span>
                </>
              )}
            </div>
            <h2
              id="mars-photo-modal-title"
              className="mt-1 font-display text-lg sm:text-xl font-bold text-[#EAF2FF] leading-snug"
            >
              {photo.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Mars Photo Explorer"
            className="w-10 h-10 rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] text-[#A8B6CC] hover:text-[#EAF2FF] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Resolution Image Viewport with Prev/Next Gallery Controls */}
        <div className="relative bg-[#080D1B] border-b border-[#293A54]">
          <img
            src={displaySrc}
            alt={
              hasLiveUrl
                ? photo.title
                : `${photo.title} (Simulated Mars terrain view)`
            }
            referrerPolicy="no-referrer"
            onError={() =>
              setFailedUrls((prev) => ({ ...prev, [photo.nasaId]: true }))
            }
            className="w-full max-h-[380px] object-contain mx-auto block bg-[#080D1B]"
          />

          <div className="absolute bottom-3 right-3">
            <CornerWatermark
              label={
                hasLiveUrl
                  ? isApod
                    ? 'Data: NASA APOD'
                    : 'Data: NASA Image Library'
                  : 'Simulated Terrain'
              }
            />
          </div>

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev - 1 + photos.length) % photos.length)
                }
                aria-label="Previous Mars photo"
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#080D1B]/85 border border-[#293A54] hover:border-[#29B6F6] text-[#EAF2FF] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveIndex((prev) => (prev + 1) % photos.length)
                }
                aria-label="Next Mars photo"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-lg bg-[#080D1B]/85 border border-[#293A54] hover:border-[#29B6F6] text-[#EAF2FF] flex items-center justify-center transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}
        </div>

        {/* Untruncated Description & Crew Engineering Insight */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-mono-tabular text-[#A8B6CC]">
              {photo.missionTag ?? 'Mars Exploration'} · Record ID: {photo.nasaId}
            </p>
            <p className="text-sm sm:text-base text-[#EAF2FF] leading-relaxed">
              {photo.fullDescription || photo.caption}
            </p>
          </div>

          <div className="rounded-lg bg-[#080D1B] border border-[#293A54] p-4">
            <p className="text-xs font-semibold text-[#E4774E] mb-1">
              Why This Matters for Outpost Zero
            </p>
            <p className="text-xs sm:text-sm text-[#A8B6CC] leading-relaxed">
              {getCrewEngineeringInsight(photo)}
            </p>
          </div>

          {/* Thumbnail / Slide Strip when multiple photos exist */}
          {photos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {photos.map((item, idx) => {
                const isSelected = idx === activeIndex;
                const thumbHasLive = Boolean(item.imageUrl && !failedUrls[item.nasaId]);
                return (
                  <button
                    key={`${item.nasaId}-${idx}`}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`View photo ${idx + 1}: ${item.title}`}
                    className={`relative w-20 h-12 rounded-md overflow-hidden border shrink-0 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#29B6F6] scale-[1.03]'
                        : 'border-[#293A54] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumbHasLive ? item.imageUrl! : MARS_FALLBACK_IMAGE}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover block"
                    />
                  </button>
                );
              })}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#293A54] flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              {onOpenObservatory && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenObservatory();
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#1E3353] hover:bg-[#29436b] border border-[#293A54] text-xs font-semibold text-[#EAF2FF] transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-[#29B6F6]" />
                  <span>Open Full NASA Observatory</span>
                </button>
              )}
              {onOpenSimulator && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenSimulator();
                  }}
                  className="inline-flex items-center gap-1.5 min-h-[40px] px-4 py-2 rounded-lg bg-[#E4774E] hover:bg-[#ec8761] text-xs font-semibold text-[#080D1B] transition-colors cursor-pointer"
                >
                  <span>Test in 10-Sol Simulator</span>
                </button>
              )}
            </div>

            {nasaArchiveUrl && (
              <a
                href={nasaArchiveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF]"
              >
                <span>Open NASA Image Record</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
