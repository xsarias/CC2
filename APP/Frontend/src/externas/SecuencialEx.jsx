import React, { useState, useEffect } from "react";
import "../App.css";
import "../internas/IngresarDatos.css";

export default function SecuencialEx({ onDataChange, onBack }) {
    const [registros, setRegistros] = useState([]);
    const [clave, setClave] = useState("");
    const [tamano, setTamano] = useState(16);
    const [tamanoClave, setTamanoClave] = useState(4);
    const [bloques, setBloques] = useState([]);
    const [resultado, setResultado] = useState("");
    const [ultimoInsertado, setUltimoInsertado] = useState(null);

    useEffect(() => {
        generarBloques();
    }, [tamano, registros]);

    const generarBloques = () => {
        const raiz = Math.ceil(Math.sqrt(tamano));
        const registrosPorBloque = Math.ceil(tamano / raiz);
        const nuevosBloques = [];

        let contador = 1;
        for (let i = 0; i < raiz; i++) {
            const datos = [];
            for (let j = 0; j < registrosPorBloque && contador <= tamano; j++) {
                datos.push({ posicion: contador, clave: registros[contador - 1] || "" });
                contador++;
            }
            nuevosBloques.push({ id: i + 1, datos });
        }

        setBloques(nuevosBloques);
    };

    const insertar = () => {
        if (!clave) return alert("Ingrese una clave numérica.");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica.");
        if (clave.length !== tamanoClave)
            return alert(`La clave debe tener ${tamanoClave} dígitos.`);
        if (registros.includes(clave)) return alert("La clave ya existe.");

        const nuevos = [...registros, clave].sort((a, b) => Number(a) - Number(b));
        setRegistros(nuevos);
        setClave("");
        setResultado(`✅ Clave ${clave} insertada correctamente.`);
        setUltimoInsertado(clave);
        setTimeout(() => setUltimoInsertado(null), 1000);
        if (onDataChange) onDataChange(nuevos);
    };

    const buscar = () => {
        if (!clave) return alert("Ingrese una clave a buscar.");
        const existe = registros.includes(clave);
        setResultado(existe ? `✅ Clave ${clave} encontrada.` : `❌ Clave ${clave} no encontrada.`);
    };

    const eliminar = () => {
        if (!clave) return alert("Ingrese una clave a eliminar.");
        const nuevos = registros.filter((x) => x !== clave);
        if (nuevos.length === registros.length) return alert("La clave no existe.");
        setRegistros(nuevos);
        setResultado(`🗑 Clave ${clave} eliminada.`);
        setClave("");
    };

    const vaciar = () => {
        setRegistros([]);
        setResultado("Tabla vaciada.");
    };

    const guardarArchivo = () => {
        const nombre = prompt("Nombre del archivo (sin extensión):");
        if (!nombre) return;
        const data = { tamano, tamanoClave, registros };
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
                setTamano(Number(data.tamano) || 16);
                setTamanoClave(Number(data.tamanoClave) || 4);
                setRegistros(data.registros || []);
            } catch {
                alert("Archivo inválido.");
            }
        };
        reader.readAsText(f);
        e.target.value = "";
    };

    const renderBloques = () => {
        return (
            <div className="bloques-container">
                {bloques.map((bloque) => (
                    <div key={bloque.id} className="bloque">
                        <h4>B{bloque.id}</h4>
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Clave</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bloque.datos.map((celda) => (
                                    <tr
                                        key={celda.posicion}
                                        className={
                                            celda.clave === ultimoInsertado ? "nueva-fila" : ""
                                        }
                                    >
                                        <td>{celda.posicion}</td>
                                        <td>{celda.clave || "-"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="contenedor">
            <h3>📦 Búsqueda Secuencial Externa</h3>

            <div className="opciones">
                <div className="campo">
                    <label>Número total de registros (n):</label>
                    <input
                        type="number"
                        min="4"
                        value={tamano}
                        onChange={(e) => setTamano(Number(e.target.value))}
                    />
                </div>

                <div className="campo">
                    <label>Tamaño de la clave (dígitos):</label>
                    <input
                        type="number"
                        min="1"
                        value={tamanoClave}
                        onChange={(e) => setTamanoClave(Number(e.target.value))}
                    />
                </div>
            </div>
        <br></br>
            <div className="panel-controles">
                <label>Clave:</label>
                <input
                    type="text"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder={`Ej: ${"1".repeat(tamanoClave || 4)}`}
                />
                <button onClick={insertar} className="boton_agregar">➕ Insertar</button>
                <button onClick={buscar} className="boton">🔍 Buscar</button>
                <button onClick={eliminar} className="boton eliminar">🗑 Eliminar</button>
                <button onClick={vaciar} className="boton">♻ Vaciar</button>
            </div>

            {resultado && <p className="resultado">{resultado}</p>}

            {renderBloques()}

            <br></br>
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
