import { useState } from "react";
import "./IngresarDatos.css";

function IngresarDatos({ onDataChange }) {
  const [array, setArray] = useState([]);
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState(2);
  const [rangoMin, setRangoMin] = useState(0);
  const [rangoMax, setRangoMax] = useState(99);
  const [tamanoEstructura, setTamanoEstructura] = useState(5);

  const agregarClave = () => {
    // Validar duplicado
    if (array.includes(clave)) {
      alert(`❌ La clave ${clave} ya existe en la estructura.`);
      return;
    }

    // Validar tamaño de estructura
    if (array.length >= tamanoEstructura) {
      alert(`La estructura ya tiene ${tamanoEstructura} claves. No se pueden agregar más.`);
      return;
    }

    // Validar longitud de la clave
    if (clave.length !== tamanoClave) {
      alert(`La clave debe tener exactamente ${tamanoClave} dígitos`);
      return;
    }

    // Validar rango
    const num = parseInt(clave, 10);
    if (isNaN(num) || num < rangoMin || num > rangoMax) {
      alert(`La clave debe estar en el rango ${rangoMin} - ${rangoMax}`);
      return;
    }

    // Agregar clave
    const nuevoArray = [...array, clave];
    setArray(nuevoArray);
    setClave("");
    onDataChange(nuevoArray, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
  };


  const borrarClave = (index) => {
    const nuevo = array.filter((_, i) => i !== index);
    setArray(nuevo);
    onDataChange(nuevo, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
  };

  const guardarArchivo = () => {
    const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
    if (!nombreArchivo) return;

    const data = { nombre: nombreArchivo, tamanoClave, rangoMin, rangoMax, tamanoEstructura, valores: array };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombreArchivo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
        setRangoMin(Number(data.rangoMin) || 0);
        setRangoMax(Number(data.rangoMax) || 99);
        setTamanoEstructura(Number(data.tamanoEstructura) || data.valores.length);

        onDataChange(data.valores, {
          tamanoClave: Number(data.tamanoClave) || 2,
          rangoMin: Number(data.rangoMin) || 0,
          rangoMax: Number(data.rangoMax) || 99,
          tamanoEstructura: Number(data.tamanoEstructura) || data.valores.length,
        });
      } catch (error) {
        alert("Error: JSON inválido");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="contenedor">
      <h3>📥 Ingresar Datos</h3>

      {/* Configuración */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Tamaño estructura:
          <input type="number" value={tamanoEstructura} onChange={(e) => setTamanoEstructura(parseInt(e.target.value))} min={array.length} className="input-chico" />
        </label>
        <label>
          Tamaño clave:
          <input type="number" value={tamanoClave} onChange={(e) => setTamanoClave(parseInt(e.target.value))} min="1" className="input-chico" />
        </label>
        <label>
          Rango:
          <input type="number" value={rangoMin} onChange={(e) => setRangoMin(parseInt(e.target.value))} className="input-rango" />
          -
          <input type="number" value={rangoMax} onChange={(e) => setRangoMax(parseInt(e.target.value))} className="input-rango" />
        </label>
      </div>

      {/* Agregar clave */}
      <div style={{ marginBottom: "10px" }}>
        <input type="text" value={clave} onChange={(e) => setClave(e.target.value)} placeholder={`Clave (${tamanoClave} dígitos)`} maxLength={tamanoClave} className="input-clave" />
        <button onClick={agregarClave} className="boton_agregar">➕ Agregar</button>
      </div>

      <p>{`Claves agregadas: ${array.length} / ${tamanoEstructura}`}</p>

      {/* Slots tipo tarjeta con mini tabla */}
      <div className="contenedor-slots">
        {Array.from({ length: tamanoEstructura }).map((_, i) => {
          const valor = array[i] ?? "";
          return (
            <div key={i} className={`slot ${valor ? "ocupado" : "vacio"}`}>
              {/* Mini tabla superior: índice + borrar */}
              <div className="slot-header">
                <span className="indice">{i + 1}</span>
                {valor && <button className="boton_borrar" onClick={() => borrarClave(i)}>🗑</button>}
              </div>
              {/* Valor centrado debajo */}
              <div className="slot-valor">{valor || "__"}</div>
            </div>
          );
        })}
      </div>

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
