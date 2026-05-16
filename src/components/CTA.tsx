import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const PURCHASE_URL = "https://www.roblox.com/games/74184682387003/RetailPro-Hub-2026";
const DISCORD_URL = "https://discord.gg/v9WuReyWGQ";

const CTA = () => {
  return (
    <section id="contact" className="py-24 md:py-32">
      <div className="container">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-dark p-12 md:p-20 text-center text-primary-foreground">
          <div className="absolute inset-0 bg-gradient-glow opacity-50" />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Ready to upgrade your store?</h2>
            <p className="text-lg text-primary-foreground/70 mb-8">
              Get RetailConnect on Roblox today and bring real staff communication to your store.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className="bg-gradient-accent hover:opacity-90 text-accent-foreground border-0 shadow-glow group">
                <a href={PURCHASE_URL} target="_blank" rel="noopener noreferrer">
                  Purchase
                  <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-smooth" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className="bg-transparent border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer">Join our Discord</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
