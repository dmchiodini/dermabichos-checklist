'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Check, ChevronsUpDown, Camera, X } from 'lucide-react'
import { checklistSchema, ChecklistFormValues } from '@/schemas/checklist.schema'
import { SignaturePad } from '@/components/signature-pad'
import { submitChecklist, getLookupData, updateChecklistStatus } from '@/app/actions/checklist'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { Database } from '@/types/database.types'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'

const dogBreeds = [
  "SRD (Sem Raça Definida)", "Afghan Hound", "Akita", "American Bully", "Basset Hound",
  "Beagle", "Bernese Mountain Dog", "Bichon Frisé", "Boiadeiro Australiano (Heeler)",
  "Border Collie", "Boston Terrier", "Boxer", "Buldogue Francês", "Buldogue Inglês",
  "Bull Terrier", "Cane Corso", "Cavalier King Charles Spaniel", "Chihuahua", "Chow Chow",
  "Cocker Spaniel", "Collie", "Corgi", "Dachshund (Salsicha)", "Dálmata", "Doberman",
  "Dogo Argentino", "Fila Brasileiro", "Fox Paulistinha", "Golden Retriever", "Husky Siberiano",
  "Jack Russell Terrier", "Labrador Retriever", "Lhasa Apso", "Maltês", "Papillon",
  "Pastor Alemão", "Pastor Belga", "Pastor Branco Suíço", "Pequinês", "Pinscher", "Pit Bull",
  "Poodle", "Pug", "Rottweiler", "São Bernardo", "Schnauzer", "Shar-Pei", "Shih Tzu",
  "Spitz Alemão (Lulu da Pomerânia)", "Yorkshire Terrier"
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
  {
    title: 'Hidratação',
    options: [
      { name: 'hidratacao.padrao', id: 'hid_pad', label: 'Padrão' },
      { name: 'hidratacao.hipoalergenico', id: 'hid_hipo', label: 'Hipoalergênica' },
    ],
  },
] as const

const fieldLabel = 'text-base font-semibold text-foreground'
const fieldError = 'text-sm font-medium text-destructive'
const selectTrigger = 'h-14 w-full text-base bg-white'

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
    <div className="flex items-center gap-3 rounded-xl border border-border bg-white pl-4 transition-colors has-data-checked:border-ceu has-data-checked:bg-accent">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="size-6 rounded-md border-input" />
      <Label htmlFor={id} className="flex-1 cursor-pointer self-stretch py-4 pr-4 text-base font-medium leading-snug">
        {label}
      </Label>
    </div>
  )
}

