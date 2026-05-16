import 'dotenv/config';
import ws from 'ws';
import {
  Client,
  GatewayIntentBits,
  Partials,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { createClient } from '@supabase/supabase-js';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  BOT_ID,
  TRANSCRIPT_BASE_URL,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const TRANSCRIPT_BASE = (TRANSCRIPT_BASE_URL || 'https://modmail.retailpro.space').replace(/\/+$/, '');

const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  realtime: { transport: ws },
});

// ============================================================
// Multi-bot manager
// Each entry: { botRow, client, pendingDMs, retryAt, status }
// status: 'starting' | 'ready' | 'failed' | 'stopping'
// ============================================================
const workers = new Map();

function transcriptUrl(ticketId) {
  return `${TRANSCRIPT_BASE}/transcript/id/${ticketId}`;
}

async function getGuildConfig(ctx, guildId) {
  const { data, error } = await db
    .from('guilds').select('*')
    .eq('bot_id', ctx.botRow.id).eq('guild_id', guildId).maybeSingle();
  if (error) console.error(`[${ctx.botRow.id}] getGuildConfig`, error);
  return data;
}

async function getFirstGuildConfig(ctx) {
  const { data, error } = await db
    .from('guilds').select('*').eq('bot_id', ctx.botRow.id).limit(1);
  if (error) console.error(`[${ctx.botRow.id}] getFirstGuildConfig`, error);
  return data?.[0] ?? null;
}

async function findOpenTicketByUser(ctx, discordUserId) {
  const { data } = await db
    .from('tickets').select('*')
    .eq('bot_id', ctx.botRow.id).eq('user_discord_id', discordUserId)
    .eq('status', 'open').limit(1);
  return data?.[0] ?? null;
}

async function findOpenTicketByChannel(ctx, channelId) {
  const { data } = await db
    .from('tickets').select('*')
    .eq('bot_id', ctx.botRow.id).eq('channel_id', channelId)
    .eq('status', 'open').limit(1);
  return data?.[0] ?? null;
}

async function logMessage(ticketId, author, content, isStaff) {
  await db.from('ticket_messages').insert({
    ticket_id: ticketId,
    author_discord_id: author.id,
    author_username: author.username ?? author.tag ?? null,
    content: content ?? '',
    is_staff: isStaff,
  });
}

async function getCategories(ctx, guildId) {
  const { data, error } = await db
    .from('ticket_categories').select('*')
    .eq('bot_id', ctx.botRow.id).eq('guild_id', guildId)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) console.error(`[${ctx.botRow.id}] getCategories`, error);
  return data ?? [];
}

