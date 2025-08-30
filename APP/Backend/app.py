from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
from controller.busqueda_controller import router as busqueda_router
from Factory.algoritmo_factory import AlgoritmoFactory
#from controllers.hash_controller import router as hash_router

app = FastAPI(title="Estructuras de Datos API")
# Habilitar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],  # tu frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "🚀 Servidor funcionando correctamente!"}


# Incluir los controladores como rutas
app.include_router(busqueda_router, prefix="/busquedas")
#app.include_router(hash_router, prefix="/hash")

# Modelo de la petición
class SearchRequest(BaseModel):
    algoritmo: str      # Ejemplo: "lineal"
    array: List[int]    # Lista de números
    target: int         # Número a buscar

# Endpoint POST /buscar
@app.post("/buscar")
def buscar(req: SearchRequest):
    try:
        # Creamos el algoritmo desde la fábrica
        algoritmo = AlgoritmoFactory.crear(req.algoritmo)

        # Ejecutamos la búsqueda
        resultado = algoritmo.buscar(req.array, req.target)

        return {"resultado": resultado}
    except ValueError as e:
        return {"error": str(e)}