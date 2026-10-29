# Fact-checks do Observador — lista do teste sem gravar, 29/10/2026

Gerada por `python3 scripts/11_fetch_fact_checks.py --dry-run --lista docs/evidencia/2026-10-29-fact-checks/lista-dry-run.md`,
corrida às 13:51 UTC. Nada foi gravado na base. Os mesmos dados, com todos os campos, estão em `lista-dry-run.json`.

- 100 keywords activas, 0 pesquisas falhadas. **265 verificações novas**, todas do Observador e todas com data.
- Veredictos: Errado 237, Enganador 25, Esticado 3. Eixos: emergentes 234, saúde mental 21, menopausa 7, alimentação 3.
- Ordem: data da verificação, da mais recente para a mais antiga. Formato: n.º · data · keyword · eixo · veredicto, depois a afirmação e o endereço.
- A mesma verificação pode aparecer em mais do que uma keyword (o mesmo endereço em duas linhas).
- As linhas marcadas com ⚠ são **candidatas a excluir propostas pelo Claude Code** (21), cada uma com a razão. Não são uma decisão: a decisão é da Marta.

**A lista não é estável entre corridas `[verificado]`.** A primeira corrida de hoje, mostrada na conversa, tinha 266
verificações. Esta tem 265: na keyword "vacinas", a API deixou de devolver 5 e passou a devolver 4 que não vinham. Por
isso os números desta lista não coincidem com os da conversa. As 21 candidatas estão todas nas duas corridas e foram
passadas para os números desta lista.

1. 2026-09-28 · **avc** · emergentes · Errado
   Xi Jinping sofreu um desmaio súbito na Cúpula do BRICS na Índia e retornou antecipadamente a Pequim. Após a chegada do avião especial, foi diagnosticado com um grave AVC isquémico. O longo voo fez com que perdesse a janela de ouro para o tratamento adequado, o que pode deixar sequelas.
   <https://observador.pt/factchecks/fact-check-presidente-chines-sofreu-um-grave-avc-na-cimeira-dos-brics-na-india/>

2. 2026-08-26 · **vacinas** · emergentes · Errado
   Anthony Fauci poderá ser condenado à cadeira elétrica, por ter enganado a humanidade, obrigando as pessoas a usarem máscaras, ficarem trancadas e tomarem vacinas inúteis, que agora causam doenças.
   <https://observador.pt/factchecks/fact-chek-anthony-fauci-pode-ser-condenado-a-cadeira-eletrica-como-se-alega-nas-redes-sociais/>

3. 2026-08-18 · **onda de calor** · emergentes · Errado
   Um vídeo registado na cidade de Verona, no norte da Itália, mostra um semáforo com partes da estrutura plástica deformadas após uma intensa onda de calor que atinge o país. A Itália tem enfrentado temperaturas próximas dos 40°C em diversas regiões
   <https://observador.pt/factchecks/fact-check-calor-extremo-em-italia-faz-semaforo-derreter/>
   ⚠ **Candidata a excluir (Claude Code):** clima: semáforo deformado pelo calor em Verona; não é afirmação de saúde

4. 2026-06-30 · **vacinas** · emergentes · Errado
   O Diretor da Organização Mundial da Saúde admite que o surto de Hantavírus está agora sendo usado para promover uma agenda massiva de vacinação para crianças.
   <https://observador.pt/factchecks/fact-check-diretor-geral-da-oms-admite-que-surto-de-hantavirus-esta-a-ser-usado-para-promover-agenda-massiva-de-vacinacao-para-criancas/>

5. 2026-06-30 · **hantavírus** · emergentes · Errado
   O Diretor da Organização Mundial da Saúde admite que o surto de Hantavírus está agora sendo usado para promover uma agenda massiva de vacinação para crianças.
   <https://observador.pt/factchecks/fact-check-diretor-geral-da-oms-admite-que-surto-de-hantavirus-esta-a-ser-usado-para-promover-agenda-massiva-de-vacinacao-para-criancas/>

6. 2026-06-24 · **hantavírus** · emergentes · Enganador
   Um homem entra acidentalmente na cena enquanto eles estão a filmar para o hantavírus. Acorda isso e uma grade farsa.
   <https://observador.pt/factchecks/fact-check-video-mostra-encenacao-do-hantavirus-com-homem-a-entrar-acidentalmente-em-cena/>

7. 2026-06-24 · **hantavírus** · emergentes · Errado
   "Os Simpsons avisaram-nos em 2012 — a temporada 23, episódio 19 apresenta um navio de cruzeiro preso por um surto de vírus mortal. Avançando para 2026: o Hantavírus atinge o MV Hondius"
   <https://observador.pt/factchecks/fact-check-simpsons-previram-o-surto-de-hantavirus-a-bordo-de-um-cruzeiro-em-2012/>

8. 2026-05-28 · **hantavírus** · emergentes · Errado
   Homem retido num cruzeiro com surto de hantavírus é o mesmo actor pago que já 'atuou' no tempo da Covid
   <https://observador.pt/factchecks/fact-check-homem-retido-em-cruzeiro-com-surto-de-hantavirus-e-o-mesmo-que-apareceu-na-bbc-durante-a-covid-19/>

9. 2026-05-25 · **hantavírus** · emergentes · Errado
   A patente para a produção da vacina de mRNA contra o hantavírus foi obtida em 24 de abril de 2025
   <https://observador.pt/factchecks/fact-check-vacina-contra-o-hantavirus-ja-existe-e-foi-patenteada-em-2025/>

10. 2026-05-25 · **hantavírus** · emergentes · Errado
   Trump afirma que a 'extrema esquerda' quer retirar a liberdade à população global com o hantavírus
   <https://observador.pt/factchecks/fact-check-trump-disse-que-a-extrema-esquerda-quer-retirar-a-liberdade-a-populacao-global-atraves-do-hantavirus/>

11. 2026-05-20 · **hantavírus** · emergentes · Errado
   "E lá vamos nós...SAÚDE E CIÊNCIA. A Pfizer apresenta resultados promissores de sua nova vacina mRNA contra o Hantavírus"
   <https://observador.pt/factchecks/fact-check-pfizer-esta-a-desenvolver-vacina-contra-o-hantavirus/>

12. 2026-05-18 · **hantavírus** · emergentes · Errado
   “A China proibiu oficialmente a entrada de todos os estrangeiros devido ao surto de Hantavírus que matou 10 pessoas e teve origem na Argentina. O Presidente da República declarou estado de emergência internacional e mobilizou os serviços de saúde”
   <https://observador.pt/factchecks/fact-check-china-proibe-entrada-de-estrangeiros-devido-ao-hantavirus/>

13. 2026-05-18 · **hantavírus** · emergentes · Errado
   "ÚLTIMA HORA -Emmanuel Macron vai FECHAR as escolas a partir de amanhã devido à propagação do Hantavírus"
   <https://observador.pt/factchecks/fact-check-macron-anunciou-fecho-de-escolas-francesas-para-combater-o-hantavirus/>

14. 2026-05-12 · **hantavírus** · emergentes · Errado
   “Quando a gente acha que não pode piorar, ficamos sabendo que o Hantavírus é um dos efeitos colaterais na bula da Pfizer”
   <https://observador.pt/factchecks/fact-check-hantavirus-e-um-dos-efeitos-colaterais-da-vacina-da-pfizer-contra-a-covid-19/>

15. 2026-02-16 · **vírus nipah** · emergentes · Errado
   "Organização Mundial de Saúde alerta para risco global de Nipah depois do Carnaval"
   <https://observador.pt/factchecks/oms-alerta-para-risco-de-virus-nipah-depois-do-carnaval/>

16. 2026-02-16 · **vírus nipah** · emergentes · Errado
   “Primeiro caso do vírus Nipah já foi confirmado no Brasil”
   <https://observador.pt/factchecks/fact-check-virus-nipah-que-causa-preocupacao-na-india-ja-chegou-ao-brasil/>

17. 2025-12-29 · **alzheimer** · saude-mental · Errado
   Advogados do ex-presidente Jair Bolsonaro alegam Alzheimer para tentar o "Mito" em prisão domiciliar.
   <https://observador.pt/factchecks/fact-check-defesa-de-jair-bolsonaro-alegou-que-o-ex-presidente-tem-alzheimer/>
   ⚠ **Candidata a excluir (Claude Code):** política/justiça: Alzheimer invocado pelos advogados de Bolsonaro

18. 2025-08-07 · **dengue** · emergentes · Errado
   A narrativa oficial diz: 'estamos a combater a dengue, o zika e o chikungunya'. Mas o que estão mesmo a fazer é modificar geneticamente o ambiente inteiro.
   <https://observador.pt/factchecks/fact-check-biofabrica-de-wolbachia-destina-se-a-criar-modificar-o-ambiente-e-representa-perigo-para-a-populacao/>

19. 2025-06-27 · **vacinas** · emergentes · Errado
   Assim que Bill Gates e Tedros Ghebreyesus, da OMS, concluíram visitas de alto nível aos principais líderes do país, mudanças radicais foram discretamente implementadas no sistema jurídico do país — mudanças que agora tornam crime recusar a vacinação obrigatória do governo.
   <https://observador.pt/factchecks/fact-check-singapura-tornou-a-vacinacao-obrigatoria-apos-visita-de-bill-gates-e-diretor-da-oms/>

20. 2025-03-24 · **vacinas** · emergentes · Errado
   Trump bane todas as vacinas de MRNA contra a Covid-19.
   <https://observador.pt/factchecks/fact-check-donald-trump-baniu-as-vacinas-de-mrna-contra-a-covid-19-dos-eua/>

21. 2025-01-28 · **vacinas** · emergentes · Errado
   O Japão nomeia oficialmente a vacina COVID mRNA como “a droga mais mortal da história da humanidade”
   <https://observador.pt/factchecks/fact-check-japao-classifica-vacina-covid-como-a-mais-mortal-da-historia-da-humanidade/>

22. 2024-12-30 · **demência** · saude-mental · Errado
   A maior causa de demência nos EUA está hoje associada ao uso prolongado de estatinas. Sim, os medicamentos prescritos para proteger o coração podem esta afetando o cérebro.
   <https://observador.pt/factchecks/fact-check-uso-prolongado-de-medicamento-para-o-colesterol-e-a-maior-causa-de-demencia-nos-eua/>

23. 2024-12-30 · **alzheimer** · saude-mental · Errado
   A maior causa de demência nos EUA está hoje associada ao uso prolongado de estatinas. Sim, os medicamentos prescritos para proteger o coração podem esta afetando o cérebro.
   <https://observador.pt/factchecks/fact-check-uso-prolongado-de-medicamento-para-o-colesterol-e-a-maior-causa-de-demencia-nos-eua/>

24. 2024-12-27 · **vacinas** · emergentes · Errado
   A médica e colaboradora da Fox News Kelly Powers, totalmente vacinada, morreu no domingo após uma série de problemas de saúde.
   <https://observador.pt/factchecks/fact-check-comentadora-da-fox-news-morreu-de-cancro-turbo-por-causa-da-vacinacao-contra-a-covid-19/>

25. 2024-12-26 · **vacinas** · emergentes · Errado
   CEO da Pfizer enfrenta prisão perpétua por mentir para milhões sobre a vacina contra a Covid-19.
   <https://observador.pt/factchecks/fact-check-ceo-da-pfizer-enfrenta-prisao-perpetua-por-mentir-sobre-a-vacina-contra-a-covid-19/>

26. 2024-11-28 · **suicídio** · saude-mental · Errado
   2.038 suicídios foram registados hoje após a vitória eleitoral de Trump. Isso é INSANO E TRÁGICO. Para referência, o número médio é de cerca de 130 por dia.
   <https://observador.pt/factchecks/fact-check-organizacao-mundial-de-saude-anunciou-subida-exponencial-de-casos-de-suicidio-apos-a-eleicao-de-trump/>

27. 2024-10-30 · **incontinência urinária** · menopausa · Errado
   As notícias falsas são uma doença. Agora estão a dizer que tenho problemas de incontinência — totalmente mentira.
   <https://observador.pt/factchecks/fact-check-trump-fez-publicacao-para-desmentir-problemas-de-incontinencia/>
   ⚠ **Candidata a excluir (Claude Code):** citação de uma figura pública a negar boatos sobre si; não é afirmação de saúde

28. 2024-10-30 · **vacinas** · emergentes · Errado
   A Agência Europeia de Medicamentos reconheceu que nunca autorizou a "vacina" COVID para travar, prevenir ou reduzir a alegada doença....
   <https://observador.pt/factchecks/fact-check-agencia-europeia-do-medicamento-revela-que-nunca-deu-luz-verde-para-que-vacinas-contra-a-covid-19-fossem-administradas/>

29. 2024-10-29 · **vacinas** · emergentes · Errado
   Japão alerta Bill Gates que seus 'dias estão contados' após medicamentos abortivos serem encontrados em vacinas.
   <https://observador.pt/factchecks/fact-check-japao-ameaca-bill-gates-depois-de-serem-encontradas-substancias-que-provocam-aborto-nas-vacinas-anti-covid/>

