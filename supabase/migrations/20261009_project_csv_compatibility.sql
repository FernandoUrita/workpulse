begin;
-- Run after inherited-client/text-owner migration.
alter table public.project_rows drop constraint if exists project_rows_fixed_values;
alter table public.project_rows add constraint project_rows_fixed_values check(client_tier in ('Standard','VIP','VVIP','VVVIP') and system<>'' and string_to_array(replace(system,' ',''),',') <@ array['JPS','ESS','BUNDY','WEBHR','PPH','INSIGHT'] and priority in ('Critical','High','Medium','Low') and status in ('Ongoing','Active','In Progress','For QA','Completed','On Hold','Deployed','For Review') and approval_status in ('pending','approved','rejected'));
create or replace function public.project_row_submit(p_project uuid,p_id uuid,p_data jsonb,p_expected timestamptz)
returns uuid language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); g public.projects; old public.project_rows; r public.project_rows; head boolean; manager boolean; target uuid;
begin
 if not public.workpulse_is_active() then raise exception 'Active account required' using errcode='42501'; end if;
 select * into g from public.projects where id=p_project for update;
 if not found or g.archived then raise exception 'Project unavailable or archived'; end if;
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
  if not manager and old.approval_status='approved' and (r.assigned_to is distinct from old.assigned_to or r.assigned_dev is distinct from old.assigned_dev or r.assigned_qa is distinct from old.assigned_qa) then raise exception 'Only head/admin or current POC can reassign an approved row' using errcode='42501';end if;
 end if;
 if exists(select 1 from unnest(array[r.assigned_to]) x(id) where x.id is not null and not exists(select 1 from public.profiles p where p.id=x.id and p.is_active)) then raise exception 'Select active users for assignments';end if;
 r.approval_status:=case when head and old.approval_status='approved' then 'approved' else 'pending' end;
 if r.approval_status='pending' and r.status='Active' then r.status:='Ongoing';end if;
 if p_id is null then
  insert into public.project_rows(project_id,created_by,title,description,due_date,status,ticket_no,custom_name,client_name,client_tier,applied_to,system,priority,assigned_to,assigned_dev,assigned_qa,is_signed,deployment_date,pending_to,remarks)
  values(p_project,actor,r.custom_name,r.remarks,r.deployment_date,r.status,r.ticket_no,r.custom_name,r.client_name,r.client_tier,r.applied_to,r.system,r.priority,r.assigned_to,r.assigned_dev,r.assigned_qa,r.is_signed,r.deployment_date,r.pending_to,r.remarks) returning id into r.id;
 else
  update public.project_rows set title=r.custom_name,description=r.remarks,status=r.status,ticket_no=r.ticket_no,custom_name=r.custom_name,client_name=r.client_name,client_tier=r.client_tier,applied_to=r.applied_to,system=r.system,priority=r.priority,assigned_to=r.assigned_to,assigned_dev=r.assigned_dev,assigned_qa=r.assigned_qa,is_signed=r.is_signed,deployment_date=r.deployment_date,pending_to=r.pending_to,remarks=r.remarks,due_date=r.deployment_date,approval_status=r.approval_status,approved_by=case when r.approval_status='approved' then old.approved_by end,approved_at=case when r.approval_status='approved' then old.approved_at end,rejection_reason='',updated_at=clock_timestamp() where id=p_id returning id into r.id;
 end if;
 insert into public.project_audit(project_id,row_id,actor_id,action,details) values(p_project,r.id,actor,case when r.approval_status='pending' then 'Row submitted for review' else 'Approved row updated' end,jsonb_build_object('before',to_jsonb(old),'after',to_jsonb(r)));
 if r.approval_status='pending' and g.created_by<>actor and exists(select 1 from public.profiles where id=g.created_by and is_active and role in ('head','admin')) then
  insert into public.notifications(user_id,sender_id,type,severity,reminder_level,title,message,link) values(g.created_by,actor,'manual','info','normal','Project row needs review',left(r.ticket_no||': '||r.custom_name||' was submitted for review.',2000),'/projects?project='||p_project);
 elsif r.approval_status='approved' then
  for target in select distinct x.id from unnest(array[case when r.assigned_to is distinct from old.assigned_to then r.assigned_to end]) x(id) where x.id is not null and x.id<>actor loop
   insert into public.notifications(user_id,sender_id,type,severity,reminder_level,title,message,link) values(target,actor,'manual','info','normal','Project assignment updated',left(r.ticket_no||': '||r.custom_name,2000),'/projects?project='||p_project);
  end loop;
 end if;
 return r.id;
