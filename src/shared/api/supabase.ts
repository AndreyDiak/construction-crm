import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Supabase не настроен. Создайте .env.local с VITE_SUPABASE_URL и VITE_SUPABASE_PUBLISHABLE_KEY.',
  )
}

if (!supabasePublishableKey.startsWith('sb_publishable_')) {
  throw new Error(
    'VITE_SUPABASE_PUBLISHABLE_KEY должен содержать publishable key (sb_publishable_...). Секретные ключи и legacy JWT запрещены.',
  )
}

export const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
