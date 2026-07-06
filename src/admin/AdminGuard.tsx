import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentAdminProfile } from './adminService';
import type { AdminUser } from './adminService';

export function AdminGuard({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    let active = true;

    getCurrentAdminProfile()
      .then((currentProfile) => {
        if (!active) return;
        setProfile(currentProfile);
        setDenied(!currentProfile || currentProfile.role !== 'admin' || currentProfile.status !== 'active');
      })
      .catch(() => {
        if (!active) return;
        setDenied(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="grid min-h-screen place-items-center bg-[#0f1412] px-4 text-stone-100">
        <div className="rounded-lg border border-stone-700 bg-stone-900 p-5 text-sm font-bold">
          Checking admin access...
        </div>
      </section>
    );
  }

  if (denied || !profile) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}
