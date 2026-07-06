import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import CourseBuilderMap from '../components/CourseBuilderMap';
import GPXUploader, { type GeneratedCourseMetadata } from '../components/GPXUploader';
import { mockAreas } from '../data/mockAreas';
import type { LatLngTuple } from '../types/area';
import type { CheckpointType, CourseCheckpoint, Difficulty } from '../types/course';
import { isSupabaseConfigured } from '../lib/supabase';
import {
  getCourseById,
  saveRouteAsCourse,
  updateCourse,
  type CourseArea
} from '../services/courseService';
import {
  testFetchCourses,
  testInsertCourse,
  testSaveGPXCourse
} from '../services/supabaseTestService';
import { calculateRouteDistanceKm, estimatePaceLabel } from '../utils/route';

type SavedCourse = {
  id: string;
  name: string;
  areaName: string;
  difficulty: Difficulty;
  routePoints: LatLngTuple[];
  checkpoints: CourseCheckpoint[];
  databaseId?: string;
};

const difficulties: Difficulty[] = ['Easy', 'Normal', 'Hard', 'Challenge'];

function toDatabaseArea(areaName: string): CourseArea {
  if (areaName.includes('Makati')) {
    return 'Makati';
  }

  if (areaName.includes('MOA')) {
    return 'MOA';
  }

  return 'BGC';
}

function buildCheckpoints(routePoints: LatLngTuple[]): CourseCheckpoint[] {
  if (routePoints.length === 0) {
    return [];
  }

  return routePoints.map((point, index) => {
    const checkpointType: CheckpointType =
      index === 0 ? 'START' : index === routePoints.length - 1 ? 'FINISH' : 'CHECKPOINT';

    return {
      id: `builder-checkpoint-${index}`,
      name: `${checkpointType} ${index + 1}`,
      type: checkpointType,
      position: point,
      distanceFromStartKm: calculateRouteDistanceKm(routePoints.slice(0, index + 1))
    };
  });
}

