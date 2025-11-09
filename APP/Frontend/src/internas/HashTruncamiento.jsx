import React, { useState, useEffect } from "react";
import "../App.css";
import "./IngresarDatos.css";
import Colisiones from "./Colisiones";

export default function HashTruncamiento({ onDataChange, onBack }) {
  const [tabla, setTabla] = useState(Array(10).fill(null));
  const [clave, setClave] = useState("");
  const [tamanoClave, setTamanoClave] = useState("");
  const [tamanoEstructura, setTamanoEstructura] = useState("");
  const [posiciones, setPosiciones] = useState("");
  const [metodoColision, setMetodoColision] = useState("");
  const [resultadoBusqueda, setResultadoBusqueda] = useState(null);
  const [resaltadoTemporal, setResaltadoTemporal] = useState(null);
  const [ultimoInsertado, setUltimoInsertado] = useState(null);
  const [configBloqueada, setConfigBloqueada] = useState(false);
  const [recorrido, setRecorrido] = useState([]);
  const [ultimosDigitos, setUltimosDigitos] = useState([]);
  const [ultimaClave, setUltimaClave] = useState("");

  // --- Actualiza tabla al cambiar tamaño ---
  useEffect(() => {
    setTabla((prev) => {
      const n = Number(tamanoEstructura) || 10;
      const nueva = new Array(n).fill(null);
      for (let i = 0; i < Math.min(prev.length, nueva.length); i++) nueva[i] = prev[i];
      return nueva;
    });
  }, [tamanoEstructura]);

  // --- Hash truncamiento ---
  const hashTruncamiento = (num) => {
    const str = num.toString();
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

    const numExtraido = parseInt(extraido, 10) || num;
    return numExtraido % tamanoEstructura;
  };

  // --- Insertar ---
  const agregarClave = () => {
    if (!tamanoEstructura || !tamanoClave || !metodoColision)
      return alert("⚙️ Primero configura el tamaño, los dígitos y el método de colisión.");
    if (!clave) return alert("Ingresa una clave.");
    if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica.");
    if (clave.length !== Number(tamanoClave))
      return alert(`La clave debe tener exactamente ${tamanoClave} dígitos.`);

    const claveNum = parseInt(clave, 10);
    const indexBase = hashTruncamiento(claveNum);

    if (Colisiones.claveExiste(tabla, claveNum))
      return alert(`La clave ${claveNum} ya existe.`);

    const tablaCopia = tabla.slice();
    const indexFinal = Colisiones.resolver(tablaCopia, indexBase, claveNum, metodoColision, tamanoEstructura);

    if (indexFinal === null)
      return alert("❌ No se pudo insertar: tabla llena o sin espacio con ese método.");

    if (!configBloqueada) setConfigBloqueada(true);

    setTabla(tablaCopia);
    setUltimoInsertado(indexFinal);
    setResultadoBusqueda(`✅ Insertada ${claveNum} en índice ${indexFinal + 1}`);
    setResaltadoTemporal({ index: indexFinal, valor: claveNum, tipo: "insertar" });
    setClave("");

    setTimeout(() => setResaltadoTemporal(null), 1200);
    setTimeout(() => setUltimoInsertado(null), 1400);

    if (onDataChange)
      onDataChange(tablaCopia, { tamanoClave, tamanoEstructura, metodoColision });
  };

  // --- Buscar ---
  const buscarClave = async () => {
    if (!clave) return alert("Ingresa una clave para buscar.");
    if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");

    const claveNum = parseInt(clave, 10);
    const indexBase = hashTruncamiento(claveNum);
    const resultado = Colisiones.buscarClave(tabla, claveNum, metodoColision, tamanoEstructura, true, indexBase);
    const { encontrado, indice, pasos } = resultado;

    setRecorrido(pasos);

    for (let paso of pasos) {
      const index = typeof paso === "object" ? paso.index : paso;
      const valor = typeof paso === "object" ? paso.valor : null;

      setResaltadoTemporal({ index, valor, tipo: "buscar" });
      await new Promise((r) => setTimeout(r, 500));
    }

    setResaltadoTemporal(null);
    setRecorrido([]);

    if (encontrado) {
      setResultadoBusqueda(`✅ La clave ${claveNum} se encontró en índice ${indice + 1}`);
      setResaltadoTemporal({ index: indice, valor: claveNum, tipo: "encontrado" });
      setTimeout(() => setResaltadoTemporal(null), 1000);
    } else {
      setResultadoBusqueda(`❌ La clave ${claveNum} NO se encontró`);
    }
  };

  // --- Eliminar ---
  const borrarClave = async () => {
    if (!clave) return alert("Ingresa una clave para eliminar.");
    if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica");

    const claveNum = parseInt(clave, 10);
    const indexBase = hashTruncamiento(claveNum);
    const resultado = Colisiones.buscarClave(tabla, claveNum, metodoColision, tamanoEstructura, true, indexBase);
    const { encontrado, indice, pasos } = resultado;

    if (!encontrado) return alert("❌ La clave no existe.");

    setRecorrido(pasos);
    for (let paso of pasos) {
      const index = typeof paso === "object" ? paso.index : paso;
      const valor = typeof paso === "object" ? paso.valor : null;
      setResaltadoTemporal({ index, valor, tipo: "buscar" });
      await new Promise((r) => setTimeout(r, 500));
    }

    setResaltadoTemporal({ index: indice, valor: claveNum, tipo: "eliminar" });

    setTimeout(() => {
      const tablaCopia = tabla.slice();
      const ok = Colisiones.borrarClave(tablaCopia, claveNum);
      if (!ok) return alert("Error al eliminar");

      setTabla(tablaCopia);
      setResaltadoTemporal(null);
      setResultadoBusqueda(`🗑 Clave ${claveNum} eliminada del índice ${indice + 1}`);
      setClave("");
      if (onDataChange)
        onDataChange(tablaCopia, { tamanoClave, tamanoEstructura, metodoColision });
    }, 1000);
  };

  // --- Vaciar ---
  const vaciar = () => {
    setTabla(Array(Number(tamanoEstructura || 10)).fill(null));
    setResultadoBusqueda("♻ Tabla vaciada");
    setClave("");
    setConfigBloqueada(false);
    setMetodoColision("");
    setTamanoClave("");
    setTamanoEstructura("");
    setPosiciones("");
  };
  // --- Guardar ---
  const guardarArchivo = () => {
    const nombre = prompt("Nombre para guardar (sin extensión):");
    if (!nombre) return;
    const data = {
      tabla,
      tamanoClave,
      tamanoEstructura,
      metodoColision,
      posiciones,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // --- Cargar ---
  const cargarArchivo = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = JSON.parse(e.target.result);
      setTabla(data.tabla || []);
      setTamanoClave(data.tamanoClave || "");
      setTamanoEstructura(data.tamanoEstructura || "");
      setMetodoColision(data.metodoColision || "");
      setPosiciones(data.posiciones || "");
      setConfigBloqueada(true);
      setResultadoBusqueda("📂 Archivo cargado correctamente");
    };
    reader.readAsText(file);
  };
  const renderTabla = () => {
    const n = Number(tamanoEstructura);
    const indices = new Set([0, n - 1]);
    tabla.forEach((slot, i) => {
      if (slot != null) indices.add(i);
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
          {lista.map((i) => {
            const slot = tabla[i];
            let contenido = null;

            // CASO 1: Celda vacía
            if (slot == null) contenido = "";

            // CASO 2: Método "arreglos"
            else if (Array.isArray(slot)) {
              contenido = (
                <div className="arreglo-celda">
                  <span className="corchete">[</span>
                  {slot.map((v, idxA) => {
                    const esResaltado =
                      resaltadoTemporal &&
                      resaltadoTemporal.index === i &&
                      resaltadoTemporal.valor === v;
                    return (
                      <React.Fragment key={idxA}>
                        <div
                          className={`bloque-arreglo ${esResaltado
                            ? resaltadoTemporal.tipo === "buscar"
                              ? "resaltado-busqueda"
                              : resaltadoTemporal.tipo === "eliminar"
                                ? "resaltado-eliminar"
                                : "bloque-aparecer resaltado-insercion"
                            : ""
                            }`}
                        >
                          {v}
                        </div>
                        {idxA < slot.length - 1 && <span className="coma">,</span>}
                      </React.Fragment>
                    );
                  })}
                  <span className="corchete">]</span>
                </div>
              );
            }

            // CASO 3: Método "encadenamiento" (Nodo o estructura enlazada)
            else if (slot && (slot.valor !== undefined || slot.next)) {
              let nodos = [];
              let nodo = slot;
              while (nodo) {
                nodos.push(nodo.valor);
                nodo = nodo.next;
              }

              contenido = (
                <div className="encadenamiento-celda">
                  {nodos.map((v, idxN) => {
                    const esResaltado =
                      resaltadoTemporal &&
                      resaltadoTemporal.index === i &&
                      resaltadoTemporal.valor === v;
                    return (
                      <div key={idxN} className="nodo-container">
                        <div
                          className={`nodo ${esResaltado
                            ? resaltadoTemporal.tipo === "buscar"
                              ? "resaltado-busqueda"
                              : resaltadoTemporal.tipo === "eliminar"
                                ? "resaltado-eliminar"
                                : "bloque-aparecer resaltado-insercion"
                            : ""
                            }`}
                        >
                          {v}
                        </div>
                        {idxN < nodos.length - 1 && <span className="flecha">→</span>}
                      </div>
                    );
                  })}
                </div>
              );
            }

            // CASO 4: Valor numérico simple
            else {
              const esResaltado =
                resaltadoTemporal &&
                resaltadoTemporal.index === i &&
                resaltadoTemporal.valor === slot;
              contenido = (
                <div
                  className={`bloque-simple ${esResaltado
                    ? resaltadoTemporal.tipo === "buscar"
                      ? "resaltado-busqueda"
                      : resaltadoTemporal.tipo === "eliminar"
                        ? "resaltado-eliminar"
                        : "bloque-aparecer resaltado-insercion"
                    : ""
                    }`}
                >
                  {slot}
                </div>
              );
            }

            return (
              <tr key={i} className={i === ultimoInsertado ? "nueva-fila" : ""}>
                <td>{i + 1}</td>
                <td>{contenido}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  };


  // --- Render principal ---
  return (
    <div className="contenedor">
      <h3>Función de Truncamiento</h3>
      <div className="ecuacion">h(k) = truncar_dígitos(k) + 1</div>

      <div className="opciones">
        <div className="campo">
          <label>Método de colisión:</label>
          <select
            value={metodoColision}
            onChange={(e) => setMetodoColision(e.target.value)}
            disabled={configBloqueada}
          >
            <option value="">Seleccione un método</option>
            <option value="lineal">Lineal</option>
            <option value="cuadratica">Cuadrática</option>
            <option value="doblehash">Doble hash</option>
            <option value="encadenamiento">Encadenamiento</option>
            <option value="arreglos">Arreglos</option>
          </select>
        </div>

        <div className="campo">
          <label>Tamaño estructura (n):</label>
          <input
            type="number"
            min="2"
            value={tamanoEstructura}
            onChange={(e) => setTamanoEstructura(Number(e.target.value))}
            disabled={configBloqueada}
          />
        </div>

        <div className="campo">
          <label>Tamaño clave (dígitos):</label>
          <input
            type="number"
            min="1"
            value={tamanoClave}
            onChange={(e) => setTamanoClave(Number(e.target.value))}
            disabled={configBloqueada}
          />
        </div>

        <div className="campo">
          <label>Posiciones a truncar:</label>
          <input
            type="text"
            value={posiciones}
            onChange={(e) => setPosiciones(e.target.value)}
            disabled={configBloqueada}
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
        <button onClick={borrarClave} className="boton eliminar">✖️ Eliminar</button>
        <button onClick={vaciar} className="boton">♻ Vaciar</button>
      </div>

      {ultimaClave && (
        <div style={{ marginTop: "10px", fontSize: "18px" }}>
          {ultimaClave.split("").map((d, i) => (
            <span
              key={i}
              style={{
                padding: "2px 4px",
                backgroundColor: ultimosDigitos.includes(i) ? "#ffcc00" : "transparent",
                borderRadius: "4px",
                fontWeight: ultimosDigitos.includes(i) ? "bold" : "normal",
              }}
            >
              {d}
            </span>
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
        <button onClick={() => onBack && onBack()} className="boton">⬅ Volver</button>
      </div>

    </div>
  );
}
