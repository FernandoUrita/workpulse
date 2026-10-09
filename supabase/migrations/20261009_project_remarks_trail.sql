-- Apply AFTER 20261009_project_monitoring.sql. No historical edits are fabricated.
begin;
alter table public.project_monitoring_updates add column if not exists source text not null default 'monitoring';
alter table public.project_monitoring_updates add column if not exists previous_remarks text;
alter table public.project_monitoring_updates add column if not exists current_remarks text;
create or replace function public.project_capture_remarks()
returns trigger language plpgsql security definer set search_path='' as $$
declare previous text; actor uuid := auth.uid();
begin
 if actor is null then return new; end if;
 if tg_op='UPDATE' then
  if coalesce(old.remarks,'') is not distinct from coalesce(new.remarks,'') then return new; end if;
  previous := old.remarks;
 elsif length(trim(coalesce(new.remarks,'')))=0 then return new;
 end if;
 insert into public.project_monitoring_updates(project_id,row_id,summary,created_by,source,previous_remarks,current_remarks)
 values(new.project_id,new.id,case when length(trim(coalesce(new.remarks,'')))=0 then '[Remarks cleared]' else new.remarks end,actor,'remarks',previous,coalesce(new.remarks,''));
 return new;
end $$;
revoke all on function public.project_capture_remarks() from public,anon,authenticated;
drop trigger if exists project_remarks_trail on public.project_rows;
create trigger project_remarks_trail after insert or update of remarks on public.project_rows for each row execute function public.project_capture_remarks();
create or replace function public.project_monitoring_snapshot()
returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
 'projects',coalesce((select jsonb_agg(g order by g.name) from public.projects g where not g.archived and public.project_can_monitor(g.id)),'[]'::jsonb),
 'rows',coalesce((select jsonb_agg(r order by r.ticket_no) from public.project_rows r join public.projects g on g.id=r.project_id where not g.archived and public.project_can_monitor(g.id)),'[]'::jsonb),
 'updates',coalesce((select jsonb_agg(to_jsonb(u)||jsonb_build_object('author_name',coalesce(p.name,p.username,'Project member')) order by u.created_at desc,u.id) from public.project_monitoring_updates u join public.projects g on g.id=u.project_id left join public.profiles p on p.id=u.created_by where not g.archived and public.project_can_monitor(g.id)),'[]'::jsonb))
$$;
revoke all on function public.project_monitoring_snapshot() from public,anon;
grant execute on function public.project_monitoring_snapshot() to authenticated;
commit;
