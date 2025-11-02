// HashPlegamiento.jsx
import React, { useState, useEffect } from "react";
import "../App.css";
import "./IngresarDatos.css";

export default function HashPlegamiento({ onDataChange, onBack }) {
    const [tabla, setTabla] = useState(() => new Array(10).fill(null));
    const [clave, setClave] = useState("");
    const [tamanoEstructura, setTamanoEstructura] = useState(10);
    const [tamanoClave, setTamanoClave] = useState(4);
    const [metodoColision, setMetodoColision] = useState("lineal");
    const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
    const [ultimoInsertado, setUltimoInsertado] = useState(null);

    const ecuacionHash = `H(K) = suma(grupos de dígitos menos significativos) + 1 % n`;

    // Actualizar tabla si cambia tamaño
    useEffect(() => {
        setTabla((prev) => {
            const n = Number(tamanoEstructura) || 10;
            const nueva = new Array(n).fill(null);
            for (let i = 0; i < Math.min(prev.length, nueva.length); i++) nueva[i] = prev[i];
            return nueva;
        });
    }, [tamanoEstructura]);

    // --- Hash por Plegamiento ---
    const hashPlegamiento = (key) => {
        const str = key.toString();
        const grupoTam = 2;
        const grupos = [];
        for (let i = str.length; i > 0; i -= grupoTam) {
            const inicio = Math.max(i - grupoTam, 0);
            grupos.unshift(str.slice(inicio, i));
        }
        const suma = grupos.reduce((acc, g) => acc + parseInt(g, 10), 0);
        return (suma + 1) % tamanoEstructura;
    };

    // --- Insertar clave ---
    const agregarClave = () => {
        if (!clave) return alert("Ingresa una clave.");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica.");
        if (clave.length !== Number(tamanoClave))
            return alert(`La clave debe tener exactamente ${tamanoClave} dígitos.`);

        const indexBase = hashPlegamiento(clave);
        let index = indexBase;
        const tablaCopia = tabla.slice();

        let intentos = 0;
        while (tablaCopia[index] !== null && intentos < tamanoEstructura) {
            if (metodoColision === "lineal") index = (index + 1) % tamanoEstructura;
            else if (metodoColision === "cuadratica") index = (indexBase + intentos * intentos) % tamanoEstructura;
            else if (metodoColision === "doblehash") {
                const step = 7 - (parseInt(clave) % 7);
                index = (index + step) % tamanoEstructura;
            }
            intentos++;
        }

        if (intentos === tamanoEstructura) return alert("No se encontró espacio libre (tabla llena).");
        tablaCopia[index] = clave;
        setTabla(tablaCopia);
        setUltimoInsertado(index);
        setClave("");
        setResultadoBusqueda(`✅ Insertada ${clave} en índice ${index + 1}`);
        setTimeout(() => setUltimoInsertado(null), 1200);
        if (onDataChange) onDataChange(tablaCopia, { tamanoEstructura, tamanoClave, metodoColision });
    };

    // --- Buscar clave ---
    const buscarClave = () => {
        if (!clave) return alert("Ingresa una clave para buscar.");
        const claveNum = clave.toString();
        const indexBase = hashPlegamiento(claveNum);
        let index = indexBase;
        let intentos = 0;

        while (intentos < tamanoEstructura) {
            if (tabla[index] === claveNum) {
                setResultadoBusqueda(`✅ Clave ${claveNum} encontrada en índice ${index + 1}`);
                setUltimoInsertado(index);
                setTimeout(() => setUltimoInsertado(null), 1000);
                return;
            }
            if (metodoColision === "lineal") index = (index + 1) % tamanoEstructura;
            else if (metodoColision === "cuadratica") index = (indexBase + intentos * intentos) % tamanoEstructura;
            else if (metodoColision === "doblehash") {
                const step = 7 - (parseInt(claveNum) % 7);
                index = (index + step) % tamanoEstructura;
            }
            intentos++;
        }
        setResultadoBusqueda(`❌ Clave ${claveNum} no encontrada.`);
    };

    // --- Eliminar clave ---
    const borrarClave = () => {
        if (!clave) return alert("Ingresa una clave para eliminar.");
        const claveNum = clave.toString();
        const tablaCopia = tabla.slice();
        const index = tablaCopia.findIndex((x) => x === claveNum);
        if (index === -1) return alert("La clave no existe.");
        tablaCopia[index] = null;
        setTabla(tablaCopia);
        setResultadoBusqueda(`🗑 Clave ${claveNum} eliminada.`);
        setClave("");
    };

    // --- Vaciar tabla ---
    const vaciar = () => {
        setTabla(new Array(Number(tamanoEstructura) || 10).fill(null));
        setResultadoBusqueda("Tabla vaciada");
        setClave("");
    };

    // --- Guardar / Cargar ---
    const guardarArchivo = () => {
        const nombre = prompt("Nombre del archivo (sin extensión):");
        if (!nombre) return;
        const data = { tamanoEstructura, tamanoClave, metodoColision, tabla };
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
                setTamanoClave(Number(data.tamanoClave) || 4);
                setMetodoColision(data.metodoColision || "lineal");
                setTabla(data.tabla || []);
            } catch {
                alert("Archivo inválido.");
            }
        };
        reader.readAsText(f);
        e.target.value = "";
    };

    // --- Renderizar tabla (solo celdas importantes) ---
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
                    {lista.map((i) => (
                        <tr key={i} className={i === ultimoInsertado ? "nueva-fila" : ""}>
                            <td>{i + 1}</td>
                            <td>{tabla[i] ?? ""}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="contenedor">
            <h3>Función de Plegamiento</h3>

            <div className="ecuacion">{ecuacionHash}</div>

            <div className="opciones">
                <div className="campo">
                    <label>Método de colisión:</label>
                    <select value={metodoColision} onChange={(e) => setMetodoColision(e.target.value)}>
                        <option value="lineal">Lineal</option>
                        <option value="cuadratica">Cuadrática</option>
                        <option value="doblehash">Doble hash</option>
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
