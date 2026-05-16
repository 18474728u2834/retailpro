// Discord Interactions endpoint — slash commands for modmail
// Commands: /modmail <message>, /reply <text>, /close [reason]
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-signature-ed25519, x-signature-timestamp",
};

const DISCORD_API = "https://discord.com/api/v10";

// ---------- Ed25519 signature verification ----------
function hexToBytes(hex: string) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
async function verifySignature(publicKey: string, signature: string, timestamp: string, body: string) {
  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      hexToBytes(publicKey),
      { name: "Ed25519" },
      false,
      ["verify"],
    );
    return await crypto.subtle.verify("Ed25519", key, hexToBytes(signature), enc.encode(timestamp + body));
  } catch (e) {
    console.error("verify err", e);
    return false;
  }
}

// ---------- Discord REST helpers ----------
async function discord(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${DISCORD_API}${path}`, {
    ...init,
    headers: {
      "Authorization": `Bot ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  return res;
}

function ephemeral(content: string) {
  return Response.json({ type: 4, data: { content, flags: 64 } }, { headers: corsHeaders });
}
function reply(content: string) {
  return Response.json({ type: 4, data: { content } }, { headers: corsHeaders });
}

// ---------- Handlers ----------
async function handleModmailOpen(
  admin: any,
  bot: any,
  interaction: any,
  message: string,
) {
  const guildId = interaction.guild_id;
  const userId = interaction.member?.user?.id ?? interaction.user?.id;
  const username = interaction.member?.user?.username ?? interaction.user?.username ?? "user";
  if (!guildId || !userId) return ephemeral("This command must be used in a server.");

  const { data: guild } = await admin
    .from("guilds")
    .select("*")
    .eq("bot_id", bot.id)
    .eq("guild_id", guildId)
    .maybeSingle();

  if (!guild || !guild.modmail_category_id) {
    return ephemeral(
      "⚠️ Modmail isn't configured for this server yet. The bot owner needs to set the Guild ID, Support Role, and Category in the dashboard.",
    );
  }

  // Existing open ticket?
  const { data: existing } = await admin
    .from("tickets")
    .select("*")
    .eq("bot_id", bot.id)
    .eq("guild_id", guildId)
    .eq("user_discord_id", userId)
    .eq("status", "open")
    .maybeSingle();

  let channelId = existing?.channel_id;
  let ticketId = existing?.id;

  if (!existing) {
    // Create the ticket channel under the modmail category
    const overwrites: any[] = [
      { id: guildId, type: 0, deny: "1024" }, // @everyone deny VIEW_CHANNEL
      { id: bot.application_id, type: 1, allow: "274877959168" }, // bot view+send+history
    ];
    if (guild.staff_role_id) {
      overwrites.push({ id: guild.staff_role_id, type: 0, allow: "274877959168" });
    }
    const channelRes = await discord(`/guilds/${guildId}/channels`, bot.bot_token, {
      method: "POST",
      body: JSON.stringify({
        name: `ticket-${username}`.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 90),
        type: 0,
        parent_id: guild.modmail_category_id,
        topic: `Modmail with <@${userId}> (${userId})`,
        permission_overwrites: overwrites,
      }),
    });
    if (!channelRes.ok) {
      const txt = await channelRes.text();
      console.error("channel create failed", txt);
      return ephemeral("❌ Couldn't create ticket channel. Check the bot's permissions and the category ID.");
    }
    const ch = await channelRes.json();
    channelId = ch.id;

    const { data: t } = await admin
      .from("tickets")
      .insert({
        bot_id: bot.id,
        guild_id: guildId,
        user_discord_id: userId,
        channel_id: channelId,
        status: "open",
      })
      .select()
      .single();
    ticketId = t.id;

    // Post header in channel
    const headerEmbed = {
      title: `New ticket from ${username}`,
      description: `User: <@${userId}> (\`${userId}\`)\nUse \`/reply <text>\` to respond.\nUse \`/close\` or \`/close reason:<text>\` to end the ticket.`,
      color: 0x5865f2,
    };
    await discord(`/channels/${channelId}/messages`, bot.bot_token, {
      method: "POST",
      body: JSON.stringify({
        content: guild.staff_role_id ? `<@&${guild.staff_role_id}>` : "",
        embeds: [headerEmbed],
        allowed_mentions: { roles: guild.staff_role_id ? [guild.staff_role_id] : [] },
      }),
    });
  }

  // Forward the user's first message into the ticket channel
  const userEmbed = {
    author: { name: username },
    description: message,
    color: 0x57f287,
    footer: { text: `User ID: ${userId}` },
    timestamp: new Date().toISOString(),
  };
  await discord(`/channels/${channelId}/messages`, bot.bot_token, {
    method: "POST",
    body: JSON.stringify({ embeds: [userEmbed] }),
  });

  await admin.from("ticket_messages").insert({
    ticket_id: ticketId,
    author_discord_id: userId,
    author_username: username,
    content: message,
    is_staff: false,
  });

  // Send welcome DM to user (best-effort)
  try {
    const dmRes = await discord(`/users/@me/channels`, bot.bot_token, {
      method: "POST",
      body: JSON.stringify({ recipient_id: userId }),
    });
    if (dmRes.ok) {
      const dm = await dmRes.json();
      await discord(`/channels/${dm.id}/messages`, bot.bot_token, {
        method: "POST",
        body: JSON.stringify({
          embeds: [{
            title: "Ticket opened",
            description: guild.welcome_message,
            color: 0x5865f2,
          }],
        }),
      });
    }
  } catch (e) { console.error("dm welcome failed", e); }

  return ephemeral(`${guild.confirmation_emoji} Ticket opened — staff have been notified.`);
}

