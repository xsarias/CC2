import { useState } from "react";
import IngresarDatos from "./IngresarDatos";

function Secuencial({ array, onBack }) {
  const [datos, setDatos] = useState(array || []);
  const [target, setTarget] = useState("");
  const [foundIndex, setFoundIndex] = useState(null);
  const [fase, setFase] = useState("crear");
  const [currentIndex, setCurrentIndex] = useState(null);
  const [buscando, setBuscando] = useState(false);

  const buscar = () => {
    setBuscando(true);
    setFoundIndex(null);
    setCurrentIndex(null);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= datos.length) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(-1);
        return;
      }

      setCurrentIndex(i);

      if (datos[i] === target) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(i);
        return;
      }

      i++;
    }, 700);
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h2>📙 Búsqueda Secuencial</h2>

      {fase === "crear" && (
        <>
          <h3>🛠 Crear estructura</h3>
          <IngresarDatos onDataChange={(arr) => setDatos(arr)} />
          <button onClick={onBack}>⬅ Volver</button>
          <button onClick={() => setFase("buscar")} style={{ marginLeft: "10px" }}>
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
          <button onClick={buscar} disabled={buscando} style={{ marginLeft: "10px" }}>
            {buscando ? "Buscando..." : "Buscar"}
          </button>
          <button
            onClick={() => setFase("crear")}
            style={{ marginLeft: "10px" }}
            disabled={buscando}
          >
            ⬅ Volver a creación
          </button>

          {foundIndex !== null && !buscando && (
            <div
              style={{
                marginTop: "15px",
                padding: "10px 15px",
                borderRadius: "8px",
                fontWeight: "bold",
                display: "inline-block",
                background: foundIndex !== -1 ? "#28a745" : "#dc3545",
                color: "#fff",
                border: `1px solid ${foundIndex !== -1 ? "#218838" : "#c82333"}`,
                boxShadow: "0px 2px 5px rgba(0,0,0,0.2)",
              }}
            >
              {foundIndex !== -1
                ? `✅ Encontrado en posición ${foundIndex + 1}`
                : "❌ No encontrado"}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              gap: "10px",
              marginTop: "20px",
              padding: "10px",
            }}
          >
            {datos.length === 0 && <p style={{ textAlign: "center" }}>Estructura vacía</p>}
            {datos.map((c, i) => (
              <div
                key={i}
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "6px",
                  border: "1px solid #444",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "bold",
                  background:
                    i === foundIndex
                      ? "#28a745" // verde fuerte
                      : i === currentIndex
                      ? "#ffc107" // amarillo intenso
                      : "#f0f0f0", // gris neutro
                  color: "#000", // letra negra
                  boxShadow:
                    i === foundIndex
                      ? "0 0 8px rgba(40,167,69,0.7)"
                      : i === currentIndex
                      ? "0 0 8px rgba(255,193,7,0.7)"
                      : "0 2px 5px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                }}
              >
                <small style={{ fontSize: "0.7em", opacity: 0.8 }}>{i + 1}</small>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Secuencial;
