#!/usr/bin/env python3
"""
5_fetch_google_trends.py — Google Trends por GRUPOS COM ÂNCORA
================================================================
Reescrito a 18/09/2026 (Crítico nº 6). Método: docs/metodo/2026-09-18-reguas-e-ancoras.md.
O script anterior (uma keyword de cada vez, cada uma na sua régua, 0 quando falhava) está
em _5_fetch_google_trends_antigo_pytrends_por_keyword.py e no histórico do git.

O QUE FAZ
  1. Lê as keywords activas da base de dados (chave pública — é leitura).
  2. Por eixo, agrupa-as de 4 em 4 com a ÂNCORA do eixo (scripts/trends_grupos.json) e
     pede cada grupo ao Google Trends. Um pedido = uma régua.
  3. Passo 2: os termos que ficaram esmagados (máximo < 15) voltam a ser pedidos com uma
     âncora secundária — um termo do eixo que no passo 1 ficou entre 20 e 40 —, e a
     conversão faz-se em dois saltos.
  4. Passo 3: as quatro âncoras juntas, para ligar os eixos.
  5. Calibra tudo para a régua de referência de cada eixo (o pedido onde a âncora é maior)
     e calcula o TOP 5 de cada eixo — o ranking verdadeiro, na mesma régua.
  6. Grava um LOTE: lote → pedidos → pontos → calibrados. NUNCA acumula sobre lotes
     anteriores; o dashboard lê de um lote só. Falhas ficam como `falhou`/`sem_dados`, e os
     pontos que não vieram ficam NULL — nunca 0.
  7. Calcula os ALERTAS do lote (fase 3, scripts/trends_alertas.py — regra em
     docs/metodo/2026-09-18-alertas-regra.md) e grava-os em trends_alertas. Se este passo
     falhar, o lote fica gravado na mesma: os alertas recalculam-se com
     `python3 scripts/trends_alertas.py --lote <id> --gravar`.

COMO CORRER
  python3 scripts/5_fetch_google_trends.py --dry-run                # não grava nada
  python3 scripts/5_fetch_google_trends.py --dry-run --eixo menopausa
  SUPABASE_SERVICE_ROLE_KEY=... python3 scripts/5_fetch_google_trends.py --gravar

  --timeframe   'today 12-m' (por omissão; semanal) ou 'today 5-y' (semanal, base histórica)
  --amostras N  repete cada pedido N vezes (o Trends é uma amostra) — v1: só 1
  Ambiente: .venv-trends (pytrends==4.9.2, urllib3<2.0)
"""
import argparse, json, os, statistics, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(RAIZ, "scripts"))   # trends_alertas.py, ao lado deste
CFG = json.load(open(os.path.join(RAIZ, "scripts", "trends_grupos.json")))
AXES = ["saude-mental", "alimentacao", "menopausa", "emergentes"]

# ── ligação à base ──────────────────────────────────────────────────────────
def env_publico():
    env = {}
    for l in open(os.path.join(RAIZ, ".env")):
        if "=" in l and not l.startswith("#"):
            k, v = l.strip().split("=", 1); env[k] = v.strip('"')
    return env["VITE_SUPABASE_URL"], env["VITE_SUPABASE_PUBLISHABLE_KEY"]

def rest(url, key, path, method="GET", body=None, prefer=None):
    req = urllib.request.Request(url + "/rest/v1/" + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"apikey": key, "Authorization": "Bearer " + key,
                 "Content-Type": "application/json", **({"Prefer": prefer} if prefer else {})})
    with urllib.request.urlopen(req) as r:
        txt = r.read().decode()
        return json.loads(txt) if txt else None

def keywords_activas(url, anon):
    rows = rest(url, anon, "keywords?select=term,axis&is_active=eq.true&order=axis,term")
    por_eixo = {a: [] for a in AXES}
    for r in rows:
        if r["axis"] in por_eixo: por_eixo[r["axis"]].append(r["term"])
    return por_eixo

