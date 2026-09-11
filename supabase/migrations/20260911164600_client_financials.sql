-- Client-side financials for a project: the main agreement, additionals,
-- planned billing, and invoices already issued. All financial, all
-- restricted to gerencia (read) / the owning gestor (read+write).

create table public.project_client_agreement (
  project_id uuid primary key references public.projects (id) on delete cascade,
  amount numeric not null,
  offer_url text,
  contract_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_client_additionals (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  description text not null,
  amount numeric not null,
  url text,
  created_at timestamptz not null default now()
);

create index project_client_additionals_project_id_idx on public.project_client_additionals (project_id);

create table public.project_planned_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  description text not null,
  date date not null,
  amount numeric not null,
  percentage numeric,
  source public.invoice_source not null default 'acuerdo',
  invoiced boolean not null default false,
  created_at timestamptz not null default now()
);

create index project_planned_invoices_project_id_idx on public.project_planned_invoices (project_id);

create table public.project_invoices (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  amount numeric not null,
  date date not null,
  pdf_url text,
  percentage numeric,
  source public.invoice_source not null default 'acuerdo',
  created_at timestamptz not null default now()
);

create index project_invoices_project_id_idx on public.project_invoices (project_id);
