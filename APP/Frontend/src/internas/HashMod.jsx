import { useState } from "react";
import "../App.css";
import "./IngresarDatos.css";

function HashMod({ onDataChange, onBack }) {
    const [tabla, setTabla] = useState(Array(5).fill(null));
    const [clave, setClave] = useState("");
    const [tamanoClave, setTamanoClave] = useState(2);
    const [rangoMin, setRangoMin] = useState(0);
    const [rangoMax, setRangoMax] = useState(99);
    const [tamanoEstructura, setTamanoEstructura] = useState(5);
    const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
    const [metodoColision, setMetodoColision] = useState("lineal"); // 👈 menú de colisiones

    // --- Función hash básica (módulo)
    const hash = (key) => {
        const num = parseInt(key, 10);
        return isNaN(num) ? 0 : num % tamanoEstructura;
    };

    // --- Resolver colisión según el método elegido
    const resolverColision = (indexInicial) => {
        let i = 0;
        let index = indexInicial;

        if (metodoColision === "lineal") {
            while (tabla[index] !== null) {
                i++;
                index = (indexInicial + i) % tamanoEstructura;
                if (i >= tamanoEstructura) return -1; // tabla llena
            }
        } 
        else if (metodoColision === "cuadratica") {
            while (tabla[index] !== null) {
                i++;
                index = (indexInicial + i * i) % tamanoEstructura;
                if (i >= tamanoEstructura) return -1;
            }
        }
        else if (metodoColision === "dobleHash") {
            const h2 = 1 + (indexInicial % (tamanoEstructura - 1));
            while (tabla[index] !== null) {
                i++;
                index = (indexInicial + i * h2) % tamanoEstructura;
                if (i >= tamanoEstructura) return -1;
            }
        }
        else if (metodoColision === "encadenamiento" || metodoColision === "anidado") {
            // Para estos métodos, usaremos listas en cada celda
            if (!Array.isArray(tabla[index])) tabla[index] = [];
            return index; // usamos el índice original, pero lo tratamos como lista
        }

        return index;
    };

    // --- Agregar clave validando duplicados y colisiones
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

        // Evitar duplicados
        if (tabla.some((v) => (Array.isArray(v) ? v.includes(clave) : v === clave))) {
            alert(`❌ La clave ${clave} ya existe en la tabla`);
            return;
        }

        const indexInicial = hash(clave);
        let index = indexInicial;

        if (tabla[index] !== null) {
            // Colisión: resolver según el método elegido
            index = resolverColision(indexInicial);
            if (index === -1) {
                alert("⚠️ La tabla está llena, no se pudo insertar");
                return;
            }
        }

        const nuevaTabla = [...tabla];
        if (metodoColision === "encadenamiento" || metodoColision === "anidado") {
            nuevaTabla[index] = [...(nuevaTabla[index] || []), clave];
        } else {
            nuevaTabla[index] = clave;
        }

        setTabla(nuevaTabla);
        setClave("");
        setResultadoBusqueda(null);
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
    };

    // --- Buscar clave usando hash
    const buscarClave = () => {
        if (!clave) {
            alert("Por favor ingresa una clave para buscar.");
            return;
        }

        const indexInicial = hash(clave);
        let encontrado = false;

        if (Array.isArray(tabla[indexInicial])) {
            encontrado = tabla[indexInicial].includes(clave);
        } else if (tabla[indexInicial] === clave) {
            encontrado = true;
        }

        setResultadoBusqueda(
            encontrado
                ? `✅ La clave ${clave} se encontró (posición base: ${indexInicial + 1})`
                : `❌ La clave ${clave} NO se encontró en la tabla`
        );
    };

    const borrarClave = (index, valor = null) => {
        const nuevaTabla = [...tabla];
        if (Array.isArray(nuevaTabla[index])) {
            nuevaTabla[index] = nuevaTabla[index].filter((v) => v !== valor);
            if (nuevaTabla[index].length === 0) nuevaTabla[index] = null;
        } else {
            nuevaTabla[index] = null;
        }
        setTabla(nuevaTabla);
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
    };

    // --- Guardar y recuperar archivo JSON
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
            metodoColision,
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nombreArchivo}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

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
                setMetodoColision(data.metodoColision || "lineal");

                onDataChange?.(data.valores, data);
            } catch (error) {
                alert("Error al leer el archivo: JSON inválido");
                console.error(error);
            }
        };

        reader.readAsText(file);
    };

    return (
        <div className="contenedor">
            <h3>🔑 Tabla Hash (MOD)</h3>

            {/* Configuración */}
            <div style={{ marginBottom: "10px" }}>
                <label>
                    Método de Colisión:
                    <select
                        value={metodoColision}
                        onChange={(e) => setMetodoColision(e.target.value)}
                        className="input-chico"
                    >
                        <option value="lineal">Prueba lineal</option>
                        <option value="cuadratica">Prueba cuadrática</option>
                        <option value="dobleHash">Doble hashing</option>
                        <option value="encadenamiento">Encadenamiento</option>
                        <option value="anidado">Arreglo anidado</option>
                    </select>
                </label>
            </div>

            {/* Resto de la configuración igual que antes */}
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

            <div style={{ marginBottom: "10px" }}>
                <label>
                    Tamaño de la clave:
                    <input
                        type="number"
                        value={tamanoClave}
                        onChange={(e) => setTamanoClave(parseInt(e.target.value))}
                        min="1"
                        className="input-chico"
                    />
                </label>
            </div>

            <div style={{ marginBottom: "10px" }}>
                <label>
                    Rango:
                    <input
                        type="number"
                        value={rangoMin}
                        onChange={(e) => setRangoMin(parseInt(e.target.value))}
                        className="input-rango"
                    />
                    -
                    <input
                        type="number"
                        value={rangoMax}
                        onChange={(e) => setRangoMax(parseInt(e.target.value))}
                        className="input-rango"
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
                <button onClick={buscarClave} className="boton" style={{ marginLeft: "10px" }}>
                    🔍 Buscar
                </button>
            </div>

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
                        <tr key={i}>
                            <td>{i + 1}</td>
                            <td>
                                {Array.isArray(valor)
                                    ? valor.join(", ")
                                    : valor ?? <em>vacío</em>}
                            </td>
                            <td>
                                {Array.isArray(valor)
                                    ? valor.map((v) => (
                                        <button
                                            key={v}
                                            onClick={() => borrarClave(i, v)}
                                            className="boton_borrar"
                                        >
                                            🗑 {v}
                                        </button>
                                    ))
                                    : valor && (
                                        <button onClick={() => borrarClave(i)} className="boton_borrar">
                                            🗑 Borrar
                                        </button>
                                    )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Botones finales */}
            <div style={{ marginTop: "10px" }}>
                <button onClick={guardarArchivo} className="boton">💾 Guardar archivo</button>
                <label style={{ cursor: "pointer", marginLeft: "10px" }} className="boton">
                    📂 Cargar archivo
                    <input type="file" accept=".json" onChange={recuperarArchivo} style={{ display: "none" }} />
                </label>
                <button onClick={onBack} style={{ marginLeft: "10px" }} className="boton">
                    ⬅ Volver
                </button>
            </div>
        </div>
    );
}

export default HashMod;
