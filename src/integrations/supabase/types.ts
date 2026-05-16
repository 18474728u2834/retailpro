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
      ai_knowledge_messages: {
        Row: {
          author_username: string | null
          bot_id: string
          channel_id: string
          content: string | null
          created_at: string
          guild_id: string
          id: string
          message_id: string
        }
        Insert: {
          author_username?: string | null
          bot_id: string
          channel_id: string
          content?: string | null
          created_at?: string
          guild_id: string
          id?: string
          message_id: string
        }
        Update: {
          author_username?: string | null
          bot_id?: string
          channel_id?: string
          content?: string | null
          created_at?: string
          guild_id?: string
          id?: string
          message_id?: string
        }
        Relationships: []
      }
      ai_replies: {
        Row: {
          ai_reply: string | null
          bot_id: string
          created_at: string
          escalated: boolean
          id: string
          reason: string | null
          ticket_id: string
          user_message: string | null
        }
        Insert: {
          ai_reply?: string | null
          bot_id: string
          created_at?: string
          escalated?: boolean
          id?: string
          reason?: string | null
          ticket_id: string
          user_message?: string | null
        }
        Update: {
          ai_reply?: string | null
          bot_id?: string
          created_at?: string
          escalated?: boolean
          id?: string
          reason?: string | null
          ticket_id?: string
          user_message?: string | null
        }
        Relationships: []
      }
      bots: {
        Row: {
          application_id: string
          avatar_url: string | null
          bot_name: string | null
          bot_running: boolean
          bot_token: string
          created_at: string
          id: string
          owner_user_id: string
          public_key: string
          status: string
          updated_at: string
        }
        Insert: {
          application_id: string
          avatar_url?: string | null
          bot_name?: string | null
          bot_running?: boolean
          bot_token: string
          created_at?: string
          id?: string
          owner_user_id: string
          public_key: string
          status?: string
          updated_at?: string
        }
        Update: {
          application_id?: string
          avatar_url?: string | null
          bot_name?: string | null
          bot_running?: boolean
          bot_token?: string
          created_at?: string
          id?: string
          owner_user_id?: string
          public_key?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      guilds: {
        Row: {
          ai_enabled: boolean
          ai_knowledge_channel_ids: string[]
          ai_product_rules: string
          ai_running: boolean
          bot_id: string
          close_message: string
          confirmation_emoji: string
          created_at: string
          guild_id: string
          guild_name: string | null
          id: string
          log_channel_id: string | null
          modmail_category_id: string | null
          staff_role_id: string | null
          updated_at: string
          welcome_message: string
        }
        Insert: {
          ai_enabled?: boolean
          ai_knowledge_channel_ids?: string[]
          ai_product_rules?: string
          ai_running?: boolean
          bot_id: string
          close_message?: string
          confirmation_emoji?: string
          created_at?: string
          guild_id: string
          guild_name?: string | null
          id?: string
          log_channel_id?: string | null
          modmail_category_id?: string | null
          staff_role_id?: string | null
          updated_at?: string
          welcome_message?: string
        }
        Update: {
          ai_enabled?: boolean
          ai_knowledge_channel_ids?: string[]
          ai_product_rules?: string
          ai_running?: boolean
          bot_id?: string
          close_message?: string
          confirmation_emoji?: string
          created_at?: string
          guild_id?: string
          guild_name?: string | null
          id?: string
          log_channel_id?: string | null
          modmail_category_id?: string | null
          staff_role_id?: string | null
          updated_at?: string
          welcome_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "guilds_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          discord_avatar: string | null
          discord_id: string | null
          discord_username: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          discord_avatar?: string | null
          discord_id?: string | null
          discord_username?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          discord_avatar?: string | null
          discord_id?: string | null
          discord_username?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      role_bindings: {
        Row: {
          bot_id: string
          created_at: string
          discord_role_id: string
          guild_id: string
          id: string
          vault_product_id: string
          vault_product_name: string | null
        }
        Insert: {
          bot_id: string
          created_at?: string
          discord_role_id: string
          guild_id: string
          id?: string
          vault_product_id: string
          vault_product_name?: string | null
        }
        Update: {
          bot_id?: string
          created_at?: string
          discord_role_id?: string
          guild_id?: string
          id?: string
          vault_product_id?: string
          vault_product_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "role_bindings_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_categories: {
        Row: {
          bot_id: string
          created_at: string
          description: string | null
          emoji: string | null
          guild_id: string
          id: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          guild_id: string
          id?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          description?: string | null
          emoji?: string | null
          guild_id?: string
          id?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ticket_messages: {
        Row: {
          author_discord_id: string
          author_username: string | null
          content: string | null
          created_at: string
          id: string
          is_staff: boolean
          ticket_id: string
        }
        Insert: {
          author_discord_id: string
          author_username?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id: string
        }
        Update: {
          author_discord_id?: string
          author_username?: string | null
          content?: string | null
          created_at?: string
          id?: string
          is_staff?: boolean
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          bot_id: string
          category_id: string | null
          category_name: string | null
          channel_id: string | null
          closed_at: string | null
          closed_by_discord_id: string | null
          closed_by_username: string | null
          created_at: string
          guild_id: string
          id: string
          opened_at: string
          status: string
          user_discord_id: string
        }
        Insert: {
          bot_id: string
          category_id?: string | null
          category_name?: string | null
          channel_id?: string | null
          closed_at?: string | null
          closed_by_discord_id?: string | null
          closed_by_username?: string | null
          created_at?: string
          guild_id: string
          id?: string
          opened_at?: string
          status?: string
          user_discord_id: string
        }
        Update: {
          bot_id?: string
          category_id?: string | null
          category_name?: string | null
          channel_id?: string | null
          closed_at?: string | null
          closed_by_discord_id?: string | null
          closed_by_username?: string | null
          created_at?: string
          guild_id?: string
          id?: string
          opened_at?: string
          status?: string
          user_discord_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      trials: {
        Row: {
          bot_id: string
          created_at: string
          discord_id: string
          id: string
          roblox_username: string | null
          trial_expiration: string
          trial_started_at: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          discord_id: string
          id?: string
          roblox_username?: string | null
          trial_expiration: string
          trial_started_at?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          discord_id?: string
          id?: string
          roblox_username?: string | null
          trial_expiration?: string
          trial_started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trials_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      owns_bot: { Args: { _bot_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
