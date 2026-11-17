'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useForm, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Check, ChevronsUpDown, Camera, X } from 'lucide-react'
import { CiMedicalCross } from 'react-icons/ci'
import { checklistSchema, ChecklistFormValues } from '@/schemas/checklist.schema'
import { SignaturePad } from '@/components/signature-pad'
import { submitChecklist, getLookupData, getChecklistForEdit, updateChecklistStatus, softDeleteChecklist } from '@/app/actions/checklist'
import { cn } from '@/lib/utils'
import { toast } from 'react-toastify'
import type { FuncionarioPublico } from '@/types/database.types'
import { useSearchParams, useRouter } from 'next/navigation'

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

const dogBreeds = [
  "SRD (Sem Raça Definida)", "Afghan Hound", "Akita", "American Bully", "Basset Hound",
  "Beagle", "Bernese Mountain Dog", "Bichon Frisé", "Bichon Havanês", "Biewer Terrier", "Boiadeiro Australiano (Heeler)",
  "Border Collie", "Boston Terrier", "Boxer", "Buldogue Francês", "Buldogue Inglês",
  "Bull Terrier", "Cane Corso", "Cavalier King Charles Spaniel", "Chihuahua", "Chow Chow",
  "Cocker Spaniel", "Collie", "Corgi", "Dachshund (Salsicha)", "Dálmata", "Doberman",
  "Dogo Argentino", "Fila Brasileiro", "Fox Paulistinha", "Golden Retriever", "Husky Siberiano",
  "Jack Russell Terrier", "Labrador Retriever", "Lhasa Apso", "Maltês", "Papillon",
  "Pastor Alemão", "Pastor Belga", "Pastor Branco Suíço", "Pequinês", "Pinscher", "Pit Bull",
  "Pomsky", "Poodle", "Pug", "Rottweiler", "São Bernardo", "Schnauzer", "Shar-Pei", "Shih Tzu",
  "Spitz Alemão (Lulu da Pomerânia)", "West Terrier", "Yorkshire Terrier"
]

const catBreeds = [
  "SRD (Sem Raça Definida)", "Abissínio", "Angorá", "Azul Russo", "Bengal",
  "British Shorthair", "Burmês", "Cornish Rex", "Devon Rex", "Exótico", "Himalaia",
  "Maine Coon", "Mau Egípcio", "Munchkin", "Norueguês da Floresta", "Oriental",
  "Persa", "Ragdoll", "Sagrado da Birmânia", "Savannah", "Scottish Fold", "Siamês",
  "Siberiano", "Sphynx", "Tonquinês"
]

const serviceGroups = [
  {
    title: 'Estética e higiene',
    options: [
      { name: 'detalhes.laco', id: 'laco', label: 'Laço / Gravata' },
      { name: 'detalhes.brilho', id: 'brilho', label: 'Brilho / Enfeite' },
      { name: 'detalhes.perfume', id: 'perfume', label: 'Perfume' },
      { name: 'detalhes.escova_dente', id: 'escova_dente', label: 'Escovação dentária' },
    ],
  },
  {
    title: 'Tipo de tosa',
    options: [
      { name: 'tosa.higienica', id: 'tosa_hig', label: 'Higiênica' },
      { name: 'tosa.maquina', id: 'tosa_maq', label: 'Máquina' },
      { name: 'tosa.tesoura', id: 'tosa_tes', label: 'Tesoura' },
    ],
  },
] as const

const fieldLabel = 'text-base font-semibold text-foreground'
const fieldError = 'text-sm font-medium text-destructive'
const selectTrigger = 'h-14 data-[size=default]:h-14 w-full min-w-0 max-w-full text-base bg-white'

function StepHeading({ step, title, hint }: { step: number; title: string; hint?: string }) {
  return (
    <div className="flex items-start gap-4">
      <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-heading text-base font-bold text-rosa-deep">
        {step}
      </span>
      <div className="pt-1">
        <h2 className="text-xl font-bold leading-tight md:text-2xl">{title}</h2>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </div>
    </div>
  )
}

function ServiceToggle({ id, label, checked, onCheckedChange }: {
  id: string
  label: string
  checked?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white pl-4 transition-colors has-data-checked:border-ceu has-data-checked:bg-accent min-w-0 max-w-full">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="size-6 shrink-0 rounded-md border-input" />
      <Label htmlFor={id} className="flex-1 cursor-pointer self-stretch py-4 pr-4 text-base font-medium leading-snug break-words min-w-0">
        {label}
      </Label>
    </div>
  )
}

