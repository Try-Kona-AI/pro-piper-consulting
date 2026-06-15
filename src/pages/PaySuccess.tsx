import { useSearchParams } from 'react-router-dom'

export default function PaySuccess() {
  const [params] = useSearchParams()
  const invoiceId = params.get('invoice')

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="bg-[#0c2340] rounded-t-xl px-8 py-5">
          <p className="text-white font-semibold text-base">Payment Confirmed</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl shadow-sm px-8 py-10 text-center space-y-4">
          {/* Checkmark */}
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">Payment received!</h1>
            <p className="mt-2 text-sm text-slate-500">
              Thank you — your payment has been processed successfully.
            </p>
          </div>

          {invoiceId && (
            <p className="text-xs text-slate-400 font-mono bg-slate-50 rounded px-3 py-1.5 inline-block">
              Ref: {invoiceId}
            </p>
          )}

          <p className="text-sm text-slate-500">
            You'll receive a confirmation from your payment provider shortly. You can safely close this page.
          </p>
        </div>
      </div>
    </div>
  )
}
