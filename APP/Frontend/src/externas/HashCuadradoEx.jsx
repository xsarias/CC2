// src/externas/HashCuadradoEx.jsx
import React, { useState, useEffect } from "react";
import "../App.css";
import "../internas/IngresarDatos.css";

export default function HashCuadradoEx({ onBack }) {
  const [tamano, setTamano] = useState();
  const [tamanoClave, setTamanoClave] = useState();
  const [clave, setClave] = useState("");

  const [metodoColision, setMetodoColision] = useState("");

  const [areaPrincipal, setAreaPrincipal] = useState([]);
  const [areaSecundaria, setAreaSecundaria] = useState([]);
  const [cubetas, setCubetas] = useState([]);

  const [bloqueActivo, setBloqueActivo] = useState(null);
  const [indiceLocalActivo, setIndiceLocalActivo] = useState(null);
  const [resultado, setResultado] = useState("");
  const [cubetaIndiceActivo, setCubetaIndiceActivo] = useState(null);
  const [secundariaIndiceActivo, setSecundariaIndiceActivo] = useState(null);
  const [archivoInputKey, setArchivoInputKey] = useState(Date.now());

  // flags para controlar cuándo bloquear regeneración
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [archivoCargado, setArchivoCargado] = useState(false);

  // defensivos: si tamano no es número válido, usar 1 para evitar div/0
  const raiz = Math.ceil(Math.sqrt(Number(tamano) || 1));
  const registrosPorBloque = Math.max(1, Math.ceil((Number(tamano) || 1) / raiz));

  // -----------------------------------------------------
  // GENERAR ÁREA PRINCIPAL (estructura esperada)
  // -----------------------------------------------------
  const generarAreaPrincipal = () => {
    const n = Number(tamano) || 0;
    const bloques = [];
    for (let i = 0; i < raiz; i++) {
      const datos = [];
      for (let j = 0; j < registrosPorBloque; j++) {
        const posReal = i * registrosPorBloque + j + 1;
        if (posReal <= n) datos.push({ posicion: posReal, clave: "" });
      }
      bloques.push({ id: i + 1, datos });
    }
    setAreaPrincipal(bloques);
  };

  // -----------------------------------------------------
  // Efecto al cambiar parámetros (no sobrescribir cuando cargamos)
  // -----------------------------------------------------
  useEffect(() => {
    if (!tamano) return;

    // si estamos en proceso de cargar → NO regenerar
    if (cargandoArchivo) return;

    // si ya cargamos un archivo completo → NO regenerar
    if (archivoCargado) return;

    // Si no hay área creada o el total de celdas no coincide con tamano → generar
    const totalActual = (areaPrincipal || []).reduce((acc, b) => acc + (b.datos?.length || 0), 0);

    if ((areaPrincipal || []).length === 0 || totalActual !== Number(tamano)) {
      generarAreaPrincipal();

      if (metodoColision === "cubetas") {
        setCubetas(Array(raiz).fill(null).map(() => []));
      } else {
        setCubetas([]);
      }

      setAreaSecundaria([]);
    }
  }, [tamano, metodoColision, cargandoArchivo, archivoCargado]);

  // -----------------------------------------------------
  // HASH CUADRADO (Middle Square -> extraccion middle digits +1)
  // -----------------------------------------------------
  const hash = (c) => {
    const k = Number(c);
    const square = k * k;

    const digitosN = String(tamano).length;
    let s = String(square);

    const required = digitosN + 2; // pad mínimo
    if (s.length < required) {
      s = s.padStart(required, "0");
    }

    const mid = Math.floor(s.length / 2);
    const left = mid - Math.floor(digitosN / 2);
    const middle = s.substring(left, left + digitosN);

    let pos = Number(middle) + 1;

    if (pos > tamano) pos = ((pos - 1) % tamano) + 1;

    return pos - 1;
  };

  // -----------------------------------------------------
  // INSERTAR
  // -----------------------------------------------------
  const insertar = async () => {
    if (!clave) return alert("Ingrese una clave.");
    if (!/^\d+$/.test(clave)) return alert("Clave numérica.");
    if (String(clave).length !== tamanoClave)
      return alert(`La clave debe tener ${tamanoClave} dígitos.`);

    // duplicado en principal
    for (const bloque of areaPrincipal) {
      for (const cel of bloque.datos) {
        if (cel.clave === clave) {
          alert("La clave ya existe en el área principal.");
          return;
        }
      }
    }

    // duplicado en secundaria (objeto { clave })
    if ((areaSecundaria || []).some((obj) => obj.clave === clave)) {
      alert("La clave ya existe en el área secundaria.");
      return;
    }

    // duplicado en cubetas
    if (metodoColision === "cubetas") {
      for (const cub of (cubetas || [])) {
        if (Array.isArray(cub) && cub.some((obj) => obj.clave === clave)) {
          alert("La clave ya existe en cubetas.");
          return;
        }
      }
    }

    const h = hash(clave);
    const bloqueIndex = Math.floor(h / registrosPorBloque);
    const posLocal = h % registrosPorBloque;

    // animación
    setBloqueActivo(bloqueIndex);
    setIndiceLocalActivo(posLocal);
    await new Promise((r) => setTimeout(r, 300));
    setTimeout(() => {
      setBloqueActivo(null);
      setIndiceLocalActivo(null);
    }, 600);

    const principalCopia = [...areaPrincipal];

    // insertar en principal si libre (protección con ?.)
    if (principalCopia[bloqueIndex]?.datos?.[posLocal] && principalCopia[bloqueIndex].datos[posLocal].clave === "") {
      principalCopia[bloqueIndex].datos[posLocal].clave = clave;
      setAreaPrincipal(principalCopia);
      setResultado(`Insertada en B${bloqueIndex + 1}, posición ${h + 1}`);
      return;
    }

    // colisión -> secundaria
    if (metodoColision === "secundaria") {
      setAreaSecundaria([...(areaSecundaria || []), { clave }]);
      setResultado(`Colisión → enviada a Área Secundaria`);
      return;
    }

    // colisión -> cubetas
    if (metodoColision === "cubetas") {
      const nuevas = [...(cubetas || [])];
      if (!Array.isArray(nuevas[bloqueIndex])) nuevas[bloqueIndex] = [];
      nuevas[bloqueIndex] = [...nuevas[bloqueIndex], { clave }];
      setCubetas(nuevas);
      setResultado(`Colisión → insertada en cubeta B${bloqueIndex + 1}`);
      return;
    }
  };

  // -----------------------------------------------------
  // BUSCAR
  // -----------------------------------------------------
  const buscar = async () => {
    if (!clave) return alert("Ingrese clave.");

    const h = hash(clave);
    const bloqueIndex = Math.floor(h / registrosPorBloque);
    const posLocal = h % registrosPorBloque;

    // reset visual
    setBloqueActivo(null);
    setIndiceLocalActivo(null);
    setCubetaIndiceActivo(null);
    setSecundariaIndiceActivo(null);

    await new Promise((r) => setTimeout(r, 50));

    setBloqueActivo(bloqueIndex);
    setIndiceLocalActivo(posLocal);
    setTimeout(() => {
      setBloqueActivo(null);
      setIndiceLocalActivo(null);
    }, 600);

    // principal
    if (areaPrincipal[bloqueIndex]?.datos?.[posLocal]?.clave === clave) {
      setResultado(`Encontrada en B${bloqueIndex + 1}, posición ${h + 1}`);
      return;
    }

    // secundaria
    if (metodoColision === "secundaria") {
      const idx = (areaSecundaria || []).findIndex((obj) => obj.clave === clave);
      if (idx !== -1) {
        setSecundariaIndiceActivo(idx);
        setTimeout(() => setSecundariaIndiceActivo(null), 600);
        setResultado(`Encontrada en Área Secundaria S${idx + 1}`);
        return;
      }
    }

    // cubetas
    if (metodoColision === "cubetas") {
      const lista = (cubetas || [])[bloqueIndex] || [];
      const idx = (lista || []).findIndex((obj) => obj.clave === clave);
      if (idx !== -1) {
        setCubetaIndiceActivo(idx);
        setTimeout(() => setCubetaIndiceActivo(null), 600);
        setResultado(`Encontrada en Colisión B${bloqueIndex + 1} pos ${idx + 1}`);
        return;
      }
    }

    setResultado("No encontrada.");
  };

  // -----------------------------------------------------
  // ELIMINAR
  // -----------------------------------------------------
  const eliminar = () => {
    if (!clave) return;

    const h = hash(clave);
    const bloqueIndex = Math.floor(h / registrosPorBloque);
    const posLocal = h % registrosPorBloque;

    // principal
    const copia = [...areaPrincipal];
    if (copia[bloqueIndex]?.datos?.[posLocal]?.clave === clave) {
      copia[bloqueIndex].datos[posLocal].clave = "";
      setAreaPrincipal(copia);
      setResultado("Eliminada del área principal.");
      return;
    }

    // secundaria
    const sec = [...(areaSecundaria || [])];
    const idxS = sec.findIndex((obj) => obj.clave === clave);
    if (idxS !== -1) {
      sec.splice(idxS, 1);
      setAreaSecundaria(sec);
      setResultado("Eliminada del área secundaria.");
      return;
    }

    // cubetas
    if (metodoColision === "cubetas") {
      const cub = [...(cubetas || [])];
      const lista = cub[bloqueIndex] || [];
      const idxC = lista.findIndex((obj) => obj.clave === clave);
      if (idxC !== -1) {
        cub[bloqueIndex].splice(idxC, 1);
        setCubetas(cub);
        setResultado("Eliminada de la cubeta.");
        return;
      }
    }

    setResultado("La clave no existe.");
  };

  // -----------------------------------------------------
  // Filtrado visual: muestra primera, última y ocupadas
  // -----------------------------------------------------
  const filtrarCeldas = (datos) => {
    const primera = 0;
    const ultima = datos.length - 1;
    const ocupadas = datos
      .map((d, i) => (d.clave !== "" ? i : null))
      .filter((i) => i !== null);

    const indices = [...new Set([primera, ultima, ...ocupadas])].sort((a, b) => a - b);
    return indices.map((i) => datos[i]);
  };

  const filtrarCubetas = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];
    const primera = 0;
    const ultima = arr.length - 1;
    const ocupadas = arr
      .map((c, i) => (Array.isArray(c) && c.length > 0 ? i : null))
      .filter((i) => i !== null);
    const indices = [...new Set([primera, ultima, ...ocupadas])].sort((a, b) => a - b);
    return indices.map((i) => ({ index: i, valores: arr[i] || [] }));
  };

  const debeMostrarBloque = (i) => {
    const cub = filtrarCubetas(cubetas).find((c) => c.index === i);
    const datosOcupados = !!areaPrincipal?.[i]?.datos?.some((d) => d.clave !== "");
    return i === 0 || i === areaPrincipal.length - 1 || datosOcupados || !!cub;
  };

  // -----------------------------------------------------
  // GUARDAR: normaliza antes de serializar (compatible HashMod/HashCuadrado)
  // -----------------------------------------------------
  const guardarArchivo = () => {
    const nombre = prompt("Nombre del archivo (sin extensión):");
    if (!nombre) return;

    try {
      // normalizar areaPrincipal
      const principalNorm = (areaPrincipal || []).map((bloque, bi) => {
        const datosRaw = bloque?.datos ?? [];
        const datos = (Array.isArray(datosRaw) ? datosRaw : []).map((cel, ci) => {
          if (typeof cel === "string") {
            return { posicion: bi * registrosPorBloque + ci + 1, clave: cel };
          }
          if (!cel || typeof cel !== "object") {
            return { posicion: bi * registrosPorBloque + ci + 1, clave: "" };
          }
          return {
            posicion: typeof cel.posicion === "number" ? cel.posicion : bi * registrosPorBloque + ci + 1,
            clave: cel.clave ?? ""
          };
        });

        return { id: bloque?.id ?? bi + 1, datos };
      });

      // normalizar secundaria
      const secundariaNorm = (areaSecundaria || []).map((it) => {
        if (typeof it === "string") return { clave: it };
        if (!it || typeof it !== "object") return { clave: "" };
        return { clave: it.clave ?? "" };
      });

      // normalizar cubetas: array por bloque
      const cubetasNorm = (cubetas || []).map((lista) =>
        (Array.isArray(lista) ? lista : []).map((it) => {
          if (typeof it === "string") return { clave: it };
          if (!it || typeof it !== "object") return { clave: "" };
          return { clave: it.clave ?? "" };
        })
      );

      const data = {
        tamano,
        tamanoClave,
        metodoColision,
        areaPrincipal: principalNorm,
        cubetas: cubetasNorm,
        areaSecundaria: secundariaNorm,
        fecha: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${nombre}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setResultado("📁 Archivo preparado para descarga.");
    } catch (err) {
      console.error(err);
      alert("Error al crear el archivo.");
    }
  };

  // -----------------------------------------------------
  // CARGAR: robusto, normaliza y evita que useEffect borre lo cargado
  // -----------------------------------------------------
  const cargarArchivo = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    // bloqueo inmediato para que el useEffect no regenere mientras procesamos
    setCargandoArchivo(true);
    setArchivoCargado(false);

    const lector = new FileReader();

    lector.onload = (evento) => {
      try {
        const data = JSON.parse(evento.target.result);

        if (!data || typeof data !== "object" || !Array.isArray(data.areaPrincipal)) {
          alert("Archivo inválido: estructura no reconocida.");
          return;
        }

        const nuevoTamano = data.tamano ?? tamano;
        const nuevoTamanoClave = data.tamanoClave ?? tamanoClave;
        const nuevoMetodo = data.metodoColision ?? metodoColision;

        const nuevaRaiz = Math.ceil(Math.sqrt(Number(nuevoTamano) || 1));
        const nuevosRegistrosPorBloque = Math.max(1, Math.ceil((Number(nuevoTamano) || 1) / nuevaRaiz));

        // normalizar areaPrincipal (asegura posicion y claves)
        const principalNormalized = (data.areaPrincipal || []).map((bloque, bi) => {
          const datosRaw = Array.isArray(bloque?.datos) ? bloque.datos : (Array.isArray(bloque) ? bloque : bloque?.datos ?? []);
          const datosArr = Array.isArray(datosRaw) ? datosRaw : [];

          const datos = datosArr.map((cel, ci) => {
            if (typeof cel === "string") {
              return { posicion: bi * nuevosRegistrosPorBloque + ci + 1, clave: cel };
            }
            if (cel && typeof cel === "object") {
              const posicion = typeof cel.posicion === "number" ? cel.posicion : bi * nuevosRegistrosPorBloque + ci + 1;
              return { posicion, clave: cel.clave ?? "" };
            }
            return { posicion: bi * nuevosRegistrosPorBloque + ci + 1, clave: "" };
          });

          while (datos.length < nuevosRegistrosPorBloque) {
            datos.push({ posicion: bi * nuevosRegistrosPorBloque + datos.length + 1, clave: "" });
          }

          return { id: bloque?.id ?? bi + 1, datos };
        });

        // completar bloques si hacen falta
        while (principalNormalized.length < nuevaRaiz) {
          const bi = principalNormalized.length;
          const datos = [];
          for (let j = 0; j < nuevosRegistrosPorBloque; j++) {
            datos.push({ posicion: bi * nuevosRegistrosPorBloque + j + 1, clave: "" });
          }
          principalNormalized.push({ id: bi + 1, datos });
        }

        // normalizar secundaria
        const secundariaNormalized = (data.areaSecundaria ?? []).map((it) => {
          if (typeof it === "string") return { clave: it };
          if (!it || typeof it !== "object") return { clave: "" };
          return { clave: it.clave ?? "" };
        });

        // normalizar cubetas
        const incomingCubetas = Array.isArray(data.cubetas) ? data.cubetas : [];
        const cubetasNormalized = [];
        for (let bi = 0; bi < nuevaRaiz; bi++) {
          const raw = incomingCubetas[bi] ?? [];
          const lista = (Array.isArray(raw) ? raw : []).map((cel) => {
            if (typeof cel === "string") return { clave: cel };
            if (!cel || typeof cel !== "object") return { clave: cel?.clave ?? "" };
            return { clave: cel.clave ?? "" };
          });
          cubetasNormalized.push(lista);
        }

        // aplicar estados (primero tamaños para que useEffect no rompa)
        setTamano(Number(nuevoTamano));
        setTamanoClave(Number(nuevoTamanoClave));
        setMetodoColision(nuevoMetodo);

        setAreaPrincipal(principalNormalized);
        setAreaSecundaria(secundariaNormalized);
        setCubetas(cubetasNormalized);

        // marca que indica que un archivo fue cargado y aplicado
        setArchivoCargado(true);

        setResultado("📂 Archivo cargado correctamente.");
      } catch (err) {
        console.error("Error al cargar archivo:", err);
        alert("Error al cargar archivo (JSON inválido).");
      } finally {
        // liberar bloqueo: permitirá que el useEffect vuelva a operar si el usuario cambia tamaño
        setCargandoArchivo(false);
        // limpiar control file
        e.target.value = "";
        setArchivoInputKey(Date.now());
      }
    };

    lector.readAsText(archivo);
  };

  const parametrosCompletos =
    tamano > 0 && tamanoClave > 0 && metodoColision !== "" && !isNaN(tamano) && !isNaN(tamanoClave);

  return (
    <div className="contenedor-hash contenedor-secuencial">
      <h3>Hash Cuadrado — Método Middle Square</h3>

      {/* Parámetros */}
      <div className="opciones">
        <div className="campo">
          <label>Tamaño (n):</label>
          <input type="number" min="4" value={tamano} onChange={(e) => {
            setTamano(Number(e.target.value) || 0);
            // si el usuario cambia tamaño MANUALMENTE consideramos que ya no hay "archivo cargado"
            if (archivoCargado) setArchivoCargado(false);
          }} />
        </div>

        <div className="campo">
          <label>Tamaño clave:</label>
          <input type="number" min="1" value={tamanoClave} onChange={(e) => setTamanoClave(Number(e.target.value) || 0)} />
        </div>

        <div className="campo">
          <label>Método:</label>
          <select value={metodoColision} onChange={(e) => {
            setMetodoColision(e.target.value);
            // si el usuario cambia método manualmente consideramos que ya no hay "archivo cargado"
            if (archivoCargado) setArchivoCargado(false);
          }}>
            <option>Seleccionar Método</option>
            <option value="secundaria">Área Secundaria</option>
            <option value="cubetas">Cubetas por Bloque</option>
          </select>
        </div>
      </div>

      {/* Controles */}
      {parametrosCompletos && (
        <div className="panel-controles">
          <label>Clave:</label>
          <input value={clave} onChange={(e) => setClave(e.target.value)} />

          <button onClick={insertar} className="boton">➕ Insertar</button>
          <button onClick={buscar} className="boton">🔍 Buscar</button>
          <button onClick={eliminar} className="boton">✖️ Eliminar</button>

          <button
            onClick={() => {
              generarAreaPrincipal();
              setAreaSecundaria([]);
              setCubetas([]);
              setTamano("");
              setTamanoClave("");
              setMetodoColision("");
              setResultado("");
              setArchivoCargado(false);
            }}
            className="boton"
          >
            ♻ Vaciar
          </button>
        </div>
      )}

      {resultado && <p className="resultado">{resultado}</p>}

      {/* Visualización */}
      {parametrosCompletos ? (
        <div className="zonas">
          <div className="area-izquierda scroll-horizontal">
            <div className="bloques-container bloques-horizontal">
              {areaPrincipal.map((bq, i) => {
                if (!debeMostrarBloque(i)) return null;

                const cubetaFiltrada = filtrarCubetas(cubetas).find((c) => c.index === i);

                return (
                  <div key={i} className="bloque">
                    <h4 className="titulo-bloque">B{i + 1}</h4>

                    <table className="tabla-bloque">
                      <thead>
                        <tr><th>#</th><th>Clave</th></tr>
                      </thead>
                      <tbody>
                        {filtrarCeldas(bq.datos).map((celda, j) => (
                          <tr key={j} className={i === bloqueActivo && celda.posicion - 1 === i * registrosPorBloque + indiceLocalActivo ? "resaltado" : ""}>
                            <td>{celda.posicion}</td>
                            <td>{celda.clave || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* cubetas */}
                    {metodoColision === "cubetas" && (
                      <div style={{ marginTop: 10 }}>
                        <div className="titulo-bloque" style={{ fontSize: 13 }}>Colisión B{i + 1}</div>

                        <table className="tabla-bloque">
                          <thead><tr><th>#</th><th>Clave</th></tr></thead>
                          <tbody>
                            {cubetaFiltrada && cubetaFiltrada.valores.length > 0 ? (
                              cubetaFiltrada.valores.map((c, k) => (
                                <tr key={k} className={k === cubetaIndiceActivo ? "resaltado" : ""}>
                                  <td>{k + 1}</td>
                                  <td>{c?.clave || "-"}</td>
                                </tr>
                              ))
                            ) : (
                              <tr><td colSpan="2">Vacía</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Área secundaria */}
          {metodoColision === "secundaria" && (
            <div className="bloque" style={{ minWidth: 220, marginLeft: 18 }}>
              <h4 className="titulo-bloque">Área Secundaria</h4>
              <table>
                <thead><tr><th>#</th><th>Clave</th></tr></thead>
                <tbody>
                  {(areaSecundaria || []).length === 0 ? (
                    <tr><td colSpan="2">Vacía</td></tr>
                  ) : (
                    (areaSecundaria || []).map((c, i) => (
                      <tr key={i} className={secundariaIndiceActivo === i ? "resaltado" : ""}>
                        <td>S{i + 1}</td>
                        <td>{c?.clave || "-"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p style={{ marginTop: 20, fontStyle: "italic" }}>Configure los parámetros para mostrar la estructura.</p>
      )}

      {/* Guardar / Cargar */}
      <div className="panel-archivos" style={{ marginTop: 15 }}>
        <button className="boton" onClick={guardarArchivo}>💾 Guardar</button>

        <label className="boton">
          📂 Cargar
          <input type="file" key={archivoInputKey} accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
        </label>
      </div>

      <div style={{ marginTop: 12 }}>
        <button onClick={onBack} className="boton">⬅ Volver</button>
      </div>
    </div>
  );
}
