import { createPaymentWithFallback } from './providers.js';

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const body = await readJsonBody(request);
    if (!body.userId || !body.email) {
      response.status(400).json({ error: 'userId and email are required.' });
      return;
    }

    const payment = await createPaymentWithFallback({
      request,
      userId: body.userId,
      email: body.email
    });

    response.status(200).json({
      url: payment.checkoutUrl,
      provider: payment.provider,
      providerPaymentId: payment.providerPaymentId,
      plan: payment.plan,
      passDays: payment.passDays,
      pricePhp: payment.pricePhp
    });
  } catch (error) {
    response.status(503).json({
      error: error instanceof Error ? error.message : 'Premium Pass checkout failed.'
    });
  }
}
