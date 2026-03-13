import { Link } from "react-router-dom";
import BenchmarkPage from "./Benchmark";

const BenchmarkWrapper = () => (
  <div className="min-h-screen bg-background text-foreground">
    <header className="w-full">
      <div className="px-6 py-5">
        <p className="text-lg font-bold tracking-[0.05em] uppercase">Diz que Disse</p>
        <p className="editorial-label mt-1" style={{ opacity: 0.5 }}>Serviço Nacional de Literacia em Saúde</p>
      </div>
      <nav className="px-6 py-2 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,255,0.15)", borderBottom: "1px solid rgba(0,0,255,0.15)" }}>
        <Link to="/" className="text-[10px] font-bold tracking-[0.15em] uppercase hover:opacity-70 transition-opacity">
          Reportagem Viva
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/editorial/bookmarks" className="nav-link">Bookmarks</Link>
          <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
          <Link to="/editorial/benchmark" className="nav-link nav-link-active">Benchmark</Link>
          <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
          <Link to="/textos" className="nav-link">Textos</Link>
          <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
          <Link to="/plataforma" className="nav-link">Plataforma</Link>
          <span className="text-[10px]" style={{ color: "#0000FF", opacity: 0.2 }}>|</span>
          <Link to="/sobre" className="nav-link">Sobre</Link>
        </div>
      </nav>
    </header>

    <section className="px-6 pt-12 pb-6">
      <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
        Benchmark
      </h1>
      <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
        Mapeamento do ecossistema
      </p>
    </section>

    <section className="px-6 pb-16">
      <BenchmarkPage />
    </section>
  </div>
);

export default BenchmarkWrapper;
