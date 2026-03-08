import { Link, useNavigate } from "react-router-dom";

const axes = [
  { id: "all", label: "OVERVIEW" },
  { id: "saude-mental", label: "SAÚDE MENTAL" },
  { id: "alimentacao", label: "ALIMENTAÇÃO" },
  { id: "menopausa", label: "MENOPAUSA" },
  { id: "emergentes", label: "EMERGENTES" },
];

type Props = {
  activeAxis?: string;
  onAxisChange?: (id: string) => void;
  lastRefreshed?: string | null;
  /** Highlights this page link in the nav */
  activePage?: "briefing" | "guioes" | "textos" | "sobre";
};

const DashboardHeader = ({ activeAxis, onAxisChange, lastRefreshed, activePage }: Props) => {
  const navigate = useNavigate();
  const displayDate = lastRefreshed
    ? new Date(lastRefreshed)
    : new Date();

  const handleAxisClick = (id: string) => {
    if (onAxisChange) {
      onAxisChange(id);
    } else {
      navigate(`/?axis=${id}`);
    }
  };

  return (
    <header className="w-full">
      <div className="px-6 py-5">
        <div className="flex items-baseline justify-between">
          <div>
            <Link to="/" className="text-lg font-bold tracking-[0.05em] uppercase hover:opacity-70 transition-opacity">
              Reportagem Viva
            </Link>
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
        <Link
          to="/guioes"
          className={`nav-link ${activePage === "guioes" ? "nav-link-active" : ""}`}
        >
          Guiões
        </Link>
        <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
        <Link
          to="/textos"
          className={`nav-link ${activePage === "textos" ? "nav-link-active" : ""}`}
        >
          Textos
        </Link>
        <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
        <Link
          to="/sobre"
          className={`nav-link ${activePage === "sobre" ? "nav-link-active" : ""}`}
        >
          Sobre
        </Link>
      </nav>

      <div className="section-divider" />

      {/* LINE 2 — Dashboard axis links + Briefing */}
      <nav className="px-6 py-3 flex items-center gap-2">
        {axes.map((axis) => (
          <span key={axis.id} className="flex items-center gap-2">
            <button
              onClick={() => handleAxisClick(axis.id)}
              className={`nav-link ${activeAxis === axis.id ? "nav-link-active" : ""}`}
            >
              {axis.label}
            </button>
            <span className="text-foreground/20 text-xs font-light">/</span>
          </span>
        ))}
        <Link
          to="/briefing"
          className={`nav-link ${activePage === "briefing" ? "nav-link-active" : ""}`}
        >
          BRIEFING
        </Link>
      </nav>

      <div className="section-divider" />
    </header>
  );
};

export default DashboardHeader;
