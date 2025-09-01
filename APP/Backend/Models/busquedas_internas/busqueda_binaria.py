from typing import List, Optional

class BusquedaBinaria:
    def ejecutar(self, array: List[int], target: int) -> dict:
        """
        Realiza búsqueda binaria en un array (ordenado automáticamente).
        Retorna un diccionario con la posición y el array ordenado.
        """
        array_ordenado = sorted(array)

        inicio = 0
        fin = len(array_ordenado) - 1

        while inicio <= fin:
            medio = (inicio + fin) // 2
            if array_ordenado[medio] == target:
                return {
                    "posicion": medio,
                    "array_ordenado": array_ordenado,
                    "encontrado": True
                }
            elif array_ordenado[medio] < target:
                inicio = medio + 1
            else:
                fin = medio - 1

        return {
            "posicion": None,
            "array_ordenado": array_ordenado,
            "encontrado": False
        }
