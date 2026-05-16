import { Button } from "@/components/ui/button";
import logo from "@/assets/retailpro-logo.jpg";
import { Link } from "react-router-dom";

const PURCHASE_URL = "https://www.roblox.com/games/74184682387003/RetailPro-Hub-2026";
const DISCORD_URL = "https://discord.gg/v9WuReyWGQ";

const Navbar = () => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-background/70 border-b border-border/50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="RetailPro logo" className="h-8 w-8 rounded-md object-contain" />
          <span className="font-bold text-lg tracking-tight">retailpro</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="/#product" className="hover:text-foreground transition-smooth">Product</a>
          <a href="/#features" className="hover:text-foreground transition-smooth">Features</a>
          <a href="/#how" className="hover:text-foreground transition-smooth">How it works</a>
          <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-smooth">Support</a>
        </nav>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="bg-gradient-accent hover:opacity-90 text-accent-foreground border-0">
            <a href={PURCHASE_URL} target="_blank" rel="noopener noreferrer">Purchase</a>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
