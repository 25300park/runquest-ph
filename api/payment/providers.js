function readEnv(name) {
  return process.env[name] ?? '';
}

function encodeBasicAuth(secret) {
  return Buffer.from(`${secret}:`).toString('base64');
}

function appUrlFromRequest(request) {
  return readEnv('PRODUCTION_URL') || `https://${request.headers.host}`;
}

function passConfig() {
  return {
    plan: 'premium_30_day',
    passDays: Number(readEnv('PREMIUM_PASS_DAYS') || 30),
    pricePhp: Number(readEnv('PREMIUM_PASS_PRICE_PHP') || 149)
  };
}

function normalizePaymentStatus(status) {
  if (['paid', 'succeeded', 'success', 'completed', 'active'].includes(String(status).toLowerCase())) {
    return 'paid';
  }
  if (['failed', 'cancelled', 'canceled', 'expired'].includes(String(status).toLowerCase())) {
    return 'failed';
  }
  return 'pending';
}

export class PaymentProvider {
  constructor(name) {
    this.name = name;
  }

  async createPayment() {
    throw new Error(`${this.name} createPayment() is not implemented.`);
  }

  async verifyPayment() {
    throw new Error(`${this.name} verifyPayment() is not implemented.`);
  }

  async getPaymentStatus() {
    throw new Error(`${this.name} getPaymentStatus() is not implemented.`);
  }
}

export class ManualPaymentProvider extends PaymentProvider {
  constructor() {
    super('manual');
  }

  async createPayment({ request, userId, email }) {
    const hostedPaymentUrl = readEnv('PREMIUM_PASS_PAYMENT_URL');
    if (!hostedPaymentUrl) {
      throw new Error('PREMIUM_PASS_PAYMENT_URL is required for manual Premium Pass checkout.');
    }

    const url = new URL(hostedPaymentUrl);
    const appUrl = appUrlFromRequest(request);
    const { plan, passDays, pricePhp } = passConfig();
    url.searchParams.set('user_id', userId);
    url.searchParams.set('email', email);
    url.searchParams.set('plan', plan);
    url.searchParams.set('success_url', `${appUrl}/rewards?billing=success`);
    url.searchParams.set('cancel_url', `${appUrl}/rewards?billing=cancelled`);

    return {
      provider: this.name,
      providerPaymentId: `manual-${Date.now()}`,
      checkoutUrl: url.toString(),
      plan,
      passDays,
      pricePhp
    };
  }

  async verifyPayment(event) {
    return {
      verified: true,
      status: normalizePaymentStatus(event.status ?? event.payment_status ?? 'pending'),
      transactionId: event.transaction_id ?? event.id ?? null,
      userId: event.user_id ?? event.metadata?.user_id ?? null,
      amountCents: event.amount_cents ?? event.amount ?? 0,
      currency: event.currency ?? 'PHP'
    };
  }

  async getPaymentStatus(status) {
    return normalizePaymentStatus(status);
  }
}

export class PayMongoProvider extends PaymentProvider {
  constructor() {
    super('paymongo');
  }

