import { useState } from "react";
import "../App.css";
import "./IngresarDatos.css";

function HashPlegamiento({ onDataChange, onBack }) {
  const [tabla, setTabla] = useState(Array(100).fill(null));
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState(4);
  const [rangoMin, setRangoMin] = useState(0);
  const [rangoMax, setRangoMax] = useState(9999);
  const [tamanoEstructura, setTamanoEstructura] = useState(100);
  const [ultimoInsertado, setUltimoInsertado] = useState(null);

  // --- Función hash por plegamiento
  const hashPlegamiento = (key) => {
    const str = key.toString();
    const grupoTam = tamanoEstructura.toString().length - 1; // según número de ceros
    const grupos = [];

    // dividir de derecha a izquierda
    for (let i = str.length; i > 0; i -= grupoTam) {
      const inicio = Math.max(i - grupoTam, 0);
      grupos.unshift(str.slice(inicio, i));
    }

    const suma = grupos.reduce((acc, g) => acc + parseInt(g, 10), 0);
    let resultado = suma + 1;

    if (resultado > tamanoEstructura) {
      resultado = resultado % tamanoEstructura;
    }

    return resultado - 1; // para usar en array (0-index)
  };

  // --- Agregar clave
  const agregarClave = () => {
    if (clave.length !== tamanoClave) {
      alert(`La clave debe tener exactamente ${tamanoClave} dígitos`);
      return;
    }
    const num = parseInt(clave, 10);
    if (isNaN(num) || num < rangoMin || num > rangoMax) {
      alert(`La clave debe estar en el rango ${rangoMin} - ${rangoMax}`);
      return;
    }

    if (tabla.includes(clave)) {
      alert(`❌ La clave ${clave} ya existe en la tabla`);
      return;
    }

    const index = hashPlegamiento(clave);
    if (tabla[index] !== null) {
      alert(`⚠️ Colisión: la posición ${index + 1} ya está ocupada por ${tabla[index]}`);
      return;
    }

    const nuevaTabla = [...tabla];
    nuevaTabla[index] = clave;
    setTabla(nuevaTabla);
    setClave("");
    setUltimoInsertado(index);
    setTimeout(() => setUltimoInsertado(null), 1500);

    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
  };

  // --- Buscar clave
  const buscarClave = () => {
    if (!clave) {
      alert("Por favor ingresa una clave para buscar.");
      return;
    }
    const index = hashPlegamiento(clave);
    if (tabla[index] === clave) {
      alert(`✅ Clave encontrada en la posición ${index + 1}`);
    } else {
      alert(`❌ La clave ${clave} NO está en la tabla (pos. calculada: ${index + 1})`);
    }
    setUltimoInsertado(index);
    setTimeout(() => setUltimoInsertado(null), 1500);
  };

  // --- Borrar clave
  const borrarClave = (index) => {
    const nuevaTabla = [...tabla];
    nuevaTabla[index] = null;
    setTabla(nuevaTabla);
    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura });
  };

  // --- Guardar archivo
  const guardarArchivo = () => {
    const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
    if (!nombreArchivo) return;

    const data = {
      nombre: nombreArchivo,
      tamanoClave,
      rangoMin,
      rangoMax,
      tamanoEstructura,
      valores: tabla,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${nombreArchivo}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // --- Recuperar archivo
  const recuperarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || !Array.isArray(data.valores)) {
          alert("Archivo inválido: debe tener un campo 'valores' que sea un array");
          return;
        }

        setTabla(data.valores);
        setTamanoClave(Number(data.tamanoClave) || 4);
        setRangoMin(Number(data.rangoMin) || 0);
        setRangoMax(Number(data.rangoMax) || 9999);
        setTamanoEstructura(Number(data.tamanoEstructura) || data.valores.length);

        onDataChange?.(data.valores, data);
      } catch (error) {
        alert("Error al leer el archivo: JSON inválido");
        console.error(error);
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="contenedor">
      <h3>🔑 Hash por Plegamiento (Suma)</h3>

      {/* Configuración */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Tamaño de la estructura:
          <input
            type="number"
            value={tamanoEstructura}
            onChange={(e) => {
              const nuevo = parseInt(e.target.value);
              setTamanoEstructura(nuevo);
              setTabla(Array(nuevo).fill(null));
            }}
            min="1"
            className="input-chico"
          />
        </label>
      </div>

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

      {/* Input clave */}
      <div>
        <input
          type="text"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder={`Clave (${tamanoClave} dígitos)`}
          maxLength={tamanoClave}
          className="input-clave"
        />
        <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
        <button onClick={buscarClave} className="boton" style={{ marginLeft: "10px" }}>🔍 Buscar</button>
      </div>

      {/* Tabla */}
      <table className="tabla-claves">
        <thead>
          <tr>
            <th>Índice</th>
            <th>Clave</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((valor, i) => (
            <tr
              key={i}
              style={{
                backgroundColor: i === ultimoInsertado ? "#d1ffd1" : "transparent",
                transition: "background-color 0.6s ease",
              }}
            >
              <td>{i + 1}</td>
              <td>{valor ?? <em>vacío</em>}</td>
              <td>
                {valor && (
                  <button onClick={() => borrarClave(i)} className="boton_borrar">
                    🗑 Borrar
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Botones finales */}
      <div style={{ marginTop: "10px" }}>
        <button onClick={guardarArchivo} className="boton">💾 Guardar archivo</button>
        <label style={{ cursor: "pointer", marginLeft: "10px" }} className="boton">
          📂 Cargar archivo
          <input type="file" accept=".json" onChange={recuperarArchivo} style={{ display: "none" }} />
        </label>
        <button onClick={onBack} style={{ marginLeft: "10px" }} className="boton">
          ⬅ Volver
        </button>
      </div>
    </div>
  );
}

export default HashPlegamiento;
