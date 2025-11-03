import { useState } from "react";
import IngresarDatos from "./IngresarDatos";

function Secuencial({ onBack }) {
  const [datos, setDatos] = useState([]);
  const [foundIndex, setFoundIndex] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [buscando, setBuscando] = useState(false);

  // 📥 actualizar datos siempre ordenados
  const actualizarDatos = (arr) => {
    const ordenados = [...arr].sort((a, b) => {
      if (!isNaN(a) && !isNaN(b)) return Number(a) - Number(b);
      return a.localeCompare(b);
    });
    setDatos(ordenados);
  };

  // 🔎 búsqueda secuencial con animación
  const manejarBuscar = (target, array) => {
    if (!target) return;
    setBuscando(true);
    setFoundIndex(null);
    setCurrentIndex(null);

    let i = 0;
    const interval = setInterval(() => {
      if (i >= array.length) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(-1);
        return;
      }

      setCurrentIndex(i);

      if (array[i] === target) {
        clearInterval(interval);
        setBuscando(false);
        setFoundIndex(i);
        return;
      }

      i++;
    }, 700);
  };

  // ✅ Mensaje de resultado
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
      <h2 class ="titles_h2">Búsqueda Secuencial</h2>
      <IngresarDatos
        onDataChange={actualizarDatos}
        onBuscar={manejarBuscar}
        currentIndex={currentIndex}
        foundIndex={foundIndex}
      />

      {/* Mensaje resultado */}
      <MensajeResultado />

      {/* Botón volver */}
      <button
        onClick={onBack}
        style={{ marginTop: "10px" }}
        disabled={buscando}
        className="volver"
      >
        ⬅ Volver
      </button>
    </div>
  );
}

export default Secuencial;
