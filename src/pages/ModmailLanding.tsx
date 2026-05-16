import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, MessageSquare, Shield, Zap, Users, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

const features = [
  {
    icon: MessageSquare,
    title: "Threaded Tickets",
    description: "DMs are converted into private staff channels so your team can collaborate without losing context.",
  },
  {
    icon: Shield,
    title: "Role-based Access",
    description: "Bind Discord roles to staff permissions. Only the right people see the right tickets.",
  },
  {
    icon: Zap,
    title: "Slash Commands",
    description: "Open, claim, close, and snooze tickets directly from Discord with low-latency interactions.",
  },
  {
    icon: Users,
    title: "Multi-Guild Ready",
    description: "Run one bot across as many servers as you need — each guild gets its own configuration.",
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "All data is encrypted at rest. Tokens never leave the secure backend, ever.",
  },
  {
    icon: Bot,
    title: "Bring Your Own Bot",
    description: "Use your own Discord application — your branding, your bot, our infrastructure.",
  },
];

const steps = [
  "Sign in with Discord",
  "Add your bot's application credentials",
  "Copy your interactions endpoint into Discord",
  "Invite the bot and start handling tickets",
];

const ModmailLanding = () => {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Modmail — Discord support tickets, simplified";
    const desc = "A modern modmail bot for Discord. Convert DMs into staff threads, manage tickets with slash commands, and ship support faster.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="container mx-auto flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-accent flex items-center justify-center">
              <Bot className="h-5 w-5 text-accent-foreground" />
            </div>
            <span className="font-bold text-lg">Modmail</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-smooth">Features</a>
            <a href="#how" className="hover:text-foreground transition-smooth">How it works</a>
            <a href="#pricing" className="hover:text-foreground transition-smooth">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="bg-gradient-accent hover:opacity-90">
                  <Link to="/login">Get started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="container mx-auto px-4 py-24 md:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-background/50 text-xs font-medium text-muted-foreground mb-8 animate-fade-up">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
            Now in early access
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-up">
            Discord support, <br />
            <span className="text-gradient">done right.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-up">
            Turn member DMs into clean, private staff threads. Triage faster, collaborate
            better, and never lose a ticket again.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up">
            <Button asChild size="lg" className="bg-gradient-accent hover:opacity-90 shadow-glow">
              <Link to="/login">
                Start free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how">See how it works</a>
            </Button>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-glow opacity-40 pointer-events-none" />
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything you need to run support</h2>
            <p className="text-muted-foreground text-lg">
              Built for community managers who care about response time and member experience.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="border-border/60 hover:shadow-elegant transition-smooth hover:-translate-y-1">
                <CardHeader>
                  <div className="h-11 w-11 rounded-xl bg-gradient-accent flex items-center justify-center mb-3">
                    <f.icon className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <CardTitle className="text-xl">{f.title}</CardTitle>
                  <CardDescription className="text-base">{f.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="py-24 bg-secondary/40 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Live in under 5 minutes</h2>
            <p className="text-muted-foreground text-lg">
              No infrastructure to manage. Bring your bot, we handle the rest.
            </p>
          </div>
          <div className="max-w-2xl mx-auto space-y-4">
            {steps.map((step, i) => (
              <div key={step} className="flex items-center gap-4 p-5 rounded-2xl bg-background border border-border shadow-soft">
                <div className="h-10 w-10 rounded-full bg-gradient-accent flex items-center justify-center text-accent-foreground font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-lg font-medium">{step}</span>
                <CheckCircle2 className="ml-auto h-5 w-5 text-accent" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="py-24">
        <div className="container mx-auto px-4">
          <div className="relative rounded-3xl bg-gradient-dark p-12 md:p-16 text-center overflow-hidden shadow-elegant">
            <div className="absolute inset-0 bg-gradient-glow opacity-50" />
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
                Ready to upgrade your support?
              </h2>
              <p className="text-primary-foreground/70 text-lg max-w-xl mx-auto mb-8">
                Free during early access. No credit card required.
              </p>
              <Button asChild size="lg" className="bg-background text-foreground hover:bg-background/90">
                <Link to="/login">
                  Get started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-md bg-gradient-accent flex items-center justify-center">
              <Bot className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="font-semibold">Modmail</span>
            <span className="text-muted-foreground text-sm">— a RetailPro product</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground transition-smooth">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground transition-smooth">Privacy</Link>
            <a href="https://retailpro.space" className="hover:text-foreground transition-smooth">RetailPro</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ModmailLanding;
