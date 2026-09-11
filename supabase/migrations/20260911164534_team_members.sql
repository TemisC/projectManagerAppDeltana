-- Global address book of people (internal staff + external collaborators),
-- unified in one table because the SPA itself treats them as one pool
-- (App.tsx's availableTeamMembers merges both types for the project picker).

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  contact text not null unique,
  name text not null,
  company text,
  member_type public.member_type not null,
  internal_member_type text,
  default_hourly_rate numeric,
  profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.team_members is 'Global catalog of internal + external people, deduped by contact.';
comment on column public.team_members.profile_id is 'Set only if this person also has a real login (rare for externos).';
