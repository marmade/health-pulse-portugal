export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          categoria: string
          created_at: string
          fonte: string
          id: string
          notas: string | null
          ordem: number
          titulo: string
          url: string
        }
        Insert: {
          categoria?: string
          created_at?: string
          fonte?: string
          id?: string
          notas?: string | null
          ordem?: number
          titulo: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string
          fonte?: string
          id?: string
          notas?: string | null
          ordem?: number
          titulo?: string
          url?: string
        }
        Relationships: []
      }
      briefings_archive: {
        Row: {
          created_at: string
          id: string
          top_debunking: Json
          top_emerging: Json
          top_news: Json
          top_questions: Json
          week_end: string
          week_label: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          top_debunking?: Json
          top_emerging?: Json
          top_news?: Json
          top_questions?: Json
          week_end: string
          week_label: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          top_debunking?: Json
          top_emerging?: Json
          top_news?: Json
          top_questions?: Json
          week_end?: string
          week_label?: string
          week_start?: string
        }
        Relationships: []
      }
      debunking: {
        Row: {
          classification: string
          created_at: string
          id: string
          source: string
          term: string
          title: string
          url: string
        }
        Insert: {
          classification: string
          created_at?: string
          id?: string
          source: string
          term: string
          title: string
          url: string
        }
        Update: {
          classification?: string
          created_at?: string
          id?: string
          source?: string
          term?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      guioes: {
        Row: {
          created_at: string
          id: string
          ordem: number
          pergunta: string
          referencia_cientifica: string
          referencia_url: string | null
          resposta: string
          subtema: string
          tema: string
        }
        Insert: {
          created_at?: string
          id?: string
          ordem?: number
          pergunta?: string
          referencia_cientifica?: string
          referencia_url?: string | null
          resposta?: string
          subtema?: string
          tema: string
        }
        Update: {
          created_at?: string
          id?: string
          ordem?: number
          pergunta?: string
          referencia_cientifica?: string
          referencia_url?: string | null
          resposta?: string
          subtema?: string
          tema?: string
        }
        Relationships: []
      }
      guioes_semanais: {
        Row: {
          created_at: string
          estado: string
          gerado_por_ia: boolean
          id: string
          perguntas: Json
          semana: string
          tema: string
        }
        Insert: {
          created_at?: string
          estado?: string
          gerado_por_ia?: boolean
          id?: string
          perguntas?: Json
          semana: string
          tema: string
        }
        Update: {
          created_at?: string
          estado?: string
          gerado_por_ia?: boolean
          id?: string
          perguntas?: Json
          semana?: string
          tema?: string
        }
        Relationships: []
      }
      historical_snapshots: {
        Row: {
          axis: string
          change_percent: number
          created_at: string
          id: string
          is_emergent: boolean
          keyword: string
          search_index: number
          snapshot_date: string
        }
        Insert: {
          axis: string
          change_percent?: number
          created_at?: string
          id?: string
          is_emergent?: boolean
          keyword: string
          search_index?: number
          snapshot_date: string
        }
        Update: {
          axis?: string
          change_percent?: number
          created_at?: string
          id?: string
          is_emergent?: boolean
          keyword?: string
          search_index?: number
          snapshot_date?: string
        }
        Relationships: []
      }
      keywords: {
        Row: {
          axis: string
          category: string
          change_percent: number
          created_at: string
          current_volume: number
          id: string
          is_active: boolean
          is_emergent: boolean
          last_peak: string | null
          previous_volume: number
          source: string
          synonyms: string[]
          term: string
          trend: string
        }
        Insert: {
          axis: string
          category: string
          change_percent?: number
          created_at?: string
          current_volume?: number
          id?: string
          is_active?: boolean
          is_emergent?: boolean
          last_peak?: string | null
          previous_volume?: number
          source: string
          synonyms?: string[]
          term: string
          trend?: string
        }
        Update: {
          axis?: string
          category?: string
          change_percent?: number
          created_at?: string
          current_volume?: number
          id?: string
          is_active?: boolean
          is_emergent?: boolean
          last_peak?: string | null
          previous_volume?: number
          source?: string
          synonyms?: string[]
          term?: string
          trend?: string
        }
        Relationships: []
      }
      news_items: {
        Row: {
          created_at: string
          date: string
          id: string
          outlet: string
          related_term: string
          source_type: string
          title: string
          url: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          outlet: string
          related_term: string
          source_type?: string
          title: string
          url: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          outlet?: string
          related_term?: string
          source_type?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      plataforma_popups: {
        Row: {
          eyebrow: string
          id: string
          text: string
          title: string
        }
        Insert: {
          eyebrow?: string
          id: string
          text?: string
          title?: string
        }
        Update: {
          eyebrow?: string
          id?: string
          text?: string
          title?: string
        }
        Relationships: []
      }
      sobre_conteudo: {
        Row: {
          conteudo: string
          id: string
          titulo: string
        }
        Insert: {
          conteudo?: string
          id: string
          titulo?: string
        }
        Update: {
          conteudo?: string
          id?: string
          titulo?: string
        }
        Relationships: []
      }
      textos: {
        Row: {
          ativo: boolean
          categoria: string
          corpo: string
          created_at: string
          id: string
          lead: string
          ordem: number
          referencias: Json
          titulo: string
        }
        Insert: {
          ativo?: boolean
          categoria?: string
          corpo?: string
          created_at?: string
          id?: string
          lead?: string
          ordem?: number
          referencias?: Json
          titulo?: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          corpo?: string
          created_at?: string
          id?: string
          lead?: string
          ordem?: number
          referencias?: Json
          titulo?: string
        }
        Relationships: []
      }
      trend_data: {
        Row: {
          created_at: string
          id: string
          keyword_id: string
          period_date: string
          region: string
          search_index: number
          year_label: number
        }
        Insert: {
          created_at?: string
          id?: string
          keyword_id: string
          period_date: string
          region?: string
          search_index?: number
          year_label: number
        }
        Update: {
          created_at?: string
          id?: string
          keyword_id?: string
          period_date?: string
          region?: string
          search_index?: number
          year_label?: number
        }
        Relationships: [
          {
            foreignKeyName: "trend_data_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      trends_cache: {
        Row: {
          cache_key: string
          created_at: string
          expires_at: string
          id: string
          response_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string
          expires_at?: string
          id?: string
          response_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string
          expires_at?: string
          id?: string
          response_data?: Json
        }
        Relationships: []
      }
      youtube_trends: {
        Row: {
          canal: string
          created_at: string
          data_publicacao: string
          eixo: string
          id: string
          thumbnail_url: string | null
          titulo: string
          url: string
          views: number
        }
        Insert: {
          canal?: string
          created_at?: string
          data_publicacao?: string
          eixo?: string
          id?: string
          thumbnail_url?: string | null
          titulo?: string
          url?: string
          views?: number
        }
        Update: {
          canal?: string
          created_at?: string
          data_publicacao?: string
          eixo?: string
          id?: string
          thumbnail_url?: string | null
          titulo?: string
          url?: string
          views?: number
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
