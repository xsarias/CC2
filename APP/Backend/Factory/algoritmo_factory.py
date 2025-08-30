from Models.busquedas_internas.busqueda_secuencial import BusquedaSecuencial
from Models.busquedas_internas.busqueda_binaria import BusquedaBinaria
from Models.busquedas_internas.hash_table import HashTable
class AlgoritmoFactory:
    @staticmethod
    def crear(algoritmo: str):
        if algoritmo == "secuencial":
            return BusquedaSecuencial()
        elif algoritmo == "binaria":
            return BusquedaBinaria()
        elif algoritmo == "hash":
            return HashTable()
        else:
            raise ValueError(f"Algoritmo '{algoritmo}' no está implementado")

