import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { getCurrentAdminProfile } from './adminService';

const adminDebugBypass =
  import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEBUG_BYPASS === 'true';

export function AdminGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    if (adminDebugBypass) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    getCurrentAdminProfile()
      .then((currentProfile) => {
        if (!active) return;
        if (!currentProfile) {
          setRedirectTo('/admin/login');
          return;
        }

        if (currentProfile.role !== 'admin' || currentProfile.status !== 'active') {
          setRedirectTo('/admin/login');
        }
      })
      .catch((guardError) => {
        if (!active) return;
        setError(guardError instanceof Error ? guardError.message : 'Admin role check failed.');
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

  if (error) {
    return (
      <section className="grid min-h-screen place-items-center bg-[#0f1412] px-4 text-stone-100">
        <div className="max-w-sm rounded-lg border border-red-400/30 bg-red-950/30 p-5 text-sm text-red-100">
          <p className="font-bold">Admin access check failed.</p>
          <p className="mt-2 text-red-200">{error}</p>
        </div>
      </section>
    );
  }

  if (redirectTo) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  return children;
}
