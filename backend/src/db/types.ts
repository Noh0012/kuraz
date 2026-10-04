// Generated from the Supabase schema (MCP generate_typescript_types); helper types at the bottom trimmed.
// Regenerate after every migration instead of editing by hand.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookmarks: {
        Row: {
          created_at: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      chapters: {
        Row: {
          created_at: string
          id: string
          sort: number
          subject_id: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          sort?: number
          subject_id: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          sort?: number
          subject_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "chapters_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      grades: {
        Row: {
          id: number
          name: string
          sort: number
        }
        Insert: {
          id: number
          name: string
          sort?: number
        }
        Update: {
          id?: number
          name?: string
          sort?: number
        }
        Relationships: []
      }
      issue_reports: {
        Row: {
          category: string
          context: Json | null
          created_at: string
          id: string
          message: string
          status: string
          user_id: string
        }
        Insert: {
          category?: string
          context?: Json | null
          created_at?: string
          id?: string
          message: string
          status?: string
          user_id: string
        }
        Update: {
          category?: string
          context?: Json | null
          created_at?: string
          id?: string
          message?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          created_at: string
          description: string | null
          duration_days: number
          features: string[]
          grade_id: number
          id: string
          includes_qbank: boolean
          includes_tests: boolean
          includes_videos: boolean
          is_active: boolean
          name: string
          price_etb: number
          sort: number
          tier: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_days: number
          features?: string[]
          grade_id: number
          id?: string
          includes_qbank?: boolean
          includes_tests?: boolean
          includes_videos?: boolean
          is_active?: boolean
          name: string
          price_etb: number
          sort?: number
          tier?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_days?: number
          features?: string[]
          grade_id?: number
          id?: string
          includes_qbank?: boolean
          includes_tests?: boolean
          includes_videos?: boolean
          is_active?: boolean
          name?: string
          price_etb?: number
          sort?: number
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string
          grade_id: number | null
          id: string
          phone: string | null
          region: string | null
          role: string
          school: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          grade_id?: number | null
          id: string
          phone?: string | null
          region?: string | null
          role?: string
          school?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          grade_id?: number | null
          id?: string
          phone?: string | null
          region?: string | null
          role?: string
          school?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      question_attempts: {
        Row: {
          answered_at: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Insert: {
          answered_at?: string
          is_correct: boolean
          question_id: string
          selected_option: string
          user_id: string
        }
        Update: {
          answered_at?: string
          is_correct?: boolean
          question_id?: string
          selected_option?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          chapter_id: string | null
          correct_option: string
          created_at: string
          difficulty: number
          explanation: string | null
          id: string
          is_free: boolean
          options: Json
          sort: number
          stem: string
          subject_id: string
        }
        Insert: {
          chapter_id?: string | null
          correct_option: string
          created_at?: string
          difficulty?: number
          explanation?: string | null
          id?: string
          is_free?: boolean
          options: Json
          sort?: number
          stem: string
          subject_id: string
        }
        Update: {
          chapter_id?: string | null
          correct_option?: string
          created_at?: string
          difficulty?: number
          explanation?: string | null
          id?: string
          is_free?: boolean
          options?: Json
          sort?: number
          stem?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          grade_id: number
          icon: string
          id: string
          name: string
          sort: number
          teacher_avatar_url: string | null
          teacher_name: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          grade_id: number
          icon?: string
          id?: string
          name: string
          sort?: number
          teacher_avatar_url?: string | null
          teacher_name?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          grade_id?: number
          icon?: string
          id?: string
          name?: string
          sort?: number
          teacher_avatar_url?: string | null
          teacher_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subjects_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_etb: number
          created_at: string
          expires_at: string | null
          id: string
          package_id: string
          provider: string
          starts_at: string | null
          status: string
          tx_ref: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_etb?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id: string
          provider?: string
          starts_at?: string | null
          status?: string
          tx_ref: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_etb?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          package_id?: string
          provider?: string
          starts_at?: string | null
          status?: string
          tx_ref?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          answers: Json
          created_at: string
          deadline_at: string
          id: string
          score: number | null
          started_at: string
          submitted_at: string | null
          test_id: string
          total: number | null
          user_id: string
        }
        Insert: {
          answers?: Json
          created_at?: string
          deadline_at: string
          id?: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          test_id: string
          total?: number | null
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          deadline_at?: string
          id?: string
          score?: number | null
          started_at?: string
          submitted_at?: string | null
          test_id?: string
          total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_questions: {
        Row: {
          position: number
          question_id: string
          test_id: string
        }
        Insert: {
          position: number
          question_id: string
          test_id: string
        }
        Update: {
          position?: number
          question_id?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number
          exam_year: number | null
          grade_id: number
          id: string
          is_free: boolean
          scheduled_for: string | null
          sort: number
          subject_id: string | null
          title: string
          type: string
          year_label: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes: number
          exam_year?: number | null
          grade_id: number
          id?: string
          is_free?: boolean
          scheduled_for?: string | null
          sort?: number
          subject_id?: string | null
          title: string
          type: string
          year_label?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number
          exam_year?: number | null
          grade_id?: number
          id?: string
          is_free?: boolean
          scheduled_for?: string | null
          sort?: number
          subject_id?: string | null
          title?: string
          type?: string
          year_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tests_grade_id_fkey"
            columns: ["grade_id"]
            isOneToOne: false
            referencedRelation: "grades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tests_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      video_progress: {
        Row: {
          completed: boolean
          position_seconds: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          completed?: boolean
          position_seconds?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          completed?: boolean
          position_seconds?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_progress_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          chapter_id: string
          created_at: string
          description: string | null
          duration_seconds: number
          id: string
          is_free: boolean
          notes_url: string | null
          sort: number
          source_url: string
          thumbnail_url: string | null
          title: string
          view_count: number
        }
        Insert: {
          chapter_id: string
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free?: boolean
          notes_url?: string | null
          sort?: number
          source_url: string
          thumbnail_url?: string | null
          title: string
          view_count?: number
        }
        Update: {
          chapter_id?: string
          created_at?: string
          description?: string | null
          duration_seconds?: number
          id?: string
          is_free?: boolean
          notes_url?: string | null
          sort?: number
          source_url?: string
          thumbnail_url?: string | null
          title?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "videos_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_video_views: {
        Args: { p_video_id: string }
        Returns: undefined
      }
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
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Row"]

export type TablesInsert<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Insert"]

export type TablesUpdate<
  T extends keyof DefaultSchema["Tables"],
> = DefaultSchema["Tables"][T]["Update"]