async function handleReply(admin: any, bot: any, interaction: any, text: string) {
  const channelId = interaction.channel_id;
  const staffUser = interaction.member?.user;

  const { data: ticket } = await admin
    .from("tickets")
    .select("*")
    .eq("bot_id", bot.id)
    .eq("channel_id", channelId)
    .eq("status", "open")
    .maybeSingle();
  if (!ticket) return ephemeral("This isn't an open ticket channel.");

  const { data: guild } = await admin
    .from("guilds")
    .select("*")
    .eq("bot_id", bot.id)
    .eq("guild_id", ticket.guild_id)
    .maybeSingle();

  // Permission check: must have staff role
  if (guild?.staff_role_id) {
    const roles: string[] = interaction.member?.roles ?? [];
    if (!roles.includes(guild.staff_role_id)) {
      return ephemeral("You don't have the support role.");
    }
  }

  const avatarUrl = staffUser?.avatar
    ? `https://cdn.discordapp.com/avatars/${staffUser.id}/${staffUser.avatar}.png`
    : `https://cdn.discordapp.com/embed/avatars/0.png`;

  const embed = {
    author: { name: `${staffUser?.username ?? "Staff"} (Staff)`, icon_url: avatarUrl },
    description: text,
    color: 0x5865f2,
    timestamp: new Date().toISOString(),
  };

  // DM the user
  const dmRes = await discord(`/users/@me/channels`, bot.bot_token, {
    method: "POST",
    body: JSON.stringify({ recipient_id: ticket.user_discord_id }),
  });
  if (!dmRes.ok) return ephemeral("❌ Couldn't open a DM with the user.");
  const dm = await dmRes.json();
  const sendRes = await discord(`/channels/${dm.id}/messages`, bot.bot_token, {
    method: "POST",
    body: JSON.stringify({ embeds: [embed] }),
  });
  if (!sendRes.ok) return ephemeral("❌ User has DMs disabled or blocked the bot.");

  // Mirror in the ticket channel so other staff see the sent reply
  await discord(`/channels/${channelId}/messages`, bot.bot_token, {
    method: "POST",
    body: JSON.stringify({ embeds: [embed] }),
  });

  await admin.from("ticket_messages").insert({
    ticket_id: ticket.id,
    author_discord_id: staffUser?.id ?? "unknown",
    author_username: staffUser?.username ?? "Staff",
    content: text,
    is_staff: true,
  });

  return Response.json(
    { type: 4, data: { content: `${guild?.confirmation_emoji ?? "✅"} Sent.`, flags: 64 } },
    { headers: corsHeaders },
  );
}

