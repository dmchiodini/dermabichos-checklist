function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Variável de ambiente ${name} não configurada. Veja o arquivo .env.example.`)
  }
  return value
}

// Acesso estático (process.env.X) para que o Next.js consiga embutir as variáveis públicas.
export const getSupabaseUrl = () => required('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
export const getSupabaseAnonKey = () => required('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
