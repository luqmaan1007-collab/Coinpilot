import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const { type, amount, card } = body;

    if (!type || !amount || !card) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (amount < 10) {
      return new Response(JSON.stringify({ error: "Minimum amount is $10" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: `txn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        type,
        amount,
        card: { last4: card.last4 },
        timestamp: new Date().toISOString(),
        message: `${type === "deposit" ? "Deposit" : "Withdrawal"} of $${amount.toFixed(2)} processed successfully`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
