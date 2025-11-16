// HashMod.js
import React, { useEffect, useState } from "react";
import "../App.css";
import "./IngresarDatos.css";
import Colisiones from "./Colisiones";

export default function HashMod({ onDataChange, onBack }) {
    const [tabla, setTabla] = useState(() => new Array(10).fill(null));
    const [clave, setClave] = useState("");
    const [tamanoEstructura, setTamanoEstructura] = useState("");
    const [tamanoClave, setTamanoClave] = useState("");
    const [metodoColision, setMetodoColision] = useState("");
    const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
    const [ultimoInsertado, setUltimoInsertado] = useState(null);
    const [resaltadoTemporal, setResaltadoTemporal] = useState(null);
    const [configBloqueada, setConfigBloqueada] = useState(false);

    const ecuacionHash = `H(K) = (K mod n) + 1 → n = ${tamanoEstructura}`;

    // --- Actualiza tabla al cambiar tamaño ---
    useEffect(() => {
        setTabla((prev) => {
            const n = Number(tamanoEstructura) || 10;
            const nueva = new Array(n).fill(null);
            for (let i = 0; i < Math.min(prev.length, nueva.length); i++) nueva[i] = prev[i];
            return nueva;
        });
    }, [tamanoEstructura]);

    const hashMod = (num) => num % tamanoEstructura;

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
        const indexBase = hashMod(claveNum);

        if (Colisiones.claveExiste(tabla, claveNum)) return alert(`La clave ${claveNum} ya existe.`);

        const tablaCopia = tabla.slice();
        const indexFinal = Colisiones.resolver(tablaCopia, indexBase, claveNum, metodoColision, tamanoEstructura);

        if (indexFinal === null) return alert("No se pudo insertar: tabla llena o no hay posición libre con ese método.");

        if (["lineal", "cuadratica", "doblehash"].includes(metodoColision)) {
            tablaCopia[indexFinal] = claveNum;
        }
        setConfigBloqueada(true);
        setTabla(tablaCopia);
        setUltimoInsertado(indexFinal);
        setClave("");
        setResultadoBusqueda(`✅ Insertada ${claveNum} en índice ${indexFinal + 1}`);
        setResaltadoTemporal({ index: indexFinal, valor: claveNum, tipo: "insertar" });
        setTimeout(() => setResaltadoTemporal(null), 1200);
        setTimeout(() => setUltimoInsertado(null), 1400);
        if (onDataChange) onDataChange(tablaCopia, { tamanoClave, tamanoEstructura, metodoColision });
    };

    // --- Buscar ---
    const buscarClave = () => {
        if (!clave) return alert("Ingresa una clave para buscar.");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");

        const claveNum = parseInt(clave, 10);

        const idx = Colisiones.buscarClave(tabla, claveNum, metodoColision, tamanoEstructura);

        if (idx === -1) {
            setResultadoBusqueda(`❌ La clave ${claveNum} NO se encontró`);
            return;
        }

        const slot = tabla[idx];

        // 🔹 Si es encadenamiento o arreglo anidado, hacemos animación progresiva
        if (metodoColision === "encadenamiento" || metodoColision === "arreglos") {
            let valores = [];

            if (Array.isArray(slot)) valores = slot;
            else if (slot && slot.valor !== undefined) {
                let n = slot;
                while (n) {
                    valores.push(n.valor);
                    n = n.next;
                }
            }

            let i = 0;

            const animarBusqueda = () => {
                if (i >= valores.length) {
                    setResultadoBusqueda(`❌ La clave ${claveNum} NO se encontró`);
                    setResaltadoTemporal(null);
                    return;
                }

                const valorActual = valores[i];

                // 🔸 Resaltar cada paso como "buscando"
                setResaltadoTemporal({ index: idx, valor: valorActual, tipo: "buscando" });

                // Si encontramos la clave, resaltar con color especial "encontrado"
                if (valorActual === claveNum) {
                    setTimeout(() => {
                        setResaltadoTemporal({ index: idx, valor: valorActual, tipo: "encontrado" });
                        setResultadoBusqueda(`✅ La clave ${claveNum} se encontró en índice ${idx + 1}`);
                        setTimeout(() => setResaltadoTemporal(null), 1200);
                    }, 400);
                    return;
                }

                // Si no, continuar con el siguiente
                i++;
                setTimeout(animarBusqueda, 600);
            };

            animarBusqueda();
            return;
        }

        // 🔹 Caso normal
        setResultadoBusqueda(`✅ La clave ${claveNum} se encontró en índice ${idx + 1}`);
        setResaltadoTemporal({ index: idx, valor: claveNum, tipo: "encontrado" });
        setTimeout(() => setResaltadoTemporal(null), 1000);
        setUltimoInsertado(idx);
        setTimeout(() => setUltimoInsertado(null), 1000);
    };



    // --- Eliminar ---
    const borrarClave = () => {
        if (!clave) return alert("Ingresa una clave para eliminar.");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");
    
        const claveNum = parseInt(clave, 10);
    
        // 🔹 Buscamos índice base según hash
        const idx = Colisiones.buscarClave(tabla, claveNum, metodoColision, tamanoEstructura);
    
        if (idx === -1 || idx === null) {
            return alert("La clave no existe");
        }
    
        const slot = tabla[idx];
    
        // 🔹 Si es encadenamiento o arreglos anidados, hacemos recorrido visual
        if (metodoColision === "encadenamiento" || metodoColision === "arreglos") {
            let valores = [];
    
            if (Array.isArray(slot)) valores = slot;
            else if (slot && slot.valor !== undefined) {
                let n = slot;
                while (n) {
                    valores.push(n.valor);
                    n = n.next;
                }
            }
    
            let i = 0;
    
            const animarEliminacion = () => {
                if (i >= valores.length) {
                    setResultadoBusqueda(`❌ La clave ${claveNum} no se encontró para eliminar`);
                    setResaltadoTemporal(null);
                    return;
                }
    
                const valorActual = valores[i];
                setResaltadoTemporal({ index: idx, valor: valorActual, tipo: "buscando" });
    
                // 🔸 Si encontramos la clave, resaltamos con "eliminar" y borramos
                if (valorActual === claveNum) {
                    setTimeout(() => {
                        setResaltadoTemporal({ index: idx, valor: valorActual, tipo: "eliminar" });
    
                        setTimeout(() => {
                            const tablaCopia = tabla.slice();
                            const ok = Colisiones.borrarClave(tablaCopia, claveNum);
    
                            if (!ok) return alert("La clave no existe");
    
                            setTabla(tablaCopia);
                            setResaltadoTemporal(null);
                            setResultadoBusqueda(`🗑 Clave ${claveNum} eliminada`);
                            setClave("");
    
                            if (onDataChange) {
                                onDataChange(tablaCopia, {
                                    tamanoClave,
                                    tamanoEstructura,
                                    metodoColision,
                                });
                            }
                        }, 800); // duración del color de eliminación
                    }, 400);
                    return;
                }
    
                i++;
                setTimeout(animarEliminacion, 600);
            };
    
            animarEliminacion();
            return;
        }
    
        // 🔹 Caso normal (sin estructura compuesta)
        setResaltadoTemporal({ index: idx, valor: claveNum, tipo: "eliminar" });
    
        setTimeout(() => {
            const tablaCopia = tabla.slice();
            const ok = Colisiones.borrarClave(tablaCopia, claveNum);
            if (!ok) return alert("La clave no existe");
    
            setTabla(tablaCopia);
            setResaltadoTemporal(null);
            setResultadoBusqueda(`🗑 Clave ${claveNum} eliminada`);
            setClave("");
    
            if (onDataChange) {
                onDataChange(tablaCopia, { tamanoClave, tamanoEstructura, metodoColision });
            }
        }, 1000);
    };
    


    // --- Vaciar ---
    const vaciar = () => {
        setTabla(new Array(10).fill(null));
        setResultadoBusqueda("Tabla vaciada");
        setClave("");
        setUltimoInsertado(null);
        setResaltadoTemporal(null);

        // 🔹 Reinicia configuración
        setTamanoEstructura("");
        setTamanoClave("");
        setMetodoColision("");

        // 🔹 Desbloquea para una nueva configuración
        setConfigBloqueada(false);
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
                        let contenido = null;

                        // 🔹 Vacío
                        if (slot == null) {
                            contenido = "";
                        }

                        // 🔹 Arreglos anidados (visual tipo [ 23, 45, 62 ])
                        else if (Array.isArray(slot)) {
                            contenido = (
                                <div className="arreglo-celda">
                                    <span className="corchete">[</span>
                                    {slot.map((v, idxA) => {
                                        const esResaltado =
                                            resaltadoTemporal &&
                                            resaltadoTemporal.index === i &&
                                            resaltadoTemporal.valor === v;
                                        return (
                                            <React.Fragment key={idxA}>
                                                <div
                                                    className={`bloque-arreglo ${esResaltado
                                                        ? resaltadoTemporal.tipo === "buscando"
                                                            ? "resaltado-buscando"
                                                            : resaltadoTemporal.tipo === "encontrado"
                                                                ? "resaltado-encontrado"
                                                                : resaltadoTemporal.tipo === "eliminar"
                                                                    ? "resaltado-eliminar"
                                                                    : "bloque-aparecer resaltado-insercion"
                                                        : ""
                                                        }`}
                                                    style={{ animationDelay: `${idxA * 0.1}s` }}
                                                >
                                                    {v}
                                                </div>
                                                {idxA < slot.length - 1 && (
                                                    <span className="coma">,</span>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                    <span className="corchete">]</span>
                                </div>
                            );
                        }

                        // 🔹 Encadenamiento (bloques → sin comas)
                        else if (slot && slot.valor !== undefined) {
                            const nodos = [];
                            let n = slot;
                            while (n) {
                                nodos.push(n.valor);
                                n = n.next;
                            }
                            contenido = (
                                <div className="encadenamiento-celda">
                                    {nodos.map((v, idxN) => {
                                        const esResaltado =
                                            resaltadoTemporal &&
                                            resaltadoTemporal.index === i &&
                                            resaltadoTemporal.valor === v;
                                        return (
                                            <div key={idxN} className="nodo-container">
                                                <div
                                                    className={`nodo ${esResaltado
                                                        ? resaltadoTemporal.tipo === "buscando"
                                                            ? "resaltado-buscando"
                                                            : resaltadoTemporal.tipo === "encontrado"
                                                                ? "resaltado-encontrado"
                                                                : resaltadoTemporal.tipo === "eliminar"
                                                                    ? "resaltado-eliminar"
                                                                    : "bloque-aparecer resaltado-insercion"
                                                        : ""
                                                        }`}
                                                    style={{ animationDelay: `${idxN * 0.1}s` }}
                                                >
                                                    {v}
                                                </div>
                                                {idxN < nodos.length - 1 && (
                                                    <span className="flecha">→</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        }

                        // 🔹 Valor simple
                        else {
                            const esResaltado =
                                resaltadoTemporal &&
                                resaltadoTemporal.index === i &&
                                resaltadoTemporal.valor === slot;
                            contenido = (
                                <div
                                    className={`bloque-simple ${esResaltado
                                        ? resaltadoTemporal.tipo === "buscando"
                                            ? "resaltado-buscando"
                                            : resaltadoTemporal.tipo === "encontrado"
                                                ? "resaltado-encontrado"
                                                : resaltadoTemporal.tipo === "eliminar"
                                                    ? "resaltado-eliminar"
                                                    : "bloque-aparecer resaltado-insercion"
                                        : ""
                                        }`}
                                >
                                    {slot}
                                </div>
                            );
                        }

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
        <div>
            <h3>Función Hash Mod</h3>

            <div className="ecuacion">{ecuacionHash}</div>
            <div className="opciones">
                <div className="campo">
                    <label>Método de colisión:</label>
                    <select
                        value={metodoColision}
                        onChange={(e) => setMetodoColision(e.target.value)}
                        disabled={configBloqueada}
                    >
                        <option value="" disabled>Selecciona un método</option>
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
                        disabled={configBloqueada}
                    />
                </div>

                <div className="campo">
                    <label>Tamaño clave (dígitos):</label>
                    <input
                        type="number"
                        min="1"
                        value={tamanoClave}
                        onChange={(e) => setTamanoClave(Number(e.target.value))}
                        disabled={configBloqueada}
                    />
                </div>
            </div>

            <div className="panel-controles">
                <label color="white">Clave:</label>
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
