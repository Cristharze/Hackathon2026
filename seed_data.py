"""
Seed de datos de prueba via Supabase REST API directa.
Ejecutar: python seed_data.py
"""
import requests, sys, json
from datetime import date, datetime, timedelta, timezone

SUPABASE_URL = "https://nwylpcpsokekbpiostyx.supabase.co"
ANON_KEY     = "sb_publishable_exb3HAj029Za3a1nY_3OMA_23jywOkq"
SERVICE_KEY  = "sb_secret_ZAiyqahGPpZcLc2Nk3TIsw_y9FWWtn4"

HEADERS = {
    "apikey":        SERVICE_KEY,
    "Authorization": f"Bearer {SERVICE_KEY}",
    "Content-Type":  "application/json",
    "Prefer":        "return=representation",
}

REST = f"{SUPABASE_URL}/rest/v1"


def get(table, params=""):
    r = requests.get(f"{REST}/{table}?{params}", headers=HEADERS)
    r.raise_for_status()
    return r.json()


def post(table, data, upsert_on=None):
    h = dict(HEADERS)
    if upsert_on:
        h["Prefer"] = f"resolution=merge-duplicates,return=representation"
    r = requests.post(f"{REST}/{table}", headers=h, json=data)
    if not r.ok:
        print(f"  ERROR {r.status_code}: {r.text[:200]}")
        return None
    return r.json()


# ── Test conexión ─────────────────────────────────────────────────────────────
print("→ Probando conexión...")
try:
    r = requests.get(f"{REST}/empresas?limit=1", headers=HEADERS)
    print(f"  Status: {r.status_code}")
    if r.status_code == 401:
        print("  ERROR: Clave de Supabase inválida o sin permisos.")
        print("  Ve a supabase.com → tu proyecto → Settings → API y copia la 'service_role' key")
        sys.exit(1)
    if not r.ok:
        print(f"  ERROR: {r.text}")
        sys.exit(1)
    print("  ✓ Conexión OK")
except Exception as e:
    print(f"  ERROR: {e}")
    sys.exit(1)

# ── 1. Empresas ───────────────────────────────────────────────────────────────
print("\n→ Insertando empresas...")
empresas_data = [
    {"nombre": "Tigo Bolivia",          "sector": "Telecomunicaciones", "ciudad": "Santa Cruz", "contacto": "Roberto Vaca",   "email": "reciclaje@tigo.com.bo",     "activa": True},
    {"nombre": "Banco BNB",             "sector": "Financiero",         "ciudad": "Santa Cruz", "contacto": "Ana Flores",     "email": "sostenibilidad@bnb.com.bo", "activa": True},
    {"nombre": "Farmacorp",             "sector": "Farmacéutico",       "ciudad": "Santa Cruz", "contacto": "Carlos Medina",  "email": "eco@farmacorp.com.bo",      "activa": True},
    {"nombre": "Supermercados Fidalga", "sector": "Retail",             "ciudad": "Santa Cruz", "contacto": "Laura Suárez",   "email": "verde@fidalga.com.bo",      "activa": True},
    {"nombre": "YPFB Corporación",      "sector": "Energía",            "ciudad": "Santa Cruz", "contacto": "Miguel Torrico", "email": "ambiental@ypfb.com.bo",     "activa": False},
]

# Verificar cuáles ya existen
existing = get("empresas", "select=id,nombre")
existing_names = {e["nombre"]: e["id"] for e in existing}
emp_ids = dict(existing_names)

for e in empresas_data:
    if e["nombre"] not in existing_names:
        res = post("empresas", e)
        if res:
            emp_ids[e["nombre"]] = res[0]["id"] if isinstance(res, list) else res["id"]
            print(f"  ✓ Creada: {e['nombre']}")
        else:
            print(f"  ! Falló: {e['nombre']}")
    else:
        print(f"  · Ya existe: {e['nombre']}")

# ── 2. Materiales ─────────────────────────────────────────────────────────────
print("\n→ Verificando materiales...")
materiales_data = [
    {"nombre": "Plástico PET", "codigo": "PET", "unidad": "kg", "color_hex": "#3B82F6", "factor_co2": 1.5,  "factor_agua": 100.0, "factor_energia": 20.0},
    {"nombre": "Cartón",       "codigo": "CAR", "unidad": "kg", "color_hex": "#F59E0B", "factor_co2": 1.1,  "factor_agua": 50.0,  "factor_energia": 15.0},
    {"nombre": "Papel",        "codigo": "PAP", "unidad": "kg", "color_hex": "#10B981", "factor_co2": 0.9,  "factor_agua": 60.0,  "factor_energia": 12.0},
    {"nombre": "Vidrio",       "codigo": "VID", "unidad": "kg", "color_hex": "#6B7280", "factor_co2": 0.3,  "factor_agua": 20.0,  "factor_energia": 5.0},
    {"nombre": "Aluminio",     "codigo": "ALU", "unidad": "kg", "color_hex": "#8B5CF6", "factor_co2": 9.0,  "factor_agua": 400.0, "factor_energia": 95.0},
]

existing_mat = get("materiales", "select=id,codigo")
mat_ids = {m["codigo"]: m["id"] for m in existing_mat}

for m in materiales_data:
    if m["codigo"] not in mat_ids:
        res = post("materiales", m)
        if res:
            mat_ids[m["codigo"]] = res[0]["id"] if isinstance(res, list) else res["id"]
            print(f"  ✓ Creado: {m['nombre']}")
    else:
        print(f"  · Ya existe: {m['nombre']}")

# ── 3. Recolecciones PENDIENTES ───────────────────────────────────────────────
print("\n→ Insertando recolecciones PENDIENTES...")
hoy = date.today()

