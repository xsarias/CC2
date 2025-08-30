class HashTable:
    def __init__(self, size=10):
        self.size = size
        self.table = [[] for _ in range(size)]

    def ejecutar(self, lista, valor):
        pasos = []
        idx = valor % self.size
        pasos.append(f"Hash({valor}) = {idx}")
        if valor in self.table[idx]:
            pasos.append(f"{valor} ya existe en índice {idx}")
        else:
            self.table[idx].append(valor)
            pasos.append(f"Insertado {valor} en índice {idx}")
        return {"resultado": idx, "tabla": self.table, "pasos": pasos}
 