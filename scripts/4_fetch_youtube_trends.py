""" 4_fetch_youtube_trends.py
=========================
Reportagem Viva — busca os top vídeos YouTube de canais portugueses curados.
v4: lógica de canais curados (channel IDs fixos) em vez de pesquisa por keyword.
    Para cada canal, busca os vídeos mais recentes e filtra por keywords dos eixos.
    Guarda o top 15 por views no Supabase (tabela youtube_trends).

Como correr:
    python3 4_fetch_youtube_trends.py A_TUA_CHAVE_YOUTUBE
"""

import sys
import re
import requests
from datetime import datetime, timezone, timedelta
from googleapiclient.discovery import build

if len(sys.argv) < 2:
    print("Uso: python3 4_fetch_youtube_trends.py A_TUA_CHAVE_YOUTUBE")
    sys.exit(1)

YOUTUBE_API_KEY = sys.argv[1]

SUPABASE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHhqcGJqdWRhZGRmYXRpYmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzEzODUsImV4cCI6MjA4ODU0NzM4NX0.SfOLBTYyIhk-CxzvtlvFu1E-GqBNXN3CbFqz8qx-BoM"
HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

TOP_GLOBAL = 30
VIDEOS_POR_CANAL = 30      # vídeos a buscar por canal (para ter margem de filtragem)
JANELA_DIAS = 90           # janela temporal — últimos 3 meses (garante rotação)

# ---------------------------------------------------------------------------
# Canais portugueses curados
# ---------------------------------------------------------------------------
CANAIS_PT = [
    # Informação / media
    {"id": "UCWPpeeDOykyH5ducPITCDPw", "nome": "RTP"},
    {"id": "UCimBp0frQrASSsIFERs8vsw",  "nome": "SIC Notícias"},
    {"id": "UC5lg8zKcnJ1rnxR6lPgD1ug",  "nome": "TVI"},
    {"id": "UCtXui6Q6zCvzJyKG341u4lg",  "nome": "PÚBLICO"},
    {"id": "UC35F6ktZodINwjQZjuwLcjg",  "nome": "Observador"},
    {"id": "UCWh_syTK8TIpGK14yCOXeOw",  "nome": "Diário de Notícias"},
    {"id": "UCC2GLQomQYmICHdIRxOK5hQ",  "nome": "Jornal de Notícias"},
    {"id": "UCUmEPYxmnyQDeRUcFkslmQw",  "nome": "Euronews PT"},
    # Saúde — autoridades e regulação
    {"id": "UCNmv_2YqryuyhB79ehzOsmQ",  "nome": "DGS"},
    {"id": "UCD__Q9Uk6TOfF0GWmzlWvTw",  "nome": "Alimentação Saudável PNPAS-DGS"},
    {"id": "UCXvYESuIxyaC5q0Nz8t5pVg",  "nome": "Ativa Saúde ENPAF-DGS"},
    {"id": "UCEDsw4V8sNapYKeu3uXaeUg",  "nome": "INSA"},
    {"id": "UChU2dZjHIJnUou6w3JJ16Aw",  "nome": "INFARMED"},
    {"id": "UC43Xmu6eMxUc4e5LITcKESw",  "nome": "ERS"},
    {"id": "UCOE-JsBcVf4__OlrsiW59EQ",  "nome": "República Portuguesa"},
    {"id": "UCDThSH2sV00KyNekSODyg_g",  "nome": "CNPS Mental"},
    {"id": "UCIz4NsTmRImfjtknQ0hPt4A",  "nome": "SNS Portal"},
    # Saúde — ordens e sociedades científicas
    {"id": "UCayuHV0f3y1-qHSzh07UhFg",  "nome": "Ordem dos Médicos"},
    {"id": "UCCBlYMv3F6VkTsU57ZFUNyg",  "nome": "Ordem dos Psicólogos"},
    {"id": "UCuDagVc79VVXXPFJurgXIiw",  "nome": "Ordem dos Enfermeiros"},
    {"id": "UCMhhHdT1z26KmamNK1Ppwcw",  "nome": "Sociedade Portuguesa de Ginecologia"},
    {"id": "UC35wTBunWWqWL-7g3M8Vqrw",  "nome": "Sociedade Portuguesa de Psiquiatria"},
    {"id": "UC2cLsvuBCQifCJHP8SQHBdg",  "nome": "Sociedade Portuguesa de Reumatologia"},
    {"id": "UCchQ0gnRspaN-vPk7LIMUzQ",  "nome": "Sociedade Portuguesa de Cuidados Intensivos"},
    {"id": "UC4WRANLBsyeg91VyVU1kakw",  "nome": "SPPneumologia"},
    {"id": "UCeIsY_mR0FoDRX2nWKcO12g",  "nome": "Sociedade Portuguesa de Literacia em Saúde"},
    {"id": "UCpLfK1hrhHxhk7vhXrrNsiA",  "nome": "Sociedade Portuguesa Patologia Coluna Vertebral"},
    {"id": "UCYRJph6b7Vt_NvT9uNetEJg",  "nome": "Sociedade Portuguesa de Esclerose Múltipla"},
    {"id": "UCFfVOW1MeXLvlaFcOtUlHIA",  "nome": "Sociedade Portuguesa de Cardiologia"},
    {"id": "UCAYMjfbvT-XaoE-rXQdpAVQ",  "nome": "Sociedade Portuguesa de Endocrinologia"},
    # Saúde — hospitais e seguros
    {"id": "UCaX52_iMXdddasXv1zPuzzQ",  "nome": "Trofa Saúde"},
    {"id": "UCa_iuEjOzgc2ZKo0-ZzNrKA",  "nome": "CUF"},
    {"id": "UCHUSE3bPV9kDza-sGYk_pvQ",  "nome": "Lusíadas Saúde"},
    {"id": "UCGsIPe5hjisPH17GHDus2eg",  "nome": "Unilabs Portugal"},
    {"id": "UC0PZ_M__MEPDjzl1ru6Abtg",  "nome": "Médis"},
    {"id": "UC8j8qlWxOV4VjlQIz5CHKnQ",  "nome": "Lundbeck Portugal"},
    {"id": "UCcoeRBF4Ivdm4aCwTDZdYIA",  "nome": "Bial"},
    {"id": "UCr7zkgwa5ELLwj0epToZIBg",  "nome": "Grupo HPA Saúde"},
    # Ciência e academia
    {"id": "UCrDDWtZnSHtv5eAn3RCX0RA",  "nome": "Academia das Ciências de Lisboa"},
    {"id": "UC6yVe4JNXUdKFxZizE_ldsA",  "nome": "Fundação Francisco Manuel dos Santos"},
    {"id": "UClcsJ_vqBPrgj4epDtAVcUg",  "nome": "Faculdade de Medicina ULisboa"},
    {"id": "UCqHLLAAW2Gxwm_RpiEGGi-w",  "nome": "FCNAUP"},
    {"id": "UCwImg1IJ7tAgct-MxPXxR2A",  "nome": "FCT"},
    {"id": "UC4pCHexxGBCueJwqkAcjqWw",  "nome": "90 Segundos de Ciência"},
    {"id": "UCewkJz8USMSLc_VGiiFt8gA",  "nome": "ITQB NOVA"},
    {"id": "UCl5jVoRkK1PJUaiprinpzdA",  "nome": "GIMM Gulbenkian"},
    {"id": "UCjspnOYGdzo5Ll58fooY9Zw",  "nome": "Fundação Calouste Gulbenkian"},
    {"id": "UC0zfnw1q686zD4F335AYoTg",  "nome": "Centro de Neurociências e Biologia Celular"},
    {"id": "UCR8d63kMXqsGaDV9IOHi99Q",  "nome": "Portal Top Saúde"},
    # ONG e associações
    {"id": "UCsBd0_em-tcr8ovQ_eYgfYA",  "nome": "Cruz Vermelha Portuguesa"},
    {"id": "UCyCPnLTvgyzicTHIZRbjN_w",  "nome": "APAV"},
    {"id": "UC-liu13JMRDTjOm2YT2-p5A",  "nome": "Conselho Português para a Saúde e Ambiente"},
    # Internacional
    {"id": "UCkD7gm3Am3M3k156lk46t3A",  "nome": "UNESCO"},
    # Fact-check e literacia
    {"id": "UCjMzepu7e36usUEWU2wfHvg",  "nome": "Despolariza"},
    {"id": "UCiYGrdT8KPon4QsLsOfdu8A",  "nome": "News Farma"},
    # Autarquias
    {"id": "UCSG2vPu_YmDVfoSbo7oItwQ",  "nome": "Câmara Municipal de Lisboa"},
]

