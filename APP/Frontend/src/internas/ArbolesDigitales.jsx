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
    constructor(letra) {
        this.letra = letra;
        this.izq = null;
        this.der = null;
        this.x = 0;
        this.y = 0;
    }
}

function insertarNodo(raiz, letra, codigo, i = 0) {
    if (!raiz) return new Nodo(letra);
    if (i >= codigo.length) return raiz;
    if (codigo[i] === "0") raiz.izq = insertarNodo(raiz.izq, letra, codigo, i + 1);
    else raiz.der = insertarNodo(raiz.der, letra, codigo, i + 1);
    return raiz;
}

function calcularPosiciones(nodo, depth = 0, x = 500, offset = 200) {
    if (!nodo) return [];
    nodo.y = depth * 80 + 40;
    nodo.x = x;
    const posiciones = [nodo];
    if (nodo.izq) posiciones.push(...calcularPosiciones(nodo.izq, depth + 1, x - offset, offset / 2));
    if (nodo.der) posiciones.push(...calcularPosiciones(nodo.der, depth + 1, x + offset, offset / 2));
    return posiciones;
}

function ArbolesDigitales({ onBack }) {
    const [clave, setClave] = useState("");
    const [claves, setClaves] = useState([]);
    const [raiz, setRaiz] = useState(null);
    const [mensaje, setMensaje] = useState("");
    const [letraResaltada, setLetraResaltada] = useState(null);
    const [buscando, setBuscando] = useState(false);

    const construirArbol = (arrayClaves) => {
        let r = null;
        arrayClaves.forEach(letra => {
            const codigo = ALFABETO_AMER[letra];
            if (codigo) r = insertarNodo(r, letra, codigo);
        });
        setRaiz(r);
        setLetraResaltada(null);
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
        if (!ALFABETO_AMER[letra]) {
            setMensaje(`❌ "${letra}" no está en el alfabeto AMER`);
            return;
        }
        if (!raiz) {
            setMensaje("⚠ Inserta al menos una clave primero");
            return;
        }
        setBuscando(true);
        setMensaje(`🔍 Buscando "${letra}"...`);
        setLetraResaltada(null);

        const nodos = calcularPosiciones(raiz);
        for (let n of nodos) {
            setLetraResaltada(n.letra);
            await new Promise(res => setTimeout(res, 400));
            if (n.letra === letra) {
                setMensaje(`✅ "${letra}" encontrada`);
                setBuscando(false);
                return;
            }
        }

        setMensaje(`❌ "${letra}" no se encuentra`);
        setLetraResaltada(null);
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
        <div className="arbol-digitales-container">
            <div className="sidebar">
                <h2>🌳 Árboles Digitales (Claves)</h2>

                <input
                    type="text"
                    maxLength={1}
                    value={clave}
                    onChange={e => setClave(e.target.value.toUpperCase())}
                />

                {/* Botones en columna solo con iconos */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
                    <button onClick={agregarClave} className="construir_arbols" disabled={buscando}>➕ Añadir</button>
                    <button onClick={buscarEnArbol} className="construir_arbols" disabled={buscando}>🔎 Buscar</button>
                    <button onClick={eliminarClave} className="construir_arbols" disabled={buscando}>🗑️ Eliminar</button>
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

                <button onClick={onBack} className="volver">⬅ Volver</button>
            </div>

            <div className="arbol-grafico">
                <svg width="1000" height="500">
                    {/* Líneas con etiquetas 0 y 1 */}
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
                            <circle
                                cx={n.x} cy={n.y} r="20"
                                fill={n.letra === letraResaltada ? "#ff6666" : "#ffcb6b"}
                                stroke={n.letra === letraResaltada ? "#c0392b" : "#e67e22"}
                                strokeWidth="2"
                            />
                            <text x={n.x} y={n.y + 5} textAnchor="middle" fontWeight="bold">{n.letra}</text>
                        </g>
                    ))}
                </svg>
            </div>
        </div>
    );
}

export default ArbolesDigitales;
