import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

function getRequiredEnv(name: 'NEXT_PUBLIC_SUPABASE_URL' | 'NEXT_PUBLIC_SUPABASE_ANON_KEY'): string {
  const value = process.env[name]

  if (!value) {
    throw new Error(
      `Missing Supabase environment variable: ${name}. Add it to .env.local for local development and to your Vercel project environment variables for deployment.`
    )
  }

  return value
}

export function getSupabase(): SupabaseClient {
  if (supabaseClient) return supabaseClient

  supabaseClient = createClient(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )

  return supabaseClient
}
