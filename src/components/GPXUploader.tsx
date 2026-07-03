import { gpx } from 'togeojson';
import type { LatLngTuple } from '../types/area';
import type { CourseCheckpoint, Difficulty } from '../types/course';
import { calculateRouteDistanceKm, estimatePaceLabel, estimateRouteDifficulty } from '../utils/route';

export type GeneratedCourseMetadata = {
  name: string;
  distanceKm: number;
  difficulty: Difficulty;
  paceEstimate: string;
  xpReward: number;
  checkpoints: CourseCheckpoint[];
};

type GPXUploaderProps = {
  onRouteImported: (coordinates: LatLngTuple[], metadata: GeneratedCourseMetadata) => void;
};

function extractCoordinates(featureCollection: GeoJSON.FeatureCollection): LatLngTuple[] {
  const routeCoordinates: LatLngTuple[] = [];

  featureCollection.features.forEach((feature) => {
    if (feature.geometry.type === 'LineString') {
      feature.geometry.coordinates.forEach(([lng, lat]) => {
        routeCoordinates.push([lat, lng]);
      });
    }

    if (feature.geometry.type === 'MultiLineString') {
      feature.geometry.coordinates.flat().forEach(([lng, lat]) => {
        routeCoordinates.push([lat, lng]);
      });
    }
  });

  return routeCoordinates;
}

function generateCheckpoints(coordinates: LatLngTuple[]) {
  if (coordinates.length === 0) {
    return [];
  }

  const midpointIndex = Math.floor(coordinates.length / 2);
  const checkpointSeeds = [
    { type: 'START' as const, name: 'Generated Start', point: coordinates[0] },
    {
      type: 'CHECKPOINT' as const,
      name: 'Generated Midpoint',
      point: coordinates[midpointIndex]
    },
    {
      type: 'FINISH' as const,
      name: 'Generated Finish',
      point: coordinates[coordinates.length - 1]
    }
  ];

  return checkpointSeeds.map((checkpoint, index) => ({
    id: `gpx-checkpoint-${checkpoint.type.toLowerCase()}-${index}`,
    name: checkpoint.name,
    type: checkpoint.type,
    position: checkpoint.point,
    distanceFromStartKm:
      index === 0
        ? 0
        : calculateRouteDistanceKm(
            coordinates.slice(0, index === 1 ? midpointIndex + 1 : coordinates.length)
          )
  }));
}

function createGeneratedMetadata(fileName: string, coordinates: LatLngTuple[]): GeneratedCourseMetadata {
  const distanceKm = calculateRouteDistanceKm(coordinates);
  const difficulty = estimateRouteDifficulty(distanceKm);

  return {
    name: fileName.replace(/\.gpx$/i, '').replace(/[-_]/g, ' ') || 'Imported GPX Course',
    distanceKm,
    difficulty,
    paceEstimate: estimatePaceLabel(distanceKm),
    xpReward: Math.round(distanceKm * 100),
    checkpoints: generateCheckpoints(coordinates)
  };
}

export default function GPXUploader({ onRouteImported }: GPXUploaderProps) {
  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const gpxText = await file.text();
    const gpxDocument = new DOMParser().parseFromString(gpxText, 'application/xml');
    const featureCollection = gpx(gpxDocument);
    const coordinates = extractCoordinates(featureCollection);

    if (coordinates.length > 0) {
      onRouteImported(coordinates, createGeneratedMetadata(file.name, coordinates));
    }
  }

  return (
    <label className="block rounded-2xl border border-dashed border-teal-200/40 bg-teal-950/30 p-4">
      <span className="text-xs font-black uppercase text-quest-teal">GPX import</span>
      <span className="mt-1 block text-sm leading-6 text-stone-300">
        Upload a .gpx file to auto-generate distance, difficulty, pace, and checkpoints.
      </span>
      <input
        type="file"
        accept=".gpx,application/gpx+xml"
        onChange={handleFileChange}
        className="mt-3 w-full text-sm text-stone-300 file:mr-3 file:rounded-xl file:border-0 file:bg-amber-300 file:px-3 file:py-2 file:font-black file:text-stone-950"
      />
    </label>
  );
}
