import { useState } from "react";
import "./IngresarDatos.css";

function IngresarDatos({ onDataChange }) {
  const [array, setArray] = useState([]);
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState(2);
  const [rangoMin, setRangoMin] = useState(0);
  const [rangoMax, setRangoMax] = useState(99);
  const [tamanoEstructura, setTamanoEstructura] = useState(5);

  // Agregar clave
  const agregarClave = () => {
    if (array.length >= tamanoEstructura) {
      alert(`La estructura ya tiene ${tamanoEstructura} claves. No se pueden agregar más.`);
      return;
    }
    if (clave.length !== tamanoClave) {
      alert(`La clave debe tener exactamente ${tamanoClave} dígitos`);
      return;
    }
    const num = parseInt(clave, 10);
    if (isNaN(num) || num < rangoMin || num > rangoMax) {
      alert(`La clave debe estar en el rango ${rangoMin} - ${rangoMax}`);
      return;
    }

    const nuevoArray = [...array, clave];
    setArray(nuevoArray);
    setClave("");
    onDataChange(nuevoArray, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
  };

  // Borrar clave
  const borrarClave = (index) => {
    const nuevo = array.filter((_, i) => i !== index);
    setArray(nuevo);
    onDataChange(nuevo, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
  };

  // Guardar archivo JSON
  const guardarArchivo = () => {
    const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
    if (!nombreArchivo) return;

    const data = {
      nombre: nombreArchivo,
      tamanoClave,
      rangoMin,
      rangoMax,
      tamanoEstructura,
      valores: array
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombreArchivo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Recuperar archivo JSON
  const recuperarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Validación básica
        if (!data || !Array.isArray(data.valores)) {
          alert("Archivo inválido: debe tener un campo 'valores' que sea un array");
          return;
        }

        // Actualizar estados
        setArray(data.valores);
        setTamanoClave(Number(data.tamanoClave) || 2);
        setRangoMin(Number(data.rangoMin) || 0);
        setRangoMax(Number(data.rangoMax) || 99);
        setTamanoEstructura(Number(data.tamanoEstructura) || data.valores.length);

        // Informar al componente padre
        onDataChange(data.valores, {
          tamanoClave: Number(data.tamanoClave) || 2,
          rangoMin: Number(data.rangoMin) || 0,
          rangoMax: Number(data.rangoMax) || 99,
          tamanoEstructura: Number(data.tamanoEstructura) || data.valores.length,
        });

      } catch (error) {
        alert("Error al leer el archivo: JSON inválido");
        console.error(error);
      }
    };

    reader.readAsText(file);
  };



  return (
    <div className="contenedor">
      <h3>📥 Ingresar Datos</h3>

      {/* Tamaño total de la estructura */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Tamaño de la estructura:
          <input
            type="number"
            value={tamanoEstructura}
            onChange={(e) => setTamanoEstructura(parseInt(e.target.value))}
            min={array.length}
            className="input-chico"
          />
        </label>
      </div>

      {/* Tamaño de clave */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Tamaño de la clave:
          <input
            type="number"
            value={tamanoClave}
            onChange={(e) => setTamanoClave(parseInt(e.target.value))}
            min="1"
            className="input-chico"
          />
        </label>
      </div>

      {/* Rango */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Rango:
          <input
            type="number"
            value={rangoMin}
            onChange={(e) => setRangoMin(parseInt(e.target.value))}
            className="input-rango"
          />
          -
          <input
            type="number"
            value={rangoMax}
            onChange={(e) => setRangoMax(parseInt(e.target.value))}
            className="input-rango"
          />
        </label>
      </div>

      {/* Agregar clave */}
      <div>
        <input
          type="text"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder={`Clave (${tamanoClave} dígitos)`}
          maxLength={tamanoClave}
          className="input-clave"
        />
        <button onClick={agregarClave} className="boton">➕ Agregar</button>
      </div>

      <p>{`Claves agregadas: ${array.length} / ${tamanoEstructura}`}</p>

      {/* Tabla de claves */}
      <table className="tabla-claves">
        <thead>
          <tr>
            <th>Posición</th>
            <th>Clave</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: tamanoEstructura }).map((_, i) => {
            const valor = array[i] ?? ""; // si no hay clave, dejar vacío
            return (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{valor}</td>
                <td>
                  {valor && <button onClick={() => borrarClave(i)} className="boton">🗑 Borrar</button>}
                </td>
              </tr>
            );
          })}
        </tbody>

      </table>

      <div style={{ marginTop: "10px" }}>
        {/* Botón para guardar */}
        <button onClick={guardarArchivo} className="boton">💾 Guardar archivo</button>

        {/* Botón personalizado para cargar */}
        <label style={{ cursor: "pointer", marginLeft: "10px" }} className="boton">
          📂 Cargar archivo
          <input
            type="file"
            accept=".json"
            onChange={recuperarArchivo}
            style={{ display: "none" }} // ocultamos el input real
          />
        </label>
      </div>
    </div>
  );
}

export default IngresarDatos;
