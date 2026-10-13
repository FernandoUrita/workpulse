begin;
alter table public.profiles add column if not exists is_active boolean not null default true;
-- Existing case-insensitive duplicates must be corrected before running this migration.
create unique index if not exists workpulse_profiles_username_ci on public.profiles (lower(username));
create table if not exists public.admin_audit_log (
 id bigint generated always as identity primary key,
 actor_id uuid, target_id uuid, action text not null,
 before_data jsonb, after_data jsonb, created_at timestamptz not null default now()
);
alter table public.admin_audit_log enable row level security;
create or replace function public.workpulse_is_active() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and is_active);
$$;
create or replace function public.workpulse_is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.profiles where id=auth.uid() and role='admin' and is_active);
$$;
revoke all on function public.workpulse_is_active(), public.workpulse_is_admin() from public, anon;
grant execute on function public.workpulse_is_active(), public.workpulse_is_admin() to authenticated;
revoke all on public.admin_audit_log from anon, authenticated;
grant select on public.admin_audit_log to authenticated;
drop policy if exists admin_audit_read on public.admin_audit_log;
create policy admin_audit_read on public.admin_audit_log for select to authenticated using (public.workpulse_is_admin());
alter table public.profiles enable row level security;
revoke update on public.profiles from authenticated, anon;
revoke update(id,role,is_active,username) on public.profiles from authenticated, anon;
grant update(name,email,avatar_url,updated_at) on public.profiles to authenticated;
drop policy if exists workpulse_admin_read on public.profiles;
create policy workpulse_admin_read on public.profiles for select to authenticated using (public.workpulse_is_admin());
drop policy if exists workpulse_profile_read_guard on public.profiles;
create policy workpulse_profile_read_guard on public.profiles as restrictive for select to authenticated
 using (id=auth.uid() or public.workpulse_is_active());
-- Authenticated updates go through this RPC for admin edits. Restrictive
-- guard remains effective even when older permissive policies are present.
drop policy if exists workpulse_profile_update_guard on public.profiles;
create policy workpulse_profile_update_guard on public.profiles as restrictive for update to authenticated
 using (id=auth.uid() and public.workpulse_is_active()) with check (id=auth.uid() and public.workpulse_is_active());
drop policy if exists workpulse_profile_delete_guard on public.profiles;
create policy workpulse_profile_delete_guard on public.profiles as restrictive for delete to authenticated using (false);
create or replace function public.workpulse_profile_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is not null and not public.workpulse_is_admin() then
  if TG_OP='INSERT' then
   if new.id<>auth.uid() or new.role<>'employee' or not new.is_active then raise exception 'New accounts must be active employees'; end if;
  elsif TG_OP='UPDATE' then
   if new.id<>old.id or new.role is distinct from old.role or new.is_active is distinct from old.is_active then raise exception 'Only an admin can change access'; end if;
  end if;
 end if;
 return new;
end $$;
drop trigger if exists workpulse_profile_guard on public.profiles;
create trigger workpulse_profile_guard before insert or update on public.profiles for each row execute function public.workpulse_profile_guard();
create or replace function public.workpulse_profile_audit() returns trigger
language plpgsql security definer set search_path = '' as $$
declare b jsonb; a jsonb;
begin
 b:=jsonb_build_object('name',old.name,'username',old.username,'role',old.role,'is_active',old.is_active);
 a:=jsonb_build_object('name',new.name,'username',new.username,'role',new.role,'is_active',new.is_active);
 if b is distinct from a then
  insert into public.admin_audit_log(actor_id,target_id,action,before_data,after_data)
  values(auth.uid(),new.id,'profile_updated',b,a);
 end if;
 return new;
end $$;
drop trigger if exists workpulse_profile_audit on public.profiles;
create trigger workpulse_profile_audit after update on public.profiles for each row execute function public.workpulse_profile_audit();
create or replace function public.admin_save_user(p_id uuid,p_name text,p_username text,p_role text,p_active boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare result public.profiles;
begin
 -- Serializes competing demotions/deactivations so the last admin survives.
 perform pg_advisory_xact_lock(72810421);
 if not public.workpulse_is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if p_id=auth.uid() then raise exception 'Use Settings for your profile. Ask another admin to change your access.'; end if;
 if p_role not in ('employee','head','admin') or p_role is null or p_active is null then raise exception 'Invalid access values'; end if;
 if length(trim(p_name)) not between 1 and 120 or p_name is null then raise exception 'Name must contain 1–120 characters'; end if;
 if p_username is null then raise exception 'Existing username required'; end if;
 select * into result from public.profiles where id=p_id for update;
 if not found then raise exception 'User not found'; end if;
 if p_username<>result.username then raise exception 'Username is fixed to preserve existing assignments'; end if;
 if result.role='admin' and result.is_active and (p_role<>'admin' or not p_active)
 and (select count(*) from public.profiles where role='admin' and is_active)<=1 then raise exception 'Cannot remove the last active admin'; end if;
 update public.profiles set name=trim(p_name),username=trim(p_username),role=p_role,is_active=p_active,updated_at=now() where id=p_id returning * into result;
 if not p_active and to_regclass('public.push_subscriptions') is not null then
  execute 'delete from public.push_subscriptions where user_id=$1' using p_id;
 end if;
 return jsonb_build_object('id',result.id,'name',result.name,'username',result.username,'role',result.role,'is_active',result.is_active);
end $$;
revoke all on function public.admin_save_user(uuid,text,text,text,boolean) from public, anon;
grant execute on function public.admin_save_user(uuid,text,text,text,boolean) to authenticated;
-- Existing ownership/role policies still grant access. This only limits inactive accounts.
do $$ declare t text; begin
 foreach t in array array['tasks','tickets','meetings','items','notifications','push_subscriptions'] loop
  if to_regclass('public.'||t) is not null then
   execute format('drop policy if exists workpulse_active_guard on public.%I',t);
   execute format('create policy workpulse_active_guard on public.%I as restrictive for all to authenticated using (public.workpulse_is_active()) with check (public.workpulse_is_active())',t);
  end if;
 end loop;
end $$;
-- Refuse untrusted signup metadata granting head/admin, even if an existing auth trigger uses it.
create or replace function public.workpulse_signup_metadata_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
 new.raw_user_meta_data:=coalesce(new.raw_user_meta_data,'{}'::jsonb)||'{"role":"employee","is_active":true}'::jsonb;
 return new;
end $$;
drop trigger if exists workpulse_signup_metadata_guard on auth.users;
create trigger workpulse_signup_metadata_guard before insert on auth.users for each row execute function public.workpulse_signup_metadata_guard();
commit;