# ---------------------------------------------------------------------------
# Keywords por eixo temático (para classificar e filtrar vídeos)
# ---------------------------------------------------------------------------
EIXOS = {
    "saude-mental": [
        "saúde mental", "ansiedade", "depressão", "burnout", "stress", "psicologia",
        "psiquiatria", "bem-estar", "mental", "emoções", "autoestima", "luto",
        "mindfulness", "terapia", "perturbação", "suicídio", "solidão",
    ],
    "alimentacao": [
        "alimentação", "nutrição", "dieta", "obesidade", "peso", "nutricionista",
        "alimentos", "comida", "comer", "saudável", "mediterrânica", "açúcar",
        "ultraprocessados", "microbioma", "intestino", "vitaminas",
    ],
    "menopausa": [
        "menopausa", "climatério", "hormonal", "menopausal", "perimenopausa",
        "terapia hormonal", "osteoporose", "afrontamentos", "ginecologia",
        "mulher madura", "fertilidade", "menopausal",
    ],
    "emergentes": [
        "covid", "vacina", "vacinação", "pandemia", "gripe", "vírus",
        "cancro", "oncologia", "diabetes", "hipertensão", "colesterol",
        "alzheimer", "demência", "resistência antibióticos", "saúde digital",
        "inteligência artificial saúde", "genética", "doenças raras",
    ],
}

