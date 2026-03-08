import { Link, useNavigate } from "react-router-dom";

const axes = [
  { id: "all", label: "OVERVIEW" },
  { id: "saude-mental", label: "SAÚDE MENTAL" },
  { id: "alimentacao", label: "ALIMENTAÇÃO" },
  { id: "menopausa", label: "MENOPAUSA" },
  { id: "emergentes", label: "EMERGENTES" },
];

type Props = {
  activeAxis: string;
  onAxisChange: (id: string) => void;
  lastRefreshed?: string | null;
};

const DashboardHeader = ({ activeAxis, onAxisChange, lastRefreshed }: Props) => {
  const navigate = useNavigate();
  const displayDate = lastRefreshed
    ? new Date(lastRefreshed)
    : new Date();

  return (
    <header className="w-full">
      <div className="px-6 py-5">
        <div className="flex items-baseline justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-[0.05em] uppercase">
              Reportagem Viva
            </h1>
            <p className="editorial-label mt-1">
              Monitorização de Tendências sobre Saúde em Portugal
            </p>
          </div>
          <div className="text-right">
            <p className="editorial-label">
              {lastRefreshed ? "Actualizado" : "Última atualização"}
            </p>
            <p className="text-xs font-medium mt-0.5">
              {displayDate.toLocaleDateString("pt-PT", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
              {" — "}
              {displayDate.toLocaleTimeString("pt-PT", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      </div>
      <div className="section-divider" />

      {/* LINE 1 — Editorial links (right-aligned, smaller) */}
      <nav className="px-6 py-2 flex justify-end items-center gap-4">
        <Link to="/textos" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/40 hover:text-foreground transition-colors">
          Textos
        </Link>
        <span className="text-foreground/15 text-[10px]">|</span>
        <Link to="/sobre" className="text-[10px] font-semibold uppercase tracking-[0.15em] text-foreground/40 hover:text-foreground transition-colors">
          Sobre
        </Link>
      </nav>

      <div className="section-divider" />

      {/* LINE 2 — Dashboard axis links */}
      <nav className="px-6 py-3 flex items-center gap-2">
        {axes.map((axis) => (
          <span key={axis.id} className="flex items-center gap-2">
            <button
              onClick={() => onAxisChange(axis.id)}
              className={`nav-link ${activeAxis === axis.id ? "nav-link-active" : ""}`}
            >
              {axis.label}
            </button>
            <span className="text-foreground/20 text-xs font-light">/</span>
          </span>
        ))}
        <Link
          to="/briefing"
          className="nav-link"
        >
          BRIEFING
        </Link>
      </nav>

      <div className="section-divider" />
    </header>
  );
};

export default DashboardHeader;
