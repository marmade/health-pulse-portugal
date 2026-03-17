"""
4_fetch_youtube_trends.py
=========================
Reportagem Viva - busca os top videos YouTube para as keywords activas.
v3: filtra videos brasileiros (pt-BR), mantém apenas pt-PT e sem linguagem definida

Como correr:
  python3 4_fetch_youtube_trends.py A_TUA_CHAVE_YOUTUBE
"""

import sys
import requests
from datetime import datetime
from googleapiclient.discovery import build

if len(sys.argv) < 2:
    print("Uso: python3 4_fetch_youtube_trends.py A_TUA_CHAVE_YOUTUBE")
    sys.exit(1)

YOUTUBE_API_KEY = sys.argv[1]

SUPABASE_URL = "https://cyjwhmuakmiytypewwfw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5andobXVha21peXR5cGV3d2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mjc2MjksImV4cCI6MjA4ODQwMzYyOX0.bcAKG2nQdYG7Qf8Mm1e_eJR9Fueqw20jkwlqrTWyH4Q"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=minimal",
}

TOP_GLOBAL = 10
VIDEOS_POR_KEYWORD = 8  # buscar mais para compensar os filtrados

# Canais brasileiros conhecidos a excluir
CANAIS_BR = {
    "Drauzio Varella", "Sempre Questione", "Dr. Dayan Siebra",
    "Dr. Victor Sorrentino", "Mundo da Saude", "Canal Saude",
    "Saude em Dia", "CFM", "CFO", "Drauzio",
    "PodPeople", "Ana Beatriz Barbosa", "Dr. Samuel Dalle Laste",
    "Dr. Renan Botelho", "Biologia Ilustrada", "Dr. Edmundo Antunes",
    "Maria Farinha Filmes", "Nutri Vitta", "Dra. Ana Gabriela",
    "Hospital Israelita Albert Einstein", "Globo Saude",
    "Dr. Lair Ribeiro", "CanalSaude", "Saude Total",
}

# Indicadores lexicais de PT-BR — palavras nunca usadas em PT-PT
PALAVRAS_BR = [
    "precisam", "remédio", "você sabia", "tomar remédio",
    "vem ver", "olha só", "esses sintomas", "esses alimentos",
    "aprenda como", "descubra como", "veja como",
    "não deixe de", "funciona mesmo", " né ", "hein",
    "SUS ", "anvisa", " brasileiro", " brasileira",
    "todo ano", "acredite",
]


def buscar_keywords():
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "term,axis", "is_active": "eq.true"}
    )
    r.raise_for_status()
    return r.json()


def e_brasileiro(video):
    """Devolve True se o video parecer brasileiro."""
    audio_lang = video.get("defaultAudioLanguage", "") or ""
    default_lang = video.get("defaultLanguage", "") or ""
    canal = video.get("canal", "") or ""

    # Excluir pt-BR explícito
    if audio_lang.startswith("pt-BR") or default_lang.startswith("pt-BR"):
        return True

    titulo = video.get("titulo", "") or ""

    # Excluir canais brasileiros conhecidos (exacto)
    if canal in CANAIS_BR:
        return True

    # Excluir por fragmento de nome de canal BR
    canal_lower = canal.lower()
    if any(br.lower() in canal_lower for br in CANAIS_BR if len(br) > 6):
        return True

    # Excluir por indicadores lexicais PT-BR no título
    titulo_lower = titulo.lower()
    if any(palavra.lower() in titulo_lower for palavra in PALAVRAS_BR):
        return True

    return False


def pesquisar_videos(youtube, keyword, axis):
    query = f"{keyword} saude portugal"
    try:
        pesquisa = youtube.search().list(
            q=query,
            part="id",
            type="video",
            regionCode="PT",
            relevanceLanguage="pt",
            order="relevance",
            maxResults=VIDEOS_POR_KEYWORD,
        ).execute()

        ids = [item["id"]["videoId"] for item in pesquisa.get("items", [])]
        if not ids:
            return []

        detalhes = youtube.videos().list(
            part="snippet,statistics,localizations",
            id=",".join(ids),
        ).execute()

        resultados = []
        for v in detalhes.get("items", []):
            snippet = v.get("snippet", {})
            stats = v.get("statistics", {})

            candidato = {
                "video_id": v["id"],
                "titulo": snippet.get("title", ""),
                "canal": snippet.get("channelTitle", ""),
                "views": int(stats.get("viewCount", 0)),
                "url": f"https://www.youtube.com/watch?v={v['id']}",
                "eixo": axis,
                "data_publicacao": snippet.get("publishedAt", "")[:10],
                "thumbnail_url": snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
                "defaultAudioLanguage": snippet.get("defaultAudioLanguage", ""),
                "defaultLanguage": snippet.get("defaultLanguage", ""),
            }

            if e_brasileiro(candidato):
                print(f"    [filtrado BR] {candidato['titulo'][:50]}")
                continue

            # Remover campos internos antes de guardar
            resultados.append({k: v for k, v in candidato.items()
                               if k not in ("defaultAudioLanguage", "defaultLanguage")})

        return resultados

    except Exception as e:
        print(f"  Erro para '{keyword}': {e}")
        return []


def main():
    print("Reportagem Viva - YouTube Trends v3 (filtro PT)")
    print(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 60)

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    print("A carregar keywords do Supabase...")
    keywords = buscar_keywords()
    print(f"  {len(keywords)} keywords activas")

    todos = []
    for entrada in keywords:
        kw, axis = entrada["term"], entrada["axis"]
        print(f"[{axis}] {kw}")
        videos = pesquisar_videos(youtube, kw, axis)
        if videos:
            todos.extend(videos)
            print(f"  {len(videos)} videos (apos filtro PT)")
        else:
            print(f"  Sem resultados")

    print(f"Total recolhido: {len(todos)} videos (antes de de-duplicar)")

    vistos, top = set(), []
    todos.sort(key=lambda v: v["views"], reverse=True)
    for v in todos:
        if v["video_id"] not in vistos:
            vistos.add(v["video_id"])
            top.append(v)
            if len(top) == TOP_GLOBAL:
                break

    print(f"Apos de-duplicacao: {len(top)} videos unicos")

    print("A limpar registos anteriores...")
    r = requests.delete(
        f"{SUPABASE_URL}/rest/v1/youtube_trends",
        headers=HEADERS,
        params={"id": "not.is.null"}
    )
    print("  Tabela limpa" if r.status_code in (200, 204) else f"  Delete {r.status_code}")

    print(f"A inserir top {len(top)} videos...")
    for v in top:
        payload = {k: val for k, val in v.items() if k != "video_id"}
        r = requests.post(f"{SUPABASE_URL}/rest/v1/youtube_trends", headers=HEADERS, json=payload)
        views_fmt = f"{v['views']:,}".replace(",", ".")
        status = "OK" if r.status_code in (200, 201) else f"ERRO {r.status_code}"
        print(f"  {status} {v['titulo'][:55]}")
        print(f"      {views_fmt} views - {v['canal']} - [{v['eixo']}]")

    print("=" * 60)
    print(f"Concluido - {len(top)} videos guardados no Supabase")
    print("=" * 60)


if __name__ == "__main__":
    main()
