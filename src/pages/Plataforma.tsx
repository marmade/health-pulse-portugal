import DashboardHeader from "@/components/DashboardHeader";

const Plataforma = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader activePage="plataforma" />

      <section className="px-6 pt-12 pb-6">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.04em] uppercase">
          Plataforma
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
          Em construção
        </p>
      </section>

      <div className="section-divider" />

      <div className="px-6 py-16 max-w-3xl mx-auto">
        <p className="text-xs font-medium tracking-wide uppercase opacity-40">Em construção.</p>
      </div>

      <div className="py-12" />
    </div>
  );
};

export default Plataforma;
