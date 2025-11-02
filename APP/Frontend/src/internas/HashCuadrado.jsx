import React, { useEffect, useState } from "react";
import "../App.css";
import "./IngresarDatos.css";
import Colisiones from "./Colisiones";

export default function HashCuadrado({ onDataChange, onBack }) {
    const [tabla, setTabla] = useState(() => new Array(10).fill(null));
    const [clave, setClave] = useState("");
    const [tamanoEstructura, setTamanoEstructura] = useState(10);
    const [tamanoClave, setTamanoClave] = useState(2);
    const [metodoColision, setMetodoColision] = useState("lineal");
    const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
    const [ultimoInsertado, setUltimoInsertado] = useState(null);

    const ecuacionHash = `H(K) = dígitos centrales (K²) mod n → n = ${tamanoEstructura}`;

    // --- Actualiza tabla al cambiar tamaño ---
    useEffect(() => {
        setTabla((prev) => {
            const n = Number(tamanoEstructura) || 10;
            const nueva = new Array(n).fill(null);
            for (let i = 0; i < Math.min(prev.length, nueva.length); i++) nueva[i] = prev[i];
            return nueva;
        });
    }, [tamanoEstructura]);

    // --- Hash del Cuadrado Medio ---
    const hashCuadrado = (num) => {
        const cuadrado = num * num;
        const str = cuadrado.toString();
        const mitad = Math.floor(str.length / 2);
        const extraido = parseInt(str.substring(mitad - 1, mitad + 1), 10) || cuadrado;
        return extraido % tamanoEstructura;
    };

    const validarDigitos = (valor) => {
        const s = String(valor);
        const sSinCeros = s.replace(/^0+/, "") || "0";
        return sSinCeros.length === Number(tamanoClave);
    };

    // --- Insertar ---
    const agregarClave = () => {
        if (!clave) return alert("Ingresa una clave");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");
        if (!validarDigitos(clave))
            return alert(`La clave debe tener exactamente ${tamanoClave} dígitos (sin contar ceros a la izquierda).`);

        const claveNum = parseInt(clave, 10);
        const indexBase = hashCuadrado(claveNum);

        if (Colisiones.claveExiste(tabla, claveNum)) return alert(`La clave ${claveNum} ya existe.`);

        const tablaCopia = tabla.slice();
        const indexFinal = Colisiones.resolver(tablaCopia, indexBase, claveNum, metodoColision, tamanoEstructura);

        if (indexFinal === null) return alert("No se pudo insertar: tabla llena o no hay posición libre con ese método.");

        if (["lineal", "cuadratica", "doblehash"].includes(metodoColision)) {
            tablaCopia[indexFinal] = claveNum;
        }

        setTabla(tablaCopia);
        setUltimoInsertado(indexFinal);
        setClave("");
        setResultadoBusqueda(`✅ Insertada ${claveNum} en índice ${indexFinal + 1}`);
        setTimeout(() => setUltimoInsertado(null), 1400);
        if (onDataChange) onDataChange(tablaCopia, { tamanoClave, tamanoEstructura, metodoColision });
    };

    // --- Buscar ---
    const buscarClave = () => {
        if (!clave) return alert("Ingresa una clave para buscar.");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");

        const claveNum = parseInt(clave, 10);
        const idx = Colisiones.buscarClave(tabla, claveNum, metodoColision, tamanoEstructura);
        if (idx === -1) setResultadoBusqueda(`❌ La clave ${claveNum} NO se encontró`);
        else {
            setResultadoBusqueda(`✅ La clave ${claveNum} se encontró en índice ${idx + 1}`);
            setUltimoInsertado(idx);
            setTimeout(() => setUltimoInsertado(null), 1000);
        }
    };

    // --- Eliminar ---
    const borrarClave = () => {
        if (!clave) return alert("Ingresa una clave para eliminar.");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");

        const claveNum = parseInt(clave, 10);
        const tablaCopia = tabla.slice();
        const ok = Colisiones.borrarClave(tablaCopia, claveNum);
        if (!ok) return alert("La clave no existe");

        setTabla(tablaCopia);
        setResultadoBusqueda(`🗑 Clave ${claveNum} eliminada`);
        setClave("");
        if (onDataChange) onDataChange(tablaCopia, { tamanoClave, tamanoEstructura, metodoColision });
    };

    // --- Vaciar ---
    const vaciar = () => {
        setTabla(new Array(Number(tamanoEstructura || 10)).fill(null));
        setResultadoBusqueda("Tabla vaciada");
        setClave("");
    };

    // --- Guardar / Cargar ---
    const guardarArchivo = () => {
        const nombre = prompt("Nombre para guardar (sin extensión):");
        if (!nombre) return;
        const data = {
            tamanoEstructura,
            tamanoClave,
            metodoColision,
            tabla: serializar(tabla),
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `${nombre}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const cargarArchivo = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            try {
                const data = JSON.parse(ev.target.result);
                setTamanoEstructura(Number(data.tamanoEstructura) || 10);
                setTamanoClave(Number(data.tamanoClave) || 2);
                setMetodoColision(data.metodoColision || "lineal");
                setTabla(deserializar(data.tabla, Number(data.tamanoEstructura) || 10));
            } catch (err) {
                console.error(err);
                alert("Error leyendo archivo");
            }
        };
        reader.readAsText(f);
        e.target.value = "";
    };

    const serializar = (t) =>
        t.map((slot) => {
            if (slot == null) return { tipo: "null" };
            if (Array.isArray(slot)) return { tipo: "array", valores: slot };
            if (slot && slot.valor !== undefined) {
                const vals = [];
                let n = slot;
                while (n) {
                    vals.push(n.valor);
                    n = n.next;
                }
                return { tipo: "nodo", valores: vals };
            }
            return { tipo: "simple", valor: slot };
        });

    const deserializar = (serial, n) => {
        const arr = new Array(n).fill(null);
        for (let i = 0; i < Math.min(serial.length, n); i++) {
            const item = serial[i];
            if (!item) continue;
            if (item.tipo === "null") arr[i] = null;
            else if (item.tipo === "array") arr[i] = item.valores;
            else if (item.tipo === "nodo") {
                let head = null;
                let prev = null;
                for (const v of item.valores) {
                    const node = { valor: v, next: null };
                    if (!head) head = node;
                    else prev.next = node;
                    prev = node;
                }
                arr[i] = head;
            } else if (item.tipo === "simple") arr[i] = item.valor;
        }
        return arr;
    };

    const renderTabla = () => {
        const n = Number(tamanoEstructura);
        const indices = new Set([0, n - 1]);
        tabla.forEach((slot, i) => {
            if (slot != null) indices.add(i);
        });
        const lista = Array.from(indices).sort((a, b) => a - b);

        return (
            <table className="tabla-estructura">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Clave</th>
                    </tr>
                </thead>
                <tbody>
                    {lista.map((i) => {
                        const slot = tabla[i];
                        let contenido = "";
                        if (slot == null) contenido = "";
                        else if (Array.isArray(slot)) contenido = slot.join(", ");
                        else if (slot && slot.valor !== undefined) {
                            const vals = [];
                            let n = slot;
                            while (n) {
                                vals.push(n.valor);
                                n = n.next;
                            }
                            contenido = vals.join(" → ");
                        } else contenido = String(slot);

                        return (
                            <tr key={i} className={i === ultimoInsertado ? "nueva-fila" : ""}>
                                <td>{i + 1}</td>
                                <td>{contenido}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    return (
        <div className="contenedor">
            <h3> Método del Cuadrado Medio</h3>

            <div className="ecuacion">{ecuacionHash}</div>
            <div className="opciones">
                <div className="campo">
                    <label>Método de colisión:</label>
                    <select
                        value={metodoColision}
                        onChange={(e) => setMetodoColision(e.target.value)}
                    >
                        <option value="lineal">Lineal</option>
                        <option value="cuadratica">Cuadrática</option>
                        <option value="doblehash">Doble hash</option>
                        <option value="encadenamiento">Encadenamiento</option>
                        <option value="arreglos">Arreglos</option>
                    </select>
                </div>

                <div className="campo">
                    <label>Tamaño estructura (n):</label>
                    <input
                        type="number"
                        min="2"
                        value={tamanoEstructura}
                        onChange={(e) => setTamanoEstructura(Number(e.target.value))}
                    />
                </div>

                <div className="campo">
                    <label>Tamaño clave (dígitos):</label>
                    <input
                        type="number"
                        min="1"
                        value={tamanoClave}
                        onChange={(e) => setTamanoClave(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="panel-controles">
                <label>Clave:</label>
                <input
                    type="text"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder={`(${tamanoClave} dígitos)`}
                />
                <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
                <button onClick={buscarClave} className="boton">🔍 Buscar</button>
                <button onClick={borrarClave} className="boton eliminar">✖️ Eliminar</button>
                <button onClick={vaciar} className="boton">♻ Vaciar</button>
            </div>

            {resultadoBusqueda && <p className="resultado">{resultadoBusqueda}</p>}

            <div className="tabla-container">{renderTabla()}</div>

            <div className="botones-archivo">
                <button onClick={guardarArchivo} className="boton">💾 Guardar</button>
                <label className="boton">
                    📂 Cargar
                    <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
                </label>
                <button onClick={() => onBack && onBack()} className="boton">⬅ Volver</button>
            </div>
        </div>
    );
}
