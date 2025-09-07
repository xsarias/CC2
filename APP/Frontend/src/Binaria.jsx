import { useState } from "react";
import IngresarDatos from "./IngresarDatos";

function Binaria({ array, onBack }) {
  const [datos, setDatos] = useState(array || []);
  const [target, setTarget] = useState("");
  const [foundIndex, setFoundIndex] = useState(null);
  const [fase, setFase] = useState("crear");
  const [currentMid, setCurrentMid] = useState(null);
  const [low, setLow] = useState(null);
  const [high, setHigh] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // comparador robusto: numérico si ambos son números, sino localeCompare con numeric option
  const compareValues = (a, b) => {
    // normalizar nulos/vacíos
    if (a === null || a === undefined) a = "";
    if (b === null || b === undefined) b = "";

    const an = Number(a);
    const bn = Number(b);
    const aIsNum = a !== "" && !Number.isNaN(an);
    const bIsNum = b !== "" && !Number.isNaN(bn);

    if (aIsNum && bIsNum) {
      // comparación numérica
      return an - bn;
    }
    // comparación textual, con opción numeric para que "2" y "10" ordenen correctamente si contienen números
    return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
  };

  // Buscar binaria con animación
  const buscar = () => {
    if (!datos || datos.length === 0) return;

    // Crear copia ordenada usando compareValues indirectamente:
    // Para sort con comparator que devuelve negative/positive/0, adaptamos compareValues:
    const arr = [...datos].sort((x, y) => {
      const cmp = compareValues(x, y);
      // compareValues devuelve difference for numbers, or localeCompare result (number)
      if (typeof cmp === "number") return cmp;
      return cmp;
    });

    // actualizar estado visible (tabla) con el array ordenado
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
        // arr[mid] < target
        lowIdx = mid + 1;
      } else {
        // arr[mid] > target
        highIdx = mid - 1;
      }
    }, 800); // ajusta velocidad aquí (ms)
  };

  // pequeño helper: mostrar mensaje bonito
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
          <button onClick={() => setFase("buscar")}>➡ Ir a búsqueda</button>
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
          <button onClick={() => setFase("crear")} style={{ marginLeft: "10px" }} disabled={buscando}>
            ⬅ Volver a creación
          </button>

          <br />

          <MensajeResultado />

          <table
            style={{
              margin: "20px auto",
              borderCollapse: "collapse",
              border: "1px solid #ccc",
              background: "white",
              color: "black",
            }}
          >
            <thead>
              <tr style={{ background: "#f0f0f0" }}>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Posición</th>
                <th style={{ border: "1px solid #ccc", padding: "8px" }}>Clave</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((c, i) => (
                <tr
                  key={i}
                  style={{
                    background:
                      i === foundIndex
                        ? "lightgreen"
                        : i === currentMid
                        ? "yellow"
                        : low !== null && high !== null && i >= low && i <= high
                        ? "#f0f0f0"
                        : "white",
                    transition: "background 0.25s ease",
                  }}
                >
                  <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                    {i + 1}
                  </td>
                  <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                    {c}
                  </td>
                </tr>
              ))}
              {datos.length === 0 && (
                <tr>
                  <td colSpan="2" style={{ textAlign: "center", padding: "10px" }}>
                    Estructura vacía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default Binaria;
