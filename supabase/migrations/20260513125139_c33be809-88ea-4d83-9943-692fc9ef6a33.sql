ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS closed_by_discord_id TEXT,
  ADD COLUMN IF NOT EXISTS closed_by_username TEXT;