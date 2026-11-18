'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Clock, Play, CheckCircle2, ChevronRight, ShowerHead, Share2, Search, RefreshCw, Trash2 } from 'lucide-react'
import { CiMedicalCross } from 'react-icons/ci'
import { toast } from 'react-toastify'
import { updateChecklistStatus, getFilteredChecklists, softDeleteChecklist } from '@/app/actions/checklist'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/date-picker'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { todayLocalISODate } from '@/lib/dates'
import { isRecepcao as checkRecepcao, type SessionUser } from '@/lib/auth/permissions'
import { logoutFuncionario } from '@/app/actions/auth'
import type { ChecklistRow } from '@/types/database.types'

const hasAlertaSaude = (checklist: ChecklistRow) => Boolean(checklist.detalhes?.cuidados_medicos || checklist.cuidados_medicos)
const getObservacaoCuidados = (checklist: ChecklistRow) => checklist.detalhes?.observacao_cuidados || checklist.observacao_cuidados

export default function FilaClient({ initialChecklists, user }: { initialChecklists: ChecklistRow[], user: SessionUser }) {
  const [filterSearch, setFilterSearch] = useState('')
  const [filterDate, setFilterDate] = useState(todayLocalISODate)

  const [checklists, setChecklists] = useState(initialChecklists)
  const [checklistToDelete, setChecklistToDelete] = useState<ChecklistRow | null>(null)
  const [motivoExclusao, setMotivoExclusao] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const isRecepcao = checkRecepcao(user)

  // Guarda o termo de busca atual para a recarga automática ao trocar a data
  const filterSearchRef = useRef(filterSearch)
  useEffect(() => {
    filterSearchRef.current = filterSearch
  }, [filterSearch])

  const fetchChecklists = (date: string, search: string) =>
    getFilteredChecklists(date, search).catch((error) => {
      console.error(error)
      toast.error('Não foi possível atualizar a fila. Faça login novamente.')
      return null
    })

  const applyFilters = async () => {
    const data = await fetchChecklists(filterDate, filterSearch)
    if (data) setChecklists(data)
  }

  useEffect(() => {
    let ignore = false
    fetchChecklists(filterDate, filterSearchRef.current).then((data) => {
      if (!ignore && data) setChecklists(data)
    })
    return () => {
      ignore = true
    }
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
    } catch {
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

  const handleShare = (checklist: ChecklistRow) => {
    router.push(`/admin/print/${checklist.id}?share=true`)
  }

  return (
    <main className="min-h-screen overflow-x-clip bg-espuma px-3 py-6 md:px-8 md:py-10">
      <div className="relative mx-auto max-w-5xl">

        {/* Header */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 mb-8">
          <div className="flex items-center gap-5">
            {user.foto_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.foto_url}
                alt={user.nome}
                className="size-16 shrink-0 rounded-full object-cover ring-4 ring-accent md:size-20"
              />
            ) : (
              <Image
                src="/dermabichos-icon.svg"
                alt="Dermabichos"
                width={88}
                height={88}
                className="size-16 shrink-0 rounded-full ring-4 ring-accent md:size-20 bg-white"
                priority
              />
            )}
            <div>
              <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-[2rem]">
                Fila de atendimento
              </h1>
              <div className="mt-1 flex items-center gap-3">
                <span className="bg-ceu/10 text-ceu-deep px-2 py-0.5 rounded-full text-xs font-bold border border-ceu/20">{user.nome} ({user.cargo})</span>
                <button type="button" onClick={() => logoutFuncionario()} className="text-sm text-muted-foreground underline hover:text-foreground transition-colors">Sair da conta</button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-3 w-full md:w-auto">
            {isRecepcao && (
              <Link
                href="/checklist"
                className={cn(buttonVariants(), "h-12 md:h-14 w-full md:w-auto rounded-2xl text-base md:text-lg font-bold shadow-[0_4px_0_-1px_var(--ceu-deep)] hover:bg-ceu/90 px-6 gap-2")}
              >
                <Plus className="size-5" aria-hidden />
                Novo checklist
              </Link>
            )}
          </div>
        </header>

        {/* Filtros e Stats */}
        <div className="flex flex-col md:flex-row items-center gap-3 mb-6">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar pet ou responsável..."
              className="pl-9 h-12 bg-white rounded-xl"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>

          <div className="flex w-full md:w-auto gap-3 shrink-0">
            <DatePicker
              aria-label="Data da fila"
              value={filterDate}
              onChange={setFilterDate}
              className="flex-1 md:w-48"
            />
            <Button
              variant="outline"
              onClick={() => {
                toast.info('Atualizando fila...', { autoClose: 1000 })
                applyFilters()
              }}
              className="h-12 px-4 rounded-xl border-border bg-white text-muted-foreground hover:text-foreground"
              aria-label="Atualizar cards"
            >
              <RefreshCw className="size-5" />
            </Button>
          </div>

          <div className="flex items-center gap-4 bg-white px-5 h-12 rounded-xl border shadow-sm w-full md:w-auto md:ml-auto justify-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Banhos</span>
              <span className="text-lg font-black text-ceu-deep">{checklists.length}</span>
            </div>
            <div className="w-px h-5 bg-border"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-muted-foreground">Finalizados</span>
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
              if (status === 'Banho finalizado') return 3;
              if (status === 'Finalizado') return 4;
              return 5;
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
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {new Date(checklist.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isRecepcao && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setChecklistToDelete(checklist)
                            setMotivoExclusao('')
                          }}
                          className="-mr-2 grid size-10 place-items-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                          title="Excluir checklist da fila"
                          aria-label={`Excluir checklist de ${checklist.pet_nome}`}
                        >
                          <Trash2 className="size-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold leading-tight mb-1">{checklist.pet_nome}</h3>
                  <p className="text-muted-foreground text-sm font-medium mb-3">{checklist.raca} ({checklist.especie})</p>
                  <p className="text-sm font-medium text-foreground"><span className="text-muted-foreground">Responsável:</span> {checklist.tutor}</p>

                  {hasAlertaSaude(checklist) && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 p-2 text-xs text-red-700">
                      <CiMedicalCross className="size-4 shrink-0 text-red-600 mt-0.5" />
                      <span className="font-semibold line-clamp-2">
                        {checklist.observacao ? `Alerta de saúde: ${checklist.observacao}` : 'Alerta de saúde'}
                      </span>
                    </div>
                  )}
                  {!hasAlertaSaude(checklist) && getObservacaoCuidados(checklist) && (
                    <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 p-2 text-xs text-red-700">
                      <CiMedicalCross className="size-4 shrink-0 text-red-600 mt-0.5" />
                      <span className="font-semibold line-clamp-2">
                        {getObservacaoCuidados(checklist)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-border bg-accent/30 p-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex gap-2">
                    {checklist.status !== 'Finalizado' && checklist.status !== 'Em banho' && checklist.status !== 'Banho finalizado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(checklist.id, 'Em banho')}
                        className="h-10 rounded-xl px-3 text-sm text-ceu-deep border-ceu/30 hover:bg-ceu/10"
                      >
                        <Play className="size-4" aria-hidden /> Iniciar banho
                      </Button>
                    )}
                    {checklist.status === 'Em banho' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(checklist.id, 'Banho finalizado')}
                        className="h-10 rounded-xl px-3 text-sm text-green-700 border-green-300 hover:bg-green-100"
                      >
                        <CheckCircle2 className="size-4" aria-hidden /> Banho concluído
                      </Button>
                    )}
                    {checklist.status === 'Banho finalizado' && isRecepcao && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusChange(checklist.id, 'Finalizado')}
                        className="h-10 rounded-xl px-3 text-sm text-green-700 border-green-300 hover:bg-green-100 font-semibold"
                        title="Finalizar atendimento diretamente"
                      >
                        <CheckCircle2 className="size-4" aria-hidden /> Concluir
                      </Button>
                    )}
                  </div>

                  <div className="flex min-w-40 flex-1 items-center gap-2">
                    {checklist.status === 'Finalizado' ? (
                      <Link
                        href={`/checklist?edit=${checklist.id}`}
                        className={cn(buttonVariants({ size: 'sm', variant: 'outline' }), "h-10 rounded-xl px-3 text-sm flex-1 border-green-200 text-green-700 bg-green-50 hover:bg-green-100 hover:text-green-800 gap-1 font-semibold")}
                      >
                        <CheckCircle2 className="size-4" aria-hidden />
                        Ver concluído
                      </Link>
                    ) : (
                      <Link
                        href={`/checklist?edit=${checklist.id}`}
                        className={cn(buttonVariants({ size: 'sm' }), "h-10 rounded-xl px-3 text-sm flex-1 bg-rosa text-foreground hover:bg-rosa/85 gap-1")}
                      >
                        {isRecepcao ? 'Editar / Finalizar' : 'Visualizar'}
                        <ChevronRight className="size-4" aria-hidden />
                      </Link>
                    )}

                    {isRecepcao && checklist.status === 'Finalizado' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleShare(checklist)}
                        className="size-10 rounded-xl p-0 text-muted-foreground hover:text-foreground border-border shrink-0"
                        title="Compartilhar"
                        aria-label={`Compartilhar ficha de ${checklist.pet_nome}`}
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
                {isRecepcao && ' Toque em "Novo checklist" para iniciar.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal de Confirmação de Exclusão (Recepção) */}
        <Dialog open={!!checklistToDelete} onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setChecklistToDelete(null)
            setMotivoExclusao('')
          }
        }}>
          <DialogContent className="max-w-md rounded-3xl p-6">
            <DialogHeader>
              <DialogTitle className="font-heading text-xl font-bold flex items-center gap-2 text-destructive">
                <Trash2 className="size-5" />
                Excluir Checklist
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm text-muted-foreground mt-2">
              Deseja remover o checklist de <strong className="text-foreground">{checklistToDelete?.pet_nome}</strong>?
              Ele sairá da fila de atendimento.
            </p>

            <div className="space-y-2 mt-4">
              <Label htmlFor="motivo-exclusao" className="text-sm font-semibold text-foreground">
                Motivo da exclusão <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo-exclusao"
                placeholder="Informe o motivo da exclusão (obrigatório)..."
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                className="min-h-22.5 rounded-xl resize-none"
                autoFocus
              />
              {!motivoExclusao.trim() && (
                <p className="text-xs text-muted-foreground">
                  É obrigatório informar o motivo antes de confirmar a exclusão.
                </p>
              )}
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl px-5 text-sm font-semibold"
                onClick={() => {
                  setChecklistToDelete(null)
                  setMotivoExclusao('')
                }}
                disabled={isDeleting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-11 rounded-xl px-5 text-sm font-bold"
                disabled={!motivoExclusao.trim() || isDeleting}
                onClick={async () => {
                  if (!checklistToDelete || !motivoExclusao.trim()) return
                  setIsDeleting(true)
                  const res = await softDeleteChecklist(checklistToDelete.id, motivoExclusao.trim())
                  setIsDeleting(false)

                  if (res.success) {
                    setChecklists(prev => prev.filter(c => c.id !== checklistToDelete.id))
                    toast.success('Checklist excluído da fila com sucesso!')
                    setChecklistToDelete(null)
                    setMotivoExclusao('')
                  } else {
                    toast.error(res.message || 'Erro ao excluir checklist')
                  }
                }}
              >
                {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </main>
  )
}
