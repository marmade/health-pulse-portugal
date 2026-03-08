import { Link } from "react-router-dom";

const Textos = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
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

      {/* Page Title */}
      <section className="px-6 pt-12 pb-6">
        <h1 className="text-3xl md:text-5xl font-bold tracking-[0.04em] uppercase">
          Textos
        </h1>
        <p className="mt-2 text-xs font-medium tracking-[0.15em] uppercase opacity-50">
          Notas de investigação
        </p>
      </section>

      <div className="section-divider" />

      {/* Epígrafe */}
      <section className="px-6 py-16 md:py-24 max-w-3xl mx-auto text-center">
        <blockquote className="text-lg md:text-xl leading-relaxed italic text-foreground">
          "A promoção e protecção da saúde dos povos é essencial
          para o contínuo desenvolvimento económico e social
          e contribui para a melhoria na qualidade da vida
          e para a paz mundial."
        </blockquote>
        <p className="mt-6 text-xs font-medium tracking-[0.1em] uppercase opacity-50">
          — Declaração Alma-Ata, Conferência Internacional sobre Cuidados Primários de Saúde, URSS, 1978
        </p>
      </section>

      <div className="section-divider" />

      {/* TEXTO 1 — A Quote */}
      <article className="px-6 py-12 md:py-16 max-w-3xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Enquadramento
        </p>
        <h2 className="text-2xl md:text-4xl font-bold tracking-[0.02em] mb-10">
          A Quote
        </h2>

        {/* Tema: Conhecimento e Ignorância */}
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Conhecimento e Ignorância
        </p>
        <blockquote className="pl-5 border-l-2 border-foreground/20 mb-4">
          <p className="italic text-foreground leading-relaxed">
            "Ignorance more frequently begets confidence than does knowledge."
          </p>
          <p className="mt-2 text-xs opacity-50">— Charles Darwin, The Descent of Man, 1871</p>
        </blockquote>
        <blockquote className="pl-5 border-l-2 border-foreground/20 mb-10">
          <p className="italic text-foreground leading-relaxed">
            "As pessoas não admitem que não sabem."
          </p>
          <p className="mt-2 text-xs opacity-50">— António Gomes da Costa</p>
        </blockquote>

        {/* Tema: Ciência e Evidência */}
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Ciência e Evidência
        </p>
        <blockquote className="pl-5 border-l-2 border-foreground/20 mb-4">
          <p className="italic text-foreground leading-relaxed">
            "A ciência não se baseia na palavra de ninguém e não se baseia em figuras de autoridade. Baseia-se em provas."
          </p>
          <p className="mt-2 text-xs opacity-50">— David Marçal</p>
        </blockquote>
        <blockquote className="pl-5 border-l-2 border-foreground/20 mb-10">
          <p className="italic text-foreground leading-relaxed">
            "Os seres humanos podem ansiar por certezas absolutas. Porém, a história da ciência ensina-nos que o máximo que podemos esperar são melhoramentos sucessivos da nossa compreensão — a certeza absoluta escapar-nos-á sempre."
          </p>
          <p className="mt-2 text-xs opacity-50">— Carl Sagan, Um Mundo Infestado de Demónios</p>
        </blockquote>

        {/* Tema: Saúde como Direito */}
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Saúde como Direito
        </p>
        <blockquote className="pl-5 border-l-2 border-foreground/20">
          <p className="italic text-foreground leading-relaxed">
            "Todos têm direito à protecção da saúde e o dever de a defender e promover."
          </p>
          <p className="mt-2 text-xs opacity-50">— Constituição da República Portuguesa, Artigo 64.º</p>
        </blockquote>
      </article>

      <div className="section-divider" />

      {/* TEXTO 2 — Infodemia */}
      <article className="px-6 py-12 md:py-16 max-w-3xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Enquadramento
        </p>
        <h2 className="text-2xl md:text-4xl font-bold tracking-[0.02em] mb-4">
          Infodemia
        </h2>
        <p className="text-base md:text-lg font-medium leading-relaxed mb-8 opacity-80">
          Há vinte anos surgiu a palavra "infodemia". Hoje é o ambiente em que vivemos.
        </p>

        <div className="space-y-5 text-sm leading-relaxed opacity-90">
          <p>
            O conceito descreve a circulação acelerada de informação enganosa — alguns factos, misturados com medo, especulação e boatos, amplificados e retransmitidos rapidamente pelas modernas tecnologias de informação, com impacto desproporcional às realidades básicas. Um fenómeno que acompanhou a resposta à SARS, ao terrorismo, e que atingiu o seu pico durante a pandemia de COVID-19.
          </p>
          <p>
            A "pandemia da informação" vem de fontes pouco credíveis e não verificadas que inundam a sociedade. Os meios de comunicação e a internet tornaram-se palco de campanhas de desinformação maciça. Aliado a esta corrente, o conceito de mito constrói uma percepção da realidade que abarca inúmeras crenças e formas de ver o mundo.
          </p>
          <p>
            Quer entre o conceito de mito — algo divulgado como verdade — e de desinformação — como instrumento de manipulação —, encontra-se a mesma convicção profunda, mas sem sustento científico.
          </p>
          <p>
            Num estudo publicado pelo British Medical Journal, Raffael Heiss e a sua equipa defendem a necessidade de regular o universo digital através da moderação e curadoria científica: "Os conselhos médicos tendenciosos ou enganadores partilhados podem causar danos e exigem uma acção coordenada dos governos e das plataformas para proteger o público."
          </p>
        </div>

        <blockquote className="pl-5 border-l-2 border-foreground/20 my-8">
          <p className="italic text-foreground leading-relaxed">
            "Social media use has reshaped the medical landscape. We must recognise the power of this multibillion-pound industry and work to curb the power of viral personal stories over scientific evidence."
          </p>
          <p className="mt-2 text-xs opacity-50">— BMJ, Evidence based medicine in the age of influence, 2025</p>
        </blockquote>

        {/* Referências */}
        <div className="mt-10 pt-6 border-t border-foreground/10">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-3">
            Referências
          </p>
          <ul className="space-y-1.5 text-xs opacity-60">
            <li>
              Rothkopf, D. J. — "When the Buzz Bites Back", <a href="https://www.washingtonpost.com" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">The Washington Post</a>
            </li>
            <li>
              Heiss, R. et al. — BMJ 2025, <a href="https://doi.org/10.1136/bmj.r2545" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Evidence based medicine in the age of influence</a>
            </li>
            <li>
              Fiske, J. — Introdução ao Estudo de Comunicação
            </li>
          </ul>
        </div>
      </article>

      <div className="section-divider" />

      {/* TEXTO 3 — Efeito Dunning-Kruger */}
      <article className="px-6 py-12 md:py-16 max-w-3xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Enquadramento
        </p>
        <h2 className="text-2xl md:text-4xl font-bold tracking-[0.02em] mb-4">
          Efeito Dunning-Kruger
        </h2>
        <p className="text-base md:text-lg font-medium leading-relaxed mb-8 opacity-80">
          As pessoas não admitem que não sabem.
        </p>

        <div className="space-y-5 text-sm leading-relaxed opacity-90">
          <p>
            Vários estudos revelam que o sentimento de confiança cresce mais depressa do que o conhecimento: as pessoas que têm algum conhecimento — em oposição às que têm muito ou não têm nenhum — são também as que têm mais sobreconfiança no seu desempenho.
          </p>
          <p>
            Este excesso de confiança está ligado a uma maior tendência para acreditar em desinformação. Trata-se de um viés cognitivo conhecido como o "efeito Dunning-Kruger": a investigação de David Dunning e Justin Kruger demonstra que, por falta de conhecimento, não existem as competências necessárias para reconhecer aquilo que não se sabe. As pessoas "ignoram a sua ignorância", atribuindo uma sobrevalorização ao seu conhecimento real.
          </p>
          <p>
            É à medida que a aprendizagem progride que surge a capacidade de reconhecer erros passados: é na competência que se ganha consciência das incompetências anteriores.
          </p>
          <p>
            As atitudes negativas em relação à ciência não são partilhadas por quem tem menos conhecimentos, mas sim por quem, tendo algum conhecimento científico, tem uma confiança exacerbada na sua própria compreensão. Mais factos, por vezes, geram mais resistência — especialmente quando o excesso de confiança está associado a uma visão simplista da ciência.
          </p>
        </div>

        {/* Referências */}
        <div className="mt-10 pt-6 border-t border-foreground/10">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-3">
            Referências
          </p>
          <ul className="space-y-1.5 text-xs opacity-60">
            <li>
              Kruger, J. & Dunning, D. (1999) — <a href="https://doi.org/10.1037/0022-3514.77.6.1121" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Unskilled and Unaware of It</a>
            </li>
            <li>
              Francisco, F. & Gonçalves-Sá, J. — <a href="https://doi.org/10.1371/journal.pbio.3002230" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">A little knowledge is a dangerous thing</a>
            </li>
            <li>
              Lackner, S. et al. — <a href="https://doi.org/10.1038/s41562-023-01677-8" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Intermediate levels of scientific knowledge</a>
            </li>
            <li>
              Sá, J. G. & Mendonça, C. (2023) — A importância de saber que não se sabe
            </li>
          </ul>
        </div>
      </article>

      <div className="section-divider" />

      {/* TEXTO 4 — Cuidados de Saúde Primários */}
      <article className="px-6 py-12 md:py-16 max-w-3xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Relevância
        </p>
        <h2 className="text-2xl md:text-4xl font-bold tracking-[0.02em] mb-4">
          Cuidados de Saúde Primários
        </h2>
        <p className="text-base md:text-lg font-medium leading-relaxed mb-8 opacity-80">
          A base de um sistema de saúde acessível e eficaz para todos.
        </p>

        <div className="space-y-5 text-sm leading-relaxed opacity-90">
          <p>
            Os Cuidados de Saúde Primários (CSP) representam a resposta às necessidades de saúde e bem-estar de todos os cidadãos, assegurando que:
          </p>
        </div>

        <blockquote className="pl-5 border-l-2 border-foreground/20 my-6">
          <p className="italic text-foreground leading-relaxed">
            "As pessoas recebem cuidados completos, desde a promoção e prevenção ao tratamento, reabilitação e cuidados paliativos, tão perto quanto possível do seu ambiente diário."
          </p>
          <p className="mt-2 text-xs opacity-50">— OMS, Relatório Mundial da Saúde 2008</p>
        </blockquote>

        <div className="space-y-5 text-sm leading-relaxed opacity-90">
          <p>
            O seu principal objectivo é reduzir a necessidade de recorrer a cuidados mais complexos e a hospitais, optimizando recursos e gerando uma sociedade mais saudável. Esta optimização tende a reduzir desigualdades, actuando na prevenção e controlo de doenças, imunização, saúde materno-infantil, nutrição e fornecimento de medicamentos essenciais.
          </p>
          <p>
            Grande parte dos recursos "são concentrados nos serviços curativos a elevado custo, negligenciando o potencial da prevenção primária e da promoção da saúde que poderiam prevenir até 70% do fardo da doença."
          </p>
        </div>

        <blockquote className="pl-5 border-l-2 border-foreground/20 my-6">
          <p className="italic text-foreground leading-relaxed">
            "As competências de literacia em saúde são fundamentais para encontrar e aceder com sucesso a cuidados de saúde, prevenir doenças, gerir eficazmente os problemas de saúde, compreender as escolhas disponíveis e tomar decisões informadas. A baixa literacia em saúde é um factor de risco para níveis mais altos de hospitalizações, maior uso de atendimento de emergência e mortalidade prematura."
          </p>
          <p className="mt-2 text-xs opacity-50">— Literacia em Ciência e Saúde, Católica Biomedical Research Center</p>
        </blockquote>

        {/* Referências */}
        <div className="mt-10 pt-6 border-t border-foreground/10">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-3">
            Referências
          </p>
          <ul className="space-y-1.5 text-xs opacity-60">
            <li>
              OMS — <a href="https://iris.who.int/bitstream/handle/10665/43949/9789244563731_por.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Relatório Mundial da Saúde 2008, Cuidados de Saúde Primários</a>
            </li>
            <li>
              DGS — <a href="https://www.dgs.pt/documentos-e-publicacoes/manual-de-boas-praticas-literacia-em-saude-capacitacao-dos-profissionais-de-saude-pdf.aspx" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Manual de Boas Práticas: Literacia em Saúde</a>
            </li>
            <li>
              Católica Biomedical Research Center — Literacia em Ciência e Saúde
            </li>
          </ul>
        </div>
      </article>

      <div className="section-divider" />

      {/* TEXTO 5 — Igualdade Social */}
      <article className="px-6 py-12 md:py-16 max-w-3xl mx-auto">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground mb-4">
          Relevância
        </p>
        <h2 className="text-2xl md:text-4xl font-bold tracking-[0.02em] mb-4">
          Igualdade Social
        </h2>
        <p className="text-base md:text-lg font-medium leading-relaxed mb-8 opacity-80">
          Quem menos sabe é quem mais sofre com a desinformação.
        </p>

        <div className="space-y-5 text-sm leading-relaxed opacity-90">
          <p>
            Dados do Inquérito às Condições de Vida e Rendimento (INE) revelam que a camada da sociedade com menos acesso à informação — menor escolaridade e menor rendimento — é a que tem pior percepção da sua própria saúde e a que mais sofre com a desinformação.
          </p>
          <p>
            A autoapreciação do estado de saúde sobe com o nível de instrução: no ensino superior, 74% avaliam a sua saúde positivamente; no ensino secundário, 66%. Na camada com escolaridade básica ou inferior, a autopercepção cai significativamente.
          </p>
          <p>
            A camada com menos acesso à informação coincide com a população com rendimentos mais baixos e com os reformados — cerca de 59% dos quais têm limitações por problemas de saúde. Em regiões como o Alentejo ou o Norte Interior, os níveis de competências digitais básicas rondam os 46-47%.
          </p>
          <p>
            50% da população portuguesa tem baixa literacia em saúde. Esta camada é mais susceptível a remédios milagrosos e curas tradicionais: a percepção negativa da saúde aumenta o desespero por soluções rápidas. Frequentemente excluída dos canais digitais oficiais, esta população é a principal vítima da desinformação.
          </p>
          <p>
            O conhecimento científico, levado directamente aos bairros e centros de saúde, pode quebrar este ciclo — transformando a literacia num direito acessível a todos, independentemente da escolaridade.
          </p>
        </div>

        <blockquote className="pl-5 border-l-2 border-foreground/20 my-8">
          <p className="italic text-foreground leading-relaxed">
            "Baixos níveis de Literacia em Saúde estão relacionados com um maior número de internamentos e com uma utilização mais frequente dos serviços de urgência e, também, com uma menor prevalência de atitudes individuais e familiares preventivas."
          </p>
          <p className="mt-2 text-xs opacity-50">— DGS, Manual de Boas Práticas: Literacia em Saúde</p>
        </blockquote>

        {/* Referências */}
        <div className="mt-10 pt-6 border-t border-foreground/10">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground/40 mb-3">
            Referências
          </p>
          <ul className="space-y-1.5 text-xs opacity-60">
            <li>
              INE — <a href="https://www.ine.pt" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Inquérito às Condições de Vida e Rendimento</a>
            </li>
            <li>
              DGS — <a href="https://www.dgs.pt/documentos-e-publicacoes/manual-de-boas-praticas-literacia-em-saude-capacitacao-dos-profissionais-de-saude-pdf.aspx" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Manual de Boas Práticas: Literacia em Saúde</a>
            </li>
            <li>
              Beça, D. C. et al. (2024) — <a href="https://doi.org/10.32385/rpmgf.v40i5.14064" target="_blank" rel="noopener noreferrer" className="underline hover:opacity-70">Evolução dos Cuidados de Saúde Primários em Portugal</a>
            </li>
          </ul>
        </div>
      </article>

      {/* Footer spacing */}
      <div className="py-12" />
    </div>
  );
};

export default Textos;
