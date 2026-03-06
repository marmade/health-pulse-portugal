const DashboardFooter = () => {
  return (
    <footer className="w-full mt-auto">
      <div className="section-divider" />
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <p className="editorial-label">Data Sources</p>
          <p className="text-[10px] font-medium mt-0.5 text-foreground/60">
            Google Trends / Google Analytics
          </p>
        </div>
        <button className="text-[10px] font-bold uppercase tracking-[0.15em] border border-foreground px-4 py-2 hover:bg-foreground hover:text-background transition-colors">
          Exportar Report PDF
        </button>
      </div>
    </footer>
  );
};

export default DashboardFooter;
