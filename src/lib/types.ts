export type CustomerStatus = 'active' | 'due_for_service' | 'win_back'
export type InvoiceStatus = 'sent' | 'overdue' | 'paid'
export type JobStatus = 'quote' | 'scheduled' | 'in_progress' | 'done'

export interface Customer {
  id: string
  name: string
  contact_name: string | null
  phone: string | null
  email: string | null
  address: string | null
  status: CustomerStatus
  last_service_date: string | null
  notes: string | null
  created_at: string
}

export interface Invoice {
  id: string
  customer_id: string
  job_id: string | null
  number: string
  description: string | null
  amount: number
  status: InvoiceStatus
  sent_date: string
  due_date: string | null
  paid_date: string | null
  last_reminder_date: string | null
  reminder_count: number
  auto_reminder: boolean
  created_at: string
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'email'>
}

export interface Job {
  id: string
  customer_id: string
  title: string
  description: string | null
  status: JobStatus
  amount: number
  scheduled_date: string | null
  created_at: string
  customer?: Pick<Customer, 'id' | 'name'>
}
