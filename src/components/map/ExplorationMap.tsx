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
import type { Area } from '../../types/area';
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

const userIcon = createLabelIcon(
  'YOU',
  'grid h-10 w-10 place-items-center rounded-full border-2 border-amber-400 bg-gradient-to-tr from-violet-600 to-indigo-600 text-[10px] font-black text-white shadow-xl'
);

function FitSelectedRoute({ course }: { course: Course }) {
  const map = useMap();

  useEffect(() => {
    const bounds = L.latLngBounds(course.routeCoordinates);
    map.fitBounds(bounds, { padding: [34, 34], maxZoom: 16 });
  }, [course, map]);

  return null;
}

export default function ExplorationMap({
  areas,
  courses,
  selectedCourse,
  userPosition,
  onSelectCourse,
  territories = [],
  onSelectTerritory
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

        <Marker position={userPosition} icon={userIcon}>
          <Popup>Route preview position</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
