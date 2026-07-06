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

function getProductionUrl(request) {
  const configuredUrl = readEnv('PRODUCTION_URL') || readEnv('VERCEL_PROJECT_PRODUCTION_URL') || readEnv('VERCEL_URL');

  if (configuredUrl) {
    return configuredUrl.startsWith('http') ? configuredUrl : `https://${configuredUrl}`;
  }

  const host = request.headers.host;
  return host ? `https://${host}` : '';
}

async function checkSupabase() {
  const { url, key } = getSupabaseConfig();
  const startedAt = Date.now();

  if (!url || !key) {
    return {
      ok: false,
      status: 0,
      latencyMs: 0,
      message: 'Supabase environment variables are missing.'
    };
  }

  try {
    const response = await fetch(`${url}/rest/v1/courses?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`
      }
    });

    return {
      ok: response.ok,
      status: response.status,
      latencyMs: Date.now() - startedAt,
      message: response.ok ? 'Supabase reachable.' : response.statusText
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Supabase request failed.'
    };
  }
}

async function checkAdminRoute(request) {
  const baseUrl = getProductionUrl(request);
  const startedAt = Date.now();

  if (!baseUrl) {
    return {
      ok: false,
      status: 0,
      latencyMs: 0,
      message: 'Production URL is unavailable.'
    };
  }

  try {
    const routeResponse = await fetch(`${baseUrl}/admin`, {
      redirect: 'manual'
    });

    return {
      ok: routeResponse.status >= 200 && routeResponse.status < 400,
      status: routeResponse.status,
      latencyMs: Date.now() - startedAt,
      message: routeResponse.status >= 200 && routeResponse.status < 400
        ? 'Admin route reachable.'
        : routeResponse.statusText
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      latencyMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : 'Admin route request failed.'
    };
  }
}

export default async function handler(request, response) {
  const startedAt = Date.now();
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
  const [supabase, adminRoute] = await Promise.all([
    checkSupabase(),
    checkAdminRoute(request)
  ]);
  const ok = missing.length === 0 && supabase.ok && adminRoute.ok;
  const latencyMs = Date.now() - startedAt;

  response.status(ok ? 200 : 503).json({
    ok,
    status: ok ? 'ok' : 'failed',
    service: 'runquest-ph',
    checked_at: new Date().toISOString(),
    supabase: supabase.ok,
    admin: adminRoute.ok,
    latency: `${latencyMs}ms`,
    env: {
      adminSecret: missing.length === 0,
      supabaseUrl: Boolean(getSupabaseConfig().url),
      supabaseAnonKey: Boolean(getSupabaseConfig().key)
    },
    checks: {
      supabase,
      admin: {
        ...adminRoute,
        route: '/admin',
        protected: true
      },
      auth: {
        ok: Boolean(getSupabaseConfig().url && getSupabaseConfig().key),
        message: 'Supabase Auth client environment is configured.'
      }
    }
  });
}
