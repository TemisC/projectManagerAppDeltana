-- Core project data: the project itself, its contacts/deliveries, and the
-- team roster. Financial/rate data lives in separate tables (see later
-- migrations) so RLS can hide it from 'colaborador' without hiding the
-- roster rows it belongs to.

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  code text,
  name text not null,
  export_name text,
  client text not null,
  status public.project_status not null default 'propuesta',
  status_detail text,
  start_date date,
  end_date date,
  closing_email_sent boolean not null default false,
  manager_id uuid not null references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_manager_id_idx on public.projects (manager_id);

create table public.project_contacts (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  contact_group public.contact_group not null,
  name text not null,
  email text,
  phone text,
  description text,
  created_at timestamptz not null default now()
);

create index project_contacts_project_id_idx on public.project_contacts (project_id);

create table public.project_partial_deliveries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  description text not null,
  date date not null,
  completed boolean not null default false
);

create index project_partial_deliveries_project_id_idx on public.project_partial_deliveries (project_id);

-- Team roster: who is on the project, and what they do there. No money here.
create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  team_member_id uuid not null references public.team_members (id),
  role text,
  task text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (project_id, team_member_id)
);

create index project_members_project_id_idx on public.project_members (project_id);
create index project_members_team_member_id_idx on public.project_members (team_member_id);

-- Split out from project_members purely for RLS: this is "coste interno"
-- (financial), so colaborador must never read it even though it can read
-- the rest of the roster row.
create table public.project_member_rates (
  project_member_id uuid primary key references public.project_members (id) on delete cascade,
  hourly_rate numeric
);
