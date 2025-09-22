import { useState } from "react";
import IngresarDatos from "./IngresarDatos";
import "../App.css";

function Binaria({ array, onBack }) {
  const [datos, setDatos] = useState(array || []);
  const [target, setTarget] = useState("");
  const [foundIndex, setFoundIndex] = useState(null);
  const [fase, setFase] = useState("crear");
  const [currentMid, setCurrentMid] = useState(null);
  const [low, setLow] = useState(null);
  const [high, setHigh] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Comparador robusto
  const compareValues = (a, b) => {
    if (a === null || a === undefined) a = "";
    if (b === null || b === undefined) b = "";
    const an = Number(a);
    const bn = Number(b);
    const aIsNum = a !== "" && !Number.isNaN(an);
    const bIsNum = b !== "" && !Number.isNaN(bn);
    if (aIsNum && bIsNum) return an - bn;
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  };

  // Búsqueda binaria con animación
  const buscar = () => {
    if (!datos || datos.length === 0) return;

    const arr = [...datos].sort((x, y) => compareValues(x, y));
    setDatos(arr);

    setBuscando(true);
    setFoundIndex(null);
    setCurrentMid(null);
    setLow(0);
    setHigh(arr.length - 1);

    let lowIdx = 0;
    let highIdx = arr.length - 1;

    const interval = setInterval(() => {
      if (lowIdx > highIdx) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(-1);
        setCurrentMid(null);
        setLow(null);
        setHigh(null);
        return;
      }

      const mid = Math.floor((lowIdx + highIdx) / 2);
      setCurrentMid(mid);
      setLow(lowIdx);
      setHigh(highIdx);

      const cmpMidTarget = compareValues(arr[mid], target);

      if (cmpMidTarget === 0) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(mid);
        return;
      } else if (cmpMidTarget < 0) {
        lowIdx = mid + 1;
      } else {
        highIdx = mid - 1;
      }
    }, 800);
  };

  // Mensaje resultado
  const MensajeResultado = () =>
    foundIndex !== null && !buscando ? (
      <div
        style={{
          marginTop: "15px",
          padding: "10px 15px",
          borderRadius: "8px",
          fontWeight: "bold",
          display: "inline-block",
          background: foundIndex !== -1 ? "#d4edda" : "#f8d7da",
          color: foundIndex !== -1 ? "#155724" : "#721c24",
          border: `1px solid ${foundIndex !== -1 ? "#c3e6cb" : "#f5c6cb"}`,
          boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
          animation: "fadeZoom 0.4s ease-out",
        }}
      >
        {foundIndex !== -1
          ? `✅ Encontrado en posición ${foundIndex + 1}`
          : "❌ No encontrado"}
      </div>
    ) : null;

  return (
    <div style={{ textAlign: "center" }}>
      <h2>📘 Búsqueda Binaria</h2>

      {fase === "crear" && (
        <>
          <h3>🛠 Crear estructura</h3>
          <IngresarDatos onDataChange={(arr) => setDatos(arr)} />
          <button onClick={onBack}>⬅ Volver</button>
          <button onClick={() => setFase("buscar")} className="botones">
            ➡ Ir a búsqueda
          </button>
        </>
      )}

      {fase === "buscar" && (
        <>
          <h3>🔍 Buscar en estructura</h3>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="Dato a buscar"
            disabled={buscando}
          />
          <button onClick={buscar} disabled={buscando}>
            {buscando ? "Buscando..." : "Buscar"}
          </button>
          <button
            onClick={() => setFase("crear")}
            className="botones_nav"
            style={{ marginLeft: "10px" }}
            disabled={buscando}
          >
            ⬅ Volver a creación
          </button>

          <br />
          <MensajeResultado />

          {/* NUEVO: visualización en casillas */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "8px",
              maxWidth: "90%",
              marginLeft: "auto",
              marginRight: "auto",
               
            }}
          >
            {datos.length === 0 ? (
              <p style={{ opacity: 0.6 }}>Estructura vacía</p>
            ) : (
              datos.map((c, i) => (
                <div
                  key={i}
                  style={{
                    width: "60px",
                    height: "60px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    color: "#333",
                    background:
                      i === foundIndex
                        ? "lightgreen"
                        : i === currentMid
                        ? "yellow"
                        : low !== null && high !== null && i >= low && i <= high
                        ? "#f0f0f0"
                        : "white",
                    transition: "background 0.3s ease",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <span style={{ fontSize: "0.7em", color: "#666" }}>
                    {i + 1}
                  </span>
                  <span style={{ fontWeight: "bold" }}>{c}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Binaria;
