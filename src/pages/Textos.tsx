import { Link } from "react-router-dom";

const Textos = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="w-full">
        <div className="px-6 py-5 flex items-baseline justify-between">
          <Link to="/" className="text-lg font-bold tracking-[0.05em] uppercase hover:opacity-70 transition-opacity">
            Reportagem Viva
          </Link>
          <Link to="/" className="text-[10px] font-bold uppercase tracking-[0.15em] border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
            ← Dashboard
          </Link>
        </div>
        <div className="section-divider" />
      </header>

      <section className="px-6 py-16 md:py-24">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.04em] uppercase">
          Textos
        </h1>
        <p className="mt-4 text-sm font-medium tracking-wide uppercase opacity-60">
          Em construção.
        </p>
      </section>
    </div>
  );
};

export default Textos;
