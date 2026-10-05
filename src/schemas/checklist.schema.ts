import { z } from 'zod'

export const checklistSchema = z.object({
  pet_nome: z.string().min(1, 'O nome do pet é obrigatório'),
  especie: z.string().min(1, 'A espécie é obrigatória'),
  raca: z.string().min(1, 'A raça é obrigatória'),
  tutor: z.string().min(1, 'O nome do tutor é obrigatório'),
  
  detalhes: z.object({
    laco: z.boolean().default(false),
    brilho: z.boolean().default(false),
    perfume: z.boolean().default(false),
    escova_dente: z.boolean().default(false),
    outros: z.string().optional()
  }),

  tosa: z.object({
    higienica: z.boolean().default(false),
    maquina: z.boolean().default(false),
    tesoura: z.boolean().default(false)
  }),

  hidratacao: z.object({
    padrao: z.boolean().default(false),
    hipoalergenico: z.boolean().default(false),
    qual: z.string().optional()
  }),

  observacao: z.string().optional(),
  
  // Realizado por e Vistoriado por serão selecionados (por enquanto string vazia aceita para prototipação visual se não estiver carregado)
  realizado_por_id: z.string().min(1, 'Selecione quem realizou o serviço'),
  vistoriado_por_id: z.string().min(1, 'Selecione quem vistoriou o serviço'),
  
  termo_aceito: z.boolean().refine(val => val === true, 'Você deve aceitar o termo para continuar'),
  
  assinatura: z.string().min(1, 'A assinatura é obrigatória'),
  
  // As fotos serão validadas no momento do submit ou via estado, 
  // mas incluímos no form values para facilitar.
  fotos: z.any().optional() 
})

export type ChecklistFormValues = z.infer<typeof checklistSchema>
