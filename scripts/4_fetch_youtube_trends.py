"""
4_fetch_youtube_trends.py
=========================
Reportagem Viva — busca os top 5 vídeos YouTube para as keywords activas.

Como correr:
    python3 4_fetch_youtube_trends.py A_TUA_CHAVE_YOUTUBE
"""

import sys
import requests
from datetime import datetime
from googleapiclient.discovery import build

# Chave YouTube passada como argumento
if len(sys.argv) < 2:
    print("❌ Uso: python3 4_fetch_youtube_trends.py A_TUA_CHAVE_YOUTUBE")
    sys.exit(1)

YOUTUBE_API_KEY = sys.argv[1]

SUPABASE_URL = "https://cyjwhmuakmiytypewwfw.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5andobXVha21peXR5cGV3d2Z3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4Mjc2MjksImV4cCI6MjA4ODQwMzYyOX0.bcAKG2nQdYG7Qf8Mm1e_eJR9Fueqw20jkwlqrTWyH4Q"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

TOP_GLOBAL = 5
VIDEOS_POR_KEYWORD = 5


def buscar_keywords():
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "term,axis", "is_active": "eq.true"}
    )
    r.raise_for_status()
    return r.json()


def pesquisar_videos(youtube, keyword, axis):
    try:
        pesquisa = youtube.search().list(
            q=keyword, part="id", type="video",
            regionCode="PT", relevanceLanguage="pt",
            order="viewCount", maxResults=VIDEOS_POR_KEYWORD,
        ).execute()

        ids = [item["id"]["videoId"] for item in pesquisa.get("items", [])]
        if not ids:
            return []

        detalhes = youtube.videos().list(
            part="snippet,statistics", id=",".join(ids),
        ).execute()

        resultados = []
        for v in detalhes.get("items", []):
            snippet = v.get("snippet", {})
            stats   = v.get("statistics", {})
            resultados.append({
                "titulo":          snippet.get("title", ""),
                "canal":           snippet.get("channelTitle", ""),
                "views":           int(stats.get("viewCount", 0)),
                "url":             f"https://www.youtube.com/watch?v={v['id']}",
                "eixo":            axis,
                "data_publicacao": snippet.get("publishedAt", "")[:10],
                "thumbnail_url":   snippet.get("thumbnails", {}).get("medium", {}).get("url", ""),
            })
        return resultados
    except Exception as e:
        print(f"    ❌ Erro para '{keyword}': {e}")
        return []


def main():
    print("📊 Reportagem Viva — YouTube Trends")
    print(f"📅 {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 60)

    youtube = build("youtube", "v3", developerKey=YOUTUBE_API_KEY)

    print("📋 A carregar keywords do Supabase...")
    keywords = buscar_keywords()
    print(f"   ✅ {len(keywords)} keywords activas\n")

    todos = []
    for entrada in keywords:
        kw, axis = entrada["term"], entrada["axis"]
        print(f"🔍 [{axis}] {kw}")
        videos = pesquisar_videos(youtube, kw, axis)
        if videos:
            todos.extend(videos)
            print(f"   ✅ {len(videos)} vídeos")
        else:
            print(f"   ⚠️  Sem resultados")

    print(f"\n📹 Total recolhido: {len(todos)} vídeos")

    todos.sort(key=lambda v: v["views"], reverse=True)
    vistos, top = set(), []
    for v in todos:
        if v["url"] not in vistos:
            vistos.add(v["url"])
            top.append(v)
        if len(top) == TOP_GLOBAL:
            break

    print(f"\n🗑️  A limpar registos anteriores...")
    requests.delete(f"{SUPABASE_URL}/rest/v1/youtube_trends", headers=HEADERS, params={"id": "gte.0"})

    print(f"💾 A inserir top {len(top)} vídeos...")
    for v in top:
        r = requests.post(f"{SUPABASE_URL}/rest/v1/youtube_trends", headers=HEADERS, json=v)
        views_fmt = f"{v['views']:,}".replace(",", ".")
        print(f"   ✅ {v['titulo'][:55]}")
        print(f"      👁 {views_fmt} views · {v['canal']} · [{v['eixo']}]")

    print("\n" + "=" * 60)
    print(f"✅ Concluído — {len(top)} vídeos guardados no Supabase")
    print("=" * 60)


if __name__ == "__main__":
    main()
