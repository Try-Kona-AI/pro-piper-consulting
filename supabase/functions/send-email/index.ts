import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("APP_URL") ?? "https://propiper-app.vercel.app";
const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function shortDate(s: string | null) {
  if (!s) return "—";
  return new Date(s + "T12:00:00Z").toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function wrap(content: string, businessName: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
        <tr><td style="background:#0c2340;border-radius:12px 12px 0 0;padding:22px 32px;">
          <span style="color:#fff;font-size:15px;font-weight:600;letter-spacing:-0.01em;">${businessName}</span>
        </td></tr>
        <tr><td style="background:#ffffff;padding:36px 32px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
          ${content}
        </td></tr>
        <tr><td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:18px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94a3b8;">Sent by ${businessName}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function paymentBlock(s: Record<string, string> | null, invoiceId?: string) {
  const stripeButton = s?.stripe_secret_key && invoiceId
    ? `<div style="text-align:center;margin-bottom:24px;">
  <a href="${APP_URL}/pay/${invoiceId}" style="display:inline-block;background:#0c2340;color:#ffffff;font-size:15px;font-weight:600;padding:14px 32px;border-radius:8px;text-decoration:none;">Pay by Card →</a>
  <p style="margin:8px 0 0;font-size:12px;color:#94a3b8;">Secure payment powered by Stripe</p>
</div>`
    : "";

  const rows: string[] = [];
  if (s?.zelle_contact) rows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:13px;color:#64748b;display:block;margin-bottom:2px;">Zelle</span><span style="font-size:14px;color:#1e293b;font-weight:500;">${s.zelle_contact}</span></td></tr>`);
  if (s?.bank_name && s?.bank_routing && s?.bank_account) rows.push(`<tr><td style="padding:10px 0;border-bottom:1px solid #f1f5f9;"><span style="font-size:13px;color:#64748b;display:block;margin-bottom:2px;">ACH / Wire — ${s.bank_name}</span><span style="font-size:14px;color:#1e293b;font-weight:500;">Routing: ${s.bank_routing} &nbsp;&middot;&nbsp; Account: ${s.bank_account}</span></td></tr>`);
  if (s?.mailing_name && s?.mailing_address) rows.push(`<tr><td style="padding:10px 0;"><span style="font-size:13px;color:#64748b;display:block;margin-bottom:2px;">Check by mail — payable to ${s.mailing_name}</span><span style="font-size:14px;color:#1e293b;font-weight:500;">${s.mailing_address.replace(/\n/g, " &middot; ")}</span></td></tr>`);

  if (!stripeButton && !rows.length) return "";

  const howToPayBlock = rows.length
    ? `<div style="margin-top:28px;padding:20px 24px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;">
    <p style="margin:0 0 14px;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.08em;">How to Pay</p>
    <table width="100%" cellpadding="0" cellspacing="0">${rows.join("")}</table>
    ${s?.contact_phone ? `<p style="margin:12px 0 0;font-size:13px;color:#94a3b8;">Questions? Call or text ${s.contact_phone}</p>` : ""}
  </div>`
    : "";

  return `${stripeButton}${howToPayBlock}`;
}

function invoiceBox(inv: Record<string, unknown>, isOverdue = false) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${isOverdue ? "#fca5a5" : "#e2e8f0"};border-radius:10px;">
    <tr><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;"><span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Invoice</span><span style="float:right;font-size:13px;color:#475569;">${inv.number}</span></td></tr>
    <tr><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;"><span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Description</span><span style="float:right;font-size:13px;color:#475569;">${(inv.description as string) ?? "Services rendered"}</span></td></tr>
    ${inv.due_date ? `<tr><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;"><span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Due date</span><span style="float:right;font-size:13px;color:${isOverdue ? "#dc2626" : "#475569"};">${shortDate(inv.due_date as string)}</span></td></tr>` : ""}
    <tr><td style="padding:16px 20px;background:#f8fafc;border-radius:0 0 10px 10px;"><span style="font-size:14px;font-weight:600;color:#0f172a;">Amount due</span><span style="float:right;font-size:20px;font-weight:700;color:${isOverdue ? "#dc2626" : "#0f172a"};">${money(inv.amount as number)}</span></td></tr>
  </table>`;
}

// ── 1. Invoice Reminder ───────────────────────────────────────────────────────
function invoiceReminderTemplate(
  inv: Record<string, unknown>,
  customer: Record<string, unknown>,
  settings: Record<string, string> | null,
  businessName: string,
) {
  const isOverdue = inv.status === "overdue";
  const raw = (customer.name as string) ?? "there";
  const first = raw.split(" ")[0];
  const firstName = first.endsWith(".") ? raw : first;
  return {
    subject: `${isOverdue ? "⚠️ Overdue" : "Reminder"}: Invoice ${inv.number} from ${businessName} – ${money(inv.amount as number)}`,
    html: wrap(`
      <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${isOverdue ? "Invoice overdue" : "Invoice reminder"}</p>
      <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;">Invoice ${inv.number}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Hi ${firstName},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.7;">
        ${isOverdue
          ? `Just a friendly heads-up that invoice <strong>${inv.number}</strong> for <strong>${money(inv.amount as number)}</strong> is now past due. If payment is already on its way, thank you — feel free to ignore this. Otherwise, we'd appreciate you taking care of it when you get a chance.`
          : `This is a friendly reminder that invoice <strong>${inv.number}</strong> for <strong>${money(inv.amount as number)}</strong> is due on <strong>${shortDate(inv.due_date as string)}</strong>.`}
      </p>
      ${invoiceBox(inv, isOverdue)}
      ${paymentBlock(settings, inv.id as string)}
      <p style="margin:24px 0 0;font-size:14px;color:#94a3b8;line-height:1.7;">Thank you for your business.<br><strong style="color:#475569;">${businessName}</strong></p>
    `, businessName),
  };
}

// ── 2. Invoice Receipt ────────────────────────────────────────────────────────
function invoiceReceiptTemplate(
  inv: Record<string, unknown>,
  customer: Record<string, unknown>,
  settings: Record<string, string> | null,
  businessName: string,
) {
  const raw = (customer.name as string) ?? "there";
  const first = raw.split(" ")[0];
  const firstName = first.endsWith(".") ? raw : first;
  return {
    subject: `Your invoice from ${businessName} – ${money(inv.amount as number)}`,
    html: wrap(`
      <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">Here's your invoice</p>
      <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;">Invoice ${inv.number} &middot; Sent ${shortDate(inv.sent_date as string)}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Hi ${firstName},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.7;">
        Thanks for choosing ${businessName}. Please find your invoice below. Reach out anytime if you have questions about the work.
      </p>
      ${invoiceBox(inv)}
      ${paymentBlock(settings, inv.id as string)}
      <p style="margin:24px 0 0;font-size:14px;color:#94a3b8;line-height:1.7;">We look forward to working with you again.<br><strong style="color:#475569;">${businessName}</strong></p>
    `, businessName),
  };
}

// ── 3. Win-back / Re-engagement ───────────────────────────────────────────────
function winBackTemplate(
  customer: Record<string, unknown>,
  settings: Record<string, string> | null,
  businessName: string,
) {
  const raw = (customer.name as string) ?? "there";
  const first = raw.split(" ")[0];
  const firstName = first.endsWith(".") ? raw : first;
  const isWinBack = customer.status === "win_back";
  return {
    subject: isWinBack
      ? `Checking in, ${firstName} — time to reconnect`
      : `Time for your next session, ${firstName}`,
    html: wrap(`
      <p style="margin:0 0 28px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">${isWinBack ? "Let's reconnect" : "Time for a check-in"}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Hi ${firstName},</p>
      <p style="margin:0 0 18px;font-size:15px;color:#334155;line-height:1.7;">
        ${isWinBack
          ? `It's been a while since we last worked together, and I wanted to reach out personally. A lot can change in a business over several months — and sometimes a fresh set of eyes is exactly what's needed to make sure operations are running at full capacity.`
          : `Based on our last engagement, now is a good time to reconnect — make sure everything is on track and plan ahead for what's coming next.`}
      </p>
      <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.7;">
        Reply to this email${settings?.contact_phone ? ` or call/text <strong>${settings.contact_phone}</strong>` : ""} and we'll find a time that works for you.
      </p>
      <div style="padding:20px 24px;background:#f0f9ff;border-radius:10px;border:1px solid #bae6fd;">
        <p style="margin:0;font-size:14px;color:#0369a1;line-height:1.7;">
          <strong>Why now?</strong> Proactive check-ins help you stay ahead of operational gaps, optimize for growth, and avoid issues that are far costlier to fix down the road.
        </p>
      </div>
      <p style="margin:24px 0 0;font-size:14px;color:#94a3b8;line-height:1.7;">Looking forward to connecting,<br><strong style="color:#475569;">${businessName}</strong></p>
    `, businessName),
  };
}

// ── 4. Quote / Proposal ───────────────────────────────────────────────────────
function quoteTemplate(
  job: Record<string, unknown>,
  customer: Record<string, unknown>,
  settings: Record<string, string> | null,
  businessName: string,
) {
  const raw = (customer.name as string) ?? "there";
  const first = raw.split(" ")[0];
  const firstName = first.endsWith(".") ? raw : first;
  return {
    subject: `Your quote from ${businessName} – ${money(job.amount as number)}`,
    html: wrap(`
      <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:#0f172a;letter-spacing:-0.02em;">Your quote is ready</p>
      <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;">${job.title}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Hi ${firstName},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.7;">
        Thanks for reaching out. Here's your quote for the work we discussed. This estimate is valid for 30 days.
      </p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0;border-radius:10px;margin-bottom:28px;">
        <tr><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;"><span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Work</span><span style="float:right;font-size:13px;color:#475569;">${job.title}</span></td></tr>
        ${job.description ? `<tr><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;"><span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Details</span><span style="float:right;font-size:13px;color:#475569;max-width:280px;text-align:right;display:block;">${job.description}</span></td></tr>` : ""}
        ${job.scheduled_date ? `<tr><td style="padding:14px 20px;border-bottom:1px solid #f1f5f9;"><span style="font-size:12px;color:#94a3b8;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;">Proposed date</span><span style="float:right;font-size:13px;color:#475569;">${shortDate(job.scheduled_date as string)}</span></td></tr>` : ""}
        <tr><td style="padding:16px 20px;background:#f8fafc;border-radius:0 0 10px 10px;"><span style="font-size:14px;font-weight:600;color:#0f172a;">Estimate total</span><span style="float:right;font-size:20px;font-weight:700;color:#0c2340;">${money(job.amount as number)}</span></td></tr>
      </table>
      <p style="margin:0 0 24px;font-size:15px;color:#334155;line-height:1.7;">
        To move forward, just reply to this email${settings?.contact_phone ? ` or call/text <strong>${settings.contact_phone}</strong>` : ""}. We'll get you on the schedule right away.
      </p>
      <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.7;">Looking forward to it,<br><strong style="color:#475569;">${businessName}</strong></p>
    `, businessName),
  };
}

// ── 5. Follow-up Sequence ─────────────────────────────────────────────────────
function followUpTemplate(
  inv: Record<string, unknown>,
  customer: Record<string, unknown>,
  settings: Record<string, string> | null,
  businessName: string,
  day: number,
) {
  const raw = (customer.name as string) ?? "there";
  const first = raw.split(" ")[0];
  const firstName = first.endsWith(".") ? raw : first;
  const isUrgent = day >= 14;
  const tone =
    day <= 3
      ? "Just checking in — wanted to make sure this didn't get lost in your inbox."
      : day <= 7
      ? "We're following up again on the invoice below. If you have any questions about the work or the amount, we're happy to chat."
      : "We're reaching out one final time regarding this overdue balance. Please take care of this at your earliest convenience.";
  return {
    subject: isUrgent
      ? `⚠️ Final notice: Invoice ${inv.number} – ${money(inv.amount as number)} (${day} days past due)`
      : `Follow-up (Day ${day}): Invoice ${inv.number} from ${businessName}`,
    html: wrap(`
      <p style="margin:0 0 6px;font-size:24px;font-weight:700;color:${isUrgent ? "#dc2626" : "#0f172a"};letter-spacing:-0.02em;">${isUrgent ? "⚠️ Final payment notice" : `Follow-up — Day ${day}`}</p>
      <p style="margin:0 0 28px;font-size:14px;color:#94a3b8;">Invoice ${inv.number}</p>
      <p style="margin:0 0 14px;font-size:15px;color:#334155;line-height:1.7;">Hi ${firstName},</p>
      <p style="margin:0 0 28px;font-size:15px;color:#334155;line-height:1.7;">${tone}</p>
      ${invoiceBox(inv, true)}
      ${paymentBlock(settings, inv.id as string)}
      <p style="margin:24px 0 0;font-size:14px;color:#94a3b8;line-height:1.7;">${businessName}${settings?.contact_phone ? ` &middot; ${settings.contact_phone}` : ""}</p>
    `, businessName),
  };
}

// ── Main handler ──────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const body = await req.json();
    const { type, tenantId, invoiceId, customerId, jobId, recipientEmail, day = 3 } = body;

    // Load tenant + settings
    const [{ data: tenant }, { data: settings }] = await Promise.all([
      db.from("tenants").select("name").eq("id", tenantId).single(),
      db.from("tenant_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    ]);

    const businessName = tenant?.name ?? settings?.mailing_name ?? "Pro Piper Consulting";
    const fromAddress = `${businessName} <hello@trykona.ai>`;

    let subject = "", html = "", toEmail = "";

    if (type === "invoice_reminder" || type === "invoice_receipt" || type === "follow_up") {
      if (!invoiceId) throw new Error("invoiceId required");
      const { data: inv, error: invErr } = await db
        .from("invoices")
        .select("*, customer:customers(id,name,email,phone)")
        .eq("id", invoiceId)
        .single();
      if (invErr || !inv) throw new Error("Invoice not found");
      const customer = inv.customer;
      toEmail = recipientEmail ?? customer.email ?? "";
      if (!toEmail) throw new Error("Customer has no email address — add one in Customers first");

      if (type === "invoice_receipt") {
        ({ subject, html } = invoiceReceiptTemplate(inv, customer, settings ?? {}, businessName));
      } else if (type === "follow_up") {
        ({ subject, html } = followUpTemplate(inv, customer, settings ?? {}, businessName, day));
      } else {
        ({ subject, html } = invoiceReminderTemplate(inv, customer, settings ?? {}, businessName));
      }

      // Log the send
      const { data: cur } = await db.from("invoices").select("reminder_count").eq("id", invoiceId).single();
      await db.from("invoices").update({
        last_reminder_date: new Date().toISOString().slice(0, 10),
        reminder_count: (cur?.reminder_count ?? 0) + 1,
      }).eq("id", invoiceId);

    } else if (type === "win_back") {
      if (!customerId) throw new Error("customerId required");
      const { data: customer, error: cErr } = await db
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();
      if (cErr || !customer) throw new Error("Customer not found");
      toEmail = recipientEmail ?? customer.email ?? "";
      if (!toEmail) throw new Error("Customer has no email address — add one in Customers first");
      ({ subject, html } = winBackTemplate(customer, settings ?? {}, businessName));

    } else if (type === "quote") {
      if (!jobId) throw new Error("jobId required");
      const { data: job, error: jErr } = await db
        .from("jobs")
        .select("*, customer:customers(id,name,email)")
        .eq("id", jobId)
        .single();
      if (jErr || !job) throw new Error("Job not found");
      const customer = job.customer;
      toEmail = recipientEmail ?? customer.email ?? "";
      if (!toEmail) throw new Error("Customer has no email address — add one in Customers first");
      ({ subject, html } = quoteTemplate(job, customer, settings ?? {}, businessName));

    } else {
      throw new Error(`Unknown email type: ${type}`);
    }

    // Send via Resend
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set — add it in Supabase project secrets");
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromAddress, to: toEmail, subject, html }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Resend error (${resp.status}): ${errText}`);
    }

    const result = await resp.json();
    return new Response(JSON.stringify({ ok: true, id: result.id, to: toEmail, subject }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-email error:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
