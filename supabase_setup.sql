-- Execute esse script no SQL Editor do seu Supabase para criar o bucket de Storage e as permissões necessárias

-- 1. Cria o bucket para as fotos e assinaturas (se não existir)
insert into storage.buckets (id, name, public)
values ('checklists', 'checklists', true)
on conflict (id) do nothing;

-- 2. Permite acesso público para leitura das imagens
create policy "Imagens publicamente acessíveis"
on storage.objects for select
to public
using ( bucket_id = 'checklists' );

-- 3. Permite upload autenticado ou anônimo (ajuste a segurança conforme necessário)
create policy "Permitir uploads"
on storage.objects for insert
to public
with check ( bucket_id = 'checklists' );
