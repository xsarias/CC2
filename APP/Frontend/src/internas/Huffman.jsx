import { useState } from "react";

class NodoHuffman {
  constructor(letra = null, freq = 0) {
    this.letra = letra;     // null si es nodo interno
    this.freq = freq;       // frecuencia
    this.izq = null;
    this.der = null;
    this.x = 0;
    this.y = 0;
  }
}

// Combina dos nodos para generar uno nuevo
function combinarNodos(nodos) {
  if (nodos.length === 0) return null;
  let arr = [...nodos];
  const pasos = [];
  while (arr.length > 1) {
    arr.sort((a, b) => a.freq - b.freq);
    const a = arr.shift();
    const b = arr.shift();
    const nuevo = new NodoHuffman(null, a.freq + b.freq);
    nuevo.izq = a;
    nuevo.der = b;
    pasos.push(`F(${a.letra || "?"}+${b.letra || "?"})=${nuevo.freq}`);
    arr.push(nuevo);
  }
  return { raiz: arr[0], pasos };
}

// Calcula posiciones para dibujar
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

export default function Huffman({ onBack }) {
  const [letra, setLetra] = useState("");
  const [frecuencias, setFrecuencias] = useState({});
  const [raiz, setRaiz] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [pasos, setPasos] = useState([]);
  const [letraResaltada, setLetraResaltada] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const agregarLetra = () => {
    const l = letra.toUpperCase();
    if (!l.match(/[A-Z]/)) return setMensaje("❌ Solo letras A-Z");
    const nuevasFreq = { ...frecuencias, [l]: (frecuencias[l] || 0) + 1 };
    setFrecuencias(nuevasFreq);
    setLetra("");
    setMensaje(`✅ "${l}" agregada`);
    construirArbol(nuevasFreq);
  };

  const construirArbol = (freqs) => {
    const nodos = Object.entries(freqs).map(([letra, f]) => new NodoHuffman(letra, f));
    const { raiz, pasos } = combinarNodos(nodos);
    setRaiz(raiz);
    setPasos(pasos);
  };

  const eliminarLetra = () => {
    const l = letra.toUpperCase();
    if (!frecuencias[l]) return setMensaje(`❌ "${l}" no existe`);
    const nuevasFreq = { ...frecuencias };
    nuevasFreq[l] -= 1;
    if (nuevasFreq[l] === 0) delete nuevasFreq[l];
    setFrecuencias(nuevasFreq);
    setLetra("");
    setMensaje(`🗑 "${l}" eliminada`);
    construirArbol(nuevasFreq);
  };

  const nodos = calcularPosiciones(raiz);
  const lineas = dibujarLineas(raiz);

  // Guardar / cargar
  const guardarArchivo = () => {
    const nombre = prompt("Nombre del archivo:");
    if (!nombre) return;
    const data = { frecuencias };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cargarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || typeof data.frecuencias !== "object") return alert("Archivo inválido");
        setFrecuencias(data.frecuencias);
        construirArbol(data.frecuencias);
        setMensaje("📂 Archivo cargado correctamente");
      } catch { alert("JSON inválido"); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="arbol-digitales-container">
      <div className="sidebar">
        <h2>🌳 Huffman</h2>
        <input type="text" maxLength={1} value={letra} onChange={e => setLetra(e.target.value.toUpperCase())}/>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
          <button onClick={agregarLetra} disabled={buscando}>➕ Añadir</button>
          <button onClick={eliminarLetra} disabled={buscando}>🗑 Eliminar</button>
        </div>
        {mensaje && <p className="mensaje-alerta">{mensaje}</p>}

        <table>
          <thead><tr><th>Letra</th><th>Freq</th></tr></thead>
          <tbody>{Object.entries(frecuencias).map(([l,f],i)=><tr key={i}><td>{l}</td><td>{f}</td></tr>)}</tbody>
        </table>

        {/* Guardar / cargar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
          <button onClick={guardarArchivo}>💾 Guardar archivo</button>
          <label style={{ cursor: "pointer" }}>
            📂 Cargar archivo
            <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }}/>
          </label>
        </div>

        {/* Mostrar pasos del árbol */}
        {pasos.length > 0 && <div style={{ marginTop: "10px" }}>
          <h4>📐 Ecuación del árbol</h4>
          <ul>
            {pasos.map((p,i)=><li key={i}>{p}</li>)}
          </ul>
        </div>}

        <button onClick={onBack} className="volver">⬅ Volver</button>
      </div>

      <div className="arbol-grafico" style={{ overflow: "auto" }}>
        <svg width="2000" height="1000">
          {lineas.map((l,i)=><g key={i}>
            <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#555" strokeWidth="2"/>
            <text x={(l.x1+l.x2)/2} y={(l.y1+l.y2)/2-5} textAnchor="middle" fontSize="12">{l.label}</text>
          </g>)}
          {nodos.map((n,i)=><g key={i}>
            <circle cx={n.x} cy={n.y} r="18"
              fill={n.letra? "#ffcb6b":"#eee"}
              stroke="#aaa" strokeWidth="2"/>
            {n.letra && <text x={n.x} y={n.y+5} textAnchor="middle" fontWeight="bold">{n.letra}</text>}
            {!n.letra && <text x={n.x} y={n.y+5} textAnchor="middle" fontSize="12">{n.freq}</text>}
          </g>)}
        </svg>
      </div>
    </div>
  );
}
