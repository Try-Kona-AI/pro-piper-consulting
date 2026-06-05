import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Invoice } from '../lib/types'
import { money, shortDate } from '../lib/format'
import { Card, Badge, Button, PageHeader, Loading, ErrorNote, EmptyState } from '../components/ui'
import InvoiceModal from '../components/InvoiceModal'
import { sendEmail } from '../lib/email'

const today = () => new Date().toISOString().slice(0, 10)

export default function Invoices() {
  const { tenantId } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [busy, setBusy]         = useState<string | null>(null)
  const [modal, setModal]       = useState<'new' | Invoice | null>(null)
  const [emailStatus, setEmailStatus] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})

  async function load() {
    if (!tenantId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select('*, customer:customers(id,name,phone,email)')
      .eq('tenant_id', tenantId)
      .order('sent_date', { ascending: false })
    if (error) setError(error.message)
    else setInvoices(data as Invoice[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [tenantId])

  async function markPaid(inv: Invoice) {
    setBusy(inv.id)
    await supabase.from('invoices').update({ status: 'paid', paid_date: today() }).eq('id', inv.id)
    await load()
    setBusy(null)
  }

  async function sendReminder(inv: Invoice) {
    setBusy(inv.id)
    setEmailStatus(s => ({ ...s, [inv.id]: 'sending' }))
    const result = await sendEmail({ type: 'invoice_reminder', tenantId: tenantId!, invoiceId: inv.id })
    if (result.ok) {
      setEmailStatus(s => ({ ...s, [inv.id]: 'sent' }))
    } else {
      setEmailStatus(s => ({ ...s, [inv.id]: 'error' }))
      alert(`Email failed: ${result.error}`)
    }
    await load()
    setBusy(null)
  }

  async function sendReceipt(inv: Invoice) {
    setBusy(inv.id + '_receipt')
    const result = await sendEmail({ type: 'invoice_receipt', tenantId: tenantId!, invoiceId: inv.id })
    if (!result.ok) alert(`Email failed: ${result.error}`)
    setBusy(null)
  }

  async function deleteInvoice(inv: Invoice) {
    if (!confirm(`Delete invoice ${inv.number}? This cannot be undone.`)) return
    setBusy(inv.id)
    await supabase.from('invoices').delete().eq('id', inv.id)
    await load()
    setBusy(null)
  }

  if (loading) return <Loading />
  if (error)   return <ErrorNote message={error} />

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Every job you've billed — and exactly who still owes you."
        action={<Button onClick={() => setModal('new')}>+ New invoice</Button>}
      />

      <Card>
        {invoices.length === 0 ? (
          <EmptyState message="No invoices yet — create your first one." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="hidden px-4 py-3 font-medium sm:table-cell">Sent</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="hidden px-4 py-3 font-medium lg:table-cell">Reminders</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{inv.number}</div>
                      <div className="text-xs text-slate-400">{inv.description}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{inv.customer?.name}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{money(inv.amount)}</td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell">{shortDate(inv.sent_date)}</td>
                    <td className="px-4 py-3"><Badge status={inv.status} kind="invoice" /></td>
                    <td className="hidden px-4 py-3 text-xs text-slate-500 lg:table-cell">
                      {inv.status === 'paid'
                        ? <span className="text-emerald-600">Paid {shortDate(inv.paid_date)}</span>
                        : inv.reminder_count > 0
                          ? <span>{inv.reminder_count} sent · last {shortDate(inv.last_reminder_date)}</span>
                          : <span className="text-slate-400">None yet</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        {inv.status !== 'paid' && (
                          <>
                            <Button
                              size="sm" variant="secondary"
                              onClick={() => void sendReminder(inv)}
                              disabled={busy === inv.id || emailStatus[inv.id] === 'sending'}
                            >
                              {emailStatus[inv.id] === 'sending' ? 'Sending…' : emailStatus[inv.id] === 'sent' ? '✓ Sent' : 'Remind'}
                            </Button>
                            <Button size="sm" onClick={() => void markPaid(inv)} disabled={busy === inv.id}>Paid ✓</Button>
                          </>
                        )}
                        {inv.status === 'paid' && (
                          <Button size="sm" variant="secondary" onClick={() => void sendReceipt(inv)} disabled={busy === inv.id + '_receipt'}>Receipt</Button>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => setModal(inv)}>Edit</Button>
                        <button
                          onClick={() => void deleteInvoice(inv)}
                          disabled={busy === inv.id}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                        >
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15z"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {modal === 'new' && <InvoiceModal onClose={() => setModal(null)} onSaved={load} />}
      {modal && modal !== 'new' && <InvoiceModal invoice={modal as Invoice} onClose={() => setModal(null)} onSaved={load} />}
    </>
  )
}