async function createTicketChannel(ctx, cfg, guild, user, category) {
  const overwrites = [
    { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
    {
      id: ctx.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    },
  ];
  if (cfg.staff_role_id) {
    overwrites.push({
      id: cfg.staff_role_id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const baseName = `modmail-${user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 90) || `modmail-${user.id}`;
  const channel = await guild.channels.create({
    name: baseName,
    type: ChannelType.GuildText,
    parent: cfg.modmail_category_id,
    permissionOverwrites: overwrites,
    topic: `Modmail with ${user.tag} (${user.id})${category ? ` — ${category.name}` : ''}`,
  });

  const { data: newTicket, error: tErr } = await db.from('tickets').insert({
    bot_id: ctx.botRow.id,
    guild_id: cfg.guild_id,
    user_discord_id: user.id,
    channel_id: channel.id,
    status: 'open',
    category_id: category?.id ?? null,
    category_name: category?.name ?? null,
  }).select().single();
  if (tErr) {
    console.error(`[${ctx.botRow.id}] insert ticket`, tErr);
    return null;
  }

  const headerEmbed = new EmbedBuilder()
    .setTitle('New modmail ticket')
    .setDescription(`From <@${user.id}> (\`${user.tag}\`)`)
    .setThumbnail(user.displayAvatarURL())
    .setColor(0x5865f2)
    .setTimestamp(new Date());
  if (category) {
    headerEmbed.addFields({
      name: 'Category',
      value: `${category.emoji ? `${category.emoji} ` : ''}${category.name}`,
    });
  }
  headerEmbed.addFields({ name: 'Transcript', value: transcriptUrl(newTicket.id) });

  await channel.send({
    content: cfg.staff_role_id ? `<@&${cfg.staff_role_id}>` : undefined,
    embeds: [headerEmbed],
  });

  try { await user.send(cfg.welcome_message); } catch {}

  return { ticket: newTicket, channel };
}

async function relayUserMessageToChannel(channel, user, content, files) {
  const userEmbed = new EmbedBuilder()
    .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
    .setDescription(content || '*(no text)*')
    .setColor(0x5865f2)
    .setTimestamp(new Date());
  await channel.send({ embeds: [userEmbed], files: files ?? [] });
}

// Ask the edge function for an AI reply; if confident, DM the user and post in the ticket channel.
async function tryAiReply(ctx, cfg, ticket, channel, user, userMessage) {
  // If this ticket has already been escalated, the AI should never respond again.
  const { data: prior } = await db
    .from('ai_replies')
    .select('id')
    .eq('ticket_id', ticket.id)
    .eq('escalated', true)
    .limit(1);
  if (prior && prior.length > 0) return;

  const url = `${SUPABASE_URL.replace(/\/+$/, '')}/functions/v1/ai-modmail-reply`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      bot_id: ctx.botRow.id,
      ticket_id: ticket.id,
      user_message: userMessage ?? '',
    }),
  });
  if (!res.ok) {
    console.error(`[${ctx.botRow.id}] ai-modmail-reply HTTP ${res.status}`);
    return;
  }
  const data = await res.json();
  if (!data?.should_reply || !data?.reply) {
    // Escalated — notify staff in channel, notify user in DM, then stop replying.
    if (data?.reason) {
      try {
        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle('AI escalated to staff')
              .setDescription(`*${data.reason}*`)
              .setColor(0xfaa61a),
          ],
        });
      } catch {}
    }
    try {
      await user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Escalated to staff')
            .setDescription("Your ticket has been escalated to our staff team. A human will get back to you shortly — no need to repeat yourself.")
            .setColor(0xfaa61a)
            .setTimestamp(new Date()),
        ],
      });
    } catch (e) {
      console.error(`[${ctx.botRow.id}] DM escalation notice failed`, e);
    }
    return;
  }

  const aiEmbed = new EmbedBuilder()
    .setAuthor({ name: 'AI Assistant' })
    .setDescription(data.reply)
    .setColor(0x9b59b6)
    .setFooter({ text: 'Automated reply — staff will follow up if needed' })
    .setTimestamp(new Date());
  try { await user.send({ embeds: [aiEmbed] }); } catch {}
  try { await channel.send({ embeds: [aiEmbed] }); } catch {}
  await db.from('ticket_messages').insert({
    ticket_id: ticket.id,
    author_discord_id: 'ai',
    author_username: 'AI Assistant',
    content: data.reply,
    is_staff: true,
  });
}

// Cache messages from selected knowledge channels so the AI has context to draw from.
async function scrapeKnowledgeChannels(ctx) {
  try {
    const { data: guilds } = await db
      .from('guilds').select('guild_id, ai_knowledge_channel_ids')
      .eq('bot_id', ctx.botRow.id);
    for (const g of guilds ?? []) {
      const channelIds = (g.ai_knowledge_channel_ids ?? []).slice(0, 4);
      if (channelIds.length === 0) continue;
      const guild = await ctx.client.guilds.fetch(g.guild_id).catch(() => null);
      if (!guild) continue;
      for (const cid of channelIds) {
        const ch = await guild.channels.fetch(cid).catch(() => null);
        if (!ch || !ch.isTextBased?.()) continue;
        const messages = await ch.messages.fetch({ limit: 50 }).catch(() => null);
        if (!messages) continue;
        const rows = [...messages.values()]
          .filter((m) => !m.author.bot && (m.content || '').trim())
          .map((m) => ({
            bot_id: ctx.botRow.id,
            guild_id: g.guild_id,
            channel_id: cid,
            message_id: m.id,
            author_username: m.author.username,
            content: m.content.slice(0, 2000),
            created_at: new Date(m.createdTimestamp).toISOString(),
          }));
        if (rows.length === 0) continue;
        const { error } = await db
          .from('ai_knowledge_messages')
          .upsert(rows, { onConflict: 'channel_id,message_id', ignoreDuplicates: true });
        if (error) console.error(`[${ctx.botRow.id}] knowledge upsert`, error);
      }
    }
  } catch (e) {
    console.error(`[${ctx.botRow.id}] scrapeKnowledgeChannels`, e);
  }
}

