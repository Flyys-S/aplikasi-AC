// Follow Deno standards for Supabase Edge Functions
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const XENDIT_API_KEY = Deno.env.get("XENDIT_API_KEY") || "";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { transactionId, amount, buyerName, buyerPhone, buyerEmail } = await req.json()

    if (!transactionId || !amount) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Call Xendit API to create Invoice
    const xenditAuth = btoa(`${XENDIT_API_KEY}:`)
    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${xenditAuth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: transactionId,
        amount: Number(amount),
        description: `Pembayaran AC Mitra Maju Sejati #${transactionId.slice(0, 8).toUpperCase()}`,
        invoice_duration: 86400, // 24 hours
        customer: {
          given_names: buyerName,
          mobile_number: buyerPhone,
          email: buyerEmail || undefined,
        },
        success_redirect_url: "https://flyys-s.github.io/aplikasi-AC/my-orders",
        failure_redirect_url: "https://flyys-s.github.io/aplikasi-AC/checkout"
      })
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || "Failed to create Xendit invoice")
    }

    // Initialize Supabase Admin client to update the transaction
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? "",
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
    )

    // Update transactions table with the invoice link
    const { error: dbError } = await supabaseClient
      .from('transactions')
      .update({
        notes: `Xendit Invoice ID: ${data.id}`,
        payment_proof_url: data.invoice_url // Temporary storage of payment link, or you can add a dedicated xendit_invoice_url column if desired
      })
      .eq('id', transactionId)

    if (dbError) throw dbError

    return new Response(JSON.stringify({ invoice_url: data.invoice_url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
