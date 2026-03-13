type Props = {
  filters: { period: string };
  onFilterChange: (filters: { period: string }) => void;
};

const periods = [
  { id: "7d", label: "7 DIAS" },
  { id: "30d", label: "30 DIAS" },
  { id: "12m", label: "12 MESES" },
];

const Filters = ({ filters, onFilterChange }: Props) => {
  const handlePeriod = (id: string) => {
    onFilterChange({ period: id });
  };

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-0.5">
        <span className="text-[8px] font-medium uppercase tracking-[0.2em] text-foreground/50 mr-1.5">Período</span>
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriod(p.id)}
            className={`text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 border transition-colors ${
              filters.period === p.id
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/20 text-foreground/40 hover:text-foreground hover:border-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Filters;
