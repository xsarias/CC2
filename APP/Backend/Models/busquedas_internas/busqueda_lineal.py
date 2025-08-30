class BusquedaLineal:
    def ejecutar(self, lista, valor):
        pasos = []
        for i, elem in enumerate(lista):
            pasos.append(f"Comparando {valor} con {elem}")
            if elem == valor:
                pasos.append(f"Encontrado en índice {i}")
                return {"resultado": i, "pasos": pasos}
        pasos.append("Valor no encontrado")
        return {"resultado": None, "pasos": pasos}
