from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from modules.webhook.routes import router as webhook_router
from modules.recolecciones.routes import router as recolecciones_router
from modules.simulador.routes import router as simulador_router

app = FastAPI(title="Fundares API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhook_router)
app.include_router(recolecciones_router)
app.include_router(simulador_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "Fundares API"}
