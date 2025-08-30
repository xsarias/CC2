from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from controller.busqueda_controller import router as busqueda_router
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
