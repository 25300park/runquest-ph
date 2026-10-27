import { useState, useEffect } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap
} from 'react-leaflet';
import type { GmLiveRunner, GmRaidEvent } from '../adminService';

interface LiveMapRadarProps {
  runners: GmLiveRunner[];
  raids: GmRaidEvent[];
  onOpenRaidModal: (coords: { lat: number; lng: number }) => void;
}

// Controller to smoothly pan map on region change
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
  }, [center, zoom, map]);
  return null;
}

// Custom Marker Generator for Runners
function createRunnerIcon(colorHex: string, nickname: string) {
  return L.divIcon({
    className: 'custom-runner-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 9999px; background-color: ${colorHex}; opacity: 0.35; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; width: 20px; height: 20px; border-radius: 9999px; background-color: ${colorHex}; border: 2px solid white; box-shadow: 0 0 10px ${colorHex}; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 900; color: white;">
          🏃
        </div>
        <div style="position: absolute; top: -18px; white-space: nowrap; font-size: 10px; font-weight: 800; background: rgba(0,0,0,0.85); color: #F1F5F9; padding: 1px 5px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.2);">
          ${nickname}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
}

// Custom Marker Generator for Raid Bosses & Flash Mobs
function createRaidIcon(type: 'Boss' | 'FlashMob' | 'Raid') {
  const isBoss = type === 'Boss';
  const bg = isBoss ? '#EF4444' : '#8B5CF6';
  const emoji = isBoss ? '👾' : '⚡';

  return L.divIcon({
    className: 'custom-raid-icon',
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 44px; height: 44px;">
        <div style="position: absolute; width: 44px; height: 44px; border-radius: 9999px; background-color: ${bg}; opacity: 0.4; animation: pulse 2s infinite;"></div>
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 9999px; background-color: ${bg}; border: 2px solid white; box-shadow: 0 0 16px ${bg}; display: flex; align-items: center; justify-content: center; font-size: 14px;">
          ${emoji}
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22]
  });
}

const REGION_PRESETS = [
  { name: 'Makati CBD', center: [14.5573, 121.0232] as [number, number], zoom: 15 },
  { name: 'BGC Taguig', center: [14.5204, 121.0504] as [number, number], zoom: 15 },
  { name: 'Metro Manila Wide', center: [14.5388, 121.0368] as [number, number], zoom: 13 }
];

export default function LiveMapRadar({ runners, raids, onOpenRaidModal }: LiveMapRadarProps) {
  const [currentRegion, setCurrentRegion] = useState(REGION_PRESETS[0]);
  const [radarRadius, setRadarRadius] = useState<number>(1500); // 1.5km radar

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950 p-4 shadow-2xl space-y-4">
      {/* Radar Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-lg font-black tracking-wide text-white">LIVE MAP RADAR (POSTGIS GIST)</h2>
          </div>
          <p className="text-xs text-stone-400 mt-0.5">
            Realtime GPS Telemetry & O2O Raid Coverage Radius Monitor
          </p>
        </div>

        {/* Region Shortcuts & Raid Trigger */}
        <div className="flex flex-wrap items-center gap-2">
          {REGION_PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => setCurrentRegion(preset)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                currentRegion.name === preset.name
                  ? 'bg-amber-400 text-stone-950 shadow-md shadow-amber-400/20'
                  : 'bg-stone-900 text-stone-300 hover:bg-stone-800'
              }`}
            >
              {preset.name}
            </button>
          ))}

          <button
            type="button"
            onClick={() => onOpenRaidModal({ lat: currentRegion.center[0], lng: currentRegion.center[1] })}
            className="rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-3 py-1.5 text-xs font-black text-white shadow-lg shadow-red-500/20 hover:from-red-500 hover:to-rose-500 transition-all flex items-center gap-1"
          >
            <span>⚡ Spawn Raid Here</span>
          </button>
        </div>
      </div>

      {/* Map Stats Header */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="rounded-lg bg-stone-900/80 p-2 border border-stone-800/80">
          <p className="text-stone-500 font-bold uppercase text-[10px]">Active Tracked Runners</p>
          <p className="text-base font-black text-emerald-400">{runners.length} Online</p>
        </div>
        <div className="rounded-lg bg-stone-900/80 p-2 border border-stone-800/80">
          <p className="text-stone-500 font-bold uppercase text-[10px]">Active Raids / Bosses</p>
          <p className="text-base font-black text-rose-400">{raids.filter(r => r.status === 'ACTIVE').length} Active</p>
        </div>
        <div className="rounded-lg bg-stone-900/80 p-2 border border-stone-800/80">
          <p className="text-stone-500 font-bold uppercase text-[10px]">Current Patrol Center</p>
          <p className="text-xs font-mono font-bold text-stone-300 truncate">
            {currentRegion.center[0].toFixed(4)}, {currentRegion.center[1].toFixed(4)}
          </p>
        </div>
        <div className="rounded-lg bg-stone-900/80 p-2 border border-stone-800/80 flex items-center justify-between">
          <div>
            <p className="text-stone-500 font-bold uppercase text-[10px]">PostGIS Scan Radius</p>
            <p className="text-xs font-bold text-amber-300">{radarRadius}m (ST_DWithin)</p>
          </div>
          <select
            value={radarRadius}
            onChange={(e) => setRadarRadius(Number(e.target.value))}
            className="rounded bg-stone-800 px-2 py-1 text-xs font-bold text-white border border-stone-700"
          >
            <option value={500}>500m</option>
            <option value={1000}>1,000m</option>
            <option value={1500}>1,500m</option>
            <option value={3000}>3,000m</option>
          </select>
        </div>
      </div>

      {/* Leaflet Map Canvas */}
      <div className="relative h-[480px] w-full overflow-hidden rounded-xl border border-stone-800 bg-black">
        <MapContainer
          center={currentRegion.center}
          zoom={currentRegion.zoom}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#09090b' }}
        >
          {/* CartoDB Dark Matter / OpenStreetMap Dark Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          <MapViewController center={currentRegion.center} zoom={currentRegion.zoom} />

          {/* GM Radar Scan Coverage Boundary */}
          <Circle
            center={currentRegion.center}
            radius={radarRadius}
            pathOptions={{
              color: '#F59E0B',
              fillColor: '#F59E0B',
              fillOpacity: 0.08,
              dashArray: '6, 6',
              weight: 1.5
            }}
          />

          {/* Active Runners */}
          {runners.map((runner) => (
            <Marker
              key={runner.user_id}
              position={[runner.latitude, runner.longitude]}
              icon={createRunnerIcon(runner.color_hex, runner.nickname)}
            >
              <Popup className="custom-dark-popup">
                <div className="text-stone-900 p-1 space-y-1">
                  <p className="font-black text-sm">{runner.nickname}</p>
                  <p className="text-xs font-bold" style={{ color: runner.color_hex }}>
                    Faction: {runner.faction_name}
                  </p>
                  <p className="text-xs">XP: <span className="font-bold">{runner.total_xp.toLocaleString()}</span></p>
                  {runner.pace && <p className="text-xs">Live Pace: <span className="font-mono font-bold">{runner.pace}</span></p>}
                  <p className="text-[10px] text-stone-500 font-mono">
                    Coords: {runner.latitude.toFixed(4)}, {runner.longitude.toFixed(4)}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active O2O Raids and Event Areas */}
          {raids.map((raid) => (
            <div key={raid.id}>
              {/* Event Area Radius (ST_DWithin boundary) */}
              <Circle
                center={[raid.latitude, raid.longitude]}
                radius={raid.radius_meters}
                pathOptions={{
                  color: raid.event_type === 'Boss' ? '#EF4444' : '#8B5CF6',
                  fillColor: raid.event_type === 'Boss' ? '#EF4444' : '#8B5CF6',
                  fillOpacity: 0.2,
                  weight: 2
                }}
              />
              <Marker
                position={[raid.latitude, raid.longitude]}
                icon={createRaidIcon(raid.event_type)}
              >
                <Popup className="custom-dark-popup">
                  <div className="text-stone-900 p-1 space-y-1 min-w-[180px]">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                        {raid.event_type}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-600">● {raid.status}</span>
                    </div>
                    <p className="font-black text-sm">{raid.title}</p>
                    <p className="text-xs text-stone-600">{raid.description}</p>
                    <div className="border-t border-stone-200 pt-1 text-xs space-y-0.5">
                      <p>Target: <b>{raid.target_distance_km} km</b></p>
                      <p>Claim Radius: <b>{raid.radius_meters}m</b></p>
                      <p>Rewards: <b className="text-amber-600">{raid.reward_gold} Gold</b> / <b className="text-indigo-600">{raid.reward_xp} XP</b></p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </div>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
