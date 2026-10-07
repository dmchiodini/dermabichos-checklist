'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Clock, Play, CheckCircle2, ChevronRight, ShowerHead, Share2, Search, Calendar } from 'lucide-react'
import { toast } from 'react-toastify'
import { updateChecklistStatus, getFilteredChecklists } from '@/app/actions/checklist'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { logoutFuncionario } from '@/app/actions/auth'

export default function FilaClient({ initialChecklists, user }: { initialChecklists: any[], user: any }) {
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date()
    return new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  })

  const [checklists, setChecklists] = useState(initialChecklists)
  const router = useRouter()
  
  const isRecepcao = user.role === 'recepcao' || user.cargo?.toLowerCase() === 'recepção' || user.cargo?.toLowerCase() === 'recepcao'

  const applyFilters = async () => {
    const data = await getFilteredChecklists(user, filterDate, filterSearch)
    setChecklists(data)
  }

  React.useEffect(() => {
    applyFilters()
  }, [filterDate])

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await updateChecklistStatus(id, newStatus)
      if (res.success) {
        setChecklists(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c))
        toast.success(`Status alterado para ${newStatus}`)
      } else {
        toast.error(res.message)
      }
    } catch (error) {
      toast.error('Erro ao atualizar status')
    }
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Aguardando':
        return { color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200', icon: Clock }
      case 'Em banho':
        return { color: 'text-ceu-deep', bg: 'bg-ceu/20', border: 'border-ceu', icon: ShowerHead }
      case 'Banho finalizado':
        return { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300', icon: CheckCircle2 }
      case 'Finalizado':
        return { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', icon: CheckCircle2 }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200', icon: Clock }
    }
  }

  const handleShare = (checklist: any) => {
    router.push(`/admin/print/${checklist.id}?share=true`)
  }

  const agendamentosHoje = checklists.length
  const finalizados = checklists.filter(c => c.status === 'Finalizado').length

  return (
    <main className="min-h-screen overflow-x-clip bg-espuma px-3 py-6 md:px-8 md:py-10">
      <div className="relative mx-auto max-w-5xl">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
          <div className="flex items-center gap-5">
            <Image
              src="/dermabichos-logo.svg"
              alt="Dermabichos"
              width={88}
              height={88}
              className="size-16 shrink-0 rounded-full ring-4 ring-accent md:size-20"
              priority
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-[2rem]">
                  Fila de Atendimento
                </h1>
                <span className="bg-ceu/10 text-ceu-deep px-2 py-0.5 rounded-full text-xs font-bold border border-ceu/20">{user.nome} ({user.cargo})</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground flex items-center gap-4">
                <button onClick={() => logoutFuncionario()} className="underline hover:text-foreground">Sair da conta</button>
              </p>
            </div>
          </div>
          
          <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
            {isRecepcao && (
              <Link href="/checklist">
                <Button className="h-12 md:h-14 w-full md:w-auto rounded-2xl text-base md:text-lg font-bold shadow-[0_4px_0_-1px_var(--ceu-deep)] hover:bg-ceu/90 px-6 gap-2">
                  <Plus className="size-5" />
                  Novo Checklist
                </Button>
              </Link>
            )}
          </div>
        </header>

        {/* Filtros e Stats */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar pet ou tutor..." 
              className="pl-9 h-12 bg-white rounded-xl"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
          
          <div className="relative w-full md:w-48 shrink-0">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input 
              type="date" 
              className="pl-9 h-12 bg-white rounded-xl"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-4 bg-white px-5 h-12 rounded-xl border shadow-sm w-full md:w-auto md:ml-auto justify-center">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Banhos:</span>
              <span className="text-lg font-black text-ceu-deep">{checklists.length}</span>
            </div>
            <div className="w-px h-5 bg-border"></div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Finalizados:</span>
              <span className="text-lg font-black text-green-600">{checklists.filter(c => c.status === 'Finalizado').length}</span>
            </div>
          </div>
        </div>

        {/* Lista de Checklists */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...checklists].sort((a, b) => {
            const getOrder = (status: string) => {
              if (status === 'Aguardando') return 1;
              if (status === 'Em banho') return 2;
              if (status === 'Finalizado') return 3;
              return 4;
            };
            const orderDiff = getOrder(a.status || '') - getOrder(b.status || '');
            if (orderDiff !== 0) return orderDiff;
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          }).map((checklist) => {
            const config = getStatusConfig(checklist.status || 'Aguardando')
            const StatusIcon = config.icon

            return (
              <div 
                key={checklist.id}
                className="flex flex-col bg-card rounded-[24px] shadow-sm border border-border overflow-hidden transition-all hover:shadow-md"
              >
                <div className="p-5 flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border", config.bg, config.color, config.border)}>
                      <StatusIcon className="size-4" />
                      {checklist.status || 'Aguardando'}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {new Date(checklist.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold leading-tight mb-1">{checklist.pet_nome}</h3>
                  <p className="text-muted-foreground text-sm font-medium mb-3">{checklist.raca} ({checklist.especie})</p>
                  <p className="text-sm font-medium text-foreground"><span className="text-muted-foreground">Tutor:</span> {checklist.tutor}</p>
                </div>

                <div className="border-t border-border bg-accent/30 p-3 flex items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {checklist.status !== 'Finalizado' && checklist.status !== 'Em banho' && checklist.status !== 'Banho finalizado' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleStatusChange(checklist.id, 'Em banho')}
                        className="text-ceu-deep border-ceu/30 hover:bg-ceu/10"
                      >
                        <Play className="size-4 mr-1" /> Iniciar Banho
                      </Button>
                    )}
                    {checklist.status === 'Em banho' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleStatusChange(checklist.id, 'Banho finalizado')}
                        className="text-green-700 border-green-300 hover:bg-green-100"
                      >
                        <CheckCircle2 className="size-4 mr-1" /> Banho Concluído
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex flex-1 items-center gap-2">
                    {checklist.status === 'Finalizado' ? (
                      <Link href={`/checklist?edit=${checklist.id}`} className="flex-1 flex">
                        <Button size="sm" variant="outline" className="w-full border-green-200 text-green-700 bg-green-50 hover:bg-green-100 gap-1 font-semibold">
                          <CheckCircle2 className="size-4" />
                          Ver Concluído
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/checklist?edit=${checklist.id}`} className="flex-1 flex">
                        <Button size="sm" className="w-full bg-rosa text-white hover:bg-rosa/90 gap-1">
                          {isRecepcao ? 'Editar / Finalizar' : 'Visualizar'}
                          <ChevronRight className="size-4" />
                        </Button>
                      </Link>
                    )}

                    {isRecepcao && checklist.status === 'Finalizado' && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => handleShare(checklist)}
                        className="px-2 text-muted-foreground hover:text-foreground border-border shrink-0"
                        title="Compartilhar"
                      >
                        <Share2 className="size-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {checklists.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-card rounded-[28px] border border-dashed border-border">
              <ShowerHead className="size-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-bold text-foreground">Fila vazia</h3>
              <p className="text-muted-foreground mt-2 max-w-sm">
                Nenhum pet aguardando banho no momento.
                {isRecepcao && ' Clique em "Novo Checklist" para iniciar.'}
              </p>
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
