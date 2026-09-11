-- External-collaborator financials, one agreement per (project, external
-- team member) via project_member_id. Mirrors project_client_* in shape,
-- including the same acuerdo/adicionales 'source' split (types.ts already
-- has this for collaborators, see PLAN_MAESTRO.md section 3.1).

create table public.collaborator_agreements (
  project_member_id uuid primary key references public.project_members (id) on delete cascade,
  amount numeric,
  contract_url text,
  start_date date,
  end_date date,
  work_received boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.collaborator_additionals (
  id uuid primary key default gen_random_uuid(),
  project_member_id uuid not null references public.project_members (id) on delete cascade,
  description text not null,
  amount numeric not null,
  url text,
  created_at timestamptz not null default now()
);

create index collaborator_additionals_project_member_id_idx on public.collaborator_additionals (project_member_id);

create table public.collaborator_partial_deliveries (
  id uuid primary key default gen_random_uuid(),
  project_member_id uuid not null references public.project_members (id) on delete cascade,
  description text not null,
  date date not null,
  completed boolean not null default false
);

create index collaborator_partial_deliveries_project_member_id_idx on public.collaborator_partial_deliveries (project_member_id);

create table public.collaborator_planned_invoices (
  id uuid primary key default gen_random_uuid(),
  project_member_id uuid not null references public.project_members (id) on delete cascade,
  description text not null,
  date date not null,
  amount numeric not null,
  percentage numeric,
  source public.invoice_source not null default 'acuerdo',
  invoiced boolean not null default false,
  created_at timestamptz not null default now()
);

create index collaborator_planned_invoices_project_member_id_idx on public.collaborator_planned_invoices (project_member_id);

create table public.collaborator_payments (
  id uuid primary key default gen_random_uuid(),
  project_member_id uuid not null references public.project_members (id) on delete cascade,
  amount numeric not null,
  date date not null,
  pdf_url text,
  percentage numeric,
  source public.invoice_source not null default 'acuerdo',
  created_at timestamptz not null default now()
);

create index collaborator_payments_project_member_id_idx on public.collaborator_payments (project_member_id);
