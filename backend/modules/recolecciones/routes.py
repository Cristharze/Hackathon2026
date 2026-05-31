from fastapi import APIRouter
from modules.recolecciones import repository

router = APIRouter(prefix="/recolecciones", tags=["recolecciones"])


@router.get("/pendientes")
async def get_pendientes():
    return repository.get_pendientes()


@router.patch("/{record_id}/aprobar")
async def aprobar(record_id: str, corrections: dict = {}):
    return repository.aprobar(record_id, corrections)


@router.patch("/{record_id}/rechazar")
async def rechazar(record_id: str, payload: dict = {}):
    return repository.rechazar(record_id, payload.get("motivo", ""))
