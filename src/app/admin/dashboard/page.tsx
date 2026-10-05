import React from 'react'
import { logout } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export const dynamic = 'force-dynamic' // Ensure it always fetches fresh data

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: checklists } = await supabase
    .from('checklists')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: funcionarios } = await supabase
    .from('funcionarios')
    .select('*')
    .order('nome')

  const { data: tiposHidratacao } = await supabase
    .from('tipos_hidratacao')
    .select('*')
    .order('nome')

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto flex justify-between items-center bg-white p-6 rounded-lg shadow mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
        <form action={logout}>
          <Button variant="outline" type="submit">Sair (Logout)</Button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow">
        <DashboardClient 
          initialChecklists={checklists || []} 
          initialFuncionarios={funcionarios || []}
          initialTiposHidratacao={tiposHidratacao || []}
        />
      </div>
    </div>
  )
}