// ========== Per-bot handlers ==========
function attachHandlers(ctx) {
  const { client } = ctx;

  client.on('messageCreate', async (msg) => {
    try {
      if (msg.author.bot) return;

      // --- DM from a user ---
      if (msg.channel.type === ChannelType.DM) {
        const cfg = await getFirstGuildConfig(ctx);
        if (!cfg || !cfg.modmail_category_id) {
          await msg.reply('Modmail is not configured yet. Please try again later.');
          return;
        }
        const guild = await client.guilds.fetch(cfg.guild_id).catch(() => null);
        if (!guild) { await msg.reply('Modmail server unavailable.'); return; }

        let ticket = await findOpenTicketByUser(ctx, msg.author.id);
        let channel = ticket?.channel_id
          ? await guild.channels.fetch(ticket.channel_id).catch(() => null)
          : null;

        const files = [...msg.attachments.values()].map((a) => a.url);

        if (!channel) {
          const categories = await getCategories(ctx, cfg.guild_id);

          if (categories.length > 0) {
            if (ctx.pendingDMs.has(msg.author.id)) {
              try { await msg.react('⌛'); } catch {}
              return;
            }
            const select = new StringSelectMenuBuilder()
              .setCustomId(`cat:${cfg.guild_id}`)
              .setPlaceholder('Choose a category…')
              .addOptions(
                categories.slice(0, 25).map((c) => {
                  const opt = {
                    label: c.name.slice(0, 100),
                    value: c.id,
                  };
                  if (c.description) opt.description = c.description.slice(0, 100);
                  if (c.emoji) opt.emoji = c.emoji;
                  return opt;
                }),
              );
            const row = new ActionRowBuilder().addComponents(select);
            const promptEmbed = new EmbedBuilder()
              .setTitle('Open a ticket')
              .setDescription('Pick the category that best fits your message. Your original message will be sent to staff once you choose.')
              .setColor(0x5865f2);

            await msg.author.send({ embeds: [promptEmbed], components: [row] });

            const timer = setTimeout(() => ctx.pendingDMs.delete(msg.author.id), 10 * 60_000);
            ctx.pendingDMs.set(msg.author.id, {
              content: msg.content, files, cfg, timer,
            });
            try { await msg.react('📋'); } catch {}
            return;
          }

          const created = await createTicketChannel(ctx, cfg, guild, msg.author, null);
          if (!created) return;
          ticket = created.ticket;
          channel = created.channel;
        }

        await relayUserMessageToChannel(channel, msg.author, msg.content, files);
        await logMessage(ticket.id, msg.author, msg.content, false);
        try { await msg.react(cfg.confirmation_emoji || '✅'); } catch {}

        // Try AI auto-reply (if enabled & running) — only when last reply wasn't from staff
        if (cfg.ai_enabled && cfg.ai_running) {
          tryAiReply(ctx, cfg, ticket, channel, msg.author, msg.content).catch((e) =>
            console.error(`[${ctx.botRow.id}] tryAiReply`, e)
          );
        }
        return;
      }

      // --- Staff message in guild ---
      if (msg.channel.type === ChannelType.GuildText && msg.channel.parentId) {
        const ticket = await findOpenTicketByChannel(ctx, msg.channel.id);
        if (!ticket) return;
        const cfg = await getGuildConfig(ctx, msg.guild.id);
        if (!cfg) return;

        if (cfg.staff_role_id) {
          const member = await msg.guild.members.fetch(msg.author.id).catch(() => null);
          if (!member?.roles.cache.has(cfg.staff_role_id)) return;
        }

        const content = msg.content.trim();

        const sendStaffReply = async (text, attachmentUrls = []) => {
          const user = await client.users.fetch(ticket.user_discord_id).catch(() => null);
          if (!user) { await msg.channel.send('Could not reach the user.'); return; }
          const replyEmbed = new EmbedBuilder()
            .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() })
            .setDescription(text || '*(no text)*')
            .setColor(0x57f287)
            .setFooter({ text: 'Staff reply' })
            .setTimestamp(new Date());
          try {
            await user.send({ embeds: [replyEmbed], files: attachmentUrls });
            await msg.channel.send({ embeds: [replyEmbed], files: attachmentUrls });
            await logMessage(ticket.id, msg.author, text, true);
            try { await msg.delete(); } catch {}
          } catch (e) {
            await msg.channel.send(`Could not DM the user: ${e.message}`);
          }
        };

        if (content.toLowerCase().startsWith('?reply')) {
          let text = content.slice(6).trim();
          if ((text.startsWith('"') && text.endsWith('"')) ||
              (text.startsWith("'") && text.endsWith("'"))) {
            text = text.slice(1, -1).trim();
          }
          if (!text && msg.attachments.size === 0) {
            await msg.reply('Usage: `?reply <message>`');
            return;
          }
          const files = [...msg.attachments.values()].map((a) => a.url);
          await sendStaffReply(text, files);
          return;
        }

        if (content.toLowerCase().startsWith('?close')) {
          const reason = content.slice(6).trim();
          const user = await client.users.fetch(ticket.user_discord_id).catch(() => null);
          if (user) {
            const closeEmbed = new EmbedBuilder()
              .setTitle('Ticket closed')
              .setDescription(reason ? `${cfg.close_message}\n\n**Reason:** ${reason}` : cfg.close_message)
              .setColor(0xed4245)
              .setTimestamp(new Date());
            try { await user.send({ embeds: [closeEmbed] }); } catch {}
          }
          await db.from('tickets').update({
            status: 'closed',
            closed_at: new Date().toISOString(),
            closed_by_discord_id: msg.author.id,
            closed_by_username: msg.author.username ?? msg.author.tag ?? null,
          }).eq('id', ticket.id);

          // Post transcript link in log channel
          if (cfg.log_channel_id) {
            try {
              const logCh = await msg.guild.channels.fetch(cfg.log_channel_id).catch(() => null);
              if (logCh) {
                const logEmbed = new EmbedBuilder()
                  .setTitle('Ticket closed')
                  .setColor(0xed4245)
                  .addFields(
                    { name: 'User', value: `<@${ticket.user_discord_id}>`, inline: true },
                    { name: 'Closed by', value: `<@${msg.author.id}>`, inline: true },
                    { name: 'Category', value: ticket.category_name || 'None', inline: true },
                    { name: 'Reason', value: reason || '*(none)*' },
                    { name: 'Transcript', value: transcriptUrl(ticket.id) },
                  )
                  .setTimestamp(new Date());
                await logCh.send({ embeds: [logEmbed] });
              }
            } catch (e) { console.error(`[${ctx.botRow.id}] log post failed`, e); }
          }

          await msg.reply('Closing ticket in 5s…');
          setTimeout(() => msg.channel.delete().catch(() => {}), 5000);
          return;
        }

        if (!content.startsWith('?')) {
          const files = [...msg.attachments.values()].map((a) => a.url);
          await sendStaffReply(content, files);
          return;
        }
      }
    } catch (err) {
      console.error(`[${ctx.botRow.id}] messageCreate`, err);
    }
  });

  client.on('interactionCreate', async (interaction) => {
    try {
      if (!interaction.isStringSelectMenu()) return;
      if (!interaction.customId.startsWith('cat:')) return;

      const guildId = interaction.customId.slice(4);
      const categoryId = interaction.values[0];

      // Acknowledge immediately so Discord doesn't show "This interaction failed".
      let acked = false;
      try {
        await interaction.deferUpdate();
        acked = true;
      } catch (e) {
        console.error(`[${ctx.botRow.id}] deferUpdate failed`, e);
      }
      const safeFollowUp = async (content) => {
        try {
          if (acked) await interaction.followUp({ content, ephemeral: true });
          else await interaction.reply({ content, ephemeral: true });
        } catch (err) {
          console.error(`[${ctx.botRow.id}] followUp failed`, err);
          try { await interaction.user.send(content); } catch {}
        }
      };

      const cfg = await getGuildConfig(ctx, guildId);
      if (!cfg) {
        await safeFollowUp('This bot is no longer configured for that server.');
        return;
      }
      const guild = await client.guilds.fetch(cfg.guild_id).catch(() => null);
      if (!guild) {
        await safeFollowUp('Server unavailable.');
        return;
      }

      const { data: category, error: catErr } = await db
        .from('ticket_categories').select('*').eq('id', categoryId).maybeSingle();
      if (catErr) console.error(`[${ctx.botRow.id}] fetch category`, catErr);

      const pending = ctx.pendingDMs.get(interaction.user.id);
      if (pending?.timer) clearTimeout(pending.timer);
      ctx.pendingDMs.delete(interaction.user.id);

      let ticket = await findOpenTicketByUser(ctx, interaction.user.id);
      let channel = ticket?.channel_id
        ? await guild.channels.fetch(ticket.channel_id).catch(() => null)
        : null;

      if (!channel) {
        const created = await createTicketChannel(ctx, cfg, guild, interaction.user, category ?? null);
        if (!created) {
          try { await interaction.followUp({ content: 'Could not open a ticket. Try again in a moment.', ephemeral: true }); } catch {}
          return;
        }
        ticket = created.ticket;
        channel = created.channel;
      }

      if (pending) {
        await relayUserMessageToChannel(channel, interaction.user, pending.content, pending.files);
        await logMessage(ticket.id, interaction.user, pending.content, false);
        if (cfg.ai_enabled && cfg.ai_running) {
          tryAiReply(ctx, cfg, ticket, channel, interaction.user, pending.content).catch((e) =>
            console.error(`[${ctx.botRow.id}] tryAiReply (pending)`, e)
          );
        }
      }

      try {
        const doneEmbed = new EmbedBuilder()
          .setTitle('Ticket opened')
          .setDescription(`Category: **${category?.emoji ? `${category.emoji} ` : ''}${category?.name ?? 'General'}**\n\nA staff member will be with you shortly. Keep replying here to send more messages.`)
          .setColor(0x57f287);
        await interaction.editReply({ embeds: [doneEmbed], components: [] });
      } catch (e) {
        console.error(`[${ctx.botRow.id}] editReply`, e);
        try { await interaction.user.send({ content: '✅ Ticket opened. Keep replying here to send more messages.' }); } catch {}
      }
    } catch (err) {
      console.error(`[${ctx.botRow.id}] interactionCreate`, err);
    }
  });

  client.on('error', (err) => console.error(`[${ctx.botRow.id}] client error`, err));
  client.on('shardError', (err) => console.error(`[${ctx.botRow.id}] shard error`, err));

  client.once('ready', () => {
    ctx.status = 'ready';
    console.log(`[${ctx.botRow.id}] logged in as ${client.user.tag}`);
  });
}

