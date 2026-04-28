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
      coach_conversation_state: {
        Row: {
          summary: string
          summary_until_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          summary?: string
          summary_until_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          summary?: string
          summary_until_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
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
      cosmetic_items: {
        Row: {
          category: string
          created_at: string
          description: string | null
          emoji: string | null
          id: string
          item_key: string
          name: string
          preview_data: Json | null
          price_xp: number
          rarity: string
          unlockable_in_loot: boolean
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          item_key: string
          name: string
          preview_data?: Json | null
          price_xp?: number
          rarity?: string
          unlockable_in_loot?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          id?: string
          item_key?: string
          name?: string
          preview_data?: Json | null
          price_xp?: number
          rarity?: string
          unlockable_in_loot?: boolean
        }
        Relationships: []
      }
      course_shares: {
        Row: {
          course_id: string
          created_at: string
          id: string
          recipient_id: string
          responded_at: string | null
          sender_id: string
          status: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          recipient_id: string
          responded_at?: string | null
          sender_id: string
          status?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          recipient_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_shares_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          content_hash: string | null
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
          content_hash?: string | null
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
          content_hash?: string | null
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
      daily_loot_box: {
        Row: {
          id: string
          open_date: string
          opened_at: string
          rewards: Json
          user_id: string
        }
        Insert: {
          id?: string
          open_date?: string
          opened_at?: string
          rewards: Json
          user_id: string
        }
        Update: {
          id?: string
          open_date?: string
          opened_at?: string
          rewards?: Json
          user_id?: string
        }
        Relationships: []
      }
      duel_attempts: {
        Row: {
          answers: Json
          completed_at: string
          duel_id: string
          id: string
          score: number
          user_id: string
        }
        Insert: {
          answers: Json
          completed_at?: string
          duel_id: string
          id?: string
          score: number
          user_id: string
        }
        Update: {
          answers?: Json
          completed_at?: string
          duel_id?: string
          id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "duel_attempts_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "duels"
            referencedColumns: ["id"]
          },
        ]
      }
      duel_presence: {
        Row: {
          current_question: number
          duel_id: string
          id: string
          last_seen: string
          ready: boolean
          user_id: string
        }
        Insert: {
          current_question?: number
          duel_id: string
          id?: string
          last_seen?: string
          ready?: boolean
          user_id: string
        }
        Update: {
          current_question?: number
          duel_id?: string
          id?: string
          last_seen?: string
          ready?: boolean
          user_id?: string
        }
        Relationships: []
      }
      duel_questions: {
        Row: {
          answers: Json
          correct_index: number
          duel_id: string
          explanation: string | null
          id: string
          position: number
          question: string
        }
        Insert: {
          answers: Json
          correct_index: number
          duel_id: string
          explanation?: string | null
          id?: string
          position: number
          question: string
        }
        Update: {
          answers?: Json
          correct_index?: number
          duel_id?: string
          explanation?: string | null
          id?: string
          position?: number
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "duel_questions_duel_id_fkey"
            columns: ["duel_id"]
            isOneToOne: false
            referencedRelation: "duels"
            referencedColumns: ["id"]
          },
        ]
      }
      duels: {
        Row: {
          challenger_id: string
          challenger_score: number | null
          course_id: string | null
          created_at: string
          id: string
          num_questions: number
          opponent_id: string
          opponent_score: number | null
          seconds_per_question: number
          status: string
          subject: string | null
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          challenger_id: string
          challenger_score?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          num_questions?: number
          opponent_id: string
          opponent_score?: number | null
          seconds_per_question?: number
          status?: string
          subject?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          challenger_id?: string
          challenger_score?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          num_questions?: number
          opponent_id?: string
          opponent_score?: number | null
          seconds_per_question?: number
          status?: string
          subject?: string | null
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duels_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      friendships: {
        Row: {
          addressee_id: string
          created_at: string
          id: string
          requester_id: string
          status: string
          updated_at: string
        }
        Insert: {
          addressee_id: string
          created_at?: string
          id?: string
          requester_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          addressee_id?: string
          created_at?: string
          id?: string
          requester_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          link: string | null
          message: string | null
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          link?: string | null
          message?: string | null
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
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
          avatar_url: string | null
          bio: string | null
          created_at: string
          cursus: string | null
          display_name: string | null
          email: string | null
          equipped_background: string | null
          equipped_frame: string | null
          equipped_sticker: string | null
          equipped_title: string | null
          formation: string | null
          gender: string | null
          id: string
          last_active_date: string | null
          last_loot_box_at: string | null
          league: string
          level: number
          plan: string
          push_enabled: boolean
          quiz_completed_count: number
          quiz_loot_box_claimed_count: number
          school: string | null
          streak_days: number
          streak_record: number
          streak_tokens: number
          student_code: string | null
          subjects: Json | null
          updated_at: string
          username: string | null
          week_started_at: string | null
          xp_total: number
          xp_week: number
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cursus?: string | null
          display_name?: string | null
          email?: string | null
          equipped_background?: string | null
          equipped_frame?: string | null
          equipped_sticker?: string | null
          equipped_title?: string | null
          formation?: string | null
          gender?: string | null
          id: string
          last_active_date?: string | null
          last_loot_box_at?: string | null
          league?: string
          level?: number
          plan?: string
          push_enabled?: boolean
          quiz_completed_count?: number
          quiz_loot_box_claimed_count?: number
          school?: string | null
          streak_days?: number
          streak_record?: number
          streak_tokens?: number
          student_code?: string | null
          subjects?: Json | null
          updated_at?: string
          username?: string | null
          week_started_at?: string | null
          xp_total?: number
          xp_week?: number
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          cursus?: string | null
          display_name?: string | null
          email?: string | null
          equipped_background?: string | null
          equipped_frame?: string | null
          equipped_sticker?: string | null
          equipped_title?: string | null
          formation?: string | null
          gender?: string | null
          id?: string
          last_active_date?: string | null
          last_loot_box_at?: string | null
          league?: string
          level?: number
          plan?: string
          push_enabled?: boolean
          quiz_completed_count?: number
          quiz_loot_box_claimed_count?: number
          school?: string | null
          streak_days?: number
          streak_record?: number
          streak_tokens?: number
          student_code?: string | null
          subjects?: Json | null
          updated_at?: string
          username?: string | null
          week_started_at?: string | null
          xp_total?: number
          xp_week?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      question_reviews: {
        Row: {
          chapter: string | null
          course_id: string | null
          created_at: string
          due_at: string
          ease: number
          id: string
          interval_days: number
          lapses: number
          last_correct: boolean | null
          last_reviewed_at: string | null
          question_id: string
          repetitions: number
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter?: string | null
          course_id?: string | null
          created_at?: string
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          lapses?: number
          last_correct?: boolean | null
          last_reviewed_at?: string | null
          question_id: string
          repetitions?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter?: string | null
          course_id?: string | null
          created_at?: string
          due_at?: string
          ease?: number
          id?: string
          interval_days?: number
          lapses?: number
          last_correct?: boolean | null
          last_reviewed_at?: string | null
          question_id?: string
          repetitions?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_reviews_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "quiz_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          created_at: string
          id: string
          is_boss_attempt: boolean
          max_combo: number
          quiz_id: string
          score: number
          total: number
          user_id: string
          wrong_indices: Json | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_boss_attempt?: boolean
          max_combo?: number
          quiz_id: string
          score: number
          total: number
          user_id: string
          wrong_indices?: Json | null
        }
        Update: {
          created_at?: string
          id?: string
          is_boss_attempt?: boolean
          max_combo?: number
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
      quiz_bank: {
        Row: {
          answer: string
          course_id: string
          created_at: string
          difficulty: number
          id: string
          options: Json | null
          question: string
          question_type: string
          times_correct: number
          times_shown: number
          user_id: string
        }
        Insert: {
          answer: string
          course_id: string
          created_at?: string
          difficulty?: number
          id?: string
          options?: Json | null
          question: string
          question_type: string
          times_correct?: number
          times_shown?: number
          user_id: string
        }
        Update: {
          answer?: string
          course_id?: string
          created_at?: string
          difficulty?: number
          id?: string
          options?: Json | null
          question?: string
          question_type?: string
          times_correct?: number
          times_shown?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_bank_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          accepted_answers: Json | null
          answers: Json | null
          chapter: string | null
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
          chapter?: string | null
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
          chapter?: string | null
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
      room_goals: {
        Row: {
          content: string
          created_at: string
          done: boolean
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          done?: boolean
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          done?: boolean
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_goals_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          id: string
          joined_at: string
          last_seen: string
          room_id: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          last_seen?: string
          room_id: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          last_seen?: string
          room_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_system: boolean
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_system?: boolean
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_system?: boolean
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_shared_courses: {
        Row: {
          course_id: string
          created_at: string
          id: string
          room_id: string
          shared_by: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          room_id: string
          shared_by: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          room_id?: string
          shared_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_shared_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_shared_courses_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_whiteboard: {
        Row: {
          color: string
          content: string
          created_at: string
          id: string
          room_id: string
          user_id: string
        }
        Insert: {
          color?: string
          content: string
          created_at?: string
          id?: string
          room_id: string
          user_id: string
        }
        Update: {
          color?: string
          content?: string
          created_at?: string
          id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_whiteboard_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "study_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_activity: {
        Row: {
          activity_date: string
          group_id: string
          id: string
          user_id: string
          xp_contributed: number
        }
        Insert: {
          activity_date?: string
          group_id: string
          id?: string
          user_id: string
          xp_contributed?: number
        }
        Update: {
          activity_date?: string
          group_id?: string
          id?: string
          user_id?: string
          xp_contributed?: number
        }
        Relationships: [
          {
            foreignKeyName: "study_group_activity_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "study_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      study_groups: {
        Row: {
          created_at: string
          emoji: string | null
          group_streak_days: number
          group_streak_record: number
          id: string
          invite_code: string
          last_active_date: string | null
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          group_streak_days?: number
          group_streak_record?: number
          id?: string
          invite_code: string
          last_active_date?: string | null
          name: string
          owner_id: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          group_streak_days?: number
          group_streak_record?: number
          id?: string
          invite_code?: string
          last_active_date?: string | null
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      study_rooms: {
        Row: {
          created_at: string
          ended_at: string | null
          host_id: string
          id: string
          invite_code: string
          max_members: number
          name: string
          privacy: string
          status: string
          subjects: Json | null
          timer_phase: string | null
          timer_preset: string
          timer_started_at: string | null
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_id: string
          id?: string
          invite_code: string
          max_members?: number
          name: string
          privacy?: string
          status?: string
          subjects?: Json | null
          timer_phase?: string | null
          timer_preset?: string
          timer_started_at?: string | null
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_id?: string
          id?: string
          invite_code?: string
          max_members?: number
          name?: string
          privacy?: string
          status?: string
          subjects?: Json | null
          timer_phase?: string | null
          timer_preset?: string
          timer_started_at?: string | null
        }
        Relationships: []
      }
      usage_counters: {
        Row: {
          action_type: string
          count: number
          created_at: string
          id: string
          period_key: string
          period_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          count?: number
          created_at?: string
          id?: string
          period_key: string
          period_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          count?: number
          created_at?: string
          id?: string
          period_key?: string
          period_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      user_cosmetics: {
        Row: {
          acquired_at: string
          acquired_via: string
          id: string
          item_key: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          acquired_via?: string
          id?: string
          item_key: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          acquired_via?: string
          id?: string
          item_key?: string
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
      voice_notes: {
        Row: {
          audio_path: string | null
          course_id: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_path?: string | null
          course_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_path?: string | null
          course_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voice_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
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
      _award_xp_internal: {
        Args: { p_amount: number; p_reason: string; p_user_id: string }
        Returns: Json
      }
      accept_duel: { Args: { p_duel_id: string }; Returns: undefined }
      award_xp: {
        Args: { p_amount: number; p_reason: string; p_user_id: string }
        Returns: Json
      }
      bump_group_streak: { Args: { p_group_id: string }; Returns: undefined }
      bump_quest: {
        Args: { p_inc?: number; p_quest_key: string; p_user_id: string }
        Returns: Json
      }
      bump_streak: { Args: { p_user_id: string }; Returns: undefined }
      buy_cosmetic: { Args: { p_item_key: string }; Returns: Json }
      check_and_increment_usage: {
        Args: {
          p_action_type: string
          p_daily_limit: number
          p_user_id: string
          p_weekly_limit: number
        }
        Returns: Json
      }
      claim_queen_lootbox: { Args: never; Returns: Json }
      clone_course_by_hash: {
        Args: {
          p_content_hash: string
          p_exam_date: string
          p_level: string
          p_source_content: string
          p_source_file_path: string
          p_subject: string
          p_target_user_id: string
          p_title: string
        }
        Returns: string
      }
      clone_quiz_bank_from_course: {
        Args: {
          p_source_course_id: string
          p_target_course_id: string
          p_target_user_id: string
        }
        Returns: number
      }
      consume_powerup: { Args: { p_powerup_key: string }; Returns: Json }
      create_duel: {
        Args: {
          p_course_id: string
          p_num_questions: number
          p_opponent_id: string
          p_seconds_per_question: number
        }
        Returns: string
      }
      create_study_group: {
        Args: { p_emoji?: string; p_name: string }
        Returns: string
      }
      ensure_today_quests: { Args: never; Returns: Json }
      equip_cosmetic: {
        Args: { p_category: string; p_item_key: string }
        Returns: Json
      }
      generate_group_code: { Args: never; Returns: string }
      generate_room_code: { Args: never; Returns: string }
      generate_student_code: { Args: never; Returns: string }
      get_chapter_mastery: {
        Args: { p_course_id: string }
        Returns: {
          avg_ease: number
          chapter: string
          due_today: number
          mastered_questions: number
          mastery_pct: number
          reviewed_questions: number
          total_questions: number
        }[]
      }
      get_cursus_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          cursus: string
          display_name: string
          equipped_frame: string
          equipped_sticker: string
          equipped_title: string
          id: string
          is_me: boolean
          level: number
          sticker_emoji: string
          streak_days: number
          title_emoji: string
          title_name: string
          title_rarity: string
          xp_total: number
          xp_week: number
        }[]
      }
      get_due_review_questions: {
        Args: { p_limit?: number }
        Returns: {
          accepted_answers: Json
          answers: Json
          chapter: string
          correct_index: number
          course_emoji: string
          course_id: string
          course_title: string
          due_at: string
          explanation: string
          question: string
          question_id: string
          quiz_id: string
          type: string
        }[]
      }
      get_duel_questions: {
        Args: { p_duel_id: string }
        Returns: {
          q_answers: Json
          q_id: string
          q_position: number
          q_question: string
        }[]
      }
      get_friend_ids: {
        Args: { p_user_id: string }
        Returns: {
          friend_id: string
        }[]
      }
      get_friends_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          equipped_frame: string
          equipped_sticker: string
          equipped_title: string
          gender: string
          id: string
          is_me: boolean
          level: number
          sticker_emoji: string
          streak_days: number
          title_emoji: string
          title_name: string
          title_rarity: string
          username: string
          xp_total: number
          xp_week: number
        }[]
      }
      get_global_chapter_mastery: {
        Args: never
        Returns: {
          chapter: string
          course_emoji: string
          course_id: string
          course_title: string
          due_today: number
          mastered_questions: number
          mastery_pct: number
          reviewed_questions: number
          total_questions: number
        }[]
      }
      get_global_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          equipped_frame: string
          equipped_sticker: string
          equipped_title: string
          id: string
          is_me: boolean
          level: number
          sticker_emoji: string
          streak_days: number
          title_emoji: string
          title_name: string
          title_rarity: string
          xp_total: number
          xp_week: number
        }[]
      }
      get_group_members: {
        Args: { p_group_id: string }
        Returns: {
          avatar_url: string
          contributed_today: boolean
          display_name: string
          equipped_frame: string
          equipped_sticker: string
          equipped_title: string
          level: number
          role: string
          sticker_emoji: string
          title_emoji: string
          title_name: string
          title_rarity: string
          user_id: string
          xp_today: number
        }[]
      }
      get_my_cosmetics_inventory: {
        Args: never
        Returns: {
          acquired_at: string
          acquired_via: string
          category: string
          description: string
          emoji: string
          equipped: boolean
          item_key: string
          name: string
          rarity: string
        }[]
      }
      get_my_groups: {
        Args: never
        Returns: {
          all_contributed_today: boolean
          contributed_today: number
          emoji: string
          group_streak_days: number
          group_streak_record: number
          id: string
          invite_code: string
          is_owner: boolean
          member_count: number
          name: string
        }[]
      }
      get_public_profile: {
        Args: { p_user_id: string }
        Returns: {
          avatar_url: string
          bio: string
          cursus: string
          display_name: string
          equipped_background: string
          equipped_frame: string
          equipped_sticker: string
          equipped_title: string
          formation: string
          gender: string
          id: string
          level: number
          sticker_emoji: string
          sticker_rarity: string
          streak_days: number
          streak_record: number
          student_code: string
          title_emoji: string
          title_name: string
          title_rarity: string
          username: string
          xp_total: number
          xp_week: number
        }[]
      }
      get_school_leaderboard: {
        Args: never
        Returns: {
          avatar_url: string
          display_name: string
          equipped_frame: string
          equipped_sticker: string
          equipped_title: string
          id: string
          is_me: boolean
          level: number
          school: string
          sticker_emoji: string
          streak_days: number
          title_emoji: string
          title_name: string
          title_rarity: string
          xp_total: number
          xp_week: number
        }[]
      }
      increment_quiz_count: { Args: { p_user_id: string }; Returns: Json }
      is_group_member: {
        Args: { p_group_id: string; p_user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      is_room_visible: {
        Args: { p_room_id: string; p_user_id: string }
        Returns: boolean
      }
      join_group_by_code: { Args: { p_code: string }; Returns: string }
      join_room_by_code: { Args: { p_code: string }; Returns: string }
      leave_study_group: { Args: { p_group_id: string }; Returns: undefined }
      log_group_activity: { Args: { p_xp?: number }; Returns: Json }
      notify_groups_at_risk: { Args: never; Returns: Json }
      open_daily_loot_box: { Args: never; Returns: Json }
      open_quiz_bonus_loot_box: { Args: never; Returns: Json }
      respond_course_share: {
        Args: { p_accept: boolean; p_share_id: string }
        Returns: Json
      }
      restore_streak: { Args: { p_user_id: string }; Returns: Json }
      review_question: {
        Args: { p_correct: boolean; p_question_id: string }
        Returns: Json
      }
      search_users_public: {
        Args: { p_query: string }
        Returns: {
          avatar_url: string
          cursus: string
          display_name: string
          equipped_frame: string
          equipped_sticker: string
          equipped_title: string
          id: string
          level: number
          sticker_emoji: string
          student_code: string
          title_emoji: string
          title_name: string
          title_rarity: string
          username: string
        }[]
      }
      send_course_to_friend: {
        Args: { p_course_id: string; p_recipient_id: string }
        Returns: Json
      }
      set_duel_presence: {
        Args: {
          p_current_question?: number
          p_duel_id: string
          p_ready: boolean
        }
        Returns: undefined
      }
      set_username: { Args: { p_username: string }; Returns: Json }
      submit_duel_attempt: {
        Args: { p_answers: Json; p_duel_id: string; p_score: number }
        Returns: Json
      }
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
