import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngTuple } from '../types/area';
import type { CourseCheckpoint } from '../types/course';

type CourseBuilderMapProps = {
  center: LatLngTuple;
  routePoints: LatLngTuple[];
  checkpoints: CourseCheckpoint[];
  onAddRoutePoint: (position: LatLngTuple) => void;
};

function MapClickLayer({ onAddRoutePoint }: { onAddRoutePoint: (position: LatLngTuple) => void }) {
  useMapEvents({
    click(event) {
      onAddRoutePoint([event.latlng.lat, event.latlng.lng]);
    }
  });

  return null;
}

export default function CourseBuilderMap({
  center,
  routePoints,
  checkpoints,
  onAddRoutePoint
}: CourseBuilderMapProps) {
  const startPoint = routePoints[0];
  const finishPoint = routePoints[routePoints.length - 1];

  return (
    <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full min-h-[500px] w-full">
      <MapClickLayer onAddRoutePoint={onAddRoutePoint} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {routePoints.length > 1 && (
        <Polyline positions={routePoints} pathOptions={{ color: '#facc15', weight: 7 }} />
      )}

      {routePoints.map((point, index) => (
        <CircleMarker
          key={`${point[0]}-${point[1]}-${index}`}
          center={point}
          radius={index === 0 || index === routePoints.length - 1 ? 10 : 7}
          pathOptions={{
            color: '#111816',
            fillColor: index === 0 ? '#22c55e' : index === routePoints.length - 1 ? '#f97316' : '#14b8a6',
            fillOpacity: 1,
            weight: 3
          }}
        >
          <Popup>
            {index === 0 ? 'START' : index === routePoints.length - 1 ? 'FINISH' : 'CHECKPOINT'}{' '}
            point {index + 1}
          </Popup>
        </CircleMarker>
      ))}

      {checkpoints.map((checkpoint) => (
        <CircleMarker
          key={checkpoint.id}
          center={checkpoint.position}
          radius={9}
          pathOptions={{
            color: '#111816',
            fillColor: checkpoint.type === 'START' ? '#22c55e' : checkpoint.type === 'FINISH' ? '#f97316' : '#facc15',
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

      {startPoint && finishPoint && startPoint !== finishPoint && null}
    </MapContainer>
  );
}
