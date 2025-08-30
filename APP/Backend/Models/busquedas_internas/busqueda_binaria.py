class BusquedaBinaria:
    def ejecutar(self, lista, valor):
        pasos = []
        inicio, fin = 0, len(lista) - 1
        while inicio <= fin:
            mid = (inicio + fin) // 2
            pasos.append(f"Comparando {valor} con {lista[mid]} en índice {mid}")
            if lista[mid] == valor:
                pasos.append(f"Encontrado en índice {mid}")
                return {"resultado": mid, "pasos": pasos}
            elif lista[mid] < valor:
                pasos.append("Descartando mitad izquierda")
                inicio = mid + 1
            else:
                pasos.append("Descartando mitad derecha")
                fin = mid - 1
        pasos.append("Valor no encontrado")
        return {"resultado": None, "pasos": pasos}
