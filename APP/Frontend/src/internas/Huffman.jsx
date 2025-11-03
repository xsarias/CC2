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

// ===============================
// 🔹 Construcción del árbol de Huffman
// ===============================
function construirArbol(freqs) {
  let nodos = Object.entries(freqs).map(
    ([letra, freq]) => new NodoHuffman(letra, freq)
  );

  while (nodos.length > 1) {
    // Ordenar de menor a mayor frecuencia
    nodos.sort((a, b) => a.freq - b.freq);

    const izq = nodos.shift();
    const der = nodos.shift();

    const nuevo = new NodoHuffman(null, izq.freq + der.freq);
    nuevo.izq = izq;
    nuevo.der = der;
    nodos.push(nuevo);
  }

  return nodos[0];
}

// ===============================
// 🔹 Generar códigos Huffman recursivamente
// ===============================
function generarCodigos(nodo, codigo = "", tabla = {}) {
  if (!nodo) return;

  if (!nodo.izq && !nodo.der) {
    tabla[nodo.letra] = codigo || "0"; // por si solo hay una letra
  } else {
    generarCodigos(nodo.izq, codigo + "0", tabla);
    generarCodigos(nodo.der, codigo + "1", tabla);
  }

  return tabla;
}

// ===============================
// 🔹 Calcular posiciones para dibujar el árbol
// ===============================
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

// ===============================
// 🔹 Dibujar líneas entre nodos
// ===============================
function dibujarLineas(nodo, parent = null, label = "") {
  if (!nodo) return [];
  const lineas = [];
  if (parent)
    lineas.push({ x1: parent.x, y1: parent.y, x2: nodo.x, y2: nodo.y, label });
  if (nodo.izq) lineas.push(...dibujarLineas(nodo.izq, nodo, "0"));
  if (nodo.der) lineas.push(...dibujarLineas(nodo.der, nodo, "1"));
  return lineas;
}

// ===============================
// 🔹 Ecuación lineal (solo para mostrar estructura)
// ===============================
function ecuacionLineal(nodo) {
  if (!nodo) return "";
  if (!nodo.izq && !nodo.der) return nodo.letra;
  return `(${ecuacionLineal(nodo.izq)} + ${ecuacionLineal(nodo.der)})`;
}

