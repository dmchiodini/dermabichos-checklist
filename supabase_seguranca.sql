-- =============================================================================
-- Dermabichos Check: endurecimento de segurança do banco
-- =============================================================================
-- Execute no SQL Editor do Supabase SOMENTE DEPOIS de publicar a nova versão
-- do sistema com a variável SUPABASE_SERVICE_ROLE_KEY configurada.
--
-- A partir desta versão, todo acesso a dados é feito pelo servidor (Next.js)
-- com a chave service_role, depois de validar a sessão do usuário. Por isso a
-- chave pública (anon), que fica visível no navegador, não precisa e NÃO deve
-- ter acesso às tabelas.
-- =============================================================================

-- 1. Liga o RLS nas tabelas (sem políticas = ninguém com a chave anon acessa).
alter table public.funcionarios     enable row level security;
alter table public.tipos_hidratacao enable row level security;
alter table public.checklists       enable row level security;

-- 2. Remove políticas antigas que possam liberar acesso público a essas tabelas.
do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('funcionarios', 'tipos_hidratacao', 'checklists')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- 3. Revoga privilégios diretos dos papéis públicos (defesa extra além do RLS).
revoke all on table public.funcionarios     from anon, authenticated;
revoke all on table public.tipos_hidratacao from anon, authenticated;
revoke all on table public.checklists       from anon, authenticated;

-- 4. Storage: uploads agora são feitos só pelo servidor (service_role).
--    Remove a política que permitia qualquer pessoa enviar arquivos ao bucket.
drop policy if exists "Permitir uploads" on storage.objects;

-- A leitura pública das imagens ("Imagens publicamente acessíveis") é mantida,
-- pois as fotos e assinaturas são exibidas/impressas pelo sistema. Os nomes dos
-- arquivos são UUIDs aleatórios, impossíveis de adivinhar.

-- 5. (Recomendado) Garante login único por funcionário.
--    Se este comando falhar, existem logins duplicados: corrija-os e rode de novo.
-- create unique index if not exists funcionarios_login_unique on public.funcionarios (login);
