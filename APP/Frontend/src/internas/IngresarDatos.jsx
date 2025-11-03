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

  // ✅ Buscar (delegado a componente externo)
  const buscarClave = () => {
    if (!clave) return;
    onBuscar(clave, array);
  };
  const vaciar = () => {
    setArray([]);
    setClave("");
    onDataChange([], { tamanoClave, tamanoEstructura });
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

  // ✅ Cargar archivo JSON
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

        e.target.value = "";
      } catch (error) {
        alert("Error: JSON inválido");
      }
    };
    reader.readAsText(file);
  };

  // ✅ Manejo del input
  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length > tamanoClave) {
      alert(`⚠️ Solo se permiten ${tamanoClave} dígitos`);
      return;
    }
    setClave(value);
  };

  // ✅ Tabla: siempre muestra índice 1 y n (final)
  // y luego las claves insertadas
  const filas = [
    { indice: 1, valor: array[0] || "" }, // primer cubo
    ...array.slice(1).map((v, i) => ({ indice: i + 2, valor: v })), // resto de claves
    { indice: tamanoEstructura, valor: "" } // último cubo (referencia final)
  ];

  return (
    <div className="contenedor">
      <h3>Ingresar Datos</h3>

      {/* Configuración igual al estilo HashCuadrado */}
      <div className="opciones" >
        <div className="campo">
          <label>Tamaño estructura:</label>
          <input
            type="number"
            value={tamanoEstructura}
            onChange={(e) => setTamanoEstructura(parseInt(e.target.value))}
            min={array.length}
          />
        </div>

        <div className="campo">
          <label>Tamaño clave (dígitos):</label>
          <input
            type="number"
            value={tamanoClave}
            onChange={(e) => setTamanoClave(parseInt(e.target.value))}
            min="1"
          />
        </div>

        <div className="campo">
          <label>Clave:</label>
          <input
            type="text"
            value={clave}
            onChange={handleChange}
            placeholder={`(${tamanoClave} dígitos)`}
          />
        </div>
      </div>

      {/* Input + botones, mismo estilo que panel-controles */}
      <div className="panel-controles">

        <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
        <button onClick={buscarClave} className="boton">🔎 Buscar</button>
        <button onClick={eliminarClave} className="boton eliminar">✖️ Eliminar</button>
        <button onClick={vaciar} className="boton">♻ Vaciar</button>
      </div>

      <p>{`Claves agregadas: ${array.length} / ${tamanoEstructura}`}</p>

      {/* Tabla */}
      <table className="tabla-estructura">
        <thead>
          <tr>
            <th>Posición</th>
            <th>Clave</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => {
            let clase = "";
            if (i === currentIndex) clase = "revisando";
            if (i === foundIndex) clase = "encontrado";
            return (
              <tr key={i} className={clase}>
                <td>{fila.indice}</td>
                <td>{fila.valor}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Guardar / Cargar archivo */}
      <div className="botones-archivo" style={{ marginTop: "12px" }}>
        <button onClick={guardarArchivo} className="boton">💾 Guardar</button>
        <label className="boton">
          📂 Cargar
          <input type="file" accept=".json" onChange={recuperarArchivo} style={{ display: "none" }} />
        </label>
      </div>
    </div>
  );

}

export default IngresarDatos;
