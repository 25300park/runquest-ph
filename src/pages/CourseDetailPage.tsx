import { Link, useParams } from 'react-router-dom';
import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import { mockCourses } from '../data/mockCourses';

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const course = mockCourses.find((item) => item.id === courseId) ?? mockCourses[0];

  return (
    <section className="space-y-4 px-4 py-4">
      <div>
        <p className="text-sm font-bold text-quest-teal">{course.areaName}</p>
        <h1 className="mt-1 text-3xl font-black text-quest-ink">{course.name}</h1>
        <p className="mt-2 text-slate-600">{course.description}</p>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <MapContainer center={course.startPoint} zoom={15} scrollWheelZoom={false}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline positions={course.routeCoordinates} color="#14b8a6" />
          {course.checkpoints.map((checkpoint) => (
            <Marker key={checkpoint.id} position={checkpoint.position}>
              <Popup>{checkpoint.name}</Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Distance</p>
          <p className="font-bold">{course.distanceKm} km</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Reward</p>
          <p className="font-bold">{course.xpReward} XP</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-3">
          <p className="text-xs text-slate-500">Explore</p>
          <p className="font-bold">+{course.explorationReward}%</p>
        </div>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h2 className="font-bold text-amber-900">Safety notes</h2>
        <p className="mt-2 text-sm leading-6 text-amber-900">{course.safetyNotes}</p>
      </div>
      <Link
        to={`/activity/${course.id}`}
        className="block rounded-xl bg-quest-teal px-4 py-3 text-center font-bold text-white"
      >
        Start Course
      </Link>
    </section>
  );
}
