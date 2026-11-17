'use client'

import React, { useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addFuncionario, toggleFuncionario, deleteFuncionario, updateFuncionario, addTipoHidratacao, toggleTipoHidratacao, updateTipoHidratacao, deleteTipoHidratacao, deleteChecklist } from '@/app/actions/admin'
import { toast } from 'react-toastify'
import { Printer, Eye, Trash2, ClipboardList, Users, Droplets, Dog, Cat, Check, Minus, Search, Calendar, Edit2, User, Camera, PieChart, Filter, RotateCcw } from 'lucide-react'
import { CiMedicalCross } from 'react-icons/ci'
import { useRouter, useSearchParams } from 'next/navigation'
import { todayLocalISODate } from '@/lib/dates'
import type { ChecklistRow, FuncionarioAdmin, TipoHidratacaoRow } from '@/types/database.types'
import DashboardOverview from './DashboardOverview'

const panel = 'rounded-2xl border border-border bg-white'
const sectionTitle = 'text-2xl font-bold tracking-tight'
const addForm = 'flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row'
const tabTrigger = 'h-11 flex-1 sm:flex-none justify-center gap-2 rounded-xl px-3 sm:px-4 text-sm sm:text-base font-semibold text-muted-foreground hover:text-foreground data-active:bg-white data-active:text-foreground data-active:shadow-sm'

