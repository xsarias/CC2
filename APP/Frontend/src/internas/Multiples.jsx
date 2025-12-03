import { useState } from "react";
import "./ArbolesDigitales.css";

const ALFABETO_AMER = {
    A: "00001", B: "00010", C: "00011", D: "00100", E: "00101",
    F: "00110", G: "00111", H: "01000", I: "01001", J: "01010",
    K: "01011", L: "01100", M: "01101", N: "01110", O: "01111",
    P: "10000", Q: "10001", R: "10010", S: "10011", T: "10100",
    U: "10101", V: "10110", W: "10111", X: "11000", Y: "11001", Z: "11010"
};

class Nodo {
    constructor(codigo = "") {
        this.codigo = codigo;
        this.letra = null;
        this.izq = null;
        this.der = null;
        this.x = 0;
        this.y = 0;
    }
}

function insertarLetraDinamico(raiz, letra, codigo, i = 0) {
    if (!raiz) raiz = new Nodo(codigo.slice(0, i));
    if (i === codigo.length) {
        raiz.letra = letra;
        return raiz;
    }
    if (codigo[i] === "0") raiz.izq = insertarLetraDinamico(raiz.izq, letra, codigo, i + 1);
    else raiz.der = insertarLetraDinamico(raiz.der, letra, codigo, i + 1);
    return raiz;
}

function eliminarLetra(raiz, letra, codigo, i = 0) {
    if (!raiz) return null;
    if (i === codigo.length) {
        if (raiz.letra === letra) raiz.letra = null;
        return raiz;
    }
    if (codigo[i] === "0") raiz.izq = eliminarLetra(raiz.izq, letra, codigo, i + 1);
    else raiz.der = eliminarLetra(raiz.der, letra, codigo, i + 1);
    return raiz;
}

function calcularPosiciones(nodo, depth = 0, x = 1000, offset = 500) {
    if (!nodo) return [];
    nodo.y = depth * 120 + 50;
    nodo.x = x;
    const posiciones = [nodo];
    if (nodo.izq) posiciones.push(...calcularPosiciones(nodo.izq, depth + 1, x - offset, offset / 2));
    if (nodo.der) posiciones.push(...calcularPosiciones(nodo.der, depth + 1, x + offset, offset / 2));
    return posiciones;
}

function dibujarLineas(nodo, parent = null, label = "") {
    if (!nodo) return [];
    const lineas = [];
    if (parent) lineas.push({ x1: parent.x, y1: parent.y, x2: nodo.x, y2: nodo.y, label });
    if (nodo.izq) lineas.push(...dibujarLineas(nodo.izq, nodo, "0"));
    if (nodo.der) lineas.push(...dibujarLineas(nodo.der, nodo, "1"));
    return lineas;
}

