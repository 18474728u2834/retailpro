# Modmail Gateway Bot

Always-on Discord bot that opens a ticket when a user **DMs the bot** (no commands required).
Staff reply with `?reply <text>` and close with `?close` or `?close <reason>` inside the ticket channel.

Shares the same database as the Lovable dashboard.

## Deploy on Railway

1. Push this repo to GitHub (the `bot/` folder works as a standalone service — point Railway's
   "Root Directory" at `bot`).
2. On [railway.app](https://railway.app) → **New Project → Deploy from GitHub** → pick the repo.
3. In the service **Settings → Root Directory**, set `bot`.
4. In **Variables**, add:
   - `DISCORD_BOT_TOKEN` — your bot token (same one in the dashboard)
   - `SUPABASE_URL` — `https://wgubtalkareywkwitktb.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` — from Lovable Cloud backend settings
   - `BOT_ID` *(optional)* — the `bots.id` UUID this worker should serve
5. Deploy. Logs should show `Logged in as <bot>#0000`.

## Discord developer portal

Enable these **Privileged Gateway Intents** on the bot:
- `MESSAGE CONTENT INTENT` ✅
- `SERVER MEMBERS INTENT` ✅ (recommended)
- `DIRECT MESSAGES` is non-privileged but DMs to the bot must be allowed in the user's settings.

## Behaviour

- **User DMs the bot** → bot creates a private channel under the configured Modmail Category,
  pings the support role, posts the user's message, and DMs them the welcome message + ✅ react.
- **User sends more DMs** → relayed into the same ticket channel.
- **Staff `?reply <text>`** in the ticket channel → DM'd to the user as a rich embed with staff
  name + avatar; staff message gets a ✅ confirmation react.
- **Staff `?close [reason]`** → DMs close message (with reason if given), marks ticket closed,
  deletes the channel after 5s.
