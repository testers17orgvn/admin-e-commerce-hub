// Webhook nhận biến động số dư từ Casso/Sepay/SMS bridge → tự khớp đơn hàng
// Public (verify_jwt = false). Bảo vệ bằng header X-Webhook-Token.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-token",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const expected = Deno.env.get("PAYMENT_WEBHOOK_TOKEN");
    if (expected) {
      const provided = req.headers.get("x-webhook-token") || new URL(req.url).searchParams.get("token");
      if (provided !== expected) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    // Hỗ trợ payload Casso (data: [...]) và Sepay (object đơn lẻ)
    const items = Array.isArray(body?.data) ? body.data : [body];
    const results: any[] = [];

    for (const it of items) {
      const amount = Number(it.amount ?? it.transferAmount ?? it.value ?? 0);
      const description = String(it.description ?? it.content ?? it.transferContent ?? "");
      const reference = String(it.tid ?? it.referenceCode ?? it.id ?? crypto.randomUUID());
      const bankName = String(it.bank_name ?? it.bankName ?? it.gateway ?? "");
      const accountNumber = String(it.subAccount ?? it.account ?? it.accountNumber ?? "");

      if (!amount || amount <= 0) continue;

      const { data, error } = await supabase.rpc("match_payment_to_order", {
        _amount: amount,
        _description: description,
        _reference: reference,
        _bank_name: bankName,
        _account_number: accountNumber,
        _raw: it,
      });
      results.push({ matched_order: data, error: error?.message });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
