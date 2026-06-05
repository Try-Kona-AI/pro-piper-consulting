import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import type { Customer } from '../lib/types'
import { shortDate } from '../lib/format'
import { Card, Badge, Button, PageHeader, Loading, ErrorNote, EmptyState } from '../components/ui'
import CustomerModal from '../components/CustomerModal'

export default function Customers() {
  const { tenantId } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [modal, setModal]         = useState<'new' | Customer | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)

  async function load() {
    if (!tenantId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('last_service_date', { ascending: false, nullsFirst: false })
    if (error) setError(error.message)
    else setCustomers(data as Customer[])
    setLoading(false)
  }

  useEffect(() => { void load() }, [tenantId])

  async function deleteCustomer(c: Customer) {
    if (!confirm(`Delete ${c.name}? All their invoices and jobs will also be deleted.`)) return
    setDeleting(c.id)
    await supabase.from('customers').delete().eq('id', c.id)
    await load()
    setDeleting(null)
  }

  if (loading) return <Loading />
  if (error)   return <ErrorNote message={error} />

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Your whole book of business."
        action={<Button onClick={() => setModal('new')}>+ New customer</Button>}
      />
      <Card>
        {customers.length === 0 ? (
          <EmptyState message="No customers yet — add your first one." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-5 py-3 font-medium">Contact</th>
                <th className="px-5 py-3 font-medium">Last service</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <div className="font-medium text-slate-800">{c.name}</div>
                    <div className="text-xs text-slate-400">{c.address}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    <div>{c.contact_name}</div>
                    <div className="text-xs text-slate-400">{c.phone}</div>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{shortDate(c.last_service_date)}</td>
                  <td className="px-5 py-3"><Badge status={c.status} kind="customer" /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1.5">
                      <Button size="sm" variant="secondary" onClick={() => setModal(c)}>Edit</Button>
                      <button
                        onClick={() => void deleteCustomer(c)}
                        disabled={deleting === c.id}
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
        )}
      </Card>

      {modal === 'new'  && <CustomerModal onClose={() => setModal(null)} onSaved={load} />}
      {modal && modal !== 'new' && <CustomerModal customer={modal as Customer} onClose={() => setModal(null)} onSaved={load} />}
    </>
  )
}
