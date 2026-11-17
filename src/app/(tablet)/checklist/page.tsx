import { redirect } from 'next/navigation'
import { requireFuncionarioPage } from '@/lib/auth/session'
import { isRecepcao as checkRecepcao } from '@/lib/auth/permissions'
import TabletClient from '../TabletClient'

export const revalidate = 0

export default async function TabletPage(props: { searchParams: Promise<{ edit?: string }> }) {
  const searchParams = await props.searchParams
  const user = await requireFuncionarioPage()
  const isRecepcao = checkRecepcao(user)

  if (!isRecepcao && !searchParams.edit) {
    // Operacional doesn't have access to create new checklists, send them to fila
    redirect('/')
  }

  return <TabletClient isRecepcao={isRecepcao} />
}
