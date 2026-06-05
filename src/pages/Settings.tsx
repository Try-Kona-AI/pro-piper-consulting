import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { TenantSettings } from '../lib/types'
import { Card, Button, PageHeader, Loading, ErrorNote, TextField, TextAreaField } from '../components/ui'
import { sendEmail } from '../lib/email'
import type { EmailType } from '../lib/email'

type Draft = Omit<TenantSettings, 'id' | 'tenant_id' | 'updated_at'>

const EMPTY: Draft = {
  zelle_contact: '',
  bank_name: '',
  bank_routing: '',
  bank_account: '',
  mailing_name: '',
  mailing_address: '',
  contact_phone: '',
  other_instructions: '',
}

function PaymentPreview({ d }: { d: Draft }) {
  const hasZelle = d.zelle_contact?.trim()
  const hasBank  = d.bank_name?.trim() && d.bank_routing?.trim() && d.bank_account?.trim()
  const hasWire  = hasBank
  const hasMail  = d.mailing_name?.trim() && d.mailing_address?.trim()
  const hasOther = d.other_instructions?.trim()

  if (!hasZelle && !hasBank && !hasMail && !hasOther) {
    return (
      <p className="text-sm italic text-slate-400">
        Fill in at least one payment method to see the preview.
      </p>
    )
  }

  return (
    <div className="space-y-3 text-sm text-slate-700">
      <p className="font-semibold text-slate-900">How to pay your invoice</p>

      {hasZelle && (
        <div>
          <p className="font-medium">Zelle</p>
          <p className="text-slate-500">Send to: <span className="font-mono text-slate-800">{d.zelle_contact}</span></p>
        </div>
      )}

      {hasBank && (
        <div>
          <p className="font-medium">ACH / Bank Transfer</p>
          <p className="text-slate-500">Bank: {d.bank_name}</p>
          <p className="text-slate-500">Routing: <span className="font-mono text-slate-800">{d.bank_routing}</span></p>
          <p className="text-slate-500">Account: <span className="font-mono text-slate-800">{d.bank_account}</span></p>
        </div>
      )}

      {hasWire && (
        <div>
          <p className="font-medium">Wire Transfer</p>
          <p className="text-slate-500">Same bank details as ACH above. Reference your invoice number in the memo.</p>
        </div>
      )}

      {hasMail && (
        <div>
          <p className="font-medium">Check by Mail</p>
          <p className="text-slate-500">Make payable to: <span className="text-slate-800">{d.mailing_name}</span></p>
          <p className="text-slate-500 whitespace-pre-line">{d.mailing_address}</p>
        </div>
      )}

      {d.contact_phone?.trim() && (
        <p className="text-slate-500">
          Questions? Call or text <span className="text-slate-800">{d.contact_phone}</span>.
        </p>
      )}

      {hasOther && (
        <p className="whitespace-pre-line text-slate-600">{d.other_instructions}</p>
      )}
    </div>
  )
}

