import { useState } from "react";

function Busqueda({ array }) {
  // --- Secuencial ---
  const [secTarget, setSecTarget] = useState("");
  const [secIndex, setSecIndex] = useState(null);
  const [secFound, setSecFound] = useState(null);
  const [secBuscando, setSecBuscando] = useState(false);
  const [secMensaje, setSecMensaje] = useState("");

  // --- Binaria ---
  const [binTarget, setBinTarget] = useState("");
  const [binArray, setBinArray] = useState([]);
  const [binFound, setBinFound] = useState(null);
  const [binMensaje, setBinMensaje] = useState("");
  const [binBuscando, setBinBuscando] = useState(false);
  const [binLeft, setBinLeft] = useState(null);
  const [binRight, setBinRight] = useState(null);
  const [binMid, setBinMid] = useState(null);

  // --- Secuencial animada ---
  const handleSecuencial = () => {
    if (!secTarget || array.length === 0) return;

    setSecBuscando(true);
    setSecIndex(0);
    setSecFound(null);
    setSecMensaje("");

    let i = 0;
    const interval = setInterval(() => {
      if (i >= array.length) {
        clearInterval(interval);
        setSecBuscando(false);
        setSecFound(-1);
        setSecMensaje("❌ No se encontró el elemento");
        return;
      }

      setSecIndex(i);

      if (parseInt(array[i]) === parseInt(secTarget)) {
        clearInterval(interval);
        setSecFound(i);
        setSecBuscando(false);
        setSecMensaje(`✅ Elemento encontrado en posición ${i}`);
      }

      i++;
    }, 400);
  };

  // --- Binaria animada con backend y rango visual ---
  const handleBinariaAnimada = async () => {
    if (!binTarget || array.length === 0) return;

    const arrayNumerico = array.map(Number).filter((item) => !isNaN(item)).sort((a, b) => a - b);
    setBinArray(arrayNumerico);
    setBinFound(null);
    setBinMensaje("");
    setBinBuscando(true);

    let left = 0;
    let right = arrayNumerico.length - 1;

    const interval = setInterval(() => {
      if (left > right) {
        clearInterval(interval);
        setBinFound(-1);
        setBinMensaje("❌ No se encontró el elemento");
        setBinBuscando(false);
        setBinLeft(null);
        setBinRight(null);
        setBinMid(null);
        return;
      }

      const mid = Math.floor((left + right) / 2);
      setBinLeft(left);
      setBinRight(right);
      setBinMid(mid);

      if (arrayNumerico[mid] === parseInt(binTarget)) {
        clearInterval(interval);
        setBinFound(mid);
        setBinMensaje(`✅ Elemento encontrado en posición ${mid}`);
        setBinBuscando(false);
        setBinLeft(null);
        setBinRight(null);
        setBinMid(null);

        // --- Backend ---
        fetch("http://127.0.0.1:8000/buscar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            algoritmo: "binaria",
            array: arrayNumerico,
            target: parseInt(binTarget),
          }),
        }).catch((err) => console.error(err));

        return;
      } else if (arrayNumerico[mid] < parseInt(binTarget)) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }, 500);
  };

  // --- Tabla ---
  const renderTabla = (data, highlightMid, animada = false, left = null, right = null) => (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        border: "1px solid #ccc",
        background: "white",
        color: "black",
        marginTop: "10px",
      }}
    >
      <thead>
        <tr style={{ background: "#f0f0f0" }}>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>Posición</th>
          <th style={{ border: "1px solid #ccc", padding: "8px" }}>Valor</th>
        </tr>
      </thead>
      <tbody>
        {data.length > 0 ? (
          data.map((item, i) => {
            let bg = "transparent";
            let color = "black";

            if (animada) {
              if (i === highlightMid) bg = "#ffeb3b"; // mid amarillo
              else if (left !== null && right !== null && i >= left && i <= right) bg = "#bbdefb"; // rango azul
              else bg = "#e0e0e0"; // descartados gris
            } else if (i === highlightMid && highlightMid !== -1) {
              bg = "#4caf50";
              color = "white";
            }

            return (
              <tr key={i}>
                <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>{i}</td>
                <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center", backgroundColor: bg, color: color, transition: "0.3s" }}>
                  {item}
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={2} style={{ textAlign: "center", padding: "8px" }}>
              Array vacío
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  return (
    <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", justifyContent: "center" }}>
      {/* Secuencial */}
      <div style={{ padding: "20px", background: "white", color: "black", borderRadius: "12px", minWidth: "300px" }}>
        <h3>📙 Búsqueda Secuencial</h3>
        <input
          type="number"
          value={secTarget}
          onChange={(e) => setSecTarget(e.target.value)}
          placeholder="Número a buscar"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button
          onClick={handleSecuencial}
          disabled={secBuscando}
          style={{
            backgroundColor: "#1976d2",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#1565c0")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#1976d2")}
        >
          {secBuscando ? "Buscando..." : "Buscar"}
        </button>
        {renderTabla(array, secBuscando ? secIndex : secFound, true)}
        {secMensaje && (
          <div style={{ marginTop: "10px", padding: "8px", borderRadius: "6px", backgroundColor: secFound !== -1 ? "#4caf50" : "#f44336", color: "white", fontWeight: "bold", textAlign: "center" }}>
            {secMensaje}
          </div>
        )}
      </div>

      {/* Binaria */}
      <div style={{ padding: "20px", background: "white", color: "black", borderRadius: "12px", minWidth: "300px" }}>
        <h3>📘 Búsqueda Binaria</h3>
        <input
          type="number"
          value={binTarget}
          onChange={(e) => setBinTarget(e.target.value)}
          placeholder="Número a buscar"
          style={{ marginRight: "10px", padding: "5px" }}
        />
        <button
          onClick={handleBinariaAnimada}
          disabled={binBuscando}
          style={{
            backgroundColor: "#f57c00",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "0.3s",
          }}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#ef6c00")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#f57c00")}
        >
          {binBuscando ? "Buscando..." : "Buscar"}
        </button>
        {renderTabla(binArray, binMid, true, binLeft, binRight)}
        {binMensaje && (
          <div style={{ marginTop: "10px", padding: "8px", borderRadius: "6px", backgroundColor: binFound !== -1 ? "#4caf50" : "#f44336", color: "white", fontWeight: "bold", textAlign: "center" }}>
            {binMensaje}
          </div>
        )}
      </div>
    </div>
  );
}

export default Busqueda;
