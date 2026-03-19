import { Link } from "react-router-dom";
import BenchmarkPage from "./Benchmark";
import EditorialHeader from "@/components/EditorialHeader";

const BenchmarkWrapper = () => (
  <div className="min-h-screen bg-background text-foreground">
    <EditorialHeader />

    <section className="px-6 pt-12 pb-6">
      <h1 className="text-2xl md:text-4xl font-bold tracking-[0.03em] leading-tight">
        Benchmark
      </h1>
      <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
        Práticas de Comunicação
      </p>
    </section>

    <section className="px-6 pb-16">
      <BenchmarkPage />
    </section>
  </div>
);

export default BenchmarkWrapper;
