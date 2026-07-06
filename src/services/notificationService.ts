import { requireSupabaseClient } from '../lib/supabase';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;
}

export async function requestNotificationPermission() {
  if (!isPushSupported()) {
    return 'denied' as NotificationPermission;
  }

  return Notification.requestPermission();
}

export async function savePushSubscription(userId: string) {
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    return { permission, subscribed: false };
  }

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  const subscription = existing ?? (await registration.pushManager.subscribe({ userVisibleOnly: true }));
  const json = subscription.toJSON();
  const keys = json.keys ?? {};
  const client = requireSupabaseClient();

  await client.from('push_subscriptions').upsert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh:
      keys.p256dh ??
      (subscription.getKey('p256dh') ? arrayBufferToBase64(subscription.getKey('p256dh')!) : null),
    auth:
      keys.auth ??
      (subscription.getKey('auth') ? arrayBufferToBase64(subscription.getKey('auth')!) : null),
    permission,
    updated_at: new Date().toISOString()
  });

  return { permission, subscribed: true };
}

export function showLocalReminder(title: string, body: string) {
  if (!isPushSupported() || Notification.permission !== 'granted') {
    return false;
  }

  navigator.serviceWorker.ready.then((registration) => {
    void registration.showNotification(title, {
      body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg'
    });
  });

  return true;
}
