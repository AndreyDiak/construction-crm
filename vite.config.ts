import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const invalidSupabaseKey = Object.entries(env).find(
    ([name, value]) =>
      name.startsWith('VITE_') &&
      (value.startsWith('sb_secret_') ||
        (/^VITE_SUPABASE_.*KEY$/.test(name) && !value.startsWith('sb_publishable_'))),
  )

  if (invalidSupabaseKey) {
    throw new Error(
      `${invalidSupabaseKey[0]} must contain a Supabase publishable key (sb_publishable_...). Secret keys and legacy JWT keys are not allowed in VITE_ variables.`,
    )
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
