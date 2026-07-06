import { useEffect, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getCurrentAdminProfile } from './adminService';

const adminDebugBypass =
  import.meta.env.DEV && import.meta.env.VITE_ADMIN_DEBUG_BYPASS === 'true';

export function AdminGuard({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [redirectTo, setRedirectTo] = useState<string | null>(null);

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
          setRedirectTo('/login');
          return;
        }

        if (currentProfile.role !== 'admin' || currentProfile.status !== 'active') {
          setRedirectTo('/login');
        }
      })
      .catch(() => {
        if (!active) return;
        setRedirectTo('/login');
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

  if (redirectTo) {
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}
