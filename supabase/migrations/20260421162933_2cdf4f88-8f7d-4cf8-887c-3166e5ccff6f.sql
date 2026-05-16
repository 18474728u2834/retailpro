
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Profiles (Discord users who log into the dashboard)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  discord_id TEXT UNIQUE,
  discord_username TEXT,
  discord_avatar TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- has_role security definer
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Bots (1 per user)
CREATE TABLE public.bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id TEXT NOT NULL,
  public_key TEXT NOT NULL,
  bot_token TEXT NOT NULL,
  bot_name TEXT,
  avatar_url TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bots ENABLE ROW LEVEL SECURITY;

-- Guilds
CREATE TABLE public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  guild_name TEXT,
  modmail_category_id TEXT,
  log_channel_id TEXT,
  staff_role_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bot_id, guild_id)
);
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;

-- Trials
CREATE TABLE public.trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  discord_id TEXT NOT NULL,
  roblox_username TEXT,
  trial_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  trial_expiration TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.trials ENABLE ROW LEVEL SECURITY;

-- Tickets
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  user_discord_id TEXT NOT NULL,
  channel_id TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Ticket messages
CREATE TABLE public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_discord_id TEXT NOT NULL,
  author_username TEXT,
  content TEXT,
  is_staff BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Role bindings (Vault product -> Discord role)
CREATE TABLE public.role_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID NOT NULL REFERENCES public.bots(id) ON DELETE CASCADE,
  guild_id TEXT NOT NULL,
  vault_product_id TEXT NOT NULL,
  vault_product_name TEXT,
  discord_role_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bot_id, guild_id, vault_product_id)
);
ALTER TABLE public.role_bindings ENABLE ROW LEVEL SECURITY;

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_bots_updated BEFORE UPDATE ON public.bots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_guilds_updated BEFORE UPDATE ON public.guilds FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, discord_id, discord_username, discord_avatar, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'discord_id',
    NEW.raw_user_meta_data->>'discord_username',
    NEW.raw_user_meta_data->>'discord_avatar',
    NEW.email
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS policies

-- profiles
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- user_roles
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- bots
CREATE POLICY "Owners view own bot" ON public.bots FOR SELECT USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners insert own bot" ON public.bots FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owners update own bot" ON public.bots FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Owners delete own bot" ON public.bots FOR DELETE USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(), 'admin'));

-- helper: bot ownership check
CREATE OR REPLACE FUNCTION public.owns_bot(_bot_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bots WHERE id = _bot_id AND owner_user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin')
$$;

-- guilds, trials, tickets, role_bindings — gated by bot ownership
CREATE POLICY "Owners manage guilds" ON public.guilds FOR ALL USING (public.owns_bot(bot_id)) WITH CHECK (public.owns_bot(bot_id));
CREATE POLICY "Owners manage trials" ON public.trials FOR ALL USING (public.owns_bot(bot_id)) WITH CHECK (public.owns_bot(bot_id));
CREATE POLICY "Owners manage tickets" ON public.tickets FOR ALL USING (public.owns_bot(bot_id)) WITH CHECK (public.owns_bot(bot_id));
CREATE POLICY "Owners manage role_bindings" ON public.role_bindings FOR ALL USING (public.owns_bot(bot_id)) WITH CHECK (public.owns_bot(bot_id));

-- ticket_messages — gated through ticket -> bot
CREATE POLICY "Owners view ticket messages" ON public.ticket_messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND public.owns_bot(t.bot_id))
);
CREATE POLICY "Owners insert ticket messages" ON public.ticket_messages FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.tickets t WHERE t.id = ticket_id AND public.owns_bot(t.bot_id))
);

-- Indexes
CREATE INDEX idx_guilds_bot ON public.guilds(bot_id);
CREATE INDEX idx_trials_bot_discord ON public.trials(bot_id, discord_id);
CREATE INDEX idx_tickets_bot ON public.tickets(bot_id);
CREATE INDEX idx_ticket_messages_ticket ON public.ticket_messages(ticket_id);
CREATE INDEX idx_role_bindings_bot ON public.role_bindings(bot_id);
