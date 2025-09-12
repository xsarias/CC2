// Colisiones.js
class Nodo {
    constructor(valor) {
        this.valor = valor;
        this.next = null;
    }
}

export default class Colisiones {
    static resolver(tabla, index, clave, metodo, tamanoEstructura) {
        let i = index;
        let intento = 1;

        if (metodo === "encadenamiento") {
            if (!tabla[index]) {
                tabla[index] = new Nodo(clave);
            } else {
                let nodo = tabla[index];
                while (nodo.next) {
                    nodo = nodo.next;
                }
                nodo.next = new Nodo(clave);
            }
            return index;
        }

        if (metodo === "arreglos") {
            if (Array.isArray(tabla[index])) {
                tabla[index].push(clave);
            } else {
                tabla[index] = [tabla[index], clave].filter(Boolean);
            }
            return index;
        }

        // Métodos de direccionamiento abierto
        while (tabla[i] !== null && !Array.isArray(tabla[i])) {
            if (metodo === "lineal") {
                i = (index + intento) % tamanoEstructura;
            } else if (metodo === "cuadratica") {
                i = (index + intento * intento) % tamanoEstructura;
            } else if (metodo === "doblehash") {
                const paso = 1 + (parseInt(clave, 10) % (tamanoEstructura - 1));
                i = (i + paso) % tamanoEstructura;
            }
            if (intento > tamanoEstructura) return null;
            intento++;
        }
        return i;
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
                    if (tabla[i].length === 1) {
                        tabla[i] = tabla[i][0];
                    }
                    return true;
                }
            } else if (tabla[i] === clave) {
                tabla[i] = null;
                return true;
            }
        }
        return false;
    }
}
