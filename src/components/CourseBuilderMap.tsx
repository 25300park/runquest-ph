import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { Circle, CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngTuple } from '../types/area';
import type { CheckpointType, CourseCheckpoint } from '../types/course';
import { extractCornerKeypoints } from '../utils/pathSimplification';

type CourseBuilderMapProps = {
  center: LatLngTuple;
  userLivePosition?: LatLngTuple | null;
  isTracking?: boolean;
  routePoints: LatLngTuple[];
  checkpoints?: CourseCheckpoint[];
  onAddRoutePoint: (position: LatLngTuple) => void;
  onMoveRoutePoint: (index: number, position: LatLngTuple) => void;
  onDeleteRoutePoint: (index: number) => void;
};

function MapController({
  position,
  isTracking
}: {
  position?: LatLngTuple | null;
  isTracking?: boolean;
}) {
  const map = useMap();
  const isFirstPanRef = useRef(true);

  useEffect(() => {
    if (position) {
      if (isFirstPanRef.current) {
        map.setView(position, 16, { animate: true });
        isFirstPanRef.current = false;
      } else if (isTracking) {
        map.panTo(position, { animate: true, duration: 0.5 });
      }
    }
  }, [position, isTracking, map]);

  return null;
}

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
  userLivePosition,
  isTracking,
  routePoints,
  onAddRoutePoint,
  onMoveRoutePoint,
  onDeleteRoutePoint
}: CourseBuilderMapProps) {
  // 🧭 코너(모서리) 각도 기반 핵심 키포인트만 추출 (직선 구간 24개 중첩 핀 방지)
  const cornerKeypoints = useMemo(
    () => extractCornerKeypoints(routePoints, 22, 35),
    [routePoints]
  );

  function createKeypointIcon(label: string, type: CheckpointType) {
    const color =
      type === 'START' ? '#10b981' : type === 'FINISH' ? '#f59e0b' : '#8b5cf6';

    return L.divIcon({
      className: '',
      html: `<div style="height:32px;width:32px;border-radius:9999px;border:2.5px solid white;background:${color};display:grid;place-items:center;color:white;font-weight:900;font-size:11px;box-shadow:0 8px 20px rgba(0,0,0,.28);">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer center={center} zoom={15} scrollWheelZoom className="h-full min-h-[500px] w-full">
        <MapController position={userLivePosition} isTracking={isTracking} />
        <MapClickLayer onAddRoutePoint={onAddRoutePoint} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* 0. 실시간 사용자 위치 펄스 마커 */}
        {userLivePosition && (
          <>
            <CircleMarker
              center={userLivePosition}
              radius={16}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#06b6d4',
                fillOpacity: 0.25,
                weight: 1.5
              }}
            />
            <CircleMarker
              center={userLivePosition}
              radius={7}
              pathOptions={{
                color: '#ffffff',
                fillColor: '#0284c7',
                fillOpacity: 1,
                weight: 2.5
              }}
            >
              <Popup>
                <strong>📍 현재 위치 (GPS)</strong>
              </Popup>
            </CircleMarker>
          </>
        )}

        {/* 1. Fog of War 실시간 50m Reveal 광원 효과 (코너 키포인트에만 생성하여 과부하 방지) */}
        {cornerKeypoints.map((kp) => (
          <Circle
            key={`fog-reveal-kp-${kp.originalIndex}`}
            center={kp.point}
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

        {/* 2. 네온 실시간 이동 궤적 라인 (햇빛 아래에서도 선명한 형광 네온 + 테두리) */}
        {(() => {
          const displayPoints =
            isTracking && userLivePosition && routePoints.length > 0
              ? [...routePoints, userLivePosition]
              : routePoints;

          if (displayPoints.length < 2) return null;

          return (
            <>
              {/* 외곽 테두리 (대비 강조) */}
              <Polyline
                positions={displayPoints}
                pathOptions={{
                  color: '#0f172a',
                  weight: 8,
                  opacity: 0.4
                }}
              />
              {/* 메인 네온 궤적 라인 */}
              <Polyline
                positions={displayPoints}
                pathOptions={{
                  color: isTracking ? '#f59e0b' : '#8b5cf6',
                  weight: 6,
                  opacity: 1
                }}
              />
            </>
          );
        })()}

        {/* 3. 코너(모서리) 핵심 포인트 마커만 렌더링 (S, Corner 1, Corner 2, F) */}
        {cornerKeypoints.map((kp) => (
          <Marker
            key={`corner-keypoint-${kp.originalIndex}-${kp.point[0]}-${kp.point[1]}`}
            position={kp.point}
            draggable
            icon={createKeypointIcon(kp.label, kp.type)}
            eventHandlers={{
              click: () => onDeleteRoutePoint(kp.originalIndex),
              dragend: (event) => {
                const marker = event.target as L.Marker;
                const nextPosition = marker.getLatLng();
                onMoveRoutePoint(kp.originalIndex, [nextPosition.lat, nextPosition.lng]);
              }
            }}
          >
            <Popup>
              <strong>
                {kp.type === 'START'
                  ? '🟢 출발점 (START)'
                  : kp.type === 'FINISH'
                  ? '🏁 도착점 (FINISH)'
                  : `📍 코너 ${kp.label} (${kp.turnAngleDeg ? `${kp.turnAngleDeg}° 턴` : '방향 전환'})`}
              </strong>
              <br />
              이동 거리: {kp.distanceFromStartKm.toFixed(2)}km
              <br />
              <span className="text-[10px] text-slate-400">드래그하여 위치 조정 가능</span>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Fog of War 반투명 안내 워터마크 뱃지 */}
      <div className="pointer-events-none absolute bottom-4 left-4 z-10 rounded-full bg-slate-900/80 px-3 py-1 text-[10px] font-black text-amber-300 backdrop-blur-md border border-slate-700">
        🌫️ Fog of War: 50m Scout Active
      </div>
    </div>
  );
}
