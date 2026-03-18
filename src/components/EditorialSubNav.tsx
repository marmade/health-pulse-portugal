import { Link, useLocation } from "react-router-dom";

const EDITORIAL_TABS = [
  { id: "guioes",        label: "GUIOES",            path: "/editorial/guioes" },
  { id: "revisao-pares", label: "REVISAO DE PARES",  path: "/editorial/revisao-pares" },
  { id: "textos",        label: "TEXTOS",             path: "/textos" },
  { id: "bookmarks",     label: "BOOKMARKS",          path: "/editorial/bookmarks" },
];

type Props = { activePage?: string };

const EditorialSubNav = ({ activePage }: Props) => {
  const location = useLocation();
  return (
    <nav className="px-6 py-2 flex items-center gap-4 border-b border-foreground/10">
      {EDITORIAL_TABS.map((tab) => {
        const isActive = activePage === tab.id || location.pathname === tab.path;
        return (
          <Link
            key={tab.id}
            to={tab.path}
            className="text-[10px] font-bold uppercase tracking-[0.15em] transition-colors"
            style={{ color: isActive ? "#0000FF" : "rgba(0,0,0,0.35)" }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default EditorialSubNav;