30. 2024-09-30 · **mpox** · emergentes · Errado
   A Mpox só se transmite por contacto sexual.
   <https://observador.pt/factchecks/fact-check-mpox-so-se-transmite-atraves-de-contacto-sexual/>

31. 2024-09-25 · **mpox** · emergentes · Errado
   "A vacina Astrazeneca contém varíola dos macacos. Acordem, vaxxadores!"
   <https://observador.pt/factchecks/fact-check-vacina-contra-a-covid-19-da-astrazeneca-e-responsavel-pela-transmissao-da-mpox/>

32. 2024-09-23 · **vacinas** · emergentes · Errado
   A OMS [Organização Mundial da Saúde] espera as Olimpíadas acabarem para declarar emergência mundial de Mpox, e por coincidência já tem uma vacina para uma doença nova.
   <https://observador.pt/factchecks/fact-check-mpox-e-uma-doenca-nova-e-vacina-foi-criada-agora/>

33. 2024-09-23 · **mpox** · emergentes · Errado
   A OMS [Organização Mundial da Saúde] espera as Olimpíadas acabarem para declarar emergência mundial de Mpox, e por coincidência já tem uma vacina para uma doença nova.
   <https://observador.pt/factchecks/fact-check-mpox-e-uma-doenca-nova-e-vacina-foi-criada-agora/>

34. 2024-09-23 · **mpox** · emergentes · Errado
   Quase o mesmo cenário acontecerá. Este vídeo mostra vítimas de Mpox em África. Como sempre, eles cometem erros: fomentam o medo, tal como fizeram durante a Covid.
   <https://observador.pt/factchecks/fact-check-video-mostra-funeral-de-dezenas-de-vitimas-de-mpox-em-africa/>

35. 2024-09-23 · **mpox** · emergentes · Enganador
   O diretor da OMS recua e declara (seguindo o conselho de “especialistas”) que a varíola dos macacos não representa uma emergência de saúde global. O que aconteceu numa semana para mudar a sua opinião? Muito simples: os patriotas estão no controlo da situação
   <https://observador.pt/factchecks/fact-check-diretor-da-oms-faz-marcha-atras-e-retira-declaracao-de-emergencia-sanitaria-global-da-mpox/>

36. 2024-08-30 · **gripe das aves** · emergentes · Errado
   A Organização Mundial da Saúde (OMS) ordenou aos governos de todo o mundo que cancelem as próximas eleições e se preparem para implementar bloqueios rigorosos devido a um “surto de emergência” de gripe das aves.
   <https://observador.pt/factchecks/fact-check-oms-obriga-governos-a-cancelarem-eleicoes-devido-a-surto-de-gripe-das-aves/>

37. 2024-08-30 · **vacinas** · emergentes · Errado
   "As vacinas que estão atualmente em desenvolvimento e contêm antígenos do HIV, as proteínas produzidas pelo HIV que desencadeiam uma resposta imune no corpo e levam à AIDS plena."
   <https://observador.pt/factchecks/fact-check-bill-gates-esta-a-introduzir-o-virus-da-sida-na-vacina-contra-a-mpox/>

38. 2024-08-30 · **mpox** · emergentes · Errado
   "As vacinas que estão atualmente em desenvolvimento e contêm antígenos do HIV, as proteínas produzidas pelo HIV que desencadeiam uma resposta imune no corpo e levam à AIDS plena."
   <https://observador.pt/factchecks/fact-check-bill-gates-esta-a-introduzir-o-virus-da-sida-na-vacina-contra-a-mpox/>

39. 2024-08-27 · **mpox** · emergentes · Errado
   "A vacina ativando a doença do macaco."
   <https://observador.pt/factchecks/fact-check-vacina-ativa-o-aparecimento-da-mpox/>

40. 2024-08-23 · **mpox** · emergentes · Errado
   VAI COMEÇAR O LOCKDOWN. OMS ORDENA QUE GOVERNOS SE PREPAREM PARA “MEGA BLOQUEIOS” DEVIDO À CEPA MORTAL DA “VARÍOLA DOS MACACOS”.
   <https://observador.pt/factchecks/fact-check-oms-ordena-que-governos-se-preparem-para-novos-confinamentos-por-causa-da-mpox/>

41. 2024-07-24 · **autismo** · saude-mental · Errado
   A verdade está cá fora e os médicos sabem-na.
   <https://observador.pt/factchecks/fact-check-aumento-de-numero-de-criancas-com-autismo-esta-relacionado-com-vacinacao-infantil/>
   ⚠ **Candidata a excluir (Claude Code):** a afirmação não tem conteúdo de saúde visível; só se percebe abrindo a verificação

42. 2024-07-18 · **gripe das aves** · emergentes · Errado
   Alerta: 194 países da OMS concordam em prender cidadãos que se opõem à vacina contra a gripe aviária.
   <https://observador.pt/factchecks/fact-check-paises-da-oms-chegam-a-acordo-sobre-detencao-de-pessoas-que-recusem-vacina-contra-a-gripe-das-aves/>

43. 2024-07-18 · **vacinas** · emergentes · Errado
   [35 milhões de mortes] 'como resultado direto...' [das vacinas], mas ainda existem charlatões capazes de afirmar que as 'sopas experimentais salvaram milhões'.
   <https://observador.pt/factchecks/fact-check-cientistas-holandeses-dizem-que-vacinas-contra-a-covid-19-provocaram-35-milhoes-de-mortes/>

44. 2024-06-26 · **gripe das aves** · emergentes · Errado
   Bill Gates satânico! Deve ser ele o Anticristo!
   <https://observador.pt/factchecks/fact-check-bill-gates-pagou-10-milhoes-de-euros-para-tornar-a-gripe-das-aves-transmissivel-a-humanos/>

45. 2024-06-26 · **vacinas** · emergentes · Errado
   Um estudo pré-impresso japonês alertou sobre os riscos da transfusão de sangue de recetores da vacina Covid para outros pacientes, indicando que isso pode causar riscos significativos à saúde, incluindo a morte.
   <https://observador.pt/factchecks/fact-check-existem-riscos-na-transfusao-de-sangue-de-pessoas-que-receberam-vacinas-covid-como-alerta-um-estudo-japones/>

46. 2024-06-25 · **vacinas** · emergentes · Errado
   Tedros, diretor-geral da OMS, conseguiu vacinar 80% da população e admitiu que nunca se vacinou.
   <https://observador.pt/factchecks/fact-check-diretor-geral-da-oms-nao-se-vacinou-contra-a-covid-19/>

47. 2024-06-24 · **vacinas** · emergentes · Enganador
   Só falta o governo brasileiro tomar vergonha na cara e reconhecer as verdadeiras intenções da vacina e o mal que ainda está a provocar na humanidade. Genocídio orquestrado e sabemos quem são os culpados.
   <https://observador.pt/factchecks/fact-check-lider-japones-pediu-desculpa-a-quem-recusou-vacinacao-contra-a-covid-19-e-disse-que-estavam-certos/>

48. 2024-05-17 · **vacinas** · emergentes · Errado
   O Japão declarou uma emergência nacional devido à explosão de casos de cancro em todo o país causados pelas vacinas de mRNA.
   <https://observador.pt/factchecks/fact-check-explosao-de-casos-de-cancro-relacionados-com-vacina-contra-a-covid-levam-japao-a-declarar-emergencia-nacional/>

49. 2024-05-13 · **vacinas** · emergentes · Enganador
   Os burocratas da União Europeia acabam de revogar a autorização da vacina AstraZeneca contra a COVID-19. A revogação acontece após a gigante farmacêutica admitir recentemente que o seu ‘imunizante’ pode causar reações adversas graves.
   <https://observador.pt/factchecks/fact-check-vacina-da-astrazeneca-contra-a-covid-19-foi-retirada-do-mercado-por-causa-de-reacoes-adversas-graves/>

50. 2024-04-27 · **avc** · emergentes · Errado
   Há mais de 27 anos que limpo os vasos sanguíneos de 15 em 15 dias. Não esperem por um AVC ou pela formação de um coágulo sanguíneo. O método é muito simples.
   <https://observador.pt/factchecks/fact-check-ex-bastonario-dos-medicos-promoveu-metodo-com-limao-que-limpa-os-vasos-sanguineos/>

51. 2024-04-19 · **vacinas** · emergentes · Enganador
   Desastre para Ursula, levada ao Tribunal Penal Europeu no escândalo das vacinas Covid.
   <https://observador.pt/factchecks/fact-check-von-der-leyen-foi-acusada-de-corrupcao-por-causa-da-compra-de-vacinas-a-pfizer/>

52. 2024-04-10 · **vacinas** · emergentes · Errado
   Japão baniu vacinas mRNA para a Covid.
   <https://observador.pt/factchecks/fact-check-o-japao-baniu-as-vacinas-contra-a-covid-19/>

53. 2024-04-10 · **diabetes tipo 2** · alimentacao · Errado
   Como acabar com a diabetes tipo 2? Alimentação baixa em carboidratos, alta em gordura e proteína de origem animal. Jejum é obrigatório.
   <https://observador.pt/factchecks/fact-check-jejum-e-alimentacao-rica-em-gordura-e-hidratos-de-carbono-ajudam-a-acabar-com-a-diabetes-tipo-2/>

54. 2024-02-28 · **vacinas** · emergentes · Enganador
   O contrato secreto para a compra de vacinas que a Comissão Europeia assinou com a Pfizer foi finalmente tornado público. (...) 'Eficácia desconhecida', 'Eventos adversos desconhecidos', 'Efeitos a longo prazo desconhecidos'.
   <https://observador.pt/factchecks/fact-check-foi-divulgado-um-contrato-secreto-que-prova-eficacia-desconhecida-das-vacinas-contra-a-covid-19/>

55. 2024-02-26 · **dengue** · emergentes · Errado
   A ivermectina já demonstrou sua eficácia na redução da carga viral da dengue, de maneira dependente da dose. (...) O desaparecimento do quadro clínico - quando é administrado precocemente - ocorre em menos de 72 horas.
   <https://observador.pt/factchecks/fact-check-ivermectina-eficaz-na-reducao-da-carga-viral-da-dengue/>

56. 2024-02-26 · **dengue** · emergentes · Errado
   Solução caseira de vinagre de álcool vai resolver o surto de dengue no Brasil.
   <https://observador.pt/factchecks/fact-check-solucao-caseira-de-vinagre-de-alcool-vai-resolver-surto-de-dengue-no-brasil/>

57. 2024-02-21 · **dengue** · emergentes · Errado
   A matemática é a mesma de 2019....mas com outro nome...e uma nova "solução" para "resolver" o problema que a "solução" do problema anterior causou.
   <https://observador.pt/factchecks/fact-check-surto-de-dengue-no-brasil-esta-relacionado-com-vacina-contra-a-covid-da-pfizer/>

58. 2024-02-21 · **cancro da mama** · menopausa · Errado
   Ingestão de leite causa cancro da mama e da próstata.
   <https://observador.pt/factchecks/fact-check-beber-leite-esta-associado-a-um-risco-acrescido-de-desenvolver-cancro/>

59. 2024-02-07 · **crise de ansiedade** · saude-mental · Esticado
   “Agora sabemos que [o projeto-piloto da semana de 4 dias] teve um resultado tremendo, inclusive para o SNS. Pessoas mais descansadas, com menos crises de pânico e de ansiedade, a dormir melhor, com mais equilíbrio na vida familiar, a tomar menos ansiolíticos (...), menos pressão sobre o SNS."
   <https://observador.pt/factchecks/fact-check-semana-de-4-dias-diminuiu-pressao-sobre-o-sns-e-melhorou-a-produtividade-como-diz-rui-tavares/>

60. 2024-02-07 · **ataque de pânico** · saude-mental · Esticado
   “Agora sabemos que [o projeto-piloto da semana de 4 dias] teve um resultado tremendo, inclusive para o SNS. Pessoas mais descansadas, com menos crises de pânico e de ansiedade, a dormir melhor, com mais equilíbrio na vida familiar, a tomar menos ansiolíticos (...), menos pressão sobre o SNS."
   <https://observador.pt/factchecks/fact-check-semana-de-4-dias-diminuiu-pressao-sobre-o-sns-e-melhorou-a-produtividade-como-diz-rui-tavares/>

61. 2024-02-07 · **ansiedade** · saude-mental · Esticado
   “Agora sabemos que [o projeto-piloto da semana de 4 dias] teve um resultado tremendo, inclusive para o SNS. Pessoas mais descansadas, com menos crises de pânico e de ansiedade, a dormir melhor, com mais equilíbrio na vida familiar, a tomar menos ansiolíticos (...), menos pressão sobre o SNS."
   <https://observador.pt/factchecks/fact-check-semana-de-4-dias-diminuiu-pressao-sobre-o-sns-e-melhorou-a-produtividade-como-diz-rui-tavares/>

