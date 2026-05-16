const stats = [
  { value: "73%", label: "Faster customer response time" },
  { value: "2.4×", label: "More assisted-sale conversions" },
  { value: "500+", label: "Stores using RetailPro" },
  { value: "99.9%", label: "Network uptime" },
];

const Stats = () => {
  return (
    <section className="py-20 bg-gradient-dark text-primary-foreground">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-gradient mb-2">{s.value}</div>
              <div className="text-sm text-primary-foreground/70">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
