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

    const ecuacionHash = `H(K) = dig_cent (K²) +1  →  n = ${tamanoEstructura}`;

    const hash = (key) => {
        const num = parseInt(key, 10);
        if (isNaN(num)) return 0;
        const cuadrado = num * num;
        const str = cuadrado.toString();
        const mitad = Math.floor(str.length / 2);
        const extraido = parseInt(str.substring(mitad - 1, mitad + 1), 10) || cuadrado;
        return extraido % tamanoEstructura;
    };

    const existeClave = (key) => {
        return tabla.some(slot => {
            if (Array.isArray(slot)) return slot.includes(key);
            if (slot && slot.tipo === "encadenamiento") return slot.valores.includes(key);
            return slot === key;
        });
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
        if (existeClave(clave)) {
            alert(`❌ La clave ${clave} ya existe en la tabla.`);
            return;
        }

        const ocupados = tabla.filter(slot => slot !== null && slot !== undefined && !(Array.isArray(slot) && slot.length === 0)).length;
        if (ocupados >= tamanoEstructura) {
            alert(`❌ La tabla ya está llena (${tamanoEstructura} posiciones).`);
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
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, metodoColision });
    };

    const buscarClave = async () => {
        if (!clave) {
            alert("Por favor ingresa una clave para buscar.");
            return;
        }

        let indexInicial = hash(clave);
        let index = indexInicial;
        let i = 0;
        let encontrado = false;
        const indicesRevisados = [];

        if (["lineal", "cuadratica", "doble-hash"].includes(metodoColision)) {
            while (i < tamanoEstructura) {
                indicesRevisados.push(index);
                if (tabla[index] === clave) {
                    encontrado = true;
                    break;
                }
                i++;
                if (metodoColision === "lineal") index = (indexInicial + i) % tamanoEstructura;
                else if (metodoColision === "cuadratica") index = (indexInicial + i * i) % tamanoEstructura;
                else if (metodoColision === "doble-hash") {
                    const step = 7 - (parseInt(clave, 10) % 7);
                    index = (indexInicial + i * step) % tamanoEstructura;
                }
            }
        } else if (metodoColision === "arreglo-anidado" || metodoColision === "encadenamiento") {
            indicesRevisados.push(index);
            if (Array.isArray(tabla[index]) ? tabla[index].includes(clave)
                : tabla[index]?.tipo === "encadenamiento" ? tabla[index].valores.includes(clave)
                : tabla[index] === clave) {
                encontrado = true;
            }
        }

        for (const idx of indicesRevisados) {
            setUltimoInsertado(idx);
            await new Promise(res => setTimeout(res, 400));
        }
        setUltimoInsertado(null);

        setResultadoBusqueda(
            encontrado
                ? `✅ La clave ${clave} está en la posición ${indexInicial + 1}`
                : `❌ La clave ${clave} NO está en la tabla (posición esperada: ${indexInicial + 1})`
        );
    };

    const borrarClave = (index, valor = null) => {
        const nuevaTabla = [...tabla];
        if (valor && Array.isArray(nuevaTabla[index])) {
            nuevaTabla[index] = nuevaTabla[index].filter(v => v !== valor);
            if (nuevaTabla[index].length === 0) nuevaTabla[index] = null;
        } else if (valor && nuevaTabla[index]?.tipo === "encadenamiento") {
            nuevaTabla[index].valores = nuevaTabla[index].valores.filter(v => v !== valor);
            if (nuevaTabla[index].valores.length === 0) nuevaTabla[index] = null;
        } else {
            nuevaTabla[index] = null;
        }
        setTabla(nuevaTabla);
        onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, metodoColision });
    };

    const guardarArchivo = () => {
        if (!tabla || tabla.length === 0) {
            alert("La tabla está vacía, no hay nada que guardar.");
            return;
        }

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
                onDataChange?.(data.valores, {
                    tamanoClave: Number(data.tamanoClave) || 2,
                    rangoMin: Number(data.rangoMin) || 0,
                    rangoMax: Number(data.rangoMax) || 99,
                    tamanoEstructura: Number(data.tamanoEstructura) || data.valores.length,
                    metodoColision: data.metodoColision || "lineal",
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
            <h3>🔑 Función Cuadrado</h3>

            {/* Ecuación */}
            <div style={{
                marginBottom: "15px",
                fontWeight: "bold",
                color: "#131212ff",
                backgroundColor: "#e9d0e9ff",
                padding: "8px 12px",
                borderRadius: "8px",
                display: "inline-block"
            }}>
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
                        <option value="lineal">Prueba Lineal</option>
                        <option value="cuadratica">Prueba Cuadrática</option>
                        <option value="doble-hash">Doble Hash</option>
                        <option value="arreglo-anidado">Arreglo Anidado</option>
                        <option value="encadenamiento">Encadenamiento</option>
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

            {/* Input clave */}
            <div style={{ marginBottom: "10px" }}>
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

            {/* Resultado búsqueda */}
            {resultadoBusqueda && <div className="resultado-busqueda">{resultadoBusqueda}</div>}

            {/* Contenedor de slots */}
            <div className="contenedor-slots">
                {tabla.map((valor, i) => {
                    const valores = valor?.tipo === "encadenamiento" ? valor.valores : Array.isArray(valor) ? valor : valor ? [valor] : [];
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

            {/* Guardar / Cargar */}
            <div style={{ marginTop: "10px" }}>
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

export default HashCuadrado;
