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

function createRulerIcon(avatar: string, rulerName: string) {
  return L.divIcon({
    className: '',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer animate-bounce">
        <span class="absolute -top-3 text-sm z-10 filter drop-shadow">👑</span>
        <div class="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-200 to-yellow-100 border-2 border-amber-500 shadow-xl flex items-center justify-center text-xl">
          ${avatar}
        </div>
        <span class="mt-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-white text-[9px] font-black tracking-tight whitespace-nowrap shadow-md">
          ${rulerName.slice(0, 10)}
        </span>
      </div>
    `,
    iconSize: [48, 56],
    iconAnchor: [24, 28]
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

      {/* 랜드마크 점령 구역 (Territory Zones) 하이라이트 & 👑 지배자 마커 */}
      {territories.map((territory) => (
        <div key={territory.id}>
          <Circle
            center={territory.center}
            radius={territory.radiusMeters}
            pathOptions={{
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.18,
              weight: 2,
              dashArray: '6, 6'
            }}
            eventHandlers={{
              click: () => onSelectTerritory?.(territory)
            }}
          />
          <Marker
            position={territory.center}
            icon={createRulerIcon(territory.currentRulerAvatar, territory.currentRulerName)}
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
  );
}
