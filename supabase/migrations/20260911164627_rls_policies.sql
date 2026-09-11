-- Row Level Security. This is the only real access-control layer (no
-- backend server), so every table gets RLS enabled and an explicit set of
-- policies. Rules ported from PMEC's src/lib/authorization.ts, see
-- PLAN_MAESTRO.md section 5.
--
-- Role reminder: gerencia = reads everything, edits nothing project-side.
-- gestor = full read/write, but only on projects they manage. colaborador =
-- read-only roster access to projects they belong to, never anything
-- financial (coste interno, acuerdos, facturas, colaboradores externos).

-- ============================== profiles ==================================
alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select to authenticated
  using (public.current_app_role() = 'gerencia' or id = auth.uid());

create policy profiles_update on public.profiles
  for update to authenticated
  using (public.current_app_role() = 'gerencia')
  with check (public.current_app_role() = 'gerencia');

-- =============================== team_members ==============================
alter table public.team_members enable row level security;

create policy team_members_select on public.team_members
  for select to authenticated
  using (
    public.current_app_role() in ('gerencia', 'gestor')
    or exists (
      select 1 from public.project_members pm
      where pm.team_member_id = team_members.id
        and public.is_project_member(pm.project_id)
    )
  );

create policy team_members_insert on public.team_members
  for insert to authenticated
  with check (public.current_app_role() in ('gerencia', 'gestor'));

create policy team_members_update on public.team_members
  for update to authenticated
  using (public.current_app_role() in ('gerencia', 'gestor'))
  with check (public.current_app_role() in ('gerencia', 'gestor'));

create policy team_members_delete on public.team_members
  for delete to authenticated
  using (public.current_app_role() in ('gerencia', 'gestor'));

-- ================================ projects ==================================
alter table public.projects enable row level security;

create policy projects_select on public.projects
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or manager_id = auth.uid()
    or public.is_project_member(id)
  );

create policy projects_insert on public.projects
  for insert to authenticated
  with check (public.current_app_role() = 'gestor' and manager_id = auth.uid());

create policy projects_update on public.projects
  for update to authenticated
  using (public.current_app_role() = 'gestor' and manager_id = auth.uid())
  with check (public.current_app_role() = 'gestor' and manager_id = auth.uid());

create policy projects_delete on public.projects
  for delete to authenticated
  using (public.current_app_role() = 'gestor' and manager_id = auth.uid());

-- ===================== project_contacts / partial_deliveries ================
-- Roster-level data (not financial): same visibility as the project itself,
-- writable only by the owning gestor.
alter table public.project_contacts enable row level security;
alter table public.project_partial_deliveries enable row level security;

create policy project_contacts_select on public.project_contacts
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or public.is_project_manager(project_id)
    or public.is_project_member(project_id)
  );

create policy project_contacts_write on public.project_contacts
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

create policy project_partial_deliveries_select on public.project_partial_deliveries
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or public.is_project_manager(project_id)
    or public.is_project_member(project_id)
  );

create policy project_partial_deliveries_write on public.project_partial_deliveries
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

-- ============================= project_members ===============================
-- Team roster: colaborador can read it (needs to see who's on the project),
-- but never project_member_rates (split out precisely for this reason).
alter table public.project_members enable row level security;
alter table public.project_member_rates enable row level security;

create policy project_members_select on public.project_members
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or public.is_project_manager(project_id)
    or public.is_project_member(project_id)
  );

create policy project_members_write on public.project_members
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

create policy project_member_rates_select on public.project_member_rates
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.project_members pm
      where pm.id = project_member_rates.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy project_member_rates_write on public.project_member_rates
  for all to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.id = project_member_rates.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.id = project_member_rates.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

-- ============================ internal cost (financial) =======================
alter table public.internal_work_ranges enable row level security;
alter table public.internal_work_range_deliveries enable row level security;
alter table public.project_time_logs enable row level security;
alter table public.project_time_log_uploads enable row level security;

