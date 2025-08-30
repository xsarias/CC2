class BusquedaSecuencial:
    def buscar(self, array, target):
        """
        Implementación de búsqueda secuencial (lineal).
        Retorna la posición si encuentra el elemento, -1 si no está.
        """
        for i, valor in enumerate(array):
            if valor == target:
                return {"posicion": i, "encontrado": True}
        return {"posicion": -1, "encontrado": False}
