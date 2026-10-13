begin;
create or replace function public.project_can_monitor(p_project uuid)
returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active and (p.role in ('admin','head') or exists(select 1 from public.projects g where g.id=p_project and g.poc_id=p.id)))
$$;
revoke all on function public.project_can_monitor(uuid) from public,anon;
grant execute on function public.project_can_monitor(uuid) to authenticated;
create table if not exists public.project_monitoring_updates (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id) on delete cascade,
 row_id uuid not null references public.project_rows(id) on delete cascade,
 summary text not null check(length(trim(summary)) between 1 and 2000),
 next_action text not null default '' check(length(next_action)<=1000),
 follow_up_date date, created_by uuid not null references public.profiles(id), created_at timestamptz not null default now()
);
create index if not exists project_monitoring_row_history on public.project_monitoring_updates(row_id,created_at desc);
alter table public.project_monitoring_updates enable row level security;
revoke all on public.project_monitoring_updates from anon,authenticated;
grant select on public.project_monitoring_updates to authenticated;
drop policy if exists monitoring_read on public.project_monitoring_updates;
create policy monitoring_read on public.project_monitoring_updates for select to authenticated using(public.project_can_monitor(project_id));
create or replace function public.project_monitoring_snapshot()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'projects',coalesce((select jsonb_agg(g order by g.name) from public.projects g where not g.archived and public.project_can_monitor(g.id)),'[]'::jsonb),
 'rows',coalesce((select jsonb_agg(r order by r.ticket_no) from public.project_rows r join public.projects g on g.id=r.project_id where not g.archived and public.project_can_monitor(g.id)),'[]'::jsonb),
 'updates',coalesce((select jsonb_agg(u order by u.created_at desc,u.id) from public.project_monitoring_updates u join public.projects g on g.id=u.project_id where not g.archived and public.project_can_monitor(g.id)),'[]'::jsonb))
$$;
create or replace function public.project_monitoring_post(p_row uuid,p_summary text,p_next_action text,p_follow_up date)
returns uuid language plpgsql security definer set search_path='' as $$
declare g uuid; result uuid;
begin
 select project_id into g from public.project_rows where id=p_row;
 -- Lock group so a concurrent POC change cannot authorize a stale writer.
 perform 1 from public.projects where id=g and not archived for update;
 if not found or not public.project_can_monitor(g) then raise exception 'Group POC, Head or Admin access required' using errcode='42501';end if;
 if length(trim(coalesce(p_summary,''))) not between 1 and 2000 or length(coalesce(p_next_action,''))>1000 then raise exception 'Summary is required (max 2000); next action max 1000';end if;
 insert into public.project_monitoring_updates(project_id,row_id,summary,next_action,follow_up_date,created_by)
 values(g,p_row,trim(p_summary),trim(coalesce(p_next_action,'')),p_follow_up,auth.uid()) returning id into result;
 insert into public.project_audit(project_id,row_id,actor_id,action,details) values(g,p_row,auth.uid(),'Monitoring update posted',jsonb_build_object('update_id',result));
 return result;
end $$;
revoke all on function public.project_monitoring_snapshot(),public.project_monitoring_post(uuid,text,text,date) from public,anon;
grant execute on function public.project_monitoring_snapshot(),public.project_monitoring_post(uuid,text,text,date) to authenticated;
commit;
