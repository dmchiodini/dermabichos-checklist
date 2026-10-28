export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      funcionarios: {
        Row: {
          id: string
          nome: string
          cargo: string
          role?: string | null
          login?: string | null
          senha?: string | null
          foto_url?: string | null
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          cargo: string
          role?: string | null
          login?: string | null
          senha?: string | null
          foto_url?: string | null
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cargo?: string
          role?: string | null
          login?: string | null
          senha?: string | null
          foto_url?: string | null
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      tipos_hidratacao: {
        Row: {
          id: string
          nome: string
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          ativo?: boolean
          created_at?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          id: string
          data_horario: string
          pet_nome: string
          especie: string
          raca: string
          tutor: string
          detalhes: {
            laco: boolean
            brilho: boolean
            perfume: boolean
            escova_dente: boolean
            outros: string
            observacao_cuidados?: string | null
            cuidados_medicos?: boolean | null
            motivo_exclusao?: string | null
            excluido_em?: string | null
          } | null
          tosa: {
            higienica: boolean
            maquina: boolean
            tesoura: boolean
          } | null
          hidratacao: {
            padrao: boolean
            hipoalergenico: boolean
            qual: string
            shampoo_terapeutico?: boolean
          } | null
          observacao_cuidados?: string | null
          cuidados_medicos?: boolean | null
          motivo_exclusao?: string | null
          observacao: string | null
          realizado_por_id: string | null
          vistoriado_por_id: string | null
          termo_aceito: boolean
          assinatura_url: string | null
          foto_1_url: string | null
          foto_2_url: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          data_horario?: string
          pet_nome: string
          especie: string
          raca: string
          tutor: string
          detalhes?: {
            laco: boolean
            brilho: boolean
            perfume: boolean
            escova_dente: boolean
            outros: string
            observacao_cuidados?: string | null
            cuidados_medicos?: boolean | null
            motivo_exclusao?: string | null
            excluido_em?: string | null
          } | null
          tosa?: {
            higienica: boolean
            maquina: boolean
            tesoura: boolean
          } | null
          hidratacao?: {
            padrao: boolean
            hipoalergenico: boolean
            qual: string
            shampoo_terapeutico?: boolean
          } | null
          observacao_cuidados?: string | null
          cuidados_medicos?: boolean | null
          motivo_exclusao?: string | null
          observacao?: string | null
          realizado_por_id?: string | null
          vistoriado_por_id?: string | null
          termo_aceito: boolean
          assinatura_url?: string | null
          foto_1_url?: string | null
          foto_2_url?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          data_horario?: string
          pet_nome?: string
          especie?: string
          raca?: string
          tutor?: string
          detalhes?: {
            laco?: boolean
            brilho?: boolean
            perfume?: boolean
            escova_dente?: boolean
            outros?: string
            observacao_cuidados?: string | null
            cuidados_medicos?: boolean | null
            motivo_exclusao?: string | null
            excluido_em?: string | null
          } | null
          tosa?: {
            higienica: boolean
            maquina: boolean
            tesoura: boolean
          } | null
          hidratacao?: {
            padrao: boolean
            hipoalergenico: boolean
            qual: string
            shampoo_terapeutico?: boolean
          } | null
          observacao_cuidados?: string | null
          cuidados_medicos?: boolean | null
          observacao?: string | null
          realizado_por_id?: string | null
          vistoriado_por_id?: string | null
          termo_aceito?: boolean
          assinatura_url?: string | null
          foto_1_url?: string | null
          foto_2_url?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_realizado_por_id_fkey"
            columns: ["realizado_por_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_vistoriado_por_id_fkey"
            columns: ["vistoriado_por_id"]
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