# Mapa inverso: keyword → eixo (com regex word boundary)
KW_TO_EIXO = []
for eixo, kws in EIXOS.items():
    for kw in kws:
        # Compilar regex com word boundaries para evitar falsos positivos
        pattern = re.compile(r'\b' + re.escape(kw.lower()) + r'\b')
        KW_TO_EIXO.append((pattern, eixo))

# Palavras no título que indicam que o vídeo NÃO é de saúde
BLACKLIST_TITULOS = [
    "presidente da república", "assembleia da república", "parlamento",
    "futebol", "benfica", "sporting", "porto fc", "liga dos campeões",
    "eleições", "autárquicas", "legislativas", "orçamento de estado",
    "guerra", "ucrânia", "nato", "trump",
]
BLACKLIST_PATTERNS = [re.compile(re.escape(b)) for b in BLACKLIST_TITULOS]


def classificar_eixo(titulo: str) -> str | None:
    """Devolve o eixo temático se o título contiver uma keyword de saúde.
    Usa word boundaries e blacklist para reduzir falsos positivos."""
    t = titulo.lower()
    # Rejeitar se o título contém termos da blacklist
    for bp in BLACKLIST_PATTERNS:
        if bp.search(t):
            return None
    # Procurar keyword de saúde com word boundary
    for pattern, eixo in KW_TO_EIXO:
        if pattern.search(t):
            return eixo
    return None


def buscar_videos_canal(youtube, canal_id: str, canal_nome: str) -> list:
    """Busca os vídeos mais recentes de um canal e filtra por eixo temático."""
    data_limite = (datetime.now(timezone.utc) - timedelta(days=JANELA_DIAS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        # Passo 1: search por vídeos recentes do canal
        pesquisa = youtube.search().list(
            channelId=canal_id,
            part="id",
            type="video",
            order="date",
            publishedAfter=data_limite,
            maxResults=VIDEOS_POR_CANAL,
        ).execute()

        ids = [item["id"]["videoId"] for item in pesquisa.get("items", [])]
        if not ids:
            return []

        # Passo 2: detalhes e estatísticas
        detalhes = youtube.videos().list(
            part="snippet,statistics",
            id=",".join(ids),
        ).execute()

        resultados = []
        for v in detalhes.get("items", []):
            snippet = v.get("snippet", {})
            stats   = v.get("statistics", {})
            titulo  = snippet.get("title", "")
            eixo    = classificar_eixo(titulo)
            if not eixo:
                continue  # não relevante para os eixos temáticos

            resultados.append({
                "titulo":          titulo,
                "canal":           canal_nome,
                "channel_id":      canal_id,
                "views":           int(stats.get("viewCount", 0)),
                "url":             f"https://www.youtube.com/watch?v={v['id']}",
                "eixo":            eixo,
                "data_publicacao": snippet.get("publishedAt", "")[:10],
                "thumbnail_url":   snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
            })

        return resultados

    except Exception as e:
        print(f"  Erro canal {canal_nome}: {e}")
        return []


def main():
    print("Reportagem Viva — YouTube Trends v4 (canais PT curados)")
    print(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 60)

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    todos = []
    for canal in CANAIS_PT:
        print(f"[{canal['nome']}]")
        videos = buscar_videos_canal(youtube, canal["id"], canal["nome"])
        print(f"  {len(videos)} vídeos relevantes")
        todos.extend(videos)

    print(f"\nTotal recolhido: {len(todos)} vídeos (antes de deduplicar)")

    # De-duplicar por URL, ordenar por score (views × recência)
    # Vídeos recentes recebem boost: score = views × (1 + 2/dias_desde_publicação)
    def relevance_score(v):
        days = max(1, (datetime.now(timezone.utc) - datetime.fromisoformat(v["data_publicacao"] + "T00:00:00+00:00")).days)
        return v["views"] * (1 + 2.0 / days)

    vistos, top = set(), []
    todos.sort(key=relevance_score, reverse=True)
    for v in todos:
        if v["url"] not in vistos:
            vistos.add(v["url"])
            top.append(v)
            if len(top) == TOP_GLOBAL:
                break

    print(f"Top {len(top)} vídeos únicos seleccionados")

    # Limpar tabela anterior
    print("\nA limpar registos anteriores...")
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/youtube_trends",
        headers=HEADERS,
        params={"id": "not.is.null"},
    )
    print("  OK" if r.status_code in (200, 204) else f"  Delete {r.status_code}")

    # Inserir novos
    print(f"A inserir {len(top)} vídeos...")
    for v in top:
        r = requests.post(
            f"{SUPABASE_URL}/rest/v1/youtube_trends",
            headers=HEADERS,
            json=v,
        )
        views_fmt = f"{v['views']:,}".replace(",", ".")
        status = "OK" if r.status_code in (200, 201) else f"ERRO {r.status_code}"
        print(f"  {status} [{v['eixo']}] {v['titulo'][:55]}")
        print(f"       {views_fmt} views — {v['canal']}")

    print("=" * 60)
    print(f"Concluído — {len(top)} vídeos guardados no Supabase")
    print("=" * 60)


if __name__ == "__main__":
    main()
