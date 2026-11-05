import type { ProfileRow } from '@/shared/api/database.types'
import { supabase } from '@/shared/api/supabase'

export async function listExecutors(): Promise<ProfileRow[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('role', 'executor')
    .order('full_name', { ascending: true })

  if (error) {
    throw error
  }

  return (data ?? []) as ProfileRow[]
}