end $$;
create or replace function public.project_row_review(p_id uuid,p_approve boolean,p_reason text,p_expected timestamptz)
returns void language plpgsql security definer set search_path='' as $$
declare actor uuid:=auth.uid(); r public.project_rows; target uuid; g_id uuid;
begin
 if not exists(select 1 from public.profiles where id=actor and is_active and role in ('head','admin')) then raise exception 'Head/admin approval required' using errcode='42501';end if;
 select project_id into g_id from public.project_rows where id=p_id;
 perform 1 from public.projects where id=g_id and not archived for update;
 if not found then raise exception 'Project unavailable or archived';end if;
 select * into r from public.project_rows where id=p_id for update;
 if not found or r.approval_status<>'pending' then raise exception 'Row is not awaiting review';end if;
 if p_expected is null or p_expected is distinct from r.updated_at then raise exception 'Row changed. Refresh before reviewing.';end if;
 if p_approve is null or length(coalesce(p_reason,''))>1000 or (not p_approve and length(trim(coalesce(p_reason,'')))=0) then raise exception 'Provide a rejection reason (max 1000 characters)';end if;
 update public.project_rows set approval_status=case when p_approve then 'approved' else 'rejected' end,status=case when p_approve then 'Active' else 'Ongoing' end,approved_by=actor,approved_at=now(),rejection_reason=case when p_approve then '' else trim(p_reason) end,updated_at=clock_timestamp() where id=p_id;
 insert into public.project_audit(project_id,row_id,actor_id,action,details) values(r.project_id,r.id,actor,case when p_approve then 'Row approved' else 'Row rejected' end,jsonb_build_object('ticket_no',r.ticket_no,'reason',p_reason));
 for target in select distinct x.id from unnest(case when p_approve then array[r.created_by,r.assigned_to] else array[r.created_by] end) x(id) join public.profiles p on p.id=x.id and p.is_active where x.id<>actor loop
  insert into public.notifications(user_id,sender_id,type,severity,reminder_level,title,message,link) values(target,actor,'manual','info','normal',case when p_approve then 'Project row approved / assigned' else 'Project row rejected' end,left(r.ticket_no||': '||r.custom_name||case when p_approve then ' is now Active.' else '. Reason: '||p_reason end,2000),'/projects?project='||r.project_id);
 end loop;
end $$;
create or replace function public.project_rows_import(p_project uuid,p_rows jsonb)
returns integer language plpgsql security definer set search_path='' as $$
declare entry jsonb; total integer:=0;
begin
 if p_rows is null or jsonb_typeof(p_rows)<>'array' then raise exception 'Expected an array of rows';end if;
 if jsonb_array_length(p_rows) not between 1 and 200 then raise exception 'Import 1 to 200 rows';end if;
 for entry in select value from jsonb_array_elements(p_rows) loop
  perform public.project_row_submit(p_project,null,entry,null);total:=total+1;
 end loop;
 return total;
end $$;
revoke all on function public.project_row_submit(uuid,uuid,jsonb,timestamptz),public.project_row_review(uuid,boolean,text,timestamptz),public.project_rows_import(uuid,jsonb) from public,anon;
grant execute on function public.project_row_submit(uuid,uuid,jsonb,timestamptz),public.project_row_review(uuid,boolean,text,timestamptz),public.project_rows_import(uuid,jsonb) to authenticated;
commit;
