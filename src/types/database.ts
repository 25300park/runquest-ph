export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          level: number;
          xp: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          email?: string | null;
          name?: string | null;
          level?: number;
          xp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          name?: string | null;
          level?: number;
          xp?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          id: string;
          name: string;
          area: 'BGC' | 'Makati' | 'MOA';
          difficulty: 'Easy' | 'Normal' | 'Hard' | 'Challenge';
          distance: number;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          area: 'BGC' | 'Makati' | 'MOA';
          difficulty: 'Easy' | 'Normal' | 'Hard' | 'Challenge';
          distance?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          area?: 'BGC' | 'Makati' | 'MOA';
          difficulty?: 'Easy' | 'Normal' | 'Hard' | 'Challenge';
          distance?: number;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'courses_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      course_points: {
        Row: {
          id: string;
          course_id: string;
          lat: number;
          lng: number;
          order_index: number;
          type: 'start' | 'checkpoint' | 'finish';
        };
        Insert: {
          id?: string;
          course_id: string;
          lat: number;
          lng: number;
          order_index: number;
          type: 'start' | 'checkpoint' | 'finish';
        };
        Update: {
          id?: string;
          course_id?: string;
          lat?: number;
          lng?: number;
          order_index?: number;
          type?: 'start' | 'checkpoint' | 'finish';
        };
        Relationships: [
          {
            foreignKeyName: 'course_points_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          }
        ];
      };
      activities: {
        Row: {
          id: string;
          user_id: string | null;
          course_id: string | null;
          distance: number;
          duration: number;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          course_id?: string | null;
          distance?: number;
          duration?: number;
          xp_earned?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          course_id?: string | null;
          distance?: number;
          duration?: number;
          xp_earned?: number;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'activities_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'activities_course_id_fkey';
            columns: ['course_id'];
            isOneToOne: false;
            referencedRelation: 'courses';
            referencedColumns: ['id'];
          }
        ];
      };
      characters: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          level: number;
          xp: number;
          avatar_base_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          level?: number;
          xp?: number;
          avatar_base_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          name?: string;
          level?: number;
          xp?: number;
          avatar_base_url?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'characters_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          }
        ];
      };
      character_stats: {
        Row: {
          id: string;
          character_id: string;
          total_distance: number;
          total_runs: number;
          total_xp: number;
          streak_days: number;
        };
        Insert: {
          id?: string;
          character_id: string;
          total_distance?: number;
          total_runs?: number;
          total_xp?: number;
          streak_days?: number;
        };
        Update: {
          id?: string;
          character_id?: string;
          total_distance?: number;
          total_runs?: number;
          total_xp?: number;
          streak_days?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'character_stats_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: false;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          }
        ];
      };
      equipment_items: {
        Row: {
          id: string;
          name: string;
          type: 'shoes' | 'backpack' | 'hat' | 'accessory';
          rarity: string;
          speed_bonus: number;
          xp_bonus: number;
          image_url: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'shoes' | 'backpack' | 'hat' | 'accessory';
          rarity?: string;
          speed_bonus?: number;
          xp_bonus?: number;
          image_url?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'shoes' | 'backpack' | 'hat' | 'accessory';
          rarity?: string;
          speed_bonus?: number;
          xp_bonus?: number;
          image_url?: string | null;
        };
        Relationships: [];
      };
      character_equipment: {
        Row: {
          id: string;
          character_id: string;
          item_id: string;
          equipped: boolean;
        };
        Insert: {
          id?: string;
          character_id: string;
          item_id: string;
          equipped?: boolean;
        };
        Update: {
          id?: string;
          character_id?: string;
          item_id?: string;
          equipped?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'character_equipment_character_id_fkey';
            columns: ['character_id'];
            isOneToOne: false;
            referencedRelation: 'characters';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'character_equipment_item_id_fkey';
            columns: ['item_id'];
            isOneToOne: false;
            referencedRelation: 'equipment_items';
            referencedColumns: ['id'];
          }
        ];
      };
      leaderboard: {
        Row: {
          id: string;
          user_id: string | null;
          character_id: string | null;
          region: 'BGC' | 'Makati' | 'MOA' | 'Global';
          total_distance: number;
          total_xp: number;
          level: number;
          streak_bonus: number;
          weekly_score: number;
          week_start: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          character_id?: string | null;
          region?: 'BGC' | 'Makati' | 'MOA' | 'Global';
          total_distance?: number;
          total_xp?: number;
          level?: number;
          streak_bonus?: number;
          weekly_score?: number;
          week_start?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          character_id?: string | null;
          region?: 'BGC' | 'Makati' | 'MOA' | 'Global';
          total_distance?: number;
          total_xp?: number;
          level?: number;
          streak_bonus?: number;
          weekly_score?: number;
          week_start?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      guilds: {
        Row: {
          id: string;
          name: string;
          leader_id: string | null;
          shared_xp: number;
          total_distance: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          leader_id?: string | null;
          shared_xp?: number;
          total_distance?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          leader_id?: string | null;
          shared_xp?: number;
          total_distance?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      guild_members: {
        Row: {
          id: string;
          guild_id: string;
          user_id: string | null;
          character_id: string | null;
          role: 'leader' | 'officer' | 'member';
          contributed_xp: number;
          contributed_distance: number;
          joined_at: string;
        };
        Insert: {
          id?: string;
          guild_id: string;
          user_id?: string | null;
          character_id?: string | null;
          role?: 'leader' | 'officer' | 'member';
          contributed_xp?: number;
          contributed_distance?: number;
          joined_at?: string;
        };
        Update: {
          id?: string;
          guild_id?: string;
          user_id?: string | null;
          character_id?: string | null;
          role?: 'leader' | 'officer' | 'member';
          contributed_xp?: number;
          contributed_distance?: number;
          joined_at?: string;
        };
        Relationships: [];
      };
      guild_challenges: {
        Row: {
          id: string;
          guild_id: string;
          name: string;
          target_distance: number;
          target_xp: number;
          progress_distance: number;
          progress_xp: number;
          starts_at: string;
          ends_at: string | null;
        };
        Insert: {
          id?: string;
          guild_id: string;
          name: string;
          target_distance?: number;
          target_xp?: number;
          progress_distance?: number;
          progress_xp?: number;
          starts_at?: string;
          ends_at?: string | null;
        };
        Update: {
          id?: string;
          guild_id?: string;
          name?: string;
          target_distance?: number;
          target_xp?: number;
          progress_distance?: number;
          progress_xp?: number;
          starts_at?: string;
          ends_at?: string | null;
        };
        Relationships: [];
      };
      item_ownership: {
        Row: {
          id: string;
          user_id: string | null;
          character_id: string | null;
          item_id: string;
          serial_number: number;
          upgrade_level: number;
          trade_locked: boolean;
          acquired_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          character_id?: string | null;
          item_id: string;
          serial_number?: number;
          upgrade_level?: number;
          trade_locked?: boolean;
          acquired_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          character_id?: string | null;
          item_id?: string;
          serial_number?: number;
          upgrade_level?: number;
          trade_locked?: boolean;
          acquired_at?: string;
        };
        Relationships: [];
      };
      item_drops: {
        Row: {
          id: string;
          character_id: string | null;
          item_id: string;
          source: string;
          rarity_roll: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          character_id?: string | null;
          item_id: string;
          source?: string;
          rarity_roll?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          character_id?: string | null;
          item_id?: string;
          source?: string;
          rarity_roll?: number;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