export default function TabletClient({ user, isRecepcao = true }: { user?: any, isRecepcao?: boolean }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const editId = searchParams.get('edit')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])
  const [existingFotos, setExistingFotos] = useState<string[]>([])
  const [isFinalizado, setIsFinalizado] = useState(false)
  const [checklistStatus, setChecklistStatus] = useState<string>('Aguardando')

  const [funcionarios, setFuncionarios] = useState<Database['public']['Tables']['funcionarios']['Row'][]>([])
  const [hidratacoes, setHidratacoes] = useState<Database['public']['Tables']['tipos_hidratacao']['Row'][]>([])

  useEffect(() => {
    getLookupData().then(data => {
      setFuncionarios(data?.funcionarios)
      setHidratacoes(data?.hidratacoes)
    })
  }, [])

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(checklistSchema),
    defaultValues: {
      detalhes: {
        laco: false,
        brilho: false,
        perfume: false,
        escova_dente: false,
      },
      tosa: {
        higienica: false,
        maquina: false,
        tesoura: false,
      },
      hidratacao: {
        padrao: false,
        hipoalergenico: false,
      },
      termo_aceito: false,
      especie: 'Cão'
    },
  })

  const especie = watch('especie')
  const racaOptions = especie === 'Gato' ? catBreeds : dogBreeds

  useEffect(() => {
    if (editId) {
      const loadChecklist = async () => {
        const supabase = createClient()
        const { data } = await supabase.from('checklists').select('*').eq('id', editId).single()
        if (data) {
          reset({
            id: data.id,
            pet_nome: data.pet_nome,
            especie: data.especie,
            raca: data.raca,
            tutor: data.tutor,
            detalhes: data.detalhes,
            tosa: data.tosa,
            hidratacao: data.hidratacao,
            observacao: data.observacao,
            realizado_por_id: data.realizado_por_id,
            vistoriado_por_id: data.vistoriado_por_id,
            termo_aceito: data.termo_aceito,
            assinatura: data.assinatura_url || '',
          } as any)
          
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

      if (editId) data.id = editId

      const result = await submitChecklist(data, formData)

      if (result.success) {
        toast.success(editId ? 'Checklist atualizado!' : 'Checklist salvo com sucesso!')
        if (data.termo_aceito && data.assinatura && editId) {
          await updateChecklistStatus(editId, 'Finalizado')
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
          <Select onValueChange={field.onChange} value={field.value || undefined}>
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
            src="/dermabichos-logo.svg"
            alt="Dermabichos"
            width={88}
            height={88}
            className="size-16 shrink-0 rounded-full ring-4 ring-accent md:size-22"
            priority
          />
          <div className="min-w-0 pr-10">
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight md:text-[2rem]">
              Checklist de banho e tosa
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              {isRecepcao ? 'Preencha na recepção, junto com o tutor, antes do pet entrar para o banho.' : 'Modo de visualização (apenas recepção pode editar).'}
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
              <StepHeading step={1} title="Pet e tutor" />
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
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className={selectTrigger}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cão">Cão</SelectItem>
                          <SelectItem value="Gato">Gato</SelectItem>
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
                            <CommandInput placeholder="Buscar raça..." className="h-12 text-base" />
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
                  <Label htmlFor="tutor" className={fieldLabel}>Nome do tutor</Label>
                  <Input id="tutor" {...register('tutor')} aria-invalid={!!errors.tutor} className="h-14 text-base" placeholder="Ex: João da Silva" />
                  {errors.tutor && <p className={fieldError}>{errors.tutor.message}</p>}
                </div>
              </div>
            </fieldset>

            <fieldset disabled={!isRecepcao} className="space-y-6">
              <StepHeading step={2} title="Serviços" hint="Toque em tudo o que será feito neste atendimento." />
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-5">
                {serviceGroups.map((group) => (
                  <fieldset key={group.title} className="space-y-3">
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
                    {group.title === 'Hidratação' && (
                      <div className="space-y-2 pt-2">
                        <Label htmlFor="hid_qual" className="text-sm font-medium text-muted-foreground">Qual hidratação?</Label>
                        <Controller
                          name="hidratacao.qual"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value || undefined}>
                              <SelectTrigger id="hid_qual" className={selectTrigger}>
                                <SelectValue placeholder="Selecione o tipo...">
                                  {field.value}
                                </SelectValue>
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
                      </div>
                    )}
                  </fieldset>
                ))}
              </div>
            </fieldset>

            <section className="space-y-6">
              <StepHeading step={3} title="Como o pet chegou" hint="Registre nós na pelagem, machucados, pulgas ou qualquer coisa fora do normal." />
              <div className="space-y-2">
                <Label htmlFor="observacao" className={fieldLabel}>Observações</Label>
                <Textarea id="observacao" {...register('observacao')} className="min-h-32 bg-white px-3 py-3 text-base md:text-base" placeholder="Ex: orelha esquerda avermelhada, pelagem embolada nas patas traseiras" />
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

                  {fotos.map((foto, index) => (
                    <div key={index} className="relative size-32 overflow-hidden rounded-2xl ring-1 ring-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={URL.createObjectURL(foto)}
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
                <h2 className="text-xl font-bold leading-tight md:text-2xl">Para o tutor</h2>
                <p className="mt-1 text-sm text-muted-foreground">Confira os dados acima, marque a declaração e assine.</p>
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
              <span className={fieldLabel}>Assinatura do tutor</span>
              <Controller
                name="assinatura"
                control={control}
                render={({ field }) => (
                  <SignaturePad
                    onEnd={(base64) => field.onChange(base64)}
                    error={errors.assinatura?.message}
                    value={field.value}
                    readOnly={!isRecepcao || (checklistStatus !== 'Banho finalizado' && checklistStatus !== 'Finalizado') || isFinalizado}
                  />
                )}
              />
            </div>
          </fieldset>

          {!isFinalizado && (
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 h-16 w-full rounded-2xl text-xl font-bold shadow-[0_6px_0_-1px_var(--ceu-deep)] hover:bg-ceu/90 active:not-aria-[haspopup]:translate-y-0.5 active:shadow-[0_3px_0_-1px_var(--ceu-deep)]"
            >
              {isSubmitting ? 'Salvando...' : (editId ? 'Salvar Alterações' : 'Iniciar Checklist')}
            </Button>
          )}
          {isFinalizado && (
            <div className="mt-4 p-4 rounded-2xl bg-green-50 border border-green-200 text-center">
              <p className="text-lg font-bold text-green-700">Serviço Finalizado</p>
              <p className="text-sm text-green-600 mt-1">Este checklist já foi concluído e não pode mais ser alterado.</p>
            </div>
          )}

          </fieldset>
        </form>
      </div>
    </main>
  )
}
