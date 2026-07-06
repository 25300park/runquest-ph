const requiredEnv = ['ADMIN_SECRET'];

function readEnv(name) {
  return process.env[name] ?? '';
}

function getSupabaseConfig() {
  return {
    url: readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL'),
    key: readEnv('SUPABASE_ANON_KEY') || readEnv('VITE_SUPABASE_ANON_KEY')
  };
}

async function checkSupabase() {
  const { url, key } = getSupabaseConfig();

  if (!url || !key) {
    return {
      ok: false,
      status: 0,
      message: 'Supabase environment variables are missing.'
    };
  }

  try {
    const response = await fetch(`${url}/rest/v1/users?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    return {
      ok: response.ok,
      status: response.status,
      message: response.ok ? 'Supabase reachable.' : response.statusText
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      message: error instanceof Error ? error.message : 'Supabase request failed.'
    };
  }
}

export default async function handler(request, response) {
  const adminSecret = readEnv('ADMIN_SECRET');
  const providedSecret = request.headers['x-admin-secret'];

  if (!adminSecret || providedSecret !== adminSecret) {
    response.status(401).json({
      ok: false,
      message: 'Health check requires deployment admin secret.'
    });
    return;
  }

  const missing = requiredEnv.filter((name) => !readEnv(name));
  const supabase = await checkSupabase();
  const ok = missing.length === 0 && supabase.ok;

  response.status(ok ? 200 : 503).json({
    ok,
    service: 'runquest-ph',
    checked_at: new Date().toISOString(),
    env: {
      adminSecret: missing.length === 0,
      supabaseUrl: Boolean(getSupabaseConfig().url),
      supabaseAnonKey: Boolean(getSupabaseConfig().key)
    },
    supabase,
    admin: {
      route: '/admin',
      protected: true
    }
  });
}