const defaultDetalhes = {
  laco: false,
  brilho: false,
  perfume: false,
  escova_dente: false,
}

export default function TabletClient({ isRecepcao = true }: { isRecepcao?: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get('edit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])
  const [existingFotos, setExistingFotos] = useState<string[]>([])
  const [isFinalizado, setIsFinalizado] = useState(false)
  const [checklistStatus, setChecklistStatus] = useState<string>('Aguardando')
  const [actionType, setActionType] = useState<'save' | 'finalize'>('finalize')
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [motivoExclusao, setMotivoExclusao] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const [funcionarios, setFuncionarios] = useState<FuncionarioPublico[]>([])
  const [hidratacoes, setHidratacoes] = useState<{ id: string; nome: string }[]>([])

  useEffect(() => {
    getLookupData()
      .then(data => {
        setFuncionarios(data.funcionarios)
        setHidratacoes(data.hidratacoes)
      })
      .catch((error) => {
        console.error(error)
        toast.error('Não foi possível carregar funcionários e hidratações. Faça login novamente.')
      })
  }, [])

  // Pré-visualização das fotos novas (libera a memória ao trocar/remover)
  const fotoPreviews = useMemo(() => fotos.map((foto) => URL.createObjectURL(foto)), [fotos])
  useEffect(() => () => fotoPreviews.forEach((url) => URL.revokeObjectURL(url)), [fotoPreviews])

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      detalhes: defaultDetalhes,
      tosa: {
        higienica: false,
        maquina: false,
        tesoura: false,
      },
      hidratacao: {
        qual: '',
        shampoo_terapeutico: false,
      },
      cuidados_medicos: false,
      observacao: '',
      termo_aceito: false,
      especie: 'Canina'
    },
  })

  const especie = useWatch({ control, name: 'especie' })
  const cuidadosMedicos = useWatch({ control, name: 'cuidados_medicos' })
  const racaOptions = especie === 'Felina' ? catBreeds : dogBreeds

  useEffect(() => {
    if (editId) {
      const loadChecklist = async () => {
        const data = await getChecklistForEdit(editId).catch((error) => {
          console.error(error)
          return null
        })
        if (!data) {
          toast.error('Checklist não encontrado ou sem permissão de acesso.')
          return
        }
        if (data) {
          reset({
            id: data.id,
            pet_nome: data.pet_nome,
            especie: data.especie,
            raca: data.raca,
            tutor: data.tutor,
            detalhes: data.detalhes ?? defaultDetalhes,
            tosa: data.tosa ?? { higienica: false, maquina: false, tesoura: false },
            hidratacao: data.hidratacao ?? { qual: '', shampoo_terapeutico: false },
            cuidados_medicos: Boolean(data.detalhes?.cuidados_medicos || data.cuidados_medicos),
            observacao: data.observacao || '',
            realizado_por_id: data.realizado_por_id,
            vistoriado_por_id: data.vistoriado_por_id,
            termo_aceito: data.termo_aceito,
            assinatura: data.assinatura_url || '',
          })

          const loadedFotos = []
          if (data.foto_1_url) loadedFotos.push(data.foto_1_url)
          if (data.foto_2_url) loadedFotos.push(data.foto_2_url)
          setExistingFotos(loadedFotos)

          if (data.status) {
            setChecklistStatus(data.status)
            if (data.status === 'Finalizado') {
              setIsFinalizado(true)
            }
          }
        }
      }
      loadChecklist()
    }
  }, [editId, reset])

  const onSubmit = async (data: ChecklistFormValues) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      fotos.forEach((foto) => {
        formData.append('fotos', foto)
      })
      // Fotos já salvas que o usuário manteve (as removidas deixam de ser enviadas)
      existingFotos.forEach((url) => {
        formData.append('fotosMantidas', url)
      })

      if (editId) data.id = editId

      const result = await submitChecklist(data, formData)

      if (result.success) {
        // Somente a recepção finaliza o atendimento
        const shouldFinalize = isRecepcao && editId && (actionType === 'finalize' || checklistStatus === 'Banho finalizado')
        if (shouldFinalize) {
          const statusResult = await updateChecklistStatus(editId, 'Finalizado')
          if (statusResult.success) {
            toast.success('Checklist finalizado com sucesso!')
          } else {
            toast.error('Checklist salvo, mas não foi possível finalizar: ' + statusResult.message)
          }
        } else {
          toast.success(editId ? 'Checklist atualizado com sucesso!' : 'Checklist iniciado com sucesso!')
        }
        router.push('/')
        // Não voltamos isSubmitting para false aqui porque vamos mudar de página, 
        // assim o botão não pisca como habilitado enquanto o Next.js navega.
      } else {
        setIsSubmitting(false)
        toast.error('Erro ao salvar: ' + result.message)
      }
    } catch (error) {
      console.error(error)
      setIsSubmitting(false)
      toast.error('Ocorreu um erro inesperado.')
    }
  }

  const removeFoto = (indexToRemove: number) => {
    setFotos(prev => prev.filter((_, index) => index !== indexToRemove))
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFotos(prev => {
        const combined = [...prev, ...newFiles]
        return combined.slice(0, 2)
      })
    }
    e.target.value = ''
  }

  const funcionarioSelect = (name: 'realizado_por_id' | 'vistoriado_por_id', label: string, placeholder: string) => (
    <div className="space-y-2">
      <Label className={fieldLabel}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Select onValueChange={(val) => field.onChange(val || null)} value={field.value || null}>
            <SelectTrigger className={selectTrigger} aria-invalid={!!errors[name]}>
              <SelectValue placeholder={placeholder}>
                {field.value ? funcionarios.find(f => f.id === field.value)?.nome : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {funcionarios.map((func) => (
                <SelectItem key={func.id} value={func.id}>{func.nome} ({func.cargo})</SelectItem>
              ))}
              {funcionarios.length === 0 && <SelectItem value="none">Cadastre no painel admin</SelectItem>}
            </SelectContent>
          </Select>
        )}
      />
      {errors[name] && <p className={fieldError}>{errors[name]?.message}</p>}
    </div>
  )

  return (
    <main className="min-h-screen overflow-x-clip bg-espuma px-3 py-6 md:px-8 md:py-10">
      <div className="relative mx-auto max-w-4xl rounded-[28px] bg-card shadow-[0_1px_2px_rgb(27_50_68/0.06),0_12px_40px_-12px_rgb(43_106_146/0.25)]">

        <header className="flex items-center gap-5 rounded-t-[28px] border-b border-border px-5 py-6 md:gap-6 md:px-10 md:py-8 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 md:top-6 md:right-6 rounded-full text-muted-foreground hover:bg-muted"
            onClick={() => router.push('/')}
            title="Fechar e Voltar para Fila"
          >
            <X className="size-6" />
          </Button>
          <Image
            src="/dermabichos-icon.svg"
            alt="Dermabichos"
            width={88}
            height={88}
            className="size-16 shrink-0 rounded-full ring-4 ring-accent md:size-22 bg-white"
            priority
          />
          <div className="min-w-0 pr-10">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-[2rem]">
              Checklist Estética Animal
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              {isRecepcao ? 'Preencha na recepção, junto com o responsável, antes do pet entrar para o banho.' : 'Modo de visualização (apenas recepção pode editar).'}
            </p>
          </div>
        </header>

        <form onSubmit={handleSubmit(onSubmit, (errs) => {
          console.error(errs)
          toast.error('Preencha os campos corretamente antes de salvar.')
        })} noValidate>
          <fieldset disabled={isFinalizado}>
            <div className="space-y-12 px-5 py-8 md:px-10 md:py-10">

              <fieldset disabled={!isRecepcao} className="space-y-6">
                <StepHeading step={1} title="Pet e responsável" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="pet_nome" className={fieldLabel}>Nome do pet</Label>
                    <Input id="pet_nome" {...register('pet_nome')} aria-invalid={!!errors.pet_nome} className="h-14 text-base" placeholder="Ex: Bob" />
                    {errors.pet_nome && <p className={fieldError}>{errors.pet_nome.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className={fieldLabel}>Espécie</Label>
                    <Controller
                      name="especie"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={(val) => field.onChange(val || '')} value={field.value || null}>
                          <SelectTrigger className={selectTrigger}>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Canina">Canina</SelectItem>
                            <SelectItem value="Felina">Felina</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.especie && <p className={fieldError}>{errors.especie.message}</p>}
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Label className={fieldLabel}>Raça</Label>
                    <Controller
                      name="raca"
                      control={control}
                      render={({ field }) => (
                        <Popover>
                          <PopoverTrigger
                            render={
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-invalid={!!errors.raca}
                                className={cn(
                                  "h-14 w-full justify-between border-input bg-white px-3 text-base font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              />
                            }
                          >
                            {field.value
                              ? racaOptions.find((raca) => raca === field.value)
                              : "Selecione a raça..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </PopoverTrigger>
                          <PopoverContent className="w-(--anchor-width) p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar raça..." className="h-14 text-base" />
                              <CommandList>
                                <CommandEmpty>Nenhuma raça encontrada.</CommandEmpty>
                                <CommandGroup>
                                  {racaOptions.map((raca) => (
                                    <CommandItem
                                      value={raca}
                                      key={raca}
                                      onSelect={() => {
                                        // cmdk lowercases item values; use the closure to keep the original case.
                                        field.onChange(raca)
                                      }}
                                      className="cursor-pointer py-2.5 text-base"
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4 text-ceu-deep",
                                          raca === field.value ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                      {raca}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      )}
                    />
                    {errors.raca && <p className={fieldError}>{errors.raca.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tutor" className={fieldLabel}>Nome do responsável</Label>
                    <Input id="tutor" {...register('tutor')} aria-invalid={!!errors.tutor} className="h-14 text-base" placeholder="Ex: João da Silva" />
                    {errors.tutor && <p className={fieldError}>{errors.tutor.message}</p>}
                  </div>
                </div>
              </fieldset>

              <fieldset disabled={!isRecepcao} className="space-y-6">
                <StepHeading step={2} title="Serviços" hint="Toque em tudo o que será feito neste atendimento." />
                <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-5">
                  {serviceGroups.map((group) => (
                    <fieldset key={group.title} className="space-y-3 min-w-0">
                      <legend className="mb-3 font-heading text-lg font-semibold text-ceu-deep">{group.title}</legend>
                      {group.options.map((opt) => (
                        <Controller
                          key={opt.id}
                          name={opt.name}
                          control={control}
                          render={({ field }) => (
                            <ServiceToggle id={opt.id} label={opt.label} checked={field.value} onCheckedChange={field.onChange} />
                          )}
                        />
                      ))}
                    </fieldset>
                  ))}

                  <fieldset className="space-y-3 min-w-0">
                    <legend className="mb-3 font-heading text-lg font-semibold text-ceu-deep">Banho / Hidratação</legend>
                    <div className="space-y-3 min-w-0">
                      <Controller
                        name="hidratacao.qual"
                        control={control}
                        render={({ field }) => (
                          <Select
                            onValueChange={(val) => field.onChange(val || '')}
                            value={field.value || null}
                          >
                            <SelectTrigger id="hid_qual" className={cn(selectTrigger, "truncate")} title={field.value || undefined}>
                              <SelectValue placeholder="Selecione" className="truncate" />
                            </SelectTrigger>
                            <SelectContent>
                              {hidratacoes.map((hid) => (
                                <SelectItem key={hid.id} value={hid.nome}>{hid.nome}</SelectItem>
                              ))}
                              {hidratacoes.length === 0 && <SelectItem value="Padrao">Cadastre no painel admin</SelectItem>}
                            </SelectContent>
                          </Select>
                        )}
                      />

                      <Controller
                        name="hidratacao.shampoo_terapeutico"
                        control={control}
                        render={({ field }) => (
                          <ServiceToggle
                            id="shampoo_terapeutico"
                            label="Shampoo terapêutico"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </fieldset>
                </div>
              </fieldset>

              <section className="space-y-6">
                <StepHeading step={3} title="Observações" />

                <div className="space-y-4">
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setValue('cuidados_medicos', !cuidadosMedicos, { shouldDirty: true })}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-sm select-none cursor-pointer",
                        cuidadosMedicos
                          ? "bg-red-600 text-white border-2 border-red-600 shadow-md shadow-red-500/20 hover:bg-red-700"
                          : "bg-white text-red-600 border-2 border-red-300 hover:bg-red-50 hover:border-red-400"
                      )}
                    >
                      <CiMedicalCross className="size-5 stroke-[1]" />
                      <span>Alerta de saúde</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observacao" className={fieldLabel}>
                      Anotações
                    </Label>

                    <Textarea
                      id="observacao"
                      {...register('observacao')}
                      style={{ fieldSizing: 'fixed' }}
                      className={cn(
                        "h-32 resize-none overflow-y-auto rounded-xl transition-all text-base shadow-sm",
                        cuidadosMedicos
                          ? "border-2 border-red-500 bg-red-50/25 text-foreground placeholder:text-red-300 focus-visible:border-red-600 focus-visible:ring-red-500/25"
                          : "border border-input bg-white text-foreground placeholder:text-muted-foreground focus-visible:border-ceu focus-visible:ring-ceu/30"
                      )}
                      placeholder={
                        cuidadosMedicos
                          ? "Descreva aqui o alerta de saúde, cuidados especiais ou restrições do pet..."
                          : "Ex: nós na pelagem, comportamento do pet durante recepção, itens trazidos pelo responsável..."
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className={fieldLabel}>Fotos</span>
                    <span className="text-sm text-muted-foreground">{existingFotos.length + fotos.length} de 2</span>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    {existingFotos.map((url, index) => (
                      <div key={`existing-${index}`} className="relative size-32 overflow-hidden rounded-2xl ring-1 ring-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Foto existente ${index + 1}`}
                          className="size-full object-cover"
                        />
                        {!isFinalizado && (
                          <button
                            type="button"
                            onClick={() => setExistingFotos(prev => prev.filter((_, i) => i !== index))}
                            aria-label={`Remover foto existente ${index + 1}`}
                            className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-white/95 text-destructive shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {fotoPreviews.map((previewUrl, index) => (
                      <div key={previewUrl} className="relative size-32 overflow-hidden rounded-2xl ring-1 ring-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt={`Foto nova ${index + 1}`}
                          className="size-full object-cover"
                        />
                        {!isFinalizado && (
                          <button
                            type="button"
                            onClick={() => removeFoto(index)}
                            aria-label={`Remover foto ${index + 1}`}
                            className="absolute top-2 right-2 grid size-9 place-items-center rounded-full bg-white/95 text-destructive shadow-sm transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    {(existingFotos.length + fotos.length) < 2 && !isFinalizado && (
                      <label
                        htmlFor="fotos"
                        className="flex size-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-ceu/70 bg-accent/50 text-ceu-deep transition-colors hover:bg-accent has-focus-visible:ring-3 has-focus-visible:ring-ring/60"
                      >
                        <Camera className="size-7" aria-hidden />
                        <span className="text-sm font-semibold">Adicionar foto</span>
                        <input id="fotos" type="file" accept="image/*" capture="environment" multiple className="sr-only" onChange={handleFotoChange} />
                      </label>
                    )}
                  </div>
                </div>
              </section>

              <fieldset disabled={!isRecepcao} className="space-y-6">
                <StepHeading step={4} title="Equipe" />
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  {funcionarioSelect('realizado_por_id', 'Realizado por', 'Selecione o profissional...')}
                  {funcionarioSelect('vistoriado_por_id', 'Vistoriado por', 'Selecione o responsável...')}
                </div>
              </fieldset>
            </div>

            {/* Perforated tear line: the tutor's stub */}
            <div aria-hidden className="relative h-0">
              <span className="absolute top-0 -left-4 size-8 -translate-y-1/2 rounded-full bg-espuma" />
              <span className="absolute top-0 -right-4 size-8 -translate-y-1/2 rounded-full bg-espuma" />
              <span className="absolute inset-x-6 top-0 border-t-2 border-dashed border-rosa/60" />
            </div>

            <fieldset disabled={!isRecepcao || (checklistStatus !== 'Banho finalizado' && checklistStatus !== 'Finalizado')} className="space-y-6 rounded-b-[28px] bg-secondary/40 px-5 pt-10 pb-8 md:px-10 md:pb-10">
              <div className="flex items-start gap-4">
                <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-rosa font-heading text-base font-bold text-white">5</span>
                <div className="pt-1">
                  <h2 className="text-xl font-bold leading-tight md:text-2xl">Para o responsável</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Opcional: conferência, termo e assinatura do responsável.</p>
                  {checklistStatus !== 'Banho finalizado' && checklistStatus !== 'Finalizado' && (
                    <p className="mt-2 text-sm font-semibold text-destructive">
                      Aguarde o banho ser finalizado para coletar a assinatura.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Controller
                  name="termo_aceito"
                  control={control}
                  render={({ field }) => (
                    <div className={cn(
                      "flex items-start gap-4 rounded-2xl border bg-white p-5 transition-colors has-data-checked:border-rosa",
                      errors.termo_aceito ? "border-destructive" : "border-rosa/40",
                      (!isRecepcao || (checklistStatus !== 'Banho finalizado' && checklistStatus !== 'Finalizado')) && "opacity-60"
                    )}>
                      <Checkbox
                        id="termo"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={!isRecepcao || (checklistStatus !== 'Banho finalizado' && checklistStatus !== 'Finalizado')}
                        className="mt-0.5 size-7 rounded-md border-rosa data-checked:border-rosa data-checked:bg-rosa data-checked:text-white"
                      />
                      <Label htmlFor="termo" className="cursor-pointer text-base font-medium leading-relaxed text-foreground md:text-lg">
                        Declaro que os serviços selecionados foram conferidos e que as observações descritas acima correspondem ao estado atual do animal na entrada.
                      </Label>
                    </div>
                  )}
                />
                {errors.termo_aceito && <p className={cn(fieldError, 'mt-2')}>{errors.termo_aceito.message}</p>}
              </div>

              <div className="space-y-3">
                <span className={fieldLabel}>Assinatura do responsável</span>
                <Controller
                  name="assinatura"
                  control={control}
                  render={({ field }) => (
                    <SignaturePad
                      onEnd={(base64) => field.onChange(base64)}
                      error={errors.assinatura?.message}
                      value={field.value || undefined}
                      readOnly={!isRecepcao || (checklistStatus !== 'Banho finalizado' && checklistStatus !== 'Finalizado') || isFinalizado}
                    />
                  )}
                />
              </div>
            </fieldset>

            {!isFinalizado && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                {editId && isRecepcao ? (
                  <>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      onClick={() => setActionType('finalize')}
                      className="h-16 flex-1 rounded-2xl text-xl font-bold bg-green-600 hover:bg-green-700 text-white shadow-md transition-colors"
                    >
                      {isSubmitting && actionType === 'finalize' ? 'Finalizando...' : 'Finalizar Atendimento'}
                    </Button>
                    <Button
                      type="submit"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => setActionType('save')}
                      className="h-16 sm:w-auto px-6 rounded-2xl text-base font-semibold border-border bg-white text-muted-foreground hover:bg-muted"
                    >
                      {isSubmitting && actionType === 'save' ? 'Salvando...' : 'Salvar sem Finalizar'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSubmitting}
                      onClick={() => {
                        setIsDeleteModalOpen(true)
                        setMotivoExclusao('')
                      }}
                      className="h-16 sm:w-auto px-5 rounded-2xl text-base font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
                      title="Excluir checklist"
                    >
                      <Trash2 className="size-5 mr-1.5" />
                      Excluir
                    </Button>
                  </>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-16 w-full rounded-2xl text-xl font-bold shadow-[0_6px_0_-1px_var(--ceu-deep)] hover:bg-ceu/90 active:not-aria-[haspopup]:translate-y-0.5 active:shadow-[0_3px_0_-1px_var(--ceu-deep)]"
                  >
                    {isSubmitting ? 'Salvando...' : (editId ? 'Salvar Alterações' : 'Iniciar Checklist')}
                  </Button>
                )}
              </div>
            )}
            {isFinalizado && (
              <div className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
                <p className="text-lg font-bold text-green-700">Serviço Finalizado</p>
                <p className="text-sm text-green-600 mt-1">Este checklist já foi concluído e não pode mais ser alterado.</p>
              </div>
            )}

          </fieldset>
        </form>

        {/* Modal de Confirmação de Exclusão (Recepção) */}
        <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setIsDeleteModalOpen(false)
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
              Deseja excluir este checklist? Ele sairá da fila da recepção e do operacional.
            </p>

            <div className="space-y-2 mt-4">
              <Label htmlFor="motivo-exclusao-form" className="text-sm font-semibold text-foreground">
                Motivo da exclusão <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="motivo-exclusao-form"
                placeholder="Informe o motivo da exclusão (obrigatório)..."
                value={motivoExclusao}
                onChange={(e) => setMotivoExclusao(e.target.value)}
                className="min-h-[90px] rounded-xl resize-none"
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
                  setIsDeleteModalOpen(false)
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
                  if (!editId || !motivoExclusao.trim()) return
                  setIsDeleting(true)
                  const res = await softDeleteChecklist(editId, motivoExclusao.trim())
                  setIsDeleting(false)

                  if (res.success) {
                    toast.success('Checklist excluído da fila com sucesso!')
                    setIsDeleteModalOpen(false)
                    router.push('/')
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
