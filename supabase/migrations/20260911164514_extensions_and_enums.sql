-- Extensions and shared enum types used across the schema.

create extension if not exists "pgcrypto" with schema extensions;

create type public.app_role as enum ('gerencia', 'gestor', 'colaborador');

create type public.member_type as enum ('interno', 'externo');

create type public.project_status as enum ('propuesta', 'en_proceso', 'finalizado');

create type public.invoice_source as enum ('acuerdo', 'adicionales');

create type public.contact_group as enum ('tecnico', 'economico', 'general');