// ===============================
// 🌳 Componente principal React
// ===============================
export default function Huffman({ onBack }) {
  const [texto, setTexto] = useState("");
  const [frecuencias, setFrecuencias] = useState({});
  const [raiz, setRaiz] = useState(null);
  const [ecuacion, setEcuacion] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [codigos, setCodigos] = useState({});
  const [letraBuscada, setLetraBuscada] = useState("");
  const [resaltado, setResaltado] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const buscarLetra = async () => {
    const letra = letraBuscada.toUpperCase();

    if (!codigos[letra]) {
      setMensaje(`❌ "${letra}" no existe en el árbol`);
      return;
    }

    setBuscando(true);
    setMensaje(`🔍 Buscando "${letra}"...`);
    setResaltado(null);

    const nodosOrden = [...nodos]; // ✅ ahora sí usamos nodos calculados

    for (let n of nodosOrden) {
      setResaltado(n);
      await new Promise(res => setTimeout(res, 200));
      if (n.letra === letra) {
        setMensaje(`✅ Encontrada: "${letra}" con código ${codigos[letra]}`);
        setBuscando(false);
        return;
      }
    }

    setMensaje(`❌ No encontrada`);
    setBuscando(false);
  };


  // Generar árbol desde el texto
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
    const tablaCodigos = generarCodigos(raizNueva);

    setFrecuencias(freqs);
    setCodigos(tablaCodigos);
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
        const tabla = generarCodigos(r);
        setCodigos(tabla);
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
    <>
      <div className="arbol-digitales-container">
        <div className="sidebar">
          <h2>Árbol de Huffman</h2>
          <p>Inserte un mensaje:</p>
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value.toUpperCase())}
            placeholder="Ejemplo: MURCIELAGO"
            maxLength={30}
          />

          <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "5px" }}>
            <button onClick={generarArbol} className="construir_arbols">⚙️ Generar árbol</button>

          </div>
          <input
            type="text"
            value={letraBuscada}
            onChange={(e) => setLetraBuscada(e.target.value.toUpperCase())}
            maxLength={1}
            placeholder="Clave a buscar"
          />

          <button onClick={buscarLetra} className="construir_arbols" disabled={buscando}>
            🔎 Buscar
          </button>
          <button
            className="construir_arbols"
            onClick={() => {
              const letra = letraBuscada.toUpperCase();
              if (!frecuencias[letra]) {
                setMensaje(`❌ "${letra}" no está en el árbol`);
                return;
              }
              const freqs = { ...frecuencias };
              delete freqs[letra];
              const nuevaRaiz = construirArbol(freqs);
              setFrecuencias(freqs);
              setCodigos(generarCodigos(nuevaRaiz));
              setRaiz(nuevaRaiz);
              setMensaje(`🗑 "${letra}" eliminada`);
            }}
          >
            ✖️ Eliminar
          </button>


          <div>
            {Object.keys(codigos).length > 0 && (
              <>
                <h4>Códigos de Huffman</h4>


                <table className="tabla-frecuencias">
                  <thead>
                    <tr>
                      <th>Clave</th>
                      <th>Frecuencia</th>
                      <th>Código</th>
                    </tr>
                  </thead>

                  <tbody>
                    {Object.entries(codigos).map(([letra, codigo], i) => (
                      <tr key={i}>
                        <td>{letra}</td>

                        {/* Frecuencia → ya es probabilidad, solo formateamos */}
                        <td>{frecuencias[letra].toFixed(3).replace(".", ",")}</td>

                        <td style={{ fontFamily: "monospace" }}>{codigo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

              </>
            )}
          </div>

        </div>

        {/* SVG del árbol */}
        <div className="arbol-grafico" style={{ overflow: "auto", background: "#fafafa" }}>
          <svg width="3000" height="900">
            {/* Líneas */}
            {lineas.map((l, i) => (
              <g key={i}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke="#777" strokeWidth="2" />
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
            {/* Nodos */}
            {nodos.map((n, i) => (
              <g key={i}>
                <circle
                  cx={n.x}
                  cy={n.y}
                  r="18"
                  fill={resaltado === n ? "#ff6666" : n.letra ? "#ffd166" : "#cce3de"}
                  stroke={resaltado === n ? "#c0392b" : "#555"}
                  strokeWidth="2"
                />

                {/* ✅ Letra dentro (solo si es hoja) */}
                {n.letra && (
                  <text
                    x={n.x}
                    y={n.y + 5}
                    textAnchor="middle"
                    fontWeight="bold"
                    fontSize="13"
                  >
                    {n.letra}
                  </text>
                )}

                {/* ✅ Frecuencia al lado derecho */}
                <text
                  x={n.x + 28}  // desplazar a la derecha
                  y={n.y + 5}
                  textAnchor="start"
                  fontSize="12"
                  fill="#333"
                >
                  {n.freq.toFixed(3).replace(".", ",")}
                </text>
              </g>
            ))}

          </svg>
        </div>
      </div>
      {/* Ecuación en bloque separado */}
      {ecuacion && (
        <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}>
          <span style={{ fontWeight: "bold" }}>Ecuación del árbol:</span>
          <span
            style={{
              fontFamily: "monospace",
              fontSize: "16px",
              background: "#1a411aff",
              color: "#fff",
              padding: "2px 8px",
              borderRadius: "8px",
              display: "inline-block",
            }}
          >
            {ecuacion}
          </span>
        </div>

      )}

      {/* Botones en su propio bloque */}
      <section className="botones-accion">
        <button
          onClick={() => {
            const div = document.querySelector(".arbol-grafico");
            if (div.requestFullscreen) div.requestFullscreen();
            else if (div.webkitRequestFullscreen) div.webkitRequestFullscreen();
          }}
          className="construir_arbols"
        >
          ⛶ Expandir
        </button>

        <button onClick={guardarArchivo} className="construir_arbols">💾 Guardar archivo</button>
        <label className="construir_arbols" style={{ cursor: "pointer" }}>
          📂 Cargar archivo
          <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
        </label>
        <button onClick={onBack} className="volver">⬅ Volver</button>
      </section>

    </>
  );
}
