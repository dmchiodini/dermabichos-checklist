-- Tabela de Funcionários
create table if not exists funcionarios (
    id uuid default gen_random_uuid() primary key,
    nome text not null,
    cargo text not null,
    ativo boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Tabela de Tipos de Hidratação
create table if not exists tipos_hidratacao (
    id uuid default gen_random_uuid() primary key,
    nome text not null,
    ativo boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Garantir que as tabelas permitam inserção e edição (sem RLS por enquanto para simplificar o admin interno)
-- Se quiser, podemos habilitar RLS depois!

-- Coluna opcional caso queira gravar motivo_exclusao diretamente em coluna separada além de detalhes (JSONB):
-- alter table checklists add column if not exists motivo_exclusao text;

