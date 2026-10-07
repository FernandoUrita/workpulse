create table if not exists public.push_subscriptions (
 endpoint text primary key, user_id uuid not null references auth.users(id) on delete cascade,
 subscription jsonb not null, created_at timestamptz not null default now(),
 check (subscription->>'endpoint' = endpoint)
);
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon;
grant select, insert, update, delete on public.push_subscriptions to authenticated;
drop policy if exists push_own on public.push_subscriptions;
create policy push_own on public.push_subscriptions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
-- Run after the existing notification schema and owner-only SELECT/UPDATE policies.
drop policy if exists notification_head_send on public.notifications;
create policy notification_head_send on public.notifications for insert to authenticated with check (
 sender_id = auth.uid() and type = 'manual'
 and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('head','admin'))
 and exists (select 1 from public.profiles p where p.id = user_id)
);
drop policy if exists notification_send_guard on public.notifications;
create policy notification_send_guard on public.notifications as restrictive for insert to authenticated with check (
 sender_id = auth.uid() and type = 'manual'
 and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('head','admin'))
 and length(trim(title)) between 1 and 120 and length(trim(message)) between 1 and 2000
 and severity in ('info','warning','critical')
 and (link is null or (left(link,1) = '/' and left(link,2) <> '//'))
);
