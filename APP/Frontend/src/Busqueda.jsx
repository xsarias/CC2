import { useState } from "react";

function Busqueda() {
  const [array, setArray] = useState("");
  const [target, setTarget] = useState("");
  const [resultado, setResultado] = useState(null);

  const handleBuscar = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/buscar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          algoritmo: "secuencial", 
          array: array.split(",").map(num => parseInt(num.trim())),
          target: parseInt(target),
        }),
      });

      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Búsqueda Secuencial</h2>

      <div>
        <label>Array (separado por comas): </label>
        <input
          type="text"
          value={array}
          onChange={(e) => setArray(e.target.value)}
          placeholder="Ej: 10,20,30,40"
        />
      </div>

      <div style={{ marginTop: "10px" }}>
        <label>Elemento a buscar: </label>
        <input
          type="number"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Ej: 30"
        />
      </div>

      <button style={{ marginTop: "10px" }} onClick={handleBuscar}>
        Buscar
      </button>

      {resultado && (
        <div style={{ marginTop: "20px" }}>
          <h3>Resultado:</h3>
          <pre>{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default Busqueda;