pendientes = [
    {
        "empresa": "Tigo Bolivia",
        "mensaje": "Buenas tardes, soy Juan recolector. En Tigo juntamos 38 kg de plástico PET hoy viernes. Botellas del comedor.",
        "mat": "PET", "cantidad": 38.0, "confianza": 0.92,
    },
    {
        "empresa": "Banco BNB",
        "mensaje": "Hola buenos días. Tenemos 25 kg de papel de oficina para recoger en BNB sucursal centro. Documentos triturados.",
        "mat": "PAP", "cantidad": 25.0, "confianza": 0.85,
    },
    {
        "empresa": "Farmacorp",
        "mensaje": "Tenemos cartón acumulado del mes, más o menos unas 3 cajas grandes. Unos 50 kg de embalajes de medicamentos.",
        "mat": "CAR", "cantidad": 50.0, "confianza": 0.62,
    },
    {
        "empresa": "Supermercados Fidalga",
        "mensaje": "recoleccion vidrio botellas aceite y vino 15 kg aprox fidalga norte",
        "mat": "VID", "cantidad": 15.0, "confianza": 0.41,
    },
]

for p in pendientes:
    emp_id = emp_ids.get(p["empresa"])
    if not emp_id:
        print(f"  ! Empresa no encontrada: {p['empresa']}")
        continue

    rec = {
        "empresa_id":      emp_id,
        "estado":          "PENDIENTE",
        "fecha_recoleccion": hoy.isoformat(),
        "mensaje_raw":     p["mensaje"],
        "extraido_por_ia": True,
        "ia_confidence":   p["confianza"],
    }
    res = post("recolecciones", rec)
    if res:
        rec_id = (res[0] if isinstance(res, list) else res)["id"]
        mat_id = mat_ids.get(p["mat"])
        if mat_id:
            post("detalle_recoleccion", {
                "recoleccion_id": rec_id,
                "material_id": mat_id,
                "cantidad": p["cantidad"],
                "notas": "kg",
            })
        label = "Alta" if p["confianza"] >= 0.8 else "Media" if p["confianza"] >= 0.5 else "Baja"
        print(f"  ✓ {p['empresa']} — {p['cantidad']} kg — confianza {label}")

# ── 4. Recolecciones APROBADAS ────────────────────────────────────────────────
print("\n→ Insertando recolecciones APROBADAS...")
aprobadas = [
    ("Tigo Bolivia",           "PET", 42.0, -5),
    ("Tigo Bolivia",           "CAR", 18.0, -12),
    ("Banco BNB",              "PAP", 30.0, -3),
    ("Banco BNB",              "PAP", 22.0, -18),
    ("Farmacorp",              "CAR", 60.0, -7),
    ("Farmacorp",              "PET", 15.0, -22),
    ("Supermercados Fidalga",  "VID", 45.0, -9),
    ("Supermercados Fidalga",  "ALU", 8.0,  -14),
]

for (emp_nombre, mat_cod, cant, dias) in aprobadas:
    emp_id = emp_ids.get(emp_nombre)
    if not emp_id:
        continue
    fecha = (hoy + timedelta(days=dias)).isoformat()
    rec = {
        "empresa_id": emp_id, "estado": "APROBADO",
        "fecha_recoleccion": fecha,
        "mensaje_raw": f"Recolección de {mat_cod} — {cant} kg",
        "extraido_por_ia": True, "ia_confidence": 0.88,
        "validado_at": datetime.now(timezone.utc).isoformat(),
    }
    res = post("recolecciones", rec)
    if res:
        rec_id = (res[0] if isinstance(res, list) else res)["id"]
        mat_id = mat_ids.get(mat_cod)
        if mat_id:
            post("detalle_recoleccion", {"recoleccion_id": rec_id, "material_id": mat_id, "cantidad": cant, "notas": "kg"})
        print(f"  ✓ {emp_nombre} — {cant} kg {mat_cod}")

# ── 5. Métricas mensuales ─────────────────────────────────────────────────────
print("\n→ Insertando métricas mensuales...")
metricas = [
    ("Tigo Bolivia",           2026, 5, 72.0,  108.0, 4),
    ("Tigo Bolivia",           2026, 4, 55.0,  82.5,  3),
    ("Tigo Bolivia",           2026, 3, 48.0,  72.0,  2),
    ("Banco BNB",              2026, 5, 52.0,  46.8,  3),
    ("Banco BNB",              2026, 4, 40.0,  36.0,  2),
    ("Farmacorp",              2026, 5, 75.0,  82.5,  3),
    ("Farmacorp",              2026, 4, 60.0,  66.0,  2),
    ("Supermercados Fidalga",  2026, 5, 53.0,  15.9,  3),
    ("Supermercados Fidalga",  2026, 4, 38.0,  11.4,  2),
]

for (emp_nombre, anio, mes, total_kg, co2, num_rec) in metricas:
    emp_id = emp_ids.get(emp_nombre)
    if not emp_id:
        continue
    m = {
        "empresa_id": emp_id, "anio": anio, "mes": mes,
        "total_kg": total_kg, "co2_ahorrado": co2, "num_recolecciones": num_rec,
        "desglose_materiales": {"PET": round(total_kg * 0.4, 1), "Cartón": round(total_kg * 0.35, 1), "Papel": round(total_kg * 0.25, 1)},
    }
    res = post("metricas_mensuales", m)
    if res:
        print(f"  ✓ {emp_nombre} {mes}/{anio} — {total_kg} kg — {co2} kg CO₂")
    # Si hay conflicto de unique constraint simplemente ignora
    else:
        print(f"  · Ya existe o error: {emp_nombre} {mes}/{anio}")

print("\n✅ Listo. Recarga el navegador en http://localhost:3000")
