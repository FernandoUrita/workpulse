-- Run after BOTH Projects migrations in SQL Editor. Fixture writes are rolled back.
begin;
do $$
declare h uuid; e uuid; dev uuid; g uuid; r uuid; stamp timestamptz; payload jsonb; count_before integer;
begin
 select id into h from public.profiles where is_active and role in ('head','admin') limit 1;
 select id into e from public.profiles where is_active and role='employee' limit 1;
 select id into dev from public.profiles where is_active and id not in(h,e) limit 1;
 if h is null or e is null or dev is null then raise exception 'Need active head/admin, employee and third user';end if;
 perform set_config('request.jwt.claim.sub',h::text,true);
 g:=public.project_save(null,'Fixed columns test','Wilcon','VVIP',e,false);
 payload:=jsonb_build_object('ticket_no','TEST-001','custom_name','Migration','client_name','Wilcon','client_tier','VVIP','applied_to','Wilcon','system','JPS','priority','High','assigned_to',e,'assigned_dev','External Dev','assigned_qa','External QA','status','Ongoing','is_signed',false,'deployment_date','2026-10-15','pending_to','Client','remarks','Waiting for sign-off');
 perform set_config('request.jwt.claim.sub',e::text,true);
 r:=public.project_row_submit(g,null,payload,null);
 if not exists(select 1 from public.project_rows where id=r and approval_status='pending') then raise exception 'New row must await review';end if;
 select updated_at into stamp from public.project_rows where id=r;
 begin
  perform public.project_row_review(r,true,'',stamp);
  raise exception 'SECURITY FAILURE: employee approved a row';
 exception when insufficient_privilege then null;
 end;
 select count(*) into count_before from public.project_rows where project_id=g;
 begin
  perform public.project_rows_import(g,jsonb_build_array(payload||'{"ticket_no":"TEST-NEW"}'::jsonb,payload));
  raise exception 'TEST FAILURE: duplicate import succeeded';
 exception when unique_violation then null;
 end;
 if (select count(*) from public.project_rows where project_id=g)<>count_before then raise exception 'Import was not atomic';end if;
 perform set_config('request.jwt.claim.sub',h::text,true);
 perform public.project_row_review(r,true,'Approved',stamp);
 if not exists(select 1 from public.project_rows where id=r and approval_status='approved' and status='Active' and approved_by=h) then raise exception 'Approval did not activate row';end if;
 if exists(select 1 from public.notifications where user_id=dev and title='Project row approved / assigned' and link='/projects?project='||g) then raise exception 'Plain text Dev/QA must not receive account notifications';end if;
 if not exists(select 1 from public.project_rows where id=r and assigned_dev='External Dev' and assigned_qa='External QA' and client_name='Wilcon' and client_tier='VVIP') then raise exception 'Incorrect inherited fields or text owners';end if;
 perform set_config('request.jwt.claim.sub',e::text,true);
 select updated_at into stamp from public.project_rows where id=r;
 perform public.project_row_submit(g,r,payload,stamp);
 if not exists(select 1 from public.project_rows where id=r and approval_status='pending' and approved_at is null) then raise exception 'Employee edit must require review again';end if;
 begin
  perform public.project_row_submit(g,r,payload,stamp);
  raise exception 'TEST FAILURE: stale edit accepted';
 exception when raise_exception then if sqlerrm not like 'Row changed.%' then raise;end if;
 end;
 raise notice 'PASS: fixed fields, employee submission, head approval, reassignment notifications, atomic import and stale-edit guard';
end $$;
rollback;
