'use client'

import React, { useRef, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { addFuncionario, toggleFuncionario, addTipoHidratacao, toggleTipoHidratacao, deleteChecklist } from '@/app/actions/admin'
import { toast } from 'react-toastify'
import { Printer, Eye, Trash2 } from 'lucide-react'

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
    <Tabs defaultValue="checklists" className="w-full">
      <TabsList className="grid w-full grid-cols-3 h-14 mb-8">
        <TabsTrigger value="checklists" className="text-md h-10">📋 Checklists Recebidos</TabsTrigger>
        <TabsTrigger value="funcionarios" className="text-md h-10">👥 Funcionários</TabsTrigger>
        <TabsTrigger value="hidratacao" className="text-md h-10">💧 Tipos de Hidratação</TabsTrigger>
      </TabsList>
      
      <TabsContent value="checklists" className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">Últimos Checklists</h2>
        {initialChecklists.length === 0 ? (
          <p className="text-gray-500">Nenhum checklist registrado ainda.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {initialChecklists.map((item) => (
              <div key={item.id} className="border p-4 rounded-lg bg-gray-50 shadow-sm flex flex-col justify-between">
                <div>
                  <p className="font-bold text-lg">{item.pet_nome}</p>
                  <p className="text-sm text-gray-600">Raça: {item.raca}</p>
                  <p className="text-sm text-gray-600">Tutor: {item.tutor}</p>
                  <p className="text-xs text-gray-400 mt-2 mb-4">Data: {new Date(item.created_at).toLocaleString('pt-BR')}</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="flex-1 h-10 text-sm" 
                    onClick={() => setSelectedChecklist(item)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar Detalhes
                  </Button>
                  <Button
                    variant="destructive"
                    className="h-10 w-10 p-0 shrink-0"
                    onClick={() => setChecklistToDelete(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="funcionarios">
        <h2 className="text-xl font-semibold mb-4">Gestão de Funcionários</h2>
        
        <form ref={funcFormRef} action={async (formData) => {
          const res = await addFuncionario(formData)
          if (!res.success) {
            toast.error(res.message)
          } else {
            toast.success('Funcionário cadastrado!')
            funcFormRef.current?.reset()
          }
        }} className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
          <Input name="nome" placeholder="Nome do funcionário" required className="flex-1 bg-white" />
          <Input name="cargo" placeholder="Cargo (Ex: Banhista, Tosador)" required className="flex-1 bg-white" />
          <Button type="submit">Cadastrar</Button>
        </form>

        <div className="mt-4">
          <ul className="space-y-2">
            {initialFuncionarios.map((func) => (
              <li key={func.id} className="p-3 bg-white border rounded flex items-center justify-between shadow-sm">
                <div>
                  <span className="font-semibold text-gray-800">{func.nome}</span> 
                  <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded ml-2">{func.cargo}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={func.ativo ? 'text-green-600 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                    {func.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Button 
                    variant={func.ativo ? "destructive" : "default"} 
                    size="sm"
                    onClick={() => toggleFuncionario(func.id, func.ativo)}
                  >
                    {func.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>

      <TabsContent value="hidratacao">
        <h2 className="text-xl font-semibold mb-4">Tipos de Hidratação</h2>
        
        <form ref={hidFormRef} action={async (formData) => {
          const res = await addTipoHidratacao(formData)
          if (!res.success) {
            toast.error(res.message)
          } else {
            toast.success('Hidratação cadastrada!')
            hidFormRef.current?.reset()
          }
        }} className="flex gap-4 mb-6 bg-gray-50 p-4 rounded-lg border">
          <Input name="nome" placeholder="Nome da hidratação (Ex: Argan, Queratina)" required className="flex-1 bg-white" />
          <Button type="submit">Cadastrar</Button>
        </form>

        <div className="mt-4">
          <ul className="space-y-2">
            {initialTiposHidratacao.map((tipo) => (
              <li key={tipo.id} className="p-3 bg-white border rounded flex items-center justify-between shadow-sm">
                <span className="font-semibold text-gray-800">{tipo.nome}</span>
                <div className="flex items-center gap-4">
                  <span className={tipo.ativo ? 'text-green-600 text-sm font-medium' : 'text-red-500 text-sm font-medium'}>
                    {tipo.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                  <Button 
                    variant={tipo.ativo ? "destructive" : "default"} 
                    size="sm"
                    onClick={() => toggleTipoHidratacao(tipo.id, tipo.ativo)}
                  >
                    {tipo.ativo ? 'Desativar' : 'Ativar'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </TabsContent>

      {/* Checklist View Modal */}
      <Dialog open={!!selectedChecklist} onOpenChange={(open) => !open && setSelectedChecklist(null)}>
        <DialogContent className="w-[90vw] sm:max-w-5xl max-w-5xl max-h-[90vh] overflow-y-auto">
          {selectedChecklist && (
            <>
              <DialogHeader className="flex flex-row items-center justify-between border-b pb-4">
                <DialogTitle className="text-2xl font-bold">Ficha de: {selectedChecklist.pet_nome}</DialogTitle>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/admin/print/${selectedChecklist.id}`, '_blank')}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Ficha
                </Button>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Tutor</p>
                  <p className="font-semibold">{selectedChecklist.tutor}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Raça / Espécie</p>
                  <p className="font-semibold">{selectedChecklist.raca} ({selectedChecklist.especie})</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Data de Entrada</p>
                  <p className="font-semibold">{new Date(selectedChecklist.created_at).toLocaleString('pt-BR')}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold text-lg border-b pb-2 mb-4">Serviços Realizados</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="font-bold mb-2">Banho</p>
                    <ul className="text-sm space-y-1">
                      <li>Laço: {selectedChecklist.detalhes?.laco ? 'Sim' : 'Não'}</li>
                      <li>Brilho: {selectedChecklist.detalhes?.brilho ? 'Sim' : 'Não'}</li>
                      <li>Perfume: {selectedChecklist.detalhes?.perfume ? 'Sim' : 'Não'}</li>
                      <li>Escovação Dentes: {selectedChecklist.detalhes?.escova_dente ? 'Sim' : 'Não'}</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="font-bold mb-2">Tosa</p>
                    <ul className="text-sm space-y-1">
                      <li>Higiênica: {selectedChecklist.tosa?.higienica ? 'Sim' : 'Não'}</li>
                      <li>Máquina: {selectedChecklist.tosa?.maquina ? 'Sim' : 'Não'}</li>
                      <li>Tesoura: {selectedChecklist.tosa?.tesoura ? 'Sim' : 'Não'}</li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border">
                    <p className="font-bold mb-2">Hidratação</p>
                    <ul className="text-sm space-y-1">
                      <li>Padrão: {selectedChecklist.hidratacao?.padrao ? 'Sim' : 'Não'}</li>
                      <li>Hipoalergênica: {selectedChecklist.hidratacao?.hipoalergenico ? 'Sim' : 'Não'}</li>
                      {selectedChecklist.hidratacao?.qual && <li>Qual: {selectedChecklist.hidratacao.qual}</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {selectedChecklist.observacao && (
                <div className="mt-6">
                  <h4 className="font-semibold text-lg border-b pb-2 mb-2">Observações</h4>
                  <p className="bg-yellow-50 text-yellow-900 p-4 rounded border border-yellow-200">
                    {selectedChecklist.observacao}
                  </p>
                </div>
              )}

              <div className="mt-6">
                <h4 className="font-semibold text-lg border-b pb-2 mb-4">Profissionais</h4>
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Realizado por:</strong> <br/>{initialFuncionarios.find(f => f.id === selectedChecklist.realizado_por_id)?.nome || selectedChecklist.realizado_por_id}</p>
                  <p><strong>Vistoriado por:</strong> <br/>{initialFuncionarios.find(f => f.id === selectedChecklist.vistoriado_por_id)?.nome || selectedChecklist.vistoriado_por_id}</p>
                </div>
              </div>

              {(selectedChecklist.foto_1_url || selectedChecklist.foto_2_url) && (
                <div className="mt-6">
                  <h4 className="font-semibold text-lg border-b pb-2 mb-4">Fotos</h4>
                  <div className="flex gap-4">
                    {selectedChecklist.foto_1_url && (
                      <img src={selectedChecklist.foto_1_url} alt="Foto 1" className="w-48 h-48 object-cover rounded border" />
                    )}
                    {selectedChecklist.foto_2_url && (
                      <img src={selectedChecklist.foto_2_url} alt="Foto 2" className="w-48 h-48 object-cover rounded border" />
                    )}
                  </div>
                </div>
              )}

              <div className="mt-6 bg-gray-50 p-4 rounded border">
                <h4 className="font-semibold text-lg mb-2">Assinatura do Tutor</h4>
                {selectedChecklist.assinatura_url && (
                  <img src={selectedChecklist.assinatura_url} alt="Assinatura" className="h-32 object-contain bg-white border rounded" />
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!checklistToDelete} onOpenChange={(open) => !open && setChecklistToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Excluir Checklist</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">Tem certeza que deseja excluir este checklist?</p>
            <p className="text-red-500 font-medium text-sm mt-1">Essa ação não pode ser desfeita.</p>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => setChecklistToDelete(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              disabled={isDeleting}
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
              {isDeleting ? 'Excluindo...' : 'Sim, excluir'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
