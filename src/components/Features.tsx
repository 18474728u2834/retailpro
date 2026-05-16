import { Radio, Wifi, Hand, Headphones, BatteryCharging, Power } from "lucide-react";

const features = [
  {
    icon: Radio,
    title: "BaseUnit",
    desc: "The heart of your store's network. Powers all communication between staff. Press the middle button to instantly turn the network OFF — no one can send messages until it's back on.",
  },
  {
    icon: Wifi,
    title: "Repeater",
    desc: "Extends your network across larger stores. If a staff member moves more than 100 studs from the BaseUnit, you'll need a Repeater to keep them connected.",
  },
  {
    icon: Hand,
    title: "Assistance Point",
    desc: "Customers tap the 'Press for assistance' button and your staff are instantly notified of exactly where help is needed in the store.",
  },
  {
    icon: Headphones,
    title: "Wireless Headsets",
    desc: "Staff wear headsets to talk hands-free across the floor. Crystal-clear audio across the entire connected network.",
  },
  {
    icon: BatteryCharging,
    title: "Charging Dock",
    desc: "Multi-bay dock keeps every headset ready to go between shifts. Always topped up, always ready.",
  },
  {
    icon: Power,
    title: "Full Manager Control",
    desc: "Toggle the BaseUnit, manage Repeaters and oversee Assistance Points — give managers full control of communication in your Roblox store.",
  },
];

const Features = () => {
  return (
    <section id="features" className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mb-16">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">Features</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Everything your store team needs.</h2>
          <p className="text-lg text-muted-foreground">
            One unified system for staff communication and customer service — built for Roblox retail.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group p-8 rounded-2xl border border-border bg-card hover:shadow-elegant transition-smooth hover:-translate-y-1"
            >
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-accent text-accent-foreground mb-5 shadow-glow group-hover:scale-110 transition-smooth">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
