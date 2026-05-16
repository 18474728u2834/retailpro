import { Button } from "@/components/ui/button";
import { ArrowRight, Headphones, Mail, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import logo from "@/assets/retailpro-logo.jpg";

const RETAILCONNECT_URL = "https://retailconnect.retailpro.space";
const DISCORD_URL = "https://discord.gg/v9WuReyWGQ";

const RetailProLanding = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/70 border-b border-border/50">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="RetailPro logo" className="h-8 w-8 rounded-md object-contain" />
            <span className="font-bold text-lg tracking-tight">retailpro</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
            <a href="#about" className="hover:text-foreground transition-smooth">About</a>
            <a href="#products" className="hover:text-foreground transition-smooth">Products</a>
            <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-smooth">Support</a>
          </nav>
          <Button asChild size="sm" className="bg-gradient-accent hover:opacity-90 text-accent-foreground border-0">
            <a href="#products">See our Products</a>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 bg-gradient-glow opacity-40 pointer-events-none" />
          <div className="container relative pt-24 pb-20 md:pt-32 md:pb-28">
            <div className="max-w-3xl mx-auto text-center animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-background/60 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Building the future of Roblox retail
              </div>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.05]">
                Premium tools for
                <br />
                <span className="text-gradient">Roblox retail experiences.</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                RetailPro builds professional in-game systems that make Roblox stores feel real — from staff communication to customer service.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild size="lg" className="bg-gradient-accent hover:opacity-90 text-accent-foreground border-0 shadow-glow group">
                  <a href="#products">
                    See our Products
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Join our Discord</a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section id="about" className="py-24 md:py-32">
          <div className="container max-w-3xl text-center">
            <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">About RetailPro</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Real retail, reimagined for Roblox.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              We design and build immersive systems that bring real-world retail technology into Roblox experiences. Our products are used by store roleplay groups, retail simulators and developers who want their stores to feel authentic.
            </p>
          </div>
        </section>

        {/* Products */}
        <section id="products" className="py-24 md:py-32 bg-secondary/50">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Our Products</p>
              <h2 className="text-4xl md:text-5xl font-bold mb-4">See our Products</h2>
              <p className="text-lg text-muted-foreground">
                Explore the systems we've built for the next generation of Roblox stores.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {/* RetailConnect */}
              <a
                href={RETAILCONNECT_URL}
                className="group relative overflow-hidden p-8 rounded-2xl border border-border bg-card hover:shadow-elegant transition-smooth hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-accent text-accent-foreground mb-5 shadow-glow group-hover:scale-110 transition-smooth">
                  <Headphones className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">RetailConnect</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Wireless headsets, BaseUnits, Repeaters and Assistance Points — a complete staff communication system for your Roblox store.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-accent group-hover:gap-2 transition-smooth">
                  Visit RetailConnect
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                </span>
              </a>

              {/* Modmail */}
              <a
                href="https://modmail.retailpro.space"
                className="group relative overflow-hidden p-8 rounded-2xl border border-border bg-card hover:shadow-elegant transition-smooth hover:-translate-y-1"
              >
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-accent text-accent-foreground mb-5 shadow-glow group-hover:scale-110 transition-smooth">
                  <Mail className="h-5 w-5" />
                </div>
                <h3 className="text-2xl font-semibold mb-2">Modmail</h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  Turn member DMs into clean, private staff threads. A Discord modmail bot with slash commands, transcripts, and multi-guild support.
                </p>
                <span className="inline-flex items-center text-sm font-semibold text-accent group-hover:gap-2 transition-smooth">
                  Visit Modmail
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                </span>
              </a>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-24 md:py-32">
          <div className="container">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-dark p-12 md:p-20 text-center text-primary-foreground">
              <div className="absolute inset-0 bg-gradient-glow opacity-50" />
              <div className="relative max-w-2xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to explore?</h2>
                <p className="text-lg text-primary-foreground/70 mb-8">
                  Take a look at everything RetailPro has to offer for your Roblox store.
                </p>
                <Button asChild size="lg" className="bg-gradient-accent hover:opacity-90 text-accent-foreground border-0 shadow-glow group">
                  <a href="#products">
                    See our Products
                    <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-background">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <img src={logo} alt="RetailPro logo" className="h-8 w-8 rounded-md object-contain" />
                <span className="font-bold text-lg tracking-tight">retailpro</span>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm">
                Premium tools for Roblox retail experiences.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Products</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={RETAILCONNECT_URL} className="hover:text-foreground transition-smooth">RetailConnect</a></li>
                <li><a href="https://modmail.retailpro.space" className="hover:text-foreground transition-smooth">Modmail</a></li>
                <li><a href="#products" className="hover:text-foreground transition-smooth">All products</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-smooth">Support (Discord)</a></li>
                <li><Link to="/terms" className="hover:text-foreground transition-smooth">Terms of Service</Link></li>
                <li><Link to="/privacy" className="hover:text-foreground transition-smooth">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2026 RetailPro Roblox. All rights reserved. Not affiliated with Roblox Corporation.</p>
            <a href="#products" className="font-semibold text-foreground hover:text-accent transition-smooth">See our Products →</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default RetailProLanding;
