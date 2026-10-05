import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import PrintClient from './PrintClient'

export default async function PrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: checklist } = await supabase
    .from('checklists')
    .select('*')
    .eq('id', id)
    .single()

  if (!checklist) redirect('/admin/dashboard')

  const { data: funcionarios } = await supabase.from('funcionarios').select('id, nome')

  return <PrintClient checklist={checklist} funcionarios={funcionarios || []} />
}
