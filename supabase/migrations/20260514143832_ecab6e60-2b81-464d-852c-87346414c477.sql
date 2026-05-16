
ALTER TABLE public.bots
  ADD COLUMN IF NOT EXISTS bot_running boolean NOT NULL DEFAULT true;

ALTER TABLE public.guilds
  ADD COLUMN IF NOT EXISTS ai_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_running boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_product_rules text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS ai_knowledge_channel_ids text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.ai_knowledge_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL,
  guild_id text NOT NULL,
  channel_id text NOT NULL,
  message_id text NOT NULL,
  author_username text,
  content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel_id, message_id)
);
CREATE INDEX IF NOT EXISTS idx_ai_knowledge_bot_guild ON public.ai_knowledge_messages (bot_id, guild_id);

ALTER TABLE public.ai_knowledge_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage ai_knowledge"
  ON public.ai_knowledge_messages FOR ALL
  USING (public.owns_bot(bot_id))
  WITH CHECK (public.owns_bot(bot_id));

CREATE TABLE IF NOT EXISTS public.ai_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id uuid NOT NULL,
  ticket_id uuid NOT NULL,
  user_message text,
  ai_reply text,
  escalated boolean NOT NULL DEFAULT false,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_replies_ticket ON public.ai_replies (ticket_id);

ALTER TABLE public.ai_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage ai_replies"
  ON public.ai_replies FOR ALL
  USING (public.owns_bot(bot_id))
  WITH CHECK (public.owns_bot(bot_id));
