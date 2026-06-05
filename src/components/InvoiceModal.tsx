import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Customer, Invoice } from '../lib/types'
import { Modal, TextField, SelectField, TextAreaField, FormActions } from './ui'

const defaultDue = () => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
const today      = () => new Date().toISOString().slice(0, 10)

async function nextNumber(tenantId: string): Promise<string> {
  const { data } = await supabase
    .from('invoices')
    .select('number')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(1)
  if (!data?.length) return 'INV-1100'
  const n = parseInt(data[0].number.replace('INV-', ''), 10)
  return isNaN(n) ? 'INV-1100' : `INV-${n + 1}`
}

interface Props {
  onClose: () => void
  onSaved: () => void
  invoice?: Invoice
}

export default function InvoiceModal({ onClose, onSaved, invoice }: Props) {
  const { tenantId } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [customerId, setCustomerId] = useState(invoice?.customer_id ?? '')
  const [description, setDescription] = useState(invoice?.description ?? '')
  const [amount, setAmount]         = useState(invoice?.amount?.toString() ?? '')
  const [dueDate, setDueDate]       = useState(invoice?.due_date ?? defaultDue())
  const [status, setStatus]         = useState<Invoice['status']>(invoice?.status ?? 'draft')

  useEffect(() => {
    if (!tenantId) return
    supabase.from('customers').select('id,name').eq('tenant_id', tenantId).order('name')
      .then(({ data }) => setCustomers((data as Customer[]) ?? []))
  }, [tenantId])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    setError(null)

    const payload = {
      customer_id: customerId,
      description,
      amount: parseFloat(amount),
      due_date: dueDate,
      status,
      sent_date: invoice?.sent_date ?? today(),
      tenant_id: tenantId,
    }

    let err
    if (invoice) {
      ;({ error: err } = await supabase.from('invoices').update(payload).eq('id', invoice.id))
    } else {
      const number = await nextNumber(tenantId)
      ;({ error: err } = await supabase.from('invoices').insert({ ...payload, number }))
    }

    if (err) setError(err.message)
    else { onSaved(); onClose() }
    setSaving(false)
  }

  return (
    <Modal title={invoice ? 'Edit invoice' : 'New invoice'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SelectField label="Customer" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
          <option value="">Select a customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <TextAreaField label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Water heater replacement, unit 4B" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Amount ($)" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
          <TextField label="Due date" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
        <SelectField label="Status" value={status} onChange={e => setStatus(e.target.value as Invoice['status'])}>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="overdue">Overdue</option>
          <option value="paid">Paid</option>
        </SelectField>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} saving={saving} label={invoice ? 'Save changes' : 'Create invoice'} />
      </form>
    </Modal>
  )
}
