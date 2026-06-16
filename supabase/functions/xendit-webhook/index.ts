import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const XENDIT_CALLBACK_TOKEN = Deno.env.get("XENDIT_CALLBACK_TOKEN") || "";

serve(async (req) => {
  try {
    const callbackToken = req.headers.get("x-callback-token")

    if (callbackToken !== XENDIT_CALLBACK_TOKEN) {
      return new Response(JSON.stringify({ error: "Unauthorized Callback Token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" }
      })
    }

    const body = await req.json()
    const { external_id, status } = body

    if (status === "PAID" || status === "SETTLED") {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? "",
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ""
      )

      // Update transaction status to paid
      const { error } = await supabaseClient
        .from('transactions')
        .update({ status: 'paid' })
        .eq('id', external_id)

      if (error) throw error
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
})
