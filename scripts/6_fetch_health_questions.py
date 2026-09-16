"""
6_fetch_health_questions.py
===========================
Reportagem Viva — perguntas reais em crescimento via pytrends
related_queries() para cada keyword activa.

FONTE: pytrends related_queries() — queries que co-ocorrem na mesma
sessão de pesquisa que a keyword. Inclui growth_percent (% de crescimento
recente). Campo source="pytrends" distingue estes registos dos recolhidos
pelo script 7_fetch_autocomplete_questions.py.

UPSERT: chave única (question, axis, source).
Requer constraint health_questions_question_axis_source_key na tabela.

Como correr manualmente:
  python3 6_fetch_health_questions.py

Requer a variavel de ambiente SUPABASE_SERVICE_ROLE_KEY (GitHub Secret).
Sem ela o script para imediatamente, em vez de correr sem gravar nada.
"""

import os
import sys
import re
import time
import requests
from datetime import datetime, timezone
from pytrends.request import TrendReq

SUPABASE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
# A chave vem do ambiente — GitHub Secret SUPABASE_SERVICE_ROLE_KEY.
# SEM valor por defeito e SEM voltar à chave anon: desde 09/09/2026 a anon
# deixa de ter escrita, e um fallback silencioso faria o script correr até ao
# fim a não gravar nada. Se a variável faltar, pára aqui e em voz alta.
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_KEY:
    sys.exit(
        "ERRO: falta a variavel de ambiente SUPABASE_SERVICE_ROLE_KEY.\n"
        "      Definir como GitHub Secret e passa-la ao passo do workflow.\n"
        "      A chave NUNCA deve ser escrita no codigo."
    )

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

HEADERS_UPSERT = {
    **HEADERS,
    "Prefer": "resolution=merge-duplicates,return=minimal",
}

SOURCE = "pytrends"
PAUSA_SEGUNDOS = 10

PREFIXOS_PERGUNTA = [
    "como", "o que", "o que é", "quais", "porque", "por que",
    "é normal", "posso", "sintomas", "quando", "quanto", "qual",
    "tenho", "pode", "devo", "ajuda", "tratamento", "cura",
    "diferença", "riscos", "causas", "efeitos", "o que fazer"
]

AXIS_LABELS = {
    "saude-mental": "Saúde Mental",
    "alimentacao": "Alimentação",
    "menopausa": "Menopausa",
    "emergentes": "Emergentes",
}

BLOCKLIST_MARCAS = {
    "lidl", "walmart", "continente", "pingo doce", "aldi", "mercadona",
    "ikea", "amazon", "fnac", "worten", "minipreço", "intermarché",
    "mcdonald", "burger king", "kfc", "subway", "starbucks",
    "uber eats", "glovo", "bolt food",
}

BLOCKLIST_ENTRETENIMENTO = {
    "filme", "movie", "cinema", "trailer", "estreia", "temporada",
    "episódio", "episodio", "série", "serie", "netflix", "hbo", "disney",
    "prime video", "streaming", "download", "torrent", "legendas",
    "elenco", "personagem", "ator", "atriz", "protagonista",
    "game", "jogo", "games", "gameplay", "review", "update", "patch",
    "takedown", "dlc", "xbox", "playstation", "nintendo", "steam", "epic games",
    "álbum", "album", "single", "tour", "concerto", "festival", "spotify",
    "transferência", "mercado", "benfica", "sporting", "porto", "liga",
    "premier league", "champions",
    "wikipedia", "wiki", "reddit", "tiktok", "instagram",
}

REGEX_METEOROLOGIA = re.compile(
    r"^(depressão|ciclone|tempestade|furacão|tufão|baixa pressão)\s+[A-Z][a-záéíóúàâêôãõüç]+$",
)

# Nomes de depressões meteorológicas — não são perguntas de saúde
NOMES_METEO = {
    "oriana", "ingrid", "therese", "goretti", "nils", "kristen", "kristin",
    "elsa", "kirk", "boris", "ciaran", "agnes", "babet", "debi", "isha",
    "henk", "jocelyn", "nelson", "elin", "herminia", "patricia", "olivia",
}

REGEX_DEPRESSAO_NOME = re.compile(
    r"^depressão\s+(" + "|".join(NOMES_METEO) + r")\b",
    re.IGNORECASE,
)

REGEX_LOCALIZACAO = re.compile(
    r"\b(near me|perto de mim|perto|onde fica|como chegar|morada|"
    r"horário de|aberto agora|delivery|entrega|encomenda)\b",
    re.IGNORECASE,
)

