import { Card, PageHeader } from '../components/ui'

interface Section {
  number: number
  title: string
  icon: string
  steps: string[]
  tip?: string
}

const sections: Section[] = [
  {
    number: 1,
    title: 'Add a new customer',
    icon: '👤',
    steps: [
      'Click "Customers" in the left sidebar.',
      'Hit the "+ New customer" button in the top-right.',
      'Fill in the name, phone, and email — address and notes are optional.',
      'Set the status to "Active" and click Save.',
    ],
    tip: 'You only need to add each customer once. After that, you just pick their name when creating invoices or jobs.',
  },
  {
    number: 2,
    title: 'Log a job or quote',
    icon: '🔧',
    steps: [
      'Click "Jobs & Quotes" in the sidebar.',
      'Hit "+ New job".',
      'Select the customer, add a title (e.g. "Kitchen faucet repair"), set a price and a date.',
      'Start it as "Quote" — change to "Scheduled" when the job is confirmed, then "In Progress" when you\'re on site, and "Done" when finished.',
    ],
    tip: 'Keeping jobs updated lets you see at a glance exactly what\'s on your plate this week.',
  },
  {
    number: 3,
    title: 'Send an invoice',
    icon: '📄',
    steps: [
      'Click "Invoices" in the sidebar.',
      'Hit "+ New invoice".',
      'Pick the customer, write a short description (e.g. "Replaced shut-off valve under kitchen sink"), enter the amount, and choose a due date.',
      'Hit Save — the invoice is created instantly.',
    ],
    tip: 'Invoice numbers are assigned automatically so you never have to worry about keeping track.',
  },
  {
    number: 4,
    title: 'Track who owes you',
    icon: '💰',
    steps: [
      'The Dashboard shows your total outstanding at a glance.',
      'In "Invoices", overdue invoices are highlighted in red so you can spot them fast.',
      'When a customer pays, click "Edit" on the invoice and change the status to "Paid". The balance on your Dashboard drops automatically.',
    ],
  },
  {
    number: 5,
    title: 'Mark an invoice paid',
    icon: '✅',
    steps: [
      'Go to "Invoices".',
      'Find the invoice and click the pencil (edit) icon on the right.',
      'Change the Status dropdown from "Sent" or "Overdue" to "Paid".',
      'Click Save. Done — it disappears from your outstanding total.',
    ],
    tip: 'Customers pay via Zelle, ACH, wire, or check. Your payment instructions are set under Settings and get included in every reminder email.',
  },
  {
    number: 6,
    title: 'Win back old customers',
    icon: '🔄',
    steps: [
      'Click "Win-back" in the sidebar.',
      'You\'ll see every customer who hasn\'t had service in a while — the ones most likely to book again.',
      'A ready-to-send text message is pre-written for each one.',
      'Copy the message, text it from your phone, then click "Send re-engagement" to mark them as active.',
    ],
    tip: 'These are your easiest jobs — they already trust you. Reaching out once a year is usually enough to keep them coming back.',
  },
  {
    number: 7,
    title: 'Update your payment instructions',
    icon: '⚙️',
    steps: [
      'Click "Settings" in the sidebar.',
      'Enter your Zelle contact, bank routing/account for ACH, and your mailing address for check payments.',
      'Hit "Save settings".',
      'The preview on the right shows exactly what customers see at the bottom of their invoice reminder emails.',
    ],
  },
]

export default function Guide() {
  return (
    <>
      <PageHeader
        title="How to use Pro Piper"
        subtitle="A simple guide — no tech knowledge needed."
      />

      <div className="space-y-5">
        {sections.map(s => (
          <Card key={s.number} className="p-6">
            <div className="flex items-start gap-4">
              {/* Number + icon */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c2340] text-lg">
                {s.icon}
              </div>

              <div className="flex-1">
                <h2 className="mb-3 text-base font-semibold text-slate-900">
                  <span className="mr-2 text-slate-400">Step {s.number}.</span>
                  {s.title}
                </h2>

                <ol className="space-y-1.5">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[11px] font-semibold text-slate-500">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>

                {s.tip && (
                  <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                    <span className="font-medium">Tip: </span>{s.tip}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* Footer card */}
        <Card className="p-6 bg-[#0c2340]">
          <p className="text-sm font-medium text-white">Need help?</p>
          <p className="mt-1 text-sm text-slate-300">
            Email your Karna advisor at{' '}
            <a href="mailto:team@cymbul.co" className="text-blue-300 underline underline-offset-2">
              team@cymbul.co
            </a>{' '}
            and we'll get back to you within one business day.
          </p>
        </Card>
      </div>
    </>
  )
}
