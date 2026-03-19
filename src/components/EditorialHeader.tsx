import { Link, useLocation } from "react-router-dom";

/* ── Linha 1: REPORTAGEM VIVA + BENCHMARK | PLATAFORMA | SOBRE ── */
const NAV_ITEMS = [
  { label: "Benchmark",  path: "/editorial/benchmark" },
  { label: "Plataforma", path: "/plataforma" },
  { label: "Sobre",      path: "/sobre" },
];

/* ── Linha 2: GUIÕES | REVISÃO DE PARES | TEXTOS | BOOKMARKS ── */
const SUB_NAV_ITEMS = [
  { label: "Guiões",           path: "/editorial/guioes" },
  { label: "Revisão de Pares", path: "/revisao-pares" },
  { label: "Textos",           path: "/textos" },
  { label: "Bookmarks",        path: "/editorial/bookmarks" },
];

const borderStyle = "1px solid rgba(0,0,255,0.15)";

const EditorialHeader = () => {
  const { pathname } = useLocation();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="w-full">
      {/* Branding */}
      <div className="px-6 py-5">
        <p className="text-lg font-bold tracking-[0.05em] uppercase">Diz que Disse</p>
        <p className="editorial-label mt-1" style={{ opacity: 0.5 }}>
          Serviço Nacional de Literacia em Saúde
        </p>
      </div>

      {/* Linha 1 — nav principal */}
      <nav
        className="px-6 py-2.5 flex items-center justify-between"
        style={{ borderTop: borderStyle, borderBottom: borderStyle }}
      >
        <Link
          to="/"
          className="text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity"
        >
          Reportagem Viva
        </Link>
        <div className="flex items-center gap-4">
          {NAV_ITEMS.map((item, i) => (
            <span key={item.path} className="flex items-center gap-4">
              {i > 0 && (
                <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>/</span>
              )}
              <Link
                to={item.path}
                className={`nav-link ${isActive(item.path) ? "nav-link-active" : ""}`}
              >
                {item.label}
              </Link>
            </span>
          ))}
        </div>
      </nav>

      {/* Linha 2 — sub-nav editorial */}
      <nav
        className="px-6 py-2.5 flex items-center justify-end gap-4"
        style={{ borderBottom: borderStyle }}
      >
        {SUB_NAV_ITEMS.map((item, i) => (
          <span key={item.path} className="flex items-center gap-4">
            {i > 0 && (
              <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>/</span>
            )}
            <Link
              to={item.path}
              className={`nav-link ${isActive(item.path) ? "nav-link-active" : ""}`}
              style={
                isActive(item.path)
                  ? { textDecoration: "underline", textUnderlineOffset: "4px" }
                  : {}
              }
            >
              {item.label}
            </Link>
          </span>
        ))}
      </nav>
    </header>
  );
};

export default EditorialHeader;
