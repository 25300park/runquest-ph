import { useEffect } from 'react';
import L from 'leaflet';
import {
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

type ExplorationMapProps = {
  areas: Area[];
  courses: Course[];
  selectedCourse: Course;
  userPosition: [number, number];
  onSelectCourse: (courseId: string) => void;
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

const areaIcon = createLabelIcon(
  'ZONE',
  'grid h-10 w-10 place-items-center rounded-full border-2 border-teal-200 bg-stone-950 text-[9px] font-black text-teal-200 shadow-lg'
);

const userIcon = createLabelIcon(
  'YOU',
  'grid h-10 w-10 place-items-center rounded-full border-2 border-amber-200 bg-quest-teal text-[10px] font-black text-white shadow-[0_0_24px_rgba(20,184,166,0.7)]'
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
  onSelectCourse
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
              color: isSelected ? '#facc15' : '#14b8a6',
              weight: isSelected ? 8 : 4,
              opacity: isSelected ? 0.95 : 0.55
            }}
            eventHandlers={{
              click: () => onSelectCourse(course.id)
            }}
          />
        );
      })}

      {selectedCourse.checkpoints.map((checkpoint) => (
        <CircleMarker
          key={checkpoint.id}
          center={checkpoint.position}
          radius={checkpoint.type === 'START' || checkpoint.type === 'FINISH' ? 11 : 8}
          pathOptions={{
            color: '#111816',
            fillColor: checkpointColors[checkpoint.type],
            fillOpacity: 1,
            weight: 3
          }}
        >
          <Popup>
            <strong>{checkpoint.type}</strong>
            <br />
            {checkpoint.name}
          </Popup>
        </CircleMarker>
      ))}

      <Marker position={userPosition} icon={userIcon}>
        <Popup>Mock current position</Popup>
      </Marker>
    </MapContainer>
  );
}
