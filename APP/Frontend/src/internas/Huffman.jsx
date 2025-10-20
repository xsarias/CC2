import { useState } from "react";

class NodoHuffman {
  constructor(letra, freq) {
    this.letra = letra;
    this.freq = freq;
    this.izq = null;
    this.der = null;
    this.x = 0;
    this.y = 0;
  }
}

// Construye el árbol de Huffman
function construirArbol(freqs) {
  let id = 0;
  // Crear nodos y ordenar alfabéticamente
  let nodos = Object.entries(freqs)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letra, f]) => ({ nodo: new NodoHuffman(letra, f), id: id++ }));

  // Combinar nodos hasta tener uno solo
  while (nodos.length > 1) {
    // Ordenar por frecuencia y luego por ID
    nodos.sort((a, b) => {
      if (a.nodo.freq !== b.nodo.freq) return a.nodo.freq - b.nodo.freq;
      return a.id - b.id;
    });

    const a = nodos.shift();
    const b = nodos.shift();

    const nuevo = new NodoHuffman(null, a.nodo.freq + b.nodo.freq);
    nuevo.izq = a.nodo;
    nuevo.der = b.nodo;

    nodos.push({ nodo: nuevo, id: id++ });
  }

  return nodos[0].nodo;
}




// Calcula posiciones (x, y) para cada nodo
function calcularPosiciones(nodo, depth = 0, x = 600, offset = 300) {
  if (!nodo) return [];
  nodo.y = depth * 120 + 50;
  nodo.x = x;
  const posiciones = [nodo];
  if (nodo.izq)
    posiciones.push(...calcularPosiciones(nodo.izq, depth + 1, x - offset, offset / 2));
  if (nodo.der)
    posiciones.push(...calcularPosiciones(nodo.der, depth + 1, x + offset, offset / 2));
  return posiciones;
}

// Dibuja líneas entre nodos
function dibujarLineas(nodo, parent = null, label = "") {
  if (!nodo) return [];
  const lineas = [];
  if (parent)
    lineas.push({ x1: parent.x, y1: parent.y, x2: nodo.x, y2: nodo.y, label });
  if (nodo.izq) lineas.push(...dibujarLineas(nodo.izq, nodo, "0"));
  if (nodo.der) lineas.push(...dibujarLineas(nodo.der, nodo, "1"));
  return lineas;
}

// Ecuación lineal (paréntesis y letras)
function ecuacionLineal(nodo) {
  if (!nodo) return "";
  if (!nodo.izq && !nodo.der) return nodo.letra;
  return `(${ecuacionLineal(nodo.izq)} + ${ecuacionLineal(nodo.der)})`;
}

export default function Huffman({ onBack }) {
  const [texto, setTexto] = useState("");
  const [frecuencias, setFrecuencias] = useState({});
  const [raiz, setRaiz] = useState(null);
  const [ecuacion, setEcuacion] = useState("");
  const [mensaje, setMensaje] = useState("");

  // Generar árbol a partir de una palabra
  const generarArbol = () => {
    if (!texto.trim()) {
      setMensaje("⚠️ Ingresa una palabra para generar el árbol.");
      return;
    }

    const total = texto.length;
    const freqs = {};
    for (let l of texto.toUpperCase()) {
      if (/[A-Z]/.test(l)) freqs[l] = (freqs[l] || 0) + 1 / total;
    }

    const raizNueva = construirArbol(freqs);
    setFrecuencias(freqs);
    setRaiz(raizNueva);
    setEcuacion(ecuacionLineal(raizNueva));
    setMensaje("✅ Árbol generado correctamente.");
  };

  // Guardar JSON
  const guardarArchivo = () => {
    const nombre = prompt("💾 Nombre del archivo:");
    if (!nombre) return;
    const data = { texto, frecuencias };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Cargar JSON
  const cargarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data || typeof data.frecuencias !== "object") {
          alert("❌ Archivo inválido.");
          return;
        }
        setTexto(data.texto || "");
        setFrecuencias(data.frecuencias);
        const r = construirArbol(data.frecuencias);
        setRaiz(r);
        setEcuacion(ecuacionLineal(r));
        setMensaje("📂 Archivo cargado correctamente.");
      } catch {
        alert("❌ Error al leer el archivo.");
      }
    };
    reader.readAsText(file);
  };

  const nodos = raiz ? calcularPosiciones(raiz) : [];
  const lineas = raiz ? dibujarLineas(raiz) : [];

  return (
    <div className="arbol-digitales-container">
      <div className="sidebar">
        <h2>🌳 Árbol de Huffman</h2>
        <p>Inserte una palabra</p>

        <input
          type="text"
          value={texto}
          onChange={(e) => setTexto(e.target.value.toUpperCase())}
          placeholder="Ejemplo: MURCIELAGO"
          maxLength={30}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
          <button onClick={generarArbol}>⚙️ Generar árbol</button>
          <button onClick={guardarArchivo}>💾 Guardar archivo</button>
          <label style={{ cursor: "pointer" }}>
            📂 Cargar archivo
            <input
              type="file"
              accept=".json"
              onChange={cargarArchivo}
              style={{ display: "none" }}
            />
          </label>
        </div>

        {mensaje && <p className="mensaje-alerta">{mensaje}</p>}
        {/* Ecuación lineal */}
        {ecuacion && (
          <div style={{ marginTop: "15px", textAlign: "center" }}>
            <h4>🧮 Ecuación del árbol:</h4>
            <p
              style={{
                fontFamily: "monospace",
                fontSize: "16px",
                background: "#1a411aff",
                display: "inline-block",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
            >
              {ecuacion}
            </p>
          </div>
        )}
        {/* Tabla de frecuencias */}
        {Object.keys(frecuencias).length > 0 && (
          <>
            <h4>📊 Frecuencias</h4>
            <table>
              <thead>
                <tr>
                  <th>Letra</th>
                  <th>Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(frecuencias).map(([l, f], i) => (
                  <tr key={i}>
                    <td>{l}</td>
                    <td>{f.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <button onClick={onBack} className="volver">⬅ Volver</button>
      </div>

      {/* Contenedor del árbol */}
      <div className="arbol-grafico" style={{ overflow: "auto", background: "#fafafa" }}>
        <svg width="2000" height="900">
          {/* Líneas */}
          {lineas.map((l, i) => (
            <g key={i}>
              <line
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="#777"
                strokeWidth="2"
              />
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

          {/* Nodos */}
          {nodos.map((n, i) => (
            <g key={i}>
              <circle
                cx={n.x}
                cy={n.y}
                r="18"
                fill={n.letra ? "#ffd166" : "#cce3de"}
                stroke="#555"
                strokeWidth="2"
              />
              <text
                x={n.x}
                y={n.y + 5}
                textAnchor="middle"
                fontWeight="bold"
                fontSize="13"
              >
                {n.letra ? n.letra : n.freq.toFixed(2)}
              </text>
            </g>
          ))}
        </svg>


      </div>


    </div>

  );

}