62. 2024-02-06 · **vacinas** · emergentes · Errado
   CNN Portugal fez reportagem onde estabelece uma relação entre o pico de mortalidade no país e a vacinação contra doenças infecciosas como a Covid-19.
   <https://observador.pt/factchecks/fact-check-peca-da-cnn-portugal-estabelece-relacao-entre-pico-de-mortes-em-portugal-e-vacinacao/>

63. 2024-01-26 · **alzheimer** · saude-mental · Errado
   Cápsulas de café são muito práticas. Você usa TODOS os dias? Veja só: As cápsulas são feitas de alumínio. Sim, metal tóxico que já tem inúmeros efeitos deletérios comprovados, relacionados com doenças como Alzheimer, cancro, endometriose, infertilidade e outros.
   <https://observador.pt/factchecks/fact-check-capsulas-de-cafe-em-aluminio-podem-provocar-cancro/>

64. 2024-01-26 · **endometriose** · menopausa · Errado
   Cápsulas de café são muito práticas. Você usa TODOS os dias? Veja só: As cápsulas são feitas de alumínio. Sim, metal tóxico que já tem inúmeros efeitos deletérios comprovados, relacionados com doenças como Alzheimer, cancro, endometriose, infertilidade e outros.
   <https://observador.pt/factchecks/fact-check-capsulas-de-cafe-em-aluminio-podem-provocar-cancro/>

65. 2024-01-23 · **gripe A** · emergentes · Enganador
   Quanto te dizem que o teste PCR detetava o Covid mas de repente começou a detetar a Gripe A.
   <https://observador.pt/factchecks/fact-check-testes-pcr-que-detetavam-o-covid-passaram-a-servir-para-detetar-a-gripe-a/>

66. 2024-01-17 · **vacinas** · emergentes · Errado
   EMA — Agência europeia de medicamentos afirma que não se tem indicação de imunizar pessoas abaixo de 60 anos, já que trata de uma proteina tóxica (proteina spike) e joga a responsabilidade da vacinação em massa nas políticas adotadas por cada país, que nao foi uma decisão científica.
   <https://observador.pt/factchecks/fact-check-agencia-europeia-do-medicamento-nao-deu-indicacao-para-vacinar-pessoas-com-menos-de-60-anos-contra-a-covid-19/>

67. 2023-12-26 · **vacinas** · emergentes · Errado
   As vacinas Covid NÃO são vacinas. Robert F. Kennedy Jr. ganhou seu processo contra todos os lobistas farmacêuticos.
   <https://observador.pt/factchecks/fact-check-supremo-tribunal-dos-eua-determina-que-as-vacinas-da-covid-nao-sao-vacinas/>

68. 2023-12-12 · **cancro da mama** · menopausa · Errado
   50-60% dos resultados 'positivos' estão incorretos"; "Estimula o crescimento do tumor e a disseminação de metástases.
   <https://observador.pt/factchecks/fact-check-mamografias-tem-taxa-de-falsos-positivos-de-50-a-60-e-estimulam-os-tumores/>

69. 2023-12-12 · **vacinas** · emergentes · Errado
   Islândia baniu vacinas contra a Covid-19 depois de subida do número de mortes súbitas no país.
   <https://observador.pt/factchecks/fact-check-islandia-decidiu-banir-vacinas-contra-a-covid-19-depois-de-subida-do-numero-de-mortes-subitas-no-pais/>

70. 2023-11-29 · **vacinas** · emergentes · Errado
   A vacina diz na bula que não é recomendada para quem tem diabetes.
   <https://observador.pt/factchecks/fact-check-vacina-para-covid-19-contem-acucar-e-nao-e-recomendada-para-quem-diabetes/>

71. 2023-11-28 · **vacinas** · emergentes · Enganador
   A proteína Spike sintética não perdoa. Faz uma lesão na parede vascular.
   <https://observador.pt/factchecks/fact-check-proteina-spike-presente-em-vacinas-contra-a-covid-19-provoca-lesoes-nas-paredes-vasculares-das-pessoas-vacinadas/>

72. 2023-11-27 · **suicídio** · saude-mental · Errado
   Justiça considera que vacinados são suicidas.
   <https://observador.pt/factchecks/fact-check-vacinados-contra-a-covid-19-sao-consideradas-suicidas-pela-justica-francesa/>

73. 2023-11-27 · **vacinas** · emergentes · Errado
   Justiça considera que vacinados são suicidas.
   <https://observador.pt/factchecks/fact-check-vacinados-contra-a-covid-19-sao-consideradas-suicidas-pela-justica-francesa/>

74. 2023-11-27 · **vacinas** · emergentes · Enganador
   Médico deixou alerta sobre perigos da vacinação contra a Covid-19 em evento do Parlamento Europeu.
   <https://observador.pt/factchecks/fact-check-medico-deixou-alerta-sobre-perigos-da-vacinacao-contra-a-covid-19-em-evento-do-parlamento-europeu/>

75. 2023-10-31 · **alzheimer** · saude-mental · Errado
   "Fenómeno da Medicina e da Ciência: um doente de Alzheimer a escrever as Memórias!! Portugal será um país de parvos? E a Justiça vai no engodo?"
   <https://observador.pt/factchecks/fact-check-ricardo-salgado-escreveu-livro-de-memorias-ja-depois-de-defesa-apresentar-um-diagnostico-de-alzheimer/>
   ⚠ **Candidata a excluir (Claude Code):** política/justiça: memórias escritas por um arguido com Alzheimer

76. 2023-10-30 · **vacinas** · emergentes · Errado
   "Humanos ciborgues vacinados com nanotecnologias de geolocalização 5G. Pare o 5G agora!"
   <https://observador.pt/factchecks/fact-check-milhoes-de-pessoas-vacinadas-com-nanotecnologia-de-rastreamento-5g/>

77. 2023-10-04 · **vacinas** · emergentes · Enganador
   "Funcionários da Pfizer afirmam, em uma audiência no Senado na Austrália — que receberam um lote "especial" da vacina contra a Covid-19. Diferente daquele que foi distribuído ao público. Qual seria a diferença do lote entre os funcionários da Pfizer e de todos os povos?"
   <https://observador.pt/factchecks/fact-check-funcionarios-da-pfizer-revelam-ter-recebido-lote-especial-da-vacina-contra-a-covid/>

78. 2023-09-28 · **vacinas** · emergentes · Errado
   "Michael Rochoy, clínico reputado, descobriu que Macron não foi inoculado com qualquer vacina Cov!d."
   <https://observador.pt/factchecks/fact-check-medico-descobriu-que-macron-mentiu-e-nao-recebeu-qualquer-dose-da-vacina-contra-o-novo-coronavirus/>

79. 2023-09-22 · **vacinas** · emergentes · Errado
   "Vacinados emitem marca via sinal bluetooth com código rastreável e identificável por geolocalização."
   <https://observador.pt/factchecks/fact-check-aplicacao-movel-permite-identificar-vacinados-contra-a-covid-19/>

80. 2023-09-22 · **onda de calor** · emergentes · Errado
   "A falsidade das alterações climáticas."
   <https://observador.pt/factchecks/fact-check-onda-de-calor-em-portugal-de-1930-prova-que-aquecimento-global-nao-existe/>
   ⚠ **Candidata a excluir (Claude Code):** clima: negação das alterações climáticas

81. 2023-09-22 · **vacinas** · emergentes · Errado
   "Primeira-ministra de Alberta, no Canadá, pediu desculpa aos não vacinados pelas descriminações injustas e disse que estes tinham razão, porque as vacinas não evitaram que as pessoas contraíssem a Covid-19"
   <https://observador.pt/factchecks/fact-check-primeira-ministra-da-provincia-canadiana-de-alberta-pedi-desculpa-aos-nao-vacinados-pela-forma-como-foram-tratados/>

82. 2023-09-13 · **vacinas** · emergentes · Errado
   "BOMBA! Pfizer afirma que as vacinas eram um projeto militar de bioterrorismo e terrorismo químico do Departamento de Defesa - Jornal Verdade Censurada"
   <https://observador.pt/factchecks/fact-check-a-pfizer-assumiu-que-as-suas-vacinas-foram-um-projeto-militar-de-bioterrorismo/>

83. 2023-08-29 · **vacinas** · emergentes · Errado
   "Flórida declara como ilegais as vacinas utilizadas contra o novo coronavírus"
   <https://observador.pt/factchecks/fact-check-florida-declarou-que-vacinas-mrna-sao-uma-arma-biologica/>

84. 2023-08-26 · **vacinas** · emergentes · Errado
   "A revista 'The Lancet' apagou um estudo que dizia que houve 74% de mortes após toma da vacina contra a Covid-19"
   <https://observador.pt/factchecks/fact-check-estudo-cientifico-concluiu-que-74-das-autopsias-realizadas-a-pessoas-vacinadas-contra-a-covid-19-atribui-causa-da-morte-a-vacina/>

85. 2023-08-24 · **demência** · saude-mental · Errado
   "A bula do omeprazol diz que pode causar paragem cardíaca e demência. O óleo zengest é tão resolutivo ou mais"
   <https://observador.pt/factchecks/fact-check-omeprazol-nao-e-seguro-e-deve-ser-substituido-por-um-oleo/>

86. 2023-08-18 · **vacinas** · emergentes · Errado
   "Impressionante - Governo canadiano admite: 'Os não vacinados estavam certos sobre as vacinas de mRNA'"
   <https://observador.pt/factchecks/fact-check-canada-admitiu-que-nao-vacinados-estavam-certos-sobre-riscos-de-vacinas-mrna/>

87. 2023-08-18 · **vacinas** · emergentes · Errado
   "Sequelas provenientes das vacinas... Enfarto do miocárdio, mal súbito, AVC, trombose, doenças autoimunes e um grande número de cancros jamais visto"
   <https://observador.pt/factchecks/fact-check-pessoas-vacinadas-contra-a-covid-19-estao-a-morrer-com-enfartes-avc-e-cancros/>

88. 2023-08-18 · **avc** · emergentes · Errado
   "Sequelas provenientes das vacinas... Enfarto do miocárdio, mal súbito, AVC, trombose, doenças autoimunes e um grande número de cancros jamais visto"
   <https://observador.pt/factchecks/fact-check-pessoas-vacinadas-contra-a-covid-19-estao-a-morrer-com-enfartes-avc-e-cancros/>

89. 2023-08-11 · **vacinas** · emergentes · Errado
   "Filho de Rita Lee afirma no programa de Danilo Gentili que os exames médicos mostram que a sua mãe faleceu de cancro causado pela vacina [contra a Covid-19]."
   <https://observador.pt/factchecks/fact-check-filho-de-rita-lee-disse-que-cancro-de-que-a-cantora-sofria-foi-reacao-a-vacina-contra-a-covid-19/>

90. 2023-08-11 · **autismo** · saude-mental · Errado
   "Papa Francisco diz que alcoólicos, autistas e pessoas com deficiência devem ser sacrificados para lutar contra as mudanças climáticas."
   <https://observador.pt/factchecks/fact-check-papa-francisco-disse-que-alcoolicos-autistas-e-pessoas-com-deficiencia-devem-ser-sacrificados-no-combate-as-alteracoes-climaticas/>
   ⚠ **Candidata a excluir (Claude Code):** citação falsa atribuída ao Papa; o autismo é só uma palavra na frase

91. 2023-07-31 · **vacinas** · emergentes · Errado
   "Cientista diz que nova epidemia (Marburg) começará quando o 5G emitir um pulso que vai "derreter" e liberar conteúdos patogénicos que estão nas vacinas da Covid. Quem se vacinou é uma bomba relógio biológica. A humanidade será dizimada sem nenhum tiro disparado."
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-podem-dar-origem-a-uma-epidemia-do-virus-marburg/>

92. 2023-07-26 · **tdah** · saude-mental · Errado
   "Teste online permite fazer diagnóstico de perturbação de hiperatividade com défice de atenção?"
   <https://observador.pt/factchecks/fact-check-teste-online-permite-fazer-diagnostico-de-perturbacao-de-hiperatividade-com-defice-de-atencao/>

93. 2023-07-25 · **vacinas** · emergentes · Enganador
   "Governo britânico anuncia indemnização de 120 mil euros para vítimas de vacinas."
   <https://observador.pt/factchecks/fact-check-governo-britanico-anunciou-indemnizacoes-para-vitimas-das-vacinas-contra-a-covid-19/>

94. 2023-07-25 · **gripe das aves** · emergentes · Errado
   "Lula tem assinado em mãos dois decretos prontos para fechar o país com uma nova emergência sanitária"
   <https://observador.pt/factchecks/fact-check-brasil-vai-enfrentar-um-novo-confinamento-geral-devido-a-surto-de-gripe-das-aves/>

95. 2023-06-26 · **vacinas** · emergentes · Errado
   "Coma uma salada e vacine-se. Coma carne e vacine-se. Beba leite e vacine-se. Está decidido vacina de mRNA serão adicionadas em alimentos animais e leite."
   <https://observador.pt/factchecks/fact-check-vacinas-de-mrna-adicionadas-a-alimentos-e-bebidas/>

