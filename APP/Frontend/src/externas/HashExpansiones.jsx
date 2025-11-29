// src/externas/HashExpansiones.jsx
import React, { useState, useEffect } from "react";
import "../App.css";
import "./externas.css";

export default function HashExpansiones({ onBack }) {
  const [n, setN] = useState("");
  const [r, setR] = useState("");
  const [tamanoClave, setTamanoClave] = useState("");
  const [densidadOcupacion, setDensidadOcupacion] = useState("");
  const [densidadReduccion, setDensidadReduccion] = useState("");
  const [tipoExpansion, setTipoExpansion] = useState("");
  const [estructura, setEstructura] = useState([]);
  const [estructuraAnterior, setEstructuraAnterior] = useState(null);
  const [clave, setClave] = useState("");
  const [resultado, setResultado] = useState("");
  const [bloquearConfig, setBloquearConfig] = useState(false);
  const [ocupadas, setOcupadas] = useState(0);
  const [libres, setLibres] = useState(0);
  const [estructuraInicialCreada, setEstructuraInicialCreada] = useState(false);

  // Crear estructura inicial automáticamente (solo la primera vez)
  useEffect(() => {
    if (
      !estructuraInicialCreada &&
      n &&
      r &&
      tamanoClave &&
      densidadOcupacion &&
      densidadReduccion &&
      tipoExpansion
    ) {
      const nuevaEstructura = Array.from({ length: Number(r) }, () =>
        Array(Number(n)).fill(null)
      );
      setEstructura(nuevaEstructura);
      setEstructuraAnterior(null);
      setResultado("✅ Estructura inicial creada automáticamente.");
      setEstructuraInicialCreada(true);
    }
  }, [
    n,
    r,
    tamanoClave,
    densidadOcupacion,
    densidadReduccion,
    tipoExpansion,
    estructuraInicialCreada,
  ]);

  const totalCeldas = Number(n) * Number(r) || 0;

  const hashMod = (k, baseN = n) => k % baseN;

  const calcularOcupacion = (estructuraNueva, baseN = n, baseR = r) => {
    let count = 0;
    estructuraNueva.forEach((fila) =>
      fila.forEach((celda) => {
        if (celda !== null) count++;
      })
    );
    const ocupacionActual = (count / (baseN * baseR)) * 100;
    setOcupadas(count);
    setLibres(baseN * baseR - count);
    return ocupacionActual;
  };

  const agregarClave = () => {
    if (!clave || !/^\d+$/.test(clave))
      return alert("Ingrese una clave numérica válida.");

    if (!bloquearConfig) setBloquearConfig(true);

    const k = parseInt(clave, 10);

    // 🔍 1) Verificar si la clave ya existe (NO permitir duplicados)
    for (let i = 0; i < estructura.length; i++) {
      for (let j = 0; j < estructura[i].length; j++) {
        if (estructura[i][j] === k) {
          alert(`La clave ${k} ya existe en la estructura.`);
          return;
        }
      }
    }

    let estructuraCopia = estructura.map(fila => [...fila]);
    const col = k % n;
    let insertado = false;

    // 2️⃣ Intentar insertar en su columna
    for (let i = 0; i < Number(r); i++) {
      if (estructuraCopia[i][col] === null) {
        estructuraCopia[i][col] = k;
        insertado = true;
        break;
      }
    }

    if (!insertado) {
      alert("No hay espacio disponible en esta columna.");
      return;
    }

    // 3️⃣ Calcular D.O. después de insertar
    const densidadActual = calcularOcupacion(estructuraCopia);

    // 4️⃣ Detectar si debe expandir
    if (densidadActual >= Number(densidadOcupacion)) {
      const clavesAntiguas = estructuraCopia.flat().filter(v => v !== null);

      const nuevaN =
        tipoExpansion === "total" ? Number(n) * 2 : Number(n) + 1;

      const nuevaR =
        tipoExpansion === "total" ? Number(r) * 2 : Number(r);

      const nuevaEstructura = Array.from({ length: nuevaR }, () =>
        Array(nuevaN).fill(null)
      );

      // 5️⃣ Reinsertar TODAS las claves
      clavesAntiguas.forEach(valor => {
        const nuevaCol = valor % nuevaN;
        for (let i = 0; i < nuevaR; i++) {
          if (nuevaEstructura[i][nuevaCol] === null) {
            nuevaEstructura[i][nuevaCol] = valor;
            break;
          }
        }
      });

      // 6️⃣ Actualizar estructuras
      setEstructuraAnterior(estructuraCopia);
      setEstructura(nuevaEstructura);
      setN(nuevaN);
      setR(nuevaR);
      setResultado(
        `⚙️ Expansión ${tipoExpansion} realizada. Reinserción de ${clavesAntiguas.length} claves.`
      );
      calcularOcupacion(nuevaEstructura);
    } else {
      // 7️⃣ Inserción normal
      setEstructura(estructuraCopia);
      setResultado(
        `✅ Clave ${k} insertada correctamente. D.O. = ${densidadActual.toFixed(2)}%`
      );
    }

    setClave("");
  };





  const borrarClave = () => {
    if (!clave) return alert("Ingrese una clave para eliminar.");
    const estructuraCopia = estructura.map((fila) => [...fila]);
    let encontrada = false;

    for (let i = 0; i < estructuraCopia.length; i++) {
      for (let j = 0; j < estructuraCopia[i].length; j++) {
        if (estructuraCopia[i][j] === parseInt(clave, 10)) {
          estructuraCopia[i][j] = null;
          encontrada = true;
          break;
        }
      }
      if (encontrada) break;
    }

    if (!encontrada) return alert("La clave no existe.");

    const densidad = calcularOcupacion(estructuraCopia);
    if (densidad <= Number(densidadReduccion)) {
      const nuevaN =
        tipoExpansion === "total" ? Math.max(1, Math.floor(n / 2)) : Math.max(1, n - 1);
      const nuevaR =
        tipoExpansion === "total" ? Math.max(1, Math.floor(r / 2)) : r;
      const nuevaEstructura = Array.from({ length: nuevaR }, () =>
        Array(nuevaN).fill(null)
      );

      estructuraCopia.flat().forEach((valor) => {
        if (valor !== null) {
          const nuevaCol = hashMod(valor, nuevaN);
          for (let i = 0; i < nuevaR; i++) {
            if (nuevaEstructura[i][nuevaCol] === null) {
              nuevaEstructura[i][nuevaCol] = valor;
              break;
            }
          }
        }
      });

      setEstructuraAnterior(estructura.map((f) => [...f]));
      setEstructura(nuevaEstructura);
      setEstructuraInicialCreada(true);
      setN(nuevaN);
      setR(nuevaR);
      setResultado(`♻️ Reducción ${tipoExpansion} realizada.`);
    } else {
      setEstructura(estructuraCopia);
      setResultado(
        `🗑 Clave ${clave} eliminada. D.O. = ${densidad.toFixed(2)}%`
      );
    }
    setClave("");
  };

  const vaciar = () => {
    setEstructura([]);
    setEstructuraAnterior(null);
    setResultado("Estructura vaciada.");
    setN("");
    setR("");
    setTamanoClave("");
    setDensidadOcupacion("");
    setDensidadReduccion("");
    setTipoExpansion("");
    setBloquearConfig(false);
    setEstructuraInicialCreada(false);
  };
  const guardarArchivo = () => {
    const nombre = prompt("Nombre del archivo (sin extensión):");
    if (!nombre) return;

    const data = {
      n,
      r,
      tamanoClave,
      densidadOcupacion,
      densidadReduccion,
      tipoExpansion,
      estructura,
      estructuraAnterior,
      ocupar: ocupadas,
      libres
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const cargarArchivo = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const lector = new FileReader();

    lector.onload = (evento) => {
      try {
        const data = JSON.parse(evento.target.result);

        setN(data.n || "");
        setR(data.r || "");
        setTamanoClave(data.tamanoClave || "");
        setDensidadOcupacion(data.densidadOcupacion || "");
        setDensidadReduccion(data.densidadReduccion || "");
        setTipoExpansion(data.tipoExpansion || "");

        setEstructura(data.estructura || []);
        setEstructuraAnterior(data.estructuraAnterior || null);

        setOcupadas(data.ocupar || 0);
        setLibres(data.libres || 0);

        setEstructuraInicialCreada(true);
        setBloquearConfig(true);

        setResultado("📂 Archivo cargado correctamente.");

      } catch (error) {
        alert("Error al cargar archivo: formato inválido.");
      }
    };

    lector.readAsText(archivo);
    e.target.value = "";
  };


  const renderEstructura = (estructura, titulo) => (
    <div className="bloque">
      <div className="titulo-bloque">{titulo}</div>
      <table className="tabla-estructura">
        <thead>
          <tr>
            <th></th>
            {estructura[0]?.map((_, j) => (
              <th key={j}>{j}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {estructura.map((fila, i) => (
            <tr key={i}>
              <th>{i + 1}</th>
              {fila.map((celda, j) => (
                <td key={j} className={celda ? "celda ocupado" : "celda libre"}>
                  {celda ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="contenedor-secuencial">
      <h3> Expansiones y Reducciones Hash (Función: Módulo)</h3>

      <div className="opciones">
        <div className="campo">
          <label>Tamaño estructura (n):</label>
          <input
            type="number"
            value={n}
            onChange={(e) => setN(e.target.value)}
            disabled={bloquearConfig}
          />
        </div>
        <div className="campo">
          <label>Registros (r):</label>
          <input
            type="number"
            value={r}
            onChange={(e) => setR(e.target.value)}
            disabled={bloquearConfig}
          />
        </div>
        <div className="campo">
          <label>Tamaño clave:</label>
          <input
            type="number"
            value={tamanoClave}
            onChange={(e) => setTamanoClave(e.target.value)}
            disabled={bloquearConfig}
          />
        </div>
        <div className="campo">
          <label>D.O (%):</label>
          <input
            type="number"
            value={densidadOcupacion}
            onChange={(e) => setDensidadOcupacion(e.target.value)}
            disabled={bloquearConfig}
          />
        </div>
        <div className="campo">
          <label>D.R (%):</label>
          <input
            type="number"
            value={densidadReduccion}
            onChange={(e) => setDensidadReduccion(e.target.value)}
            disabled={bloquearConfig}
          />
        </div>
        <div className="campo">
          <label>Tipo expansión:</label>
          <select
            value={tipoExpansion}
            onChange={(e) => setTipoExpansion(e.target.value)}
            disabled={bloquearConfig}
          >
            <option value="">Selecciona</option>
            <option value="total">Total</option>
            <option value="parcial">Parcial</option>
          </select>
        </div>
        <div className="campo">
          <label>Función hash:</label>
          <select value="mod" disabled>
            <option value="mod">Módulo</option>
          </select>
        </div>
      </div>

      <div className="panel-controles">
        <label>Clave:</label>
        <input
          type="text"
          value={clave}
          onChange={(e) => setClave(e.target.value)}
        />
        <button onClick={agregarClave} className="boton_agregar">
          ➕ Insertar
        </button>
        <button onClick={borrarClave} className="boton eliminar">
          ✖️ Eliminar
        </button>
        <button onClick={vaciar} className="boton">
          ♻ Vaciar
        </button>
      </div>

      {resultado && <p className="resultado">{resultado}</p>}
      <p>
        📊 Ocupadas: {ocupadas} | Libres: {libres}
      </p>

      {estructuraAnterior &&
        renderEstructura(estructuraAnterior, "Estructura anterior")}
      {estructura.length > 0 &&
        renderEstructura(estructura, "Estructura actual")}

      <div className="panel-archivos">
        <button className="boton" onClick={guardarArchivo}>💾 Guardar</button>

        <label className="boton">
          📂 Cargar
          <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
        </label>
        <button onClick={onBack} className="boton">
          ⬅ Volver
        </button>
      </div>
    </div>
  );
}
