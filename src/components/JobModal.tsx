import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Customer, Job } from '../lib/types'
import { Modal, TextField, SelectField, TextAreaField, FormActions } from './ui'

interface Props {
  onClose: () => void
  onSaved: () => void
  job?: Job
}

export default function JobModal({ onClose, onSaved, job }: Props) {
  const { tenantId } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const [customerId, setCustomerId]   = useState(job?.customer_id ?? '')
  const [title, setTitle]             = useState(job?.title ?? '')
  const [description, setDescription] = useState(job?.description ?? '')
  const [status, setStatus]           = useState<Job['status']>(job?.status ?? 'quote')
  const [amount, setAmount]           = useState(job?.amount?.toString() ?? '')
  const [scheduledDate, setScheduledDate] = useState(job?.scheduled_date ?? '')

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
      title,
      description,
      status,
      amount: parseFloat(amount) || 0,
      scheduled_date: scheduledDate || null,
      tenant_id: tenantId,
    }

    let err
    if (job) {
      ;({ error: err } = await supabase.from('jobs').update(payload).eq('id', job.id))
    } else {
      ;({ error: err } = await supabase.from('jobs').insert(payload))
    }

    if (err) setError(err.message)
    else { onSaved(); onClose() }
    setSaving(false)
  }

  return (
    <Modal title={job ? 'Edit job / quote' : 'New job or quote'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <SelectField label="Customer" value={customerId} onChange={e => setCustomerId(e.target.value)} required>
          <option value="">Select a customer…</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </SelectField>
        <TextField label="Title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Q4 operations audit, growth strategy session" />
        <TextAreaField label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Scope of work…" />
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="Status" value={status} onChange={e => setStatus(e.target.value as Job['status'])}>
            <option value="quote">Quote</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In progress</option>
            <option value="done">Done</option>
          </SelectField>
          <TextField label="Amount ($)" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        </div>
        <TextField label="Scheduled date (optional)" type="date" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} saving={saving} label={job ? 'Save changes' : 'Add job'} />
      </form>
    </Modal>
  )
}
