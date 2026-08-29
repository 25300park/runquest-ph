import { useEffect } from 'react';
import L from 'leaflet';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  Popup,
  TileLayer,
  useMap
} from 'react-leaflet';
import type { Area, LatLngTuple } from '../../types/area';
import type { Course, CourseCheckpoint } from '../../types/course';
import type { TerritoryZone } from '../../data/mockLandmarks';

type ExplorationMapProps = {
  areas: Area[];
  courses: Course[];
  selectedCourse: Course;
  userPosition: [number, number];
  onSelectCourse: (courseId: string) => void;
  territories?: TerritoryZone[];
  onSelectTerritory?: (territory: TerritoryZone) => void;
  userPath?: LatLngTuple[];
  isFollowingUser?: boolean;
  userAvatarUrl?: string;
};

const checkpointColors: Record<CourseCheckpoint['type'], string> = {
  START: '#22c55e',
  CHECKPOINT: '#facc15',
  REST: '#38bdf8',
  VIEW: '#a78bfa',
  VIEW_SPOT: '#a78bfa',
  WATER: '#0ea5e9',
  TOILET: '#94a3b8',
  CAFE: '#fb923c',
  CAUTION: '#fb7185',
  FINISH: '#f97316'
};

function createLabelIcon(label: string, className: string) {
  return L.divIcon({
    className: '',
    html: `<div class="${className}">${label}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
  });
}

function createLiveUserRadarIcon(avatarUrl: string = '/images/avatars/1.png') {
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex items-center justify-center">
        <!-- 1. 실시간 펄스 레이더 원 -->
        <div class="absolute w-12 h-12 rounded-full bg-blue-500/30 animate-ping"></div>
        <div class="absolute w-8 h-8 rounded-full bg-blue-500/40 animate-pulse"></div>
        
        <!-- 2. 유저 아바타 핀 -->
        <div class="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 p-0.5 shadow-xl flex items-center justify-center overflow-hidden z-10">
          <img src="${avatarUrl}" alt="You" class="w-full h-full object-contain filter drop-shadow-xs" />
        </div>
        
        <!-- 3. YOU 뱃지 -->
        <span class="absolute -bottom-4 px-2 py-0.2 rounded-full bg-blue-600 text-white text-[8px] font-black uppercase tracking-tight shadow-md border border-white z-20">
          YOU 📍
        </span>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
}

function create3DFloatingRulerIcon(avatarUrl: string, rulerName: string) {
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer transition-transform hover:scale-110">
        <span class="absolute -top-4 text-base z-20 animate-bounce filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.35)]">👑</span>
        <div class="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-300 via-yellow-200 to-white border-2 border-amber-400 shadow-[0_12px_24px_rgba(0,0,0,0.35)] flex items-center justify-center relative z-10 p-1 overflow-hidden">
          <img src="${avatarUrl}" alt="${rulerName}" class="w-full h-full object-contain filter drop-shadow-xs" />
        </div>
        <div class="w-7 h-2 rounded-full bg-black/35 blur-[2px] mt-1 -mb-1"></div>
        <span class="mt-1 px-2.5 py-0.5 rounded-full bg-slate-900/95 text-white text-[9px] font-black tracking-tight whitespace-nowrap shadow-lg border border-slate-700">
          ${rulerName.slice(0, 10)}
        </span>
      </div>
    `,
    iconSize: [52, 64],
    iconAnchor: [26, 32]
  });
}

const areaIcon = createLabelIcon(
  'ZONE',
  'grid h-10 w-10 place-items-center rounded-full border-2 border-violet-500 bg-white text-[10px] font-black text-violet-700 shadow-lg'
);

function FitSelectedRoute({ course }: { course: Course }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(course.routeCoordinates);
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 16 });
  }, [course, map]);

  return null;
}

function FollowUserLiveLocation({
  userPosition,
  isFollowing
}: {
  userPosition: [number, number];
  isFollowing: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (isFollowing && userPosition[0] !== 0 && userPosition[1] !== 0) {
      map.panTo(userPosition, { animate: true, duration: 0.8 });
    }
  }, [userPosition, isFollowing, map]);

  return null;
}

