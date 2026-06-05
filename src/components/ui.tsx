import type { ReactNode } from 'react'
import type { InvoiceStatus, CustomerStatus, JobStatus } from '../lib/types'

// ---- Modal ----------------------------------------------------------------
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---- Form fields ----------------------------------------------------------
export function TextField({
  label, ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        {...props}
      />
    </div>
  )
}

export function SelectField({
  label, children, ...props
}: { label: string; children: ReactNode } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <select
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

export function TextAreaField({
  label, ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <textarea
        rows={3}
        className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        {...props}
      />
    </div>
  )
}

// ---- Form submit row ------------------------------------------------------
export function FormActions({ onCancel, saving, label = 'Save' }: { onCancel: () => void; saving: boolean; label?: string }) {
  return (
    <div className="mt-6 flex justify-end gap-3">
      <Button variant="secondary" onClick={onCancel} disabled={saving}>Cancel</Button>
      <Button type="submit" disabled={saving}>{saving ? 'Saving…' : label}</Button>
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md'
  type?: 'button' | 'submit'
  disabled?: boolean
}) {
  const base =
    'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const sizes = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-4 py-2 text-sm'
  const variants =
    variant === 'primary'
      ? 'bg-[#0c2340] text-white hover:bg-[#15315a]'
      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${variants}`}>
      {children}
    </button>
  )
}

const invoiceColors: Record<InvoiceStatus, string> = {
  draft: 'bg-slate-100 text-slate-500 ring-slate-200',
  sent: 'bg-blue-50 text-blue-700 ring-blue-200',
  overdue: 'bg-red-50 text-red-700 ring-red-200',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const customerColors: Record<CustomerStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  due_for_service: 'bg-amber-50 text-amber-700 ring-amber-200',
  win_back: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const jobColors: Record<JobStatus, string> = {
  quote: 'bg-blue-50 text-blue-700 ring-blue-200',
  scheduled: 'bg-amber-50 text-amber-700 ring-amber-200',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  done: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const labels: Record<string, string> = {
  draft: 'Draft',
  sent: 'Sent',
  overdue: 'Overdue',
  paid: 'Paid',
  active: 'Active',
  due_for_service: 'Due for service',
  win_back: 'Win-back',
  quote: 'Quote',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  done: 'Done',
}

export function Badge({ status, kind }: { status: string; kind: 'invoice' | 'customer' | 'job' }) {
  const map = kind === 'invoice' ? invoiceColors : kind === 'customer' ? customerColors : jobColors
  const cls = (map as Record<string, string>)[status] ?? 'bg-slate-100 text-slate-600 ring-slate-200'
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls}`}>
      {labels[status] ?? status}
    </span>
  )
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex items-start justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Loading() {
  return <div className="p-10 text-center text-sm text-slate-400">Loading…</div>
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <div className="p-10 text-center text-sm text-slate-400">{message}</div>
}
