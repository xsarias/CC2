import { useState } from "react";
import IngresarDatos from "./IngresarDatos";
import "../App.css";

function Binaria({ onBack }) {
  const [datos, setDatos] = useState([]);
  const [foundIndex, setFoundIndex] = useState(null);
  const [currentMid, setCurrentMid] = useState(null);
  const [low, setLow] = useState(null);
  const [high, setHigh] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // Comparador robusto
  const compareValues = (a, b) => {
    const an = Number(a);
    const bn = Number(b);
    const aIsNum = a !== "" && !Number.isNaN(an);
    const bIsNum = b !== "" && !Number.isNaN(bn);
    if (aIsNum && bIsNum) return an - bn;
    return String(a).localeCompare(String(b), undefined, {
      numeric: true,
      sensitivity: "base",
    });
  };

  // 🔎 búsqueda binaria con animación
  const manejarBuscar = (target, array) => {
    if (!target) return;
    const arr = [...array].sort(compareValues);
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
    }, 700);
  };

  // ✅ Mensaje resultado
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
      <h3>🛠 Crear, buscar y eliminar en estructura</h3>

      {/* 👉 Pasamos lógica a IngresarDatos */}
      <IngresarDatos
        onDataChange={(arr) => setDatos(arr)}
        onBuscar={manejarBuscar}
        currentIndex={currentMid}
        foundIndex={foundIndex}
        datos={datos}
        low={low}
        high={high}
      />

      <MensajeResultado />

      {/* Botón volver */}
      <button
        onClick={onBack}
        style={{ marginTop: "10px" }}
        disabled={buscando}
        className="boton"
      >
        ⬅ Volver
      </button>
    </div>
  );
}

export default Binaria;
