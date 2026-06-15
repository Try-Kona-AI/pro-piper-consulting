import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const GLOBAL_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

const db = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Stripe webhook signature verification using Web Crypto API (no npm package)
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    // Parse Stripe-Signature header: t=timestamp,v1=sig1,...
    const parts = sigHeader.split(",");
    let timestamp = "";
    const signatures: string[] = [];
    for (const part of parts) {
      if (part.startsWith("t=")) timestamp = part.slice(2);
      if (part.startsWith("v1=")) signatures.push(part.slice(3));
    }
    if (!timestamp || !signatures.length) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const expected = Array.from(new Uint8Array(sigBytes))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return signatures.some((s) => s === expected);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "content-type, stripe-signature",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
      },
    });
  }

  try {
    const sigHeader = req.headers.get("stripe-signature") ?? "";
    const rawBody = await req.text();

    // Try global webhook secret first; fall back to tenant-level lookup after parsing
    let verified = false;
    if (GLOBAL_WEBHOOK_SECRET) {
      verified = await verifyStripeSignature(rawBody, sigHeader, GLOBAL_WEBHOOK_SECRET);
    }

    // If no global secret, we'll verify per-tenant after parsing event
    const event = JSON.parse(rawBody);

    if (!verified && !GLOBAL_WEBHOOK_SECRET) {
      // Try to find the tenant's webhook secret from metadata
      const tenantId = event?.data?.object?.metadata?.tenantId;
      if (tenantId) {
        const { data: settings } = await db
          .from("tenant_settings")
          .select("stripe_webhook_secret")
          .eq("tenant_id", tenantId)
          .maybeSingle();
        if (settings?.stripe_webhook_secret) {
          verified = await verifyStripeSignature(rawBody, sigHeader, settings.stripe_webhook_secret);
        }
      }
    }

    if (!verified) {
      console.error("stripe-webhook: signature verification failed");
      return new Response(JSON.stringify({ ok: false, error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const invoiceId = session?.metadata?.invoiceId;

      if (invoiceId) {
        const today = new Date().toISOString().slice(0, 10);
        const { error } = await db
          .from("invoices")
          .update({ status: "paid", paid_date: today })
          .eq("id", invoiceId);

        if (error) {
          console.error("stripe-webhook: failed to update invoice", invoiceId, error.message);
        } else {
          console.log("stripe-webhook: invoice marked paid", invoiceId);
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("stripe-webhook error:", message);
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
});
