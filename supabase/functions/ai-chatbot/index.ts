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

    // Fetch structured FAQ knowledge base, ordered by priority then sort_order
    const { data: kbRows } = await supabase
      .from("chatbot_knowledge")
      .select("category, question, answer, sort_order, priority")
      .eq("is_active", true)
      .order("priority", { ascending: true })
      .order("sort_order", { ascending: true });

    const PRIORITY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };
    const PRIORITY_LABEL: Record<string, string> = { high: "ƯU TIÊN CAO", medium: "Bình thường", low: "Tham khảo" };

    let kbText = "";
    let hasHighPriority = false;
    if (kbRows && kbRows.length > 0) {
      const sorted = [...(kbRows as any[])].sort((a, b) => {
        const pr = (PRIORITY_RANK[a.priority] ?? 1) - (PRIORITY_RANK[b.priority] ?? 1);
        return pr !== 0 ? pr : (a.sort_order || 0) - (b.sort_order || 0);
      });
      // Group by category, but mark each item with its priority tag so the model can see ordering
      const grouped: Record<string, any[]> = {};
      for (const r of sorted) {
        if (r.priority === "high") hasHighPriority = true;
        (grouped[r.category] ||= []).push(r);
      }
      kbText = Object.entries(grouped)
        .map(([cat, list]) =>
          `### ${cat}\n` +
          list.map(i => `[${PRIORITY_LABEL[i.priority] || "Bình thường"}] Q: ${i.question}\nA: ${i.answer}`).join("\n\n")
        )
        .join("\n\n");
    }

    const rules = [
      "QUY TẮC SỬ DỤNG KIẾN THỨC:",
      "1. Luôn ưu tiên trích dẫn các mục được đánh dấu [ƯU TIÊN CAO] khi câu hỏi liên quan.",
      "2. Nếu nhiều mục cùng chủ đề, chọn mục có ưu tiên cao hơn; chỉ dùng mục [Tham khảo] khi không có nguồn nào tốt hơn.",
      "3. Khi trả lời, ghi rõ thông tin lấy từ danh mục nào (vd: 'Theo Chính sách...').",
      "4. Nếu không có mục FAQ phù hợp, trả lời dựa trên kiến thức chung và nói rõ.",
    ].join("\n");

    const parts = [systemPrompt];
    if (kbText) {
      parts.push(`KIẾN THỨC THAM KHẢO (FAQ — đã sắp theo độ ưu tiên):\n${kbText}`);
      parts.push(rules);
      if (hasHighPriority) parts.push("Lưu ý: có các mục ƯU TIÊN CAO — bot phải dùng trước tiên khi phù hợp.");
    }
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
