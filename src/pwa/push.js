import { supabase } from '../lib/supabase.js';

export async function enablePush(userId) {
  if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) throw new Error('Push requires a supported browser on HTTPS or localhost.');
  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error('Push setup is pending. Configure VITE_VAPID_PUBLIC_KEY first.');
  if (Notification.permission === 'denied') throw new Error('Notifications are blocked. Allow them in browser site settings.');
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('Notification permission was not granted.');
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration?.active) throw new Error('Open a production build first (npm run build, then npm run preview).');
  const base64 = publicKey.replace(/-/g, '+').replace(/_/g, '/');
  const key = Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')), c => c.charCodeAt(0));
  const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
  const { error } = await supabase.from('push_subscriptions').upsert({ user_id: userId, endpoint: subscription.endpoint, subscription: subscription.toJSON() }, { onConflict: 'endpoint' });
  if (error) throw error;
}

export async function disablePush(userId) {
  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;
  const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', subscription.endpoint);
  if (error) throw error;
  await subscription.unsubscribe();
}
