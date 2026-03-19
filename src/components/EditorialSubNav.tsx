import { Link, useLocation } from "react-router-dom";

const EDITORIAL_TABS = [
  { id: "guioes",        label: "GUIÕES",            path: "/editorial/guioes" },
  { id: "revisao-pares", label: "REVISÃO DE PARES",  path: "/revisao-pares" },
  { id: "textos",        label: "TEXTOS",             path: "/textos" },
  { id: "bookmarks",     label: "BOOKMARKS",          path: "/editorial/bookmarks" },
];

type Props = { activePage?: string };

const EditorialSubNav = ({ activePage }: Props) => {
  const location = useLocation();
  return (
    <nav className="px-6 py-2 flex items-center justify-end gap-4" style={{ borderBottom: "1px solid rgba(0,0,255,0.15)" }}>
      {EDITORIAL_TABS.map((tab, i) => {
        const isActive = activePage === tab.id || location.pathname === tab.path;
        return (
          <>
            {i > 0 && (
              <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
            )}
            <Link
              key={tab.id}
              to={tab.path}
              className="nav-link"
              style={isActive ? { opacity: 1, textDecoration: "underline", textUnderlineOffset: "4px" } : {}}
            >
              {tab.label}
            </Link>
          </>
        );
      })}
    </nav>
  );
};

export default EditorialSubNav;
