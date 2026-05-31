from fastapi import APIRouter, HTTPException, BackgroundTasks
from modules.recolecciones import repository
from modules.recolecciones import stats
from modules.recolecciones import reextract as re_mod
from shared import database as db

router = APIRouter(tags=["recolecciones"])


@router.patch("/recolecciones/{record_id}/rechazar")
async def rechazar(record_id: str, payload: dict = {}):
    """Admin rechaza una recolección e indica el motivo."""
    motivo = payload.get("motivo", "")
    if not motivo:
        raise HTTPException(status_code=400, detail="Se requiere un motivo de rechazo.")
    return repository.rechazar(record_id, motivo)


@router.delete("/recolecciones/{record_id}")
async def eliminar(record_id: str):
    """Admin elimina permanentemente una recolección."""
    ok = repository.eliminar(record_id)
    if not ok:
        raise HTTPException(status_code=500, detail="Error al eliminar el registro.")
    return {"ok": True}


@router.post("/admin/reextract")
async def reextract_historicos():
    """
    Re-procesa todos los mensajes históricos:
    extrae materiales con IA y vincula empresas correctamente.
    """
    resultado = re_mod.reextract_all()
    return resultado


@router.get("/stats/admin")
async def get_stats_admin():
    """Datos para gráficos del panel administrador (todas las empresas)."""
    return stats.get_admin_stats()


@router.get("/stats/empresa/{empresa_id}")
async def get_stats_empresa(empresa_id: str):
    """Datos para gráficos de una empresa específica."""
    return stats.get_empresa_stats(empresa_id)


@router.get("/contribuyentes-externos")
async def get_contribuyentes_externos():
    return db.get("contribuyentes_externos", "order=total_kg.desc")


@router.get("/empresas")
async def get_empresas():
    return db.get("empresas", "activa=eq.true&order=nombre.asc")


@router.get("/empresas/{empresa_id}/recolecciones")
async def get_recolecciones_empresa(empresa_id: str):
    return db.get("recolecciones", f"empresa_id=eq.{empresa_id}&order=created_at.desc")


@router.get("/empresas/{empresa_id}/metricas")
async def get_metricas_empresa(empresa_id: str):
    return db.get("metricas_mensuales", f"empresa_id=eq.{empresa_id}&order=anio.desc,mes.desc")
