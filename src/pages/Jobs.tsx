import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Job } from '../lib/types'
import { money, shortDate } from '../lib/format'
import { Card, Badge, Button, PageHeader, Loading, ErrorNote, EmptyState } from '../components/ui'
import JobModal from '../components/JobModal'
import { sendEmail } from '../lib/email'

const defaultDue = () => new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
const todayStr   = () => new Date().toISOString().slice(0, 10)

async function nextInvoiceNumber(tenantId: string): Promise<string> {
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

export default function Jobs() {
  const { tenantId } = useAuth()
  const [jobs, setJobs]       = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [modal, setModal]     = useState<'new' | Job | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const [advancing, setAdvancing] = useState<string | null>(null)
  const [quoteStatus, setQuoteStatus] = useState<Record<string, 'sending' | 'sent' | 'error'>>({})
  const [invoicedJobs, setInvoicedJobs] = useState<Set<string>>(new Set())

  async function load() {
    if (!tenantId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('jobs')
      .select('*, customer:customers(id,name)')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
    if (error) setError(error.message)
    else setJobs(data as Job[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [tenantId])

  async function sendQuote(j: Job) {
    setQuoteStatus(s => ({ ...s, [j.id]: 'sending' }))
    const result = await sendEmail({ type: 'quote', tenantId: tenantId!, jobId: j.id })
    if (result.ok) {
      setQuoteStatus(s => ({ ...s, [j.id]: 'sent' }))
    } else {
      setQuoteStatus(s => ({ ...s, [j.id]: 'error' }))
    }
    // Always advance to scheduled regardless of email outcome
    await supabase.from('jobs').update({ status: 'scheduled' }).eq('id', j.id)
    await load()
  }

  async function scheduleJob(j: Job) {
    setAdvancing(j.id)
    await supabase.from('jobs').update({ status: 'scheduled' }).eq('id', j.id)
    await load()
    setAdvancing(null)
  }

  async function completeJob(j: Job) {
    setAdvancing(j.id)
    try {
      const number = await nextInvoiceNumber(tenantId!)

      const { error: jobErr } = await supabase
        .from('jobs')
        .update({ status: 'done' })
        .eq('id', j.id)
      if (jobErr) throw new Error(`Job update failed: ${jobErr.message}`)

      const { data: invData, error: invErr } = await supabase
        .from('invoices')
        .insert({
          tenant_id:   tenantId,
          customer_id: j.customer_id,
          job_id:      j.id,
          number,
          description: j.description ? `${j.title} — ${j.description}` : j.title,
          amount:      Number(j.amount),
          status:      'draft',
          due_date:    defaultDue(),
          sent_date:   todayStr(),
        })
        .select()
      if (invErr) throw new Error(`Invoice creation failed: ${invErr.message}`)
      if (!invData?.length) throw new Error('Invoice insert returned no data — check Supabase logs')

      setInvoicedJobs(s => new Set(s).add(j.id))
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e))
    }
    setAdvancing(null)
  }

  async function deleteJob(j: Job) {
    if (!confirm(`Delete "${j.title}"?`)) return
    setDeleting(j.id)
    await supabase.from('jobs').delete().eq('id', j.id)
    await load()
    setDeleting(null)
  }

  if (loading) return <Loading />
  if (error)   return <ErrorNote message={error} />

  const openQuotes  = jobs.filter(j => j.status === 'quote')
  const quoteValue  = openQuotes.reduce((s, j) => s + Number(j.amount), 0)

  return (
    <>
      <PageHeader
        title="Jobs & Quotes"
        subtitle="Quotes out the door, work on the schedule."
        action={<Button onClick={() => setModal('new')}>+ New job</Button>}
      />

      {openQuotes.length > 0 && (
        <div className="mb-6 rounded-xl bg-white p-5 text-sm shadow-sm ring-1 ring-inset ring-slate-200">
          <span className="font-semibold text-slate-800">{money(quoteValue)}</span>
          <span className="text-slate-500"> in open quotes waiting on a yes ({openQuotes.length})</span>
        </div>
      )}

      {jobs.length === 0 ? (
        <Card><EmptyState message="No jobs or quotes yet." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {jobs.map((j) => (
            <Card key={j.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="pr-3">
                  <div className="font-medium text-slate-800">{j.title}</div>
                  <div className="text-xs text-slate-400">{j.customer?.name}</div>
                </div>
                <Badge status={j.status} kind="job" />
              </div>
              {j.description && <p className="mt-2 text-sm text-slate-600">{j.description}</p>}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <span className="text-lg font-semibold text-slate-800">{money(j.amount)}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {j.scheduled_date && (
                    <span className="text-xs text-slate-500">Scheduled {shortDate(j.scheduled_date)}</span>
                  )}
                  {j.status === 'quote' && (
                    quoteStatus[j.id] === 'sent'
                      ? <span className="text-xs font-medium text-emerald-600">Quote sent ✓</span>
                      : <>
                          <Button
                            size="sm" variant="secondary"
                            onClick={() => void sendQuote(j)}
                            disabled={quoteStatus[j.id] === 'sending'}
                          >
                            {quoteStatus[j.id] === 'sending' ? 'Sending…' : 'Send quote'}
                          </Button>
                          <Button
                            size="sm" variant="secondary"
                            onClick={() => void scheduleJob(j)}
                            disabled={advancing === j.id}
                          >
                            Mark scheduled
                          </Button>
                        </>
                  )}
                  {(j.status === 'scheduled' || j.status === 'in_progress') && (
                    <Button
                      size="sm"
                      onClick={() => void completeJob(j)}
                      disabled={advancing === j.id}
                    >
                      {advancing === j.id ? 'Creating…' : 'Mark complete → Invoice'}
                    </Button>
                  )}
                  {j.status === 'done' && (
                    invoicedJobs.has(j.id)
                      ? <span className="text-xs font-medium text-emerald-600">Invoice drafted ✓</span>
                      : <span className="text-xs text-slate-400">Complete</span>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => setModal(j)}>Edit</Button>
                  <button
                    onClick={() => void deleteJob(j)}
                    disabled={deleting === j.id}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6.5 1.75a.25.25 0 0 1 .25-.25h2.5a.25.25 0 0 1 .25.25V3h-3V1.75zm4.5 0V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75zM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15z"/></svg>
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modal === 'new'  && <JobModal onClose={() => setModal(null)} onSaved={load} />}
      {modal && modal !== 'new' && <JobModal job={modal as Job} onClose={() => setModal(null)} onSaved={load} />}
    </>
  )
}