export default function ExplorationMap({
  areas,
  courses,
  selectedCourse,
  userPosition,
  onSelectCourse,
  territories = [],
  onSelectTerritory,
  userPath = [],
  isFollowingUser = false,
  userAvatarUrl = '/images/avatars/1.png'
}: ExplorationMapProps) {
  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={selectedCourse.startPoint}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full min-h-[520px] w-full"
      >
        <FitSelectedRoute course={selectedCourse} />
        <FollowUserLiveLocation userPosition={userPosition} isFollowing={isFollowingUser} />
        
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. 파스텔 톤 랜드마크 점령 구역 (Territory Zones) 하이라이트 & 3D 👑 지배자 마커 */}
        {territories.map((territory) => (
          <div key={territory.id}>
            <Circle
              center={territory.center}
              radius={territory.radiusMeters}
              pathOptions={{
                color: '#8b5cf6',
                fillColor: '#8b5cf6',
                fillOpacity: 0.16,
                weight: 2,
                dashArray: '6, 6'
              }}
              eventHandlers={{
                click: () => onSelectTerritory?.(territory)
              }}
            />
            <Marker
              position={territory.center}
              icon={create3DFloatingRulerIcon(territory.currentRulerAvatar, territory.currentRulerName)}
              eventHandlers={{
                click: () => onSelectTerritory?.(territory)
              }}
            />
          </div>
        ))}

        {areas.map((area) => (
          <Marker key={area.id} position={area.mapCenter} icon={areaIcon}>
            <Popup>
              <strong>{area.worldZone}</strong>
              <br />
              {area.name}
            </Popup>
          </Marker>
        ))}

        {courses.map((course) => {
          const isSelected = course.id === selectedCourse.id;

          return (
            <Polyline
              key={course.id}
              positions={course.routeCoordinates}
              pathOptions={{
                color: isSelected ? '#7c3aed' : '#94a3b8',
                weight: isSelected ? 7 : 4,
                opacity: isSelected ? 0.95 : 0.55
              }}
              eventHandlers={{
                click: () => onSelectCourse(course.id)
              }}
            />
          );
        })}

        {courses.flatMap((course) =>
          course.checkpoints.map((checkpoint) => {
            const isSelected = course.id === selectedCourse.id;

            return (
              <CircleMarker
                key={`${course.id}-${checkpoint.id}`}
                center={checkpoint.position}
                radius={
                  checkpoint.type === 'START' || checkpoint.type === 'FINISH'
                    ? isSelected
                      ? 11
                      : 8
                    : isSelected
                      ? 8
                      : 5
                }
                pathOptions={{
                  color: '#1e293b',
                  fillColor: checkpointColors[checkpoint.type],
                  fillOpacity: isSelected ? 1 : 0.72,
                  weight: isSelected ? 3 : 2
                }}
              >
                <Popup>
                  <strong>{checkpoint.type}</strong>
                  <br />
                  {course.name}
                  <br />
                  {checkpoint.name}
                </Popup>
              </CircleMarker>
            );
          })
        )}

        {/* 로컬 랜드마크 점령전 파스텔 구역 및 3D 플로팅 영주 핀 */}
        {territories?.map((territory) => (
          <div key={territory.id}>
            <Circle
              center={territory.center}
              radius={territory.radiusMeters}
              pathOptions={{
                color: territory.status === 'occupied' ? '#f59e0b' : '#ec4899',
                fillColor: territory.status === 'occupied' ? '#fef3c7' : '#fce7f3',
                fillOpacity: 0.35,
                weight: 2,
                dashArray: '6, 6'
              }}
              eventHandlers={{
                click: () => onSelectTerritory?.(territory)
              }}
            />
            <Marker
              position={territory.center}
              icon={create3DFloatingRulerIcon(territory.currentRulerAvatar, territory.currentRulerName)}
              eventHandlers={{
                click: () => onSelectTerritory?.(territory)
              }}
            >
              <Popup>
                <div className="text-center p-1 font-sans">
                  <span className="text-[10px] font-black text-amber-600 uppercase">👑 Territory Dominator</span>
                  <p className="font-black text-sm text-slate-900 mt-0.5">{territory.name}</p>
                  <p className="text-xs text-slate-600 mt-0.5">Ruler: <strong>{territory.currentRulerName}</strong></p>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">{territory.rewardBuff}</p>
                </div>
              </Popup>
            </Marker>
          </div>
        ))}

        {/* 실시간 유저 이동 궤적 라인 (Breadcrumb Polyline) */}
        {userPath.length >= 2 && (
          <Polyline
            positions={userPath}
            pathOptions={{
              color: '#3b82f6',
              weight: 5,
              opacity: 0.85,
              dashArray: '4, 8',
              lineCap: 'round'
            }}
          />
        )}

        {/* 실시간 유저 위치 펄스 레이더 마커 */}
        <Marker position={userPosition} icon={createLiveUserRadarIcon(userAvatarUrl)}>
          <Popup>
            <div className="text-center p-1 font-sans">
              <span className="text-[10px] font-black text-blue-600 uppercase">📍 My Live Location</span>
              <p className="font-bold text-xs text-slate-800 mt-0.5">실시간 GPS 추적 중</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                {userPosition[0].toFixed(5)}, {userPosition[1].toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