96. 2023-06-26 · **vacinas** · emergentes · Errado
   "Jamie Foxx foi parar ao hospital depois de ter sido vacinado contra a Covid-19"
   <https://observador.pt/factchecks/fact-check-ator-jamie-foxx-hospitalizado-depois-de-sofrer-avc-devido-a-toma-da-vacina-contra-a-covid-19/>

97. 2023-06-26 · **vacinas** · emergentes · Errado
   "Vírus causador de cancro descoberto em vacina da Pfizer"
   <https://observador.pt/factchecks/fact-check-virus-que-da-origem-a-cancro-foi-descoberto-na-vacina-da-pfizer-contra-a-covid-19/>

98. 2023-06-05 · **vacinas** · emergentes · Errado
   "BBC News admitiu que as vacinas contra a Covid causaram 'excesso de mortes' em 2022."
   <https://observador.pt/factchecks/fact-check-bbc-news-admitiu-que-vacinas-contra-covid-provocou-excesso-de-mortes/>

99. 2023-06-05 · **vacinas** · emergentes · Errado
   "Chelsea Clinton declarou que as crianças não vacinadas na América devem ser forçadas a tomar a vacina de mRNA com ou sem o consentimento dos pais."
   <https://observador.pt/factchecks/fact-check-filha-de-bill-clinton-disse-que-criancas-devem-ser-vacinadas-com-ou-sem-consentimento-dos-pais/>

100. 2023-05-29 · **vacinas** · emergentes · Errado
   "Enfermeira entregou. Foi tudo teatro: 'Vou falar. Receba o cartão da vacina mas você não foi vacinado.' Farsa montada, aplicou placebo!"
   <https://observador.pt/factchecks/fact-check-enfermeira-assume-encenacao-de-vacinacao-de-lula-da-silva-contra-a-covid-19/>

101. 2023-05-29 · **vacinas** · emergentes · Errado
   "Dr. Pedro Chavez: 'ALERTE TODO MUNDO'. Todos os LABORATÓRIOS INDEPENDENTES confirmam O MESMO. ÓXIDO DE GRAFENO e MICROTECNOLOGIA em 'vacinas'. Os 'vacinados' TÊM sido MARCADOS COMO GADOS."
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-contem-oxido-de-grafeno-substancia-que-e-detetada-por-telemoveis/>

102. 2023-04-29 · **vacinas** · emergentes · Errado
   "Alerta! Protocolo pós-vacina indicado pelo Dr. José Augusto Nasser: ivermectina durante cinco dias."
   <https://observador.pt/factchecks/fact-check-protocolo-pos-vacina-contra-a-covid-19-inclui-a-toma-de-ivermectina/>

103. 2023-04-26 · **vacinas** · emergentes · Errado
   "Os australianos estão morrendo em números recordes, mas ninguém no poder quer falar sobre isso. Embora os australianos totalmente vacinados estejam morrendo a uma taxa não vista desde a Segunda Guerra Mundial, os políticos estão ignorando as demandas para descobrir o motivo, segundo os críticos."
   <https://observador.pt/factchecks/fact-check-subida-de-mortalidade-na-australia-relacionada-com-a-vacinacao-contra-a-covid-19/>

104. 2023-04-26 · **vacinas** · emergentes · Errado
   "Não foi só a Coca-Cola que Bill Gates adquiriu ações e algum tipo de controlo, também a Heineken. Nunca mais tomo essa cerveja. Basta ver a propaganda da Coca-Cola sobre um só ADN. Estão fazendo isso introduzindo RNA mensageiro na comida agora, depois da vacina."
   <https://observador.pt/factchecks/fact-check-bill-gates-comprou-acoes-da-coca-cola-e-vai-incluir-vacina-covid-19-na-bebida/>

105. 2023-04-26 · **vacinas** · emergentes · Errado
   "Suíça retirou todas as recomendações de vacinação contra a Covid-19"
   <https://observador.pt/factchecks/fact-check-fim-da-recomendacao-da-vacina-contra-covid-19-na-suica-motivada-por-danos-causados-pela-vacinacao/>

106. 2023-04-18 · **vacinas** · emergentes · Errado
   "Óxido de grafeno é tóxico e mortal para o ser humano. A FDA confirma que o óxido de grafeno está nas vacinas COVID-19 "mRNA" depois de ser forçado a liberar documentos confidenciais da Pfizer por ordem do Tribunal Federal dos EUA."
   <https://observador.pt/factchecks/fact-check-autoridade-do-medicamento-dos-eua-confirma-a-existencia-de-grafeno-nas-vacinas-contra-a-covid-19/>

107. 2023-03-31 · **vacinas** · emergentes · Errado
   "O presidente russo Vladimir Putin ordenou a destruição de todos os stocks de vacinas Covid-19 em solo russo, citando uma conexão inegável entre o que foi apelidado de 'Moscow Vax' e um aumento repentino de infecções por HIV em pessoas vacinadas."
   <https://observador.pt/factchecks/fact-check-putin-ordenou-a-destruicao-de-todos-os-stocks-de-vacinas-contra-a-covid-19/>

108. 2023-03-29 · **anemia** · alimentacao · Errado
   "A fruta PITAYA por mais que seja uma das frutas mais caras, ela remove anemia, ajuda contra o câncer e regula a diabetes."
   <https://observador.pt/factchecks/fact-check-a-pitaia-cura-a-anemia/>

109. 2023-03-27 · **vacinas** · emergentes · Enganador
   "Suécia deita para o lixo 8,5 milhões de doses contra a Covid. Médicos e cientistas provaram ao governo os malefícios da vacina que não imuniza coisa nenhuma"
   <https://observador.pt/factchecks/fact-check-suecia-descarta-85-milhoes-de-doses-de-vacinas-contra-a-covid-19-depois-de-ficarem-provados-os-maleficios-da-vacinacao/>

110. 2023-03-27 · **vacinas** · emergentes · Errado
   "JAG condena cientista de vacinas da Janssen à morte"
   <https://observador.pt/factchecks/fact-check-responsavel-da-farmaceutica-janssen-condenado-a-morte-pela-justica-da-marinha-norte-americana/>

111. 2023-03-20 · **vacinas** · emergentes · Errado
   "Supremo Tribunal dos EUA anulou vacina universal contra a Covid-19 porque viola Tratado de Nuremberga"
   <https://observador.pt/factchecks/supremo-tribunal-dos-eua-anulou-vacina-universal-contra-a-covid-19-porque-viola-tratado-de-nuremberga/>

112. 2023-02-24 · **vacinas** · emergentes · Errado
   "Bomba: O diretor da Força-Tarefa do CDC, admitiu que as vacinas C-19 causam doenças debilitantes"
   <https://observador.pt/factchecks/fact-check-responsavel-da-autoridade-de-saude-norte-americana-assume-que-vacina-contra-covid-provoca-doencas-debilitantes/>

113. 2023-01-29 · **vacinas** · emergentes · Errado
   "WEF contrata pilotos não vacinados para levá-los a Davos: 'A segurança dos nossos membros é a prioridade número 1'"
   <https://observador.pt/factchecks/fact-check-forum-economico-mundial-exigiu-que-pilotos-que-levaram-lideres-mundiais-a-davos-nao-estivessem-vacinados/>

114. 2023-01-06 · **vacinas** · emergentes · Errado
   "FDA diz que vacina da Pfizer causa coágulos sanguíneos"
   <https://observador.pt/factchecks/fact-check-fda-admite-que-vacina-da-pfizer-causa-coagulos-sanguineos/>

115. 2022-12-30 · **autismo** · saude-mental · Errado
   "Messi é autista. Ele foi diagnosticado aos 8 anos de idade, ainda na Argentina, com a Síndrome de Asperger, conhecida como uma forma branda de autismo"
   <https://observador.pt/factchecks/fact-check-lionel-messi-foi-diagnosticado-com-autismo-aos-oito-anos/>
   ⚠ **Candidata a excluir (Claude Code):** diagnóstico atribuído a uma celebridade (Messi); não é desinformação de saúde

116. 2022-10-25 · **avc** · emergentes · Errado
   "Levantar de repente pode causar acidente vascular cerebral".
   <https://observador.pt/factchecks/fact-check-levantar-de-repente-para-ir-a-casa-de-banho-aumenta-risco-de-avc/>

117. 2022-10-24 · **vacinas** · emergentes · Errado
   "Ontem, a presidente de mercados internacionais desenvolvidos da Pfizer, Janine Small, admitiu que a sua vacina nunca havia sido testada antes do seu lançamento sobre a capacidade de impedir a transmissão do Covid."
   <https://observador.pt/factchecks/fact-check-pfizer-admitu-que-mentiu-sobre-testes-a-capacidade-de-a-vacina-contra-a-covid-19-travar-a-transmissao-do-virus/>

118. 2022-10-19 · **onda de calor** · emergentes · Enganador
   "Sempre houve ondas de calor, sempre houve ondas de seca."
   <https://observador.pt/factchecks/fact-check-fotografia-de-rio-mondego-com-caudal-reduzido-prova-que-alteracoes-climaticas-sao-ciclicas/>
   ⚠ **Candidata a excluir (Claude Code):** clima: "sempre houve ondas de calor"

119. 2022-08-24 · **vacinas** · emergentes · Errado
   Sou vacinada com uma dose da Janssen e tive vasculite após ser inoculada. Enfim, isso é o que estão achando no sangue dos vacinados.
   <https://observador.pt/factchecks/fact-check-imagens-mostram-vasculite-provocada-pela-vacina-da-janssen/>

120. 2022-08-21 · **vacinas** · emergentes · Errado
   Grandes farmacêuticas, China, Vaticano condenados por genocídio e conspiração criminal por Tribunal Internacional - Vacinas Covid proibidas e ordenado arresto de bens e prisão de líderes.
   <https://observador.pt/factchecks/tribunal-internacional-condenou-farmaceuticas-china-e-vaticano-por-crimes-contra-a-humanidade/>

121. 2022-08-10 · **vacinas** · emergentes · Errado
   "Sky News publicou notícia onde se dizia que as vacinas contra a Covid-19 são boas para combater as alterações climáticas":
   <https://observador.pt/factchecks/fact-check-sky-news-anunciou-que-vacinas-contra-a-covid-19-podem-combater-as-alteracoes-climaticas/>

122. 2022-08-10 · **vacinas** · emergentes · Errado
   "Manifestantes alemães anti-vacinas beijaram-se em público num protesto contra a Covid-19".
   <https://observador.pt/factchecks/fact-check-alemaes-anti-vacinas-beijaram-se-em-publico-para-protestar/>

123. 2022-08-01 · **vacinas** · emergentes · Errado
   "A WHO. Deu 50 milhões de vacinas contra a varíola misturadas com Aids aos africanos!!"
   <https://observador.pt/factchecks/fact-check-oms-administrou-50-milhoes-de-vacinas-contra-a-variola-misturadas-com-sida-a-africanos/>

124. 2022-07-27 · **dieta** · alimentacao · Errado
   "Charlie Chaplin disse que o sol, o descanso, a dieta e os amigos são os melhores remédios do mundo".
   <https://observador.pt/factchecks/fact-check-charlie-chaplin-disse-que-o-sol-o-descanso-e-a-dieta-estao-entre-os-seis-melhores-remedios-do-mundo/>
   ⚠ **Candidata a excluir (Claude Code):** citação atribuída a Charlie Chaplin; casou pela palavra "dieta"

125. 2022-07-27 · **alzheimer** · saude-mental · Errado
   "Capa de revista especializada na doença de Alzheimer mostra Joe Biden a segurar uma banana como se fosse um telemóvel."
   <https://observador.pt/factchecks/fact-check-revista-especializada-em-alzheimer-fez-capa-com-joe-biden-a-segurar-banana-como-se-fosse-um-telefone/>
   ⚠ **Candidata a excluir (Claude Code):** montagem política (Biden numa capa de revista)

126. 2022-07-26 · **onda de calor** · emergentes · Errado
   "A propósito da onda de calor que atravessa Portugal, neste ano de 2022/7, não é caso único. Há 74 anos a esta parte, (1-8-1944) as ondas de calor atingiram níveis semelhantes, conforme nos indica a imagem supra. (...)"
   <https://observador.pt/factchecks/fact-check-em-agosto-de-1944-foi-registada-onda-de-calor-semelhante-a-de-meados-de-julho-deste-ano/>
   ⚠ **Candidata a excluir (Claude Code):** clima: comparação de ondas de calor com 1944

127. 2022-07-18 · **vacinas** · emergentes · Errado
   "Ex-primeiro-ministro assassinado não seguiu ordens do FEM [Fórum Económico Mundial]. Não tornou as vacinas obrigatórias, mandou para trás 1,6 milhões de doses e deu Ivermectina aos cidadãos"
   <https://observador.pt/factchecks/fact-check-ex-primeiro-ministro-do-japao-foi-assassinado-porque-nao-impos-vacinacao-contra-a-covid-19/>

128. 2022-07-18 · **vacinas** · emergentes · Errado
   "Japão declara estado de emergência devido a surto de sequelas de vacina. [O país] pede à Pfizer que pague uma indemnização ou deve processar a Pfizer pelo crime de extermínio da humanidade. Hospitais japoneses estão a emitir avisos a pedir às pessoas para que não sejam vacinadas."
   <https://observador.pt/factchecks/fact-check-japao-declarou-estado-de-emergencia-em-julho-devido-as-vacinas-contra-a-covid-19/>

