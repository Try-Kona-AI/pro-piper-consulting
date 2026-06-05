import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Customer } from '../lib/types'
import { shortDate } from '../lib/format'
import { Card, Badge, Button, PageHeader, Loading, ErrorNote, EmptyState } from '../components/ui'
import { sendEmail } from '../lib/email'

const today = () => new Date().toISOString().slice(0, 10)

function draftMessage(c: Customer): string {
  const first = (c.contact_name ?? c.name).split(' ')[0]
  return c.status === 'win_back'
    ? `Hi ${first}, it's Mark at Pro Piper Consulting. I wanted to reach out — it's been a while since we last connected and I'd love to catch up on how things are going with your business. I have some availability coming up and thought this could be a good time to reconnect. Let me know if you'd like to find 20–30 minutes — happy to work around your schedule.`
    : `Hi ${first}, Mark at Pro Piper Consulting here. I wanted to touch base — based on our last engagement, now is a good time for a check-in to make sure everything is running smoothly and discuss what the next few months look like for your business. Would you be open to a quick call this month? Just reply and we'll find a time that works.`
}

export default function Winback() {
  const { tenantId } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [status, setStatus]       = useState<Record<string, 'sending' | 'sent' | 'error'>>({})
  const [busy, setBusy]           = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    void (async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('status', ['win_back', 'due_for_service'])
        .order('last_service_date', { ascending: true })
      if (error) setError(error.message)
      else setCustomers(data as Customer[])
      setLoading(false)
    })()
  }, [tenantId])

  async function reengage(c: Customer) {
    setBusy(c.id)
    setStatus(s => ({ ...s, [c.id]: 'sending' }))

    const result = await sendEmail({ type: 'win_back', tenantId: tenantId!, customerId: c.id })

    if (result.ok) {
      // Mark as active in DB
      await supabase.from('customers').update({ status: 'active', last_service_date: today() }).eq('id', c.id)
      setStatus(s => ({ ...s, [c.id]: 'sent' }))
    } else {
      setStatus(s => ({ ...s, [c.id]: 'error' }))
      alert(`Email failed: ${result.error}`)
    }
    setBusy(null)
  }

  if (loading) return <Loading />
  if (error)   return <ErrorNote message={error} />

  return (
    <>
      <PageHeader title="Win-back" subtitle="The easiest money you'll make: customers who already trust you." />
      {customers.length === 0 ? (
        <Card><EmptyState message="Everyone's current. Nice work." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {customers.map(c => (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-slate-800">{c.name}</div>
                  <div className="text-xs text-slate-400">Last service {shortDate(c.last_service_date)}</div>
                  {!c.email && (
                    <div className="mt-1 text-xs text-amber-600">⚠ No email — add one in Customers to send</div>
                  )}
                </div>
                <Badge status={c.status} kind="customer" />
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
                {draftMessage(c)}
              </div>
              <div className="mt-3 flex items-center justify-end gap-3">
                {status[c.id] === 'sent' ? (
                  <span className="text-sm font-medium text-emerald-600">Email sent ✓</span>
                ) : status[c.id] === 'error' ? (
                  <span className="text-sm text-red-600">Failed — check email address</span>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => void reengage(c)}
                    disabled={busy === c.id || !c.email}
                  >
                    {busy === c.id ? 'Sending…' : 'Send re-engagement'}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