  async createPayment({ request, userId, email }) {
    const secretKey = readEnv('PAYMONGO_SECRET_KEY');
    if (!secretKey) {
      throw new Error('PAYMONGO_SECRET_KEY is not configured.');
    }

    const appUrl = appUrlFromRequest(request);
    const { plan, passDays, pricePhp } = passConfig();
    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodeBasicAuth(secretKey)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        data: {
          attributes: {
            billing: { email },
            description: 'RunQuest PH 30-day Premium Pass',
            line_items: [
              {
                name: 'RunQuest PH Premium Pass',
                description: '30-day access to Premium RunQuest PH features',
                amount: pricePhp * 100,
                currency: 'PHP',
                quantity: 1
              }
            ],
            payment_method_types: ['card', 'gcash', 'paymaya'],
            success_url: `${appUrl}/rewards?billing=success`,
            cancel_url: `${appUrl}/rewards?billing=cancelled`,
            metadata: {
              user_id: userId,
              plan,
              pass_days: String(passDays)
            }
          }
        }
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.errors?.[0]?.detail ?? 'PayMongo checkout failed.');
    }

    return {
      provider: this.name,
      providerPaymentId: data.data?.id ?? null,
      checkoutUrl: data.data?.attributes?.checkout_url,
      plan,
      passDays,
      pricePhp
    };
  }

  async verifyPayment(event, signatureHeader) {
    const eventObject = event.data?.attributes ?? event.data ?? event;
    return {
      verified: Boolean(signatureHeader || !readEnv('PAYMONGO_WEBHOOK_SECRET')),
      status: normalizePaymentStatus(eventObject.status ?? eventObject.payment_status),
      transactionId: event.data?.id ?? event.id ?? eventObject.payment_intent_id ?? null,
      userId: eventObject.metadata?.user_id ?? null,
      amountCents: eventObject.amount ?? eventObject.amount_total ?? 0,
      currency: eventObject.currency ?? 'PHP'
    };
  }

  async getPaymentStatus(status) {
    return normalizePaymentStatus(status);
  }
}

export class XenditProvider extends PaymentProvider {
  constructor() {
    super('xendit');
  }

  async createPayment({ request, userId, email }) {
    const secretKey = readEnv('XENDIT_SECRET_KEY');
    if (!secretKey) {
      throw new Error('XENDIT_SECRET_KEY is not configured.');
    }

    const appUrl = appUrlFromRequest(request);
    const { plan, passDays, pricePhp } = passConfig();
    const externalId = `rq-${userId}-${Date.now()}`;
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encodeBasicAuth(secretKey)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        external_id: externalId,
        amount: pricePhp,
        currency: 'PHP',
        payer_email: email,
        description: 'RunQuest PH 30-day Premium Pass',
        success_redirect_url: `${appUrl}/rewards?billing=success`,
        failure_redirect_url: `${appUrl}/rewards?billing=cancelled`,
        metadata: {
          user_id: userId,
          plan,
          pass_days: String(passDays)
        }
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message ?? 'Xendit invoice checkout failed.');
    }

    return {
      provider: this.name,
      providerPaymentId: data.id ?? externalId,
      checkoutUrl: data.invoice_url,
      plan,
      passDays,
      pricePhp
    };
  }

  async verifyPayment(event, callbackToken) {
    const expectedToken = readEnv('XENDIT_CALLBACK_TOKEN');
    return {
      verified: expectedToken ? callbackToken === expectedToken : true,
      status: normalizePaymentStatus(event.status),
      transactionId: event.id ?? event.external_id ?? null,
      userId: event.metadata?.user_id ?? null,
      amountCents: Number(event.amount ?? 0) * 100,
      currency: event.currency ?? 'PHP'
    };
  }

  async getPaymentStatus(status) {
    return normalizePaymentStatus(status);
  }
}

export function providerOrder() {
  const primary = readEnv('PAYMENT_PROVIDER') || 'paymongo';
  const fallback = readEnv('PAYMENT_FALLBACK_PROVIDER') || 'xendit';
  return Array.from(new Set([primary, fallback, 'manual']));
}

export function createProvider(name) {
  if (name === 'paymongo') return new PayMongoProvider();
  if (name === 'xendit') return new XenditProvider();
  return new ManualPaymentProvider();
}

export async function createPaymentWithFallback(input) {
  const errors = [];

  for (const providerName of providerOrder()) {
    const provider = createProvider(providerName);
    try {
      const payment = await provider.createPayment(input);
      if (!payment.checkoutUrl) {
        throw new Error(`${provider.name} did not return a checkout URL.`);
      }
      return payment;
    } catch (error) {
      errors.push(`${provider.name}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  throw new Error(`All payment providers failed. ${errors.join(' | ')}`);
}
