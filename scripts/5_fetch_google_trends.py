"""
5_fetch_google_trends.py
========================
Reportagem Viva — busca dados reais do Google Trends PT para as keywords activas
e actualiza os volumes no Supabase.

Usa pytrends (wrapper não-oficial da API Google Trends).
Respeita rate limits com pausas entre pedidos.

Como correr manualmente:
  python3 5_fetch_google_trends.py

No GitHub Actions corre automaticamente (ver workflow).
"""

import time
import requests
from datetime import datetime, timedelta
from pytrends.request import TrendReq

SUPABASE_URL = "https://ijpxjpbjudaddfatibfl.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlqcHhqcGJqdWRhZGRmYXRpYmZsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5NzEzODUsImV4cCI6MjA4ODU0NzM4NX0.SfOLBTYyIhk-CxzvtlvFu1E-GqBNXN3CbFqz8qx-BoM"

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

# Pausa entre pedidos ao Google Trends (evita rate limit)
PAUSA_SEGUNDOS = 8

def buscar_keywords():
    r = requests.get(
        f"{SUPABASE_URL}/rest/v1/keywords",
        headers=HEADERS,
        params={"select": "id,term,axis,current_volume,previous_volume,is_emergent,change_percent", "is_active": "eq.true"}
    )
    r.raise_for_status()
    return r.json()

def buscar_volume_real(pytrends, keyword):
    """
    Devolve o índice de interesse médio das últimas 4 semanas (0-100)
    e o da semana anterior a essa (para calcular variação).
    """
    try:
        pytrends.build_payload(
            [keyword],
            geo="PT",
            timeframe="today 3-m",
            gprop=""
        )
        df = pytrends.interest_over_time()

        if df.empty or keyword not in df.columns:
            return None, None

        df = df[df["isPartial"] == False]
        if len(df) < 2:
            return None, None

        # Últimas 4 semanas = volume actual
        semanas_recentes = df[keyword].tail(4).mean()
        # 4 semanas antes = volume anterior
        semanas_anteriores = df[keyword].iloc[-8:-4].mean() if len(df) >= 8 else df[keyword].head(4).mean()

        return round(float(semanas_recentes)), round(float(semanas_anteriores))

    except Exception as e:
        print(f"    Erro ao buscar '{keyword}': {e}")
        return None, None

def actualizar_keyword(kw_id, current_volume, previous_volume, change_percent, trend, is_emergent):
    payload = {
        "previous_volume": previous_volume,
        "current_volume": current_volume,
        "change_percent": change_percent,
        "trend": trend,
        "is_emergent": is_emergent,
    }
    r = requests.patch(
        f"{SUPABASE_URL}/rest/v1/keywords?id=eq.{kw_id}",
        headers={**HEADERS, "Prefer": "return=minimal"},
        json=payload
    )
    return r.status_code in (200, 204)

def main():
    print("Reportagem Viva — Google Trends PT")
    print(f"{datetime.now().strftime('%d/%m/%Y %H:%M')}")
    print("=" * 60)

    # Inicializar pytrends com locale PT
    pytrends = TrendReq(
        hl="pt-PT",
        tz=-60,
        timeout=(10, 25),
        retries=2,
        backoff_factor=0.5,
    )

    print("A carregar keywords do Supabase...")
    keywords = buscar_keywords()
    print(f"  {len(keywords)} keywords activas\n")

    actualizadas = 0
    sem_dados = 0

    for i, kw in enumerate(keywords):
        term = kw["term"]
        print(f"[{i+1}/{len(keywords)}] {term}")

        current, previous = buscar_volume_real(pytrends, term)

        if current is None:
            # Sem dados — manter volumes, mas resetar emergente se estava activo
            if kw.get("is_emergent"):
                actualizar_keyword(kw["id"], kw["current_volume"], kw["previous_volume"],
                                   kw.get("change_percent", 0), "stable", False)
                print(f"    Sem dados — emergente resetado (sem confirmação Google Trends)")
            else:
                print(f"    Sem dados — mantido")
            sem_dados += 1
        else:
            # Calcular variação
            prev = previous if previous and previous > 0 else kw["previous_volume"]
            if prev and prev > 0:
                change = round(((current - prev) / prev) * 100, 1)
            else:
                change = 0.0

            trend = "up" if change > 10 else "down" if change < -10 else "stable"

            # Actualizar is_emergent: activa com crescimento forte, expira quando estabiliza
            is_emergent = change >= 50 and current >= 10
            # Log quando um emergente expira
            if not is_emergent and kw.get("is_emergent"):
                print(f"    ⚠ Emergente expirado (variação actual: {change:+.1f}%)")

            ok = actualizar_keyword(kw["id"], current, prev, change, trend, is_emergent)
            status = "OK" if ok else "ERRO"
            seta = "↑" if trend == "up" else "↓" if trend == "down" else "→"
            print(f"    {status} — índice {current} (anterior {prev}) {seta} {change:+.1f}%")
            if ok:
                actualizadas += 1

        # Pausa entre pedidos para não ser bloqueado
        if i < len(keywords) - 1:
            time.sleep(PAUSA_SEGUNDOS)

    print()
    print("=" * 60)
    print(f"Concluído — {actualizadas} keywords actualizadas com dados reais")
    if sem_dados:
        print(f"           {sem_dados} sem dados Google Trends (valores mantidos)")
    print("=" * 60)

if __name__ == "__main__":
    main()
