import { createClient } from 'npm:@supabase/supabase-js@2';
const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Content-Type': 'application/json' };
const reply = (status: number, data: unknown) => new Response(JSON.stringify(data), { status, headers });
Deno.serve(async request => {
 if (request.method === 'OPTIONS') return new Response('ok', { headers });
 if (request.method !== 'POST') return reply(405, { error: 'POST required' });
 try {
  const token = request.headers.get('Authorization')?.replace(/^Bearer /i, '');
  if (!token) return reply(401, { error: 'Sign in required' });
  const url = Deno.env.get('SUPABASE_URL')!;
  const server = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: identity, error: authError } = await server.auth.getUser(token);
  if (authError || !identity.user) return reply(401, { error: 'Session expired' });
  const { data: actor, error: actorError } = await server.from('profiles').select('role,is_active').eq('id', identity.user.id).single();
  if (actorError || actor?.role !== 'admin' || !actor.is_active) return reply(403, { error: 'Active admin required' });
  const { name, username, email, password } = await request.json();
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 120 || typeof username !== 'string' || !/^[A-Za-z0-9_]{3,40}$/.test(username) || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 12 || password.length > 128) return reply(400, { error: 'Valid name, username, email and a 12–128 character password required' });
  const { data: existing, error: lookupError } = await server.from('profiles').select('id').ilike('username', username.replaceAll('_', '\\_')).limit(1);
  if (lookupError) throw lookupError;
  if (existing?.length) return reply(409, { error: 'Username already exists' });
  const { data, error } = await server.auth.admin.createUser({ email: email.trim(), password, email_confirm: true, user_metadata: { name: name.trim(), username, role: 'employee' } });
  if (error || !data.user) return reply(400, { error: error?.message || 'Account creation failed' });
  const id = data.user.id;
  const { error: profileError } = await server.from('profiles').upsert({ id, name: name.trim(), username, email: email.trim(), role: 'employee', is_active: true });
  if (profileError) {
   const { error: rollbackError } = await server.auth.admin.deleteUser(id);
   if (rollbackError) console.error('Account cleanup required', id);
   return reply(500, { error: 'Profile creation failed. Check function logs before retrying.' });
  }
  const { error: auditError } = await server.from('admin_audit_log').insert({ actor_id: identity.user.id, target_id: id, action: 'account_created', after_data: { name: name.trim(), username, role: 'employee', is_active: true } });
  if (auditError) { console.error('Account audit failed', id, auditError.message); return reply(200, { success: true, warning: 'Account created, but audit logging failed. Check function logs.', id }); }
  return reply(200, { success: true, id });
 } catch (error) {
  console.error('admin-users error', error instanceof Error ? error.message : 'Unknown');
  return reply(500, { error: 'Account creation failed. Check function logs.' });
 }
});
