// Discord OAuth: handles login (redirect) and callback (token exchange + Supabase session)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const CLIENT_ID = Deno.env.get("DISCORD_CLIENT_ID")!;
const CLIENT_SECRET = Deno.env.get("DISCORD_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "login";
  const redirectOrigin = url.searchParams.get("origin") ?? `${url.protocol}//${url.host}`;
  const redirectUri = `${SUPABASE_URL}/functions/v1/discord-oauth?action=callback`;

  try {
    if (action === "login") {
      const state = encodeURIComponent(redirectOrigin);
      const authUrl = new URL("https://discord.com/api/oauth2/authorize");
      authUrl.searchParams.set("client_id", CLIENT_ID);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("response_type", "code");
      authUrl.searchParams.set("scope", "identify email guilds");
      authUrl.searchParams.set("state", state);
      return Response.redirect(authUrl.toString(), 302);
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const appOrigin = state ? decodeURIComponent(state) : redirectOrigin;
      if (!code) throw new Error("Missing code");

      // Exchange code for token
      const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
          redirect_uri: redirectUri,
        }),
      });
      const tokens = await tokenRes.json();
      if (!tokens.access_token) throw new Error(`Token exchange failed: ${JSON.stringify(tokens)}`);

      // Fetch Discord user
      const userRes = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const dUser = await userRes.json();
      if (!dUser.id) throw new Error("Failed to fetch Discord user");

      const email = dUser.email ?? `${dUser.id}@discord.local`;
      const password = `discord_${dUser.id}_${CLIENT_SECRET.slice(0, 16)}`;
      const meta = {
        discord_id: dUser.id,
        discord_username: dUser.username,
        discord_avatar: dUser.avatar
          ? `https://cdn.discordapp.com/avatars/${dUser.id}/${dUser.avatar}.png`
          : null,
      };

      const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

      // Try sign in; if user doesn't exist, create them
      let { data: signInData, error: signInErr } = await admin.auth.signInWithPassword({ email, password });

      if (signInErr) {
        // Create user with email confirmed
        const { data: created, error: createErr } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: meta,
        });
        if (createErr && !createErr.message.includes("already")) throw createErr;
        // Update existing if needed
        if (createErr?.message.includes("already")) {
          const { data: list } = await admin.auth.admin.listUsers();
          const existing = list.users.find((u) => u.email === email);
          if (existing) {
            await admin.auth.admin.updateUserById(existing.id, { password, user_metadata: meta });
          }
        }
        const retry = await admin.auth.signInWithPassword({ email, password });
        signInData = retry.data;
        signInErr = retry.error;
        if (signInErr) throw signInErr;
      } else {
        // Update metadata
        await admin.auth.admin.updateUserById(signInData.user!.id, { user_metadata: meta });
      }

      // Update profile
      await admin.from("profiles").upsert(
        {
          user_id: signInData.user!.id,
          discord_id: dUser.id,
          discord_username: dUser.username,
          discord_avatar: meta.discord_avatar,
          email,
        },
        { onConflict: "user_id" },
      );

      // Redirect back to app with tokens in hash
      const session = signInData.session!;
      const target = `${appOrigin}/auth/callback#access_token=${session.access_token}&refresh_token=${session.refresh_token}`;
      return Response.redirect(target, 302);
    }

    return new Response("Unknown action", { status: 400, headers: corsHeaders });
  } catch (err) {
    console.error("[discord-oauth]", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