# ── pedidos ao Google ───────────────────────────────────────────────────────
def pedir(pt, termos, timeframe):
    """Um pedido = uma régua. Devolve (status, {termo: [(data, valor, parcial)]}, erro)."""
    df = None
    for tentativa in (1, 2):
        try:
            pt.build_payload(termos, cat=CFG["categoria"], geo=CFG["geo"], timeframe=timeframe)
            df = pt.interest_over_time(); break
        except Exception as e:
            erro = "%s: %s" % (type(e).__name__, str(e)[:200])
            # 429 ao fim de ~50 pedidos a 15 s (visto a 18/09/2026): esperar e repetir UMA vez
            if "429" in erro and tentativa == 1:
                print("    429 — espera de %ds e repete" % CFG["espera_apos_429"], flush=True)
                time.sleep(CFG["espera_apos_429"]); continue
            return "falhou", {}, erro
    if df is None or df.empty:
        return "sem_dados", {}, None
    parcial = df["isPartial"].tolist() if "isPartial" in df else [False] * len(df)
    out = {}
    for t in termos:
        if t not in df: continue
        out[t] = [(d.to_pydatetime().replace(tzinfo=timezone.utc), int(v), bool(p))
                  for d, v, p in zip(df.index, df[t].tolist(), parcial)]
    return "recolhido", out, None

