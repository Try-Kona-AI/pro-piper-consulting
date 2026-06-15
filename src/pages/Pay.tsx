import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const SUPABASE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + '/functions/v1'

interface InvoiceData {
  id: string
  number: string
  description: string | null
  amount: number
  status: string
  tenant_id: string
  customer: {
    name: string
  } | null
  tenant?: {
    name: string
  } | null
}

function money(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export default function Pay() {
  const { invoiceId } = useParams<{ invoiceId: string }>()
  const [invoice, setInvoice] = useState<InvoiceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)

  useEffect(() => {
    if (!invoiceId) return
    void (async () => {
      const { data, error: err } = await supabase
        .from('invoices')
        .select('id, number, description, amount, status, tenant_id, customer:customers(name)')
        .eq('id', invoiceId)
        .maybeSingle()

      if (err || !data) {
        setError(err?.message ?? 'Invoice not found.')
      } else {
        // Supabase returns joined tables as arrays; normalize to single object
        const raw = data as Record<string, unknown>
        const customerRaw = raw.customer
        const customer = Array.isArray(customerRaw)
          ? (customerRaw[0] as { name: string } | undefined) ?? null
          : (customerRaw as { name: string } | null)
        setInvoice({ ...(raw as Omit<InvoiceData, 'customer'>), customer })
      }
      setLoading(false)
    })()
  }, [invoiceId])

  async function handlePayByCard() {
    if (!invoice || !invoiceId) return
    setPaying(true)
    setPayError(null)

    try {
      const resp = await fetch(`${SUPABASE_FUNCTIONS_URL}/stripe-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, tenantId: invoice.tenant_id }),
      })
      const result = await resp.json()
      if (result.ok && result.url) {
        window.location.href = result.url
      } else {
        setPayError(result.error ?? 'Unable to start checkout. Please try again.')
        setPaying(false)
      }
    } catch (e) {
      setPayError(e instanceof Error ? e.message : 'Network error. Please try again.')
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-sm text-slate-400">Loading invoice…</p>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-xl border border-red-200 bg-white p-8 shadow-sm text-center">
          <p className="text-slate-900 font-semibold text-lg mb-2">Invoice not found</p>
          <p className="text-sm text-slate-500">{error ?? 'This invoice link may be invalid or expired.'}</p>
        </div>
      </div>
    )
  }

  const alreadyPaid = invoice.status === 'paid'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="bg-[#0c2340] rounded-t-xl px-8 py-5">
          <p className="text-white font-semibold text-base">Secure Invoice Payment</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl shadow-sm px-8 py-8 space-y-6">
          {/* Invoice details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Invoice</span>
              <span className="text-sm text-slate-700 font-medium">{invoice.number}</span>
            </div>
            {invoice.customer?.name && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Billed to</span>
                <span className="text-sm text-slate-700 font-medium">{invoice.customer.name}</span>
              </div>
            )}
            {invoice.description && (
              <div className="flex items-center justify-between py-3 border-b border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Description</span>
                <span className="text-sm text-slate-700 font-medium text-right max-w-[220px]">{invoice.description}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-3 bg-slate-50 rounded-lg px-4">
              <span className="text-sm font-semibold text-slate-700">Amount due</span>
              <span className="text-2xl font-bold text-[#0c2340]">{money(invoice.amount)}</span>
            </div>
          </div>

          {/* Pay button or paid state */}
          {alreadyPaid ? (
            <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-4 text-center">
              <p className="text-emerald-700 font-semibold">This invoice has already been paid.</p>
              <p className="text-sm text-emerald-600 mt-1">Thank you!</p>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => void handlePayByCard()}
                disabled={paying}
                className="w-full bg-[#0c2340] hover:bg-[#15315a] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base py-4 px-6 rounded-lg transition-colors"
              >
                {paying ? 'Redirecting to checkout…' : `Pay ${money(invoice.amount)} by Card`}
              </button>

              {payError && (
                <p className="text-sm text-red-600 text-center">{payError}</p>
              )}

              <p className="text-xs text-slate-400 text-center">
                Secure payment powered by Stripe. Your card info is never stored by us.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