129. 2022-06-30 · **vacinas** · emergentes · Errado
   "A Austrália aprovou o pedido de licença da Big Pharma PaxVax que permitirá a liberação de uma vacina OGM composta por bactérias vivas em Queensland, via chemtrails."
   <https://observador.pt/factchecks/fact-check-australia-vai-vacinar-populacao-a-forca-com-gases-libertados-por-avioes/>

130. 2022-06-29 · **vacinas** · emergentes · Errado
   "Vou contar o que está a acontecer nos hospitais do sul [da Austrália]. Aos que estão vacinados e chegam com Covid, está a ser-lhes dada, adivinhem, ivermectina".
   <https://observador.pt/factchecks/fact-check-doentes-com-covid-19-na-australia-estao-a-ser-medicados-com-ivermectina/>

131. 2022-06-24 · **vacinas** · emergentes · Errado
   "Após obrigar bilhões de seres humanos a vacinar, a Pfizer publica a lista de 1.291 efeitos colaterais graves de sua vacina"
   <https://observador.pt/factchecks/fact-check-pfizer-publicou-lista-de-quase-1-300-efeitos-secundarios-graves-da-vacina-contra-a-covid/>

132. 2022-06-21 · **onda de calor** · emergentes · Errado
   "Em 1986, foi chamado verão normal. Hoje eles estão colorindo o mapa de vermelho e chamando-o de onda de calor."
   <https://observador.pt/factchecks/fact-check-boletins-meteorologicos-provam-que-temperaturas-nao-mudaram-desde-1986/>
   ⚠ **Candidata a excluir (Claude Code):** clima: mapa de temperaturas de 1986

133. 2022-06-20 · **vacinas** · emergentes · Errado
   "Pessoas mortas com espingardas em 2020: 454. Mortes por causa das vacinas da Covid em 2021: 20.662."
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-mataram-mais-pessoas-nos-eua-que-as-armas/>

134. 2022-06-20 · **vacinas** · emergentes · Errado
   “Sem vacina, sem comida. O governo ucraniano anuncia pagamentos de emergência para os que estão a sofrer com a guerra. Mas apenas para quem tiver as duas doses da vacina, os pagamentos vão ser feitos através de um novo sistema de moedas digitais”
   <https://observador.pt/factchecks/fact-check-so-os-vacinados-contra-a-covid-19-tem-acesso-a-bens-essenciais-durante-a-guerra-na-ucrania/>

135. 2022-05-31 · **mpox** · emergentes · Errado
   "BOOM! Apanhados em flagrante a planear uma pandemia de varíola dos macacos."
   <https://observador.pt/factchecks/fact-check-havia-um-plano-previo-para-produzir-uma-pandemia-de-variola-dos-macacos/>

136. 2022-05-30 · **vacinas** · emergentes · Errado
   "Varíola? Não. Chama-se Cobreiro/Heroes Zóster, e é uma conhecida 'reação adversa' da vacina de covid... Eles até tentaram usar uma foto de herpes zóster e chamá-la de varíola"
   <https://observador.pt/factchecks/fact-check-variola-dos-macacos-e-uma-reacao-adversa-as-vacinas-contra-a-covid-19/>

137. 2022-05-30 · **vacinas** · emergentes · Errado
   "Alemanha admite [que] 'vacina' Covid [é] 40 vezes mais mortal do que se sabia."
   <https://observador.pt/factchecks/fact-check-alemanha-admitiu-que-a-vacina-contra-a-covid-19-e-40-vezes-mais-mortal-que-o-previsto/>

138. 2022-03-28 · **vacinas** · emergentes · Errado
   "As vacinas de DNA contra a Covid-19 devem dar-nos um controlo extremo sobre a população mundial", disse Bill Gates
   <https://observador.pt/factchecks/fact-check-bill-gates-disse-que-as-vacinas-contra-a-covid-19-vao-servir-para-controlar-a-humanidade/>

139. 2022-03-28 · **vacinas** · emergentes · Enganador
   "Enquanto se distrai com a invasão da Rússia, o governo do Reino Unido divulgou um relatório confirmando que os totalmente vacinados agora representam 9 em cada 10 mortes por Covid-19 no Reino Unido."
   <https://observador.pt/factchecks/fact-check-relatorio-do-governo-britanico-prova-fracasso-das-vacinas-contra-a-covid-19/>

140. 2022-03-14 · **ansiedade** · saude-mental · Errado
   "Que dia triste. Tanta ânsia de poder, tanta falta de amor e de consciência, tantas decisões cegas para resolver problemas que afectam milhões de pessoas inocentes..."
   <https://observador.pt/factchecks/fact-check-imagens-de-aviao-de-combate-debaixo-de-fogo-intenso-sao-de-momento-de-confrontos-militares-na-ucrania/>
   ⚠ **Candidata a excluir (Claude Code):** casou pela palavra: "ânsia de poder", não ansiedade

141. 2022-02-23 · **vacinas** · emergentes · Errado
   "Triplamente vacinados estão desenvolvendo síndrome da imunodeficiência adquirida em ritmo alarmante, segundo dados do Governo do Reino Unido (...). Dados oficiais do Governo do Canadá sugerem que os totalmente vacinados estão a apenas algumas semanas de desenvolver AIDS."
   <https://observador.pt/factchecks/fact-check-estudos-dizem-que-vacinados-com-dose-de-reforco-estao-a-desenvolver-sida/>

142. 2022-02-17 · **vacinas** · emergentes · Errado
   "Dr. Roberto Malone, criador da vacina mRNA diz que não deve vacinar as crianças porque pode causar danos irreversíveis".
   <https://observador.pt/factchecks/fact-check-proteina-spike-com-elementos-presentes-em-vacinas-contra-a-covid-19-e-toxica/>

143. 2022-02-15 · **vacinas** · emergentes · Errado
   "O governo do Reino Unido admite que as vacinas danificam o sistema imunológico natural dos vacinados. O governo britânico revelou o facto de que, a partir do momento em que alguém receba duas doses, nunca mais poderá adquirir imunidade natural total contra as variantes do Covid."
   <https://observador.pt/factchecks/fact-check-governo-britanico-admitiu-que-as-vacinas-contra-a-covid-19-danificam-o-sistema-imunologico/>

144. 2022-02-09 · **vacinas** · emergentes · Errado
   "Os vacinados estão criando as variantes."
   <https://observador.pt/factchecks/fact-check-relatorio-do-cdc-comprova-que-as-variantes-do-coronavirus-tem-origem-em-pessoas-vacinadas/>

145. 2022-02-07 · **vacinas** · emergentes · Errado
   "Uma vítima da vacina contra a Covid-19 afetada pela Paralisia de Bell"
   <https://observador.pt/factchecks/fact-check-estudos-comprovam-associacao-entre-vacina-contra-a-covid-19-e-a-paralisia-de-bell/>

146. 2022-02-07 · **vacinas** · emergentes · Errado
   "Indústria farmacêutica e líderes de governos mundiais foram condenados por genocídio por causa da vacinação contra a Covid-19".
   <https://observador.pt/factchecks/fact-check-farmaceuticas-governos-e-lideres-religiosos-foram-condenados-por-genocidio/>

147. 2022-01-28 · **vacinas** · emergentes · Errado
   “Autópsias após a guerra provaram que a gripe de 1918 NÃO era uma “GRIPE”. Ela foi causada por dosagens aleatórias de uma ‘vacina contra a meningite bacteriana’ experimental, que até hoje simula sintomas semelhantes aos da gripe.”
   <https://observador.pt/factchecks/fact-check-gripe-espanhola-nao-era-uma-gripe-e-foi-causada-pela-administracao-de-vacina-contra-a-meningite/>

148. 2022-01-24 · **vacinas** · emergentes · Errado
   "Possível antídoto da vacina Covid-19: suramina"
   <https://observador.pt/factchecks/fact-check-suramina-e-um-antidoto-usado-contra-o-efeito-magnetico-e-o-veneno-das-vacinas-contra-a-covid-19/>

149. 2022-01-24 · **vacinas** · emergentes · Errado
   "A primeira linha ucraniana contra a nova ordem está a invadir os palácios do governo. Ou o governo ucraniano bane as vacinas assassinas da Covid-19 da Ucrânia ou os políticos serão todos mortos pelo povo”
   <https://observador.pt/factchecks/fact-check-video-mostra-protesto-contra-medidas-sanitarias-na-ucrania/>

150. 2022-01-21 · **gripe A** · emergentes · Enganador
   “Depois de uma investigação chegaram a conclusão que a gripe A nunca existiu! Mais uma mentira.”
   <https://observador.pt/factchecks/fact-check-investigacao-concluiu-que-gripe-a-provocada-pelo-virus-h1n1-nunca-existiu/>

151. 2022-01-18 · **vacinas** · emergentes · Errado
   "Esta é Christine Grady. É a chefe da bioética do NIH. Trata-se da entidade que aprova medicamentos para a FDA. Este é o seu marido... Estão a começar a perceber?"
   <https://observador.pt/factchecks/fact-check-mulher-de-anthony-fauci-foi-responsavel-pelas-autorizacoes-de-uso-das-vacinas-contra-a-covid-19/>

152. 2022-01-14 · **vacinas** · emergentes · Errado
   "Vídeo com trechos de apresentadores e programas televisivos ao vivo nos quais se produzem desmaios por consequência da 'vacina do Covid'."
   <https://observador.pt/factchecks/fact-check-videos-mostram-jornalistas-a-desmaiar-em-direto-devido-a-vacina-contra-a-covid-19/>

153. 2022-01-14 · **vacinas** · emergentes · Errado
   "Um novo estudo da Associação Americana do Coração alerta que as vacinas mRNA aumentam drasticamente o risco de doenças cardíacas."
   <https://observador.pt/factchecks/fact-check-novo-estudo-da-associacao-americana-do-coracao-relaciona-vacina-com-aumento-de-risco-de-doencas-cardiacas/>

154. 2022-01-14 · **vacinas** · emergentes · Errado
   "Afinal os 'vacinados' sempre emitem um sinal de bluetooth tal como descoberto em França"
   <https://observador.pt/factchecks/fact-check-vacinados-contra-a-covid-19-emitem-sinal-de-bluetooth/>

155. 2022-01-06 · **vacinas** · emergentes · Errado
   "É obrigatório que cada criança, dos 5 aos 11 anos, tivesse telemóvel para poder levar a vacina”.
   <https://observador.pt/factchecks/fact-check-criancas-entre-os-5-e-os-11-anos-tem-de-ter-telemovel-pessoal-para-agendar-vacina/>

156. 2021-12-29 · **vacinas** · emergentes · Enganador
   "Como é que a Ómicron entrou na Austrália se os não-vacinados não podem sair ou entrar"
   <https://observador.pt/factchecks/fact-check-casos-de-variante-omicron-na-australia-prova-que-vacinas-nao-sao-eficazes/>

157. 2021-12-28 · **vacinas** · emergentes · Errado
   "A Covid desaparece com o tempo quente, porque as vacinas são excelentes. E aumenta com o tempo frio porque surgem novas variantes"
   <https://observador.pt/factchecks/fact-check-covid-19-desaparece-com-o-tempo-quente-e-reaparece-quando-as-temperaturas-baixam/>

158. 2021-12-26 · **vacinas** · emergentes · Errado
   "Há países a usar vacinas para matar crianças"
   <https://observador.pt/factchecks/fact-check-diretor-da-oms-disse-que-as-vacinas-matam-criancas/>

159. 2021-12-25 · **vacinas** · emergentes · Errado
   "A polícia francesa lança as algemas e anuncia sua renúncia e se junta ao povo na recusa de tomar a vacina contra a Corona e diz que existem partidos globais corruptos que querem subjugar e controlar os povos."
   <https://observador.pt/factchecks/fact-check-policias-franceses-lancam-algemas-para-o-chao-e-juntam-se-a-manifestantes-contra-vacinas/>

160. 2021-12-14 · **vacinas** · emergentes · Errado
   "Nova Zelândia na vanguarda do Novo Normal. Olhamos para este cartaz de rua e ficamos na dúvida: será uma campanha de Natal? Uma campanha política? Uma campanha de vacinação em massa sob chantagem? 'Cada reforço dá-te 6 meses de liberdades'. 'Sem vacina não há trabalho nem subsídios.' "
   <https://observador.pt/factchecks/fact-check-cartaz-na-nova-zelandia-promove-vacinacao-em-troca-de-seis-meses-de-liberdade/>

161. 2021-12-07 · **vacinas** · emergentes · Errado
   "São 6 doses da Pfizer já aprovadas. Este circo que andam a fazer acerca dos "muitos casos" apesar de termos 90% de vacinação é para vos convencer a tomar mais."
   <https://observador.pt/factchecks/fact-check-dgs-aprovou-administracao-de-seis-doses-da-vacina-da-pfizer-a-cada-pessoa/>

