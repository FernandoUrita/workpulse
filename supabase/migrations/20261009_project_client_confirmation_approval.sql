-- Apply after all previous project migrations. Work status is preserved.
begin;
alter table public.project_rows add column if not exists client_confirmed_at timestamptz;
alter table public.project_rows add column if not exists client_confirmed_by uuid references public.profiles(id);
alter table public.project_rows add column if not exists client_confirmation_note text not null default '';
alter table public.project_rows alter column approval_status set default 'pending';
-- Legacy rows retain their work status. They have no inferred client confirmation.

create or replace function public.project_row_submit(p_project uuid,p_id uuid,p_data jsonb,p_expected timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); g public.projects; old public.project_rows; r public.project_rows; head boolean; manager boolean; target uuid;
begin
 if not public.workpulse_is_active() then raise exception 'Active account required' using errcode='42501'; end if;
 select * into g from public.projects where id=p_project for update;
 if not found or g.archived then raise exception 'Project unavailable or archived'; end if;
 if not public.project_can_access(p_project) then raise exception 'Project membership required' using errcode='42501'; end if;
 head:=exists(select 1 from public.profiles where id=actor and is_active and role in ('head','admin'));
 if p_data is null or jsonb_typeof(p_data)<>'object' then raise exception 'Invalid row data'; end if;
 r.ticket_no:=trim(coalesce(p_data->>'ticket_no',''));r.custom_name:=trim(coalesce(p_data->>'custom_name',''));r.client_name:=coalesce(nullif(g.client_name,''),g.name);r.client_tier:=g.tier;r.applied_to:=trim(coalesce(p_data->>'applied_to',''));r.system:=coalesce(p_data->>'system','JPS');r.priority:=coalesce(p_data->>'priority','Medium');r.status:=coalesce(p_data->>'status','Ongoing');
 r.assigned_to:=nullif(p_data->>'assigned_to','')::uuid;r.assigned_dev:=trim(coalesce(p_data->>'assigned_dev',''));r.assigned_qa:=trim(coalesce(p_data->>'assigned_qa',''));r.is_signed:=coalesce((p_data->>'is_signed')::boolean,false);r.deployment_date:=nullif(p_data->>'deployment_date','')::date;r.pending_to:=trim(coalesce(p_data->>'pending_to',''));r.remarks:=coalesce(p_data->>'remarks','');
 if length(r.ticket_no) not between 1 and 120 or length(r.custom_name) not between 1 and 120 or length(r.client_name)>120 or length(r.applied_to)>120 or length(r.pending_to)>120 or length(r.assigned_dev)>120 or length(r.assigned_qa)>120 or length(r.remarks)>2000 then raise exception 'Ticket no. and Custom name are required; short fields max 120, remarks max 2000'; end if;
 if r.client_tier not in ('Standard','VIP','VVIP','VVVIP') or (r.system='' or not (string_to_array(replace(r.system,' ',''),',') <@ array['JPS','ESS','BUNDY','WEBHR','PPH','INSIGHT'])) or r.priority not in ('Critical','High','Medium','Low') or r.status not in ('Ongoing','Active','In Progress','For QA','Completed','On Hold','Deployed','For Review') then raise exception 'Invalid tier, system, priority or status'; end if;
 if p_id is not null then
  select * into old from public.project_rows where id=p_id and project_id=p_project for update;
  if not found then raise exception 'Row not found'; end if;
  if p_expected is null or p_expected is distinct from old.updated_at then raise exception 'Row changed. Refresh and reopen before saving.'; end if;
  manager:=head or g.poc_id=actor or old.assigned_to=actor;manager:=coalesce(manager,false);
  if not manager and actor<>old.created_by then raise exception 'You cannot edit this row' using errcode='42501';end if;
  if not manager and (r.assigned_to is distinct from old.assigned_to or r.assigned_dev is distinct from old.assigned_dev or r.assigned_qa is distinct from old.assigned_qa) then raise exception 'Only head/admin or current POC can reassign this row' using errcode='42501';end if;
 end if;
 if exists(select 1 from unnest(array[r.assigned_to]) x(id) where x.id is not null and not exists(select 1 from public.profiles p where p.id=x.id and p.is_active)) then raise exception 'Select active users for assignments';end if;
 if r.status='Active' and (p_id is null or old.status<>'Active' or old.approval_status<>'approved') then raise exception 'Only Head approval after client confirmation can activate a row'; end if;
 r.client_confirmed_at:=old.client_confirmed_at; r.client_confirmed_by:=old.client_confirmed_by; r.client_confirmation_note:=coalesce(old.client_confirmation_note,'');
 if r.status not in ('Deployed','Active') then r.client_confirmed_at:=null;r.client_confirmed_by:=null;r.client_confirmation_note:='';end if;
 if coalesce((p_data->>'client_confirmed')::boolean,false) and r.status='Deployed' then
  r.client_confirmation_note:=trim(coalesce(p_data->>'client_confirmation_note',''));
  if length(r.client_confirmation_note) not between 1 and 2000 then raise exception 'Client confirmation note is required (max 2000 characters)';end if;
  if old.client_confirmed_at is null or old.client_confirmation_note is distinct from r.client_confirmation_note then r.client_confirmed_at:=clock_timestamp();r.client_confirmed_by:=actor;end if;
 elsif p_data ? 'client_confirmed' and not coalesce((p_data->>'client_confirmed')::boolean,false) and r.status='Deployed' then
  r.client_confirmed_at:=null;r.client_confirmed_by:=null;r.client_confirmation_note:='';
 end if;
 r.approval_status:=case when r.status='Active' then old.approval_status when r.status='Deployed' and r.client_confirmed_at is not null and old.client_confirmed_at is not distinct from r.client_confirmed_at then coalesce(old.approval_status,'pending') else 'pending' end;

 if p_id is null then
  insert into public.project_rows(project_id,created_by,title,description,due_date,status,ticket_no,custom_name,client_name,client_tier,applied_to,system,priority,assigned_to,assigned_dev,assigned_qa,is_signed,deployment_date,pending_to,remarks,client_confirmed_at,client_confirmed_by,client_confirmation_note,approval_status)
  values(p_project,actor,r.custom_name,r.remarks,r.deployment_date,r.status,r.ticket_no,r.custom_name,r.client_name,r.client_tier,r.applied_to,r.system,r.priority,r.assigned_to,r.assigned_dev,r.assigned_qa,r.is_signed,r.deployment_date,r.pending_to,r.remarks,r.client_confirmed_at,r.client_confirmed_by,r.client_confirmation_note,r.approval_status) returning id into r.id;
 else
  update public.project_rows set title=r.custom_name,description=r.remarks,status=r.status,ticket_no=r.ticket_no,custom_name=r.custom_name,client_name=r.client_name,client_tier=r.client_tier,applied_to=r.applied_to,system=r.system,priority=r.priority,assigned_to=r.assigned_to,assigned_dev=r.assigned_dev,assigned_qa=r.assigned_qa,is_signed=r.is_signed,deployment_date=r.deployment_date,pending_to=r.pending_to,remarks=r.remarks,due_date=r.deployment_date,client_confirmed_at=r.client_confirmed_at,client_confirmed_by=r.client_confirmed_by,client_confirmation_note=r.client_confirmation_note,approval_status=r.approval_status,approved_by=case when r.approval_status='approved' then old.approved_by end,approved_at=case when r.approval_status='approved' then old.approved_at end,rejection_reason=case when r.approval_status='rejected' then old.rejection_reason else '' end,updated_at=clock_timestamp() where id=p_id returning id into r.id;
 end if;
 insert into public.project_audit(project_id,row_id,actor_id,action,details) values(p_project,r.id,actor,case when p_id is null then 'Row added' else 'Row updated' end,jsonb_build_object('before',to_jsonb(old),'after',to_jsonb(r)));
  for target in select distinct x.id from unnest(array[case when r.assigned_to is distinct from old.assigned_to then r.assigned_to end]) x(id) where x.id is not null and x.id<>actor loop
   insert into public.notifications(user_id,sender_id,type,severity,reminder_level,title,message,link) values(target,actor,'manual','info','normal','Project assignment updated',left(r.ticket_no||': '||r.custom_name,2000),'/projects?project='||p_project);
  end loop;
 if r.client_confirmed_at is distinct from old.client_confirmed_at then
  insert into public.project_audit(project_id,row_id,actor_id,action,details) values(p_project,r.id,actor,case when r.client_confirmed_at is null then 'Client confirmation cleared' else 'Client confirmed / For approval' end,jsonb_build_object('note',r.client_confirmation_note,'confirmed_at',r.client_confirmed_at));
  if r.client_confirmed_at is not null then
   insert into public.notifications(user_id,sender_id,type,severity,reminder_level,title,message,link)
   select id,actor,'manual','info','normal','Project item for approval',left(r.ticket_no||': '||r.custom_name,2000),'/projects?project='||p_project from public.profiles where is_active and role in ('head','admin') and id<>actor;
  end if;
 end if;
 return r.id;
