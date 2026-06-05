import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { TenantSettings } from '../lib/types'
import { Card, Button, PageHeader, Loading, ErrorNote, TextField, TextAreaField } from '../components/ui'

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
              placeholder="mike@propiperplumbing.com"
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
              placeholder="Pro Piper Plumbing LLC"
              value={draft.mailing_name ?? ''}
              onChange={set('mailing_name')}
            />
            <TextAreaField
              label="Mailing address"
              placeholder={"225-11 145th Ave\nSpringfield Gardens, NY 11413"}
              value={draft.mailing_address ?? ''}
              onChange={set('mailing_address')}
            />
          </Card>

          {/* Other */}
          <Card className="p-5 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Other</h2>
            <TextField
              label="Contact phone (for payment questions)"
              placeholder="718-555-0100"
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
                Hi John — just a reminder that invoice #2026-0012 for $450.00 is due in 5 days.
              </p>
            </div>
            <PaymentPreview d={draft} />
          </Card>
        </div>
      </div>
    </>
  )
}
