import { createProvider } from './providers.js';

function readEnv(name) {
  return process.env[name] ?? '';
}

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    request.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    request.on('end', () => resolve(Buffer.concat(chunks)));
    request.on('error', reject);
  });
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

async function getExistingPass(provider, transactionId) {
  if (!transactionId) return null;
  const rows = await supabaseFetch(
    `premium_passes?payment_provider=eq.${encodeURIComponent(provider)}&transaction_id=eq.${encodeURIComponent(
      transactionId
    )}&limit=1`
  );
  return rows?.[0] ?? null;
}

async function getLatestActivePass(userId) {
  const rows = await supabaseFetch(
    `premium_passes?user_id=eq.${encodeURIComponent(
      userId
    )}&status=eq.active&order=end_date.desc&limit=1`
  );
  return rows?.[0] ?? null;
}

async function createPremiumPass({ userId, provider, transactionId, passDays }) {
  const existing = await getExistingPass(provider, transactionId);
  if (existing) {
    return { pass: existing, duplicate: true };
  }

  const latest = await getLatestActivePass(userId);
  const now = new Date();
  const startBase =
    latest?.end_date && new Date(latest.end_date).getTime() > now.getTime()
      ? new Date(latest.end_date)
      : now;
  const endDate = new Date(startBase.getTime() + passDays * 24 * 60 * 60 * 1000);
  const passRows = await supabaseFetch('premium_passes', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      user_id: userId,
      start_date: startBase.toISOString(),
      end_date: endDate.toISOString(),
      status: 'active',
      payment_provider: provider,
      transaction_id: transactionId
    })
  });

  await supabaseFetch(`users?id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      subscription_type: 'premium',
      subscription_status: 'active',
      subscription_plan: 'premium_30_day',
      premium_expires_at: endDate.toISOString(),
      payment_provider: provider,
      payment_reference: transactionId
    })
  });

  return { pass: passRows?.[0] ?? null, duplicate: false };
}

function providerNameFromRequest(request, event) {
  const requestUrl = new URL(request.url, `https://${request.headers.host}`);
  return (
    requestUrl.searchParams.get('provider') ||
    event.provider ||
    event.data?.attributes?.source?.type ||
    readEnv('PAYMENT_PROVIDER') ||
    'paymongo'
  );
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const rawBody = await readRawBody(request);
    const event = JSON.parse(rawBody.toString('utf8'));
    const providerName = providerNameFromRequest(request, event);
    const provider = createProvider(providerName);
    const verification = await provider.verifyPayment(
      event,
      request.headers['x-callback-token'] || request.headers['paymongo-signature'] || request.headers['x-signature']
    );

    if (!verification.verified) {
      response.status(400).json({ error: 'Payment verification failed.' });
      return;
    }

    await supabaseFetch('subscription_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: verification.userId,
        payment_provider: provider.name,
        payment_reference: verification.transactionId,
        event_type: event.type ?? 'payment.webhook',
        plan: 'premium_30_day',
        status: verification.status,
        amount_cents: verification.amountCents,
        currency: verification.currency
      })
    });

    if (verification.status !== 'paid') {
      response.status(200).json({ received: true, activated: false });
      return;
    }

    if (!verification.userId || !verification.transactionId) {
      response.status(400).json({ error: 'Paid webhook is missing user or transaction metadata.' });
      return;
    }

    const { duplicate, pass } = await createPremiumPass({
      userId: verification.userId,
      provider: provider.name,
      transactionId: verification.transactionId,
      passDays: Number(readEnv('PREMIUM_PASS_DAYS') || 30)
    });

    await supabaseFetch('revenue_events', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify({
        user_id: verification.userId,
        source: provider.name,
        amount_cents: verification.amountCents,
        currency: verification.currency,
        event_type: event.type ?? 'payment.paid'
      })
    });

    response.status(200).json({ received: true, activated: !duplicate, pass });
  } catch (error) {
    response.status(500).json({
      error: error instanceof Error ? error.message : 'Payment webhook failed.'
    });
  }
}
