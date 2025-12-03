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
    constructor(letra = null) {
        this.letra = letra;
        this.izq = null;
        this.der = null;
        this.x = 0;
        this.y = 0;
    }
}

function insertarPorResiduo(nodo, letra, codigo, i = 0) {
    if (!nodo) nodo = new Nodo();

    // Caso 1: el nodo está vacío y no tiene hijos
    if (!nodo.letra && !nodo.izq && !nodo.der) {
        nodo.letra = letra;
        return nodo;
    }

    // Caso 2: el nodo es hoja con una letra -> colisión
    if (nodo.letra) {
        const letraExistente = nodo.letra;
        nodo.letra = null; // convertir en nodo interno

        // Creamos ramas para la letra existente
        const codigoExistente = ALFABETO_AMER[letraExistente];
        const bitExistente = codigoExistente[i];
        const ramaExistente = bitExistente === "0" ? "izq" : "der";
        nodo[ramaExistente] = insertarPorResiduo(
            nodo[ramaExistente],
            letraExistente,
            codigoExistente,
            i + 1
        );
    }

    // Caso 3: seguimos insertando la nueva letra según el bit actual
    const bit = codigo[i];
    const ramaNueva = bit === "0" ? "izq" : "der";
    nodo[ramaNueva] = insertarPorResiduo(nodo[ramaNueva], letra, codigo, i + 1);

    return nodo;
}

function calcularPosiciones(nodo, depth = 0, x = 500, offset = 200) {
    if (!nodo) return [];

    nodo.y = depth * 90 + 40; // más separación vertical
    nodo.x = x;

    const posiciones = [nodo];

    // 👇 Le ponemos un límite mínimo para que no se junten tanto
    const nuevoOffset = Math.max(offset / 1.4, 60); // antes era offset/2

    if (nodo.izq)
        posiciones.push(...calcularPosiciones(nodo.izq, depth + 1, x - nuevoOffset, nuevoOffset));
    if (nodo.der)
        posiciones.push(...calcularPosiciones(nodo.der, depth + 1, x + nuevoOffset, nuevoOffset));

    return posiciones;
}


