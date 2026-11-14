import { lazy, Suspense, useEffect, useState } from 'react';
import { ArrowRight, Maximize2 } from 'lucide-react';
import {
  FeaturedMarsPhoto,
  fetchFeaturedMarsSurfaceDeck,
} from '../services/nasaMediaService';
import { AppRoute, ResourceKey, ResourceState } from '../types/mission';
import {
  recordDomeInspected,
  recordPhotoInspected,
} from '../utils/explorerProgress';
import { CornerWatermark, MARS_FALLBACK_IMAGE } from './DataWatermark';

const MarsPhotoModal = lazy(() =>
  import('./MarsPhotoModal').then((m) => ({ default: m.MarsPhotoModal }))
);

interface OutpostSchematicProps {
  resources?: ResourceState;
  isTransmitting?: boolean;
  isPaused?: boolean;
  compact?: boolean;
  radiationLeakActive?: boolean;
  cropsSpoiled?: boolean;
  frostWarning?: boolean;
  panelDustLevel?: number;
  stormSeverity?: string;
  crewSheltered?: boolean;
  marsPhoto?: FeaturedMarsPhoto | null;
  onSelectSystem?: (system: ResourceKey) => void;
  onNavigate?: (route: AppRoute) => void;
}

const SYSTEM_INSPECT_INFO: Record<
  ResourceKey,
  {
    title: string;
    detail: string;
    quickStat: string;
    color: string;
    badgeLabel: string;
  }
> = {
  lifeSupport: {
    title: 'Greenhouse & Clean Air Dome',
    detail:
      'Grow lights help fresh veggies sprout while air filters turn crew breath back into clean oxygen.',
    quickStat: 'Recycles water & fresh air',
    color: '#29B6F6',
    badgeLabel: 'Dome 01 · Air & Food',
  },
  radiationProtection: {
    title: 'Water-Wall Shelter & Airlock',
    detail:
      'Thick water walls and packed Mars soil block harmful space rays and solar storm bursts.',
    quickStat: 'Storm-safe crew shelter',
    color: '#E4774E',
    badgeLabel: 'Dome 02 · Safe Core',
  },
  power: {
    title: 'Solar Panels & Battery Bank',
    detail:
      'Blue solar wings catch weak Mars sunlight to charge warm heaters—unless red Mars dust covers them!',
    quickStat: 'Sunlight & night batteries',
    color: '#FFB547',
    badgeLabel: 'Wing 03 · Solar Power',
  },
};

