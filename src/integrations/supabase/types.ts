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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      coach_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      coach_saved_tips: {
        Row: {
          content: string
          created_at: string
          id: string
          pinned: boolean
          source: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          pinned?: boolean
          source?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pinned?: boolean
          source?: string | null
          user_id?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          emoji: string | null
          exam_date: string | null
          id: string
          level: string | null
          source_content: string | null
          source_file_path: string | null
          subject: string | null
          summary: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          exam_date?: string | null
          id?: string
          level?: string | null
          source_content?: string | null
          source_file_path?: string | null
          subject?: string | null
          summary?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          exam_date?: string | null
          id?: string
          level?: string | null
          source_content?: string | null
          source_file_path?: string | null
          subject?: string | null
          summary?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      oral_sessions: {
        Row: {
          course_id: string | null
          created_at: string
          feedback: Json | null
          id: string
          score: number | null
          topic: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          score?: number | null
          topic: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          feedback?: Json | null
          id?: string
          score?: number | null
          topic?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "oral_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      planning_tasks: {
        Row: {
          course_id: string | null
          created_at: string
          done: boolean
          end_time: string | null
          id: string
          start_time: string | null
          subject: string
          task_date: string
          title: string | null
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          done?: boolean
          end_time?: string | null
          id?: string
          start_time?: string | null
          subject: string
          task_date: string
          title?: string | null
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          done?: boolean
          end_time?: string | null
          id?: string
          start_time?: string | null
          subject?: string
          task_date?: string
          title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "planning_tasks_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          cursus: string | null
          display_name: string | null
          email: string | null
          formation: string | null
          id: string
          last_active_date: string | null
          league: string
          level: number
          plan: string
          quiz_completed_count: number
          school: string | null
          streak_days: number
          streak_record: number
          streak_tokens: number
          subjects: Json | null
          updated_at: string
          week_started_at: string | null
          xp_total: number
          xp_week: number
        }
        Insert: {
          created_at?: string
          cursus?: string | null
          display_name?: string | null
          email?: string | null
          formation?: string | null
          id: string
          last_active_date?: string | null
          league?: string
          level?: number
          plan?: string
          quiz_completed_count?: number
          school?: string | null
          streak_days?: number
          streak_record?: number
          streak_tokens?: number
          subjects?: Json | null
          updated_at?: string
          week_started_at?: string | null
          xp_total?: number
          xp_week?: number
        }
        Update: {
          created_at?: string
          cursus?: string | null
          display_name?: string | null
          email?: string | null
          formation?: string | null
          id?: string
          last_active_date?: string | null
          league?: string
          level?: number
          plan?: string
          quiz_completed_count?: number
          school?: string | null
          streak_days?: number
          streak_record?: number
          streak_tokens?: number
          subjects?: Json | null
          updated_at?: string
          week_started_at?: string | null
          xp_total?: number
          xp_week?: number
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          quiz_id: string
          score: number
          total: number
          user_id: string
          wrong_indices: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          quiz_id: string
          score: number
          total: number
          user_id: string
          wrong_indices?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          quiz_id?: string
          score?: number
          total?: number
          user_id?: string
          wrong_indices?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          accepted_answers: Json | null
          answers: Json | null
          correct_index: number | null
          explanation: string | null
          id: string
          position: number
          question: string
          quiz_id: string
          type: string
          user_id: string
        }
        Insert: {
          accepted_answers?: Json | null
          answers?: Json | null
          correct_index?: number | null
          explanation?: string | null
          id?: string
          position?: number
          question: string
          quiz_id: string
          type?: string
          user_id: string
        }
        Update: {
          accepted_answers?: Json | null
          answers?: Json | null
          correct_index?: number | null
          explanation?: string | null
          id?: string
          position?: number
          question?: string
          quiz_id?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          course_id: string | null
          created_at: string
          id: string
          quiz_type: string
          title: string
          user_id: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          id?: string
          quiz_type?: string
          title: string
          user_id: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          id?: string
          quiz_type?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_key: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_key: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          acquired_at: string
          id: string
          item_key: string
          quantity: number
          user_id: string
        }
        Insert: {
          acquired_at?: string
          id?: string
          item_key: string
          quantity?: number
          user_id: string
        }
        Update: {
          acquired_at?: string
          id?: string
          item_key?: string
          quantity?: number
          user_id?: string
        }
        Relationships: []
      }
      user_quests: {
        Row: {
          claimed: boolean
          completed: boolean
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          period_end: string
          period_start: string
          progress: number
          quest_key: string
          quest_type: string
          target: number
          title: string
          user_id: string
          xp_reward: number
        }
        Insert: {
          claimed?: boolean
          completed?: boolean
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          period_end: string
          period_start: string
          progress?: number
          quest_key: string
          quest_type: string
          target?: number
          title: string
          user_id: string
          xp_reward?: number
        }
        Update: {
          claimed?: boolean
          completed?: boolean
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          period_end?: string
          period_start?: string
          progress?: number
          quest_key?: string
          quest_type?: string
          target?: number
          title?: string
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          amount: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      award_xp: {
        Args: { p_amount: number; p_reason: string; p_user_id: string }
        Returns: Json
      }
      bump_quest: {
        Args: { p_inc?: number; p_quest_key: string; p_user_id: string }
        Returns: Json
      }
      bump_streak: { Args: { p_user_id: string }; Returns: undefined }
      increment_quiz_count: { Args: { p_user_id: string }; Returns: Json }
      restore_streak: { Args: { p_user_id: string }; Returns: Json }
      xp_for_level: { Args: { p_level: number }; Returns: number }
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
