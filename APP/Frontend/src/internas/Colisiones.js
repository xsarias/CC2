// Colisiones.js
class Nodo {
  constructor(valor) {
    this.valor = valor;
    this.next = null;
  }
}

export default class Colisiones {
  static resolver(tabla, indexBase, clave, metodo, tamanoEstructura) {
    let i = indexBase;
    let intento = 0;

    if (metodo === "encadenamiento") {
      if (!tabla[indexBase]) {
        tabla[indexBase] = new Nodo(clave);
      } else {
        let nodo = tabla[indexBase];
        while (nodo.next) nodo = nodo.next;
        nodo.next = new Nodo(clave);
      }
      return indexBase;
    }

    if (metodo === "arreglos") {
      if (Array.isArray(tabla[indexBase])) {
        tabla[indexBase].push(clave);
      } else {
        tabla[indexBase] = [tabla[indexBase], clave].filter(Boolean);
      }
      return indexBase;
    }

    // Métodos de direccionamiento abierto
    while (intento < tamanoEstructura) {
      if (tabla[i] === null) return i;

      intento++;

      if (metodo === "lineal") {
        i = (indexBase + intento) % tamanoEstructura;
      } else if (metodo === "cuadratica") {
        i = (indexBase + intento * intento) % tamanoEstructura;
      } else if (metodo === "doblehash") {
        const paso = 1 + (parseInt(clave, 10) % (tamanoEstructura - 1));
        i = (indexBase + intento * paso) % tamanoEstructura;
      }
    }

    return null; // tabla llena
  }

  static claveExiste(tabla, clave) {
    return tabla.some((valor) => {
      if (valor instanceof Nodo) {
        let nodo = valor;
        while (nodo) {
          if (nodo.valor === clave) return true;
          nodo = nodo.next;
        }
        return false;
      }
      if (Array.isArray(valor)) return valor.includes(clave);
      return valor === clave;
    });
  }

  static borrarClave(tabla, clave) {
    for (let i = 0; i < tabla.length; i++) {
      if (tabla[i] instanceof Nodo) {
        let nodo = tabla[i];
        let prev = null;
        while (nodo) {
          if (nodo.valor === clave) {
            if (prev) prev.next = nodo.next;
            else tabla[i] = nodo.next;
            return true;
          }
          prev = nodo;
          nodo = nodo.next;
        }
      } else if (Array.isArray(tabla[i])) {
        const idx = tabla[i].indexOf(clave);
        if (idx !== -1) {
          tabla[i].splice(idx, 1);
          if (tabla[i].length === 1) tabla[i] = tabla[i][0];
          return true;
        }
      } else if (tabla[i] === clave) {
        tabla[i] = null;
        return true;
      }
    }
    return false;
  }

  static buscarClave(tabla, clave, metodo, tamanoEstructura) {
    const indexBase = parseInt(clave, 10) % tamanoEstructura;
    let intento = 0;
    let i = indexBase;

    if (metodo === "encadenamiento") {
      let nodo = tabla[i];
      while (nodo) {
        if (nodo.valor === clave) return i;
        nodo = nodo.next;
      }
      return -1;
    }

    if (metodo === "arreglos") {
      const arr = tabla[i];
      if (Array.isArray(arr)) return arr.includes(clave) ? i : -1;
      return arr === clave ? i : -1;
    }

    // Direccionamiento abierto
    while (intento < tamanoEstructura) {
      if (tabla[i] === clave) return i;

      intento++;

      if (metodo === "lineal") {
        i = (indexBase + intento) % tamanoEstructura;
      } else if (metodo === "cuadratica") {
        i = (indexBase + intento * intento) % tamanoEstructura;
      } else if (metodo === "doblehash") {
        const paso = 1 + (parseInt(clave, 10) % (tamanoEstructura - 1));
        i = (indexBase + intento * paso) % tamanoEstructura;
      }
    }

    return -1;
  }
}
