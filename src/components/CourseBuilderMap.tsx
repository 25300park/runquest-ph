import L from 'leaflet';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMapEvents } from 'react-leaflet';
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
      index === 0 ? '#10b981' : index === routePoints.length - 1 ? '#f59e0b' : '#8b5cf6';

    return L.divIcon({
      className: '',
      html: `<div style="height:32px;width:32px;border-radius:9999px;border:2.5px solid white;background:${color};display:grid;place-items:center;color:white;font-weight:900;font-size:11px;box-shadow:0 8px 20px rgba(0,0,0,.25);">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full min-h-[500px] w-full">
        <MapClickLayer onAddRoutePoint={onAddRoutePoint} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 1. Fog of War 실시간 50m Reveal 광원 효과 */}
        {routePoints.map((point, index) => (
          <Circle
            key={`fog-reveal-${index}`}
            center={point}
            radius={50}
            pathOptions={{
              color: '#8b5cf6',
              fillColor: '#8b5cf6',
              fillOpacity: 0.12,
              weight: 1,
              dashArray: '3, 3'
            }}
          />
        ))}

        {/* 2. 네온 이동 궤적 라인 */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#7c3aed',
              weight: 7,
              opacity: 0.95
            }}
          />
        )}

        {/* 3. 포인트 마커들 */}
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
            radius={8}
            pathOptions={{
              color: '#ffffff',
              fillColor: checkpoint.type === 'START' ? '#10b981' : checkpoint.type === 'FINISH' ? '#f59e0b' : '#8b5cf6',
              fillOpacity: 1,
              weight: 2
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

      {/* Fog of War 반투명 안내 워터마크 뱃지 */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-black text-amber-300 backdrop-blur-md border border-slate-700">
        🌫️ Fog of War: 50m Scout Active
      </div>
    </div>
  );
}
