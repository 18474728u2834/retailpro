CREATE TABLE public.ticket_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bot_id uuid NOT NULL,
  guild_id text NOT NULL,
  name text NOT NULL,
  description text,
  emoji text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage ticket_categories"
ON public.ticket_categories
FOR ALL
USING (public.owns_bot(bot_id))
WITH CHECK (public.owns_bot(bot_id));

CREATE TRIGGER update_ticket_categories_updated_at
BEFORE UPDATE ON public.ticket_categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_ticket_categories_bot_guild ON public.ticket_categories(bot_id, guild_id);

ALTER TABLE public.tickets ADD COLUMN category_id uuid;
ALTER TABLE public.tickets ADD COLUMN category_name text;