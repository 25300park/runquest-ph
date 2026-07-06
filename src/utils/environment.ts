import { isSupabaseConfigured } from '../lib/supabase';

export type EnvironmentHealth = {
  supabaseConfigured: boolean;
  mode: string;
  ready: boolean;
  messages: string[];
};

export function getEnvironmentHealth(): EnvironmentHealth {
  const messages: string[] = [];

  if (!isSupabaseConfigured) {
    messages.push('Supabase environment variables are missing.');
  }

  return {
    supabaseConfigured: isSupabaseConfigured,
    mode: import.meta.env.MODE,
    ready: isSupabaseConfigured,
    messages
  };
}
