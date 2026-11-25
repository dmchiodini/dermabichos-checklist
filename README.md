> [!IMPORTANT]
> **Propriedade Intelectual & Código Proprietário:**
> Este repositório é disponibilizado publicamente para fins de demonstração técnica e portfólio.
> **Todos os direitos são reservados.** É estritamente proibida a cópia, clonagem para fins comerciais ou redistribuição deste código sem autorização expressa do autor.

---

# Dermabichos Check

Sistema de checklist de banho e tosa: tablet da recepção/equipe + painel administrativo.

- **Next.js 16** (App Router, Server Actions, `proxy.ts`)
- **Supabase** (Postgres, Storage e Auth do painel admin)
- React 19, Tailwind CSS 4, react-hook-form + zod

## Configuração

1. Instale as dependências: `npm install`
2. Copie `.env.example` para `.env.local` e preencha:
   - `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`: chave **service_role** (somente servidor)
   - `SESSION_SECRET`: segredo aleatório com 32 caracteres ou mais
3. Rode `npm run dev` e acesse http://localhost:3000

Em produção (Vercel etc.), cadastre as mesmas variáveis no painel de ambiente.

## Banco de dados

Scripts SQL na raiz (execute no SQL Editor do Supabase):

| Arquivo | Função |
| --- | --- |
| `supabase_tabelas.sql` | Tabelas base |
| `supabase_setup.sql` | Bucket de Storage `checklists` |
| `supabase_adicionar_observacao_cuidados.sql` | Coluna opcional |
| `supabase_seguranca.sql` | **RLS e remoção do acesso público.** Rode depois que o sistema estiver publicado com `SUPABASE_SERVICE_ROLE_KEY` |

Também é recomendado desativar novos cadastros em **Supabase > Authentication > Sign In / Providers > "Allow new users to sign up"**, para que só os administradores já criados acessem o painel.

## Senha do administrador

- **Esqueci minha senha:** link na tela `/admin/login`. O e-mail leva para `/auth/confirm` e depois para `/admin/redefinir-senha`.
- **Alterar senha:** botão "Alterar senha" no cabeçalho do painel. Exige a senha atual.
- Configuração única no Supabase, em **Authentication > URL Configuration**:
  - Site URL: `https://dermabichos-checklist.vercel.app`
  - Redirect URLs: `https://dermabichos-checklist.vercel.app/**` e `http://localhost:3000/**`

## Arquitetura de segurança

- **Todo acesso a dados acontece no servidor.** O navegador nunca fala direto com o banco.
- `src/lib/auth/session.ts`:
  - **Tablet:** cookie `funcionario_session` assinado com HMAC (`SESSION_SECRET`). O funcionário é relido do banco a cada requisição, então desativá-lo corta o acesso na hora.
  - **Admin:** Supabase Auth (`requireAdmin`).
- `src/lib/auth/permissions.ts`: regras de acesso. A recepção vê e gerencia todos os checklists; o operacional vê só os que realiza e não pode finalizar nem excluir.
- `src/lib/auth/password.ts`: senhas com hash **scrypt**. Senhas antigas em texto puro são convertidas automaticamente no próximo login de cada funcionário.
- `src/lib/storage.ts`: uploads validados (tipo de imagem, tamanho máximo de 10 MB, assinatura PNG real).
- Todas as Server Actions validam a sessão e os parâmetros antes de executar.

## Scripts

- `npm run dev`: desenvolvimento
- `npm run build`: build de produção
- `npm run lint`: ESLint