162. 2021-12-06 · **vacinas** · emergentes · Errado
   "Ontem estourou um grande escândalo na Eslovênia e hoje a Eslovénia fala em vacinas".
   <https://observador.pt/factchecks/%E2%80%8B%E2%80%8Bfact-check-enfermeira-de-centro-de-gestao-de-vacinas-revela-que-politicos-eslovenos-receberam-dose-de-placebo-contra-a-covid-19/>

163. 2021-11-30 · **vacinas** · emergentes · Errado
   "Mau... O governo austríaco que se decida... VÍDEO | Viena (Áustria), também há vacinação em bordéis, se for inoculado ganha um prémio: 30 minutos de sexo grátis com uma prostituta. Mas ao mesmo tempo fez um confinamento para os não injectados."
   <https://observador.pt/factchecks/fact-check-governo-austriaco-promoveu-vacinacao-em-bordeis-com-direito-a-30-minutos-de-sexo-gratis/>

164. 2021-11-30 · **vacinas** · emergentes · Errado
   "Irlanda. O Ministério da Saúde alerta sobre as vacinas e entre outros efeitos adversos está 'morte súbita'."
   <https://observador.pt/factchecks/fact-check-ministerio-da-saude-irlandes-alertou-para-risco-de-morte-subita-com-toma-de-vacina-contra-a-covid-19/>

165. 2021-11-30 · **vacinas** · emergentes · Errado
   "A minha filha acabou de me contactar da escola. (...) Uma das suas amigas está nos cuidados intensivos no hospital aqui em Halifax porque o seu coração parou depois de ela ter tomado a vacina. (...) Ela tem 13 anos! Há crianças e adultos a morrer em todo o mundo por causa desta vacina."
   <https://observador.pt/factchecks/fact-check-adolescente-canadiana-sofreu-paragem-cardiaca-depois-de-ser-vacinada-contra-a-covid-19/>

166. 2021-11-29 · **suicídio** · saude-mental · Errado
   "Entretanto em Chemnitz, na Alemanha. Há uns dias, o chefe da clínica suicidou-se. Na carta de despedida [lê-se]: 'Já não posso viver com as mentiras ditas aos cidadãos e aos pacientes, que as vacinas serão inofensivas, é um genocídio!'"
   <https://observador.pt/factchecks/fact-check-medico-suicida-se-e-deixa-carta-de-despedida-com-criticas-a-vacinacao/>

167. 2021-11-29 · **vacinas** · emergentes · Errado
   "Entretanto em Chemnitz, na Alemanha. Há uns dias, o chefe da clínica suicidou-se. Na carta de despedida [lê-se]: 'Já não posso viver com as mentiras ditas aos cidadãos e aos pacientes, que as vacinas serão inofensivas, é um genocídio!'"
   <https://observador.pt/factchecks/fact-check-medico-suicida-se-e-deixa-carta-de-despedida-com-criticas-a-vacinacao/>

168. 2021-11-29 · **vacinas** · emergentes · Errado
   "Esposa do CEO da Pfizer morre após complicações com a vacina"
   <https://observador.pt/factchecks/fact-check-mulher-de-ceo-da-pfizer-morreu-apos-tomar-vacina-contra-a-covid-19/>

169. 2021-11-22 · **vacinas** · emergentes · Errado
   "O defensor da 'saúde pública' mais influente do mundo aparentemente veio a duvidar da tecnologia por trás das injeções de mRNA, após sua implantação em mais de 7,34 bilhões de braços em todo o mundo."
   <https://observador.pt/factchecks/fact-check-bill-gates-disse-que-as-vacinas-contra-a-covid-19-sao-ineficazes/>

170. 2021-11-21 · **vacinas** · emergentes · Errado
   "Presidente da Croácia interrompeu a campanha de vacinação contra a Covid-19 no país."
   <https://observador.pt/factchecks/fact-check-presidente-croata-interrompeu-a-campanha-de-vacinacao-contra-a-covid-19/>

171. 2021-11-19 · **vacinas** · emergentes · Errado
   "O Parlamento Europeu vota uma proposta de resolução para indemnizar as vitimas da vacinação COVID-19"
   <https://observador.pt/factchecks/fact-check-parlamento-europeu-votou-indemnizacao-a-vitimas-das-vacinas-contra-a-covid-19/>

172. 2021-11-15 · **vacinas** · emergentes · Errado
   "O Charles da Inglaterra, fala com um homem vacinado que díz sentir-se muito bem. Mas desmaia á frente dele, que reage como se nada fosse (...) Não é una vacina, é una arma biológica."
   <https://observador.pt/factchecks/fact-check-um-homem-desmaiou-em-frente-ao-principe-carlos-depois-de-ser-vacinado-contra-a-covid-19/>

173. 2021-11-09 · **vacinas** · emergentes · Errado
   Pilotos vacinados caíram mortos no meio do voo.
   <https://observador.pt/factchecks/fact-check-pilotos-estao-a-morrer-durante-o-voo-depois-de-serem-vacinados-contra-a-covid-19/>

174. 2021-11-08 · **vacinas** · emergentes · Errado
   "As vacinas estão matando as pessoas. Quanto mais vacinados, mais mortes e mais casos de Covid."
   <https://observador.pt/factchecks/fact-check-vacina-contra-a-covid-19-esta-a-matar-pessoas-e-a-aumentar-contagios/>

175. 2021-11-04 · **vacinas** · emergentes · Errado
   62% das pessoas que tomaram vacinas MRNA já têm coágulos sanguíneos microoscópicos.
   <https://observador.pt/factchecks/fact-check-vacinas-mrna-provocaram-coagulos-sanguineos-em-62-das-pessoas-que-as-tomaram/>

176. 2021-10-28 · **vacinas** · emergentes · Errado
   "Imagine ter que ir para a fila pela 3.ª vez para meter uma cena que não funcionou na 1.ª, nem na 2.ª vez"
   <https://observador.pt/factchecks/fact-check-terceira-dose-da-vacina-contra-a-covid-19-introduzida-porque-as-duas-primeiras-nao-funcionaram/>

177. 2021-10-27 · **vacinas** · emergentes · Errado
   "União Europeia vai substituir vacinas contra a Covid-19 por ivermectina."
   <https://observador.pt/factchecks/fact-check-uniao-europeia-vai-substituir-vacinas-contra-a-covid-19-por-ivermectina/>

178. 2021-10-26 · **vacinas** · emergentes · Errado
   "O médico francês Theron, foi espancado e preso pela Polícia apenas por receitar Invermectina e cloroquina a pacientes. Inacreditável! Existem muitos heróis nesse mundo. Se ele estivesse incentivado o uso das vacinas ou entubando paciente, certamente estaria recrecebendo outro tratamento."
   <https://observador.pt/factchecks/fact-check-medico-frances-foi-espancado-e-preso-por-receitar-ivermectina-e-cloroquina/>

179. 2021-10-25 · **vacinas** · emergentes · Errado
   "As vacinas da Pfizer estão em fase experimental até 2023."
   <https://observador.pt/factchecks/fact-check-vacina-da-pfizer-contra-a-covid-19-e-experimental-ate-2023/>

180. 2021-10-18 · **vacinas** · emergentes · Errado
   "A injeção não previne infeção, transmissão ou mortes. Então o certificado não se trata de saúde, mas sim de controle."
   <https://observador.pt/factchecks/fact-check-vacinas-nao-protegem-contra-a-infeccao-transmissao-e-mortes-por-covid-19/>

181. 2021-09-30 · **vacinas** · emergentes · Errado
   "Resultados da vacinação CV-19 à data de 11 de setembro de 2021. 24.469 mil mortos; 929.128 mil reações adversas"
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-ja-fizeram-20-525-mortos-na-uniao-europeia/>

182. 2021-09-30 · **vacinas** · emergentes · Errado
   "Desde 1 de janeiro, tenho visto, no laboratório, um aumento em 20 vezes [do número de casos] de cancro endometrial em relação ao que via noutros anos. Não estou a exagerar de todo."
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-estao-a-provocar-novos-casos-de-cancro/>

183. 2021-09-24 · **vacinas** · emergentes · Errado
   "(...) Porque os animais estavam morrendo, decidiram parar os testes"
   <https://observador.pt/factchecks/fact-check-testes-das-vacinas-contra-a-covid-19-em-animais-foram-interrompidos-porque-eles-estavam-a-morrer/>

184. 2021-09-14 · **vacinas** · emergentes · Errado
   "Óxido de grafeno detetado em análise independente de vacina Covid. Eu sei que custa a entender mas... É o que está a acontecer?!?! E podemos evitar muitas mortes se te juntares a nós!?"
   <https://observador.pt/factchecks/fact-check-estudo-da-universidade-de-almeria-confirma-a-presenca-de-grafeno-nas-vacinas/>

185. 2021-08-30 · **vacinas** · emergentes · Errado
   "Eficácia da vacina da Pfizer é de 1.4% em jovens entre os 12 e os 15 anos".
   <https://observador.pt/factchecks/fact-check-eficacia-da-vacina-da-pfizer-em-criancas-dos-12-aos-15-anos-e-apenas-de-14/>

186. 2021-08-26 · **vacinas** · emergentes · Errado
   Achávamos que a proteína S era um ótimo antígeno alvo, nunca soubemos que a proteína S em si era uma toxina e era uma proteína patogénica. Portanto, ao vacinar as pessoas, estamos inadvertidamente a inoculá-las com uma toxina.
   <https://observador.pt/factchecks/fact-check-proteina-s-das-vacinas-produz-danos-nos-orgaos/>

187. 2021-08-26 · **vacinas** · emergentes · Errado
   " Bill Gates admitiu implantar microchips nas vacinas contra a Covid-19".
   <https://observador.pt/factchecks/fact-check-bill-gates-confirmou-que-chips-foram-implantados-nas-vacinas/>

188. 2021-08-22 · **vacinas** · emergentes · Errado
   Parlamento Europeu aprovou resoluções contra obrigatoriedade da vacina e os certificados covid.
   <https://observador.pt/factchecks/parlamento-europeu-e-contra-obrigatoriedade-da-vacina-e-certificados-covid/>

189. 2021-08-15 · **doenças cardiovasculares** · emergentes · Errado
   "Rogério Samora morreu de doença cardíaca aos 62 anos."
   <https://observador.pt/factchecks/fact-check-rogerio-samora-morreu-na-sequencia-de-uma-paragem-cardiorrespiratoria/>
   ⚠ **Candidata a excluir (Claude Code):** causa de morte de um actor (Rogério Samora); não é desinformação de saúde

190. 2021-07-31 · **vacinas** · emergentes · Errado
   "Conheço várias pessoas saudáveis que morreram dias após a vacina. É normal ninguém investigar se está relacionado?"
   <https://observador.pt/factchecks/fact-check-mortes-apos-vacina-contra-a-covid-19-nao-sao-investigadas/>

191. 2021-07-31 · **vacinas** · emergentes · Errado
   "Japoneses encontram nanopartículas de mRNA no cérebro, coração, fígado, ovários, testículos e outras partes de vacinados."
   <https://observador.pt/factchecks/fact-check-estudo-japones-detetou-nanoparticulas-de-mrna-espalhadas-em-humanos-e-comprovou-infertilidade/>

192. 2021-07-31 · **vacinas** · emergentes · Errado
   "Morrem mais vacinados que não vacinados"
   <https://observador.pt/factchecks/fact-check-morrem-mais-pessoas-vacinadas-que-pessoas-sem-a-vacina/>

193. 2021-07-27 · **vacinas** · emergentes · Errado
   "Médicos apagaram dados que demonstravam uma taxa de 82% de abortos em mulheres vacinadas".
   <https://observador.pt/factchecks/fact-check-medicos-apagaram-dados-sobre-abortos-em-mulheres-vacinadas/>

194. 2021-07-22 · **vacinas** · emergentes · Errado
   "Presidente da Pfizer não tomou a própria vacina; 'tenho boa saúde', alegou. Óbvio que não, o CEO do McDonald's também não come hambúrgueres."
   <https://observador.pt/factchecks/fact-check-ceo-da-pfizer-recusou-tomar-a-propria-vacina/>

195. 2021-07-22 · **vacinas** · emergentes · Errado
   "Mais mortalidade associada à vacina da Covid-19 do que o somatório de todas as vacinas nos 31 anos anteriores".
   <https://observador.pt/factchecks/fact-check-mais-mortalidade-associada-a-vacina-da-covid-19-do-que-o-somatorio-de-todas-as-vacinas-nos-31-anos-anteriores/>

196. 2021-07-06 · **vacinas** · emergentes · Errado
   "Não moro em Israel mas vejo o que se passa em Israel e nos EUA, entretanto, quase 5.500 mil pessoas morreram devido à vacina e outras 360,000 feridas com fenómenos irreversíveis. Isto é informação diretamente do site da Associação Médica dos EUA... Não é um artigo de jornal nem nada."
   <https://observador.pt/factchecks/fact-check-associacao-medica-dos-estados-unidos-revelou-5-500-mortes-por-toma-da-vacina/>

