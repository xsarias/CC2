import { useState } from "react";
import IngresarDatos from "./IngresarDatos";

function Secuencial({ array, onBack }) {
  const [datos, setDatos] = useState(array || []);
  const [target, setTarget] = useState("");
  const [foundIndex, setFoundIndex] = useState(null);
  const [fase, setFase] = useState("crear"); 
  const [currentIndex, setCurrentIndex] = useState(null); // índice que se está revisando
  const [buscando, setBuscando] = useState(false);

  // --- Buscar con animación ---
  const buscar = () => {
    setBuscando(true);
    setFoundIndex(null);
    setCurrentIndex(null);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= datos.length) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(-1); // no encontrado
        return;
      }

      setCurrentIndex(i);

      if (datos[i] === target) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(i); // encontrado
        return;
      }

      i++;
    }, 700); // 👈 velocidad (milisegundos entre pasos)
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>📙 Búsqueda Secuencial</h2>

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
          <br></br>
          {foundIndex !== null && !buscando && (
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
                opacity: 1,
                transform: "scale(1)",
                animation: "fadeZoom 0.5s ease-out",
              }}
            >
              {foundIndex !== -1
                ? `✅ Encontrado en posición ${foundIndex + 1}`
                : "❌ No encontrado"}
            </div>
          )}


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
                        : i === currentIndex
                        ? "yellow"
                        : "white",
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

export default Secuencial;
