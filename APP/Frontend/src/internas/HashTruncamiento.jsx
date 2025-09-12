import { useState } from "react";
import "../App.css";
import "./IngresarDatos.css";

function HashTruncamiento({ onDataChange, onBack }) {
  const [tabla, setTabla] = useState(Array(5).fill(null));
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState(4);
  const [rangoMin, setRangoMin] = useState(0);
  const [rangoMax, setRangoMax] = useState(9999);
  const [tamanoEstructura, setTamanoEstructura] = useState(5);
  const [posiciones, setPosiciones] = useState("12");
  const [ultimaClave, setUltimaClave] = useState(null);
  const [ultimosDigitos, setUltimosDigitos] = useState([]);
  const [ultimoInsertado, setUltimoInsertado] = useState(null);
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [metodoColision, setMetodoColision] = useState("lineal"); // nuevo: selector de colisiones

  // --- Hash por truncamiento (devuelve índice)
  const hash = (key) => {
    const str = key.toString();
    let extraido = "";
    const usados = [];

    for (let pos of posiciones) {
      const idx = parseInt(pos, 10) - 1;
      if (!isNaN(idx) && idx >= 0 && idx < str.length) {
        extraido += str[idx];
        usados.push(idx);
      }
    }

    setUltimosDigitos(usados);
    setUltimaClave(str);

    const num = parseInt(extraido, 10) || 0;
    return num % tamanoEstructura;
  };

  // --- Comprueba si la clave ya existe (en valores directos, arrays o encadenamiento)
  const existeClave = (key) => {
    for (let slot of tabla) {
      if (slot == null) continue;
      if (Array.isArray(slot) && slot.includes(key)) return true;
      if (slot && slot.tipo === "encadenamiento" && slot.valores.includes(key)) return true;
      if (slot === key) return true;
    }
    return false;
  };

  // --- Resolver colisiones (solo para direccionamiento abierto)
  const resolverColision = (indexInicial, claveStr) => {
    let index = indexInicial;
    let i = 1;
    if (metodoColision === "lineal") {
      while (indexOccupied(index)) {
        index = (indexInicial + i) % tamanoEstructura;
        i++;
        if (i > tamanoEstructura) return -1;
      }
      return index;
    }
    if (metodoColision === "cuadratica") {
      while (indexOccupied(index)) {
        index = (indexInicial + i * i) % tamanoEstructura;
        i++;
        if (i > tamanoEstructura) return -1;
      }
      return index;
    }
    if (metodoColision === "doble-hash") {
      // h2 básico: (1 + (valor % (m-1)))
      const parsed = parseInt(claveStr, 10) || 1;
      const step = 1 + (parsed % (tamanoEstructura - 1 || 1));
      while (indexOccupied(index)) {
        index = (indexInicial + i * step) % tamanoEstructura;
        i++;
        if (i > tamanoEstructura) return -1;
      }
      return index;
    }
    // encadenamiento/anidado no usan este resolver
    return index;
  };

  const indexOccupied = (idx) => {
    const slot = tabla[idx];
    // considerar ocupado si no es null (si hay bucket también cuenta como ocupado para direccionamiento abierto)
    return slot !== null;
  };

  // --- Agregar clave con manejo de colisiones
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
    if (existeClave(clave)) {
      alert(`❌ La clave ${clave} ya existe en la tabla`);
      return;
    }

    const indexInicial = hash(clave);
    const nuevaTabla = [...tabla];

    // métodos con buckets
    if (metodoColision === "anidado") {
      if (!Array.isArray(nuevaTabla[indexInicial])) nuevaTabla[indexInicial] = [];
      nuevaTabla[indexInicial] = [...nuevaTabla[indexInicial], clave];
      setTabla(nuevaTabla);
      setUltimoInsertado(indexInicial);
      setClave("");
      setResultadoBusqueda(null);
      onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones, metodoColision });
      setTimeout(() => setUltimoInsertado(null), 1500);
      return;
    }

    if (metodoColision === "encadenamiento") {
      if (!nuevaTabla[indexInicial]) nuevaTabla[indexInicial] = { tipo: "encadenamiento", valores: [] };
      nuevaTabla[indexInicial].valores = [...nuevaTabla[indexInicial].valores, clave];
      setTabla(nuevaTabla);
      setUltimoInsertado(indexInicial);
      setClave("");
      setResultadoBusqueda(null);
      onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones, metodoColision });
      setTimeout(() => setUltimoInsertado(null), 1500);
      return;
    }

    // direccionamiento abierto (lineal, cuadratica, doble-hash)
    let index = indexInicial;
    if (nuevaTabla[index] !== null) {
      index = resolverColision(indexInicial, clave);
      if (index === -1) {
        alert("⚠️ La tabla está llena, no se pudo insertar");
        return;
      }
    }

    nuevaTabla[index] = clave;
    setTabla(nuevaTabla);
    setUltimoInsertado(index);
    setClave("");
    setResultadoBusqueda(null);
    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones, metodoColision });
    setTimeout(() => setUltimoInsertado(null), 1500);
  };

  // --- Buscar (busca en toda la tabla: directo, arrays o encadenamiento)
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

    for (let i = 0; i < tabla.length; i++) {
      const slot = tabla[i];
      if (slot == null) continue;
      if (Array.isArray(slot) && slot.includes(clave)) {
        setResultadoBusqueda(`✅ La clave ${clave} se encontró en la posición ${i + 1}`);
        setUltimoInsertado(i);
        setTimeout(() => setUltimoInsertado(null), 1500);
        return;
      }
      if (slot && slot.tipo === "encadenamiento" && slot.valores.includes(clave)) {
        setResultadoBusqueda(`✅ La clave ${clave} se encontró (encadenamiento) en la posición ${i + 1}`);
        setUltimoInsertado(i);
        setTimeout(() => setUltimoInsertado(null), 1500);
        return;
      }
      if (slot === clave) {
        setResultadoBusqueda(`✅ La clave ${clave} se encontró en la posición ${i + 1}`);
        setUltimoInsertado(i);
        setTimeout(() => setUltimoInsertado(null), 1500);
        return;
      }
    }

    // no encontrada
    const posCalculada = hash(clave);
    setResultadoBusqueda(`❌ La clave ${clave} NO se encontró (posición esperada: ${posCalculada + 1})`);
    setUltimoInsertado(posCalculada);
    setTimeout(() => setUltimoInsertado(null), 1500);
  };

  // --- Borrar: si bucket/encadenamiento, borrar solo ese valor; si directo, borrar slot
  const borrarClave = (index, valor = null) => {
    const nuevaTabla = [...tabla];
    const slot = nuevaTabla[index];

    if (Array.isArray(slot) && valor != null) {
      nuevaTabla[index] = slot.filter((v) => v !== valor);
      if (nuevaTabla[index].length === 0) nuevaTabla[index] = null;
    } else if (slot && slot.tipo === "encadenamiento" && valor != null) {
      nuevaTabla[index].valores = slot.valores.filter((v) => v !== valor);
      if (nuevaTabla[index].valores.length === 0) nuevaTabla[index] = null;
    } else {
      // borrar slot directo
      nuevaTabla[index] = null;
    }

    setTabla(nuevaTabla);
    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones, metodoColision });
  };

  // --- Guardar / Recuperar
  const guardarArchivo = () => {
    const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
    if (!nombreArchivo) return;
    const data = {
      nombre: nombreArchivo,
      tamanoClave,
      rangoMin,
      rangoMax,
      tamanoEstructura,
      posiciones,
      metodoColision,
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
        setTamanoEstructura(Number(data.tamanoEstructura) || data.valores.length || 5);
        setPosiciones(data.posiciones || "12");
        setMetodoColision(data.metodoColision || "lineal");
        onDataChange?.(data.valores, data);
      } catch (err) {
        alert("Error al leer el archivo: JSON inválido");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="contenedor">
      <h3>🔑 Hash por Truncamiento</h3>

      {/* Selector de colisiones */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Método de colisión:
          <select value={metodoColision} onChange={(e) => setMetodoColision(e.target.value)} className="input-chico">
            <option value="lineal">Prueba lineal</option>
            <option value="cuadratica">Prueba cuadrática</option>
            <option value="doble-hash">Doble hashing</option>
            <option value="anidado">Arreglo anidado</option>
            <option value="encadenamiento">Encadenamiento</option>
          </select>
        </label>
      </div>

      {/* Configuración */}
      <div style={{ marginBottom: "10px" }}>
        <label>
          Tamaño de la estructura:
          <input type="number" value={tamanoEstructura} onChange={(e) => {
            const nuevo = parseInt(e.target.value);
            setTamanoEstructura(nuevo);
            setTabla(Array(nuevo).fill(null));
          }} min="1" className="input-chico" />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>
          Tamaño de la clave:
          <input type="number" value={tamanoClave} onChange={(e) => setTamanoClave(parseInt(e.target.value))} min="1" className="input-chico" />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>
          Rango:
          <input type="number" value={rangoMin} onChange={(e) => setRangoMin(parseInt(e.target.value))} className="input-rango" />
          -
          <input type="number" value={rangoMax} onChange={(e) => setRangoMax(parseInt(e.target.value))} className="input-rango" />
        </label>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>
          Dígitos a truncar (ej: 13 = usar 1º y 3º dígito):
          <input type="text" value={posiciones} onChange={(e) => setPosiciones(e.target.value)} className="input-chico" />
        </label>
      </div>

      {/* Input clave */}
      <div>
        <input type="text" value={clave} onChange={(e) => setClave(e.target.value)}
          placeholder={`Clave (${tamanoClave} dígitos)`} maxLength={tamanoClave} className="input-clave" />
        <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
        <button onClick={buscarClave} className="boton" style={{ marginLeft: "10px" }}>🔍 Buscar</button>
      </div>

      {/* Resultado de búsqueda */}
      {resultadoBusqueda && (
        <div style={{
          marginTop: "12px",
          padding: "10px 15px",
          borderRadius: "8px",
          backgroundColor: "#1e1e2f",
          color: "#00ffcc",
          fontWeight: "bold",
          textAlign: "center",
          boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
        }}>
          🔍 {resultadoBusqueda}
        </div>
      )}

      {/* Fórmula visible */}
      <div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#4d95b3", borderRadius: "8px" }}>
        <strong>Fórmula:</strong> h(k) = (dígitos seleccionados) mod {tamanoEstructura}
      </div>

      {/* Mostrar clave con resaltado */}
      {ultimaClave && (
        <div style={{ marginTop: "15px", fontSize: "18px" }}>
          <strong>Clave analizada:</strong>{" "}
          {ultimaClave.split("").map((d, i) => (
            <span key={i} style={{
              padding: "2px 4px",
              margin: "1px",
              borderRadius: "4px",
              backgroundColor: ultimosDigitos.includes(i) ? "#ffcc00" : "transparent",
              fontWeight: ultimosDigitos.includes(i) ? "bold" : "normal",
            }}>{d}</span>
          ))}
        </div>
      )}

      {/* Tabla hash */}
      <table className="tabla-claves">
        <thead>
          <tr>
            <th>Índice</th>
            <th>Clave(s)</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {tabla.map((valor, i) => (
            <tr key={i} style={{
              backgroundColor: i === ultimoInsertado ? "#d1ffd1" : "transparent",
              transition: "background-color 0.6s ease",
            }}>
              <td>{i + 1}</td>
              <td>
                {Array.isArray(valor) ? (
                  <div className="px-2 py-1 bg-green-200 rounded-md">[{valor.join(", ")}]</div>
                ) : valor && valor.tipo === "encadenamiento" ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {valor.valores.map((v, idx) => (
                      <span key={idx} style={{
                        padding: "4px 8px",
                        margin: "0 4px",
                        borderRadius: "6px",
                        backgroundColor: "#bfe9ff",
                      }}>{v}{idx < valor.valores.length - 1 && " →"}</span>
                    ))}
                  </div>
                ) : (
                  valor ?? <em>vacío</em>
                )}
              </td>
              <td>
                {Array.isArray(valor)
                  ? valor.map((v) => <button key={v} onClick={() => borrarClave(i, v)} className="boton_borrar">🗑 {v}</button>)
                  : valor && valor.tipo === "encadenamiento"
                    ? valor.valores.map((v) => <button key={v} onClick={() => borrarClave(i, v)} className="boton_borrar">🗑 {v}</button>)
                    : valor && <button onClick={() => borrarClave(i)} className="boton_borrar">🗑 Borrar</button>
                }
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
        {onBack && <button onClick={onBack} style={{ marginLeft: "10px" }} className="boton">⬅ Volver</button>}
      </div>
    </div>
  );
}

export default HashTruncamiento;
