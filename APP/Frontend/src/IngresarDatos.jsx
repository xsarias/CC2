import { useState } from "react";

function IngresarDatos({ onDataChange }) {
  const [nuevo, setNuevo] = useState("");
  const [items, setItems] = useState([]);
  const [tamano, setTamano] = useState(0);

  const cambiarTamano = (e) => {
    const valor = parseInt(e.target.value) || 0;
    setTamano(valor);
    // si ya hay elementos y el nuevo tamaño es menor, recorta
    if (valor < items.length) {
      const reducido = items.slice(0, valor);
      setItems(reducido);
      onDataChange(reducido);
    }
  };

  const agregarItem = () => {
    if (nuevo.trim() === "") return;
    if (items.length >= tamano) {
      alert("Ya alcanzaste el tamaño máximo definido");
      return;
    }
    const actualizado = [...items, nuevo.trim()];
    setItems(actualizado);
    setNuevo("");
    onDataChange(actualizado);
  };

  return (
    <div style={{ background: "white", color: "black", padding: "20px", borderRadius: "12px", maxWidth: "500px" }}>
      <h2 style={{ marginBottom: "10px" }}>📥 Configurar estructura</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>Tamaño de la estructura: </label>
        <input
          type="number"
          min="0"
          value={tamano}
          onChange={cambiarTamano}
          style={{ marginLeft: "10px", padding: "5px" }}
        />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <input
          type="text"
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          placeholder="Escribe un valor"
          style={{ padding: "5px", marginRight: "10px" }}
        />
        <button onClick={agregarItem} style={{ padding: "5px 10px" }}>
          Añadir
        </button>
      </div>

      {/* tabla con estilo simple */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          border: "1px solid #ccc",
        }}
      >
        <thead>
          <tr style={{ background: "#f0f0f0" }}>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Posición</th>
            <th style={{ border: "1px solid #ccc", padding: "8px" }}>Valor</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: tamano }).map((_, index) => (
            <tr key={index}>
              <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                {index}
              </td>
              <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "center" }}>
                {items[index] || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default IngresarDatos;
