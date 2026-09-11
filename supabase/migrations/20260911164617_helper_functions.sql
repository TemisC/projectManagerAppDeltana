-- SECURITY DEFINER helpers used by RLS policies. They must bypass RLS
-- themselves (that's what security definer + a fixed search_path buys us)
-- so that policies can call them without recursing back into the tables
-- they protect.

create function public.current_app_role()
returns public.app_role
language sql
stable
security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_project_manager(p_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.projects
    where id = p_project_id and manager_id = auth.uid()
  );
$$;

create function public.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1
    from public.project_members pm
    join public.team_members tm on tm.id = pm.team_member_id
    where pm.project_id = p_project_id
      and tm.profile_id = auth.uid()
  );
$$;
