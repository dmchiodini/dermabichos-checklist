const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUUID(value: unknown): value is string {
  return typeof value === 'string' && UUID_RE.test(value)
}

/**
 * Monta o filtro `or` do PostgREST para buscar por nome do pet ou do responsável
 * sem permitir injeção de operadores (vírgulas, parênteses, aspas, curingas).
 */
export function buildPetTutorSearchFilter(term: string): string | null {
  const sanitized = term
    .slice(0, 100)
    .replace(/[%_*\\"(),]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!sanitized) return null
  const pattern = `"%${sanitized}%"`
  return `pet_nome.ilike.${pattern},tutor.ilike.${pattern}`
}

/** Lê um campo texto de FormData com segurança (ignora arquivos). */
export function formString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}
