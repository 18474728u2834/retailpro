// Bot admin actions invoked from the dashboard:
//   action=verify         -> checks bot token works, marks bot ready
//   action=register-commands -> registers /modmail, /reply, /close globally
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DISCORD_API = "https://discord.com/api/v10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const COMMANDS = [
  {
    name: "modmail",
    description: "Open a modmail ticket with the staff team",
    options: [
      { name: "message", description: "What do you need help with?", type: 3, required: true },
    ],
  },
  {
    name: "reply",
    description: "Reply to the user from this ticket channel (staff only)",
    options: [
      { name: "text", description: "Your reply (sent as embed to the user)", type: 3, required: true },
    ],
  },
  {
    name: "close",
    description: "Close this ticket (staff only)",
    options: [
      { name: "reason", description: "Optional reason sent to the user", type: 3, required: false },
    ],
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const body = await req.json();
    const { action } = body;

    // --- autofill: only a bot token is needed; we fetch the app from Discord and upsert the bot row
    if (action === "autofill") {
      const bot_token = (body.bot_token ?? "").trim();
      if (!bot_token) return json({ error: "bot_token required" }, 400);

      // Fetch the application info using the bot token
      const appRes = await fetch(`${DISCORD_API}/oauth2/applications/@me`, {
        headers: { Authorization: `Bot ${bot_token}` },
      });
      if (!appRes.ok) {
        const txt = await appRes.text();
        return json({ ok: false, error: `Discord rejected the bot token (${appRes.status}): ${txt}` }, 400);
      }
      const app = await appRes.json();
      if (!app?.id || !app?.verify_key) {
        return json({ ok: false, error: "Discord didn't return application id / public key for this token." }, 400);
      }

      // Also fetch the bot user for username
      const meRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bot ${bot_token}` },
      });
      const me = meRes.ok ? await meRes.json() : null;

      const { data: existing } = await admin
        .from("bots").select("*").eq("owner_user_id", user.id).maybeSingle();

      const payload = {
        owner_user_id: user.id,
        application_id: String(app.id),
        public_key: String(app.verify_key),
        bot_token,
        bot_name: me?.username ?? app.name ?? null,
        status: "active",
      };

      const upsert = existing
        ? await admin.from("bots").update(payload).eq("id", existing.id).select().single()
        : await admin.from("bots").insert(payload).select().single();
      if (upsert.error) return json({ ok: false, error: upsert.error.message }, 400);

      return json({
        ok: true,
        bot: upsert.data,
        app: { id: app.id, name: app.name, icon: app.icon },
      });
    }

    const bot_id = body.bot_id;
    if (!bot_id) return json({ error: "bot_id required" }, 400);

    const { data: bot, error: botErr } = await admin
      .from("bots").select("*").eq("id", bot_id).eq("owner_user_id", user.id).single();
    if (botErr || !bot) return json({ error: "Bot not found" }, 404);

    if (action === "verify") {
      // Hit Discord with the bot token to confirm it works
      const meRes = await fetch(`${DISCORD_API}/users/@me`, {
        headers: { Authorization: `Bot ${bot.bot_token}` },
      });
      if (!meRes.ok) {
        return json({ ok: false, error: `Discord rejected the bot token (${meRes.status})` }, 400);
      }
      const me = await meRes.json();
      const guildsRes = await fetch(`${DISCORD_API}/users/@me/guilds`, {
        headers: { Authorization: `Bot ${bot.bot_token}` },
      });
      const guilds = guildsRes.ok ? await guildsRes.json() : [];

      await admin.from("bots").update({
        status: guilds.length > 0 ? "ready" : "active",
        bot_name: bot.bot_name ?? me.username,
      }).eq("id", bot.id);

      return json({
        ok: true,
        bot: { id: me.id, username: me.username, avatar: me.avatar },
        guilds: guilds.map((g: any) => ({ id: g.id, name: g.name })),
        ready: guilds.length > 0,
      });
    }

    if (action === "register-commands") {
      const res = await fetch(
        `${DISCORD_API}/applications/${bot.application_id}/commands`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bot ${bot.bot_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(COMMANDS),
        },
      );
      const txt = await res.text();
      if (!res.ok) return json({ ok: false, error: `Discord error: ${txt}` }, 400);
      return json({ ok: true, registered: COMMANDS.map((c) => c.name) });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[discord-bot-admin]", e);
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
