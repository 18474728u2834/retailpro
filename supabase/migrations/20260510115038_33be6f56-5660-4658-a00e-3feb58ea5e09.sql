
ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS welcome_message text NOT NULL DEFAULT 'Hi! Thanks for reaching out. A staff member will be with you shortly.',
  ADD COLUMN IF NOT EXISTS close_message text NOT NULL DEFAULT 'Your ticket has been closed. Feel free to message us again if you need anything.',
  ADD COLUMN IF NOT EXISTS confirmation_emoji text NOT NULL DEFAULT '✅';

CREATE UNIQUE INDEX IF NOT EXISTS guilds_bot_id_guild_id_key ON public.guilds(bot_id, guild_id);
