const steps = [
  { num: "01", title: "Customer presses for assistance", desc: "A shopper taps the call point in any aisle. The system instantly identifies the location." },
  { num: "02", title: "Nearest staff is notified", desc: "Available team members hear a voice prompt directly in their headset within a second." },
  { num: "03", title: "Customer is served, fast", desc: "Staff coordinate hands-free. Shorter waits, better service, more conversions." },
];

const HowItWorks = () => {
  return (
    <section id="how" className="py-24 md:py-32 bg-secondary/50">
      <div className="container">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-sm font-semibold text-accent uppercase tracking-wider mb-3">How it works</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">From tap to served in seconds.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.num} className="relative p-8 rounded-2xl bg-background border border-border shadow-soft">
              <div className="text-6xl font-bold text-gradient mb-4">{s.num}</div>
              <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
