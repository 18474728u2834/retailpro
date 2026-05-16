// Edge function: ai-modmail-reply
// Called by the Modmail bot. Given a ticket + user message, decides whether
// to auto-reply using product rules + scraped knowledge channels, or escalate.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { bot_id, ticket_id, user_message } = await req.json();
    if (!bot_id || !ticket_id || typeof user_message !== "string") {
      return json({ error: "bot_id, ticket_id and user_message are required" }, 400);
    }

    const db = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    const { data: ticket } = await db.from("tickets").select("*").eq("id", ticket_id).maybeSingle();
    if (!ticket) return json({ error: "ticket not found" }, 404);

    const { data: guild } = await db
      .from("guilds").select("*")
      .eq("bot_id", bot_id).eq("guild_id", ticket.guild_id).maybeSingle();
    if (!guild) return json({ error: "guild not configured" }, 404);

    if (!guild.ai_enabled || !guild.ai_running) {
      return json({ should_reply: false, reason: "AI disabled" });
    }

    // Knowledge: cached channel messages (most recent 200)
    const { data: knowledge } = await db
      .from("ai_knowledge_messages")
      .select("author_username, content, channel_id")
      .eq("bot_id", bot_id).eq("guild_id", ticket.guild_id)
      .order("created_at", { ascending: false })
      .limit(200);

    const knowledgeText = (knowledge ?? [])
      .filter((k) => k.content && k.content.trim())
      .map((k) => `[#${k.channel_id}] ${k.author_username ?? "user"}: ${k.content}`)
      .join("\n");

    // Recent ticket history for context
    const { data: history } = await db
      .from("ticket_messages")
      .select("author_username, content, is_staff, created_at")
      .eq("ticket_id", ticket_id)
      .order("created_at", { ascending: true })
      .limit(40);

    const historyText = (history ?? [])
      .map((m) => `${m.is_staff ? "STAFF" : "USER"} ${m.author_username ?? ""}: ${m.content ?? ""}`)
      .join("\n");

    const systemPrompt = `You are an AI support assistant inside a Discord modmail ticket. \
You answer ONLY using information from the product rules and channel knowledge below. \
If the information is not enough, escalate to human staff. Do not invent facts. \
Be concise, friendly, and clear. Reply in the same language as the user.

PRODUCT RULES:
${guild.ai_product_rules || "(none provided)"}

CHANNEL KNOWLEDGE (recent messages from selected server channels):
${knowledgeText || "(no channel knowledge yet)"}

TICKET HISTORY SO FAR:
${historyText || "(none)"}`;

    const tools = [{
      type: "function",
      function: {
        name: "respond",
        description: "Decide whether the AI can confidently answer, and produce the reply.",
        parameters: {
          type: "object",
          properties: {
            should_reply: { type: "boolean", description: "true if confident enough to answer without staff" },
            reply: { type: "string", description: "the answer to send to the user (empty if escalating)" },
            reason: { type: "string", description: "short internal reason (why answer / why escalate)" },
          },
          required: ["should_reply", "reply", "reason"],
          additionalProperties: false,
        },
      },
    }];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: user_message },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "respond" } },
      }),
    });

    if (aiRes.status === 429) return json({ error: "Rate limited, try again later." }, 429);
    if (aiRes.status === 402) return json({ error: "AI credits exhausted." }, 402);
    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return json({ error: "AI gateway error" }, 500);
    }

    const data = await aiRes.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    let parsed: { should_reply: boolean; reply: string; reason: string } = {
      should_reply: false, reply: "", reason: "no tool call",
    };
    if (call?.function?.arguments) {
      try { parsed = JSON.parse(call.function.arguments); } catch { /* ignore */ }
    }

    await db.from("ai_replies").insert({
      bot_id,
      ticket_id,
      user_message,
      ai_reply: parsed.reply ?? "",
      escalated: !parsed.should_reply,
      reason: parsed.reason ?? null,
    });

    return json(parsed);
  } catch (e) {
    console.error("ai-modmail-reply error", e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
