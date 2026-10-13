import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
Deno.serve(async request => {
 if (request.method !== 'POST') return new Response('Method not allowed', { status: 405 });
 const secret = Deno.env.get('PUSH_WEBHOOK_SECRET');
 if (!secret || request.headers.get('x-webhook-secret') !== secret) return new Response('Unauthorized', { status: 401 });
 try {
  const event = await request.json();
  if (event.type !== 'INSERT' || event.table !== 'notifications' || event.schema !== 'public' || !event.record?.id) return new Response('Invalid event', { status: 400 });
  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: notification, error } = await db.from('notifications').select('*').eq('id', event.record.id).single();
  if (error) throw error;
  if (notification.dismissed || notification.read) return Response.json({ sent: 0 });
  const { data: subscriptions, error: lookupError } = await db.from('push_subscriptions').select('*').eq('user_id', notification.user_id);
  if (lookupError) throw lookupError;
  webpush.setVapidDetails(Deno.env.get('VAPID_SUBJECT')!, Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
  const payload = JSON.stringify({ id: notification.id, title: notification.title, message: notification.message, link: notification.link || '/dashboard' });
  let sent = 0, failed = 0;
  for (const row of subscriptions || []) {
   try {
    const url = new URL(row.endpoint);
    const allowed = ['fcm.googleapis.com', 'updates.push.services.mozilla.com', 'web.push.apple.com'];
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !(allowed.includes(url.hostname) || url.hostname.endsWith('.notify.windows.com'))) throw new Error('Unsupported push provider');
    await webpush.sendNotification(row.subscription, payload, { TTL: 3600, timeout: 10000 });
    sent++;
   } catch (err) {
    failed++;
    if (err.statusCode === 404 || err.statusCode === 410) await db.from('push_subscriptions').delete().eq('endpoint', row.endpoint).eq('user_id', notification.user_id);
   }
  }
  return Response.json({ sent, failed }, { status: failed ? 502 : 200 });
 } catch { return new Response('Push delivery failed; notification remains in the app.', { status: 500 }); }
});
