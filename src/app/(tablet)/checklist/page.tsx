import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import TabletClient from '../TabletClient'

export const revalidate = 0

export default async function TabletPage(props: { searchParams: Promise<{ edit?: string }> }) {
  const searchParams = await props.searchParams
  const cookieStore = await cookies()
  const sessionData = cookieStore.get('funcionario_session')?.value
  
  if (!sessionData) {
    redirect('/login')
  }

  const user = JSON.parse(sessionData)
  const isRecepcao = user.role === 'recepcao' || user.cargo?.toLowerCase() === 'recepção' || user.cargo?.toLowerCase() === 'recepcao'

  if (!isRecepcao && !searchParams.edit) {
    // Operacional doesn't have access to create new checklists, send them to fila
    redirect('/')
  }

  return <TabletClient user={user} />
}