REGEX_ENTRETENIMENTO_NUMERADO = re.compile(
    r"^(todo mundo|scary movie|final destination|resident evil|saw|"
    r"john wick|fast and furious|velozes e furiosos|pânico|panico|"
    r"burnout\s+\d)\s",
    re.IGNORECASE,
)

REGEX_NUMERO_FINAL = re.compile(r"\d+\s*$")


def e_ruido(query: str) -> tuple[bool, str]:
    q = query.lower().strip()
    for marca in BLOCKLIST_MARCAS:
        if marca in q:
            return True, f"marca:{marca}"
    for termo in BLOCKLIST_ENTRETENIMENTO:
        if termo in q:
            return True, f"entretenimento:{termo}"
    if REGEX_METEOROLOGIA.match(query.strip()):
        return True, "meteorologia"
    if REGEX_DEPRESSAO_NOME.match(query.strip()):
        return True, "depressao_nome"
    if REGEX_LOCALIZACAO.search(q):
        return True, "localizacao"
    if REGEX_NUMERO_FINAL.search(q) and len(q.split()) >= 3:
        if REGEX_ENTRETENIMENTO_NUMERADO.match(q):
            return True, "entretenimento_numerado"
    return False, ""


def e_pergunta(texto: str) -> bool:
    t = texto.lower().strip()
    return any(t.startswith(p) for p in PREFIXOS_PERGUNTA)


def buscar_keywords() -> list[dict]:
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "term,axis,category", "is_active": "eq.true"},
    )
    r.raise_for_status()
    return r.json()


def upsert_perguntas(perguntas: list[dict]) -> bool:
    if not perguntas:
        return True
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/health_questions?on_conflict=question,axis,source",
        headers=HEADERS_UPSERT,
        json=perguntas,
    )
    if r.status_code not in (200, 201, 204):
        print(f"    ERRO upsert: {r.status_code} {r.text[:200]}")
        return False
    return True


def buscar_queries_crescimento(pytrends: TrendReq, keyword: str, axis: str) -> list[dict]:
    try:
        pytrends.build_payload([keyword], geo="PT", timeframe="today 3-m", gprop="")
        resultado = pytrends.related_queries()

        if not resultado or keyword not in resultado:
            return []

        rising = resultado[keyword].get("rising")
        if rising is None or rising.empty:
            return []

        agora = datetime.now(timezone.utc).isoformat()
        perguntas = []

        for _, row in rising.iterrows():
            query = str(row.get("query", "")).strip()
            value = row.get("value", 0)
            if not query:
                continue

            ruido, motivo = e_ruido(query)
            if ruido:
                print(f"    [RUÍDO:{motivo}] {query}")
                continue

            if isinstance(value, str) and "breakout" in value.lower():
                growth = 5000
            else:
                try:
                    growth = int(value)
                except (ValueError, TypeError):
                    growth = 0

            # A posição na lista devolvida pelo Google. É ordem, e é isso que se
            # grava: até 16/09/2026 era convertida em
            # `relative_volume = max(10, 100 - rank_idx*8)` e guardada como se
            # fosse procura. Nem o Trends nem o Autocomplete publicam volumes.
            posicao = len(perguntas) + 1

            perguntas.append({
                "question": query,
                # `min(growth, 9999)` é tecto, não sentinela: lê-se "subiu pelo
                # menos isso". O `breakout` do Google é convertido em 5000 mais
                # acima — e esse 5000 é escolha nossa, não limiar publicado.
                "growth_percent": min(growth, 9999),
                "relative_volume": None,
                "posicao": posicao,
                "axis": axis,
                "axis_label": AXIS_LABELS.get(axis, axis),
                "cluster": keyword,
                "is_question": e_pergunta(query),
                "source": SOURCE,
                "updated_at": agora,
                "last_seen_at": agora,
            })

        return perguntas

    except Exception as e:
        print(f"    Erro para '{keyword}': {e}")
        return []


