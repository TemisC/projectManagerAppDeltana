-- Step 1 of 2 for the new "administracion" role. This has to be its own
-- migration, run and committed on its own: Postgres refuses to use a
-- brand-new enum value in the same transaction that added it ("unsafe
-- use of new value of enum type"), and anything referencing it (RLS
-- policies, the admin-create-user Edge Function) would hit exactly that
-- if this weren't isolated first. See the next migration for the actual
-- policy changes.
alter type public.app_role add value 'administracion';
