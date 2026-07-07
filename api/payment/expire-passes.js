function readEnv(name) {
  return process.env[name] ?? '';
}

function isAuthorized(request) {
  const secret = readEnv('ADMIN_SECRET');
  if (!secret) return false;
  return request.headers.authorization === `Bearer ${secret}` || request.headers['x-admin-secret'] === secret;
}

function supabaseConfig() {
  const url = readEnv('SUPABASE_URL') || readEnv('VITE_SUPABASE_URL');
  const serviceKey = readEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!url || !serviceKey) {
    throw new Error('Supabase service role is not configured.');
  }

  return { url, serviceKey };
}

async function supabaseFetch(path, init = {}) {
  const { url, serviceKey } = supabaseConfig();
  const result = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {})
    }
  });

  if (!result.ok) {
    throw new Error(`Supabase request failed: ${result.status}`);
  }

  if (result.status === 204) return null;
  return result.json();
}

export default async function handler(request, response) {
  if (!['POST', 'GET'].includes(request.method ?? '')) {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!isAuthorized(request)) {
    response.status(401).json({ error: 'Admin secret required.' });
    return;
  }

  try {
    const now = new Date().toISOString();
    const expiredPasses = await supabaseFetch(
      `premium_passes?status=eq.active&end_date=lt.${encodeURIComponent(now)}`
    );

    if (!expiredPasses?.length) {
      response.status(200).json({ expired: 0 });
      return;
    }

    const userIds = Array.from(new Set(expiredPasses.map((pass) => pass.user_id).filter(Boolean)));
    await supabaseFetch(`premium_passes?status=eq.active&end_date=lt.${encodeURIComponent(now)}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'expired' })
    });

    await Promise.all(
      userIds.map((userId) =>
        supabaseFetch(`users?id=eq.${encodeURIComponent(userId)}`, {
          method: 'PATCH',
          body: JSON.stringify({
            subscription_type: 'free',
            subscription_status: 'expired',
            subscription_plan: 'free'
          })
        })
      )
    );

    response.status(200).json({ expired: expiredPasses.length, users: userIds.length });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : 'Pass expiration failed.' });
  }
}