197. 2021-07-06 · **vacinas** · emergentes · Errado
   "É claro que António Costa nunca foi vacinado."
   <https://observador.pt/factchecks/fact-check-antonio-costa-nunca-foi-vacinado-contra-a-covid-19/>

198. 2021-06-30 · **vacinas** · emergentes · Errado
   "Banco de dados vazado mostra que vacinados estão sendo rastreados em tempo real, 5G"
   <https://observador.pt/factchecks/fact-check-movimentos-de-pessoas-vacinadas-sao-controlados-numa-base-de-dados-secreta/>

199. 2021-06-30 · **vacinas** · emergentes · Errado
   "Os cientistas usaram essas informações para criar uma vacina contra o fundamentalismo religioso. ESSA VACINA viral, que se propaga através do ar, FOI PROJETADA PARA INIBIR A EXPRESSÃO DO GENE VMAT2, fazendo com que as pessoas se tornem menos religiosas, ou seja, que tenham menos fé no Criador."
   <https://observador.pt/factchecks/fact-check-foi-criada-uma-vacina-que-anula-a-predisposicao-para-o-fundamentalismo-religioso/>

200. 2021-06-29 · **vacinas** · emergentes · Errado
   "Estão colocando nanopartículas com G*R*A*F*E*N*O nas v*cin*s, nas máscaras, nos cotonetes do teste da CONVIDE 19, nos alimentos, etc."
   <https://observador.pt/factchecks/fact-check-vacinas-contem-grafeno-na-sua-composicao/>

201. 2021-06-29 · **vacinas** · emergentes · Errado
   "Vacinas contra a Covid-19 não criam imunidade"
   <https://observador.pt/factchecks/fact-check-vacinas-nao-criam-imunidade-contra-a-covid-19/>

202. 2021-06-28 · **vacinas** · emergentes · Errado
   "No momento, as companhias aéreas estão alertando aos clientes vacinados, sobre o alto risco de coágulos sanguíneos por meio do mRNA experimental".
   <https://observador.pt/factchecks/fact-check-vacinados-contra-a-covid-19-correm-maior-risco-de-trombose-durante-um-voo/>

203. 2021-06-28 · **psiquiatra** · saude-mental · Errado
   Publicação mostra tabela sobre casos de problemas de pele, de visão e psiquiátricos causados pelas vacinas contra a Covid-19.
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-causam-problemas-de-visao-reacoes-cutaneas-e-episodios-psiquiatricos/>

204. 2021-06-28 · **vacinas** · emergentes · Errado
   Publicação mostra tabela sobre casos de problemas de pele, de visão e psiquiátricos causados pelas vacinas contra a Covid-19.
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-causam-problemas-de-visao-reacoes-cutaneas-e-episodios-psiquiatricos/>

205. 2021-06-28 · **vacinas** · emergentes · Enganador
   "A vacina [da Pfizer] ainda está na fase experimental, apesar de estar a ser dada ao público"
   <https://observador.pt/factchecks/fact-check-vacinacao-contra-a-covid-19-esta-a-ser-feita-de-forma-experimental/>

206. 2021-06-28 · **vacinas** · emergentes · Errado
   "A maioria dos que tomaram a vacina da Covid-19 está morta no ano 2025. Agora sabemos os seguintes factos"
   <https://observador.pt/factchecks/fact-check-estudo-cientifico-revela-que-maioria-das-pessoas-vacinada-contra-a-covid-19-vai-estar-morta-em-2025/>

207. 2021-06-24 · **vacinas** · emergentes · Enganador
   Partilhem pelos vossos amigos covimalakas que estão todos felizes por levarem uma injeção de mRNA, que acreditam que os vai proteger (mal sabem eles o que os espera de 6 meses a 2 anos). Mais que raio, porque não inventam uma vacina contra a idiotice?
   <https://observador.pt/factchecks/fact-check-farmaceuticas-omitiram-dados-sobre-a-eficacia-das-vacinas-contra-a-covid-19/>

208. 2021-06-19 · **vacinas** · emergentes · Errado
   "Esse plasma é feito de anticorpos de pessoas que recuperaram do vírus, mas a vacina elimina esses anticorpos e está a tornar esse plasma ineficaz a tratar outros doentes com Covid-19."
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-eliminam-os-anticorpos-naturais/>

209. 2021-06-04 · **vacinas** · emergentes · Enganador
   “É-lhes referido, como aconselha o protocolo da Pfizer [a quem é vacinado], que se mantenham abstinentes de relações sexuais por um período de 30 dias após a toma da injeção?”
   <https://observador.pt/factchecks/fact-check-vacina-da-pfizer-obriga-a-um-mes-de-abstinencia-sexual/>

210. 2021-06-04 · **vacinas** · emergentes · Errado
   "Mortes relacionadas por efeitos adversos de vacinas dispararam em 2021?"
   <https://observador.pt/factchecks/fact-check-mortes-relacionadas-com-efeitos-adversos-de-vacinas-dispararam-em-2021/>

211. 2021-06-03 · **vacinas** · emergentes · Errado
   "Vacina da Covid-19 provoca aneurisma"
   <https://observador.pt/factchecks/fact-check-vacina-contra-a-covid-19-pode-provocar-aneurisma/>

212. 2021-05-28 · **vacinas** · emergentes · Errado
   "Se quem foi vacinado não pode doar sangue é porque algo está profundamente errado"
   <https://observador.pt/factchecks/fact-check-estados-unidos-impedem-vacinados-contra-a-covid-19-de-darem-sangue/>

213. 2021-05-27 · **vacinas** · emergentes · Errado
   "Vacina para celebridades"
   <https://observador.pt/factchecks/fact-check-seringas-adulteradas-estao-a-ser-usadas-para-simular-vacinacao/>

214. 2021-05-24 · **vacinas** · emergentes · Errado
   "Lembrei deste vídeo onde diz que Bill Gates já tinha investido 10 mil milhões de dólares em vacinas e Bill Gates diz que o retorno no investimento nas vacinas é de 20 para 1. Dizia isto antes da pandemia."
   <https://observador.pt/factchecks/fact-check-bill-gates-e-o-responsavel-pela-pandemia-de-covid-19/>

215. 2021-05-22 · **vacinas** · emergentes · Errado
   "As propriedades magnéticas da vacina..."
   <https://observador.pt/factchecks/fact-check-teste-do-iman-prova-que-vacinas-contra-a-covid-19-servem-para-implantar-um-microchip/>

216. 2021-05-19 · **vacinas** · emergentes · Errado
   "A vacina de RNA da Moderna contém luciferina dissolvida em 66,6 ml de fosfato. Isto é real? Preciso de pesquisar isto. É muito macabro para ser real"
   <https://observador.pt/factchecks/fact-check-vacina-da-moderna-contem-luciferina/>

217. 2021-05-19 · **vacinas** · emergentes · Errado
   "Bebé de dois anos morre durante experimentos da vacina Covid-19 da Pfizer em crianças."
   <https://observador.pt/factchecks/fact-check-crianca-de-dois-anos-morreu-durante-testes-da-vacina-da-pfizer-em-menores-de-12-anos/>

218. 2021-04-20 · **doenças cardiovasculares** · emergentes · Enganador
   Os coronavirus causam 30% de todas as constipações há décadas. Influenza e Tuberculose têm uma alta taxa de contaminação e são potencialmente mais letais do que o Sars-Cov-2. Cancro e doenças cardiovasculares matam, juntas, quase 30 milhões anualmente no mundo. Quando tomamos medidas parecidas?
   <https://observador.pt/factchecks/fact-check-30-das-constipacoes-sao-causadas-por-coronavirus-e-influenza-e-tuberculose-sao-mais-letais-que-sars-cov-2/>

219. 2021-03-22 · **vacinas** · emergentes · Enganador
   "Vacinas não foram aprovadas e fabricantes não podem ser responsabilizados?"
   <https://observador.pt/factchecks/fact-check-vacinas-nao-foram-aprovadas-e-fabricantes-nao-podem-ser-responsabilizados/>

220. 2021-03-22 · **vacinas** · emergentes · Errado
   "Médicos e especialistas alertam contra a toma de vacina experimental"
   <https://observador.pt/factchecks/fact-check-medicos-alertam-contra-vacina-em-manchete-de-the-times/>

221. 2021-03-19 · **vacinas** · emergentes · Enganador
   "Militar da GNR ficou surdo depois de ser vacinado contra a Covid-19"
   <https://observador.pt/factchecks/fact-check-militar-da-gnr-desenvolve-surdez-depois-de-ser-vacinado-contra-a-covid-19/>

222. 2021-03-17 · **vacinas** · emergentes · Errado
   "Jornal de 2011. Fica claro que o intuito de Bill Gates com as suas vacinas, 'despopulacão através de vacinas forçadas: a solução zero carbono' detalhe, não se encontra quase nada sobre isso na internet, mas esta senhora tinha guardado o jornal."
   <https://observador.pt/factchecks/fact-check-bill-gates-defendeu-a-reducao-da-populacao-mundial-atraves-de-vacinas-forcadas/>

223. 2021-03-17 · **vacinas** · emergentes · Errado
   "Os Comandantes e Co-pilotos da TAP e de outras companhias aéreas estão proibidos - e bem! - de tomar a "vacina" do covid-19, dado que se suspeita que esta reduza as capacidades de pilotagem e decisórias. Quem a tiver tomado, nunca mais poderá pilotar."
   <https://observador.pt/factchecks/fact-check-pilotos-da-tap-foram-proibidos-de-tomar-a-vacina-contra-a-covid-19/>

224. 2021-03-08 · **vacinas** · emergentes · Errado
   — "Mas ao menos sabe o que está me injetando?" — "Está proibido saber, a fórmula é confidencial"
   <https://observador.pt/factchecks/fact-check-formula-da-vacina-contra-a-covid-19-e-confidencial/>

225. 2021-02-28 · **vacinas** · emergentes · Errado
   " As vacinas não passaram pelos protocolos de teste adequados e não são seguras."
   <https://observador.pt/factchecks/fact-check-as-vacinas-contra-a-covid-19-sao-inseguras-e-nao-foram-devidamente-testadas/>

226. 2021-02-23 · **vacinas** · emergentes · Errado
   "Importantíssimo: Vacina mais perigosa do que o vírus"
   <https://observador.pt/factchecks/fact-check-vacina-contra-a-covid-19-e-mais-perigosa-do-que-o-proprio-virus/>

227. 2021-02-22 · **vacinas** · emergentes · Errado
   “Os dados vão até 29 de janeiro de 2021, com 11.249 eventos adversos registados, incluindo 501 mortes após injeções experimentais de RNA, COVID, da Pfizer e Moderna”
   <https://observador.pt/factchecks/fact-check-as-tomas-experimentais-da-vacina-contra-a-covid-19-causaram-501-mortes-nos-eua/>

228. 2021-02-21 · **ginecologista** · menopausa · Errado
   "Um ginecologista atender um travesti já é uma aberração. Ser preso por não atender é uma maior ainda. Ser algemado é o fim dos tempos"
   <https://observador.pt/factchecks/fact-check-ginecologista-detido-no-brasil-por-recusar-tratamento-a-uma-pessoa-travesti/>
   ⚠ **Candidata a excluir (Claude Code):** caso judicial e social; o ginecologista é só o contexto

229. 2021-02-21 · **vacinas** · emergentes · Errado
   "Pfizer informa que vacina traz risco para nascimento de crianças com má formação".
   <https://observador.pt/factchecks/fact-check-pfizer-informou-que-vacina-traz-risco-de-ma-formacao-nos-bebes/>

230. 2021-02-08 · **gripe A** · emergentes · Errado
   Odeio ter que explicar isto a todos os idiotas que se consideram jornalistas. A Covid-19 quer literalmente dizer doença viral infecciosa originada na China e o número 19 é por se tratar do 19º vírus a ter origem na China.
   <https://observador.pt/factchecks/fact-check-o-nome-covid-19-significa-doenca-originaria-da-china/>
   ⚠ **Candidata a excluir (Claude Code):** a afirmação não fala de gripe A; é sobre o nome da covid-19

231. 2021-02-04 · **vacinas** · emergentes · Errado
   "8 milhões de euros destinados à compra da vacina da Pfizer foram desviados. Os registos foram ‘limpos’ "
   <https://observador.pt/factchecks/fact-check-foram-desviados-8-milhoes-de-euros-destinados-a-compra-da-vacina-da-pfizer/>

232. 2021-01-27 · **vacinas** · emergentes · Errado
   "O filho do Bolsonaro que fez campanha contra [a] vacina CoronaVac, furou a fila da vacina para se imunizar. (...) furou a fila deixando médicos da linha da frente sem essa dose."
   <https://observador.pt/factchecks/fact-check-filho-de-bolsonaro-ultrapassou-profissionais-de-saude-e-foi-vacinado-contra-a-covid-19/>

233. 2021-01-21 · **vacinas** · emergentes · Errado
   Quando lançaram a bomba "covid" não mataram as pessoas que queriam, então criaram a vacina mesmo para isso, estão a ir bem
   <https://observador.pt/factchecks/fact-check-vacinas-contra-a-covid-19-sao-plano-alternativo-para-matar-pessoas/>

