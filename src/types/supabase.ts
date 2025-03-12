export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      automation_scripts: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
          parameters: Json | null
          script_path: string
          script_type: string
          test_case_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
          parameters?: Json | null
          script_path: string
          script_type: string
          test_case_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
          parameters?: Json | null
          script_path?: string
          script_type?: string
          test_case_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_scripts_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      bug_attachments: {
        Row: {
          bug_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          bug_id: string
          file_name: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          bug_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bug_attachments_bug_id_fkey"
            columns: ["bug_id"]
            isOneToOne: false
            referencedRelation: "bugs"
            referencedColumns: ["id"]
          },
        ]
      }
      bugs: {
        Row: {
          actual_result: string | null
          assigned_to: string | null
          created_at: string | null
          description: string
          id: string
          release_id: string | null
          reported_by: string | null
          severity: string
          status: string
          test_execution_id: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_result?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description: string
          id?: string
          release_id?: string | null
          reported_by?: string | null
          severity?: string
          status?: string
          test_execution_id?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_result?: string | null
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          id?: string
          release_id?: string | null
          reported_by?: string | null
          severity?: string
          status?: string
          test_execution_id?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bugs_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bugs_test_execution_id_fkey"
            columns: ["test_execution_id"]
            isOneToOne: false
            referencedRelation: "test_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      features: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          module_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          module_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "features_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          project_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          project_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          project_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      releases: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      test_case_tags: {
        Row: {
          tag_id: string
          test_case_id: string
        }
        Insert: {
          tag_id: string
          test_case_id: string
        }
        Update: {
          tag_id?: string
          test_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_case_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_case_tags_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_cases: {
        Row: {
          attachments: string | null
          category: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          feature_id: string
          id: string
          preconditions: string | null
          priority: string
          status: string
          test_type: string
          title: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          attachments?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          feature_id: string
          id?: string
          preconditions?: string | null
          priority?: string
          status?: string
          test_type?: string
          title: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          attachments?: string | null
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          feature_id?: string
          id?: string
          preconditions?: string | null
          priority?: string
          status?: string
          test_type?: string
          title?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_cases_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "features"
            referencedColumns: ["id"]
          },
        ]
      }
      test_executions: {
        Row: {
          duration: number | null
          executed_at: string | null
          executed_by: string | null
          id: string
          notes: string | null
          status: string
          test_case_id: string
          test_run_id: string
        }
        Insert: {
          duration?: number | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          status: string
          test_case_id: string
          test_run_id: string
        }
        Update: {
          duration?: number | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          test_case_id?: string
          test_run_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_executions_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_executions_test_run_id_fkey"
            columns: ["test_run_id"]
            isOneToOne: false
            referencedRelation: "test_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      test_runs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          environment: string | null
          id: string
          name: string
          release_id: string | null
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          name: string
          release_id?: string | null
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          name?: string
          release_id?: string | null
          started_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_runs_release_id_fkey"
            columns: ["release_id"]
            isOneToOne: false
            referencedRelation: "releases"
            referencedColumns: ["id"]
          },
        ]
      }
      test_step_results: {
        Row: {
          actual_result: string | null
          executed_at: string | null
          id: string
          status: string
          test_execution_id: string
          test_step_id: string
        }
        Insert: {
          actual_result?: string | null
          executed_at?: string | null
          id?: string
          status: string
          test_execution_id: string
          test_step_id: string
        }
        Update: {
          actual_result?: string | null
          executed_at?: string | null
          id?: string
          status?: string
          test_execution_id?: string
          test_step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "test_step_results_test_execution_id_fkey"
            columns: ["test_execution_id"]
            isOneToOne: false
            referencedRelation: "test_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "test_step_results_test_step_id_fkey"
            columns: ["test_step_id"]
            isOneToOne: false
            referencedRelation: "test_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      test_steps: {
        Row: {
          created_at: string | null
          description: string
          expected_result: string
          id: string
          step_number: number
          test_case_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          expected_result: string
          id?: string
          step_number: number
          test_case_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          expected_result?: string
          id?: string
          step_number?: number
          test_case_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_steps_test_case_id_fkey"
            columns: ["test_case_id"]
            isOneToOne: false
            referencedRelation: "test_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          user_id?: string
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
