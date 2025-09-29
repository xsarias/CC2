import { useState } from "react";
import "./IngresarDatos.css";

function IngresarDatos({ onDataChange, onBuscar, currentIndex, foundIndex }) {
  const [array, setArray] = useState([]);
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState(2);
  const [tamanoEstructura, setTamanoEstructura] = useState(20);

  // ✅ Insertar clave ordenada
  const agregarClave = () => {
    if (array.includes(clave)) {
      alert(`❌ La clave ${clave} ya existe en la estructura.`);
      return;
    }
    if (array.length >= tamanoEstructura) {
      alert(`La estructura ya tiene ${tamanoEstructura} claves.`);
      return;
    }
    if (clave.length !== tamanoClave) {
      alert(`La clave debe tener exactamente ${tamanoClave} dígitos`);
      return;
    }

    const nuevoArray = [...array, clave].sort((a, b) => parseInt(a) - parseInt(b));
    setArray(nuevoArray);
    setClave("");
    onDataChange(nuevoArray, { tamanoClave, tamanoEstructura });
  };

  // ✅ Eliminar clave
  const eliminarClave = () => {
    if (!array.includes(clave)) {
      alert(`❌ La clave ${clave} no está en la estructura.`);
      return;
    }
    const nuevo = array.filter((v) => v !== clave);
    setArray(nuevo);
    setClave("");
    onDataChange(nuevo, { tamanoClave, tamanoEstructura });
  };

  // ✅ Buscar (delegado a Secuencial)
  const buscarClave = () => {
    if (!clave) return;
    onBuscar(clave, array);
  };

  // ✅ Guardar archivo JSON
  const guardarArchivo = () => {
    const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
    if (!nombreArchivo) return;

    const data = { nombre: nombreArchivo, tamanoClave, tamanoEstructura, valores: array };
    const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombreArchivo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ Cargar archivo JSON (rápido)
  const recuperarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!data || !Array.isArray(data.valores)) {
          alert("Archivo inválido: debe tener un array 'valores'");
          return;
        }

        setArray(data.valores);
        setTamanoClave(Number(data.tamanoClave) || 2);
        setTamanoEstructura(Number(data.tamanoEstructura) || data.valores.length);

        onDataChange(data.valores, {
          tamanoClave: Number(data.tamanoClave) || 2,
          tamanoEstructura: Number(data.tamanoEstructura) || data.valores.length,
        });

        e.target.value = ""; // 🔥 Permite volver a cargar el mismo archivo sin recargar
      } catch (error) {
        alert("Error: JSON inválido");
      }
    };
    reader.readAsText(file);
  };

  // ✅ Manejo del input (mensaje si pasa del tamaño)
  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length > tamanoClave) {
      alert(`⚠️ Solo se permiten ${tamanoClave} dígitos`);
      return;
    }
    setClave(value);
  };

  // ✅ Generar tabla
  const generarTabla = () => {
    const filas = [];
    const columnas = 10;
    for (let i = 0; i < tamanoEstructura; i += columnas) {
      const fila = [];
      for (let j = 0; j < columnas; j++) {
        const idx = i + j;
        if (idx >= tamanoEstructura) break;
        fila.push(idx);
      }
      filas.push(fila);
    }
    return filas;
  };

  return (
    <div className="contenedor">
      <h3>📥 Ingresar Datos</h3>

      {/* Configuración */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Tamaño estructura:
          <input
            type="number"
            value={tamanoEstructura}
            onChange={(e) => setTamanoEstructura(parseInt(e.target.value))}
            min={array.length}
            className="input-chico"
          />
        </label>
        <label>
          Tamaño clave:
          <input
            type="number"
            value={tamanoClave}
            onChange={(e) => setTamanoClave(parseInt(e.target.value))}
            min="1"
            className="input-chico"
          />
        </label>
      </div>

      {/* Input + botones */}
      <div style={{ marginBottom: "10px", display: "flex", gap: "6px", justifyContent: "center" }}>
        <input
          type="text"
          value={clave}
          onChange={handleChange}
          placeholder={`Clave (${tamanoClave} dígitos)`}
          className="input-clave"
        />
        <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
        <button onClick={buscarClave} className="boton">🔎 Buscar</button>
        <button onClick={eliminarClave} className="boton eliminar">🗑️ Eliminar</button>
      </div>

      <p>{`Claves agregadas: ${array.length} / ${tamanoEstructura}`}</p>

      {/* Tabla dinámica con animación */}
      <table className="tabla-estructura">
        <tbody>
          {generarTabla().map((fila, fIndex) => (
            <tr key={fIndex}>
              {fila.map((idx) => {
                let clase = array[idx] ? "ocupado" : "vacio";

                // 🔥 Animación búsqueda
                if (idx === currentIndex) clase += " revisando";
                if (idx === foundIndex) clase += " encontrado";

                return (
                  <td key={idx} className={clase}>
                    <div className="indice">{idx + 1}</div>
                    <div className="valor">{array[idx] || ""}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Guardar / Cargar archivo */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={guardarArchivo} className="boton">💾 Guardar archivo</button>
        <label className="boton" style={{ marginLeft: "10px", cursor: "pointer" }}>
          📂 Cargar archivo
          <input type="file" accept=".json" onChange={recuperarArchivo} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );
}

export default IngresarDatos;