def main():
    print("Reportagem Viva — Queries em Crescimento (pytrends)")
    print(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 60)

    pytrends = TrendReq(hl="pt-PT", tz=-60, timeout=(10, 25), retries=2, backoff_factor=0.5)

    print("A carregar keywords do Supabase...")
    keywords = buscar_keywords()
    print(f"  {len(keywords)} keywords activas\n")

    todas: list[dict] = []

    for i, kw in enumerate(keywords):
        term, axis = kw["term"], kw["axis"]
        print(f"[{i+1}/{len(keywords)}] [{axis}] {term}")

        perguntas = buscar_queries_crescimento(pytrends, term, axis)
        if perguntas:
            todas.extend(perguntas)
            n_perg = sum(1 for p in perguntas if p["is_question"])
            print(f"    {len(perguntas)} queries ({n_perg} perguntas)")
        else:
            print(f"    Sem dados")

        if i < len(keywords) - 1:
            time.sleep(PAUSA_SEGUNDOS)

    print(f"\nTotal recolhido: {len(todas)} queries")

    vistas: set[tuple] = set()
    unicas: list[dict] = []
    todas.sort(key=lambda x: x["growth_percent"], reverse=True)

    for p in todas:
        chave = (p["question"].lower().strip(), p["axis"], p["source"])
        if chave not in vistas:
            vistas.add(chave)
            unicas.append(p)

    n_perguntas = sum(1 for p in unicas if p["is_question"])
    print(f"Após de-duplicação: {len(unicas)} queries únicas ({n_perguntas} perguntas)\n")

    print(f"A fazer upsert de {len(unicas)} queries...")
    inseridas = 0
    for i in range(0, len(unicas), 50):
        lote = unicas[i:i+50]
        if upsert_perguntas(lote):
            inseridas += len(lote)

    print()
    print("=" * 60)
    print(f"Concluído — {inseridas} queries upserted (source=pytrends)")
    print("=" * 60)

    expandir_mural(unicas)


def expandir_mural(todas_perguntas: list[dict]):
    """ESTE BLOCO NUNCA FUNCIONOU. NÃO O "CORRIJAS" SEM LERES ISTO.

    O `payload` abaixo não inclui `source`, e `keywords.source` é NOT NULL sem
    valor por omissão: a base recusa todos os inserts. Verificado a 16/09/2026
    por três caminhos — a função É chamada (main, linha 285), o payload não tem
    mesmo `source` (information_schema confirma a constraint), e o filtro produz
    **536 candidatos** hoje sem que UM ÚNICO esteja na tabela. As 83 keywords
    vêm todas de fontes curadas em Março.

    E A FALHA ANDOU A PROTEGER O MURAL. Isto é o que ele tentaria inserir:

        suicídio viseu · sepsis meaning · stress hídrico · tou avc
        sofa score sepsis · sinais de demência precoce

    É o mesmo ruído que saiu do painel das perguntas a 16/09/2026 — e não por
    acaso: o filtro escolhe de propósito linhas com `is_question = false`,
    porque quer termos e não perguntas. Acrescentar `source` a este payload, sem
    mexer no resto, enche o mural de 536 entradas destas na segunda seguinte.

    O mural é uma página de arquivo: o que lá entra fica.

    POR DECIDIR (Marta, 16/09/2026): corrigir com filtros a sério, apagar o
    bloco e assumir o mural como curado à mão, ou deixá-lo morto com este aviso.
    """
    print("\nA expandir Mural com novos termos...")
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "term", "is_active": "eq.true"},
    )
    if not r.ok:
        print("  Erro ao buscar keywords existentes")
        return

    existentes = {row["term"].lower().strip() for row in r.json()}
    candidatos = [
        p for p in todas_perguntas
        if p["growth_percent"] >= 100
        and p["question"].lower().strip() not in existentes
        and not p["is_question"]
        and len(p["question"].split()) <= 4
    ]
    candidatos.sort(key=lambda x: x["growth_percent"], reverse=True)
    novos = candidatos[:20]

    if not novos:
        print("  Nenhum termo novo relevante encontrado")
        return

    print(f"  {len(novos)} termos novos para o Mural:")
    payload = []
    for p in novos:
        print(f"    + [{p['axis']}] {p['question']} ({p['growth_percent']}%)")
        payload.append({
            "term": p["question"],
            "axis": p["axis"],
            "category": p.get("cluster", ""),
            "is_active": True,
            "is_emergent": p["growth_percent"] >= 500,
            "current_volume": p.get("posicao", 0),  # morto: ver o aviso acima
            "previous_volume": 0,
            "change_percent": float(p["growth_percent"]),
            "trend": "up",
        })

    r2 = requests.post(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers={**HEADERS, "Prefer": "resolution=ignore-duplicates,return=minimal"},
        json=payload,
    )
    if r2.status_code in (200, 201, 204):
        print(f"  OK — {len(payload)} termos inseridos")
    else:
        print(f"  Erro: {r2.status_code} {r2.text[:100]}")


if __name__ == "__main__":
    main()
