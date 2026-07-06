import { useEffect, useState } from 'react';
import {
  listAdminUsers,
  updateUserRole,
  updateUserStatus,
  type AdminRole,
  type AdminUser
} from './adminService';

const roles: AdminRole[] = ['admin', 'moderator', 'user'];
const statuses: AdminUser['status'][] = ['active', 'suspended', 'banned'];

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [status, setStatus] = useState('Loading users...');

  async function loadUsers() {
    try {
      setUsers(await listAdminUsers());
      setStatus('User access control ready.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not load users.');
    }
  }

  useEffect(() => {
    void loadUsers();
  }, []);

  return (
    <section className="space-y-4">
      <div className="rounded-lg border border-stone-800 bg-stone-950 p-4">
        <p className="text-xs font-black uppercase text-amber-200">RBAC</p>
        <h2 className="mt-1 text-2xl font-black">Admin Users</h2>
        <p className="mt-2 text-sm text-stone-400">{status}</p>
      </div>

      <div className="grid gap-3">
        {users.map((user) => (
          <article key={user.id} className="rounded-lg border border-stone-800 bg-stone-950 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-black">{user.email ?? 'No email'}</p>
                <p className="mt-1 text-xs text-stone-500">{user.id}</p>
              </div>
              <span className="rounded-md bg-stone-900 px-2 py-1 text-xs font-black uppercase text-amber-200">
                {user.role}
              </span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <select
                value={user.role}
                onChange={(event) =>
                  void updateUserRole(user.id, event.target.value as AdminRole).then(loadUsers)
                }
                className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <select
                value={user.status}
                onChange={(event) =>
                  void updateUserStatus(user.id, event.target.value as AdminUser['status']).then(loadUsers)
                }
                className="rounded-md border border-stone-700 bg-stone-900 px-3 py-2 text-sm"
              >
                {statuses.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
