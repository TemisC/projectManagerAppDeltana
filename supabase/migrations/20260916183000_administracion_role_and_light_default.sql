-- Adds the 'administracion' role: same read-only visibility as
-- 'direccion' across every project/financial table, plus exclusive
-- ownership of user management (profiles_update), taken away from
-- 'direccion' per the client's request. Also flips the default theme
-- for brand-new profiles to 'light' (existing rows are untouched --
-- this only affects first-time logins going forward).
--
-- MUST run after a migration that already committed
-- `alter type public.app_role add value 'administracion'` -- Postgres
-- refuses to use a new enum value in the same transaction it was
-- added in.

alter table public.profiles alter column theme_preference set default 'light';

drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (public.current_app_role() in ('direccion', 'administracion') or id = auth.uid());

drop policy profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (public.current_app_role() = 'administracion')
  with check (public.current_app_role() = 'administracion');

drop policy team_members_select on public.team_members;
create policy team_members_select on public.team_members
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion', 'gestor')
    or exists (
      select 1 from public.project_members pm
      where pm.team_member_id = team_members.id
        and public.is_project_member(pm.project_id)
    )
  );

drop policy projects_select on public.projects;
create policy projects_select on public.projects
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or manager_id = auth.uid()
    or public.is_project_member(id)
  );

drop policy project_contacts_select on public.project_contacts;
create policy project_contacts_select on public.project_contacts
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or public.is_project_manager(project_id)
    or public.is_project_member(project_id)
  );

drop policy project_partial_deliveries_select on public.project_partial_deliveries;
create policy project_partial_deliveries_select on public.project_partial_deliveries
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or public.is_project_manager(project_id)
    or public.is_project_member(project_id)
  );

drop policy project_members_select on public.project_members;
create policy project_members_select on public.project_members
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or public.is_project_manager(project_id)
    or public.is_project_member(project_id)
  );

drop policy project_member_rates_select on public.project_member_rates;
create policy project_member_rates_select on public.project_member_rates
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.project_members pm
      where pm.id = project_member_rates.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

drop policy internal_work_ranges_select on public.internal_work_ranges;
create policy internal_work_ranges_select on public.internal_work_ranges
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.project_members pm
      where pm.id = internal_work_ranges.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

drop policy internal_work_range_deliveries_select on public.internal_work_range_deliveries;
create policy internal_work_range_deliveries_select on public.internal_work_range_deliveries
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.internal_work_ranges wr
      join public.project_members pm on pm.id = wr.project_member_id
      where wr.id = internal_work_range_deliveries.work_range_id
        and public.is_project_manager(pm.project_id)
    )
  );

drop policy project_time_logs_select on public.project_time_logs;
create policy project_time_logs_select on public.project_time_logs
  for select to authenticated
  using (public.current_app_role() in ('direccion', 'administracion') or public.is_project_manager(project_id));

drop policy project_time_log_uploads_select on public.project_time_log_uploads;
create policy project_time_log_uploads_select on public.project_time_log_uploads
  for select to authenticated
  using (public.current_app_role() in ('direccion', 'administracion') or public.is_project_manager(project_id));

drop policy project_client_agreement_select on public.project_client_agreement;
create policy project_client_agreement_select on public.project_client_agreement
  for select to authenticated
  using (public.current_app_role() in ('direccion', 'administracion') or public.is_project_manager(project_id));

drop policy project_client_additionals_select on public.project_client_additionals;
create policy project_client_additionals_select on public.project_client_additionals
  for select to authenticated
  using (public.current_app_role() in ('direccion', 'administracion') or public.is_project_manager(project_id));

drop policy project_planned_invoices_select on public.project_planned_invoices;
create policy project_planned_invoices_select on public.project_planned_invoices
  for select to authenticated
  using (public.current_app_role() in ('direccion', 'administracion') or public.is_project_manager(project_id));

drop policy project_invoices_select on public.project_invoices;
create policy project_invoices_select on public.project_invoices
  for select to authenticated
  using (public.current_app_role() in ('direccion', 'administracion') or public.is_project_manager(project_id));

drop policy collaborator_agreements_select on public.collaborator_agreements;
create policy collaborator_agreements_select on public.collaborator_agreements
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_agreements.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

drop policy collaborator_additionals_select on public.collaborator_additionals;
create policy collaborator_additionals_select on public.collaborator_additionals
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_additionals.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

drop policy collaborator_partial_deliveries_select on public.collaborator_partial_deliveries;
create policy collaborator_partial_deliveries_select on public.collaborator_partial_deliveries
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_partial_deliveries.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

drop policy collaborator_planned_invoices_select on public.collaborator_planned_invoices;
create policy collaborator_planned_invoices_select on public.collaborator_planned_invoices
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_planned_invoices.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

drop policy collaborator_payments_select on public.collaborator_payments;
create policy collaborator_payments_select on public.collaborator_payments
  for select to authenticated
  using (
    public.current_app_role() in ('direccion', 'administracion')
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_payments.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