234. 2021-01-10 · **vacinas** · emergentes · Errado
   "Kamala Harris a receber a vacina. Ver até ao fim...de rir". Publicação sugere que Kamala Harris encenou toma da vacina contra a Covid-19 com vídeo que mostra enfermeira a "dobrar" a agulha
   <https://observador.pt/factchecks/fact-check-kamala-harris-simulou-momento-em-que-foi-vacinada-contra-a-covid-19/>

235. 2020-12-30 · **vacinas** · emergentes · Enganador
   Homem morre de ataque cardíaco após receber vacina da Covid-19
   <https://observador.pt/factchecks/fact-check-homem-morre-de-ataque-cardiaco-apos-receber-vacina-da-covid-19/>

236. 2020-12-29 · **vacinas** · emergentes · Enganador
   “O documento informativo da FDA sobre a vacina Covid da firma Moderna. Seis pessoas que tomaram a vacina morreram. Em 2 casos, a causa da morte é desconhecida. A maioria das pessoas morreu 30-45 dias após a injecção. Essas vacinas não curam nada. Essas vacinas são a doença”
   <https://observador.pt/factchecks/fact-check-seis-voluntarios-mortos-depois-de-receberem-a-vacina-contra-a-covid-19/>

237. 2020-12-28 · **vacinas** · emergentes · Errado
   Chefe de pesquisa da Pfizer disse que vacina contra a Covid-19 leva à esterilização feminina?
   <https://observador.pt/factchecks/fact-check-chefe-de-pesquisa-da-pfizer-disse-que-vacina-contra-a-covid-19-leva-a-esterilizacao-feminina/>

238. 2020-12-26 · **vacinas** · emergentes · Errado
   “O resultado dessa vacina será que, em curto prazo, 97% dos homens inoculados ficarão estéreis.”
   <https://observador.pt/factchecks/fact-check-vacina-contra-a-covid-19-deixa-97-dos-homens-estereis/>

239. 2020-12-22 · **vacinas** · emergentes · Errado
   "Merecemos um esclarecimento...vítima da vacina morre após tomá-la"
   <https://observador.pt/factchecks/fact-check-morreu-a-enfermeira-que-desmaiou-apos-receber-a-vacina-contra-a-covid-19/>

240. 2020-12-21 · **vacinas** · emergentes · Errado
   A maior parte da população já tem imunidade natural ao vírus. Seja através de imunidade específica (...), resultante de infeção prévia por Sars-cov-2 ou por imunidade cruzada, resultante da exposição a outros coronavirus
   <https://observador.pt/factchecks/fact-check-maior-parte-da-populacao-ja-esta-imune-ao-sars-cov-2/>

241. 2020-12-08 · **vacinas** · emergentes · Errado
   "Esta família turca chegou à Alemanha há 50 anos. Se os tivessem mandado para a terra deles, o da camisola amarela, Uğur Şahin, agora um famoso médico e imunologista alemão, director da empresa BioNTech, nunca teria produzido uma vacina contra o coronavírus."
   <https://observador.pt/factchecks/cientista-que-produziu-vacina-contra-a-covid-19-e-a-crianca-de-uma-foto-de-emigrantes-turcos-na-alemanha/>
   ⚠ **Candidata a excluir (Claude Code):** imigração e política (família do fundador da BioNTech)

242. 2020-12-03 · **vacinas** · emergentes · Errado
   "Costa rejeita que idosos com mais de 75 anos fiquem de fora das vacinas. Coisa que foi proposta pelo PS. Ou seja… é preciso ter muita lata! Disto não fala a oposição!"
   <https://observador.pt/factchecks/fact-check-idosos-excluidos-da-vacinacao-contra-a-covid-19-foi-uma-proposta-do-ps/>
   ⚠ **Candidata a excluir (Claude Code):** política partidária sobre a ordem da vacinação

243. 2020-11-26 · **vacinas** · emergentes · Errado
   "Covid-19 não é o nome do vírus. Significa certificado de identificação da vacinação com inteligência artificial"
   <https://observador.pt/factchecks/fact-check-covid-19-e-um-certificado-de-identificacao-da-vacinacao-com-inteligencia-artificial/>

244. 2020-11-18 · **bipolar** · saude-mental · Enganador
   "Este é o Lubjomir, um gajo bipolar. Há dias dizia ao Governo para ter tomates e os restaurantes fechar. Agora que o Governo finalmente arranjou tomates, diz que a restauração andam a matar. Hipócrita!"
   <https://observador.pt/factchecks/fact-check-chef-lubjomir-defendeu-ha-dias-fecho-de-restaurantes/>
   ⚠ **Candidata a excluir (Claude Code):** "bipolar" usado como insulto a um político

245. 2020-11-10 · **vacinas** · emergentes · Errado
   "No Peru, a vacinação contra a Covid-19 começou a ser obrigatória e quem se recusar a tomar será preso”
   <https://observador.pt/factchecks/fact-check-no-peru-da-prisao-recusar-a-vacina-contra-a-covid-19/>

246. 2020-10-28 · **vacinas** · emergentes · Errado
   “5% de letalidade. População toda vacinada vai matar mais que o covid. No momento nenhuma vacina deve ter obrigatória! se não morrer pelo vírus, pode morrer por se imunizar.”
   <https://observador.pt/factchecks/fact-check-vacina-coronavac-pode-matar-mais-que-a-covid-19/>

247. 2020-10-22 · **vacinas** · emergentes · Errado
   “A vida imitando a arte! É a msm coisa que a china faz com os celulares, eles usam iPhone e vendem xiome”
   <https://observador.pt/factchecks/fact-check-china-compra-vacina-de-oxford-para-distribuir-a-populacao-em-vez-de-usar-a-que-produz/>
   ⚠ **Candidata a excluir (Claude Code):** sem conteúdo de saúde visível (telemóveis chineses)

248. 2020-10-08 · **vacinas** · emergentes · Errado
   "Muitas pessoas todos os anos, às vezes mais de 100 mil, e apesar da vacina, morrem de gripe. Vamos fechar o nosso país? Não".
   <https://observador.pt/factchecks/fact-check-covid-19-e-muito-menos-letal-que-a-gripe/>

249. 2020-10-06 · **vacinas** · emergentes · Errado
   Vacina Covid-19 acelerada altera o DNA humano, transforma as pessoas em propriedades geneticamente modificadas
   <https://observador.pt/factchecks/fact-check-vacina-mrna-para-a-covid-19-altera-adn-humano/>

250. 2020-10-01 · **covid sintomas** · emergentes · Errado
   "Os vírus que são supostamente "tão agressivos" apresentam alguns sintomas nos pacientes porque o corpo libera alarmes de um intruso (febre, dor de cabeça, vômito, etc.) e de acordo com a teoria de Koch a resposta [sobre se os assintomáticos são casos reais de positivos] é NÃO."
   <https://observador.pt/factchecks/fact-check-doentes-com-covid-19-assintomaticos-sao-falsos-positivos/>

251. 2020-09-17 · **covid sintomas** · emergentes · Errado
   "Tosse com sangue, olhos inchados, fadiga, tosse com catarro espesso, arrepios, dor de cabeça, diarreia, nariz entupido, náusea, dor articular, falta de ar, febre são os principais sintomas da Covid-19"
   <https://observador.pt/factchecks/fact-check-olhos-inchados-nariz-entupido-e-tosse-com-sangue-sao-principais-sintomas-da-covid-19/>

252. 2020-09-16 · **vacinas** · emergentes · Errado
   Após aplicar vacina que esterelizou milhares de homens e mulheres na Nigéria, Bill Gates está injetando vírus da poliomielite (paralisia infantil) nas pessoas do Sudão através de falsas vacinas.
   <https://observador.pt/factchecks/fact-check-bill-gates-usou-vacinas-falsas-para-espalhar-poliomielite-no-sudao/>

253. 2020-07-24 · **vacinas** · emergentes · Errado
   Citação atribuída ao diretor-geral da OMS: "Finalmente achamos uma vacina que funciona! Parabéns à China pelo exemplo de combate ao Covid-19! Todos devem comprar a vacina chinesa agora!"
   <https://observador.pt/factchecks/fact-check-oms-aprovou-vacina-chinesa-e-recusou-solucoes-americanas-e-brasileiras/>

254. 2020-07-17 · **vacinas** · emergentes · Errado
   “Ministra da Austrália faz propaganda tomando vacina contra o Covid-19 distribuída pela China, porem observe que nem a capinha da seringa foi retirada, se ela não tomou porque a população da Austrália tomaria?”
   <https://observador.pt/factchecks/fact-check-video-mostra-primeira-ministra-da-australia-a-tomar-vacina-contra-a-covid-19/>

255. 2020-06-05 · **covid sintomas** · emergentes · Errado
   Nenhuma destas pessoas contraiu a infecção por Covid-19 e, por conseguinte, as conclusões desta investigação confirmam, de facto, a total futilidade das medidas de precaução tomadas pelos vários governos do mundo.
   <https://observador.pt/factchecks/fact-check-assintomaticos-da-covid-19-nao-transmitem-o-virus-a-outros/>

256. 2020-05-18 · **vacinas** · emergentes · Errado
   “Um estudo realizado pela Armed Forces Health Surveillance Branch com militares nos EUA e publicado em janeiro de 2020 mostrou que a vacina contra influenza parece aumentar em 36% o risco de infecção pelo Covid-19.”
   <https://observador.pt/factchecks/fact-check-vacina-contra-a-gripe-aumenta-risco-de-apanhar-covid-19/>

257. 2020-04-30 · **vacinas** · emergentes · Errado
   "A primeira voluntária no teste de vacina contra o coronavírus do Reino Unido morreu.”
   <https://observador.pt/factchecks/fact-check-morreu-a-primeira-voluntaria-que-recebeu-a-vacina-da-covid-19/>

258. 2020-04-29 · **vacinas** · emergentes · Errado
   Bill Gates: "Vamos infetar as pessoas com o vírus e depois vender a vacina..."
   <https://observador.pt/factchecks/fact-check-bill-gates-criou-a-pandemia-de-coronavirus-para-vender-vacina/>

259. 2020-04-07 · **vacinas** · emergentes · Errado
   Barack Obama disse: "[Serei] cúmplice de não denunciar esse ato malvado que querem fazer com o povo africano. Acima de tudo, eu nasci na América mas sou africano de sangue, não vou permitir que o Ocidente mate o povo africano com os seus testes em vacinas tóxicas."
   <https://observador.pt/factchecks/fact-check-barack-obama-avisou-africanos-para-nao-aceitarem-vacinas-europeias-ou-americanas/>

260. 2020-03-14 · **vacinas** · emergentes · Errado
   Vacina cubana curou 1.500 infetados pelo coronavírus
   <https://observador.pt/factchecks/fact-check-vacina-cubana-curou-1-500-infetados-pelo-novo-coronavirus/>

261. 2019-12-10 · **vacinas** · emergentes · Errado
   “Gates repetidamente expressou sua aprovação claramente pela a redução populacional global e financiou programas de esterilização em massa; impulsionou programas de vacinação generalizada que causaram grandes danos”.
   <https://observador.pt/factchecks/as-vacinas-sao-uma-arma-biologica-para-reduzir-a-populacao-mundial/>

262. 2019-11-30 · **osteoporose** · menopausa · Errado
   "[O leite] rouba o cálcio dos ossos porque é um produto altamente ácido. Prova disso é que os países que mais consomem este produto são líderes em osteoporose, osteopenia e fratura do quadril."
   <https://observador.pt/factchecks/fact-check-o-leite-rouba-calcio-aos-ossos-e-causa-osteoropose/>

263. 2019-11-30 · **osteopenia** · menopausa · Errado
   "[O leite] rouba o cálcio dos ossos porque é um produto altamente ácido. Prova disso é que os países que mais consomem este produto são líderes em osteoporose, osteopenia e fratura do quadril."
   <https://observador.pt/factchecks/fact-check-o-leite-rouba-calcio-aos-ossos-e-causa-osteoropose/>

264. 2019-09-30 · **suicídio** · saude-mental · Errado
   "Médicos holísticos que descobriram que as vacinas continham enzimas cancerígenas foram encontrados mortos e a causa foi considerada suicídio (...). Foi dito que o médico poderia ter sido assassinado devido à pesquisa controversa que estava conduzindo".
   <https://observador.pt/factchecks/medicos-que-descobriram-enzimas-do-cancro-em-vacinas-foram-encontrados-mortos/>

265. 2019-09-30 · **vacinas** · emergentes · Errado
   "Médicos holísticos que descobriram que as vacinas continham enzimas cancerígenas foram encontrados mortos e a causa foi considerada suicídio (...). Foi dito que o médico poderia ter sido assassinado devido à pesquisa controversa que estava conduzindo".
   <https://observador.pt/factchecks/medicos-que-descobriram-enzimas-do-cancro-em-vacinas-foram-encontrados-mortos/>
