import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Customer } from '../lib/types'
import { shortDate } from '../lib/format'
import { Card, Badge, Button, PageHeader, Loading, ErrorNote, EmptyState } from '../components/ui'

const today = () => new Date().toISOString().slice(0, 10)

function draftMessage(c: Customer): string {
  const first = (c.contact_name ?? c.name).split(' ')[0]
  return c.status === 'win_back'
    ? `Hi ${first}, it's Mike at Pro Piper Plumbing. It's been a while — want me to swing by for a quick check-up before anything turns into an emergency? Reply and I'll find a slot.`
    : `Hi ${first}, Mike at Pro Piper here. You're about due for your routine service. Want me to get you on the schedule this month?`
}

export default function Winback() {
  const { tenantId } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [sent, setSent]           = useState<Record<string, boolean>>({})
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
    await supabase.from('customers').update({ status: 'active', last_service_date: today() }).eq('id', c.id)
    setSent(s => ({ ...s, [c.id]: true }))
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
                </div>
                <Badge status={c.status} kind="customer" />
              </div>
              <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 ring-1 ring-inset ring-slate-200">
                {draftMessage(c)}
              </div>
              <div className="mt-3 flex justify-end">
                {sent[c.id]
                  ? <span className="text-sm font-medium text-emerald-600">Re-engagement sent ✓</span>
                  : <Button size="sm" onClick={() => void reengage(c)} disabled={busy === c.id}>Send re-engagement</Button>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
