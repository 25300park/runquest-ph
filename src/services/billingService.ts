import { ensureUserProfile } from './authService';

export async function startPremiumPassCheckout() {
  const profile = await ensureUserProfile();
  const response = await fetch('/api/payment/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: profile.id,
      email: profile.email
    })
  });
  const data = await response.json();

  if (!response.ok || !data.url) {
    throw new Error(data.error ?? 'Unable to start Premium Pass checkout.');
  }

  window.location.href = data.url;
}
