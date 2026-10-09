-- SQL Editor after monitoring migration; all fixture changes roll back.
begin;
create temporary table monitoring_fixture(g uuid,r uuid,poc uuid,employee uuid);
grant select on monitoring_fixture to authenticated;
do $$
declare h uuid; p uuid; e uuid; g uuid; r uuid;
begin
 select id into h from public.profiles where is_active and role in ('head','admin') limit 1;
 select id into p from public.profiles where is_active and role='employee' limit 1;
 select id into e from public.profiles where is_active and role='employee' and id<>p limit 1;
 if h is null or p is null or e is null then raise exception 'Need head/admin and two active employees';end if;
 perform set_config('request.jwt.claim.sub',h::text,true);
 g:=public.project_save(null,'Monitoring permission test','Test client','VIP',p,false);
 r:=public.project_row_submit(g,null,jsonb_build_object('ticket_no','MON-1','custom_name','Test item','assigned_to',e),null);
 insert into monitoring_fixture values(g,r,p,e);
 perform public.project_monitoring_post(r,'Head update','Validate',null);
end $$;
select set_config('request.jwt.claim.sub',(select employee::text from monitoring_fixture),true);
set local role authenticated;
do $$
begin
 if public.project_can_monitor((select g from monitoring_fixture)) then raise exception 'Assigned row must NOT grant monitoring access';end if;
 if exists(select 1 from public.project_monitoring_updates where project_id=(select g from monitoring_fixture)) then raise exception 'Employee read monitoring history';end if;
 if exists(select 1 from jsonb_array_elements(public.project_monitoring_snapshot()->'projects') g where g->>'id'=(select g::text from monitoring_fixture)) then raise exception 'Employee read monitoring snapshot';end if;
 begin
  perform public.project_monitoring_post((select r from monitoring_fixture),'Unauthorized','',null);
  raise exception 'Unauthorized post succeeded';
 exception when insufficient_privilege then null;
 end;
end $$;
reset role;
select set_config('request.jwt.claim.sub',(select poc::text from monitoring_fixture),true);
set local role authenticated;
do $$
begin
 if not public.project_can_monitor((select g from monitoring_fixture)) then raise exception 'POC missing access';end if;
 perform public.project_monitoring_post((select r from monitoring_fixture),'POC update','Follow up',current_date);
 if (select count(*) from public.project_monitoring_updates where project_id=(select g from monitoring_fixture))<>2 then raise exception 'History was not retained';end if;
end $$;
reset role;
update public.projects set poc_id=null where id=(select g from monitoring_fixture);
set local role authenticated;
do $$
begin
 if public.project_can_monitor((select g from monitoring_fixture)) then raise exception 'Former POC retains access';end if;
 raise notice 'PASS: employee denied, POC allowed, append history retained, POC removal revokes monitoring';
end $$;
reset role;
rollback;
