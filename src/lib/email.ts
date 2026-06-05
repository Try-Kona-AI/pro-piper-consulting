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
  const { data, error } = await supabase.functions.invoke<{ ok: boolean; error?: string; to?: string }>(
    'send-email',
    { body: params }
  )
  if (error) return { ok: false, error: error.message }
  if (!data?.ok) return { ok: false, error: data?.error ?? 'Unknown error' }
  return { ok: true, to: data.to }
}
