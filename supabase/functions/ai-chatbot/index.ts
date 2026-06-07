// AI Chatbot edge function — uses Lovable AI Gateway, public.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: row } = await supabase.from("settings").select("value").eq("key", "ai_chatbot_settings").maybeSingle();
    const cfg: any = row?.value || {};
    const name = cfg.name || "Trợ lý VSM";
    const systemPrompt = cfg.system_prompt || `Bạn là ${name}, trợ lý ảo thân thiện của cửa hàng VSM. Trả lời ngắn gọn, hữu ích bằng tiếng Việt.`;
    const knowledge = (cfg.knowledge_base || "").trim();
    const model = cfg.model || "google/gemini-2.5-flash";

    // Fetch structured FAQ knowledge base
    const { data: kbRows } = await supabase
      .from("chatbot_knowledge")
      .select("category, question, answer, sort_order")
      .eq("is_active", true)
      .order("category", { ascending: true })
      .order("sort_order", { ascending: true });

    let kbText = "";
    if (kbRows && kbRows.length > 0) {
      const grouped: Record<string, { question: string; answer: string }[]> = {};
      for (const r of kbRows as any[]) {
        (grouped[r.category] ||= []).push({ question: r.question, answer: r.answer });
      }
      kbText = Object.entries(grouped)
        .map(([cat, list]) => `### ${cat}\n` + list.map(i => `Q: ${i.question}\nA: ${i.answer}`).join("\n\n"))
        .join("\n\n");
    }

    const parts = [systemPrompt];
    if (kbText) parts.push(`KIẾN THỨC THAM KHẢO (FAQ):\n${kbText}`);
    if (knowledge) parts.push(`GHI CHÚ THÊM:\n${knowledge}`);
    const systemContent = parts.join("\n\n");

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [{ role: "system", content: systemContent }, ...messages],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "rate_limit", message: "Quá nhiều yêu cầu, vui lòng thử lại sau." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "payment_required", message: "Cần nạp credit cho Lovable AI." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok || !upstream.body) {
      const t = await upstream.text();
      return new Response(JSON.stringify({ error: "upstream_error", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
