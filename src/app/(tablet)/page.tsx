import { getActiveChecklists } from '@/app/actions/checklist'
import FilaClient from './fila/FilaClient'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const revalidate = 0 // Disable cache for this page

export default async function FilaPage() {
  const cookieStore = await cookies()
  const sessionData = cookieStore.get('funcionario_session')?.value
  if (!sessionData) {
    redirect('/login')
  }

  const user = JSON.parse(sessionData)
  const checklists = await getActiveChecklists(user)
  
  return <FilaClient initialChecklists={checklists} user={user} />
}