export default function CourseBuilder() {
  const { courseId } = useParams();
  const [courseName, setCourseName] = useState('Creator Route');
  const [areaId, setAreaId] = useState(mockAreas[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [generatedXpReward, setGeneratedXpReward] = useState(0);
  const [paceEstimate, setPaceEstimate] = useState('Waiting for route');
  const [generatedMetadata, setGeneratedMetadata] = useState<GeneratedCourseMetadata | null>(null);
  const [routePoints, setRoutePoints] = useState<LatLngTuple[]>([]);
  const [gpxCheckpoints, setGpxCheckpoints] = useState<CourseCheckpoint[]>([]);
  const [savedCourses, setSavedCourses] = useState<SavedCourse[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [testStatus, setTestStatus] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [isLoadingCourse, setIsLoadingCourse] = useState(Boolean(courseId));
  const selectedArea = mockAreas.find((area) => area.id === areaId) ?? mockAreas[0];
  const checkpoints = useMemo(
    () => (gpxCheckpoints.length > 0 ? gpxCheckpoints : buildCheckpoints(routePoints)),
    [gpxCheckpoints, routePoints]
  );
  const routeDistanceKm = useMemo(() => calculateRouteDistanceKm(routePoints), [routePoints]);

  useEffect(() => {
    let isMounted = true;

    async function loadEditableCourse() {
      if (!courseId) {
        return;
      }

      try {
        setIsLoadingCourse(true);
        setSaveStatus('Loading course for editing...');
        const editableCourse = await getCourseById(courseId);

        if (!isMounted) {
          return;
        }

        if (!editableCourse) {
          setSaveStatus('Course not found.');
          return;
        }

        const matchingArea = mockAreas.find((area) => toDatabaseArea(area.name) === editableCourse.area);
        setCourseName(editableCourse.name);
        setAreaId(matchingArea?.id ?? mockAreas[0].id);
        setDifficulty(editableCourse.difficulty);
        setRoutePoints(
          editableCourse.course_points.map((point) => [point.lat, point.lng] as LatLngTuple)
        );
        setGpxCheckpoints([]);
        setGeneratedMetadata(null);
        setGeneratedXpReward(Math.round(editableCourse.distance * 100));
        setPaceEstimate(estimatePaceLabel(editableCourse.distance));
        setSaveStatus(`Editing Supabase course: ${editableCourse.id}`);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown course load error.';
        setSaveStatus(`Could not load course for editing. ${message}`);
      } finally {
        if (isMounted) {
          setIsLoadingCourse(false);
        }
      }
    }

    loadEditableCourse();

    return () => {
      isMounted = false;
    };
  }, [courseId]);

  function addRoutePoint(position: LatLngTuple) {
    setRoutePoints((currentPoints) => [...currentPoints, position]);
    setGpxCheckpoints([]);
    setGeneratedMetadata(null);
  }

  function moveRoutePoint(index: number, position: LatLngTuple) {
    setRoutePoints((currentPoints) =>
      currentPoints.map((point, pointIndex) => (pointIndex === index ? position : point))
    );
    setGpxCheckpoints([]);
    setGeneratedMetadata(null);
  }

  function deleteRoutePoint(index: number) {
    setRoutePoints((currentPoints) =>
      currentPoints.filter((_, pointIndex) => pointIndex !== index)
    );
    setGpxCheckpoints([]);
    setGeneratedMetadata(null);
  }

  function undoLastPoint() {
    setRoutePoints((currentPoints) => currentPoints.slice(0, -1));
    setGpxCheckpoints([]);
    setGeneratedMetadata(null);
  }

  function clearRoute() {
    setRoutePoints([]);
    setGpxCheckpoints([]);
    setGeneratedMetadata(null);
    setGeneratedXpReward(0);
    setPaceEstimate('Waiting for route');
  }

  function importRoute(coordinates: LatLngTuple[], metadata: GeneratedCourseMetadata) {
    setRoutePoints(coordinates);
    setCourseName(metadata.name);
    setDifficulty(metadata.difficulty);
    setGeneratedXpReward(metadata.xpReward);
    setPaceEstimate(metadata.paceEstimate);
    setGpxCheckpoints(metadata.checkpoints);
    setGeneratedMetadata(metadata);
  }

  async function saveCourse() {
    if (routePoints.length < 2) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('');
    let databaseId: string | undefined;
    const databaseArea = toDatabaseArea(selectedArea.name);
    const distance = routeDistanceKm;
    const fallbackId = `saved-course-${Date.now()}`;

    try {
      if (courseId) {
        databaseId = await updateCourse(
          {
            id: courseId,
            name: courseName.trim() || 'Creator Route',
            area: databaseArea,
            difficulty,
            distance
          },
          routePoints
        );
        setSaveStatus(`Updated Supabase course: ${databaseId}`);
      } else {
        databaseId = await saveRouteAsCourse(
          {
            name: courseName.trim() || 'Creator Route',
            area: databaseArea,
            difficulty,
            distance
          },
          routePoints
        );
        setSaveStatus(`Saved to Supabase: ${databaseId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Supabase save error.';
      setSaveStatus(
        isSupabaseConfigured
          ? `Supabase save failed. Saved locally only. ${message}`
          : 'Saved locally only. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env to enable database saves.'
      );
    }

    setSavedCourses((courses) => [
      {
        id: databaseId ?? fallbackId,
        name: courseName.trim() || 'Creator Route',
        areaName: selectedArea.name,
        difficulty,
        routePoints,
        checkpoints,
        databaseId
      },
      ...courses
    ]);
    setIsSaving(false);
  }

  async function runSupabaseTest(testName: 'insert' | 'fetch' | 'gpx') {
    setIsTestingSupabase(true);
    setTestStatus(`Running ${testName} test...`);

    try {
      if (testName === 'insert') {
        const result = await testInsertCourse();
        setTestStatus(`INSERT RESULT success: ${result.id}`);
      }

      if (testName === 'fetch') {
        const result = await testFetchCourses();
        setTestStatus(`FETCH RESULT success: ${result.length} courses found`);
      }

      if (testName === 'gpx') {
        const result = await testSaveGPXCourse(routePoints);
        setTestStatus(`GPX SAVE RESULT success: ${result.courseId}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Supabase test error.';
      setTestStatus(`${testName.toUpperCase()} test failed: ${message}`);
    } finally {
      setIsTestingSupabase(false);
    }
  }

  return (
    <section className="min-h-full bg-[#111816] text-stone-50">
      <div className="space-y-4 px-4 py-4">
        <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-amber-200">
            {courseId ? 'Course Edit Mode' : 'Course Creator'}
          </p>
          <h1 className="mt-1 text-3xl font-black">
            {courseId ? 'Edit RunQuest route' : 'Build a RunQuest route'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Click the map to add route points, or import a GPX file to render a saved route.
          </p>
        </div>

        <div className="grid gap-3 rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <label>
            <span className="text-xs font-black uppercase text-stone-400">Name</span>
            <input
              value={courseName}
              onChange={(event) => setCourseName(event.target.value)}
              disabled={isLoadingCourse}
              className="mt-2 w-full rounded-xl border border-stone-700 bg-stone-950 px-3 py-3 text-stone-50 outline-none focus:ring-4 focus:ring-teal-500/20"
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
        </div>

        <GPXUploader onRouteImported={importRoute} />

        <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-amber-200">Supabase test panel</p>
              <h2 className="mt-1 text-xl font-black">End-to-end DB checks</h2>
            </div>
            <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-quest-teal">
              {isSupabaseConfigured ? 'Configured' : 'Missing env'}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-stone-400">
            Buttons log INSERT RESULT, FETCH RESULT, and GPX SAVE RESULT in the browser console.
          </p>
          <div className="mt-4 grid gap-2">
            <button
              type="button"
              onClick={() => runSupabaseTest('insert')}
              disabled={isTestingSupabase}
              className="rounded-2xl bg-quest-teal px-4 py-3 font-black text-white disabled:bg-stone-800 disabled:text-stone-500"
            >
              Test Insert Course
            </button>
            <button
              type="button"
              onClick={() => runSupabaseTest('fetch')}
              disabled={isTestingSupabase}
              className="rounded-2xl bg-stone-950 px-4 py-3 font-black text-stone-100 disabled:text-stone-500"
            >
              Test Fetch Courses
            </button>
            <button
              type="button"
              onClick={() => runSupabaseTest('gpx')}
              disabled={isTestingSupabase}
              className="rounded-2xl border border-amber-200 bg-amber-300 px-4 py-3 font-black text-stone-950 disabled:border-stone-700 disabled:bg-stone-800 disabled:text-stone-500"
            >
              Test GPX Save
            </button>
          </div>
          {testStatus && (
            <div className="mt-4 rounded-xl bg-stone-950 p-3 text-sm font-bold text-stone-300">
              {testStatus}
            </div>
          )}
        </div>

        {generatedMetadata && (
          <div className="rounded-2xl border border-amber-200/30 bg-amber-300 p-4 text-stone-950">
            <p className="text-xs font-black uppercase">Auto course generated</p>
            <h2 className="mt-1 text-xl font-black">{generatedMetadata.name}</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-black">Distance:</span>{' '}
                {generatedMetadata.distanceKm.toFixed(2)} km
              </p>
              <p>
                <span className="font-black">XP:</span> {generatedMetadata.xpReward}
              </p>
              <p>
                <span className="font-black">Difficulty:</span> {generatedMetadata.difficulty}
              </p>
              <p>
                <span className="font-black">Pace:</span> {generatedMetadata.paceEstimate}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="h-[58vh] min-h-[500px] overflow-hidden border-y border-stone-700">
        <CourseBuilderMap
          center={selectedArea.mapCenter}
          routePoints={routePoints}
          checkpoints={checkpoints}
          onAddRoutePoint={addRoutePoint}
          onMoveRoutePoint={moveRoutePoint}
          onDeleteRoutePoint={deleteRoutePoint}
        />
      </div>

      <div className="space-y-4 px-4 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">Points</p>
            <p className="font-black">{routePoints.length}</p>
          </div>
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">Distance</p>
            <p className="font-black">{routeDistanceKm.toFixed(2)} km</p>
          </div>
          <div className="rounded-xl bg-stone-900 p-3">
            <p className="text-xs text-stone-500">Mode</p>
            <p className="font-black">{courseId ? 'Edit' : 'Create'}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-quest-teal">Generated metadata</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <p className="rounded-xl bg-stone-950 p-3">
              XP reward: <span className="font-black text-amber-200">{generatedXpReward || Math.round(routeDistanceKm * 100)}</span>
            </p>
            <p className="rounded-xl bg-stone-950 p-3">
              Pace: <span className="font-black">{generatedMetadata ? paceEstimate : estimatePaceLabel(routeDistanceKm)}</span>
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200/30 bg-stone-900 p-4">
          <p className="text-xs font-black uppercase text-amber-200">Editor controls</p>
          <p className="mt-1 text-sm text-stone-400">
            Drag markers to reposition. Click a marker to delete it.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={undoLastPoint}
              disabled={routePoints.length === 0}
              className="rounded-2xl bg-stone-950 px-3 py-4 font-black text-stone-200 disabled:text-stone-600"
            >
              Undo
            </button>
            <button
              type="button"
              onClick={clearRoute}
              disabled={routePoints.length === 0}
              className="rounded-2xl bg-stone-950 px-3 py-4 font-black text-stone-200 disabled:text-stone-600"
            >
              Clear All
            </button>
            <button
              type="button"
              onClick={saveCourse}
              disabled={routePoints.length < 2 || isSaving || isLoadingCourse}
              className="rounded-2xl border border-amber-200 bg-amber-300 px-3 py-4 font-black text-stone-950 disabled:border-stone-700 disabled:bg-stone-800 disabled:text-stone-500"
            >
              {isSaving ? 'Saving...' : courseId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={undoLastPoint}
            disabled={routePoints.length === 0}
            className="rounded-2xl bg-stone-900 px-4 py-4 font-black text-stone-300"
          >
            Undo Last Point
          </button>
          <button
            type="button"
            onClick={clearRoute}
            disabled={routePoints.length === 0}
            className="rounded-2xl bg-stone-900 px-4 py-4 font-black text-stone-300 disabled:text-stone-600"
          >
            Clear Route
          </button>
        </div>

        {saveStatus && (
          <div className="rounded-2xl border border-teal-200/30 bg-teal-950/30 p-4 text-sm font-bold text-teal-100">
            {saveStatus}
          </div>
        )}

        <div>
          <h2 className="font-black">Saved creator courses</h2>
          <div className="mt-3 grid gap-3">
            {savedCourses.length === 0 ? (
              <div className="rounded-2xl border border-stone-700 bg-stone-900 p-4 text-center text-sm text-stone-400">
                No saved creator courses yet.
              </div>
            ) : (
              savedCourses.map((course) => (
                <article key={course.id} className="rounded-2xl border border-stone-700 bg-stone-900 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase text-quest-teal">
                        {course.areaName}
                      </p>
                      <h3 className="mt-1 text-lg font-black">{course.name}</h3>
                    </div>
                    <span className="rounded-full bg-stone-950 px-3 py-1 text-xs font-black text-amber-200">
                      {course.difficulty}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-stone-400">
                    {course.routePoints.length} points · {course.checkpoints.length} checkpoints
                  </p>
                  {course.databaseId && (
                    <p className="mt-2 text-xs text-quest-teal">Database ID: {course.databaseId}</p>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