async function handleClose(admin: any, bot: any, interaction: any, reason: string | null) {
  const channelId = interaction.channel_id;
  const { data: ticket } = await admin
    .from("tickets")
    .select("*")
    .eq("bot_id", bot.id)
    .eq("channel_id", channelId)
    .eq("status", "open")
    .maybeSingle();
  if (!ticket) return ephemeral("This isn't an open ticket channel.");

  const { data: guild } = await admin
    .from("guilds")
    .select("*")
    .eq("bot_id", bot.id)
    .eq("guild_id", ticket.guild_id)
    .maybeSingle();

  if (guild?.staff_role_id) {
    const roles: string[] = interaction.member?.roles ?? [];
    if (!roles.includes(guild.staff_role_id)) return ephemeral("You don't have the support role.");
  }

  // DM the user with close message + optional reason
  try {
    const dmRes = await discord(`/users/@me/channels`, bot.bot_token, {
      method: "POST",
      body: JSON.stringify({ recipient_id: ticket.user_discord_id }),
    });
    if (dmRes.ok) {
      const dm = await dmRes.json();
      const fields = reason ? [{ name: "Reason", value: reason }] : [];
      await discord(`/channels/${dm.id}/messages`, bot.bot_token, {
        method: "POST",
        body: JSON.stringify({
          embeds: [{
            title: "Ticket closed",
            description: guild?.close_message ?? "Your ticket has been closed.",
            color: 0xed4245,
            fields,
          }],
        }),
      });
    }
  } catch (e) { console.error("dm close failed", e); }

  await admin
    .from("tickets")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", ticket.id);

  // Delete the channel after a short ack
  setTimeout(async () => {
    await discord(`/channels/${channelId}`, bot.bot_token, { method: "DELETE" });
  }, 3000);

  return reply(`🔒 Ticket closed${reason ? ` — *${reason}*` : ""}. Channel deletes in 3s.`);
}

// ---------- Main handler ----------
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const botIdParam = url.searchParams.get("bot_id");
  if (!botIdParam) return new Response("Missing bot_id", { status: 400, headers: corsHeaders });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: bot } = await admin.from("bots").select("*").eq("id", botIdParam).single();
  if (!bot) return new Response("Bot not found", { status: 404, headers: corsHeaders });

  const signature = req.headers.get("x-signature-ed25519");
  const timestamp = req.headers.get("x-signature-timestamp");
  const body = await req.text();
  if (!signature || !timestamp || !(await verifySignature(bot.public_key, signature, timestamp, body))) {
    return new Response("invalid request signature", { status: 401, headers: corsHeaders });
  }

  const interaction = JSON.parse(body);

  // PING
  if (interaction.type === 1) {
    return Response.json({ type: 1 }, { headers: corsHeaders });
  }

  // APPLICATION_COMMAND
  if (interaction.type === 2) {
    const name = interaction.data?.name;
    const opts: any[] = interaction.data?.options ?? [];
    const getOpt = (n: string) => opts.find((o) => o.name === n)?.value;

    try {
      if (name === "modmail") {
        const message = getOpt("message") ?? "(no message)";
        return await handleModmailOpen(admin, bot, interaction, message);
      }
      if (name === "reply") {
        const text = getOpt("text");
        if (!text) return ephemeral("Missing text.");
        return await handleReply(admin, bot, interaction, text);
      }
      if (name === "close") {
        const reason = getOpt("reason") ?? null;
        return await handleClose(admin, bot, interaction, reason);
      }
      if (name === "ping") {
        return reply(`🏓 Pong from **${bot.bot_name ?? "bot"}**`);
      }
    } catch (e) {
      console.error("handler err", e);
      return ephemeral(`❌ Error: ${String(e)}`);
    }
    return ephemeral("Unknown command");
  }

  return new Response("Unhandled", { status: 400, headers: corsHeaders });
});