async function startBot(row) {
  const ctx = {
    botRow: row,
    client: null,
    pendingDMs: new Map(),
    status: 'starting',
    retryAt: 0,
  };
  workers.set(row.id, ctx);

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel, Partials.Message],
  });
  ctx.client = client;
  attachHandlers(ctx);

  try {
    await client.login(row.bot_token);
    console.log(`[${row.id}] login ok (${row.bot_name ?? 'unnamed'})`);
  } catch (err) {
    const m = err?.message || String(err);
    console.error(`[${row.id}] login failed: ${m}`);
    if (/disallowed intents/i.test(m)) {
      console.error(`[${row.id}] Enable "Message Content" and "Server Members" privileged intents in the Discord Developer Portal.`);
    }
    try { client.destroy(); } catch {}
    ctx.status = 'failed';
    ctx.retryAt = Date.now() + 60_000; // back off failed bots for 60s
  }
}

async function stopBot(id, reason = '') {
  const w = workers.get(id);
  if (!w) return;
  w.status = 'stopping';
  console.log(`[${id}] stopping ${reason}`);
  try { await w.client?.destroy(); } catch {}
  workers.delete(id);
}

async function syncBots() {
  let q = db.from('bots').select('*');
  if (BOT_ID) q = q.eq('id', BOT_ID);
  const { data: rows, error } = await q;
  if (error) { console.error('syncBots fetch', error); return; }

  const seen = new Set();
  for (const row of rows ?? []) {
    seen.add(row.id);
    if (!row.bot_token) continue;

    // Owner can pause the bot from the dashboard.
    if (row.bot_running === false) {
      if (workers.has(row.id)) {
        console.log(`[manager] stopping ${row.id} (paused via dashboard)`);
        await stopBot(row.id, '(paused)');
      }
      continue;
    }

    const existing = workers.get(row.id);
    if (!existing) {
      console.log(`[manager] starting new bot ${row.id} (${row.bot_name ?? 'unnamed'})`);
      startBot(row);
    } else if (existing.status === 'failed' && Date.now() >= existing.retryAt) {
      console.log(`[manager] retrying failed bot ${row.id}`);
      workers.delete(row.id);
      startBot(row);
    } else if (existing.botRow.bot_token !== row.bot_token) {
      console.log(`[manager] token changed for ${row.id}, restarting`);
      await stopBot(row.id, 'token rotated');
      startBot(row);
    } else {
      existing.botRow = row;
    }
  }

  for (const id of [...workers.keys()]) {
    if (!seen.has(id)) await stopBot(id, '(removed from db)');
  }
}

// Periodically scrape selected knowledge channels for every running bot.
async function scrapeAll() {
  for (const ctx of workers.values()) {
    if (ctx.status !== 'ready') continue;
    await scrapeKnowledgeChannels(ctx);
  }
}

process.on('unhandledRejection', (err) => console.error('[unhandledRejection]', err));
process.on('uncaughtException', (err) => console.error('[uncaughtException]', err));

console.log(`[manager] starting (TRANSCRIPT_BASE=${TRANSCRIPT_BASE}${BOT_ID ? `, BOT_ID=${BOT_ID}` : ', all bots'})`);
syncBots();
setInterval(syncBots, 5_000);
setInterval(scrapeAll, 60_000);
// Initial scrape after 20s so clients are ready
setTimeout(scrapeAll, 20_000);
