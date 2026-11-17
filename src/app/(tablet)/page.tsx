import { getActiveChecklists } from '@/app/actions/checklist'
import { requireFuncionarioPage } from '@/lib/auth/session'
import FilaClient from './fila/FilaClient'

export const revalidate = 0 // Disable cache for this page

export default async function FilaPage() {
  const user = await requireFuncionarioPage()
  const checklists = await getActiveChecklists()

  return <FilaClient initialChecklists={checklists} user={user} />
}
