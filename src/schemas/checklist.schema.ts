import { z } from 'zod'

export const checklistSchema = z.object({
  id: z.string().optional(),
  pet_nome: z.string().min(1, 'O nome do pet é obrigatório'),
  especie: z.string().min(1, 'A espécie é obrigatória'),
  raca: z.string().min(1, 'A raça é obrigatória'),
  tutor: z.string().min(1, 'O nome do tutor é obrigatório'),
  
  detalhes: z.object({
    laco: z.boolean().default(false),
    brilho: z.boolean().default(false),
    perfume: z.boolean().default(false),
    escova_dente: z.boolean().default(false),
    outros: z.string().nullable().optional()
  }),

  tosa: z.object({
    higienica: z.boolean().default(false),
    maquina: z.boolean().default(false),
    tesoura: z.boolean().default(false)
  }),

  hidratacao: z.object({
    padrao: z.boolean().default(false),
    hipoalergenico: z.boolean().default(false),
    qual: z.string().nullable().optional()
  }),

  observacao: z.string().nullable().optional(),
  
  // Realizado por e Vistoriado por serão selecionados
  realizado_por_id: z.string().nullable().optional(),
  vistoriado_por_id: z.string().nullable().optional(),
  
  termo_aceito: z.boolean().optional().default(false),
  
  assinatura: z.string().nullable().optional(),
  
  // As fotos serão validadas no momento do submit ou via estado, 
  // mas incluímos no form values para facilitar.
  fotos: z.any().nullable().optional()
}).refine((data) => {
  if (data.realizado_por_id && data.vistoriado_por_id) {
    return data.realizado_por_id !== data.vistoriado_por_id
  }
  return true
}, {
  message: 'O funcionário que vistoria não pode ser o mesmo que realiza o serviço.',
  path: ['vistoriado_por_id']
})

export type ChecklistFormValues = z.infer<typeof checklistSchema>
