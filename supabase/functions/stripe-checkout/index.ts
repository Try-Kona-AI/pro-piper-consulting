import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const APP_URL = Deno.env.get("APP_URL") ?? "https://propiper-app.vercel.app";

const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS });
  }

  try {
    // Auth — require valid JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }
    const token = authHeader.slice(7);
    const { data: { user }, error: authErr } = await db.auth.getUser(token);
    if (authErr || !user) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    const { invoiceId, tenantId } = await req.json();
    if (!invoiceId || !tenantId) {
      return json({ ok: false, error: "invoiceId and tenantId are required" }, 400);
    }

    // Fetch invoice + customer
    const { data: inv, error: invErr } = await db
      .from("invoices")
      .select("*, customer:customers(id,name,email)")
      .eq("id", invoiceId)
      .single();
    if (invErr || !inv) {
      return json({ ok: false, error: "Invoice not found" }, 404);
    }

    // Fetch tenant settings for Stripe key
    const { data: settings } = await db
      .from("tenant_settings")
      .select("stripe_secret_key")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const stripeKey = settings?.stripe_secret_key;
    if (!stripeKey) {
      return json({ ok: false, error: "Stripe not configured" }, 400);
    }

    const amountInCents = Math.round((inv.amount as number) * 100);
    const description = (inv.description as string) ?? "Services rendered";
    const invoiceNumber = inv.number as string;

    // Create Stripe Checkout Session via REST API (no npm package)
    const params = new URLSearchParams({
      "mode": "payment",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": String(amountInCents),
      "line_items[0][price_data][product_data][name]": `Invoice ${invoiceNumber}`,
      "line_items[0][price_data][product_data][description]": description,
      "line_items[0][quantity]": "1",
      "success_url": `${APP_URL}/pay/success?invoice=${invoiceId}`,
      "cancel_url": `${APP_URL}/pay/cancel`,
      "metadata[invoiceId]": invoiceId,
      "metadata[tenantId]": tenantId,
    });

    const stripeResp = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!stripeResp.ok) {
      const errBody = await stripeResp.text();
      throw new Error(`Stripe error (${stripeResp.status}): ${errBody}`);
    }

    const session = await stripeResp.json();
    return json({ ok: true, url: session.url });

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("stripe-checkout error:", message);
    return json({ ok: false, error: message }, 500);
  }
});
