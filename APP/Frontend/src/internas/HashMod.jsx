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
    const [metodoColision, setMetodoColision] = useState("lineal");
    const [ultimoInsertado, setUltimoInsertado] = useState(null);

    const ecuacionHash = `H(K) = (K mod n) + 1  →  n = ${tamanoEstructura}`;

    const hash = (key) => {
        const num = parseInt(key, 10);
        return isNaN(num) ? 0 : num % tamanoEstructura;
    };

    const resolverColision = (indexInicial) => {
        let i = 0;
        let index = indexInicial;

        if (["lineal", "cuadratica", "dobleHash"].includes(metodoColision)) {
            while (tabla[index] !== null) {
                i++;
                if (metodoColision === "lineal") index = (indexInicial + i) % tamanoEstructura;
                else if (metodoColision === "cuadratica") index = (indexInicial + i * i) % tamanoEstructura;
                else if (metodoColision === "dobleHash") {
                    const h2 = 1 + (indexInicial % (tamanoEstructura - 1));
                    index = (indexInicial + i * h2) % tamanoEstructura;
                }
                if (i >= tamanoEstructura) return -1;
            }
            return index;
        } else if (metodoColision === "encadenamiento" || metodoColision === "anidado") {
            if (!Array.isArray(tabla[indexInicial])) tabla[indexInicial] = [];
            return indexInicial;
        }
        return indexInicial;
    };

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

        if (tabla.some((v) => (Array.isArray(v) ? v.includes(clave) : v === clave))) {
            alert(`❌ La clave ${clave} ya existe en la tabla`);
            return;
        }

        const indexInicial = hash(clave);
        const index = resolverColision(indexInicial);
        if (index === -1) {
            alert("⚠️ La tabla está llena, no se pudo insertar");
            return;
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
        setUltimoInsertado(index);
        setTimeout(() => setUltimoInsertado(null), 1500);
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, metodoColision });
    };

    // 🔹 Nueva búsqueda animada con colisiones
    const buscarClave = async () => {
        if (!clave) {
            alert("Por favor ingresa una clave para buscar.");
            return;
        }

        const indexInicial = hash(clave);
        let index = indexInicial;
        let i = 0;
        let encontrado = false;
        const indicesRevisados = [];

        if (["lineal", "cuadratica", "dobleHash"].includes(metodoColision)) {
            while (i < tamanoEstructura) {
                indicesRevisados.push(index);
                if (tabla[index] === clave) {
                    encontrado = true;
                    break;
                }
                i++;
                if (metodoColision === "lineal") index = (indexInicial + i) % tamanoEstructura;
                else if (metodoColision === "cuadratica") index = (indexInicial + i * i) % tamanoEstructura;
                else if (metodoColision === "dobleHash") {
                    const h2 = 1 + (indexInicial % (tamanoEstructura - 1));
                    index = (indexInicial + i * h2) % tamanoEstructura;
                }
            }
        } else if (metodoColision === "encadenamiento" || metodoColision === "anidado") {
            indicesRevisados.push(index);
            if (Array.isArray(tabla[index]) ? tabla[index].includes(clave) : tabla[index] === clave) {
                encontrado = true;
            }
        }

        // Animación de búsqueda
        for (const idx of indicesRevisados) {
            setUltimoInsertado(idx);
            await new Promise((resolve) => setTimeout(resolve, 400));
        }
        setUltimoInsertado(null);

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
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, metodoColision });
    };

    const guardarArchivo = () => {
        const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
        if (!nombreArchivo) return;
        const data = { nombre: nombreArchivo, tamanoClave, rangoMin, rangoMax, tamanoEstructura, valores: tabla, metodoColision };
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
            <h3>🔑 Función Hash MOD</h3>

            {/* Ecuación de hash */}
            <div
                style={{
                    marginBottom: "15px",
                    fontWeight: "bold",
                    color: "#131212ff",
                    backgroundColor: "#e9d0e9ff",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    display: "inline-block"
                }}
            >
                {ecuacionHash}
            </div>

            {/* Configuración */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "15px" }}>
                <div>
                    <label>Método de Colisión:</label><br />
                    <select
                        value={metodoColision}
                        onChange={(e) => setMetodoColision(e.target.value)}
                        style={{ width: "180px", padding: "4px", borderRadius: "5px" }}
                    >
                        <option value="lineal">Prueba lineal</option>
                        <option value="cuadratica">Prueba cuadrática</option>
                        <option value="dobleHash">Doble hashing</option>
                        <option value="encadenamiento">Encadenamiento</option>
                        <option value="anidado">Arreglo anidado</option>
                    </select>
                </div>

                <div>
                    <label>Tamaño de la estructura:</label><br />
                    <input
                        type="number"
                        value={tamanoEstructura}
                        min="1"
                        onChange={(e) => {
                            const nuevo = parseInt(e.target.value);
                            setTamanoEstructura(nuevo);
                            setTabla(Array(nuevo).fill(null));
                        }}
                        style={{ width: "100px", padding: "4px", borderRadius: "5px" }}
                    />
                </div>

                <div>
                    <label>Tamaño de la clave:</label><br />
                    <input
                        type="number"
                        value={tamanoClave}
                        min="1"
                        onChange={(e) => setTamanoClave(parseInt(e.target.value))}
                        style={{ width: "100px", padding: "4px", borderRadius: "5px" }}
                    />
                </div>

                <div>
                    <label>Rango:</label><br />
                    <input
                        type="number"
                        value={rangoMin}
                        onChange={(e) => setRangoMin(parseInt(e.target.value))}
                        style={{ width: "70px", padding: "4px", borderRadius: "5px" }}
                    /> -
                    <input
                        type="number"
                        value={rangoMax}
                        onChange={(e) => setRangoMax(parseInt(e.target.value))}
                        style={{ width: "70px", padding: "4px", borderRadius: "5px", marginLeft: "4px" }}
                    />
                </div>
            </div>

            {/* Input de clave y botones */}
            <div style={{ marginBottom: "15px" }}>
                <input
                    type="text"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder={`Clave (${tamanoClave} dígitos)`}
                    maxLength={tamanoClave}
                    style={{ width: "150px", padding: "6px", marginRight: "10px", borderRadius: "5px" }}
                />
                <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
                <button onClick={buscarClave} className="boton" style={{ marginLeft: "10px" }}>🔍 Buscar</button>
            </div>

            {/* Resultado de búsqueda */}
            {resultadoBusqueda && <div className="resultado-busqueda">{resultadoBusqueda}</div>}

            {/* Contenedor de slots tipo tarjeta */}
            <div className="contenedor-slots">
                {tabla.map((valor, i) => {
                    const valores = Array.isArray(valor) ? valor : valor ? [valor] : [];
                    return (
                        <div key={i} className={`slot ${valor ? "ocupado" : "vacio"}`} style={{ borderColor: i === ultimoInsertado ? "#2ecc71" : "#ccc" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "2px 4px" }}>
                                <span className="indice">{i + 1}</span>
                                {valores.length > 0 && valores.map((v, idx) => (
                                    <button key={idx} className="boton_borrar" onClick={() => borrarClave(i, v)}>🗑</button>
                                ))}
                            </div>
                            <div style={{ marginTop: "4px", textAlign: "center", fontWeight: "bold" }}>
                                {valores.length > 0 ? valores.join(", ") : "__"}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Botones finales */}
            <div style={{ marginTop: "15px" }}>
                <button onClick={guardarArchivo} className="boton">💾 Guardar archivo</button>
                <label style={{ cursor: "pointer", marginLeft: "10px" }} className="boton">
                    📂 Cargar archivo
                    <input type="file" accept=".json" onChange={recuperarArchivo} style={{ display: "none" }} />
                </label>
                <button onClick={onBack} style={{ marginLeft: "10px" }} className="boton">⬅ Volver</button>
            </div>
        </div>
    );
}

export default HashMod;
