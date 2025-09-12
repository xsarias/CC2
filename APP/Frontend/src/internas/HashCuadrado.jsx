import { useState } from "react";

import "../App.css";
import "./IngresarDatos.css";

function HashCuadrado({ onDataChange, onBack }) {
    const [tabla, setTabla] = useState(Array(5).fill(null));
    const [clave, setClave] = useState("");
    const [tamanoClave, setTamanoClave] = useState(2);
    const [rangoMin, setRangoMin] = useState(0);
    const [rangoMax, setRangoMax] = useState(99);
    const [tamanoEstructura, setTamanoEstructura] = useState(5);
    const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
    const [ultimoInsertado, setUltimoInsertado] = useState(null);
    const [metodoColision, setMetodoColision] = useState("lineal");

    // Función hash (cuadrado medio)
    const hash = (key) => {
        const num = parseInt(key, 10);
        if (isNaN(num)) return 0;
        const cuadrado = num * num;
        const str = cuadrado.toString();
        const mitad = Math.floor(str.length / 2);
        const extraido = parseInt(str.substring(mitad - 1, mitad + 1), 10) || cuadrado;
        return extraido % tamanoEstructura;
    };

    // Evita duplicados
    const existeClave = (key) => {
        return tabla.some(slot => {
            if (Array.isArray(slot)) return slot.includes(key);
            if (slot && slot.tipo === "encadenamiento") return slot.valores.includes(key);
            return slot === key;
        });
    };

    // Insertar clave
    const agregarClave = () => {
        if (clave.length !== tamanoClave) {
            alert(`La clave debe tener exactamente ${tamanoClave} dígitos`);
            return;
        }
        const num = parseInt(clave, 10);
        if (isNaN(num) || num < rangoMin || num > rangoMax) {
            alert(`La clave debe estar en el rango ${rangoMin} - ${rangoMax}`);
            return;
        }
        if (existeClave(clave)) {
            alert(`❌ La clave ${clave} ya existe en la tabla.`);
            return;
        }

        let index = hash(clave);
        const nuevaTabla = [...tabla];

        switch (metodoColision) {
            case "lineal":
                while (nuevaTabla[index] !== null) index = (index + 1) % tamanoEstructura;
                nuevaTabla[index] = clave;
                break;

            case "cuadratica": {
                let i = 0;
                while (nuevaTabla[(index + i * i) % tamanoEstructura] !== null) i++;
                index = (index + i * i) % tamanoEstructura;
                nuevaTabla[index] = clave;
                break;
            }

            case "doble-hash": {
                let step = 7 - (parseInt(clave, 10) % 7);
                while (nuevaTabla[index] !== null) index = (index + step) % tamanoEstructura;
                nuevaTabla[index] = clave;
                break;
            }

            case "arreglo-anidado":
                if (!Array.isArray(nuevaTabla[index])) nuevaTabla[index] = [];
                nuevaTabla[index] = [...nuevaTabla[index], clave];
                break;

            case "encadenamiento":
                if (!nuevaTabla[index]) nuevaTabla[index] = { tipo: "encadenamiento", valores: [] };
                nuevaTabla[index].valores.push(clave);
                break;

            default:
                nuevaTabla[index] = clave;
        }

        setTabla(nuevaTabla);
        setClave("");
        setUltimoInsertado(index);
        setTimeout(() => setUltimoInsertado(null), 1500);
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
    };

    // Buscar clave
    const buscarClave = () => {
        if (!clave) {
            alert("Por favor ingresa una clave para buscar.");
            return;
        }

        const index = hash(clave);
        let encontrado = false;

        if (Array.isArray(tabla[index])) encontrado = tabla[index].includes(clave);
        else if (tabla[index] && tabla[index].tipo === "encadenamiento")
            encontrado = tabla[index].valores.includes(clave);
        else encontrado = tabla[index] === clave;

        setResultadoBusqueda(
            encontrado
                ? `✅ La clave ${clave} está en la posición ${index + 1}`
                : `❌ La clave ${clave} NO está en la tabla (posición esperada: ${index + 1})`
        );
    };

    // Borrar clave
    const borrarClave = (index, valor = null) => {
        const nuevaTabla = [...tabla];
        if (valor && Array.isArray(nuevaTabla[index])) {
            nuevaTabla[index] = nuevaTabla[index].filter((v) => v !== valor);
            if (nuevaTabla[index].length === 0) nuevaTabla[index] = null;
        } else if (valor && nuevaTabla[index]?.tipo === "encadenamiento") {
            nuevaTabla[index].valores = nuevaTabla[index].valores.filter((v) => v !== valor);
            if (nuevaTabla[index].valores.length === 0) nuevaTabla[index] = null;
        } else {
            nuevaTabla[index] = null;
        }
        setTabla(nuevaTabla);
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
    };

    // Guardar archivo JSON
    const guardarArchivo = () => {
        const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
        if (!nombreArchivo) return;

        const data = {
            nombre: nombreArchivo,
            tamanoClave,
            rangoMin,
            rangoMax,
            tamanoEstructura,
            valores: tabla,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nombreArchivo}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Recuperar archivo JSON
    const recuperarArchivo = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data || !Array.isArray(data.valores)) {
                    alert("Archivo inválido: debe tener un campo 'valores' que sea un array");
                    return;
                }
                setTabla(data.valores);
                setTamanoClave(Number(data.tamanoClave) || 2);
                setRangoMin(Number(data.rangoMin) || 0);
                setRangoMax(Number(data.rangoMax) || 99);
                setTamanoEstructura(Number(data.tamanoEstructura) || data.valores.length);
                onDataChange?.(data.valores, {
                    tamanoClave: Number(data.tamanoClave) || 2,
                    rangoMin: Number(data.rangoMin) || 0,
                    rangoMax: Number(data.rangoMax) || 99,
                    tamanoEstructura: Number(data.tamanoEstructura) || data.valores.length,
                });
            } catch (error) {
                alert("Error al leer el archivo: JSON inválido");
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="contenedor">
            <h3>🔑 Tabla Hash (Método del cuadrado)</h3>

            {/* Menú colisión */}
            <div style={{ marginBottom: "10px" }}>
                <label>
                    Método de colisión:
                    <select value={metodoColision} onChange={(e) => setMetodoColision(e.target.value)}>
                        <option value="lineal">Prueba Lineal</option>
                        <option value="cuadratica">Prueba Cuadrática</option>
                        <option value="doble-hash">Doble Dirección Hash</option>
                        <option value="arreglo-anidado">Arreglos Anidados</option>
                        <option value="encadenamiento">Encadenamiento</option>
                    </select>
                </label>
            </div>

            {/* Configuración */}
            <div style={{ marginBottom: "10px" }}>
                <label>
                    Tamaño de la estructura:
                    <input
                        type="number"
                        value={tamanoEstructura}
                        onChange={(e) => {
                            const nuevo = parseInt(e.target.value);
                            setTamanoEstructura(nuevo);
                            setTabla(Array(nuevo).fill(null));
                        }}
                        min="1"
                        className="input-chico"
                    />
                </label>
            </div>

            {/* Input clave */}
            <div>
                <input
                    type="text"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder={`Clave (${tamanoClave} dígitos)`}
                    maxLength={tamanoClave}
                    className="input-clave"
                />
                <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
                <button onClick={buscarClave} className="boton" style={{ marginLeft: "10px" }}>🔍 Buscar</button>
            </div>

            {/* Resultado de búsqueda */}
            {resultadoBusqueda && (
                <div className="resultado-busqueda">
                    🔍 {resultadoBusqueda}
                </div>
            )}

            {/* Tabla hash */}
            <table className="tabla-claves">
                <thead>
                    <tr>
                        <th>Índice</th>
                        <th>Clave(s)</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {tabla.map((valor, i) => (
                        <tr key={i} style={{
                            backgroundColor: i === ultimoInsertado ? "#d1ffd1" : "transparent",
                            transition: "background-color 0.6s ease",
                        }}>
                            <td>{i + 1}</td>
                            <td>
                                {Array.isArray(valor) ? (
                                    <div className="px-2 py-1 bg-green-200 rounded-md">
                                        [{valor.join(", ")}]
                                    </div>
                                ) : valor?.tipo === "encadenamiento" ? (
                                    <div className="flex items-center">
                                        {valor.valores.map((v, idx) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-200 rounded-md mx-1">
                                                {v}{idx < valor.valores.length - 1 && " →"}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    valor ?? <em>vacío</em>
                                )}
                            </td>
                            <td>
                                {Array.isArray(valor)
                                    ? valor.map((v, idx) => (
                                        <button key={idx} onClick={() => borrarClave(i, v)} className="boton_borrar">🗑 {v}</button>
                                    ))
                                    : valor?.tipo === "encadenamiento"
                                        ? valor.valores.map((v, idx) => (
                                            <button key={idx} onClick={() => borrarClave(i, v)} className="boton_borrar">🗑 {v}</button>
                                        ))
                                        : valor && <button onClick={() => borrarClave(i)} className="boton_borrar">🗑 Borrar</button>}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Botones extra */}
            <div style={{ marginTop: "10px" }}>
                <button onClick={guardarArchivo} className="boton">💾 Guardar archivo</button>
                <label style={{ cursor: "pointer", marginLeft: "10px" }} className="boton">
                    📂 Cargar archivo
                    <input
                        type="file"
                        accept=".json"
                        onChange={recuperarArchivo}
                        style={{ display: "none" }}
                    />
                </label>
                <button onClick={onBack} style={{ marginLeft: "10px" }} className="boton">
                    ⬅ Volver
                </button>
            </div>
        </div>
    );
}

export default HashCuadrado;
