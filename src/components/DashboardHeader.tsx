import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const axisItems = [
  { id: "saude-mental", label: "SAÚDE MENTAL" },
  { id: "alimentacao", label: "ALIMENTAÇÃO" },
  { id: "menopausa", label: "MENOPAUSA" },
  { id: "emergentes", label: "EMERGENTES" },
];

type Props = {
  activeAxis?: string;
  onAxisChange?: (id: string) => void;
  lastRefreshed?: string | null;
  activePage?: "briefing" | "guioes" | "mural" | "textos" | "plataforma" | "sobre";
};

const DashboardHeader = ({ activeAxis, onAxisChange, lastRefreshed, activePage }: Props) => {
  const navigate = useNavigate();
  const [eixosOpen, setEixosOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayDate = lastRefreshed ? new Date(lastRefreshed) : new Date();

  const handleAxisClick = (id: string) => {
    if (onAxisChange) {
      onAxisChange(id);
    } else {
      navigate(`/?axis=${id}`);
    }
    setEixosOpen(false);
  };

  const isAxisActive = axisItems.some((a) => a.id === activeAxis);

  // Close dropdown on outside click
  useEffect(() => {
    if (!eixosOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setEixosOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [eixosOpen]);

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



      {/* LINE 2 — OVERVIEW · EIXOS (dropdown) · MURAL · BRIEFING · GUIÕES */}
      <nav className="px-6 py-2 flex items-center gap-2" style={{ borderTop: "1px solid rgba(0,0,255,0.15)", borderBottom: "1px solid rgba(0,0,255,0.15)" }}>
        <div className="flex items-center gap-2 flex-1">
        {/* OVERVIEW */}
        <button
          onClick={() => handleAxisClick("all")}
          className={`nav-link ${activeAxis === "all" ? "nav-link-active" : ""}`}
        >
          OVERVIEW
        </button>
        <span className="text-foreground/20 text-xs font-light">/</span>

        {/* EIXOS dropdown */}
        <div className="relative flex items-center" ref={dropdownRef}>
          <button
            onClick={() => setEixosOpen((prev) => !prev)}
            className={`nav-link ${isAxisActive ? "nav-link-active" : ""}`}
          >
            EIXOS
          </button>
          {eixosOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-50 py-2 px-1 min-w-[160px]"
              style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,255,0.1)" }}
            >
              {axisItems.map((axis) => (
                <button
                  key={axis.id}
                  onClick={() => handleAxisClick(axis.id)}
                  className="block w-full text-left px-3 py-1.5 text-[10px] font-medium tracking-[1.5px] uppercase transition-colors"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: activeAxis === axis.id ? "#0000FF" : "#BBBBC4",
                    background: "transparent",
                    border: "none",
                  }}
                >
                  {axis.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-foreground/20 text-xs font-light">/</span>

        {/* MURAL */}
        <Link to="/mural" className={`nav-link ${activePage === "mural" ? "nav-link-active" : ""}`}>
          MURAL
        </Link>
        <span className="text-foreground/20 text-xs font-light">/</span>

        {/* BRIEFING */}
        <Link to="/briefing" className={`nav-link ${activePage === "briefing" ? "nav-link-active" : ""}`}>
          BRIEFING
        </Link>
        <span className="text-foreground/20 text-xs font-light">/</span>

        {/* GUIÕES */}
        <Link to="/guioes" className={`nav-link ${activePage === "guioes" ? "nav-link-active" : ""}`}>
          GUIÕES
        </Link>
        </div>
        <Link to="/plataforma" className="text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
          Diz que Disse Editorial
        </Link>
      </nav>

      
    </header>
  );
};

export default DashboardHeader;
