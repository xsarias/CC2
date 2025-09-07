// Clase con la lógica de búsqueda binaria
class Binaria {
  constructor(array) {
    // Ordenamos el array al iniciar con un comparador robusto
    this.array = [...array].sort((a, b) => {
      const an = Number(a);
      const bn = Number(b);
      const aIsNum = a !== "" && !Number.isNaN(an);
      const bIsNum = b !== "" && !Number.isNaN(bn);

      if (aIsNum && bIsNum) {
        return an - bn; // comparación numérica
      }

      // comparación como texto, con opción numeric para "10" vs "2"
      return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
    });
  }

  // Búsqueda binaria paso a paso
  buscarPasoAPaso(target) {
    let low = 0;
    let high = this.array.length - 1;
    const pasos = [];

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);

      // Guardamos el estado actual
      pasos.push({ low, high, mid, valor: this.array[mid] });

      const cmpTarget = this.compareValues(this.array[mid], target);

      if (cmpTarget === 0) {
        return { encontrado: true, index: mid, pasos };
      } else if (cmpTarget < 0) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    return { encontrado: false, index: -1, pasos };
  }

  // Comparador interno reutilizable
  compareValues(a, b) {
    const an = Number(a);
    const bn = Number(b);
    const aIsNum = a !== "" && !Number.isNaN(an);
    const bIsNum = b !== "" && !Number.isNaN(bn);

    if (aIsNum && bIsNum) {
      return an - bn;
    }
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  }
}

export default Binaria;
