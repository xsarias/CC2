from Models.busquedas_internas.busqueda_lineal import BusquedaLineal
from Models.busquedas_internas.busqueda_binaria import BusquedaBinaria
from Models.busquedas_internas.hash_table import HashTable
class AlgoritmoFactory:
    @staticmethod
    def crear(algoritmo: str):
        if algoritmo == "lineal":
            return BusquedaLineal()
        elif algoritmo == "binaria":
            return BusquedaBinaria()
        elif algoritmo == "hash":
            return HashTable()
        else:
            raise ValueError(f"Algoritmo '{algoritmo}' no está implementado")
