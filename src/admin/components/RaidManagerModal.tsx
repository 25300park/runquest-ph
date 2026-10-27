import { useState } from 'react';
import type { GmRaidEvent } from '../adminService';

interface RaidManagerModalProps {
  isOpen: boolean;
  initialCoords: { lat: number; lng: number } | null;
  onClose: () => void;
  onSubmit: (eventData: Omit<GmRaidEvent, 'id' | 'status' | 'participants_count'>) => Promise<void>;
}

export default function RaidManagerModal({
  isOpen,
  initialCoords,
  onClose,
  onSubmit
}: RaidManagerModalProps) {
  const [title, setTitle] = useState('Makati FlashMob Guerrilla Sprint');
  const [description, setDescription] = useState('30-minute high intensity faction capture event.');
  const [eventType, setEventType] = useState<'Raid' | 'Boss' | 'FlashMob'>('FlashMob');
  const [lat, setLat] = useState(initialCoords?.lat ?? 14.5573);
  const [lng, setLng] = useState(initialCoords?.lng ?? 121.0232);
  const [radiusMeters, setRadiusMeters] = useState(200);
  const [targetDistanceKm, setTargetDistanceKm] = useState(2.0);
  const [rewardGold, setRewardGold] = useState(1000);
  const [rewardXp, setRewardXp] = useState(2000);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + durationMinutes * 60 * 1000);

      await onSubmit({
        title,
        description,
        event_type: eventType,
        latitude: lat,
        longitude: lng,
        radius_meters: radiusMeters,
        target_distance_km: targetDistanceKm,
        reward_gold: rewardGold,
        reward_xp: rewardXp,
        start_time: now.toISOString(),
        end_time: endTime.toISOString()
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-stone-700 bg-stone-900 p-6 shadow-2xl text-white space-y-5">
        <div className="flex items-center justify-between border-b border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <h3 className="text-lg font-black tracking-tight">Spawn O2O Guerrilla Raid</h3>
              <p className="text-xs text-stone-400">Deploy real-time location-based event via PostGIS</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-stone-400 hover:bg-stone-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-stone-300 mb-1">Event Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-300 mb-1">Event Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-white font-medium focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-300 mb-1">Event Type</label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value as 'Raid' | 'Boss' | 'FlashMob')}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-white font-bold"
              >
                <option value="FlashMob">⚡ FlashMob (Speed Sprint)</option>
                <option value="Boss">👾 World Boss (Guild Raid)</option>
                <option value="Raid">🛡️ Faction Outpost Capture</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-stone-300 mb-1">Duration (Minutes)</label>
              <input
                type="number"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                min={5}
                max={360}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-3 py-2 text-white font-medium"
              />
            </div>
          </div>

          {/* Coordinates & PostGIS Radius */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-bold text-stone-400 mb-1">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-stone-400 mb-1">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-1.5 font-mono text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-amber-300 mb-1">Claim Radius (m)</label>
              <input
                type="number"
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(Number(e.target.value))}
                min={50}
                max={2000}
                className="w-full rounded-lg border border-amber-500/50 bg-stone-950 px-2 py-1.5 font-bold text-amber-400"
              />
            </div>
          </div>

          {/* Target Distance & Rewards */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block font-bold text-stone-300 mb-1">Target Dist (km)</label>
              <input
                type="number"
                step="0.5"
                value={targetDistanceKm}
                onChange={(e) => setTargetDistanceKm(Number(e.target.value))}
                min={0.5}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-1.5 font-medium text-white"
              />
            </div>
            <div>
              <label className="block font-bold text-amber-300 mb-1">Reward Gold</label>
              <input
                type="number"
                value={rewardGold}
                onChange={(e) => setRewardGold(Number(e.target.value))}
                min={0}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-1.5 font-medium text-amber-300"
              />
            </div>
            <div>
              <label className="block font-bold text-indigo-300 mb-1">Reward XP</label>
              <input
                type="number"
                value={rewardXp}
                onChange={(e) => setRewardXp(Number(e.target.value))}
                min={0}
                className="w-full rounded-lg border border-stone-700 bg-stone-950 px-2 py-1.5 font-medium text-indigo-300"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 font-bold text-stone-400 hover:bg-stone-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2 font-black text-white shadow-lg shadow-red-500/30 hover:from-red-500 hover:to-rose-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Deploying...' : '🚀 Broadcast Raid Live'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
