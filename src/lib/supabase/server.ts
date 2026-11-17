import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database.types'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

/**
 * Cliente Supabase com a chave pública (anon) e os cookies da requisição.
 * Usado SOMENTE para autenticação do painel administrativo (Supabase Auth).
 * Para ler/gravar dados, use `createAdminClient` depois de validar a sessão.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Chamado a partir de um Server Component: pode ser ignorado,
          // pois o proxy (src/proxy.ts) já renova a sessão a cada requisição.
        }
      },
    },
  })
}
