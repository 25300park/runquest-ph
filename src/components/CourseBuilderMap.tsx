import L from 'leaflet';
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
import type { LatLngTuple } from '../types/area';
import type { CourseCheckpoint } from '../types/course';

type CourseBuilderMapProps = {
  center: LatLngTuple;
  routePoints: LatLngTuple[];
  checkpoints: CourseCheckpoint[];
  onAddRoutePoint: (position: LatLngTuple) => void;
  onMoveRoutePoint: (index: number, position: LatLngTuple) => void;
  onDeleteRoutePoint: (index: number) => void;
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
  onAddRoutePoint,
  onMoveRoutePoint,
  onDeleteRoutePoint
}: CourseBuilderMapProps) {
  function createPointIcon(index: number) {
    const label =
      index === 0 ? 'S' : index === routePoints.length - 1 ? 'F' : String(index + 1);
    const color =
      index === 0 ? '#22c55e' : index === routePoints.length - 1 ? '#f97316' : '#14b8a6';

    return L.divIcon({
      className: '',
      html: `<div style="height:34px;width:34px;border-radius:9999px;border:3px solid #111816;background:${color};display:grid;place-items:center;color:white;font-weight:900;box-shadow:0 10px 24px rgba(0,0,0,.35);">${label}</div>`,
      iconSize: [34, 34],
      iconAnchor: [17, 17]
    });
  }

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
        <Marker
          key={`route-point-${index}-${point[0]}-${point[1]}`}
          position={point}
          draggable
          icon={createPointIcon(index)}
          eventHandlers={{
            click: () => onDeleteRoutePoint(index),
            dragend: (event) => {
              const marker = event.target as L.Marker;
              const nextPosition = marker.getLatLng();
              onMoveRoutePoint(index, [nextPosition.lat, nextPosition.lng]);
            }
          }}
        >
          <Popup>
            {index === 0 ? 'START' : index === routePoints.length - 1 ? 'FINISH' : 'CHECKPOINT'}{' '}
            point {index + 1}
            <br />
            Drag to move. Click marker to delete.
          </Popup>
        </Marker>
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
    </MapContainer>
  );
}
