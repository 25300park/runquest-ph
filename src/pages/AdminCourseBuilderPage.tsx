import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import CourseBuilderMap from '../components/map/CourseBuilderMap';
import { mockAreas } from '../data/mockAreas';
import type { LatLngTuple } from '../types/area';
import type {
  CheckpointType,
  CourseCheckpoint,
  CourseDraft,
  CourseDraftPoi,
  CourseDraftPoiType,
  Difficulty
} from '../types/course';
import { saveCourseDraft } from '../utils/courseDrafts';

type BuilderMode = 'route' | 'checkpoint' | 'poi';

const checkpointTypes: CheckpointType[] = ['START', 'CHECKPOINT', 'REST', 'VIEW', 'FINISH'];
const poiTypes: CourseDraftPoiType[] = ['Cafe', 'Toilet', 'Water', 'Viewpoint'];
const difficulties: Difficulty[] = ['Easy', 'Normal', 'Hard', 'Challenge'];

function calculateRouteDistanceKm(routePoints: LatLngTuple[]) {
  if (routePoints.length < 2) {
    return 0;
  }

  return routePoints.slice(1).reduce((total, point, index) => {
    const previousPoint = routePoints[index];
    const latDistance = (point[0] - previousPoint[0]) * 111;
    const lngDistance =
      (point[1] - previousPoint[1]) * 111 * Math.cos((point[0] * Math.PI) / 180);

    return total + Math.sqrt(latDistance ** 2 + lngDistance ** 2);
  }, 0);
}

export default function AdminCourseBuilderPage() {
  const [name, setName] = useState('');
  const [areaId, setAreaId] = useState(mockAreas[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [xpReward, setXpReward] = useState(200);
  const [mode, setMode] = useState<BuilderMode>('route');
  const [checkpointType, setCheckpointType] = useState<CheckpointType>('CHECKPOINT');
  const [poiType, setPoiType] = useState<CourseDraftPoiType>('Cafe');
  const [routePoints, setRoutePoints] = useState<LatLngTuple[]>([]);
  const [checkpoints, setCheckpoints] = useState<CourseCheckpoint[]>([]);
  const [pois, setPois] = useState<CourseDraftPoi[]>([]);
  const [lastSavedName, setLastSavedName] = useState('');
  const selectedArea = mockAreas.find((area) => area.id === areaId) ?? mockAreas[0];
  const routeDistanceKm = useMemo(() => calculateRouteDistanceKm(routePoints), [routePoints]);

  function handleMapClick(position: LatLngTuple) {
    if (mode === 'route') {
      setRoutePoints((currentPoints) => [...currentPoints, position]);
      return;
    }

    if (mode === 'checkpoint') {
      setCheckpoints((currentCheckpoints) => [
        ...currentCheckpoints,
        {
          id: `checkpoint-${Date.now()}`,
          name: `${checkpointType} ${currentCheckpoints.length + 1}`,
          type: checkpointType,
          position,
          distanceFromStartKm: routeDistanceKm
        }
      ]);
      return;
    }

    setPois((currentPois) => [
      ...currentPois,
      {
        id: `poi-${Date.now()}`,
        name: `${poiType} ${currentPois.length + 1}`,
        type: poiType,
        position
      }
    ]);
  }

  function clearBuilder() {
    setRoutePoints([]);
    setCheckpoints([]);
    setPois([]);
    setLastSavedName('');
  }

  function saveDraft() {
    const area = mockAreas.find((item) => item.id === areaId) ?? mockAreas[0];
    const draftName = name.trim() || `${area.name} Creator Route`;
    const draft: CourseDraft = {
      id: `draft-${Date.now()}`,
      name: draftName,
      areaId: area.id,
      areaName: area.name,
      difficulty,
      xpReward,
      status: 'draft',
      routeCoordinates: routePoints,
      checkpoints,
      pois,
      createdAt: new Date().toISOString()
    };

    saveCourseDraft(draft);
    setLastSavedName(draftName);
  }

  return (
    <section className="min-h-full bg-[#111816] text-stone-50">
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-amber-200">Creator world builder</p>
          <h1 className="mt-1 text-3xl font-black">Create a running course</h1>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Tap the map to draw route points, then switch modes to place checkpoints and POIs.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <label className="block">
            <span className="text-xs font-black uppercase text-stone-400">Course name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-stone-50 outline-none focus:ring-4 focus:ring-teal-500/20"
              placeholder="BGC Creator Loop"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="text-xs font-black uppercase text-stone-400">Area</span>
              <select
                value={areaId}
                onChange={(event) => setAreaId(event.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-stone-50"
              >
                {mockAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span className="text-xs font-black uppercase text-stone-400">Difficulty</span>
              <select
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-stone-50"
              >
                {difficulties.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span className="text-xs font-black uppercase text-stone-400">XP reward</span>
            <input
              value={xpReward}
              onChange={(event) => setXpReward(Number(event.target.value))}
              min={0}
              type="number"
              className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-stone-50"
            />
          </label>
        </div>
      </div>

      <div className="h-[58vh] min-h-[480px] overflow-hidden border-y border-stone-700">
        <CourseBuilderMap
          center={selectedArea.mapCenter}
          routePoints={routePoints}
          checkpoints={checkpoints}
          pois={pois}
          mode={mode}
          onMapClick={handleMapClick}
        />
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <div className="grid grid-cols-3 gap-2">
            {(['route', 'checkpoint', 'poi'] as BuilderMode[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMode(item)}
                className={`rounded-xl px-3 py-3 text-sm font-black capitalize ${
                  mode === item ? 'bg-amber-300 text-stone-950' : 'bg-stone-950 text-stone-300'
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {mode === 'checkpoint' && (
            <select
              value={checkpointType}
              onChange={(event) => setCheckpointType(event.target.value as CheckpointType)}
              className="mt-3 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-stone-50"
            >
              {checkpointTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}

          {mode === 'poi' && (
            <select
              value={poiType}
              onChange={(event) => setPoiType(event.target.value as CourseDraftPoiType)}
              className="mt-3 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-stone-50"
            >
              {poiTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">Points</p>
            <p className="font-black">{routePoints.length}</p>
          </div>
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">Km</p>
            <p className="font-black">{routeDistanceKm.toFixed(2)}</p>
          </div>
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">CP</p>
            <p className="font-black">{checkpoints.length}</p>
          </div>
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">POI</p>
            <p className="font-black">{pois.length}</p>
          </div>
        </div>

        {lastSavedName && (
          <div className="rounded-2xl border border-teal-200/30 bg-teal-950/30 p-3 text-sm font-bold text-teal-100">
            Saved draft: {lastSavedName}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={clearBuilder}
            className="rounded-2xl bg-stone-900 px-3 py-4 font-black text-stone-300"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={saveDraft}
            disabled={routePoints.length < 2}
            className="rounded-2xl bg-quest-teal px-3 py-4 font-black text-white disabled:bg-stone-800 disabled:text-stone-500"
          >
            Save Draft
          </button>
          <Link
            to="/admin/courses"
            className="rounded-2xl border border-amber-200 bg-amber-300 px-3 py-4 text-center font-black text-stone-950"
          >
            Drafts
          </Link>
        </div>
      </div>
    </section>
  );
}
