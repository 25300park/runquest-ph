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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