def granularidade_por_datas(datas):
    """Pelo intervalo mediano entre datas consecutivas — 'today 3-m' vem diario, nao semanal."""
    if len(datas) < 2: return None
    gaps = sorted((b - a).total_seconds() / 3600 for a, b in zip(datas, datas[1:]))
    g = gaps[len(gaps) // 2]
    return "horaria" if g < 23 else "diaria" if g < 24 * 6 else "semanal" if g < 24 * 27 else "mensal"

def dedup_passo2(pedidos, calibrados):
    """Um termo esmagado e calibrado no passo 1 E no passo 2: fica a do passo 2 (mais resolucao)."""
    melhor = {}
    for e, t, d, ve, f, i in calibrados:
        k = (e, t, d)
        if k not in melhor or pedidos[i]["passo"] > pedidos[melhor[k][5]]["passo"]:
            melhor[k] = (e, t, d, ve, f, i)
    return list(melhor.values())

def mediana(vals): return statistics.median(vals) if vals else 0
def maximo(vals): return max(vals) if vals else 0

def grupos(termos, ancora, n):
    """[termo...] → [[ancora, t1, t2, t3, t4], ...]. A âncora vai sempre em primeiro."""
    resto = [t for t in termos if t != ancora]
    k = n - 1
    return [[ancora] + resto[i:i + k] for i in range(0, len(resto), k)]

# ── a corrida ───────────────────────────────────────────────────────────────
def correr(args):
    from pytrends.request import TrendReq
    url, anon = env_publico()
    por_eixo = keywords_activas(url, anon)
    eixos = [args.eixo] if args.eixo else AXES
    pt = TrendReq(hl="pt-PT", tz=0, timeout=(10, 30), retries=0)
    pausa = CFG["pausa_segundos"]
    pedidos = []   # dicts: eixo, passo, amostra, termos, ancora, status, erro, series{termo:[(d,v,p)]}
    log = lambda s: print(s, flush=True)

    def executa(eixo, passo, termos, ancora, amostra=1):
        status, series, erro = pedir(pt, termos, args.timeframe)
        p = dict(eixo=eixo, passo=passo, amostra=amostra, termos=termos, ancora=ancora,
                 status=status, erro=erro, series=series, fetched_at=datetime.now(timezone.utc))
        pedidos.append(p)
        res = "  ".join("%s=%d" % (t[:18], maximo([v for _, v, _ in series.get(t, [])])) for t in termos) \
              if status == "recolhido" else (erro or status)
        log("  [%s p%d] %s" % (eixo or "entre-eixos", passo, res))
        time.sleep(pausa)
        return p

    # passo 1
    log("PASSO 1 — grupos com a âncora do eixo  (%s)" % args.timeframe)
    for eixo in eixos:
        anc = CFG["ancoras"][eixo]
        for g in grupos(por_eixo[eixo], anc, CFG["termos_por_pedido"]):
            executa(eixo, 1, g, anc)

    # passo 2 — esmagados, com âncora secundária escolhida pelos resultados do passo 1
    log("PASSO 2 — os esmagados (máx < %d), com âncora secundária" % CFG["esmagado_abaixo_de"])
    lo, hi = CFG["ancora_secundaria_entre"]
    for eixo in eixos:
        anc = CFG["ancoras"][eixo]
        p1 = [p for p in pedidos if p["eixo"] == eixo and p["passo"] == 1 and p["status"] == "recolhido"]
        # referência do eixo: o pedido onde a âncora tem a mediana mais alta (melhor resolução)
        ref = max(p1, key=lambda p: mediana([v for _, v, _ in p["series"].get(anc, [])]), default=None)
        if not ref: log("  [%s] sem pedidos recolhidos no passo 1" % eixo); continue
        med_anc_ref = mediana([v for _, v, _ in ref["series"][anc]])
        # tamanho de cada termo na régua de referência
        tam = {}
        for p in p1:
            m_anc = mediana([v for _, v, _ in p["series"].get(anc, [])])
            if not m_anc: continue
            f = med_anc_ref / m_anc
            for t, s in p["series"].items():
                if t != anc: tam[t] = dict(max=maximo([v for _, v, _ in s]) * f, med=mediana([v for _, v, _ in s]) * f)
        esmagados = [t for t, x in tam.items() if x["max"] < CFG["esmagado_abaixo_de"]]
        candidatas = sorted([t for t, x in tam.items() if lo <= x["med"] <= hi], key=lambda t: -tam[t]["med"])
        if not esmagados: log("  [%s] nada esmagado" % eixo); continue
        if not candidatas:
            log("  [%s] %d esmagados mas NENHUMA âncora secundária entre %d e %d — ficam como estão: %s"
                % (eixo, len(esmagados), lo, hi, ", ".join(esmagados))); continue
        sec = candidatas[0]
        log("  [%s] âncora secundária: %s (mediana %.0f na régua de referência); esmagados: %d"
            % (eixo, sec, tam[sec]["med"], len(esmagados)))
        for g in grupos(esmagados, sec, CFG["termos_por_pedido"]):
            executa(eixo, 2, g, sec)

    # passo 3 — as âncoras juntas
    if not args.eixo:
        log("PASSO 3 — as quatro âncoras juntas")
        executa(None, 3, [CFG["ancoras"][e] for e in AXES], None)

    # calibração
    log("CALIBRAÇÃO — para a régua de referência de cada eixo")
    calibrados = []  # (eixo, termo, data, valor_eixo, factor, pedido_idx)
    top5 = {}
    for eixo in eixos:
        anc = CFG["ancoras"][eixo]
        p1 = [p for p in pedidos if p["eixo"] == eixo and p["passo"] == 1 and p["status"] == "recolhido"]
        ref = max(p1, key=lambda p: mediana([v for _, v, _ in p["series"].get(anc, [])]), default=None)
        if not ref: continue
        med_ref = mediana([v for _, v, _ in ref["series"][anc]])
        factor_p1 = {}
        for p in p1:
            m = mediana([v for _, v, _ in p["series"].get(anc, [])])
            factor_p1[id(p)] = med_ref / m if m else None
        for p in pedidos:
            if p["eixo"] != eixo or p["status"] != "recolhido": continue
            if p["passo"] == 1:
                f = factor_p1[id(p)]
            else:  # passo 2: salto pela secundária, que está num pedido do passo 1
                sec = p["ancora"]
                p_sec = next((q for q in p1 if sec in q["series"] and factor_p1.get(id(q))), None)
                m_sec_p1 = mediana([v for _, v, _ in p_sec["series"][sec]]) if p_sec else 0
                m_sec_p2 = mediana([v for _, v, _ in p["series"].get(sec, [])])
                f = factor_p1[id(p_sec)] * (m_sec_p1 / m_sec_p2) if (p_sec and m_sec_p2) else None
            if f is None: log("  [%s] pedido sem factor (âncora a zero): %s" % (eixo, p["termos"])); continue
            for t, s in p["series"].items():
                if p["passo"] == 2 and t == p["ancora"]: continue  # a secundária já está calibrada no passo 1
                for d, v, _ in s:
                    calibrados.append((eixo, t, d, v * f, f, pedidos.index(p)))
        # top 5 do eixo: mediana calibrada, DEPOIS de deduplicar (senão um termo esmagado
        # conta duas vezes), excluindo a âncora se não for keyword do eixo
        med_por_termo = {}
        for e, t, d, ve, f, i in dedup_passo2(pedidos, calibrados):
            if e == eixo: med_por_termo.setdefault(t, []).append(ve)
        ordem = sorted(((t, mediana(v)) for t, v in med_por_termo.items() if t in por_eixo[eixo]), key=lambda x: -x[1])
        top5[eixo] = ordem[:5]
        log("  [%s] referência: %s | termos calibrados: %d | TOP 5: %s" % (
            eixo, "·".join(ref["termos"]), len(med_por_termo),
            ", ".join("%s %.1f" % (t, m) for t, m in ordem[:5])))
        abaixo = [t for t in por_eixo[eixo] if t not in med_por_termo]
        if abaixo: log("  [%s] sem valor calibrado (pedido falhou): %s" % (eixo, ", ".join(abaixo)))

    resumo = dict(pedidos=len(pedidos), recolhidos=sum(p["status"] == "recolhido" for p in pedidos),
                  sem_dados=sum(p["status"] == "sem_dados" for p in pedidos),
                  falhados=sum(p["status"] == "falhou" for p in pedidos),
                  pontos=sum(len(s) for p in pedidos for s in p["series"].values()),
                  calibrados=len(calibrados))
    log("RESUMO %s" % json.dumps(resumo, ensure_ascii=False))
    return pedidos, calibrados, top5, resumo

# ── gravar ──────────────────────────────────────────────────────────────────
def chave_service_role():
    """Do ambiente, ou de ~/.config/health-pulse/env (fora do repositório, chmod 600)."""
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if key: return key
    cfg = os.path.expanduser("~/.config/health-pulse/env")
    if os.path.exists(cfg):
        for l in open(cfg):
            if l.startswith("SUPABASE_SERVICE_ROLE_KEY="):
                return l.split("=", 1)[1].strip().strip('"')
    sys.exit("ERRO: falta SUPABASE_SERVICE_ROLE_KEY — no ambiente ou em ~/.config/health-pulse/env.")

def gravar(pedidos, calibrados, resumo, args):
    key = chave_service_role()
    url, _ = env_publico()
    lote = rest(url, key, "trends_lotes", "POST", dict(fonte="pytrends", origem=args.origem,
                estado="a_correr", n_pedidos=resumo["pedidos"], n_falhados=resumo["falhados"]),
                "return=representation")[0]
    ids = []
    try:
      escrever_lote(url, key, lote, pedidos, calibrados, resumo, args, ids)
    except Exception as e:
        rest(url, key, "trends_lotes?id=eq." + lote["id"], "PATCH",
             dict(terminado_em=datetime.now(timezone.utc).isoformat(), estado="falhou",
                  notas="rebentou a meio da escrita: %s: %s" % (type(e).__name__, str(e)[:300])))
        raise

def escrever_lote(url, key, lote, pedidos, calibrados, resumo, args, ids):
    for p in pedidos:
        datas = [d for s in p["series"].values() for d, _, _ in s]
        row = rest(url, key, "trends_pedidos", "POST", dict(
            lote_id=lote["id"], fetched_at=p["fetched_at"].isoformat(), eixo=p["eixo"], passo=p["passo"],
            amostra=p["amostra"], termos=p["termos"], ancora=p["ancora"], geo=CFG["geo"], categoria=CFG["categoria"],
            timeframe=args.timeframe, window_start=min(datas).date().isoformat() if datas else None,
            window_end=max(datas).date().isoformat() if datas else None,
            granularidade=granularidade_por_datas(sorted(set(datas))),
            collection_status=p["status"], erro=p["erro"]), "return=representation")[0]
        ids.append(row["id"])
        pontos = [dict(pedido_id=row["id"], termo=t, data=d.isoformat(), valor=v, is_partial=pc)
                  for t, s in p["series"].items() for d, v, pc in s]
        for i in range(0, len(pontos), 500): rest(url, key, "trends_pontos", "POST", pontos[i:i + 500])
    cal = [dict(lote_id=lote["id"], eixo=e, termo=t, data=d.isoformat(), valor_eixo=round(ve, 3),
                factor=round(f, 6), pedido_id=ids[i]) for e, t, d, ve, f, i in dedup_passo2(pedidos, calibrados)]
    for i in range(0, len(cal), 500): rest(url, key, "trends_calibrados", "POST", cal[i:i + 500])
    estado = "completo" if resumo["falhados"] == 0 else "incompleto"
    rest(url, key, "trends_lotes?id=eq." + lote["id"], "PATCH",
         dict(terminado_em=datetime.now(timezone.utc).isoformat(), estado=estado))
    print("GRAVADO lote %s (%s): %d pedidos, %d pontos, %d calibrados" % (
        lote["id"], estado, len(pedidos), resumo["pontos"], len(cal)))
    # 7. os alertas do lote — a semana parcial fica de fora, como na regra
    try:
        import trends_alertas as TA
        parciais = {(t, d.date().isoformat()) for p in pedidos for t, s in p["series"].items() for d, _, pc in s if pc}
        series, factor = {}, {}
        for e, t, d, ve, f, i in dedup_passo2(pedidos, calibrados):
            if (t, d.date().isoformat()) in parciais: continue
            series.setdefault((e, t), {})[d.date().isoformat()] = ve; factor[(e, t)] = f
        n = TA.gravar(url, key, lote["id"], TA.calcula(series, factor))
        print("ALERTAS: %d linhas em trends_alertas (regra de 18/09/2026)" % n)
    except Exception as ex:
        print("AVISO: alertas não calculados (%s: %s) — o lote está gravado; correr "
              "scripts/trends_alertas.py --lote %s --gravar" % (type(ex).__name__, str(ex)[:200], lote["id"][:8]))

def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--dry-run", action="store_true", help="pede ao Google, calcula, NÃO grava")
    g.add_argument("--gravar", action="store_true", help="grava um lote (exige SUPABASE_SERVICE_ROLE_KEY)")
    ap.add_argument("--timeframe", default="today 12-m")
    ap.add_argument("--eixo", choices=AXES)
    ap.add_argument("--amostras", type=int, default=1)
    ap.add_argument("--origem", default="manual " + os.uname().nodename)
    ap.add_argument("--dump", help="grava o resultado (pedidos, calibrados, top5) em JSON — evidência sem repetir pedidos")
    ap.add_argument("--carregar", help="com --gravar: lê um dump em vez de pedir ao Google (mesmos pedidos, mesma hora de recolha)")
    args = ap.parse_args()
    if args.amostras != 1: sys.exit("v1: --amostras só suporta 1 (a repetição fica para quando houver dados para a justificar).")
    if args.gravar:
        chave_service_role()   # pára AQUI, antes de gastar 10 minutos de pedidos, se a chave faltar
    if args.carregar:
        d = json.load(open(args.carregar))
        args.timeframe = d["timeframe"]
        pedidos = [dict(p, fetched_at=datetime.fromisoformat(p["fetched_at"]),
                        series={t: [(datetime.fromisoformat(x[0]), x[1], x[2]) for x in s] for t, s in p["series"].items()})
                   for p in d["pedidos"]]
        calibrados = [(e, t, datetime.fromisoformat(dt), ve, f, i) for e, t, dt, ve, f, i in d["calibrados"]]
        top5, resumo = d["top5"], d["resumo"]
        print("carregado de %s: %s" % (args.carregar, json.dumps(resumo)))
    else:
        pedidos, calibrados, top5, resumo = correr(args)
    if args.dump and not args.carregar:
        json.dump(dict(timeframe=args.timeframe, eixo=args.eixo, resumo=resumo, top5=top5,
                       pedidos=[dict(p, fetched_at=p["fetched_at"].isoformat(),
                                     series={t: [(d.isoformat(), v, pc) for d, v, pc in s] for t, s in p["series"].items()})
                                for p in pedidos],
                       calibrados=[(e, t, d.isoformat(), round(ve, 3), round(f, 6), i) for e, t, d, ve, f, i in calibrados]),
                  open(args.dump, "w"), ensure_ascii=False)
        print("dump:", args.dump)
    if args.gravar: gravar(pedidos, calibrados, resumo, args)
    else: print("DRY-RUN: nada gravado.")

if __name__ == "__main__":
    main()
