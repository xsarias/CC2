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
  const [metodoColision, setMetodoColision] = useState("lineal");

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

  const existeClave = (key) => {
    for (let slot of tabla) {
      if (slot == null) continue;
      if (Array.isArray(slot) && slot.includes(key)) return true;
      if (slot && slot.tipo === "encadenamiento" && slot.valores.includes(key)) return true;
      if (slot === key) return true;
    }
    return false;
  };

  const indexOccupied = (idx) => tabla[idx] !== null;

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
      const parsed = parseInt(claveStr, 10) || 1;
      const step = 1 + (parsed % (tamanoEstructura - 1 || 1));
      while (indexOccupied(index)) {
        index = (indexInicial + i * step) % tamanoEstructura;
        i++;
        if (i > tamanoEstructura) return -1;
      }
      return index;
    }
    return index;
  };

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

    if (metodoColision === "anidado") {
      if (!Array.isArray(nuevaTabla[indexInicial])) nuevaTabla[indexInicial] = [];
      nuevaTabla[indexInicial] = [...nuevaTabla[indexInicial], clave];
    } else if (metodoColision === "encadenamiento") {
      if (!nuevaTabla[indexInicial]) nuevaTabla[indexInicial] = { tipo: "encadenamiento", valores: [] };
      nuevaTabla[indexInicial].valores = [...nuevaTabla[indexInicial].valores, clave];
    } else {
      let index = indexInicial;
      if (nuevaTabla[index] !== null) {
        index = resolverColision(indexInicial, clave);
        if (index === -1) {
          alert("⚠️ La tabla está llena, no se pudo insertar");
          return;
        }
      }
      nuevaTabla[index] = clave;
    }

    setTabla(nuevaTabla);
    setUltimoInsertado(indexInicial);
    setClave("");
    setResultadoBusqueda(null);
    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones, metodoColision });
    setTimeout(() => setUltimoInsertado(null), 1500);
  };

  const buscarClave = () => {
    if (!clave) return alert("Ingresa una clave para buscar");
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
    const posCalculada = hash(clave);
    setResultadoBusqueda(`❌ La clave ${clave} NO se encontró (posición esperada: ${posCalculada + 1})`);
    setUltimoInsertado(posCalculada);
    setTimeout(() => setUltimoInsertado(null), 1500);
  };

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
      nuevaTabla[index] = null;
    }
    setTabla(nuevaTabla);
    onDataChange?.(nuevaTabla, { tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones, metodoColision });
  };

  const guardarArchivo = () => {
    const nombreArchivo = prompt("Nombre para el archivo (sin extensión):");
    if (!nombreArchivo) return;
    const data = { nombre: nombreArchivo, tamanoClave, rangoMin, rangoMax, tamanoEstructura, posiciones, metodoColision, valores: tabla };
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
        if (!data || !Array.isArray(data.valores)) return alert("Archivo inválido");
        setTabla(data.valores);
        setTamanoClave(Number(data.tamanoClave) || 4);
        setRangoMin(Number(data.rangoMin) || 0);
        setRangoMax(Number(data.rangoMax) || 9999);
        setTamanoEstructura(Number(data.tamanoEstructura) || data.valores.length || 5);
        setPosiciones(data.posiciones || "12");
        setMetodoColision(data.metodoColision || "lineal");
        onDataChange?.(data.valores, data);
      } catch (err) {
        alert("Error al leer el archivo");
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="contenedor">
      <h3>🔑 Función de Truncamiento</h3>

      {/* Ecuación */}
      <div style={{
        marginBottom: "15px",
        fontWeight: "bold",
        color: "#131212ff",
        backgroundColor: "#e9d0e9ff",
        padding: "8px 12px",
        borderRadius: "8px",
        display: "inline-block"
      }}>
        {`h(k) = elegir_dig (d1, d2, ..., dn)+1`}
      </div>

      {/* Configuración */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "15px", marginBottom: "15px" }}>
        <div>
          <label>Método de Colisión:</label><br />
          <select value={metodoColision} onChange={(e) => setMetodoColision(e.target.value)}
            style={{ width: "180px", padding: "4px", borderRadius: "5px" }}>
            <option value="lineal">Prueba Lineal</option>
            <option value="cuadratica">Prueba Cuadrática</option>
            <option value="doble-hash">Doble Hash</option>
            <option value="anidado">Arreglo Anidado</option>
            <option value="encadenamiento">Encadenamiento</option>
          </select>
        </div>

        <div>
          <label>Tamaño de la estructura:</label><br />
          <input type="number" value={tamanoEstructura} min="1"
            onChange={(e) => { const n = parseInt(e.target.value); setTamanoEstructura(n); setTabla(Array(n).fill(null)); }}
            style={{ width: "100px", padding: "4px", borderRadius: "5px" }} />
        </div>

        <div>
          <label>Tamaño de la clave:</label><br />
          <input type="number" value={tamanoClave} min="1"
            onChange={(e) => setTamanoClave(parseInt(e.target.value))}
            style={{ width: "100px", padding: "4px", borderRadius: "5px" }} />
        </div>

        <div>
          <label>Rango:</label><br />
          <input type="number" value={rangoMin} onChange={(e) => setRangoMin(parseInt(e.target.value))}
            style={{ width: "70px", padding: "4px", borderRadius: "5px" }} /> -
          <input type="number" value={rangoMax} onChange={(e) => setRangoMax(parseInt(e.target.value))}
            style={{ width: "70px", padding: "4px", borderRadius: "5px", marginLeft: "4px" }} />
        </div>

        <div>
          <label>Dígitos a truncar:</label><br />
          <input type="text" value={posiciones} onChange={(e) => setPosiciones(e.target.value)}
            style={{ width: "100px", padding: "4px", borderRadius: "5px" }} />
        </div>
      </div>

      {/* Input clave + botones */}
      <div style={{ marginBottom: "10px" }}>
        <input type="text" value={clave} onChange={(e) => setClave(e.target.value)}
          placeholder={`Clave (${tamanoClave} dígitos)`} maxLength={tamanoClave}
          className="input-clave" />
        <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
        <button onClick={buscarClave} className="boton" style={{ marginLeft: "10px" }}>🔍 Buscar</button>
      </div>

      {/* Resultado búsqueda */}
      {resultadoBusqueda && <div className="resultado-busqueda">{resultadoBusqueda}</div>}

      {/* Clave analizada con resaltado */}
      {ultimaClave && (
        <div style={{ marginTop: "15px", fontSize: "18px", display: "flex", justifyContent: "center", gap: "2px" }}>
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

      {/* Tabla de slots */}
      <div className="contenedor-slots" style={{ marginTop: "15px" }}>
        {tabla.map((valor, i) => {
          const valores = valor?.tipo === "encadenamiento" ? valor.valores : Array.isArray(valor) ? valor : valor ? [valor] : [];
          return (
            <div key={i} className={`slot ${valor ? "ocupado" : "vacio"}`}
              style={{ borderColor: i === ultimoInsertado ? "#2ecc71" : "#ccc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", padding: "2px 4px" }}>
                <span className="indice">{i + 1}</span>
                {valores.length > 0 && valores.map((v, idx) => (
                  <button key={idx} className="boton_borrar" onClick={() => borrarClave(i, v)}>🗑</button>
                ))}
              </div>
              <div style={{ marginTop: "4px", textAlign: "center", fontWeight: "bold" }}>
                {valores.length > 0 ? valores.join(", ") : "__"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Guardar / Cargar / Volver */}
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
