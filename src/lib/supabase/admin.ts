import 'server-only'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'
import { getSupabaseUrl } from './env'

/**
 * Cliente Supabase com a chave service_role (ignora RLS).
 * NUNCA deve ser importado em componentes cliente. Só use depois de validar
 * a sessão do usuário (requireAdmin / requireFuncionario).
 */
export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'Variável de ambiente SUPABASE_SERVICE_ROLE_KEY não configurada. ' +
      'Copie a chave "service_role" em Supabase > Project Settings > API e adicione ao .env.local / ambiente de produção.'
    )
  }

  return createSupabaseClient<Database>(getSupabaseUrl(), serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

export const STORAGE_BUCKET = 'checklists'
