-- Business profile for every real login (1:1 with auth.users). Created
-- automatically when a new auth user signs up; Gerencia promotes the role
-- afterwards via SQL editor (there is no in-app user management screen).

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text,
  role public.app_role not null default 'colaborador',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Business data for each authenticated app user; role drives RLS.';

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();
