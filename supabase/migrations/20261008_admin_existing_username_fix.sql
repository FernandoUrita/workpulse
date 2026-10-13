-- Supports existing email-style usernames without allowing username changes.
begin;
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
commit;
