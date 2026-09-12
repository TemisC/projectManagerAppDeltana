import { supabase } from '../supabaseClient';

export async function updateMyThemePreference(theme: 'dark' | 'light'): Promise<void> {
  const { error } = await supabase.rpc('update_my_theme_preference', { p_theme: theme });
  if (error) throw error;
}
