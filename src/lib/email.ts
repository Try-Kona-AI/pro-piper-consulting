import { supabase } from './supabase'

export type EmailType =
  | 'invoice_reminder'
  | 'invoice_receipt'
  | 'win_back'
  | 'quote'
  | 'follow_up'

export interface SendEmailParams {
  type: EmailType
  tenantId: string
  invoiceId?: string
  customerId?: string
  jobId?: string
  /** Override the customer's stored email — useful for tests */
  recipientEmail?: string
  /** follow_up only: day in the sequence (3, 7, 14) */
  day?: number
}

export interface SendResult {
  ok: boolean
  error?: string
  to?: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  // supabase.functions.invoke is incompatible with the sb_publishable_ key format
  // — use direct fetch with the session JWT instead (proven to work).
  const { data: { session } } = await supabase.auth.getSession()
  const jwt = session?.access_token
  if (!jwt) return { ok: false, error: 'Not authenticated' }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
  const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwt}`,
    },
    body: JSON.stringify(params),
  })

  let body: { ok: boolean; error?: string; to?: string }
  try { body = await res.json() } catch { return { ok: false, error: `HTTP ${res.status}` } }

  if (!body.ok) return { ok: false, error: body.error ?? 'Unknown error' }
  return { ok: true, to: body.to }
}
