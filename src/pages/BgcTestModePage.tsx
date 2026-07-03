import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Polyline, TileLayer } from 'react-leaflet';
import { mockCourses } from '../data/mockCourses';

type TestState = 'idle' | 'running' | 'completed';

export default function BgcTestModePage() {
  const course = mockCourses.find((item) => item.id === 'course-bgc-morning-loop') ?? mockCourses[0];
  const [testState, setTestState] = useState<TestState>('idle');
  const [tick, setTick] = useState(0);
  const progress = Math.min(100, Math.round((tick / 20) * 100));
  const pointIndex = Math.min(
    course.routeCoordinates.length - 1,
    Math.floor((progress / 100) * (course.routeCoordinates.length - 1))
  );
  const currentPosition = course.routeCoordinates[pointIndex] ?? course.startPoint;
  const completedSegment = course.routeCoordinates.slice(0, pointIndex + 1);
  const reachedCheckpoint = useMemo(
    () => {
      const reachedCheckpoints = course.checkpoints.filter(
        (checkpoint) => checkpoint.distanceFromStartKm <= course.distanceKm * (progress / 100)
      );

      return reachedCheckpoints[reachedCheckpoints.length - 1];
    },
    [course.checkpoints, course.distanceKm, progress]
  );
  const xpReward = Math.round(course.xpReward * (progress / 100));

  useEffect(() => {
    if (testState !== 'running') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTick((currentTick) => {
        const nextTick = currentTick + 1;
        if (nextTick >= 20) {
          setTestState('completed');
        }
        return nextTick;
      });
    }, 700);

    return () => window.clearInterval(timer);
  }, [testState]);

  function startRun() {
    setTick(0);
    setTestState('running');
  }

  return (
    <section className="min-h-full bg-[#111816] text-stone-50">
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-amber-200">BGC real test scenario</p>
          <h1 className="mt-1 text-3xl font-black">{course.name}</h1>
          <p className="mt-2 text-sm text-stone-400">
            Mock GPS movement, checkpoint tracking, and XP reward preview.
          </p>
        </div>
      </div>

      <div className="h-[54vh] min-h-[460px] overflow-hidden border-y border-stone-700">
        <MapContainer center={course.startPoint} zoom={16} scrollWheelZoom={false} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={course.routeCoordinates} color="#475569" weight={6} />
          <Polyline positions={completedSegment} color="#facc15" weight={7} />
          <Marker position={currentPosition} />
        </MapContainer>
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">Progress</p>
            <p className="font-black">{progress}%</p>
          </div>
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">XP</p>
            <p className="font-black text-amber-200">{xpReward}</p>
          </div>
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">State</p>
            <p className="font-black capitalize">{testState}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-quest-teal">Checkpoint tracking</p>
          <p className="mt-2 text-xl font-black">{reachedCheckpoint?.name ?? 'Waiting at start'}</p>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-stone-950">
            <div className="h-full rounded-full bg-amber-300" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <button
          type="button"
          onClick={startRun}
          className="w-full rounded-2xl border border-amber-200 bg-amber-300 px-4 py-4 font-black text-stone-950"
        >
          {testState === 'running' ? 'Restart Test Run' : 'Start Test Run'}
        </button>
      </div>
    </section>
  );
}