end $$;
revoke all on function public.project_row_submit(uuid,uuid,jsonb,timestamptz) from public,anon;
grant execute on function public.project_row_submit(uuid,uuid,jsonb,timestamptz) to authenticated;

drop function if exists public.project_row_review(uuid,boolean,text,timestamptz);
create function public.project_row_review(p_id uuid,p_approve boolean,p_reason text,p_expected timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); r public.project_rows; g uuid;
begin
 if not exists(select 1 from public.profiles where id=actor and is_active and role in ('head','admin')) then raise exception 'Head/admin approval required' using errcode='42501';end if;
 select project_id into g from public.project_rows where id=p_id;
 perform 1 from public.projects where id=g and not archived for update;
 if not found then raise exception 'Project unavailable or archived';end if;
 select * into r from public.project_rows where id=p_id for update;
 if not found or r.status<>'Deployed' or r.client_confirmed_at is null or r.approval_status<>'pending' then raise exception 'Client-confirmed Deployed item required';end if;
 if p_expected is null or p_expected is distinct from r.updated_at then raise exception 'Row changed. Refresh before reviewing.';end if;
 if p_approve is null or length(coalesce(p_reason,''))>1000 or (not p_approve and trim(coalesce(p_reason,''))='') then raise exception 'Rejection reason required (max 1000 characters)';end if;
 update public.project_rows set status=case when p_approve then 'Active' else 'Deployed' end,approval_status=case when p_approve then 'approved' else 'rejected' end,approved_by=actor,approved_at=clock_timestamp(),rejection_reason=case when p_approve then '' else trim(p_reason) end,updated_at=clock_timestamp() where id=p_id;
 insert into public.project_audit(project_id,row_id,actor_id,action,details) values(g,p_id,actor,case when p_approve then 'Client-confirmed item approved / Active' else 'Client-confirmed item rejected' end,jsonb_build_object('reason',p_reason,'confirmation',r.client_confirmation_note));
 return p_id;
end $$;
revoke all on function public.project_row_review(uuid,boolean,text,timestamptz) from public,anon;
grant execute on function public.project_row_review(uuid,boolean,text,timestamptz) to authenticated;
-- Disable obsolete mutation RPC that bypassed the fixed-row workflow.
do $$
begin
 if to_regprocedure('public.project_row_save(uuid,uuid,text,text,text,date,uuid,uuid,timestamptz)') is not null then
  execute 'revoke all on function public.project_row_save(uuid,uuid,text,text,text,date,uuid,uuid,timestamptz) from public,anon,authenticated';
 end if;
end $$;
commit;
