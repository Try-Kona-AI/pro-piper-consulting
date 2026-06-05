import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Invoice, Customer } from '../lib/types'
import { money, shortDate, daysAgo } from '../lib/format'
import { Card, Badge, PageHeader, Loading, ErrorNote } from '../components/ui'

function Kpi({ label, value, sub, tone = 'default' }: { label: string; value: string; sub?: string; tone?: 'default' | 'red' | 'emerald' }) {
  const ring  = tone === 'red' ? 'ring-red-200 bg-red-50' : tone === 'emerald' ? 'ring-emerald-200 bg-emerald-50' : 'ring-slate-200 bg-white'
  const color = tone === 'red' ? 'text-red-700' : tone === 'emerald' ? 'text-emerald-700' : 'text-slate-900'
  return (
    <div className={`rounded-xl p-5 shadow-sm ring-1 ring-inset ${ring}`}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-semibold ${color}`}>{value}</div>
      {sub && <div className="mt-1 text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const { tenantId } = useAuth()
  const [invoices, setInvoices]   = useState<Invoice[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)

  useEffect(() => {
    if (!tenantId) return
    void (async () => {
      const [inv, cust] = await Promise.all([
        supabase.from('invoices').select('*, customer:customers(id,name,phone,email)').eq('tenant_id', tenantId),
        supabase.from('customers').select('*').eq('tenant_id', tenantId),
      ])
      if (inv.error)  setError(inv.error.message)
      else if (cust.error) setError(cust.error.message)
      else {
        setInvoices(inv.data as Invoice[])
        setCustomers(cust.data as Customer[])
      }
      setLoading(false)
    })()
  }, [tenantId])

  if (loading) return <Loading />
  if (error)   return <ErrorNote message={error} />

  const outstanding = invoices.filter(i => i.status === 'sent' || i.status === 'overdue')
  const overdue     = invoices.filter(i => i.status === 'overdue')
  const paid        = invoices.filter(i => i.status === 'paid')
  const recentPaid  = paid.filter(i => (daysAgo(i.paid_date) ?? 999) <= 30)

  const owed       = outstanding.reduce((s, i) => s + Number(i.amount), 0)
  const overdueAmt = overdue.reduce((s, i) => s + Number(i.amount), 0)
  const collected  = recentPaid.reduce((s, i) => s + Number(i.amount), 0)
  const avgDays    = paid.length > 0
    ? Math.round(paid.reduce((s, i) => s + ((daysAgo(i.sent_date) ?? 0) - (daysAgo(i.paid_date) ?? 0)), 0) / paid.length)
    : 0

  const winBack       = customers.filter(c => c.status === 'win_back')
  const dueForService = customers.filter(c => c.status === 'due_for_service')

  const outstandingSorted = [...outstanding].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'overdue' ? -1 : 1
    return (a.due_date ?? '').localeCompare(b.due_date ?? '')
  })

  const justCollected = [...recentPaid]
    .sort((a, b) => (b.paid_date ?? '').localeCompare(a.paid_date ?? ''))
    .slice(0, 4)

  return (
    <>
      <PageHeader title="Good morning, Mike" subtitle="Here's what's happening with your money today." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Money owed to you" value={money(owed)} sub={`${outstanding.length} open invoices`} />
        <Kpi label="Overdue" value={money(overdueAmt)} sub={`${overdue.length} need a nudge`} tone="red" />
        <Kpi label="Collected (last 30 days)" value={money(collected)} sub={`${recentPaid.length} payments`} tone="emerald" />
        <Kpi label="Avg days to get paid" value={`${avgDays} days`} sub="down from 34 before" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Nothing slips through the cracks</h2>
              <p className="text-xs text-slate-500">Outstanding invoices — auto-reminders run on their own.</p>
            </div>
            <Link to="/invoices" className="text-xs font-medium text-blue-600 hover:underline">View all</Link>
          </div>
          <div className="divide-y divide-slate-100">
            {outstandingSorted.length === 0
              ? <div className="px-5 py-8 text-center text-sm text-slate-400">All invoices are paid — nice work!</div>
              : outstandingSorted.map(inv => (
              <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <div className="text-sm font-medium text-slate-800">{inv.customer?.name}</div>
                  <div className="text-xs text-slate-400">{inv.number} · {inv.description}</div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-sm font-medium text-slate-800">{money(inv.amount)}</div>
                    <div className="text-xs text-slate-400">
                      {inv.status === 'overdue' ? `${daysAgo(inv.due_date)}d overdue` : `due ${shortDate(inv.due_date)}`}
                    </div>
                  </div>
                  <Badge status={inv.status} kind="invoice" />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <div className="border-b border-slate-200 px-5 py-4">
              <h2 className="text-sm font-semibold text-slate-800">Just collected</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {justCollected.length === 0
                ? <div className="px-5 py-6 text-center text-sm text-slate-400">No payments yet</div>
                : justCollected.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm text-slate-700">{inv.customer?.name}</div>
                    <div className="text-xs text-slate-400">paid {shortDate(inv.paid_date)}</div>
                  </div>
                  <div className="text-sm font-medium text-emerald-600">{money(inv.amount)}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-[#0c2340] to-[#15315a]">
            <div className="px-5 py-4">
              <h2 className="text-sm font-semibold text-white">Money on the table</h2>
              <p className="mt-1 text-xs text-slate-300">Past customers you haven't seen in a while.</p>
              <div className="mt-4 flex items-end gap-6">
                <div>
                  <div className="text-3xl font-semibold text-white">{winBack.length}</div>
                  <div className="text-xs text-slate-400">win-back leads</div>
                </div>
                <div>
                  <div className="text-3xl font-semibold text-white">{dueForService.length}</div>
                  <div className="text-xs text-slate-400">due for service</div>
                </div>
              </div>
              <Link to="/winback" className="mt-4 inline-block rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-[#0c2340] hover:bg-slate-100">
                Re-engage them →
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}