create policy internal_work_ranges_select on public.internal_work_ranges
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.project_members pm
      where pm.id = internal_work_ranges.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy internal_work_ranges_write on public.internal_work_ranges
  for all to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.id = internal_work_ranges.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.id = internal_work_ranges.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy internal_work_range_deliveries_select on public.internal_work_range_deliveries
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.internal_work_ranges wr
      join public.project_members pm on pm.id = wr.project_member_id
      where wr.id = internal_work_range_deliveries.work_range_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy internal_work_range_deliveries_write on public.internal_work_range_deliveries
  for all to authenticated
  using (
    exists (
      select 1 from public.internal_work_ranges wr
      join public.project_members pm on pm.id = wr.project_member_id
      where wr.id = internal_work_range_deliveries.work_range_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.internal_work_ranges wr
      join public.project_members pm on pm.id = wr.project_member_id
      where wr.id = internal_work_range_deliveries.work_range_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy project_time_logs_select on public.project_time_logs
  for select to authenticated
  using (public.current_app_role() = 'gerencia' or public.is_project_manager(project_id));

create policy project_time_logs_write on public.project_time_logs
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

create policy project_time_log_uploads_select on public.project_time_log_uploads
  for select to authenticated
  using (public.current_app_role() = 'gerencia' or public.is_project_manager(project_id));

create policy project_time_log_uploads_write on public.project_time_log_uploads
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

-- ========================= client financials (financial) ======================
alter table public.project_client_agreement enable row level security;
alter table public.project_client_additionals enable row level security;
alter table public.project_planned_invoices enable row level security;
alter table public.project_invoices enable row level security;

create policy project_client_agreement_select on public.project_client_agreement
  for select to authenticated
  using (public.current_app_role() = 'gerencia' or public.is_project_manager(project_id));

create policy project_client_agreement_write on public.project_client_agreement
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

create policy project_client_additionals_select on public.project_client_additionals
  for select to authenticated
  using (public.current_app_role() = 'gerencia' or public.is_project_manager(project_id));

create policy project_client_additionals_write on public.project_client_additionals
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

create policy project_planned_invoices_select on public.project_planned_invoices
  for select to authenticated
  using (public.current_app_role() = 'gerencia' or public.is_project_manager(project_id));

create policy project_planned_invoices_write on public.project_planned_invoices
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

create policy project_invoices_select on public.project_invoices
  for select to authenticated
  using (public.current_app_role() = 'gerencia' or public.is_project_manager(project_id));

create policy project_invoices_write on public.project_invoices
  for all to authenticated
  using (public.is_project_manager(project_id))
  with check (public.is_project_manager(project_id));

-- ==================== collaborator (external) financials =======================
alter table public.collaborator_agreements enable row level security;
alter table public.collaborator_additionals enable row level security;
alter table public.collaborator_partial_deliveries enable row level security;
alter table public.collaborator_planned_invoices enable row level security;
alter table public.collaborator_payments enable row level security;

create policy collaborator_agreements_select on public.collaborator_agreements
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_agreements.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_agreements_write on public.collaborator_agreements
  for all to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_agreements.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_agreements.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_additionals_select on public.collaborator_additionals
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_additionals.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_additionals_write on public.collaborator_additionals
  for all to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_additionals.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_additionals.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_partial_deliveries_select on public.collaborator_partial_deliveries
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_partial_deliveries.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_partial_deliveries_write on public.collaborator_partial_deliveries
  for all to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_partial_deliveries.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_partial_deliveries.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_planned_invoices_select on public.collaborator_planned_invoices
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_planned_invoices.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_planned_invoices_write on public.collaborator_planned_invoices
  for all to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_planned_invoices.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_planned_invoices.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_payments_select on public.collaborator_payments
  for select to authenticated
  using (
    public.current_app_role() = 'gerencia'
    or exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_payments.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );

create policy collaborator_payments_write on public.collaborator_payments
  for all to authenticated
  using (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_payments.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  )
  with check (
    exists (
      select 1 from public.project_members pm
      where pm.id = collaborator_payments.project_member_id
        and public.is_project_manager(pm.project_id)
    )
  );
