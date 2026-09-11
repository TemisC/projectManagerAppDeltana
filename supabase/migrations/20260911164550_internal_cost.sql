-- Internal cost tracking: projected hours (InternalWorkRange) vs. actual
-- hours (Odoo CSV import + manual adjustments). Both are financial data.

create table public.internal_work_ranges (
  id uuid primary key default gen_random_uuid(),
  project_member_id uuid not null references public.project_members (id) on delete cascade,
  task_name text not null,
  start_date date not null,
  end_date date not null,
  dedication_percentage numeric not null,
  holidays_count integer not null default 0,
  manual_hours numeric,
  created_at timestamptz not null default now()
);

create index internal_work_ranges_project_member_id_idx on public.internal_work_ranges (project_member_id);

create table public.internal_work_range_deliveries (
  id uuid primary key default gen_random_uuid(),
  work_range_id uuid not null references public.internal_work_ranges (id) on delete cascade,
  description text not null,
  date date not null,
  completed boolean not null default false
);

create index internal_work_range_deliveries_work_range_id_idx on public.internal_work_range_deliveries (work_range_id);

-- Actual hours: bulk CSV/Excel import from Odoo, plus manual admin
-- corrections (utils/timeTrackingParser.ts + InternalTeam.tsx). Never
-- self-reported by the colaborador themselves.
create table public.project_time_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  date date not null,
  employee_name text not null,
  hours numeric not null,
  project_name_ref text,
  created_at timestamptz not null default now()
);

create index project_time_logs_project_id_idx on public.project_time_logs (project_id);

-- Metadata of the last CSV/Excel import for a project (fileName/uploadedAt
-- shown in the UI).
create table public.project_time_log_uploads (
  project_id uuid primary key references public.projects (id) on delete cascade,
  file_name text,
  uploaded_at timestamptz
);
