import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Customer } from '../lib/types'
import { Modal, TextField, SelectField, TextAreaField, FormActions } from './ui'

interface Props {
  onClose: () => void
  onSaved: () => void
  customer?: Customer
}

export default function CustomerModal({ onClose, onSaved, customer }: Props) {
  const { tenantId } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const [name, setName]               = useState(customer?.name ?? '')
  const [contactName, setContactName] = useState(customer?.contact_name ?? '')
  const [phone, setPhone]             = useState(customer?.phone ?? '')
  const [email, setEmail]             = useState(customer?.email ?? '')
  const [address, setAddress]         = useState(customer?.address ?? '')
  const [status, setStatus]           = useState<Customer['status']>(customer?.status ?? 'active')
  const [lastServiceDate, setLastServiceDate] = useState(customer?.last_service_date ?? '')
  const [notes, setNotes]             = useState(customer?.notes ?? '')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    setError(null)

    const payload = { name, contact_name: contactName, phone, email, address, status, last_service_date: lastServiceDate || null, notes, tenant_id: tenantId }

    let err
    if (customer) {
      ;({ error: err } = await supabase.from('customers').update(payload).eq('id', customer.id))
    } else {
      ;({ error: err } = await supabase.from('customers').insert(payload))
    }

    if (err) setError(err.message)
    else { onSaved(); onClose() }
    setSaving(false)
  }

  return (
    <Modal title={customer ? 'Edit customer' : 'New customer'} onClose={onClose}>
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <TextField label="Business / customer name" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Marcado Property Group" />
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Contact name" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="Lisa Marcado" />
          <TextField label="Phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="212-555-0100" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="lisa@example.com" />
          <SelectField label="Status" value={status} onChange={e => setStatus(e.target.value as Customer['status'])}>
            <option value="active">Active</option>
            <option value="due_for_service">Due for service</option>
            <option value="win_back">Win-back</option>
          </SelectField>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <TextField label="Address" value={address} onChange={e => setAddress(e.target.value)} placeholder="100 Church St, New York, NY 10007" />
          <TextField label="Last service date" type="date" value={lastServiceDate} onChange={e => setLastServiceDate(e.target.value)} />
        </div>
        <TextAreaField label="Notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context about this customer…" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <FormActions onCancel={onClose} saving={saving} label={customer ? 'Save changes' : 'Add customer'} />
      </form>
    </Modal>
  )
}
