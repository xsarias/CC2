from fastapi import APIRouter
from Factory.algoritmo_factory import AlgoritmoFactory

router = APIRouter()

@router.post("/{tipo}")
def ejecutar_busqueda(tipo: str, datos: dict):
    lista = datos.get("lista", [])
    valor = datos.get("valor")
    algoritmo = AlgoritmoFactory.crear(tipo)
    return algoritmo.ejecutar(lista, valor)
