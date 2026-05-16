import logo from "@/assets/retailpro-logo.jpg";
import { Link } from "react-router-dom";

const DISCORD_URL = "https://discord.gg/v9WuReyWGQ";
const PURCHASE_URL = "https://www.roblox.com/games/74184682387003/RetailPro-Hub-2026";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 bg-background">
      <div className="container">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <img src={logo} alt="RetailPro logo" className="h-8 w-8 rounded-md object-contain" />
              <span className="font-bold text-lg tracking-tight">retailpro</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">
              The communication system built for Roblox retail experiences.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground transition-smooth">Features</a></li>
              <li><a href="/#how" className="hover:text-foreground transition-smooth">How it works</a></li>
              <li><a href={PURCHASE_URL} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-smooth">Purchase</a></li>
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
          <div className="space-y-1">
            <p>© 2026 RetailPro Roblox. All rights reserved. Not affiliated with Roblox Corporation.</p>
            <a href="mailto:support@retailpro.space" className="hover:text-foreground transition-smooth">
              support@retailpro.space
            </a>
          </div>
          <div className="flex gap-6">
            <Link to="/privacy" className="hover:text-foreground transition-smooth">Privacy</Link>
            <Link to="/terms" className="hover:text-foreground transition-smooth">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
