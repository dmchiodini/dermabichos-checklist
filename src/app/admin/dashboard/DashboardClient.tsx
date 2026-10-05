'use client'

import React, { useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addFuncionario, toggleFuncionario, addTipoHidratacao, toggleTipoHidratacao, deleteChecklist } from '@/app/actions/admin'
import { toast } from 'react-toastify'
import { Printer, Eye, Trash2, ClipboardList, Users, Droplets, Dog, Cat, Check, Minus } from 'lucide-react'

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
  const funcFormRef = useRef<HTMLFormElement>(null)
  const hidFormRef = useRef<HTMLFormElement>(null)
  const [selectedChecklist, setSelectedChecklist] = useState<any | null>(null)
  const [checklistToDelete, setChecklistToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  return (
    <Tabs defaultValue="checklists" className="w-full gap-8">
      <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl bg-muted p-1.5 sm:w-fit">
        <TabsTrigger value="checklists" className={tabTrigger}><ClipboardList aria-hidden />Checklists</TabsTrigger>
        <TabsTrigger value="funcionarios" className={tabTrigger}><Users aria-hidden />Funcionários</TabsTrigger>
        <TabsTrigger value="hidratacao" className={tabTrigger}><Droplets aria-hidden />Hidratações</TabsTrigger>
      </TabsList>

      <TabsContent value="checklists" className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={sectionTitle}>Últimos checklists</h2>
          {initialChecklists.length > 0 && (
            <span className="text-sm text-muted-foreground">{initialChecklists.length} mais recentes</span>
          )}
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
              return (
                <li key={item.id} className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center md:px-6">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <span className={`grid size-12 shrink-0 place-items-center rounded-full ${item.especie === 'Gato' ? 'bg-secondary text-rosa-deep' : 'bg-accent text-ceu-deep'}`}>
                      <SpeciesIcon className="size-6" aria-label={item.especie} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-heading text-lg leading-tight font-bold">{item.pet_nome}</p>
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
          }
        }} className={addForm}>
          <Input name="nome" aria-label="Nome do funcionário" placeholder="Nome do funcionário" required className="h-12 flex-1" />
          <Input name="cargo" aria-label="Cargo" placeholder="Cargo (Ex: Banhista, Tosador)" required className="h-12 flex-1" />
          <Button type="submit" className="h-12 rounded-xl px-6 text-base">Cadastrar</Button>
        </form>

        {initialFuncionarios.length > 0 && (
          <ul className={`${panel} divide-y divide-border`}>
            {initialFuncionarios.map((func) => (
              <li key={func.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="font-semibold">{func.nome}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-muted-foreground">{func.cargo}</span>
                </div>
                <div className="flex items-center gap-4">
                  <StatusPill ativo={func.ativo} />
                  <Button
                    variant={func.ativo ? 'outline' : 'default'}
                    className="h-9 w-24 rounded-lg text-sm font-semibold"
                    onClick={() => toggleFuncionario(func.id, func.ativo)}
                  >
                    {func.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
          <Input name="nome" aria-label="Nome da hidratação" placeholder="Nome da hidratação (Ex: Argan, Queratina)" required className="h-12 flex-1" />
          <Button type="submit" className="h-12 rounded-xl px-6 text-base">Cadastrar</Button>
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
                      {selectedChecklist.foto_1_url && (
                        <img src={selectedChecklist.foto_1_url} alt={`Foto 1 de ${selectedChecklist.pet_nome}`} className="size-48 rounded-2xl object-cover ring-1 ring-border" />
                      )}
                      {selectedChecklist.foto_2_url && (
                        <img src={selectedChecklist.foto_2_url} alt={`Foto 2 de ${selectedChecklist.pet_nome}`} className="size-48 rounded-2xl object-cover ring-1 ring-border" />
                      )}
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