export default function Settings() {
  const { tenantId } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [saved,   setSaved]   = useState(false)
  const [draft,   setDraft]   = useState<Draft>(EMPTY)

  useEffect(() => {
    if (!tenantId) return
    void (async () => {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('*')
        .eq('tenant_id', tenantId)
        .maybeSingle()
      if (error) { setError(error.message); setLoading(false); return }
      if (data) {
        setDraft({
          zelle_contact:      data.zelle_contact      ?? '',
          bank_name:          data.bank_name          ?? '',
          bank_routing:       data.bank_routing       ?? '',
          bank_account:       data.bank_account       ?? '',
          mailing_name:       data.mailing_name       ?? '',
          mailing_address:    data.mailing_address    ?? '',
          contact_phone:      data.contact_phone      ?? '',
          other_instructions: data.other_instructions ?? '',
        })
      }
      setLoading(false)
    })()
  }, [tenantId])

  function set(field: keyof Draft) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraft(d => ({ ...d, [field]: e.target.value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    setSaved(false)
    setError(null)

    const payload = {
      tenant_id: tenantId,
      zelle_contact:      draft.zelle_contact      || null,
      bank_name:          draft.bank_name          || null,
      bank_routing:       draft.bank_routing       || null,
      bank_account:       draft.bank_account       || null,
      mailing_name:       draft.mailing_name       || null,
      mailing_address:    draft.mailing_address    || null,
      contact_phone:      draft.contact_phone      || null,
      other_instructions: draft.other_instructions || null,
      updated_at:         new Date().toISOString(),
    }

    const { error } = await supabase
      .from('tenant_settings')
      .upsert(payload, { onConflict: 'tenant_id' })

    if (error) setError(error.message)
    else setSaved(true)
    setSaving(false)
  }

  if (loading) return <Loading />

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Your payment instructions appear at the bottom of every invoice reminder email."
      />

      {error && <ErrorNote message={error} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ---- Form ---- */}
        <form onSubmit={(e) => void handleSave(e)} className="space-y-6">
          {/* Zelle */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Zelle</h2>
            <TextField
              label="Zelle email or phone"
              placeholder="mark@propiperconsulting.com"
              value={draft.zelle_contact ?? ''}
              onChange={set('zelle_contact')}
            />
          </Card>

          {/* ACH / Wire */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">ACH / Wire</h2>
            <TextField
              label="Bank name"
              placeholder="Chase"
              value={draft.bank_name ?? ''}
              onChange={set('bank_name')}
            />
            <TextField
              label="Routing number"
              placeholder="021000021"
              value={draft.bank_routing ?? ''}
              onChange={set('bank_routing')}
            />
            <TextField
              label="Account number"
              placeholder="•••••••••"
              value={draft.bank_account ?? ''}
              onChange={set('bank_account')}
            />
          </Card>

          {/* Check by mail */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Check by Mail</h2>
            <TextField
              label="Payable to (business name)"
              placeholder="Pro Piper Consulting LLC"
              value={draft.mailing_name ?? ''}
              onChange={set('mailing_name')}
            />
            <TextAreaField
              label="Mailing address"
              placeholder={"100 Church St\nNew York, NY 10007"}
              value={draft.mailing_address ?? ''}
              onChange={set('mailing_address')}
            />
          </Card>

          {/* Other */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Other</h2>
            <TextField
              label="Contact phone (for payment questions)"
              placeholder="212-555-0100"
              value={draft.contact_phone ?? ''}
              onChange={set('contact_phone')}
            />
            <TextAreaField
              label="Additional instructions (optional)"
              placeholder="Please include your invoice number in the memo."
              value={draft.other_instructions ?? ''}
              onChange={set('other_instructions')}
            />
          </Card>

          <div className="flex items-center justify-end gap-3">
            {saved && <span className="text-sm font-medium text-emerald-600">Saved ✓</span>}
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save settings'}
            </Button>
          </div>
        </form>

        {/* ---- Live preview ---- */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
            Preview — how customers will see it
          </h2>
          <Card className="p-5">
            <div className="mb-4 border-b border-slate-100 pb-4">
              <p className="text-xs text-slate-400">Invoice #2026-0012 · Due Jun 15, 2026</p>
              <p className="mt-1 text-sm text-slate-600">
                Hi John — just a reminder that invoice #2026-0012 for $2,500.00 is due in 5 days.
              </p>
            </div>
            <PaymentPreview d={draft} />
          </Card>
        </div>
      </div>

      {/* ---- Test email panel ---- */}
      <TestEmailPanel tenantId={tenantId} />
    </>
  )
}

// ── Test Email Panel ─────────────────────────────────────────────────────────

const TEST_TYPES: { type: EmailType; label: string; needs: 'invoice' | 'customer' | 'job' }[] = [
  { type: 'invoice_reminder', label: 'Invoice reminder',     needs: 'invoice' },
  { type: 'invoice_receipt',  label: 'Invoice receipt',      needs: 'invoice' },
  { type: 'follow_up',        label: 'Follow-up (Day 7)',    needs: 'invoice' },
  { type: 'win_back',         label: 'Win-back message',     needs: 'customer' },
  { type: 'quote',            label: 'Quote / Proposal',     needs: 'job' },
]

function TestEmailPanel({ tenantId }: { tenantId: string | null }) {
  const [testEmail, setTestEmail] = useState('mjkohn12@yahoo.com')
  const [sending, setSending]     = useState<EmailType | null>(null)
  const [results, setResults]     = useState<Record<string, { ok: boolean; msg: string }>>({})

  async function runTest(entry: typeof TEST_TYPES[0]) {
    if (!tenantId) return
    setSending(entry.type)

    try {
      // Find the first available record of the right type
      let ids: { invoiceId?: string; customerId?: string; jobId?: string } = {}

      if (entry.needs === 'invoice') {
        const { data } = await supabase.from('invoices').select('id').eq('tenant_id', tenantId).limit(1)
        if (!data?.length) throw new Error('No invoices found — create one first')
        ids = { invoiceId: data[0].id }
      } else if (entry.needs === 'customer') {
        const { data } = await supabase.from('customers').select('id').eq('tenant_id', tenantId).limit(1)
        if (!data?.length) throw new Error('No customers found — add one first')
        ids = { customerId: data[0].id }
      } else {
        const { data } = await supabase.from('jobs').select('id').eq('tenant_id', tenantId).limit(1)
        if (!data?.length) throw new Error('No jobs found — add one first')
        ids = { jobId: data[0].id }
      }

      const result = await sendEmail({
        type: entry.type,
        tenantId,
        recipientEmail: testEmail,
        day: 7,
        ...ids,
      })

      setResults(r => ({
        ...r,
        [entry.type]: result.ok
          ? { ok: true, msg: `Sent to ${testEmail}` }
          : { ok: false, msg: result.error ?? 'Unknown error' },
      }))
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      setResults(r => ({ ...r, [entry.type]: { ok: false, msg } }))
    }

    setSending(null)
  }

  return (
    <div className="mt-10">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Test emails</h2>
      <p className="mb-4 text-sm text-slate-500">
        Send a real test email of each type to any address. Uses live data from your account.
        Requires a Resend API key to be set (see setup instructions below).
      </p>

      <Card className="p-5">
        <div className="mb-5">
          <label className="mb-1 block text-sm font-medium text-slate-700">Send test to</label>
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-3">
          {TEST_TYPES.map(entry => {
            const res = results[entry.type]
            return (
              <div key={entry.type} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">{entry.label}</div>
                  {res && (
                    <div className={`mt-0.5 text-xs ${res.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                      {res.ok ? '✓ ' : '✗ '}{res.msg}
                    </div>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void runTest(entry)}
                  disabled={sending === entry.type || !testEmail}
                >
                  {sending === entry.type ? 'Sending…' : 'Send test'}
                </Button>
              </div>
            )
          })}
        </div>

        {/* Setup note */}
        <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
          <p className="font-medium">Setup required — Resend API key</p>
          <p className="mt-1">
            Go to{' '}
            <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline">resend.com</a>
            {' '}→ Sign up → API Keys → Create key. Then add it in{' '}
            <a
              href="https://supabase.com/dashboard/project/iswutjgctsilblzfjhbg/settings/vault"
              target="_blank" rel="noreferrer"
              className="underline"
            >
              Supabase Vault
            </a>
            {' '}as <code className="rounded bg-amber-100 px-1 font-mono text-xs">RESEND_API_KEY</code>.
          </p>
        </div>
      </Card>
    </div>
  )
}
