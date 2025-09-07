import { useState } from "react";
import "./HashMod.css";

function HashMod({ onDataChange, onBack }) {
    const [tabla, setTabla] = useState(Array(5).fill(null));
    const [clave, setClave] = useState("");
    const [tamanoClave, setTamanoClave] = useState(2);
    const [rangoMin, setRangoMin] = useState(0);
    const [rangoMax, setRangoMax] = useState(99);
    const [tamanoEstructura, setTamanoEstructura] = useState(5);
    const [resultadoBusqueda, setResultadoBusqueda] = useState(null);

    // Función hash básica (módulo)
    const hash = (key) => {
        const num = parseInt(key, 10);
        return isNaN(num) ? 0 : num % tamanoEstructura;
    };

    // Agregar clave validando
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

        const index = hash(clave);
        if (tabla[index] !== null) {
            alert(`⚠️ Colisión: la posición ${index + 1} ya está ocupada por ${tabla[index]}`);
            return;
        }

        const nuevaTabla = [...tabla];
        nuevaTabla[index] = clave;
        setTabla(nuevaTabla);
        setClave("");
        setResultadoBusqueda(null);
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
    };

    // Buscar clave usando hash
    const buscarClave = () => {
        if (!clave) {
            alert("Por favor ingresa una clave para buscar.");
            return;
        }

        const index = hash(clave);
        if (tabla[index] === clave) {
            setResultadoBusqueda(`✅ La clave ${clave} se encontró en la posición ${index + 1}`);
        } else {
            setResultadoBusqueda(`❌ La clave ${clave} NO se encontró en la tabla (posición esperada: ${index + 1})`);
        }
    };

    const borrarClave = (index) => {
        const nuevaTabla = [...tabla];
        nuevaTabla[index] = null;
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
            <h3>🔑 Tabla Hash (módulo)</h3>

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
                <button onClick={agregarClave} className="boton">➕ Insertar</button>
                <button onClick={buscarClave} className="boton" style={{ marginLeft: "10px" }}>
                    🔍 Buscar
                </button>
            </div>

            {/* Ecuación hash */}
            <div style={{ margin: "10px 0" }}>
                <strong style={{ color: "#0066cc" }}>Función Hash (MOD):</strong>
                <span style={{
                    marginLeft: "8px",
                    fontFamily: "monospace",
                    color: "#cc0000",
                    fontWeight: "bold",
                    fontSize: 12
                }}>
                    h(k) = k mod {tamanoEstructura}
                </span>
            </div>


            {/* Resultado de búsqueda */}
            {resultadoBusqueda && (
                <div
                    style={{
                        marginTop: "12px",
                        padding: "10px 15px",
                        borderRadius: "8px",
                        backgroundColor: "#1e1e2f",
                        color: "#00ffcc",
                        fontWeight: "bold",
                        textAlign: "center",
                        boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                    }}
                >
                    🔍 {resultadoBusqueda}
                </div>
            )}

            {/* Tabla hash */}
            <table className="tabla-claves">
                <thead>
                    <tr>
                        <th>Índice</th>
                        <th>Clave</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {tabla.map((valor, i) => (
                        <tr key={i}>
                            <td>{i + 1}</td> {/* 👈 visualmente empieza en 1 */}
                            <td>{valor ?? <em>vacío</em>}</td>
                            <td>
                                {valor && (
                                    <button onClick={() => borrarClave(i)} className="boton">🗑 Borrar</button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

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

export default HashMod;
