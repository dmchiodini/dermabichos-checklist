import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getAdminUser, getFuncionario } from '@/lib/auth/session'
import { canAccessChecklist } from '@/lib/auth/permissions'
import { isUUID } from '@/lib/validation'
import PrintClient from './PrintClient'

export const dynamic = 'force-dynamic'

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Acesso: administrador logado ou funcionário do tablet com permissão sobre o checklist.
  const [admin, funcionario] = await Promise.all([getAdminUser(), getFuncionario()])
  if (!admin && !funcionario) redirect('/login')

  const fallback = admin ? '/admin/dashboard' : '/'
  if (!isUUID(id)) redirect(fallback)

  const supabase = createAdminClient()
  const { data: checklist } = await supabase.from('checklists').select('*').eq('id', id).maybeSingle()

  if (!checklist) redirect(fallback)
  if (!admin && funcionario && !canAccessChecklist(funcionario, checklist)) redirect(fallback)

  const { data: funcionarios } = await supabase.from('funcionarios').select('id, nome')

  return <PrintClient checklist={checklist} funcionarios={funcionarios ?? []} />
}