export default function Multiples({ onBack }) {
    const [clave, setClave] = useState("");
    const [letras, setLetras] = useState([]);
    const [raiz, setRaiz] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [nodoResaltado, setNodoResaltado] = useState(null);

    const [buscando, setBuscando] = useState(false);

    const agregarLetra = () => {
        const letra = clave.toUpperCase();
        if (!ALFABETO_AMER[letra]) return setMensaje(`❌ "${letra}" no está en el alfabeto AMER`);
        if (letras.includes(letra)) return setMensaje(`⚠ "${letra}" ya existe`);
        const nuevoArbol = insertarLetraDinamico(raiz, letra, ALFABETO_AMER[letra]);
        setRaiz(nuevoArbol);
        setLetras([...letras, letra]);
        setClave("");
        setMensaje(`✅ "${letra}" agregada`);
    };

    const eliminarLetraClick = () => {
        const letra = clave.toUpperCase();
        if (!letras.includes(letra)) return setMensaje(`❌ "${letra}" no está en el árbol`);
        const nuevoArbol = eliminarLetra(raiz, letra, ALFABETO_AMER[letra]);
        setRaiz(nuevoArbol);
        setLetras(letras.filter(l => l !== letra));
        setClave("");
        setMensaje(`🗑 "${letra}" eliminada`);
    };

    const buscarLetra = async () => {
        const letra = clave.toUpperCase();
        const codigo = ALFABETO_AMER[letra];

        if (!codigo) return setMensaje(`❌ "${letra}" no está en el alfabeto AMER`);
        if (!raiz) return setMensaje("⚠ Inserta al menos una letra primero");

        setBuscando(true);
        setMensaje(`🔍 Buscando "${letra}" por el camino: ${codigo}`);
        setNodoResaltado(null);

        let nodo = raiz;

        for (let i = 0; i < codigo.length; i++) {

            // Resaltar nodo actual
            setNodoResaltado(nodo);
            await new Promise(res => setTimeout(res, 600)); // velocidad visible

            // Avanzar al siguiente nodo
            if (codigo[i] === "0") nodo = nodo.izq;
            else nodo = nodo.der;

            if (!nodo) {
                setMensaje(`❌ Camino roto. No existe el nodo para "${letra}"`);
                setBuscando(false);
                return;
            }
        }

        // Resaltar nodo final
        setNodoResaltado(nodo);
        await new Promise(res => setTimeout(res, 600));

        if (nodo.letra === letra) {
            setMensaje(`✅ "${letra}" encontrada correctamente 🎯`);
        } else {
            setMensaje(`⚠ Llegamos, pero la letra no coincide. Árbol incompleto`);
        }

        setBuscando(false);
    };


    // 💾 Guardar en archivo JSON
    const guardarArchivo = () => {
        const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
        if (!nombreArchivo) return;
        const data = { letras };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${nombreArchivo}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    // 📂 Cargar archivo JSON
    const cargarArchivo = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (!data || !Array.isArray(data.letras)) {
                    alert("Archivo inválido: debe tener un array 'letras'");
                    return;
                }
                let nuevoArbol = null;
                data.letras.forEach(l => {
                    nuevoArbol = insertarLetraDinamico(nuevoArbol, l, ALFABETO_AMER[l]);
                });
                setLetras(data.letras);
                setRaiz(nuevoArbol);
                setMensaje("📂 Archivo cargado correctamente");
            } catch {
                alert("Error: JSON inválido");
            }
        };
        reader.readAsText(file);
    };

    const nodos = calcularPosiciones(raiz);
    const lineas = dibujarLineas(raiz);

    // Escalado dinámico para que no se vea gigante
    const xMin = Math.min(...nodos.map(n => n.x), 0);
    const xMax = Math.max(...nodos.map(n => n.x), 1000);
    const yMin = Math.min(...nodos.map(n => n.y), 0);
    const yMax = Math.max(...nodos.map(n => n.y), 1000);
    const scaleX = 1800 / (xMax - xMin + 100);
    const scaleY = 900 / (yMax - yMin + 100);
    const scale = Math.min(scaleX, scaleY);
    const offsetX = -xMin + 50;
    const offsetY = -yMin + 50;

    return (
        <>
            <div className="arbol-digitales-container">
                <div className="sidebar">
                    <h2>Búsqueda Múltiple</h2>
                    <label htmlFor="claveInput" style={{ marginBottom: "5px", fontWeight: "bold" }}>
                        Digite una clave:
                    </label>
                    <input type="text" maxLength={1} value={clave} onChange={e => setClave(e.target.value.toUpperCase())} />

                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
                        <button onClick={agregarLetra} className="boton" disabled={buscando}>➕ Insertar</button>
                        <button onClick={buscarLetra}  className="boton" disabled={buscando}>🔎 Buscar</button>
                        <button onClick={eliminarLetraClick} className="boton" disabled={buscando}>✖️ Eliminar</button>
                    </div>

                    {mensaje && <p className="mensaje-alerta">{mensaje}</p>}

                    <table>
                        <thead><tr><th>Claves</th><th>Código</th></tr></thead>
                        <tbody>{letras.map((l, i) => <tr key={i}><td>{l}</td><td>{ALFABETO_AMER[l]}</td></tr>)}</tbody>
                    </table>




                </div>

                <div className="arbol-grafico" style={{ overflow: "auto", height: "700px" }}>
                    <svg width={2000} height={1000}>
                        <g transform={`translate(${offsetX},${offsetY}) scale(${scale})`}>
                            {lineas.map((l, i) => <g key={i}>
                                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#555" strokeWidth="2" />
                                <text x={(l.x1 + l.x2) / 2} y={(l.y1 + l.y2) / 2 - 5} textAnchor="middle" fontSize="12" fill="#333">{l.label}</text>
                            </g>)}
                            {nodos.map((n, i) => <g key={i}>
                                <circle cx={n.x} cy={n.y} r="15"
                                    fill={n === nodoResaltado ? "#ff6666" : n.letra ? "#ffcb6b" : "#eee"}
                                    stroke={n === nodoResaltado ? "#c0392b" : "#aaa"}
                                />
                                {n.letra && <text x={n.x} y={n.y + 5} textAnchor="middle" fontWeight="bold">{n.letra}</text>}
                            </g>)}
                        </g>
                    </svg>
                </div>
            </div>
            {/* Botones fuera del árbol */}
            <section className="botones-accion">
                <button
                    onClick={() => {
                        const div = document.querySelector(".arbol-grafico");
                        if (div.requestFullscreen) div.requestFullscreen();
                        else if (div.webkitRequestFullscreen) div.webkitRequestFullscreen(); // Safari
                    }}
                    className="boton"
                >
                    ⛶ Expandir
                </button>

            
                    <button onClick={guardarArchivo} className="boton">💾 Guardar archivo</button>
                    <label className="boton" style={{ cursor: "pointer" }}>
                        📂 Cargar archivo
                        <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
                    </label>
                    <button onClick={onBack} className="boton">⬅ Volver</button>
                
            </section>
        </>
    );
}
