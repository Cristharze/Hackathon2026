from fastapi import APIRouter
from modules.recolecciones import repository
from shared import database as db

router = APIRouter(tags=["recolecciones"])


@router.get("/recolecciones/pendientes")
async def get_pendientes():
    return repository.get_pendientes()


@router.patch("/recolecciones/{record_id}/aprobar")
async def aprobar(record_id: str, corrections: dict = {}):
    return repository.aprobar(record_id, corrections)


@router.patch("/recolecciones/{record_id}/rechazar")
async def rechazar(record_id: str, payload: dict = {}):
    return repository.rechazar(record_id, payload.get("motivo", ""))


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
