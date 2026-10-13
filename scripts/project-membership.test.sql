-- Run after membership migration. Requires one active head/admin and two employees.
-- Fixture writes are rolled back; no live data changes persist.
begin;
create temporary table membership_fixture(g uuid, member uuid, outsider uuid);
grant select on membership_fixture to authenticated;
do $$
declare h uuid; e uuid; o uuid; g uuid; r uuid;
begin
 select id into h from public.profiles where is_active and role in ('head','admin') limit 1;
 select id into e from public.profiles where is_active and role='employee' limit 1;
 select id into o from public.profiles where is_active and role='employee' and id<>e limit 1;
 if h is null or e is null or o is null then raise exception 'Need an active head/admin and two employees';end if;
 perform set_config('request.jwt.claim.sub',h::text,true);
 g:=public.project_save(null,'Membership test','Test client','VIP',e,false);
 r:=public.project_row_submit(g,null,jsonb_build_object('ticket_no','ACCESS-1','custom_name','Assigned item','assigned_to',e),null);
 perform public.project_row_submit(g,null,jsonb_build_object('ticket_no','ACCESS-2','custom_name','Other item','assigned_to',o),null);
 -- Remove Group POC: membership must still follow row assignment.
 perform public.project_save(g,'Membership test','Test client','VIP',null,false);
 insert into membership_fixture values(g,e,o);
end $$;
select set_config('request.jwt.claim.sub',(select member::text from membership_fixture),true);
set local role authenticated;
do $$
begin
 if (select count(*) from public.projects where id=(select g from membership_fixture))<>1 then raise exception 'Member must see group';end if;
 if (select count(*) from public.project_rows where project_id=(select g from membership_fixture))<>2 then raise exception 'Member must see ALL rows';end if;
end $$;
reset role;
-- Keep Created By as the former member: creator is not an access grant.
update public.project_rows set created_by=(select member from membership_fixture),assigned_to=null where project_id=(select g from membership_fixture) and assigned_to=(select member from membership_fixture);
set local role authenticated;
do $$
begin
 if exists(select 1 from public.projects where id=(select g from membership_fixture)) or exists(select 1 from public.project_rows where project_id=(select g from membership_fixture)) or exists(select 1 from public.project_audit where project_id=(select g from membership_fixture)) then raise exception 'Former member still has access';end if;
 begin
  perform public.project_row_submit((select g from membership_fixture),null,jsonb_build_object('ticket_no','BYPASS','custom_name','Unauthorized'),null);
  raise exception 'Outsider RPC bypass succeeded';
 exception when insufficient_privilege then null;
 end;
 raise notice 'PASS: assigned membership sees whole group; removed member loses all reads and cannot submit';
end $$;
reset role;
rollback;
