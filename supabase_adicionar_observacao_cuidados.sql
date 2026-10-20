-- Opcional: Se desejar adicionar a coluna observacao_cuidados diretamente na tabela checklists:
-- (Obs: O sistema já armazena com segurança dentro de 'detalhes.observacao_cuidados' para não quebrar compatibilidade)

ALTER TABLE checklists 
ADD COLUMN IF NOT EXISTS observacao_cuidados text;
