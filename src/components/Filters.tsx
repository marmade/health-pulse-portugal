import { useState } from "react";

type Props = {
  onFilterChange: (filters: { period: string; region: string }) => void;
};

const periods = [
  { id: "7d", label: "7 DIAS" },
  { id: "30d", label: "30 DIAS" },
  { id: "12m", label: "12 MESES" },
];

const regions = [
  { id: "pt", label: "PORTUGAL" },
  { id: "norte", label: "NORTE" },
  { id: "centro", label: "CENTRO" },
  { id: "lisboa", label: "LISBOA" },
  { id: "sul", label: "SUL" },
];

const Filters = ({ onFilterChange }: Props) => {
  const [activePeriod, setActivePeriod] = useState("12m");
  const [activeRegion, setActiveRegion] = useState("pt");

  const handlePeriod = (id: string) => {
    setActivePeriod(id);
    onFilterChange({ period: id, region: activeRegion });
  };

  const handleRegion = (id: string) => {
    setActiveRegion(id);
    onFilterChange({ period: activePeriod, region: id });
  };

  return (
    <div className="flex items-center gap-6">
      <div className="flex items-center gap-1">
        <span className="editorial-label mr-2">Período</span>
        {periods.map((p) => (
          <button
            key={p.id}
            onClick={() => handlePeriod(p.id)}
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 border transition-colors ${
              activePeriod === p.id
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/20 text-foreground/40 hover:text-foreground hover:border-foreground"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <span className="editorial-label mr-2">Região</span>
        {regions.map((r) => (
          <button
            key={r.id}
            onClick={() => handleRegion(r.id)}
            className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 border transition-colors ${
              activeRegion === r.id
                ? "border-foreground bg-foreground text-background"
                : "border-foreground/20 text-foreground/40 hover:text-foreground hover:border-foreground"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Filters;
