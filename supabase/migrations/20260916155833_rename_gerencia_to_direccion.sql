-- Renames the "gerencia" role to "direccion" (client-requested naming
-- change). Postgres enum renames preserve the value's OID, so every
-- existing row already carrying this role, and every RLS policy that
-- compares against it (all resolved to the OID at CREATE POLICY time,
-- not by label text), keep working unchanged — no policy rewrites needed.
alter type public.app_role rename value 'gerencia' to 'direccion';
