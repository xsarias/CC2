// HashTruncamiento.js
import React, { useState, useEffect } from "react";
import "../App.css";
import "./IngresarDatos.css";

export default function HashTruncamiento({ onDataChange, onBack }) {
  const [tabla, setTabla] = useState(Array(5).fill(null));
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState(4);
  const [tamanoEstructura, setTamanoEstructura] = useState(5);
  const [posiciones, setPosiciones] = useState("12");
  const [ultimaClave, setUltimaClave] = useState(null);
  const [ultimosDigitos, setUltimosDigitos] = useState([]);
  const [ultimoInsertado, setUltimoInsertado] = useState(null);
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [metodoColision, setMetodoColision] = useState("lineal");

  // Actualiza la tabla si cambia el tamaño
  useEffect(() => {
    setTabla((prev) => {
      const n = Number(tamanoEstructura) || 5;
      const nueva = new Array(n).fill(null);
      for (let i = 0; i < Math.min(prev.length, nueva.length); i++) nueva[i] = prev[i];
      return nueva;
    });
  }, [tamanoEstructura]);

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

  const existeClave = (key) => tabla.includes(key);

  const resolverColision = (indexInicial, claveStr) => {
    let index = indexInicial;
    let i = 1;

    if (metodoColision === "lineal") {
      while (tabla[index] !== null) {
        index = (indexInicial + i) % tamanoEstructura;
        i++;
        if (i > tamanoEstructura) return -1;
      }
    } else if (metodoColision === "cuadratica") {
      while (tabla[index] !== null) {
        index = (indexInicial + i * i) % tamanoEstructura;
        i++;
        if (i > tamanoEstructura) return -1;
      }
    } else if (metodoColision === "doble-hash") {
      const parsed = parseInt(claveStr, 10) || 1;
      const step = 1 + (parsed % (tamanoEstructura - 1 || 1));
      while (tabla[index] !== null) {
        index = (indexInicial + i * step) % tamanoEstructura;
        i++;
        if (i > tamanoEstructura) return -1;
      }
    }

    return index;
  };

  const agregarClave = () => {
    if (!clave) return alert("Ingresa una clave");
    if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");
    if (clave.length !== tamanoClave)
      return alert(`La clave debe tener exactamente ${tamanoClave} dígitos`);

    if (existeClave(clave)) return alert(`❌ La clave ${clave} ya existe.`);

    const indexBase = hash(clave);
    let indexFinal = indexBase;

    if (tabla[indexBase] !== null) {
      indexFinal = resolverColision(indexBase, clave);
      if (indexFinal === -1) return alert("Tabla llena, no se pudo insertar");
    }

    const nueva = [...tabla];
    nueva[indexFinal] = clave;
    setTabla(nueva);
    setUltimoInsertado(indexFinal);
    setResultadoBusqueda(`✅ Insertada ${clave} en índice ${indexFinal + 1}`);
    setClave("");
    setTimeout(() => setUltimoInsertado(null), 1200);

    onDataChange?.(nueva, { tamanoClave, tamanoEstructura, posiciones, metodoColision });
  };

  const buscarClave = () => {
    if (!clave) return alert("Ingresa una clave para buscar.");
    const idx = tabla.indexOf(clave);
    if (idx === -1)
      setResultadoBusqueda(`❌ La clave ${clave} no se encontró`);
    else {
      setResultadoBusqueda(`✅ La clave ${clave} se encontró en índice ${idx + 1}`);
      setUltimoInsertado(idx);
      setTimeout(() => setUltimoInsertado(null), 1200);
    }
  };

  const borrarClave = () => {
    if (!clave) return alert("Ingresa una clave para eliminar.");
    const idx = tabla.indexOf(clave);
    if (idx === -1) return alert("❌ La clave no existe.");

    const nueva = [...tabla];
    nueva[idx] = null;
    setTabla(nueva);
    setResultadoBusqueda(`🗑 Clave ${clave} eliminada`);
    setClave("");
  };

  const vaciar = () => {
    setTabla(Array(tamanoEstructura).fill(null));
    setResultadoBusqueda("♻ Tabla vaciada");
    setClave("");
  };

  const guardarArchivo = () => {
    const nombre = prompt("Nombre del archivo (sin extensión):");
    if (!nombre) return;
    const data = { tamanoClave, tamanoEstructura, posiciones, metodoColision, tabla };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cargarArchivo = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setTamanoClave(Number(data.tamanoClave) || 4);
        setTamanoEstructura(Number(data.tamanoEstructura) || 5);
        setPosiciones(data.posiciones || "12");
        setMetodoColision(data.metodoColision || "lineal");
        setTabla(data.tabla || Array(5).fill(null));
      } catch (err) {
        alert("Error al cargar archivo");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // --- Tabla dinámica (solo muestra posiciones relevantes) ---
  const renderTabla = () => {
    const n = Number(tamanoEstructura);
    const indices = new Set([0, n - 1]);
    tabla.forEach((v, i) => {
      if (v !== null) indices.add(i);
    });

    const lista = Array.from(indices).sort((a, b) => a - b);

    return (
      <table className="tabla-estructura">
        <thead>
          <tr>
            <th>Posición</th>
            <th>Clave</th>
          </tr>
        </thead>
        <tbody>
          {lista.map((i) => (
            <tr key={i} className={i === ultimoInsertado ? "nueva-fila" : ""}>
              <td>{i + 1}</td>
              <td>{tabla[i] || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="contenedor">
      <h3>🔑 Función de Truncamiento</h3>
      <div className="ecuacion">h(k) = seleccionar_dígitos(d₁, d₂, ...)+1</div>

      <div className="opciones">
        <div className="campo">
          <label>Método de colisión:</label>
          <select value={metodoColision} onChange={(e) => setMetodoColision(e.target.value)}>
            <option value="lineal">Lineal</option>
            <option value="cuadratica">Cuadrática</option>
            <option value="doble-hash">Doble hash</option>
          </select>
        </div>

        <div className="campo">
          <label>Tamaño estructura (n):</label>
          <input
            type="number"
            min="2"
            value={tamanoEstructura}
            onChange={(e) => setTamanoEstructura(Number(e.target.value))}
          />
        </div>

        <div className="campo">
          <label>Tamaño clave (dígitos):</label>
          <input
            type="number"
            min="1"
            value={tamanoClave}
            onChange={(e) => setTamanoClave(Number(e.target.value))}
          />
        </div>

        <div className="campo">
          <label>Dígitos a truncar:</label>
          <input
            type="text"
            value={posiciones}
            onChange={(e) => setPosiciones(e.target.value)}
          />
        </div>
      </div>

      <div className="panel-controles">
        <label>Clave:</label>
        <input
          type="text"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
          placeholder={`(${tamanoClave} dígitos)`}
        />
        <button onClick={agregarClave} className="boton_agregar">➕ Insertar</button>
        <button onClick={buscarClave} className="boton">🔍 Buscar</button>
        <button onClick={borrarClave} className="boton eliminar">🗑 Eliminar</button>
        <button onClick={vaciar} className="boton">♻ Vaciar</button>
      </div>

      {ultimaClave && (
        <div style={{ marginTop: "10px", fontSize: "18px" }}>
          {ultimaClave.split("").map((d, i) => (
            <span key={i} style={{
              padding: "2px 4px",
              backgroundColor: ultimosDigitos.includes(i) ? "#ffcc00" : "transparent",
              borderRadius: "4px",
              fontWeight: ultimosDigitos.includes(i) ? "bold" : "normal",
            }}>{d}</span>
          ))}
        </div>
      )}

      {resultadoBusqueda && <p className="resultado">{resultadoBusqueda}</p>}
      <div className="tabla-container">{renderTabla()}</div>

      <div className="botones-archivo">
        <button onClick={guardarArchivo} className="boton">💾 Guardar</button>
        <label className="boton">
          📂 Cargar
          <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
        </label>
        <button onClick={() => onBack?.()} className="boton">⬅ Volver</button>
      </div>
    </div>
  );
}
