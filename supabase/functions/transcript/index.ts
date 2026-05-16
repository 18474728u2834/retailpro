// Public transcript reader. No auth required — knowing the ticket UUID is the
// access token. Returns ticket metadata + ordered messages.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    // Accept ?id=... or trailing path segment
    let id = url.searchParams.get("id");
    if (!id) {
      const parts = url.pathname.split("/").filter(Boolean);
      id = parts[parts.length - 1];
    }
    if (!id || id.length < 12) {
      return new Response(JSON.stringify({ error: "invalid id" }), {
        status: 400,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const db = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: ticket, error: tErr } = await db
      .from("tickets")
      .select("id, guild_id, user_discord_id, status, category_name, opened_at, closed_at, closed_by_discord_id, closed_by_username")
      .eq("id", id)
      .maybeSingle();

    if (tErr) throw tErr;
    if (!ticket) {
      return new Response(JSON.stringify({ error: "not found" }), {
        status: 404,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    const { data: messages, error: mErr } = await db
      .from("ticket_messages")
      .select("id, author_discord_id, author_username, content, is_staff, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true });

    if (mErr) throw mErr;

    return new Response(JSON.stringify({ ticket, messages: messages ?? [] }), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
