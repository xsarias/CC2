// src/externas/IndicesSimulador.jsx
import React, { useEffect, useState, useRef } from "react";
import "../App.css";
import "./externas.css";

export default function IndicesSimulador({ onBack }) {
  // Entradas del usuario
  const [B, setB] = useState(""); // tamaño bloque (bytes)
  const [r, setR] = useState(""); // cantidad registros
  const [R, setRlen] = useState(""); // longitud registro (bytes)
  const [Ri, setRi] = useState(""); // longitud registro índice (bytes)
  const [tipoIndice, setTipoIndice] = useState(""); // 'primario'|'secundario'
  const [nivelTipo, setNivelTipo] = useState(""); // 'unNivel'|'multinivel'
  const [estructuraDatos, setEstructuraDatos] = useState(null); // matriz rows x 2 (clave, registro)
  const [estructuraIndex, setEstructuraIndex] = useState(null); // array de bloques/entradas de índice
  const [nivelesIndex, setNivelesIndex] = useState([]); // para multinivel
  const [resultado, setResultado] = useState("");
  const [configCreada, setConfigCreada] = useState(false);
  const [mostrarFilas, setMostrarFilas] = useState(6); // número visual de filas (primeras, medias, finales)
  const containerRef = useRef(null);
  const indexTableRef = useRef(null);
  const dataTableRef = useRef(null);

  // referencias de filas (tbody rows visibles)
  const indexRowRefs = useRef([]);
  const dataRowRefs = useRef([]);

  // flechas múltiples (array de {x1,y1,x2,y2})
  const [arrowLines, setArrowLines] = useState([]);

  // ---- cálculos auxiliares ----
  const safeFloor = (x) => Math.floor(Number(x) || 0);

  const calcularBRF = (Bv, Rv) => {
    const brf = Math.floor(Number(Bv) / Number(Rv));
    return Math.max(1, brf); // al menos 1 registro por bloque
  };

  const calcularB = (rv, brf) => {
    if (!brf) return 0;
    return Math.max(1, Math.floor(Number(rv) / brf));
  };

  const ceilLog2 = (x) => {
    if (!x || x <= 1) return 1;
    return Math.ceil(Math.log2(x));
  };

  // ---- crear estructura datos cuando se completan todos los campos ----
  useEffect(() => {
    // Solo crear cuando estén las entradas básicas
    if (B && r && R && Ri && tipoIndice && nivelTipo) {
      // crear estructura de datos:
      const brfDatos = calcularBRF(B, R);
      const bDatos = calcularB(r, brfDatos);

      // crear estructura: bDatos filas x 2 columnas (clave, registro)
      const estructura = Array.from({ length: bDatos }, (_, idx) => ({
        bloqueIdx: idx + 1,
        filas: Array.from({ length: brfDatos }, () => ({ clave: "", datos: "" })),
      }));

      setEstructuraDatos({
        B: Number(B),
        r: Number(r),
        R: Number(R),
        Ri: Number(Ri),
        brfDatos,
        bDatos,
        estructura,
      });

      // generar índice (si es primario)
      if (tipoIndice === "primario") {
        generarIndicePrimario(bDatos, brfDatos, Ri, nivelTipo);
      } else {
        setEstructuraIndex(null);
        setNivelesIndex([]);
      }

      setConfigCreada(true);
      setResultado("✅ Estructura datos y (si corresponde) índice creados.");
    } else {
      // si faltan datos no mostrar estructuras
      setEstructuraDatos(null);
      setEstructuraIndex(null);
      setNivelesIndex([]);
      setConfigCreada(false);
      setResultado("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [B, r, R, Ri, tipoIndice, nivelTipo]);

  // ---- calcular flechas basadas en filas visibles y refs ----
  // ---- flechas calculadas por fila, no por posición real ----
  useEffect(() => {
    if (!containerRef.current) return;

    requestAnimationFrame(() => {
      const contRect = containerRef.current.getBoundingClientRect();
      const newArrows = [];

      for (let i = 0; i < indexRowRefs.current.length; i++) {
        const idxRow = indexRowRefs.current[i];
        const datRow = dataRowRefs.current[i];

        if (!idxRow || !datRow) continue;

        const r1 = idxRow.getBoundingClientRect();
        const r2 = datRow.getBoundingClientRect();

        newArrows.push({
          x1: r1.right - contRect.left,
          y1: r1.top + r1.height / 2 - contRect.top,
          x2: r2.left - contRect.left,
          y2: r2.top + r2.height / 2 - contRect.top - 8, // ← levanta un poco la flecha
        });
      }

      setArrowLines(newArrows);
    });

  }, [estructuraIndex, estructuraDatos]);



  // ---- Generar índice primario (un nivel o multinivel automático) ----
  const generarIndicePrimario = (bDatos, brfDatos, Ri_val, nivelTipoVal) => {
    const Bindex = Number(bDatos);
    const brfIndex = Math.max(1, Math.floor(Bindex / Number(Ri_val) || 1));
    const bIndex = Math.max(1, Math.floor(Number(bDatos) / brfIndex || 1));

    const indexEntries = Array.from({ length: bIndex }, (_, i) => ({
      entradaId: i + 1,
      apuntaA: i + 1,
      claveIndex: "",
    }));

    if (nivelTipoVal === "unNivel") {
      setEstructuraIndex({
        Bindex,
        brfIndex,
        bIndex,
        entries: indexEntries,
        accesos: ceilLog2(bIndex),
      });
      setNivelesIndex([]);
    } else {
      const niveles = [];
      let actualEntries = bIndex;
      let nivel = 1;
      niveles.push({
        nivel,
        entries: indexEntries,
        bNivel: indexEntries.length,
        brfIndex,
        accesos: ceilLog2(Math.max(1, indexEntries.length)),
      });

      while (actualEntries > brfIndex) {
        nivel++;
        const entradasNivel = Math.max(1, Math.ceil(actualEntries / brfIndex));
        const entries = Array.from({ length: entradasNivel }, (_, i) => ({
          entradaId: i + 1,
          apuntaA: i + 1,
          claveIndex: "",
        }));
        niveles.push({
          nivel,
          entries,
          bNivel: entries.length,
          brfIndex,
          accesos: ceilLog2(entries.length),
        });
        actualEntries = entradasNivel;
      }

      setEstructuraIndex({
        Bindex,
        brfIndex,
        bIndex,
        entries: niveles[0].entries,
        accesos: niveles[0].accesos,
      });
      setNivelesIndex(niveles);
    }
  };

  // ---- ayuda para mostrar filas parciales (primero, medio, final) ----
  const pickRowsToShow = (totalRows) => {
    if (totalRows <= mostrarFilas) {
      return Array.from({ length: totalRows }, (_, i) => i);
    }
    const first = [0, 1];
    const midStart = Math.max(0, Math.floor(totalRows / 2) - 1);
    const mid = [midStart, midStart + 1];
    const last = [totalRows - 2, totalRows - 1];
    const picks = [...first, ...mid, ...last].filter((v) => v >= 0 && v < totalRows);
    return Array.from(new Set(picks)).sort((a, b) => a - b);
  };

  // ---- Guardar / Cargar ----
  const guardarArchivo = () => {
    const nombre = prompt("Nombre para guardar (sin extensión):");
    if (!nombre) return;
    const data = {
      B,
      r,
      R,
      Ri,
      tipoIndice,
      nivelTipo,
      estructuraDatos,
      estructuraIndex,
      nivelesIndex,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const cargarArchivo = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setB(data.B || "");
        setRlen(data.R || "");
        setR(data.r || "");
        setRi(data.Ri || "");
        setTipoIndice(data.tipoIndice || "");
        setNivelTipo(data.nivelTipo || "");
        setEstructuraDatos(data.estructuraDatos || null);
        setEstructuraIndex(data.estructuraIndex || null);
        setNivelesIndex(data.nivelesIndex || []);
        setConfigCreada(true);
        setResultado("✅ Archivo cargado");
      } catch (err) {
        alert("Error cargando archivo");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const vaciar = () => {
    setB("");
    setR("");
    setRlen("");
    setRi("");
    setTipoIndice("");
    setNivelTipo("");
    setEstructuraDatos(null);
    setEstructuraIndex(null);
    setNivelesIndex([]);
    setResultado("Estructura vaciada.");
    setConfigCreada(false);
  };

  // ---- render helpers para tablas ----
  const renderDatosTabla = () => {
    if (!estructuraDatos) return null;
    const { bDatos } = estructuraDatos;
    const rowsToShowIdx = pickRowsToShow(bDatos);

    // aseguramos que el array de refs tenga la longitud correcta
    dataRowRefs.current = new Array(rowsToShowIdx.length);

    return (
      <div className="bloque" style={{ minWidth: 360, position: "relative" }}>
        <div className="titulo-bloque">Estructura de Datos</div>

        <table ref={dataTableRef} className="tabla-estructura">
          <thead>
            <tr>
              <th>Clave (PK)</th>
              <th>Registro</th>
              <th style={{ width: 110 }}>Bloque</th>
            </tr>
          </thead>

          <tbody>
            {rowsToShowIdx.map((blockIdx, k) => (
              <tr key={blockIdx} ref={(el) => (dataRowRefs.current[k] = el)}>
                <td></td>
                <td></td>
                <td style={{ fontWeight: 700 }}>{`Bloque ${blockIdx + 1}`}</td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>
                Total bloques: {estructuraDatos.bDatos} &nbsp;|&nbsp; Total registros: {estructuraDatos.r}
              </td>
            </tr>
            <tr>
              <td colSpan={3} style={{ textAlign: "right", fontSize: 12, color: "#555" }}>
                brf (B/R) = {estructuraDatos.brfDatos} — b = {estructuraDatos.bDatos} — accesos (datos) = {ceilLog2(estructuraDatos.bDatos)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderIndexTabla = () => {
    if (!estructuraIndex || !estructuraDatos) return null;
    const rowsToShow = pickRowsToShow(estructuraIndex.bIndex || estructuraIndex.entries.length);

    // aseguramos que el array de refs tenga la longitud correcta
    indexRowRefs.current = new Array(rowsToShow.length);

    return (
      <div className="bloque" style={{ minWidth: 340, position: "relative" }}>
        <div className="titulo-bloque">Estructura Índice (Primario)</div>
        <table ref={indexTableRef} className="tabla-estructura">
          <thead>
            <tr>
              <th>Clave Índice</th>
              <th>Puntero (bloque)</th>
            </tr>
          </thead>

          <tbody>
            {rowsToShow.map((iIdx, k) => {
              const entry = estructuraIndex.entries[iIdx];
              return (
                <tr key={iIdx} ref={(el) => (indexRowRefs.current[k] = el)}>
                  <td>{entry.claveIndex || ""}</td>
                  <td style={{ fontWeight: 700 }}>{`Bloque ${entry.apuntaA}`}</td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr>
              <td colSpan={2} style={{ textAlign: "right", fontWeight: 700 }}>
                b (índice): {estructuraIndex.bIndex} &nbsp;|&nbsp; brf (índice): {estructuraIndex.brfIndex}
              </td>
            </tr>
            <tr>
              <td colSpan={2} style={{ textAlign: "right", fontSize: 12, color: "#555" }}>
                Accesos índice = {estructuraIndex.accesos}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    );
  };

  const renderNiveles = () => {
    if (!nivelesIndex || nivelesIndex.length <= 1) return null;
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Niveles (multinivel):</div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          {nivelesIndex.map((niv) => (
            <div key={niv.nivel} className="bloque" style={{ minWidth: 220 }}>
              <div className="titulo-bloque">Nivel {niv.nivel}</div>
              <table className="tabla-estructura" style={{ width: "100%" }}>
                <thead>
                  <tr><th>Entrada</th><th>Ptr</th></tr>
                </thead>
                <tbody>
                  {niv.entries.slice(0, 6).map((e, i) => (
                    <tr key={i}><td>{e.claveIndex || ""}</td><td style={{ fontWeight: 700 }}>{e.apuntaA}</td></tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr><td colSpan={2} style={{ textAlign: "right" }}>bNivel: {niv.bNivel} — accesos: {niv.accesos}</td></tr>
                </tfoot>
              </table>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ---- flechas SVG simples (ilustrativas) ----
  const renderArrows = () => {
    if (!arrowLines.length) return null;

    return (
      <svg className="arrow-layer"

        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 999,        // ← LAS FLECHAS VAN DETRÁS DE TODO
        }}
      >
        <defs>
          <marker id="flecha" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#85b8cb" />
          </marker>
        </defs>

        {arrowLines.map((line, i) => (
          <line
            key={i}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="#85b8cb"
            strokeWidth="2"
            markerEnd="url(#flecha)"
          />
        ))}
      </svg>
    );
  };

  return (
    <div className="contenedor-secuencial" ref={containerRef} style={{ position: "relative", paddingBottom: 40, zIndex: 1 }}>
      <h3>🔎 Simulador de Índices (Primarios — opción A)</h3>

      <div className="opciones" style={{ flexWrap: "wrap" }}>
        <div className="campo">
          <label>B (tamaño bloque bytes):</label>
          <input type="number" value={B} onChange={(e) => setB(e.target.value)} />
        </div>
        <div className="campo">
          <label>r (cantidad registros):</label>
          <input type="number" value={r} onChange={(e) => setR(e.target.value)} />
        </div>
        <div className="campo">
          <label>R (long reg bytes):</label>
          <input type="number" value={R} onChange={(e) => setRlen(e.target.value)} />
        </div>
        <div className="campo">
          <label>Ri (long reg índice):</label>
          <input type="number" value={Ri} onChange={(e) => setRi(e.target.value)} />
        </div>

        <div className="campo">
          <label>Tipo índice:</label>
          <select value={tipoIndice} onChange={(e) => setTipoIndice(e.target.value)}>
            <option value="">--</option>
            <option value="primario">Primario</option>
            <option value="secundario">Secundario (no simulado aún)</option>
          </select>
        </div>

        <div className="campo">
          <label>Nivel:</label>
          <select value={nivelTipo} onChange={(e) => setNivelTipo(e.target.value)}>
            <option value="">--</option>
            <option value="unNivel">Un nivel</option>
            <option value="multinivel">Multinivel (auto)</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12, marginBottom: 8 }}>
        <button className="boton" onClick={guardarArchivo} disabled={!configCreada}>💾 Guardar</button>
        <label className="boton" style={{ marginLeft: 8 }}>
          📂 Cargar
          <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
        </label>
        <button className="boton" style={{ marginLeft: 8 }} onClick={vaciar}>♻ Vaciar</button>
        <button className="boton" style={{ marginLeft: 8 }} onClick={() => onBack && onBack()}>⬅ Volver</button>
      </div>

      {resultado && <p className="resultado">{resultado}</p>}

      {/* area visual: indice (izq) -> datos (derecha) */}
      <div style={{ display: "flex", justifyContent: "center", gap: 18, position: "relative", marginTop: 10 }}>
        {/* Index */}
        {renderIndexTabla()}

        {/* arrows */}
        {renderArrows()}

        {/* Datos */}
        {renderDatosTabla()}
      </div>

      {/* niveles (si multinivel) */}
      <div style={{ marginTop: 10 }}>{renderNiveles()}</div>

      <div style={{ marginTop: 14, fontSize: 13, color: "#333" }}>
        <strong>Notas:</strong> brf = floor(B/R); b = floor(r/brf). Los accesos mostrados son ceil(log2(b)). Las filas mostradas son una selección (principio / medio / fin) para ilustrar.
      </div>
    </div>
  );
}