function StatusPill({ ativo }: { ativo: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${ativo ? 'text-ceu-deep' : 'text-muted-foreground'}`}>
      <span aria-hidden className={`size-2 rounded-full ${ativo ? 'bg-ceu' : 'bg-input'}`} />
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function ServiceItem({ label, done }: { label: string; done?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${done ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
      {done
        ? <Check className="size-4 text-ceu-deep" aria-label="Sim" />
        : <Minus className="size-4 opacity-50" aria-label="Não" />}
      {label}
    </li>
  )
}

function DetailBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="font-heading text-lg font-semibold text-ceu-deep">{title}</h3>
      {children}
    </section>
  )
}

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

export default function DashboardClient({
  initialChecklists,
  initialFuncionarios,
  initialTiposHidratacao
}: {
  initialChecklists: ChecklistRow[]
  initialFuncionarios: FuncionarioAdmin[]
  initialTiposHidratacao: TipoHidratacaoRow[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const defaultDate = todayLocalISODate()

  const initialStartDate = searchParams.get('startDate') || searchParams.get('date') || defaultDate
  const initialEndDate = searchParams.get('endDate') || searchParams.get('startDate') || searchParams.get('date') || defaultDate
  const initialStatus = searchParams.get('status') || 'todos'
  const initialSearch = searchParams.get('search') || ''

  const [filterStartDate, setFilterStartDate] = useState(initialStartDate)
  const [filterEndDate, setFilterEndDate] = useState(initialEndDate)
  const [filterStatus, setFilterStatus] = useState(initialStatus)
  const [filterSearch, setFilterSearch] = useState(initialSearch)

  const [currentTab, setCurrentTab] = useState(searchParams.get('tab') || 'visao-geral')

  // Sincroniza os filtros quando a URL muda (padrão recomendado pelo React: ajuste durante o render)
  const searchParamsKey = searchParams.toString()
  const [prevSearchParamsKey, setPrevSearchParamsKey] = useState(searchParamsKey)
  if (prevSearchParamsKey !== searchParamsKey) {
    setPrevSearchParamsKey(searchParamsKey)
    setFilterStartDate(initialStartDate)
    setFilterEndDate(initialEndDate)
    setFilterStatus(initialStatus)
    setFilterSearch(initialSearch)
    const tab = searchParams.get('tab')
    if (tab) setCurrentTab(tab)
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    params.set('tab', 'checklists')
    if (filterStartDate) params.set('startDate', filterStartDate)
    if (filterEndDate) params.set('endDate', filterEndDate)
    if (filterStatus && filterStatus !== 'todos') params.set('status', filterStatus)
    if (filterSearch && filterSearch.trim()) params.set('search', filterSearch.trim())
    router.push(`/admin/dashboard?${params.toString()}`)
  }

  const clearFilters = () => {
    setFilterStartDate(defaultDate)
    setFilterEndDate(defaultDate)
    setFilterStatus('todos')
    setFilterSearch('')
    router.push('/admin/dashboard?tab=checklists')
  }

  const hasActiveFilters = Boolean(
    (filterStatus && filterStatus !== 'todos') ||
    (filterSearch && filterSearch.trim() !== '') ||
    (filterStartDate && filterStartDate !== defaultDate) ||
    (filterEndDate && filterEndDate !== defaultDate)
  )

  const funcFormRef = useRef<HTMLFormElement>(null)
  const hidFormRef = useRef<HTMLFormElement>(null)

  const [editingFuncionario, setEditingFuncionario] = useState<FuncionarioAdmin | null>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<ChecklistRow | null>(null)
  const [checklistToDelete, setChecklistToDelete] = useState<string | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null)
  const [isSavingFuncionario, setIsSavingFuncionario] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [editingTipoHidratacao, setEditingTipoHidratacao] = useState<TipoHidratacaoRow | null>(null)
  const [isSavingHidratacao, setIsSavingHidratacao] = useState(false)

  return (
    <Tabs
      value={currentTab}
      onValueChange={(val) => {
        setCurrentTab(val)
        const params = new URLSearchParams(searchParams.toString())
        params.set('tab', val)
        router.replace(`/admin/dashboard?${params.toString()}`, { scroll: false })
      }}
      className="w-full gap-6 sm:gap-8"
    >
      <TabsList className="h-auto w-full grid grid-cols-2 gap-1.5 rounded-2xl bg-muted p-1.5 sm:flex sm:w-fit">
        <TabsTrigger value="visao-geral" className={tabTrigger}><PieChart aria-hidden />Visão Geral</TabsTrigger>
        <TabsTrigger value="checklists" className={tabTrigger}><ClipboardList aria-hidden />Checklists</TabsTrigger>
        <TabsTrigger value="funcionarios" className={tabTrigger}><Users aria-hidden />Funcionários</TabsTrigger>
        <TabsTrigger value="hidratacao" className={tabTrigger}><Droplets aria-hidden />Hidratações</TabsTrigger>
      </TabsList>

      <TabsContent value="visao-geral" className="space-y-5">
        <DashboardOverview />
      </TabsContent>

      <TabsContent value="checklists" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className={sectionTitle}>Checklists</h2>
            <p className="text-sm text-muted-foreground">
              {initialChecklists.length === 1
                ? '1 checklist encontrado'
                : `${initialChecklists.length} checklists encontrados`}
            </p>
          </div>
        </div>

        {/* Painel de Filtros: Status, Período de Duas Datas e Busca */}
        <div className="rounded-2xl border border-border bg-white p-4 sm:p-5 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 items-end">
            {/* Campo de Busca */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Pet ou responsável..."
                  className="h-11 sm:h-12 pl-9 bg-muted/20 text-sm"
                  value={filterSearch}
                  onChange={(e) => setFilterSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
            </div>

            {/* Filtro por Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status</Label>
              <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val || 'todos')}>
                <SelectTrigger className="h-11 sm:h-12 data-[size=default]:h-11 sm:data-[size=default]:h-12 w-full bg-muted/20 text-sm">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="Aguardando">Aguardando</SelectItem>
                  <SelectItem value="Em banho">Em banho</SelectItem>
                  <SelectItem value="Banho finalizado">Banho finalizado</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                  <SelectItem value="Excluido">Excluído</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Período: Data Início */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data início</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  className="h-11 sm:h-12 pl-9 bg-muted/20 text-sm"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
            </div>

            {/* Período: Data Fim */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Data fim</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="date"
                  className="h-11 sm:h-12 pl-9 bg-muted/20 text-sm"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                />
              </div>
            </div>
          </div>

          {/* Rodapé do Painel de Filtros */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
            <div className="text-xs text-muted-foreground">
              {filterStartDate === filterEndDate ? (
                <span>Data: <strong className="text-foreground">{formatDateDisplay(filterStartDate)}</strong></span>
              ) : (
                <span>Período: <strong className="text-foreground">{formatDateDisplay(filterStartDate)}</strong> até <strong className="text-foreground">{formatDateDisplay(filterEndDate)}</strong></span>
              )}
              {filterStatus !== 'todos' && (
                <span className="ml-2 font-medium">• Status: <strong className="text-foreground">{filterStatus === 'Excluido' ? 'Excluído' : filterStatus}</strong></span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={clearFilters}
                  className="h-10 rounded-xl px-3 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="size-3.5 mr-1.5" />
                  Limpar filtros
                </Button>
              )}
              <Button
                type="button"
                onClick={applyFilters}
                className="h-10 rounded-xl px-5 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Filter className="size-4 mr-1.5" />
                Filtrar
              </Button>
            </div>
          </div>
        </div>

        {initialChecklists.length === 0 ? (
          <div className={`${panel} px-6 py-14 text-center`}>
            <p className="font-heading text-lg font-semibold">Nenhum checklist encontrado</p>
            <p className="mt-1 text-muted-foreground">
              {hasActiveFilters
                ? 'Nenhum resultado corresponde aos filtros selecionados. Tente ajustar o período, status ou termo de busca.'
                : 'Os checklists preenchidos no tablet da recepção aparecem aqui.'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters} className="mt-4 rounded-xl">
                <RotateCcw className="size-3.5 mr-1.5" />
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <ul className={`${panel} divide-y divide-border overflow-hidden`}>
            {initialChecklists.map((item) => {
              const SpeciesIcon = item.especie === 'Felina' ? Cat : Dog
              const status = item.status || 'Aguardando'
              const config = status === 'Aguardando' ? { color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' } :
                status === 'Em banho' ? { color: 'text-ceu-deep', bg: 'bg-ceu/20', border: 'border-ceu' } :
                  status === 'Banho finalizado' ? { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' } :
                    status === 'Finalizado' ? { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' } :
                      status === 'Excluido' ? { color: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' } :
                        { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' }

              return (
                <li key={item.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center md:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-full ${item.especie === 'Felina' ? 'bg-secondary text-rosa-deep' : 'bg-accent text-ceu-deep'}`}>
                      <SpeciesIcon className="size-6" aria-label={item.especie} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="truncate font-heading text-lg leading-tight font-bold">{item.pet_nome}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.color} ${config.border}`}>
                          {status === 'Excluido' ? 'Excluído' : status}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{item.raca}, de {item.tutor}</p>
                    </div>
                  </div>
                  <time dateTime={item.created_at} className="text-sm text-muted-foreground tabular-nums sm:w-40 sm:text-right">
                    {new Date(item.created_at).toLocaleString('pt-BR')}
                  </time>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="h-10 flex-1 rounded-xl px-4 text-sm font-semibold sm:flex-none"
                      onClick={() => setSelectedChecklist(item)}
                    >
                      <Eye className="size-4" aria-hidden />
                      Ver ficha
                    </Button>
                    <Button
                      variant="ghost"
                      className="size-10 rounded-xl p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Excluir checklist de ${item.pet_nome}`}
                      onClick={() => setChecklistToDelete(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </TabsContent>

      <TabsContent value="funcionarios" className="space-y-5">
        <h2 className={sectionTitle}>Funcionários</h2>

        <form ref={funcFormRef} action={async (formData) => {
          const res = await addFuncionario(formData)
          if (!res.success) {
            toast.error(res.message)
          } else {
            toast.success('Funcionário cadastrado!')
            funcFormRef.current?.reset()
            router.refresh()
          }
        }} className={`${addForm} flex-col`}>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Input name="nome" aria-label="Nome do funcionário" placeholder="Nome do funcionário" required className="h-14 w-full sm:flex-1" />
            <Input name="cargo" aria-label="Cargo" placeholder="Cargo (Ex: Banhista, Tosador)" required className="h-14 w-full sm:flex-1" />
            <div className="flex-1">
              <Select name="role" required>
                <SelectTrigger className="h-14 data-[size=default]:h-14 w-full text-base bg-white" aria-label="Nível de Acesso">
                  <SelectValue placeholder="Nível de Acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Recepção">Recepção</SelectItem>
                  <SelectItem value="Operacional">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Input name="login" aria-label="Login (Usuário)" placeholder="Nome de usuário para login" required className="h-14 w-full sm:flex-1" />
            <Input type="password" name="senha" aria-label="Senha" placeholder="Senha" required className="h-14 w-full sm:flex-1" />
            <Button type="submit" className="h-14 rounded-xl px-6 text-base sm:w-auto w-full">Cadastrar</Button>
          </div>
        </form>

        {initialFuncionarios.length > 0 && (
          <ul className={`${panel} divide-y divide-border`}>
            {initialFuncionarios.map((func) => (
              <li key={func.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
                <div className="flex flex-col min-w-0 gap-1">
                  <div className="flex min-w-0 items-center gap-3">
                    {func.foto_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={func.foto_url} alt={func.nome} className="size-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm" />
                    ) : (
                      <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0 ring-2 ring-white shadow-sm">
                        <User className="size-5 text-muted-foreground" />
                      </div>
                    )}
                    <span className="font-semibold text-lg">{func.nome}</span>
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">{func.cargo}</span>
                  </div>
                  {func.login && (
                    <span className="text-xs text-muted-foreground font-mono bg-muted/30 px-2 py-0.5 rounded w-fit">
                      login: {func.login}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  <StatusPill ativo={func.ativo} />
                  <Button
                    variant={func.ativo ? 'outline' : 'default'}
                    className="h-9 w-24 rounded-lg text-sm font-semibold"
                    onClick={async () => {
                      await toggleFuncionario(func.id, func.ativo)
                      router.refresh()
                    }}
                  >
                    {func.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    onClick={() => {
                      setEditingFuncionario(func)
                      setPhotoPreviewUrl(null)
                      setEditPhotoUrl(null)
                      setSelectedPhotoFile(null)
                    }}
                    aria-label="Editar"
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    onClick={async () => {
                      if (confirm('Tem certeza que deseja excluir este usuário?')) {
                        const res = await deleteFuncionario(func.id)
                        if (!res.success) {
                          toast.error(res.message)
                        } else {
                          toast.success('Usuário excluído!')
                          router.refresh()
                        }
                      }
                    }}
                    aria-label="Excluir"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}


        {/* Modal de Edição de Funcionário */}
        <Dialog open={!!editingFuncionario} onOpenChange={(open) => {
          if (!open) {
            setEditingFuncionario(null)
            setEditPhotoUrl(null)
            setSelectedPhotoFile(null)
          }
        }}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Funcionário</DialogTitle>
            </DialogHeader>
            {editingFuncionario && (
              <form action={async (formData) => {
                if (selectedPhotoFile) {
                  formData.set('foto', selectedPhotoFile)
                }
                setIsSavingFuncionario(true)
                const res = await updateFuncionario(formData)
                setIsSavingFuncionario(false)
                if (!res.success) {
                  toast.error(res.message)
                } else {
                  toast.success('Funcionário atualizado!')
                  setEditingFuncionario(null)
                  setEditPhotoUrl(null)
                  setSelectedPhotoFile(null)
                  router.refresh()
                }
              }} className="space-y-4 pt-4">
                <input type="hidden" name="id" value={editingFuncionario.id} />

                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative size-32 overflow-hidden rounded-2xl ring-1 ring-border group bg-accent/40">
                    {(editPhotoUrl || editingFuncionario.foto_url) ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={editPhotoUrl || editingFuncionario.foto_url || undefined}
                        alt="Foto do funcionário"
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full flex-col items-center justify-center gap-2 text-ceu-deep">
                        <Camera className="size-7" aria-hidden />
                        <span className="text-xs font-semibold">Adicionar foto</span>
                      </div>
                    )}

                    <label
                      htmlFor="edit-funcionario-foto-input"
                      className={`absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/40 text-white transition-opacity ${(editPhotoUrl || editingFuncionario.foto_url) ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 hover:opacity-100'
                        }`}
                    >
                      <Camera className="size-6 mb-1" />
                      <span className="text-xs font-semibold">
                        {(editPhotoUrl || editingFuncionario.foto_url) ? 'Trocar foto' : 'Escolher foto'}
                      </span>
                    </label>

                    <input
                      id="edit-funcionario-foto-input"
                      type="file"
                      name="foto"
                      accept="image/*"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          setSelectedPhotoFile(file)
                          setEditPhotoUrl(URL.createObjectURL(file))
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <Label>Nome do funcionário</Label>
                  <Input name="nome" defaultValue={editingFuncionario.nome} required className="h-14" />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex flex-col gap-3">
                    <Label>Cargo (Ex: Banhista, Tosador)</Label>
                    <Input name="cargo" defaultValue={editingFuncionario.cargo} required className="h-14" />
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <Label>Nível de Acesso</Label>
                    <Select name="role" defaultValue={editingFuncionario.role === 'recepcao' ? 'Recepção' : 'Operacional'} required>
                      <SelectTrigger className="h-14 data-[size=default]:h-14 w-full text-base bg-white">
                        <SelectValue placeholder="Nível de Acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Recepção">Recepção</SelectItem>
                        <SelectItem value="Operacional">Operacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex flex-col gap-3">
                    <Label>Login (Usuário)</Label>
                    <Input name="login" defaultValue={editingFuncionario.login ?? undefined} required className="h-14" />
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <Label>Nova Senha (Opcional)</Label>
                    <Input type="password" name="senha" placeholder="Deixe em branco para não alterar" className="h-14" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditingFuncionario(null)} className="h-14 px-6" disabled={isSavingFuncionario}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="h-14 px-6" disabled={isSavingFuncionario}>
                    {isSavingFuncionario ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </TabsContent>

      <TabsContent value="hidratacao" className="space-y-5">
        <h2 className={sectionTitle}>Tipos de hidratação</h2>

        <form ref={hidFormRef} action={async (formData) => {
          const res = await addTipoHidratacao(formData)
          if (!res.success) {
            toast.error(res.message)
          } else {
            toast.success('Hidratação cadastrada!')
            hidFormRef.current?.reset()
          }
        }} className={addForm}>
          <Input name="nome" aria-label="Nome da hidratação" placeholder="Nome da hidratação (Ex: Argan, Queratina)" required className="h-14 w-full sm:flex-1" />
          <Button type="submit" className="h-14 rounded-xl px-6 text-base w-full sm:w-auto">Cadastrar</Button>
        </form>

        {initialTiposHidratacao.length > 0 && (
          <ul className={`${panel} divide-y divide-border`}>
            {initialTiposHidratacao.map((tipo) => (
              <li key={tipo.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
                <span className="font-semibold">{tipo.nome}</span>
                <div className="flex items-center gap-4">
                  <StatusPill ativo={tipo.ativo} />
                  <Button
                    variant={tipo.ativo ? 'outline' : 'default'}
                    className="h-9 w-24 rounded-lg text-sm font-semibold"
                    onClick={() => toggleTipoHidratacao(tipo.id, tipo.ativo)}
                  >
                    {tipo.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-lg"
                    onClick={() => setEditingTipoHidratacao(tipo)}
                    aria-label="Editar"
                    title="Editar hidratação"
                  >
                    <Edit2 className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={async () => {
                      if (confirm('Tem certeza que deseja excluir esta hidratação?')) {
                        const res = await deleteTipoHidratacao(tipo.id)
                        if (!res.success) {
                          toast.error(res.message)
                        } else {
                          toast.success('Hidratação excluída!')
                        }
                      }
                    }}
                    title="Excluir hidratação"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Modal de Edição de Tipo de Hidratação */}
        <Dialog open={!!editingTipoHidratacao} onOpenChange={(open) => {
          if (!open) setEditingTipoHidratacao(null)
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Tipo de Hidratação</DialogTitle>
            </DialogHeader>
            {editingTipoHidratacao && (
              <form action={async (formData) => {
                setIsSavingHidratacao(true)
                const res = await updateTipoHidratacao(formData)
                setIsSavingHidratacao(false)
                if (!res.success) {
                  toast.error(res.message)
                } else {
                  toast.success('Tipo de hidratação atualizado com sucesso!')
                  setEditingTipoHidratacao(null)
                  router.refresh()
                }
              }} className="space-y-4 pt-4">
                <input type="hidden" name="id" value={editingTipoHidratacao.id} />
                
                <div className="space-y-2">
                  <Label htmlFor="edit-hid-nome">Nome da hidratação</Label>
                  <Input
                    id="edit-hid-nome"
                    name="nome"
                    defaultValue={editingTipoHidratacao.nome}
                    required
                    className="h-14"
                    placeholder="Ex: Argan, Queratina, Dermabichos"
                    autoFocus
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingTipoHidratacao(null)}
                    className="h-12 px-6"
                    disabled={isSavingHidratacao}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 px-6 font-bold"
                    disabled={isSavingHidratacao}
                  >
                    {isSavingHidratacao ? 'Salvando...' : 'Salvar Alterações'}
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </TabsContent>

      {/* Checklist View Modal */}
      <Dialog open={!!selectedChecklist} onOpenChange={(open) => !open && setSelectedChecklist(null)}>
        <DialogContent className="max-h-[90vh] w-[94vw] max-w-4xl gap-0 overflow-y-auto rounded-3xl p-0 sm:max-w-4xl">
          {selectedChecklist && (
            <>
              <DialogHeader className="flex flex-col gap-4 border-b border-border px-6 pt-7 pb-5 sm:flex-row sm:items-end sm:justify-between md:px-8">
                <div>
                  <DialogTitle className="font-heading text-3xl font-extrabold tracking-tight">{selectedChecklist.pet_nome}</DialogTitle>
                  <p className="mt-1 text-muted-foreground">
                    {selectedChecklist.raca} ({selectedChecklist.especie}), entrada em {new Date(selectedChecklist.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-10 rounded-xl px-4 text-sm font-semibold"
                  onClick={() => window.open(`/admin/print/${selectedChecklist.id}`, '_blank')}
                >
                  <Printer className="size-4" aria-hidden />
                  Imprimir ficha
                </Button>
              </DialogHeader>

              {selectedChecklist.status === 'Excluido' && (
                <div className="rounded-2xl border-2 border-red-300 bg-red-50/90 p-5 mx-6 mt-6 md:mx-8">
                  <div className="flex items-center gap-2 text-red-700 font-bold text-base mb-2">
                    <Trash2 className="size-5 text-red-600" />
                    <span>Checklist Excluído</span>
                    {selectedChecklist.detalhes?.excluido_em && (
                      <span className="text-xs font-medium text-red-600 ml-auto">
                        Excluído em: {new Date(selectedChecklist.detalhes.excluido_em).toLocaleString('pt-BR')}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl bg-white border border-red-200 p-3.5 text-sm text-red-950">
                    <span className="font-bold text-red-800 block mb-1">Motivo da exclusão:</span>
                    <p className="whitespace-pre-line leading-relaxed font-medium">
                      {selectedChecklist.detalhes?.motivo_exclusao || selectedChecklist.motivo_exclusao || 'Motivo não informado.'}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-8 px-6 py-6 md:px-8">
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Responsável</dt>
                    <dd className="font-semibold">{selectedChecklist.tutor}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Realizado por</dt>
                    <dd className="font-semibold">{initialFuncionarios.find(f => f.id === selectedChecklist.realizado_por_id)?.nome || selectedChecklist.realizado_por_id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-muted-foreground">Vistoriado por</dt>
                    <dd className="font-semibold">{initialFuncionarios.find(f => f.id === selectedChecklist.vistoriado_por_id)?.nome || selectedChecklist.vistoriado_por_id}</dd>
                  </div>
                </dl>

                <div className="grid grid-cols-1 gap-6 rounded-2xl bg-espuma p-5 sm:grid-cols-3">
                  <DetailBlock title="Estética e higiene">
                    <ul className="space-y-1.5 text-sm">
                      <ServiceItem label="Laço" done={selectedChecklist.detalhes?.laco} />
                      <ServiceItem label="Brilho" done={selectedChecklist.detalhes?.brilho} />
                      <ServiceItem label="Perfume" done={selectedChecklist.detalhes?.perfume} />
                      <ServiceItem label="Escovação dentária" done={selectedChecklist.detalhes?.escova_dente} />
                    </ul>
                  </DetailBlock>
                  <DetailBlock title="Tosa">
                    <ul className="space-y-1.5 text-sm">
                      <ServiceItem label="Higiênica" done={selectedChecklist.tosa?.higienica} />
                      <ServiceItem label="Máquina" done={selectedChecklist.tosa?.maquina} />
                      <ServiceItem label="Tesoura" done={selectedChecklist.tosa?.tesoura} />
                    </ul>
                  </DetailBlock>
                  <DetailBlock title="Banho / Hidratação">
                    <p className="text-sm">
                      Tipo: <span className="font-semibold">{selectedChecklist.hidratacao?.qual || (selectedChecklist.hidratacao?.hipoalergenico ? 'Hipoalergênica' : selectedChecklist.hidratacao?.padrao ? 'Padrão' : 'Nenhuma')}</span>
                    </p>
                    {selectedChecklist.hidratacao?.shampoo_terapeutico && (
                      <ul className="mt-2 space-y-1 text-sm">
                        <ServiceItem label="Shampoo terapêutico" done={true} />
                      </ul>
                    )}
                  </DetailBlock>
                </div>

                {(selectedChecklist.observacao || selectedChecklist.observacao_cuidados || selectedChecklist.detalhes?.observacao_cuidados) && (
                  <DetailBlock title="Observações">
                    {(selectedChecklist.detalhes?.cuidados_medicos || selectedChecklist.cuidados_medicos) ? (
                      <div className="rounded-2xl border-2 border-red-400 bg-red-50/40 p-4">
                        <div className="flex items-center gap-2 mb-2 text-red-600 font-bold text-sm">
                          <CiMedicalCross className="size-4 text-red-600 stroke-1" />
                          Alerta de saúde
                        </div>
                        <p className="text-sm text-red-950 font-medium whitespace-pre-line leading-relaxed">
                          {selectedChecklist.observacao}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {selectedChecklist.observacao && (
                          <p className="rounded-2xl border-l-4 border-rosa bg-secondary/60 px-5 py-3.5 leading-relaxed whitespace-pre-line text-sm">
                            {selectedChecklist.observacao}
                          </p>
                        )}
                        {(selectedChecklist.observacao_cuidados || selectedChecklist.detalhes?.observacao_cuidados) && (
                          <div className="rounded-2xl border-2 border-red-400 bg-red-50/40 p-4">
                            <div className="flex items-center gap-2 mb-2 text-red-600 font-bold text-sm">
                              <CiMedicalCross className="size-4 text-red-600 stroke-1" />
                              Alerta de saúde
                            </div>
                            <p className="text-sm text-red-950 font-medium whitespace-pre-line leading-relaxed">
                              {selectedChecklist.observacao_cuidados || selectedChecklist.detalhes?.observacao_cuidados}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </DetailBlock>
                )}

                {(selectedChecklist.foto_1_url || selectedChecklist.foto_2_url) && (
                  <DetailBlock title="Fotos">
                    <div className="flex flex-wrap gap-4">
                      {[selectedChecklist.foto_1_url, selectedChecklist.foto_2_url].filter((url): url is string => Boolean(url)).map((url, i) => (
                        <div key={i} className="group relative size-48 overflow-hidden rounded-2xl ring-1 ring-border">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt={`Foto ${i + 1} de ${selectedChecklist.pet_nome}`} className="size-full object-cover transition-transform duration-300 group-hover:scale-105" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="size-12 rounded-full shadow-lg"
                              onClick={() => setPhotoPreviewUrl(url)}
                            >
                              <Eye className="size-6 text-ceu-deep" aria-hidden />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DetailBlock>
                )}

                <DetailBlock title="Assinatura do responsável">
                  {selectedChecklist.assinatura_url && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={selectedChecklist.assinatura_url} alt={`Assinatura de ${selectedChecklist.tutor}`} className="h-32 rounded-2xl border border-border bg-white object-contain px-4" />
                  )}
                </DetailBlock>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Photo Preview Modal */}
      <Dialog open={!!photoPreviewUrl} onOpenChange={(open) => !open && setPhotoPreviewUrl(null)}>
        <DialogContent showCloseButton={false} className="max-w-[calc(100%-2rem)] sm:max-w-4xl border-none bg-transparent p-0 shadow-none">
          {photoPreviewUrl && (
            <div className="relative flex w-full flex-col items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoPreviewUrl} alt="Foto ampliada" className="max-h-[85vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl" />
              <Button
                variant="outline"
                size="icon"
                className="absolute top-3 right-3 size-10 rounded-full bg-white/80 backdrop-blur-sm shadow-md hover:bg-white"
                onClick={() => setPhotoPreviewUrl(null)}
              >
                <span className="font-heading text-xl">×</span>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!checklistToDelete} onOpenChange={(open) => !open && setChecklistToDelete(null)}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl font-bold">Excluir checklist definitivamente?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">Esta ação excluirá o checklist permanentemente do banco de dados. Essa ação não pode ser desfeita.</p>
          <div className="mt-4 flex justify-end gap-3">
            <Button variant="outline" className="h-11 rounded-xl px-5 text-base font-semibold" onClick={() => setChecklistToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button
              disabled={isDeleting}
              className="h-11 rounded-xl bg-destructive px-5 text-base font-semibold text-white hover:bg-destructive/90"
              onClick={async () => {
                if (!checklistToDelete) return
                setIsDeleting(true)
                const res = await deleteChecklist(checklistToDelete)
                setIsDeleting(false)

                if (res.success) {
                  toast.success('Checklist excluído definitivamente do banco de dados!')
                  setChecklistToDelete(null)
                  if (selectedChecklist?.id === checklistToDelete) setSelectedChecklist(null)
                } else {
                  toast.error('Erro ao excluir: ' + res.message)
                }
              }}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir definitivamente'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
