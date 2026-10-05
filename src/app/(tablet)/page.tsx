'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Trash2, Check, ChevronsUpDown } from 'lucide-react'
import { checklistSchema, ChecklistFormValues } from '@/schemas/checklist.schema'
import { SignaturePad } from '@/components/signature-pad'
import { submitChecklist, getLookupData } from '@/app/actions/checklist'
import { cn } from '@/lib/utils'
import { useEffect } from 'react'
import { toast } from 'react-toastify'
import { Database } from '@/types/database.types'

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
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

export default function TabletChecklistPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fotos, setFotos] = useState<File[]>([])

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

  const onSubmit = async (data: ChecklistFormValues) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      fotos.forEach((foto) => {
        formData.append('fotos', foto)
      })

      const result = await submitChecklist(data, formData)

      if (result.success) {
        toast.success('Checklist salvo com sucesso!')
        setFotos([])
        setTimeout(() => window.location.reload(), 2000)
      } else {
        toast.error('Erro ao salvar: ' + result.message)
      }
    } catch (error) {
      console.error(error)
      toast.error('Ocorreu um erro inesperado.')
    } finally {
      setIsSubmitting(false)
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <Card className="max-w-4xl mx-auto shadow-lg pt-0">
        <CardHeader className="bg-primary text-primary-foreground rounded-t-xl mb-6 p-6 flex flex-col items-center">
          <div className="mb-4 bg-white p-2 rounded-[500px]">
            <Image
              src="/dermabichos-logo.svg"
              alt="Dermabichos Logo"
              width={100}
              height={60}
              className="object-contain h-[100px] w-auto"
              priority
            />
          </div>
          <CardTitle className="text-2xl md:text-2xl text-center font-bold">Checklist Banho & Tosa</CardTitle>
          <CardDescription className="text-center text-primary-foreground/80 mt-1">
            Preencha os dados do pet e o serviço a ser realizado
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 md:px-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">

            {/* Seção 1: Dados Básicos */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">1. Dados Básicos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="pet_nome" className="text-lg">Nome do Pet</Label>
                  <Input id="pet_nome" {...register('pet_nome')} className="h-14 text-base" placeholder="Ex: Bob" />
                  {errors.pet_nome && <p className="text-red-500 font-medium">{errors.pet_nome.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-lg">Espécie</Label>
                  <Controller
                    name="especie"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="h-14 w-full text-md bg-white" style={{ height: '3.5rem' }}>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cão">Cão</SelectItem>
                          <SelectItem value="Gato">Gato</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.especie && <p className="text-red-500 font-medium">{errors.especie.message}</p>}
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label className="text-lg">Raça</Label>
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
                              className={cn(
                                "h-14 w-full text-base bg-white justify-between font-normal",
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
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Buscar raça..." className="h-12 text-md" />
                            <CommandList>
                              <CommandEmpty>Nenhuma raça encontrada.</CommandEmpty>
                              <CommandGroup>
                                {racaOptions.map((raca) => (
                                  <CommandItem
                                    value={raca}
                                    key={raca}
                                    onSelect={(currentValue) => {
                                      // CommandItem value is lowercase by default in cmdk, but we want the original exact case.
                                      // Shadcn CommandItem lowercases the value. It's safer to use the closure reference.
                                      field.onChange(raca)
                                    }}
                                    className="text-md py-2 cursor-pointer"
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
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
                  {errors.raca && <p className="text-red-500 font-medium">{errors.raca.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tutor" className="text-lg">Nome do Tutor</Label>
                  <Input id="tutor" {...register('tutor')} className="h-14 text-base" placeholder="Ex: João da Silva" />
                  {errors.tutor && <p className="text-red-500 font-medium">{errors.tutor.message}</p>}
                </div>
              </div>
            </section>

            {/* Seção 2: Serviços e Detalhes */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">2. Serviços Detalhados</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Detalhes Estéticos */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-lg">Estética e Higiene</h4>
                  <div className="space-y-4">
                    <Controller
                      name="detalhes.laco"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="laco" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="laco" className="text-md font-normal cursor-pointer flex-1">Laço / Gravata</Label>
                        </div>
                      )}
                    />
                    <Controller
                      name="detalhes.brilho"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="brilho" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="brilho" className="text-md font-normal cursor-pointer flex-1">Brilho / Enfeite</Label>
                        </div>
                      )}
                    />
                    <Controller
                      name="detalhes.perfume"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="perfume" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="perfume" className="text-md font-normal cursor-pointer flex-1">Perfume</Label>
                        </div>
                      )}
                    />
                    <Controller
                      name="detalhes.escova_dente"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="escova_dente" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="escova_dente" className="text-md font-normal cursor-pointer flex-1">Escovação Dentária</Label>
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Tosa */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-lg">Tipo de Tosa</h4>
                  <div className="space-y-4">
                    <Controller
                      name="tosa.higienica"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="tosa_hig" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="tosa_hig" className="text-md font-normal cursor-pointer flex-1">Higiênica</Label>
                        </div>
                      )}
                    />
                    <Controller
                      name="tosa.maquina"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="tosa_maq" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="tosa_maq" className="text-md font-normal cursor-pointer flex-1">Máquina</Label>
                        </div>
                      )}
                    />
                    <Controller
                      name="tosa.tesoura"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="tosa_tes" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="tosa_tes" className="text-md font-normal cursor-pointer flex-1">Tesoura</Label>
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Hidratação */}
                <div className="space-y-4 bg-gray-50 p-4 rounded-lg border">
                  <h4 className="font-medium text-lg">Hidratação</h4>
                  <div className="space-y-4">
                    <Controller
                      name="hidratacao.padrao"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="hid_pad" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="hid_pad" className="text-md font-normal cursor-pointer flex-1">Padrão</Label>
                        </div>
                      )}
                    />
                    <Controller
                      name="hidratacao.hipoalergenico"
                      control={control}
                      render={({ field }) => (
                        <div className="flex items-center space-x-3 bg-white p-3 rounded border">
                          <Checkbox id="hid_hipo" checked={field.value} onCheckedChange={field.onChange} className="w-6 h-6" />
                          <Label htmlFor="hid_hipo" className="text-md font-normal cursor-pointer flex-1">Hipoalergênica</Label>
                        </div>
                      )}
                    />
                    <div className="space-y-2 pt-2">
                      <Label htmlFor="hid_qual" className="text-base text-gray-600">Qual hidratação?</Label>
                      <Controller
                        name="hidratacao.qual"
                        control={control}
                        render={({ field }) => (
                          <Select onValueChange={field.onChange} value={field.value || undefined}>
                            <SelectTrigger className="h-14 w-full text-md bg-white" style={{ height: '3.5rem' }}>
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
                  </div>
                </div>
              </div>
            </section>

            {/* Seção 3: Observações e Fotos */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">3. Observações e Registros</h3>
              <div className="space-y-2">
                <Label htmlFor="observacao" className="text-md">Observações Gerais (Pelagem embolada, machucados, etc.)</Label>
                <Textarea id="observacao" {...register('observacao')} className="min-h-32 text-lg" placeholder="Digite observações importantes sobre o estado do pet..." />
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="fotos" className="text-sm block mb-2">Fotos (Máximo 2)</Label>

                {fotos.length > 0 && (
                  <div className="flex gap-4 mb-4">
                    {fotos.map((foto, index) => (
                      <div key={index} className="relative w-24 h-24 border border-gray-200 rounded-md overflow-hidden shadow-sm">
                        <button
                          type="button"
                          onClick={() => removeFoto(index)}
                          className="absolute top-1 right-1 bg-gray-200 text-white rounded-full w-6 h-6 flex items-center justify-center z-10 hover:bg-gray-300 transition-colors shadow-sm cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={URL.createObjectURL(foto)}
                          alt={`Foto ${index + 1}`}
                          className="object-cover w-full h-full"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {fotos.length < 2 && (
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="fotos" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Toque para adicionar foto</span> ou enviar
                        </p>
                        <p className="text-xs text-gray-500">Selecionadas: {fotos.length} de 2</p>
                      </div>
                      <input id="fotos" type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFotoChange} />
                    </label>
                  </div>
                )}
              </div>
            </section>

            {/* Seção 4: Responsáveis e Assinatura */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold border-b pb-2">4. Finalização e Termo</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-base">Realizado por</Label>
                  <Controller
                    name="realizado_por_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="h-14 w-full text-base" style={{ height: '3.5rem' }}>
                          <SelectValue placeholder="Selecione o profissional...">
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
                  {errors.realizado_por_id && <p className="text-red-500 font-medium">{errors.realizado_por_id.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label className="text-base">Vistoriado por</Label>
                  <Controller
                    name="vistoriado_por_id"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value || undefined}>
                        <SelectTrigger className="h-14 w-full text-base" style={{ height: '3.5rem' }}>
                          <SelectValue placeholder="Selecione o responsável...">
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
                  {errors.vistoriado_por_id && <p className="text-red-500 font-medium">{errors.vistoriado_por_id.message}</p>}
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-lg border border-amber-200 mt-6">
                <Controller
                  name="termo_aceito"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-start space-x-4">
                      <Checkbox
                        id="termo"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="w-8 h-8 mt-1 border-amber-400 data-[state=checked]:bg-amber-500"
                      />
                      <Label htmlFor="termo" className="text-lg cursor-pointer font-medium text-amber-900 leading-relaxed">
                        Declaro que os serviços selecionados foram conferidos e que as observações descritas acima correspondem ao estado atual do animal na entrada.
                      </Label>
                    </div>
                  )}
                />
                {errors.termo_aceito && <p className="text-red-500 font-medium mt-2">{errors.termo_aceito.message}</p>}
              </div>

              <div className="space-y-4">
                <Label className="text-xl block font-semibold text-center mt-8">Assinatura do Tutor</Label>
                <Controller
                  name="assinatura"
                  control={control}
                  render={({ field }) => (
                    <SignaturePad
                      onEnd={(base64) => field.onChange(base64)}
                      error={errors.assinatura?.message}
                    />
                  )}
                />
              </div>

            </section>

            {/* Submit */}
            <div className="pt-8 pb-12">
              <Button type="submit" disabled={isSubmitting} className="w-full h-16 text-xl font-bold bg-green-600 hover:bg-green-700">
                {isSubmitting ? 'Salvando...' : 'Finalizar'}
              </Button>
            </div>

          </form>
        </CardContent>
      </Card>
    </div>
  )
}
