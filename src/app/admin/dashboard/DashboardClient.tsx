'use client'

import React, { useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addFuncionario, toggleFuncionario, deleteFuncionario, updateFuncionario, addTipoHidratacao, toggleTipoHidratacao, deleteChecklist } from '@/app/actions/admin'
import { toast } from 'react-toastify'
import { Printer, Eye, Trash2, ClipboardList, Users, Droplets, Dog, Cat, Check, Minus, Search, Calendar, Edit2, User, Camera } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

const panel = 'rounded-2xl border border-border bg-white'
const sectionTitle = 'text-2xl font-bold tracking-tight'
const addForm = 'flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 sm:flex-row'
const tabTrigger = 'h-11 flex-none gap-2 rounded-xl px-4 text-base font-semibold text-muted-foreground hover:text-foreground data-active:bg-white data-active:text-foreground data-active:shadow-sm'

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

export default function DashboardClient({
  initialChecklists,
  initialFuncionarios,
  initialTiposHidratacao
}: {
  initialChecklists: any[]
  initialFuncionarios: any[]
  initialTiposHidratacao: any[]
}) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const today = new Date()
  const defaultDate = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
  
  const [filterDate, setFilterDate] = useState(searchParams.get('date') || defaultDate)
  const [filterSearch, setFilterSearch] = useState(searchParams.get('search') || '')

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (filterDate) params.set('date', filterDate)
    if (filterSearch) params.set('search', filterSearch)
    router.push(`/admin/dashboard?${params.toString()}`)
  }

  const funcFormRef = useRef<HTMLFormElement>(null)
  const hidFormRef = useRef<HTMLFormElement>(null)

  const [editingFuncionario, setEditingFuncionario] = useState<any>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<any | null>(null)
  const [checklistToDelete, setChecklistToDelete] = useState<string | null>(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null)
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null)
  const [addPhotoName, setAddPhotoName] = useState<string>('')
  const [currentTab, setCurrentTab] = useState(defaultTab)
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full gap-8">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-muted p-1.5 sm:w-fit">
        <TabsTrigger value="checklists" className={tabTrigger}><ClipboardList aria-hidden />Checklists</TabsTrigger>
        <TabsTrigger value="funcionarios" className={tabTrigger}><Users aria-hidden />Funcionários</TabsTrigger>
        <TabsTrigger value="hidratacao" className={tabTrigger}><Droplets aria-hidden />Hidratações</TabsTrigger>
      </TabsList>

      <TabsContent value="checklists" className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className={sectionTitle}>Checklists</h2>
            <p className="text-sm text-muted-foreground">Mostrando os resultados da busca</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar pet ou tutor..." 
                className="pl-9 bg-white"
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input 
                type="date" 
                className="pl-9 bg-white"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                onBlur={applyFilters}
              />
            </div>
            <Button onClick={applyFilters}>Filtrar</Button>
          </div>
        </div>
        {initialChecklists.length === 0 ? (
          <div className={`${panel} px-6 py-14 text-center`}>
            <p className="font-heading text-lg font-semibold">Nenhum checklist registrado ainda</p>
            <p className="mt-1 text-muted-foreground">Os checklists preenchidos no tablet da recepção aparecem aqui.</p>
          </div>
        ) : (
          <ul className={`${panel} divide-y divide-border overflow-hidden`}>
            {initialChecklists.map((item) => {
              const SpeciesIcon = item.especie === 'Gato' ? Cat : Dog
              const status = item.status || 'Aguardando'
              const config = status === 'Aguardando' ? { color: 'text-amber-600', bg: 'bg-amber-100', border: 'border-amber-200' } :
                             status === 'Em banho' ? { color: 'text-ceu-deep', bg: 'bg-ceu/20', border: 'border-ceu' } :
                             status === 'Banho finalizado' ? { color: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' } :
                             status === 'Finalizado' ? { color: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200' } :
                             { color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' }

              return (
                <li key={item.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center md:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-full ${item.especie === 'Gato' ? 'bg-secondary text-rosa-deep' : 'bg-accent text-ceu-deep'}`}>
                      <SpeciesIcon className="size-6" aria-label={item.especie} />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="truncate font-heading text-lg leading-tight font-bold">{item.pet_nome}</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.bg} ${config.color} ${config.border}`}>
                          {status}
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
            setAddPhotoName('')
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
                  <SelectItem value="recepcao">Recepção</SelectItem>
                  <SelectItem value="operacional">Operacional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Input name="login" aria-label="Login (Usuário)" placeholder="Nome de usuário para login" required className="h-14 w-full sm:flex-1" />
            <Input type="password" name="senha" aria-label="Senha" placeholder="Senha" required className="h-14 w-full sm:flex-1" />
            <div className="relative h-14 w-full sm:flex-1">
              <Input type="file" name="foto" accept="image/*" className="absolute inset-0 h-full w-full opacity-0 cursor-pointer" onChange={(e) => {
                if (e.target.files?.[0]) setAddPhotoName(e.target.files[0].name)
              }} />
              <div className="flex h-full w-full items-center justify-between rounded-lg border border-input bg-white px-3 text-base text-muted-foreground focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
                <span className="truncate">{addPhotoName || "Foto (Opcional)"}</span>
                <span className="shrink-0 rounded-full bg-ceu/10 px-3 py-1 text-sm font-semibold text-ceu-deep ml-2">Escolher arquivo</span>
              </div>
            </div>
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
                    onClick={() => toggleFuncionario(func.id, func.ativo)}
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
            setPhotoPreviewUrl(null)
          }
        }}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar Funcionário</DialogTitle>
            </DialogHeader>
            {editingFuncionario && (
              <form action={async (formData) => {
                const res = await updateFuncionario(formData)
                if (!res.success) {
                  toast.error(res.message)
                } else {
                  toast.success('Funcionário atualizado!')
                  setEditingFuncionario(null)
                  setEditPhotoUrl(null)
                }
              }} className="space-y-4 pt-4">
                <input type="hidden" name="id" value={editingFuncionario.id} />
                
                <div className="flex flex-col items-center justify-center mb-6">
                  <div className="relative size-32 overflow-hidden rounded-2xl ring-1 ring-border group">
                    {(editPhotoUrl || editingFuncionario.foto_url) ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={editPhotoUrl || editingFuncionario.foto_url}
                          alt="Foto do funcionário"
                          className="size-full object-cover"
                        />
                        <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
                          <Camera className="size-6 mb-1" />
                          <span className="text-xs font-semibold">Trocar foto</span>
                          <input type="file" name="foto" accept="image/*" className="sr-only" onChange={(e) => {
                            if (e.target.files?.[0]) {
                              setEditPhotoUrl(URL.createObjectURL(e.target.files[0]))
                            }
                          }} />
                        </label>
                      </>
                    ) : (
                      <label className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 bg-accent/50 text-ceu-deep transition-colors hover:bg-accent focus-within:ring-3 focus-within:ring-ring/60">
                        <Camera className="size-7" aria-hidden />
                        <span className="text-sm font-semibold">Adicionar foto</span>
                        <input type="file" name="foto" accept="image/*" className="sr-only" onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setEditPhotoUrl(URL.createObjectURL(e.target.files[0]))
                          }
                        }} />
                      </label>
                    )}
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
                    <Select name="role" defaultValue={editingFuncionario.role || 'operacional'} required>
                      <SelectTrigger className="h-14 data-[size=default]:h-14 w-full text-base bg-white">
                        <SelectValue placeholder="Nível de Acesso" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recepcao">Recepção</SelectItem>
                        <SelectItem value="operacional">Operacional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex flex-col gap-3">
                    <Label>Login (Usuário)</Label>
                    <Input name="login" defaultValue={editingFuncionario.login} required className="h-14" />
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <Label>Nova Senha (Opcional)</Label>
                    <Input type="password" name="senha" placeholder="Deixe em branco para não alterar" className="h-14" />
                  </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setEditingFuncionario(null)} className="h-14 px-6">
                    Cancelar
                  </Button>
                  <Button type="submit" className="h-14 px-6">
                    Salvar Alterações
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
                </div>
              </li>
            ))}
          </ul>
        )}
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

              <div className="space-y-8 px-6 py-6 md:px-8">
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                  <div>
                    <dt className="text-sm text-muted-foreground">Tutor</dt>
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
                  <DetailBlock title="Hidratação">
                    <ul className="space-y-1.5 text-sm">
                      <ServiceItem label="Padrão" done={selectedChecklist.hidratacao?.padrao} />
                      <ServiceItem label="Hipoalergênica" done={selectedChecklist.hidratacao?.hipoalergenico} />
                    </ul>
                    {selectedChecklist.hidratacao?.qual && (
                      <p className="text-sm">Qual: <span className="font-semibold">{selectedChecklist.hidratacao.qual}</span></p>
                    )}
                  </DetailBlock>
                </div>

                {selectedChecklist.observacao && (
                  <DetailBlock title="Observações">
                    <p className="rounded-2xl border-l-4 border-rosa bg-secondary/60 px-5 py-4 leading-relaxed whitespace-pre-line">
                      {selectedChecklist.observacao}
                    </p>
                  </DetailBlock>
                )}

                {(selectedChecklist.foto_1_url || selectedChecklist.foto_2_url) && (
                  <DetailBlock title="Fotos">
                    <div className="flex flex-wrap gap-4">
                      {[selectedChecklist.foto_1_url, selectedChecklist.foto_2_url].filter(Boolean).map((url, i) => (
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

                <DetailBlock title="Assinatura do tutor">
                  {selectedChecklist.assinatura_url && (
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
            <DialogTitle className="font-heading text-xl font-bold">Excluir este checklist?</DialogTitle>
          </DialogHeader>
          <p className="text-muted-foreground">A ficha sai do painel. Essa ação não pode ser desfeita.</p>
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
                  toast.success('Checklist excluído com sucesso!')
                  setChecklistToDelete(null)
                  if (selectedChecklist?.id === checklistToDelete) setSelectedChecklist(null)
                } else {
                  toast.error('Erro ao excluir: ' + res.message)
                }
              }}
            >
              {isDeleting ? 'Excluindo...' : 'Excluir checklist'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
