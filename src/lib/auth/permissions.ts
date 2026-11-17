// Regras de acesso compartilhadas entre servidor e cliente (sem segredos aqui).

export type SessionUser = {
  id: string
  nome: string
  cargo: string
  role: string
  foto_url: string | null
}

export const CHECKLIST_STATUSES = ['Aguardando', 'Em banho', 'Banho finalizado', 'Finalizado'] as const
export type ChecklistStatus = (typeof CHECKLIST_STATUSES)[number]
export const STATUS_EXCLUIDO = 'Excluido'

export function isChecklistStatus(value: unknown): value is ChecklistStatus {
  return typeof value === 'string' && (CHECKLIST_STATUSES as readonly string[]).includes(value)
}

/** Recepção: role "recepcao" ou cargo "Recepção"/"Recepcao" (mesma regra usada desde o início). */
export function isRecepcao(user: Pick<SessionUser, 'role' | 'cargo'> | null | undefined): boolean {
  if (!user) return false
  const cargo = user.cargo?.toLowerCase()
  return user.role === 'recepcao' || cargo === 'recepção' || cargo === 'recepcao'
}

/** Recepção vê todos os checklists; operacional só os que realizou. */
export function canAccessChecklist(
  user: Pick<SessionUser, 'id' | 'role' | 'cargo'>,
  checklist: { realizado_por_id: string | null }
): boolean {
  return isRecepcao(user) || checklist.realizado_por_id === user.id
}
