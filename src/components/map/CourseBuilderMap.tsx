import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngTuple } from '../../types/area';
import type { CourseCheckpoint, CourseDraftPoiType } from '../../types/course';

type BuilderMode = 'route' | 'checkpoint' | 'poi';

type CourseBuilderMapProps = {
  center: LatLngTuple;
  routePoints: LatLngTuple[];
  checkpoints: CourseCheckpoint[];
  pois: Array<{
    id: string;
    name: string;
    type: CourseDraftPoiType;
    position: LatLngTuple;
  }>;
  mode: BuilderMode;
  onMapClick: (position: LatLngTuple) => void;
};

const checkpointColor = '#facc15';
const poiColor = '#38bdf8';

function MapClickHandler({ onMapClick }: { onMapClick: (position: LatLngTuple) => void }) {
  useMapEvents({
    click(event) {
      onMapClick([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}

export default function CourseBuilderMap({
  center,
  routePoints,
  checkpoints,
  pois,
  mode,
  onMapClick
}: CourseBuilderMapProps) {
  return (
    <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full min-h-[480px] w-full">
      <MapClickHandler onMapClick={onMapClick} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routePoints.length > 1 && (
        <Polyline
          positions={routePoints}
          pathOptions={{
            color: '#facc15',
            weight: 7,
            opacity: 0.95
          }}
        />
      )}

      {routePoints.map((point, index) => (
        <CircleMarker
          key={`${point[0]}-${point[1]}-${index}`}
          center={point}
          radius={7}
          pathOptions={{
            color: '#111816',
            fillColor: mode === 'route' ? '#14b8a6' : '#64748b',
            fillOpacity: 1,
            weight: 3
          }}
        >
          <Popup>Route point {index + 1}</Popup>
        </CircleMarker>
      ))}

      {checkpoints.map((checkpoint) => (
        <CircleMarker
          key={checkpoint.id}
          center={checkpoint.position}
          radius={10}
          pathOptions={{
            color: '#111816',
            fillColor: checkpointColor,
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

      {pois.map((poi) => (
        <CircleMarker
          key={poi.id}
          center={poi.position}
          radius={8}
          pathOptions={{
            color: '#111816',
            fillColor: poiColor,
            fillOpacity: 1,
            weight: 3
          }}
        >
          <Popup>
            <strong>{poi.type}</strong>
            <br />
            {poi.name}
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
