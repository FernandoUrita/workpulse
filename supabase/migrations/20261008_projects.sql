begin;
-- Prerequisites: profiles.is_active (S7) and notifications.reminder_level (S6).
create table if not exists public.projects (
 id uuid primary key default gen_random_uuid(), name text not null check(length(trim(name)) between 1 and 120),
 client_name text not null default '' check(length(client_name)<=120), tier text not null default 'Standard' check(tier in ('Standard','VIP','VVIP','VVVIP')),
 poc_id uuid references public.profiles(id), archived boolean not null default false,
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.project_rows (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id),
 title text not null check(length(trim(title)) between 1 and 120), description text not null default '' check(length(description)<=2000),
 status text not null default 'Pending' check(status in ('Pending','In Progress','For QA','Completed','On Hold')),
 due_date date, dev_id uuid references public.profiles(id), qa_id uuid references public.profiles(id),
 created_by uuid not null references public.profiles(id), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists project_rows_project_idx on public.project_rows(project_id,created_at desc);
create table if not exists public.project_audit (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references public.projects(id), row_id uuid references public.project_rows(id),
 actor_id uuid not null references public.profiles(id), action text not null, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index if not exists project_audit_project_idx on public.project_audit(project_id,created_at desc);
alter table public.projects enable row level security;
alter table public.project_rows enable row level security;
alter table public.project_audit enable row level security;
revoke all on public.projects,public.project_rows,public.project_audit from anon,authenticated;
grant select on public.projects,public.project_rows,public.project_audit to authenticated;
drop policy if exists projects_read on public.projects;
create policy projects_read on public.projects for select to authenticated using(public.workpulse_is_active());
drop policy if exists project_rows_read on public.project_rows;
create policy project_rows_read on public.project_rows for select to authenticated using(public.workpulse_is_active());
drop policy if exists project_audit_read on public.project_audit;
create policy project_audit_read on public.project_audit for select to authenticated using(public.workpulse_is_active());

create or replace function public.project_save(p_id uuid,p_name text,p_client text,p_tier text,p_poc uuid,p_archived boolean)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); result uuid; before_row public.projects; target uuid;
begin
 if not exists(select 1 from public.profiles where id=actor and is_active and role in ('head','admin')) then raise exception 'Head or admin access required' using errcode='42501'; end if;
 if p_name is null or length(trim(p_name)) not between 1 and 120 or p_client is null or length(p_client)>120 or p_tier is null or p_tier not in ('Standard','VIP','VVIP','VVVIP') or p_archived is null then raise exception 'Invalid project fields'; end if;
 if p_poc is not null and not exists(select 1 from public.profiles where id=p_poc and is_active) then raise exception 'POC must be an active user'; end if;
 if p_id is null then
  insert into public.projects(name,client_name,tier,poc_id,archived,created_by) values(trim(p_name),trim(p_client),p_tier,p_poc,p_archived,actor) returning id into result;
 else
  select * into before_row from public.projects where id=p_id for update;
  if not found then raise exception 'Project not found'; end if;
  update public.projects set name=trim(p_name),client_name=trim(p_client),tier=p_tier,poc_id=p_poc,archived=p_archived,updated_at=now() where id=p_id returning id into result;
 end if;
 insert into public.project_audit(project_id,actor_id,action,details) values(result,actor,case when p_id is null then 'Project created' else 'Project updated' end,jsonb_build_object('before',to_jsonb(before_row),'name',trim(p_name),'tier',p_tier,'poc_id',p_poc,'archived',p_archived));
 if p_poc is not null and p_poc is distinct from before_row.poc_id and p_poc<>actor then
  insert into public.notifications(user_id,sender_id,type,severity,reminder_level,title,message,link) values(p_poc,actor,'manual','info','normal','Project POC assignment',left('You are the POC for '||trim(p_name)||'. Review the project and assign Dev/QA owners.',2000),'/projects?project='||result);
 end if;
 return result;
end $$;

create or replace function public.project_row_save(p_id uuid,p_project uuid,p_title text,p_description text,p_status text,p_due date,p_dev uuid,p_qa uuid,p_expected timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); manager boolean; group_row public.projects; before_row public.project_rows; result uuid; target uuid;
begin
 if not public.workpulse_is_active() then raise exception 'Active account required' using errcode='42501'; end if;
 select * into group_row from public.projects where id=p_project for update;
 if not found or group_row.archived then raise exception 'Project unavailable or archived'; end if;
 manager:=group_row.poc_id=actor or exists(select 1 from public.profiles where id=actor and role in ('head','admin') and is_active);
 manager:=coalesce(manager,false);
 if p_title is null or length(trim(p_title)) not between 1 and 120 or p_description is null or length(p_description)>2000 or p_status is null or p_status not in ('Pending','In Progress','For QA','Completed','On Hold') then raise exception 'Invalid row fields'; end if;
 if exists(select 1 from unnest(array[p_dev,p_qa]) x(id) where x.id is not null and not exists(select 1 from public.profiles p where p.id=x.id and p.is_active)) then raise exception 'Assignments require active users'; end if;
 if p_id is null then
  if not manager and (p_dev is not null or p_qa is not null) then raise exception 'Only head/admin or POC can assign owners' using errcode='42501'; end if;
  insert into public.project_rows(project_id,title,description,status,due_date,dev_id,qa_id,created_by) values(p_project,trim(p_title),p_description,p_status,p_due,p_dev,p_qa,actor) returning id into result;
 else
  select * into before_row from public.project_rows where id=p_id and project_id=p_project for update;
  if not found then raise exception 'Row not found'; end if;
  if p_expected is null or p_expected is distinct from before_row.updated_at then raise exception 'Row changed. Refresh and reopen it before saving.'; end if;
  if not manager and actor<>before_row.created_by and actor is distinct from before_row.dev_id and actor is distinct from before_row.qa_id then raise exception 'You cannot edit this row' using errcode='42501'; end if;
  if not manager and (p_dev is distinct from before_row.dev_id or p_qa is distinct from before_row.qa_id) then raise exception 'Only head/admin or POC can assign owners' using errcode='42501'; end if;
  update public.project_rows set title=trim(p_title),description=p_description,status=p_status,due_date=p_due,dev_id=p_dev,qa_id=p_qa,updated_at=clock_timestamp() where id=p_id returning id into result;
 end if;
 insert into public.project_audit(project_id,row_id,actor_id,action,details) values(p_project,result,actor,case when p_id is null then 'Row created' else 'Row updated' end,jsonb_build_object('before',to_jsonb(before_row),'title',trim(p_title),'status',p_status,'dev_id',p_dev,'qa_id',p_qa));
 for target in select distinct x.id from unnest(array[case when p_dev is distinct from before_row.dev_id then p_dev end,case when p_qa is distinct from before_row.qa_id then p_qa end]) x(id) where x.id is not null and x.id<>actor loop
  insert into public.notifications(user_id,sender_id,type,severity,reminder_level,title,message,link) values(target,actor,'manual','info','normal','Project row assignment',left('You have been assigned to '||trim(p_title)||' in '||group_row.name||'.',2000),'/projects?project='||p_project);
 end loop;
 return result;
end $$;
revoke all on function public.project_save(uuid,text,text,text,uuid,boolean),public.project_row_save(uuid,uuid,text,text,text,date,uuid,uuid,timestamptz) from public,anon;
grant execute on function public.project_save(uuid,text,text,text,uuid,boolean),public.project_row_save(uuid,uuid,text,text,text,date,uuid,uuid,timestamptz) to authenticated;
commit;
