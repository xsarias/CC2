import { useState } from "react";
import "./HashMod.css"; // puedes usar el mismo CSS que ya tienes

function HashTruncamiento({ onDataChange }) {
  const [tabla, setTabla] = useState(Array(5).fill(null));
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState(4);
  const [rangoMin, setRangoMin] = useState(0);
  const [rangoMax, setRangoMax] = useState(9999);
  const [tamanoEstructura, setTamanoEstructura] = useState(5);
  const [posiciones, setPosiciones] = useState("12"); // dígitos por defecto
  const [ultimaClave, setUltimaClave] = useState(null);
  const [ultimosDigitos, setUltimosDigitos] = useState([]);
  const [ultimoInsertado, setUltimoInsertado] = useState(null);

  // Función hash por truncamiento
  const hash = (key) => {
    const str = key.toString();
    let extraido = "";

    const usados = [];
    for (let pos of posiciones) {
      const idx = parseInt(pos) - 1; // posiciones 1-indexadas
      if (idx >= 0 && idx < str.length) {
        extraido += str[idx];
        usados.push(idx);
      }
    }

    setUltimosDigitos(usados); // guardar qué dígitos se usaron
    setUltimaClave(str);

    const num = parseInt(extraido, 10) || 0;
    return num % tamanoEstructura;
  };

  // Agregar clave
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

    const index = hash(clave);
    if (tabla[index] !== null) {
      alert(`⚠️ Colisión: la posición ${index + 1} ya está ocupada por ${tabla[index]}`);
      return;
    }

    const nuevaTabla = [...tabla];
    nuevaTabla[index] = clave;
    setTabla(nuevaTabla);
    setClave("");
    setUltimoInsertado(index);
    setTimeout(() => setUltimoInsertado(null), 1500); // resalta 1.5s
    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones });
  };
  // Buscar clave
  const buscarClave = () => {
    if (clave.length !== tamanoClave) {
      alert(`La clave debe tener exactamente ${tamanoClave} dígitos`);
      return;
    }

    const num = parseInt(clave, 10);
    if (isNaN(num) || num < rangoMin || num > rangoMax) {
      alert(`La clave debe estar en el rango ${rangoMin} - ${rangoMax}`);
      return;
    }

    const index = hash(clave);
    if (tabla[index] === clave) {
      alert(`✅ Clave encontrada en la posición ${index + 1}`);
      setUltimoInsertado(index);
      setTimeout(() => setUltimoInsertado(null), 1500);
    } else {
      alert(`❌ La clave ${clave} no está en la tabla (pos. calculada: ${index + 1})`);
      setUltimoInsertado(index);
      setTimeout(() => setUltimoInsertado(null), 1500);
    }
  };

  const borrarClave = (index) => {
    const nuevaTabla = [...tabla];
    nuevaTabla[index] = null;
    setTabla(nuevaTabla);
    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones });
  };

  return (
    <div className="contenedor">
      <h3>🔑 Hash por Truncamiento</h3>

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

      <div style={{ marginBottom: "10px" }}>
        <label>
          Dígitos a truncar (ej: 13 = usar 1º y 3º dígito):
          <input
            type="text"
            value={posiciones}
            onChange={(e) => setPosiciones(e.target.value)}
            className="input-chico"
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
        <button onClick={agregarClave} className="boton">➕ Insertar</button>
        <button onClick={buscarClave} className="boton">🔍 Buscar</button>
      </div>
      {/* Fórmula visible */}
      <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#4d95b3ff", borderRadius: "8px" }}>
        <strong>Fórmula:</strong> h(k) = (dígitos seleccionados de k) +1;
      </div>
      {/* Mostrar clave con resaltado */}
      {ultimaClave && (
        <div style={{ marginTop: "15px", fontSize: "18px" }}>
          <strong>Clave analizada:</strong>{" "}
          {ultimaClave.split("").map((d, i) => (
            <span
              key={i}
              style={{
                padding: "2px 4px",
                margin: "1px",
                borderRadius: "4px",
                backgroundColor: ultimosDigitos.includes(i) ? "#ffcc00" : "transparent",
                fontWeight: ultimosDigitos.includes(i) ? "bold" : "normal",
              }}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* Tabla hash */}
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
                backgroundColor: i === ultimoInsertado ? "#d1ffd1" : "transparent", // verde cuando inserta
                transition: "background-color 0.6s ease",
              }}
            >
              <td>{i + 1}</td>
              <td>{valor ?? <em>vacío</em>}</td>
              <td>
                {valor && (
                  <button onClick={() => borrarClave(i)} className="boton">🗑 Borrar</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>


    </div>
  );
}

export default HashTruncamiento;