export function OutpostSchematic({
  resources,
  isTransmitting = false,
  isPaused = false,
  compact = false,
  radiationLeakActive = false,
  cropsSpoiled = false,
  frostWarning = false,
  panelDustLevel = 12,
  stormSeverity = 'Clear Skies',
  crewSheltered = false,
  marsPhoto: externalMarsPhoto,
  onSelectSystem,
  onNavigate,
}: OutpostSchematicProps) {
  const [selectedSystem, setSelectedSystem] = useState<ResourceKey>('radiationProtection');
  const [hoveredSystem, setHoveredSystem] = useState<ResourceKey | null>(null);
  const [photoDeck, setPhotoDeck] = useState<FeaturedMarsPhoto[]>([]);
  const [surfaceImgError, setSurfaceImgError] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  // Only fetch full 6-photo deck when needed (saves network on initial Home load)
  useEffect(() => {
    if (!photoModalOpen && externalMarsPhoto) return;
    if (photoDeck.length > 0) return;
    let active = true;
    void fetchFeaturedMarsSurfaceDeck().then((deck) => {
      if (active && deck.length > 0) {
        setPhotoDeck(deck);
      }
    });
    return () => {
      active = false;
    };
  }, [photoModalOpen, externalMarsPhoto, photoDeck.length]);

  const primaryDeckPhoto = photoDeck[0] ?? null;
  const activePhoto = externalMarsPhoto ?? primaryDeckPhoto;
  const modalPhotos =
    photoDeck.length > 0
      ? photoDeck
      : activePhoto
        ? [activePhoto]
        : [
            {
              imageUrl: null,
              isLiveNasa: false,
              source: 'archived' as const,
              title: 'Jezero Crater Landing Zone',
              caption: 'Simulated Mars horizon view at dusk while offline.',
              fullDescription:
                'Simulated Mars terrain at Jezero Crater while offline. Dust storms, crater walls, and freezing nights make habitat engineering essential.',
              nasaId: 'SIM-TERRAIN-FALLBACK',
              dateCreated: 'Simulated Reference',
              missionTag: 'Mars Exploration',
            },
          ];

  const isLiveSurfacePhoto = Boolean(activePhoto?.imageUrl && !surfaceImgError);
  const surfaceImgSrc = isLiveSurfacePhoto
    ? activePhoto!.imageUrl!
    : MARS_FALLBACK_IMAGE;

  const handleSelect = (key: ResourceKey) => {
    setSelectedSystem(key);
    recordDomeInspected(key);
    onSelectSystem?.(key);
  };

  const handleOpenSurfaceModal = () => {
    recordPhotoInspected();
    setPhotoModalOpen(true);
  };

  const lifeVal = resources?.lifeSupport ?? 78;
  const powerVal = resources?.power ?? 76;
  const radVal = resources?.radiationProtection ?? 80;
  const stormAlert =
    resources?.solarWeatherAlert === 'Storm Watch' ||
    stormSeverity === 'Regional Storm' ||
    stormSeverity === 'Light Dust';
  const clampedDust = Math.max(0, Math.min(100, panelDustLevel));
  const dustFilmOpacity = Math.min(0.86, clampedDust / 82);

  const lifeColor = cropsSpoiled
    ? '#E4774E'
    : lifeVal >= 60
      ? '#29B6F6'
      : lifeVal >= 30
        ? '#FFB547'
        : '#E4774E';
  const powerColor = frostWarning
    ? '#E4774E'
    : powerVal >= 60
      ? '#FFB547'
      : powerVal >= 30
        ? '#FFB547'
        : '#E4774E';
  const radColor = radiationLeakActive
    ? '#E4774E'
    : radVal >= 60
      ? '#29B6F6'
      : radVal >= 30
        ? '#FFB547'
        : '#E4774E';

  const activeInfo = SYSTEM_INSPECT_INFO[selectedSystem];
  const activePercent =
    selectedSystem === 'lifeSupport'
      ? lifeVal
      : selectedSystem === 'power'
        ? powerVal
        : radVal;

  return (
    <>
      <div className="rounded-xl bg-[#111C32]/95 border border-[#293A54] p-4 sm:p-5 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="font-display text-sm sm:text-base font-semibold text-[#EAF2FF]">
              Outpost Zero Habitat Schematic
            </h3>
            <p className="text-xs text-[#A8B6CC]">
              Click a dome module to inspect it
            </p>
          </div>
          {isPaused ? (
            <span className="text-xs font-medium text-[#FFB547] font-mono-tabular">
              PAUSED
            </span>
          ) : (
            <span className="text-[11px] font-mono-tabular text-[#29B6F6]">
              3D Sector View
            </span>
          )}
        </div>

        {/* Pseudo-3D Volumetric Isometric-Perspective SVG Habitat Diagram */}
        <div className="relative rounded-lg bg-[#080D1B] border border-[#293A54] overflow-hidden">
          <svg
            viewBox="0 0 600 295"
            className={`w-full h-auto block ${compact ? 'max-h-[215px]' : 'max-h-[260px]'}`}
            role="img"
            aria-label="Outpost Zero 3D-style Mars Habitat Engineering Schematic"
          >
            <defs>
              {/* Atmospheric Mars Twilight Sky */}
              <linearGradient id="marsSkyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#070B17" />
                <stop offset="55%" stopColor="#121A30" />
                <stop offset="85%" stopColor="#261B28" />
                <stop offset="100%" stopColor="#3B2123" />
              </linearGradient>

              {/* Perspective Terrain Surface */}
              <linearGradient id="marsGroundGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#27191D" />
                <stop offset="45%" stopColor="#1D1318" />
                <stop offset="100%" stopColor="#100B11" />
              </linearGradient>

              {/* Soft Cast Ground Shadow */}
              <radialGradient id="groundShadow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#04070E" stopOpacity="0.82" />
                <stop offset="65%" stopColor="#04070E" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#04070E" stopOpacity="0" />
              </radialGradient>

              {/* 3D Core Dome Spherical Shading */}
              <radialGradient id="coreDomeSphere" cx="34%" cy="28%" r="72%">
                <stop offset="0%" stopColor="#3A5B8A" />
                <stop offset="35%" stopColor="#1E3557" />
                <stop offset="78%" stopColor="#111F38" />
                <stop offset="100%" stopColor="#091224" />
              </radialGradient>

              {/* 3D Translucent Greenhouse Glass Dome */}
              <radialGradient id="greenhouseSphere" cx="32%" cy="25%" r="75%">
                <stop offset="0%" stopColor="#6FE3FF" stopOpacity="0.52" />
                <stop offset="42%" stopColor="#29B6F6" stopOpacity="0.26" />
                <stop offset="80%" stopColor="#112A48" stopOpacity="0.72" />
                <stop offset="100%" stopColor="#0A172B" stopOpacity="0.92" />
              </radialGradient>

              {/* 3D Foundation Pad Metallic Rim */}
              <linearGradient id="basePadSide" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1B2A44" />
                <stop offset="32%" stopColor="#344B73" />
                <stop offset="70%" stopColor="#182740" />
                <stop offset="100%" stopColor="#0D1628" />
              </linearGradient>

              {/* 3D Pressurized Cylinder Tunnel */}
              <linearGradient id="tunnelCylinder" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#46628E" />
                <stop offset="28%" stopColor="#2B4268" />
                <stop offset="75%" stopColor="#15233C" />
                <stop offset="100%" stopColor="#0A1324" />
              </linearGradient>

              {/* 3D Solar Wing Photovoltaic Gradient */}
              <linearGradient id="solarPanelFace" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#2A4D7C" />
                <stop offset="50%" stopColor="#173157" />
                <stop offset="100%" stopColor="#0D1D36" />
              </linearGradient>

              {/* 3D Dish Reflector */}
              <radialGradient id="dishConcave" cx="42%" cy="38%" r="65%">
                <stop offset="0%" stopColor="#DDEAFF" />
                <stop offset="55%" stopColor="#7E97BA" />
                <stop offset="100%" stopColor="#2C405F" />
              </radialGradient>

              {/* Storm Tint Overlay */}
              <linearGradient id="stormHaze" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E4774E" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#E4774E" stopOpacity="0.03" />
              </linearGradient>
            </defs>

            {/* Sky Backdrop */}
            <rect width="600" height="175" fill="url(#marsSkyGrad)" />

            {/* Crisp Twilight Stars */}
            <g fill="#EAF2FF" opacity="0.55">
              <circle cx="48" cy="28" r="1" />
              <circle cx="118" cy="44" r="1.2" opacity="0.7" />
              <circle cx="182" cy="22" r="0.9" />
              <circle cx="246" cy="52" r="1" opacity="0.4" />
              <circle cx="388" cy="30" r="1.1" />
              <circle cx="465" cy="46" r="1.3" opacity="0.7" />
              <circle cx="536" cy="24" r="0.9" />
              <circle cx="572" cy="60" r="1" opacity="0.45" />
            </g>

            {/* Subtle Phobos Moon Glow */}
            <circle cx="518" cy="54" r="8" fill="#D4C2B8" opacity="0.22" />
            <circle cx="516" cy="53" r="6.5" fill="#EFE4DC" opacity="0.32" />

            {stormAlert && (
              <g aria-hidden="true">
                <rect width="600" height="295" fill="url(#stormHaze)" />
                <g stroke="#E4774E" strokeOpacity="0.34" strokeWidth="1.2" strokeLinecap="round">
                  <line x1="25" y1="88" x2="115" y2="94" />
                  <line x1="160" y1="112" x2="268" y2="118" />
                  <line x1="360" y1="92" x2="495" y2="99" />
                  <line x1="430" y1="142" x2="570" y2="150" />
                </g>
              </g>
            )}

            {/* Far Canyon Rim & Jezero Mesas (Parallax Depth) */}
            <path
              d="M0 156 L58 134 L120 144 L196 122 L272 138 L354 118 L430 132 L512 124 L600 142 L600 185 L0 185 Z"
              fill="#19131C"
              stroke="#E4774E"
              strokeOpacity="0.18"
              strokeWidth="1"
            />
            <path
              d="M0 166 L94 152 L176 164 L268 148 L368 162 L478 146 L600 160 L600 190 L0 190 Z"
              fill="#23161C"
            />

            {/* 3D Perspective Martian Ground Plane */}
            <path d="M0 172 L600 172 L600 295 L0 295 Z" fill="url(#marsGroundGrad)" />
            <line
              x1="0"
              y1="172"
              x2="600"
              y2="172"
              stroke="#E4774E"
              strokeOpacity="0.28"
              strokeWidth="1"
            />

            {/* Subtle Perspective Surface Grid Lines */}
            <g stroke="#39262B" strokeWidth="0.7" strokeOpacity="0.55">
              <line x1="300" y1="172" x2="10" y2="295" />
              <line x1="300" y1="172" x2="145" y2="295" />
              <line x1="300" y1="172" x2="300" y2="295" />
              <line x1="300" y1="172" x2="455" y2="295" />
              <line x1="300" y1="172" x2="590" y2="295" />
              <line x1="0" y1="192" x2="600" y2="192" />
              <line x1="0" y1="222" x2="600" y2="222" />
              <line x1="0" y1="260" x2="600" y2="260" />
            </g>

            {/* Distant Subtle Crater & Rocks for Surface Depth */}
            <ellipse
              cx="84"
              cy="192"
              rx="26"
              ry="5"
              fill="#140D12"
              stroke="#523232"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <polygon points="538,256 556,246 568,258 548,263" fill="#2A1B1E" />
            <polygon points="32,250 48,243 56,254 36,257" fill="#281A1D" />

            {/* ================= 3D CAST SHADOWS ON GROUND ================= */}
            <ellipse cx="122" cy="236" rx="76" ry="20" fill="url(#groundShadow)" />
            <ellipse cx="312" cy="240" rx="112" ry="28" fill="url(#groundShadow)" />
            <ellipse cx="496" cy="232" rx="78" ry="18" fill="url(#groundShadow)" />

            {/* ================= 3D CONNECTING PRESSURIZED TUNNEL ================= */}
            <g aria-hidden="true">
              {/* Tunnel Cast Shadow */}
              <polygon
                points="166,226 226,228 228,238 164,235"
                fill="#050811"
                opacity="0.7"
              />
              {/* Cylinder Body */}
              <path
                d="M162 197 L224 195 L224 217 L162 219 Z"
                fill="url(#tunnelCylinder)"
                stroke="#354C73"
                strokeWidth="1"
              />
              {/* 3D Ribbed Pressure Rings */}
              <ellipse cx="177" cy="207.5" rx="3.5" ry="11.5" fill="none" stroke="#5E7EAE" strokeWidth="1.3" />
              <ellipse cx="195" cy="206.5" rx="3.5" ry="11.5" fill="none" stroke="#5E7EAE" strokeWidth="1.3" />
              <ellipse cx="212" cy="206" rx="3.5" ry="11.5" fill="none" stroke="#5E7EAE" strokeWidth="1.3" />
            </g>

            {/* ================= 3D POWER CONDUIT CABLE ================= */}
            <g aria-hidden="true">
              <path
                d="M394 216 Q424 222 444 215"
                fill="none"
                stroke="#0B1324"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M394 215 Q424 221 444 214"
                fill="none"
                stroke={powerColor}
                strokeWidth="2.4"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
            </g>

            {/* ================= MODULE 1: 3D HYDROPONIC GREENHOUSE DOME ================= */}
            <g
              onClick={() => handleSelect('lifeSupport')}
              onMouseEnter={() => setHoveredSystem('lifeSupport')}
              onMouseLeave={() => setHoveredSystem(null)}
              className="cursor-pointer transition-transform duration-200"
              style={{
                transform:
                  selectedSystem === 'lifeSupport' || hoveredSystem === 'lifeSupport'
                    ? 'translateY(-3px)'
                    : 'translateY(0px)',
              }}
              role="button"
              tabIndex={0}
              aria-label="Inspect Hydroponic Greenhouse and Life Support Dome"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect('lifeSupport');
                }
              }}
            >
              {/* Active Selection Halo Ring */}
              {(selectedSystem === 'lifeSupport' || hoveredSystem === 'lifeSupport') && (
                <ellipse
                  cx="116"
                  cy="225"
                  rx="70"
                  ry="18"
                  fill="none"
                  stroke={lifeColor}
                  strokeWidth="2"
                  strokeOpacity="0.85"
                />
              )}

              {/* 3D Extruded Foundation Pad */}
              <path
                d="M52 214 L52 224 A64 16 0 0 0 180 224 L180 214 Z"
                fill="url(#basePadSide)"
                stroke="#293A54"
                strokeWidth="1"
              />
              <ellipse
                cx="116"
                cy="214"
                rx="64"
                ry="16"
                fill="#182945"
                stroke={selectedSystem === 'lifeSupport' ? '#EAF2FF' : lifeColor}
                strokeWidth={selectedSystem === 'lifeSupport' ? '2' : '1.4'}
              />

              {/* Interior 3D Hydroponic Plant Trays visible inside translucent glass */}
              <g>
                <ellipse cx="116" cy="209" rx="46" ry="9" fill="#0B192B" />
                {/* 3D Glowing Plant Tier Racks */}
                <path
                  d="M80 206 L108 197 L152 197 L148 206 Z"
                  fill={cropsSpoiled ? '#4A1D19' : '#194B49'}
                  opacity="0.85"
                />
                <rect
                  x="85"
                  y="191"
                  width="16"
                  height="8"
                  rx="2"
                  fill={cropsSpoiled ? '#B94A32' : '#34D399'}
                  opacity="0.82"
                />
                <rect
                  x="108"
                  y="188"
                  width="18"
                  height="9"
                  rx="2"
                  fill={cropsSpoiled ? '#E4774E' : '#34D399'}
                  opacity="0.92"
                />
                <rect
                  x="132"
                  y="191"
                  width="14"
                  height="8"
                  rx="2"
                  fill={cropsSpoiled ? '#9A3412' : '#2DD4BF'}
                  opacity="0.82"
                />
                {/* Hydroponic Light Strip */}
                <line
                  x1="88"
                  y1="184"
                  x2="144"
                  y2="184"
                  stroke={cropsSpoiled ? '#E4774E' : frostWarning ? '#FFB547' : '#6FE3FF'}
                  strokeWidth="1.5"
                  opacity="0.7"
                />
              </g>

              {/* 3D Volumetric Glass Shell */}
              <path
                d="M57 213 C57 154, 175 154, 175 213 A59 14 0 0 1 57 213 Z"
                fill="url(#greenhouseSphere)"
                stroke={selectedSystem === 'lifeSupport' ? '#EAF2FF' : lifeColor}
                strokeWidth={selectedSystem === 'lifeSupport' ? '2' : '1.4'}
              />

              {/* Curved Geodesic 3D Meridian Ribs */}
              <path
                d="M116 168 C94 176, 86 196, 86 218"
                fill="none"
                stroke="#8BE9FF"
                strokeOpacity="0.32"
                strokeWidth="1"
              />
              <path
                d="M116 168 C138 176, 146 196, 146 218"
                fill="none"
                stroke="#8BE9FF"
                strokeOpacity="0.28"
                strokeWidth="1"
              />
              <path
                d="M68 194 A52 11 0 0 0 164 194"
                fill="none"
                stroke="#8BE9FF"
                strokeOpacity="0.24"
                strokeWidth="1"
              />

              {/* Glass Specular Crescent Highlight */}
              <path
                d="M72 197 C76 177, 94 167, 114 167 C99 172, 84 182, 78 199 Z"
                fill="#FFFFFF"
                opacity="0.22"
              />

              <text
                x="116"
                y="153"
                textAnchor="middle"
                fill="#EAF2FF"
                fontSize="10"
                fontWeight="600"
              >
                LIFE SUPPORT
              </text>
              {(cropsSpoiled || frostWarning) && (
                <g transform="translate(116, 134)">
                  <rect
                    x="-34"
                    y="-10"
                    width="68"
                    height="15"
                    rx="3"
                    fill="#080D1B"
                    stroke={cropsSpoiled ? '#E4774E' : '#FFB547'}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fill={cropsSpoiled ? '#E4774E' : '#FFB547'}
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {cropsSpoiled ? 'SPOILED' : 'FROST RISK'}
                  </text>
                </g>
              )}
            </g>

            {/* ================= MODULE 2: 3D SHIELDED CORE HABITAT DOME ================= */}
            <g
              onClick={() => handleSelect('radiationProtection')}
              onMouseEnter={() => setHoveredSystem('radiationProtection')}
              onMouseLeave={() => setHoveredSystem(null)}
              className="cursor-pointer transition-transform duration-200"
              style={{
                transform:
                  selectedSystem === 'radiationProtection' ||
                  hoveredSystem === 'radiationProtection'
                    ? 'translateY(-3px)'
                    : 'translateY(0px)',
              }}
              role="button"
              tabIndex={0}
              aria-label="Inspect Shielded Core Main Habitat Dome"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect('radiationProtection');
                }
              }}
            >
              {/* Active Selection Halo Ring */}
              {(selectedSystem === 'radiationProtection' ||
                hoveredSystem === 'radiationProtection') && (
                <ellipse
                  cx="304"
                  cy="228"
                  rx="102"
                  ry="25"
                  fill="none"
                  stroke={radColor}
                  strokeWidth="2.2"
                  strokeOpacity="0.88"
                />
              )}

              {/* 3D Extruded Outer Regolith Shield Ring */}
              <path
                d="M210 214 L210 227 A94 22 0 0 0 398 227 L398 214 Z"
                fill="url(#basePadSide)"
                stroke="#2D4366"
                strokeWidth="1.2"
              />
              <ellipse
                cx="304"
                cy="214"
                rx="94"
                ry="22"
                fill="#20324F"
                stroke={selectedSystem === 'radiationProtection' ? '#EAF2FF' : radColor}
                strokeWidth={selectedSystem === 'radiationProtection' ? '2.2' : '1.5'}
              />

              {/* 3D Volumetric Shielded Dome Body */}
              <path
                d="M218 212 C218 118, 390 118, 390 212 A86 19 0 0 1 218 212 Z"
                fill="url(#coreDomeSphere)"
                stroke={selectedSystem === 'radiationProtection' ? '#EAF2FF' : radColor}
                strokeWidth={selectedSystem === 'radiationProtection' ? '2.2' : '1.6'}
              />
              {crewSheltered && (
                <path
                  d="M213 213 C213 111, 395 111, 395 213"
                  fill="none"
                  stroke="#29B6F6"
                  strokeOpacity="0.6"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
              )}

              {/* 3D Geodesic Armor Ribs */}
              <path
                d="M304 138 C268 148, 254 182, 254 222"
                fill="none"
                stroke="#4F70A1"
                strokeOpacity="0.48"
                strokeWidth="1.2"
              />
              <path
                d="M304 138 C340 148, 354 182, 354 222"
                fill="none"
                stroke="#233758"
                strokeOpacity="0.7"
                strokeWidth="1.2"
              />
              <path
                d="M229 184 A78 15 0 0 0 379 184"
                fill="none"
                stroke="#4F70A1"
                strokeOpacity="0.45"
                strokeWidth="1.2"
              />

              {/* Top Dome Specular Highlight */}
              <path
                d="M240 176 C246 150, 272 138, 298 139 C276 146, 256 160, 246 179 Z"
                fill="#80B3FF"
                opacity="0.18"
              />

              {/* Curved 3D Panoramic Habitat Viewports */}
              <g>
                <path
                  d="M248 176 Q260 179 272 180 L272 192 Q260 191 248 188 Z"
                  fill="#29B6F6"
                  fillOpacity="0.52"
                  stroke="#90E0FF"
                  strokeWidth="1"
                />
                <path
                  d="M286 181 Q304 182 322 181 L322 193 Q304 194 286 193 Z"
                  fill="#29B6F6"
                  fillOpacity="0.58"
                  stroke="#90E0FF"
                  strokeWidth="1"
                />
                <path
                  d="M336 180 Q348 179 360 176 L360 188 Q348 191 336 192 Z"
                  fill="#29B6F6"
                  fillOpacity="0.42"
                  stroke="#90E0FF"
                  strokeWidth="1"
                />
              </g>

              {/* 3D Extruded Front Airlock Vestibule & Stairs */}
              <g>
                {/* Airlock Roof */}
                <polygon points="286,204 322,204 316,198 292,198" fill="#3B557E" />
                {/* Airlock Front Face */}
                <rect
                  x="286"
                  y="204"
                  width="36"
                  height="26"
                  rx="2"
                  fill="#13223B"
                  stroke="#6A89B8"
                  strokeWidth="1.2"
                />
                {/* Recessed Lit Door */}
                <rect
                  x="294"
                  y="209"
                  width="20"
                  height="21"
                  rx="1.5"
                  fill="#091324"
                  stroke="#FFB547"
                  strokeOpacity="0.7"
                  strokeWidth="1"
                />
                <line x1="304" y1="209" x2="304" y2="230" stroke="#FFB547" strokeOpacity="0.45" strokeWidth="1" />
                {/* 3D Entry Steps */}
                <polygon points="290,230 318,230 322,235 286,235" fill="#2A4064" />
                <polygon points="286,235 322,235 326,240 282,240" fill="#1C2D4A" />
              </g>

              {/* Rooftop 3D Parabolic High-Gain Dish */}
              <g transform="translate(304, 108)">
                <line x1="-6" y1="30" x2="0" y2="16" stroke="#85A1C9" strokeWidth="2" />
                <line x1="6" y1="30" x2="0" y2="16" stroke="#4D678F" strokeWidth="2" />
                {/* Tilted 3D Elliptical Dish Back & Concave Front */}
                <ellipse cx="0" cy="11" rx="18" ry="8" fill="#223654" />
                <ellipse
                  cx="0"
                  cy="9"
                  rx="17"
                  ry="7"
                  fill="url(#dishConcave)"
                  stroke="#EAF2FF"
                  strokeWidth="1"
                />
                <line x1="0" y1="9" x2="0" y2="-3" stroke="#29B6F6" strokeWidth="1.6" />
                <circle
                  cx="0"
                  cy="-4"
                  r="2.6"
                  fill={isTransmitting ? '#FFB547' : '#29B6F6'}
                />
                {isTransmitting && (
                  <>
                    <path
                      d="M-11 -10 Q0 -19 11 -10"
                      fill="none"
                      stroke="#FFB547"
                      strokeWidth="1.8"
                      strokeOpacity="0.92"
                    />
                    <path
                      d="M-20 -17 Q0 -30 20 -17"
                      fill="none"
                      stroke="#29B6F6"
                      strokeWidth="1.6"
                      strokeOpacity="0.72"
                    />
                  </>
                )}
              </g>

              <text
                x="304"
                y="90"
                textAnchor="middle"
                fill="#EAF2FF"
                fontSize="10.5"
                fontWeight="700"
              >
                SHIELDED CORE
              </text>
              {radiationLeakActive && (
                <g transform="translate(304, 71)">
                  <rect
                    x="-36"
                    y="-10"
                    width="72"
                    height="15"
                    rx="3"
                    fill="#080D1B"
                    stroke="#E4774E"
                    strokeWidth="1.1"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fill="#E4774E"
                    fontSize="8.5"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    RAD LEAK
                  </text>
                </g>
              )}
            </g>

            {/* ================= MODULE 3: 3D SOLAR ARRAY & BATTERY STATION ================= */}
            <g
              onClick={() => handleSelect('power')}
              onMouseEnter={() => setHoveredSystem('power')}
              onMouseLeave={() => setHoveredSystem(null)}
              className="cursor-pointer transition-transform duration-200"
              style={{
                transform:
                  selectedSystem === 'power' || hoveredSystem === 'power'
                    ? 'translateY(-3px)'
                    : 'translateY(0px)',
              }}
              role="button"
              tabIndex={0}
              aria-label="Inspect Solar Array and Battery Power Station"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelect('power');
                }
              }}
            >
              {/* Active Selection Halo Ring */}
              {(selectedSystem === 'power' || hoveredSystem === 'power') && (
                <ellipse
                  cx="500"
                  cy="223"
                  rx="72"
                  ry="18"
                  fill="none"
                  stroke={powerColor}
                  strokeWidth="2"
                  strokeOpacity="0.85"
                />
              )}

              {/* 3D Isometric Battery Core Block (Top + Left Front + Right Side) */}
              <g>
                {/* Top Face */}
                <polygon
                  points="436,184 462,175 486,184 460,193"
                  fill="#37517A"
                  stroke={selectedSystem === 'power' ? '#EAF2FF' : powerColor}
                  strokeWidth="1.2"
                />
                {/* Lit Left-Front Face */}
                <polygon
                  points="436,184 460,193 460,224 436,214"
                  fill="#1C3152"
                  stroke="#314B73"
                  strokeWidth="1"
                />
                {/* Shaded Right-Side Face */}
                <polygon
                  points="460,193 486,184 486,214 460,224"
                  fill="#0F1D35"
                  stroke="#273D61"
                  strokeWidth="1"
                />
                {/* Glowing Charge Bars */}
                <line x1="442" y1="196" x2="454" y2="201" stroke={powerColor} strokeWidth="2.4" />
                <line x1="442" y1="203" x2="454" y2="208" stroke={powerColor} strokeWidth="2.4" />
                <line x1="442" y1="210" x2="454" y2="215" stroke={powerColor} strokeWidth="2.4" opacity="0.55" />
              </g>

              {/* 3D Solar Wing Pylon & Dual Tilted Panels */}
              <g>
                {/* Base Pad */}
                <ellipse cx="524" cy="218" rx="18" ry="6" fill="#1F3250" stroke="#364E75" strokeWidth="1" />
                {/* Support Mast */}
                <rect x="520" y="168" width="7" height="50" fill="url(#basePadSide)" />
                {/* 3D Back Solar Wing (perspective depth) */}
                <polygon
                  points="484,158 564,136 572,155 492,177"
                  fill="url(#solarPanelFace)"
                  stroke={selectedSystem === 'power' ? '#EAF2FF' : powerColor}
                  strokeWidth={selectedSystem === 'power' ? '2' : '1.4'}
                />
                {/* 3D Front Solar Wing */}
                <polygon
                  points="476,178 556,156 566,180 486,202"
                  fill="url(#solarPanelFace)"
                  stroke={selectedSystem === 'power' ? '#EAF2FF' : powerColor}
                  strokeWidth={selectedSystem === 'power' ? '2' : '1.5'}
                />
                {/* Sunlight Beams (dimmer during storms or heavy dust) */}
                {!stormAlert && (
                  <g stroke="#FFB547" strokeOpacity={Math.max(0.18, 0.55 - dustFilmOpacity * 0.4)} strokeWidth="1.2" strokeDasharray="3 3">
                    <line x1="505" y1="128" x2="514" y2="148" />
                    <line x1="532" y1="122" x2="540" y2="142" />
                    <line x1="556" y1="118" x2="564" y2="136" />
                  </g>
                )}

                {/* Photovoltaic Cell Grid Lines */}
                <g stroke="#62B6FF" strokeOpacity={Math.max(0.12, 0.45 - dustFilmOpacity * 0.35)} strokeWidth="0.9">
                  <line x1="504" y1="152" x2="512" y2="171" />
                  <line x1="526" y1="146" x2="534" y2="165" />
                  <line x1="546" y1="141" x2="554" y2="160" />
                  <line x1="498" y1="172" x2="508" y2="196" />
                  <line x1="520" y1="166" x2="530" y2="190" />
                  <line x1="540" y1="160" x2="550" y2="184" />
                </g>

                {/* Visible Martian Dust Coating & Grains Settled on Solar Wings */}
                {clampedDust > 2 && (
                  <g pointerEvents="none">
                    <polygon
                      points="484,158 564,136 572,155 492,177"
                      fill="#C9643B"
                      fillOpacity={dustFilmOpacity * 0.72}
                    />
                    <polygon
                      points="476,178 556,156 566,180 486,202"
                      fill="#C9643B"
                      fillOpacity={dustFilmOpacity * 0.78}
                    />
                    <g fill="#E4966A" fillOpacity={Math.min(0.95, dustFilmOpacity + 0.15)}>
                      <circle cx="502" cy="162" r="1.4" />
                      <circle cx="524" cy="154" r="1.6" />
                      <circle cx="548" cy="148" r="1.3" />
                      <circle cx="496" cy="186" r="1.7" />
                      <circle cx="518" cy="179" r="1.5" />
                      <circle cx="536" cy="172" r="1.8" />
                      <circle cx="552" cy="169" r="1.3" />
                      {clampedDust >= 20 && (
                        <>
                          <circle cx="510" cy="160" r="1.5" />
                          <circle cx="538" cy="150" r="1.6" />
                          <circle cx="507" cy="184" r="1.8" />
                          <circle cx="529" cy="175" r="1.4" />
                          <circle cx="545" cy="174" r="1.7" />
                        </>
                      )}
                    </g>
                  </g>
                )}
              </g>

              <text
                x="512"
                y="112"
                textAnchor="middle"
                fill="#EAF2FF"
                fontSize="10"
                fontWeight="600"
              >
                SOLAR &amp; POWER
              </text>
              {clampedDust >= 15 && (
                <g transform="translate(524, 96)">
                  <rect
                    x="-34"
                    y="-9"
                    width="68"
                    height="14"
                    rx="3"
                    fill="#080D1B"
                    stroke="#FFB547"
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="1"
                    textAnchor="middle"
                    fill="#FFB547"
                    fontSize="8"
                    fontWeight="700"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {clampedDust}% DUSTY
                  </text>
                </g>
              )}
            </g>

            {/* Bottom Sector Coordinates Caption */}
            <text
              x="16"
              y="281"
              fill="#A8B6CC"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              JEZERO SECTOR · ELEV -2,700 M · THIN CO2 AIR
            </text>
          </svg>
        </div>

        {/* Clickable Mars Surface View Strip (Opens Interactive Mars Photo Explorer Modal) */}
        <button
          type="button"
          onClick={handleOpenSurfaceModal}
          aria-label={`Open full Mars Surface View photo: ${
            isLiveSurfacePhoto
              ? activePhoto?.title
              : 'Jezero Crater Landing Zone'
          }`}
          className="mt-3 w-full text-left relative rounded-lg bg-[#080D1B] border border-[#293A54] hover:border-[#29B6F6] hover:bg-[#0D162B] transition-all overflow-hidden flex items-center gap-3 p-2.5 group cursor-pointer"
        >
          <div className="relative w-24 h-16 rounded overflow-hidden shrink-0 border border-[#293A54]">
            <img
              src={surfaceImgSrc}
              alt={
                isLiveSurfacePhoto
                  ? activePhoto?.title ?? 'Mars Surface View from NASA Image Library'
                  : 'AI-generated Mars surface view at Jezero Crater'
              }
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => setSurfaceImgError(true)}
              className="w-full h-full object-cover block transition-transform duration-300 group-hover:scale-105"
            />
            {!isLiveSurfacePhoto && (
              <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-[#080D1B]/90 border border-[#293A54] text-[9px] font-mono-tabular text-[#A8B6CC] leading-none pointer-events-none">
                AI Image
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1 pr-1">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-mono-tabular font-semibold text-[#E4774E] inline-flex items-center gap-1.5">
                <span>Mars Surface View</span>
                <span className="text-[#29B6F6] inline-flex items-center gap-1 opacity-90 group-hover:underline">
                  <Maximize2 className="w-3 h-3" />
                  <span>Inspect ({modalPhotos.length})</span>
                </span>
              </p>
              <CornerWatermark
                label={
                  isLiveSurfacePhoto
                    ? 'Data: NASA Image Library'
                    : 'AI-Generated Image · Saved'
                }
              />
            </div>
            <p className="mt-0.5 text-xs font-semibold text-[#EAF2FF] truncate">
              {isLiveSurfacePhoto ? activePhoto?.title : 'Jezero Crater Landing Zone'}
            </p>
            <p className="text-[11px] text-[#A8B6CC] line-clamp-2 leading-snug">
              {isLiveSurfacePhoto
                ? activePhoto?.caption
                : 'Dusty iron-oxide rocks and layered crater rim.'}
            </p>
          </div>
        </button>

        {/* Interactive Module Selector Strip */}
        <div className="mt-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Habitat modules">
          {(
            [
              { id: 'lifeSupport', label: 'Life Support' },
              { id: 'radiationProtection', label: 'Shielded Core' },
              { id: 'power', label: 'Power Grid' },
            ] as { id: ResourceKey; label: string }[]
          ).map((tab) => {
            const active = selectedSystem === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleSelect(tab.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-[#1E3353] text-[#EAF2FF] border border-[#29B6F6]'
                    : 'bg-[#080D1B] text-[#A8B6CC] border border-[#293A54] hover:text-[#EAF2FF]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-[#293A54]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-mono-tabular text-[#A8B6CC]">
                {activeInfo.badgeLabel} · {activeInfo.quickStat}
              </p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: activeInfo.color }}>
                {activeInfo.title}
              </p>
            </div>
            {resources ? (
              <span className="text-sm font-bold font-mono-tabular text-[#EAF2FF]">
                {activePercent}%
              </span>
            ) : (
              onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('simulator')}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#29B6F6] hover:text-[#EAF2FF] shrink-0 cursor-pointer"
                >
                  <span>Test in Sim</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-[#A8B6CC]">
            {activeInfo.detail}
          </p>
        </div>
      </div>

      {/* Lazy Interactive Mars Surface Explorer Lightbox Modal */}
      {photoModalOpen && (
        <Suspense fallback={null}>
          <MarsPhotoModal
            isOpen={photoModalOpen}
            photos={modalPhotos}
            initialIndex={0}
            onClose={() => setPhotoModalOpen(false)}
            onOpenObservatory={
              onNavigate ? () => onNavigate('observatory') : undefined
            }
            onOpenSimulator={onNavigate ? () => onNavigate('simulator') : undefined}
          />
        </Suspense>
      )}
    </>
  );
}