function PorResiduo({ onBack }) {
    const [clave, setClave] = useState("");
    const [claves, setClaves] = useState([]);
    const [raiz, setRaiz] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [nodoResaltado, setNodoResaltado] = useState(null);
    const [buscando, setBuscando] = useState(false);

    // 🔹 Construye el árbol con base en las claves actuales
    const construirArbol = (arrayClaves) => {
        let r = null;
        arrayClaves.forEach(letra => {
            const codigo = ALFABETO_AMER[letra];
            if (codigo) r = insertarPorResiduo(r, letra, codigo);
        });
        setRaiz(r);
        setNodoResaltado(null);
    };

    // 🔹 Guardar árbol en localStorage
    const guardarArbol = () => {
        if (claves.length === 0) {
            setMensaje("⚠ No hay claves para guardar");
            return;
        }
        localStorage.setItem("arbolResiduo", JSON.stringify(claves));
        setMensaje("💾 Árbol guardado correctamente");
    };

    // 🔹 Cargar árbol desde localStorage
    const cargarArbol = () => {
        const datos = localStorage.getItem("arbolResiduo");
        if (!datos) {
            setMensaje("⚠ No hay árbol guardado");
            return;
        }
        const arrayClaves = JSON.parse(datos);
        setClaves(arrayClaves);
        construirArbol(arrayClaves);
        setMensaje("📂 Árbol cargado correctamente");
    };

    const agregarClave = () => {
        const letra = clave.toUpperCase();
        if (!ALFABETO_AMER[letra]) {
            setMensaje(`❌ "${letra}" no está en el alfabeto AMER`);
            return;
        }
        if (claves.includes(letra)) {
            setMensaje(`⚠ "${letra}" ya existe`);
            return;
        }
        const nuevasClaves = [...claves, letra];
        setClaves(nuevasClaves);
        setClave("");
        setMensaje(`✅ "${letra}" agregada`);
        construirArbol(nuevasClaves);
    };

    const eliminarClave = () => {
        const letra = clave.toUpperCase();
        if (!claves.includes(letra)) {
            setMensaje(`❌ "${letra}" no está en el árbol`);
            return;
        }
        const nuevasClaves = claves.filter(l => l !== letra);
        setClaves(nuevasClaves);
        setClave("");
        setMensaje(`🗑 "${letra}" eliminada`);
        construirArbol(nuevasClaves);
    };

    const buscarEnArbol = async () => {
        const letra = clave.toUpperCase();
        const codigo = ALFABETO_AMER[letra];

        if (!codigo) {
            setMensaje(`❌ "${letra}" no está en el alfabeto AMER`);
            return;
        }
        if (!raiz) {
            setMensaje("⚠ Inserta al menos una clave primero");
            return;
        }

        setBuscando(true);
        setMensaje(`🔍 Buscando "${letra}"...`);
        setNodoResaltado(null);

        let nodo = raiz;
        for (let i = 0; i < codigo.length; i++) {
            setNodoResaltado(nodo);
            await new Promise(res => setTimeout(res, 500));

            const bit = codigo[i];
            nodo = bit === "0" ? nodo.izq : nodo.der;

            if (!nodo) {
                setMensaje(`❌ "${letra}" no se encuentra`);
                setNodoResaltado(null);
                setBuscando(false);
                return;
            }
        }

        setNodoResaltado(nodo);
        if (nodo.letra === letra) {
            setMensaje(`✅ "${letra}" encontrada`);
        } else {
            setMensaje(`❌ "${letra}" no se encuentra`);
            setNodoResaltado(null);
        }
        setBuscando(false);
    };

    const dibujarLineas = (nodo, parent = null, label = "") => {
        if (!nodo) return [];
        const lineas = [];
        if (parent) {
            lineas.push({
                x1: parent.x,
                y1: parent.y,
                x2: nodo.x,
                y2: nodo.y,
                label
            });
        }
        if (nodo.izq) lineas.push(...dibujarLineas(nodo.izq, nodo, "0"));
        if (nodo.der) lineas.push(...dibujarLineas(nodo.der, nodo, "1"));
        return lineas;
    };

    const nodos = raiz ? calcularPosiciones(raiz) : [];
    const lineas = raiz ? dibujarLineas(raiz) : [];

    return (
        <>
            <div className="arbol-digitales-container">
                <div className="sidebar">
                    <h2>Árbol por Residuo</h2>

                    <label htmlFor="claveInput" style={{ marginBottom: "5px", fontWeight: "bold" }}>
                        Digite una clave:
                    </label>
                    <input
                        id="claveInput"
                        type="text"
                        maxLength={1}
                        value={clave}
                        onChange={e => setClave(e.target.value.toUpperCase())}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px", color: "#283b42" }}>
                        <button onClick={agregarClave}  className="boton" disabled={buscando}>➕ Insertar</button>
                        <button onClick={buscarEnArbol} className="boton" disabled={buscando}>🔎 Buscar</button>
                        <button onClick={eliminarClave} className="boton" disabled={buscando}>✖️ Eliminar</button>
                    </div>

                    {mensaje && <p className="mensaje-alerta">{mensaje}</p>}

                    <table>
                        <thead><tr><th>Clave</th><th>Código</th></tr></thead>
                        <tbody>
                            {claves.map((l, i) => (
                                <tr key={i}><td>{l}</td><td>{ALFABETO_AMER[l]}</td></tr>
                            ))}
                        </tbody>
                    </table>


                </div>

                <div className="arbol-grafico">
                    <svg width="2000" height="700">
                        {lineas.map((l, i) => (
                            <g key={i}>
                                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#555" strokeWidth="2" />
                                <text
                                    x={(l.x1 + l.x2) / 2}
                                    y={(l.y1 + l.y2) / 2 - 5}
                                    textAnchor="middle"
                                    fontSize="12"
                                    fill="#333"
                                >
                                    {l.label}
                                </text>
                            </g>
                        ))}
                        {nodos.map((n, i) => (
                            <g key={i}>
                                {n.letra
                                    ? (
                                        <rect
                                            x={n.x - 20}
                                            y={n.y - 20}
                                            width="40"
                                            height="40"
                                            fill={n === nodoResaltado ? "#ff6666" : "#6bb8ff"}
                                            stroke={n === nodoResaltado ? "#c0392b" : "#2980b9"}
                                            strokeWidth="2"
                                            rx="5"
                                        />
                                    )
                                    : (
                                        <circle
                                            cx={n.x} cy={n.y} r="20"
                                            fill={n === nodoResaltado ? "#ff9999" : "#ffcb6b"}
                                            stroke={n === nodoResaltado ? "#c0392b" : "#e67e22"}
                                            strokeWidth="2"
                                        />
                                    )
                                }
                                {n.letra && (
                                    <text x={n.x} y={n.y + 5} textAnchor="middle" fontWeight="bold">{n.letra}</text>
                                )}
                            </g>
                        ))}
                    </svg>
                </div>
            </div>
            {/* Botones debajo del árbol */}
            <section className="botones-accion">
                <button
                    onClick={() => {
                        const div = document.querySelector(".arbol-grafico");
                        if (div.requestFullscreen) div.requestFullscreen();
                    }}
                    className="boton"
                >
                    ⛶ Expandir
                </button>

                <button onClick={guardarArbol} className="boton">💾 Guardar</button>
                <button onClick={cargarArbol} className="boton">📂 Cargar</button>
                <button onClick={onBack} className="boton">⬅ Volver</button>
            </section>

        </>
    );
}

export default PorResiduo;
