import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

type Ticket = {
  id: string;
  guild_id: string;
  user_discord_id: string;
  status: string;
  category_name: string | null;
  opened_at: string;
  closed_at: string | null;
  closed_by_discord_id: string | null;
  closed_by_username: string | null;
};

type Message = {
  id: string;
  author_discord_id: string;
  author_username: string | null;
  content: string;
  is_staff: boolean;
  created_at: string;
};

export default function Transcript() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ ticket: Ticket; messages: Message[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = id ? `Transcript ${id.slice(0, 8)} · Modmail` : "Transcript";
  }, [id]);

  useEffect(() => {
    if (!id || id.length < 12) {
      setError("Invalid transcript id");
      setLoading(false);
      return;
    }
    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcript?id=${encodeURIComponent(id)}`;
    fetch(url, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error || `HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading transcript…</div>;
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Transcript unavailable</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { ticket, messages } = data;

  const fmt = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto p-6">
        <header className="mb-8 border-b border-border pb-6">
          <h1 className="text-3xl font-semibold">Ticket transcript</h1>
          <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div><span className="text-foreground font-medium">User:</span> {ticket.user_discord_id}</div>
            <div><span className="text-foreground font-medium">Status:</span> {ticket.status}</div>
            <div><span className="text-foreground font-medium">Category:</span> {ticket.category_name ?? "—"}</div>
            <div><span className="text-foreground font-medium">Opened:</span> {fmt(ticket.opened_at)}</div>
            {ticket.closed_at && (
              <div><span className="text-foreground font-medium">Closed:</span> {fmt(ticket.closed_at)}</div>
            )}
            {ticket.closed_by_username && (
              <div><span className="text-foreground font-medium">Closed by:</span> {ticket.closed_by_username}</div>
            )}
            <div className="sm:col-span-2 text-xs opacity-70 break-all">ID: {ticket.id}</div>
          </div>
        </header>

        <main className="space-y-3">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No messages logged.</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg border border-border p-4 ${
                m.is_staff ? "bg-primary/5" : "bg-muted/30"
              }`}
            >
              <div className="flex items-baseline justify-between mb-1 gap-2">
                <div className="font-medium">
                  {m.author_username ?? m.author_discord_id}
                  <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                    m.is_staff ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  }`}>
                    {m.is_staff ? "Staff" : "User"}
                  </span>
                </div>
                <time className="text-xs text-muted-foreground">{fmt(m.created_at)}</time>
              </div>
              <div className="whitespace-pre-wrap text-sm">{m.content || <em className="text-muted-foreground">(no text)</em>}</div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
