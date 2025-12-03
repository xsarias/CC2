// src/externas/IndicesSimulador.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import "../App.css";
import "./externas.css";

/*
  IndicesSimulador.jsx (corregido)
  - SVG fijo en viewport para evitar desfases/desapariciones al hacer scroll/mover elementos.
  - Coordenadas calculadas con getBoundingClientRect (viewport coords).
  - Flechas Nivel0 -> Índice arregladas (mapeo por visibles).
  - Observadores + debounce para recalcular cuando cambian nodos / tamaño / scroll.
*/

const BLOCK_WIDTH = 140;
const ROW_HEIGHT = 26;

export default function IndicesSimulador({ onBack }) {
  // Inputs
  const [B, setB] = useState("");
  const [r, setR] = useState("");
  const [R, setRlen] = useState("");
  const [Ri, setRi] = useState("");
  const [tipoIndice, setTipoIndice] = useState("");
  const [nivelTipo, setNivelTipo] = useState("");

  // Estructuras
  const [estructuraDatos, setEstructuraDatos] = useState(null);
  const [estructuraIndex, setEstructuraIndex] = useState(null);
  const [nivelesIndex, setNivelesIndex] = useState([]);

  // UI & refs
  const [resultado, setResultado] = useState("");
  const containerRef = useRef(null);

  // refs kept for compatibility
  const indexBlockRefs = useRef([]);
  const dataBlockRefs = useRef([]);
  const nivelBlockRefs = useRef([]);

  const [arrowLines, setArrowLines] = useState([]);
  const [svgSize, setSvgSize] = useState({ w: window.innerWidth, h: window.innerHeight });

  const safeInt = (x) => (x === "" || x === null || x === undefined ? 0 : Number(x));
  const ceilLog2 = (x) => (!x || x <= 1 ? 1 : Math.ceil(Math.log2(x)));

  // ---------- cálculos ----------
  const calcularBRF = (Bval, Rval) => {
    const b = safeInt(Bval);
    const rlen = safeInt(Rval);
    if (!b || !rlen) return 1;
    return Math.max(1, Math.floor(b / rlen));
  };

  const calcularCantBloques = (rval, brf) => {
    const rn = safeInt(rval);
    if (!rn) return 0;
    return Math.max(1, Math.ceil(rn / brf));
  };

  const calcularIndexBase = ({ tipo, bDatos, rTotal, RiVal }) => {
    const ri = Math.max(1, safeInt(RiVal));
    const brfIndex = Math.max(1, Math.floor(Math.max(1, bDatos) / ri));
    let bIndex = 1;
    if (tipo === "primario") {
      bIndex = Math.max(1, Math.ceil(Math.max(1, bDatos)/brfIndex));
    } else {
      bIndex = Math.max(1, Math.ceil(Math.max(1, rTotal) / brfIndex));
    }
    return { brfIndex, bIndex };
  };

  const pickBlocksToShow = (total) => {
    if (!total || total <= 0) return [];
    if (total === 1) return [0];
    if (total === 2) return [0, 1];
    return [0, Math.floor(total / 2), total - 1];
  };

  // ---------- generar estructuras ----------
  const generarEstructuras = () => {
    if (!B || !r || !R || !Ri) {
      setResultado("⚠️ Completa B, r, R y Ri antes de generar.");
      return;
    }

    // datos
    const brfDatos = calcularBRF(B, R);
    const bDatos = calcularCantBloques(r, brfDatos);

    const picksDatos = pickBlocksToShow(bDatos);
    const bloquesDatos = picksDatos.map((idx) => {
      const isLast = idx === bDatos - 1;
      const rows = isLast ? Math.max(1, safeInt(r) - brfDatos * (bDatos - 1)) : brfDatos;
      return {
        id: idx + 1,
        rows,
        claveMin: `K${idx * brfDatos + 1}`,
        claveMax: `${Math.min(safeInt(r), (idx + 1) * brfDatos)}`
      };
    });

    // índice base
    const { brfIndex, bIndex } = calcularIndexBase({
      tipo: tipoIndice,
      bDatos,
      rTotal: safeInt(r),
      RiVal: Ri
    });

    const picksIndex = pickBlocksToShow(bIndex);
    const bloquesIndex = picksIndex.map((idx) => ({
      id: idx + 1,
      rows: brfIndex,
      apuntaA: tipoIndice === "primario" ? Math.min(idx + 1, bDatos) : null
    }));

    // multinivel
    const niveles = [];
    if (nivelTipo === "multinivel") {
      let currentEntries = bIndex;
      let nivel = 0;
      while (true) {
        const brfNivel = brfIndex;
        const bNivel = Math.max(1, Math.ceil(currentEntries / brfNivel));
        const picksNivel = pickBlocksToShow(bNivel);
        const bloquesNivel = picksNivel.map((pIdx) => ({
          id: pIdx + 1,
          rows: brfNivel,
          apuntaA: Math.min(pIdx + 1, currentEntries)
        }));

        niveles.push({
          nivel,
          brfIndex: brfNivel,
          bNivel,
          bloques: bloquesNivel,
          accesos: ceilLog2(bNivel),
          rEntradas: currentEntries
        });

        if (bNivel <= 1) break;
        currentEntries = bNivel;
        nivel++;
      }
    }

    setEstructuraDatos({ brf: brfDatos, cantBloques: bDatos, bloques: bloquesDatos });
    setEstructuraIndex({ brfIndex, bIndex, bloques: bloquesIndex, accesos: ceilLog2(bIndex) });
    setNivelesIndex(niveles);
    setResultado(`✅ Estructuras generadas (${tipoIndice} — ${nivelTipo}).`);

    indexBlockRefs.current = [];
    dataBlockRefs.current = [];
    nivelBlockRefs.current = [];
    // let the DOM paint then recalc
    requestAnimationFrame(() => recalcPaths());
  };

  // ---------- Guardar / Cargar / Vaciar ----------
  const guardarArchivo = () => {
    if (!estructuraDatos || !estructuraIndex) {
      alert("Genera la estructura antes de guardar.");
      return;
    }
    const nombre = prompt("Nombre para guardar (sin extensión):", "indices_sim");
    if (!nombre) return;
    const payload = { B, r, R, Ri, tipoIndice, nivelTipo, estructuraDatos, estructuraIndex, nivelesIndex };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${nombre}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setResultado("💾 Archivo preparado para descarga.");
  };

  const cargarArchivo = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        setB(data.B ?? "");
        setR(data.r ?? "");
        setRlen(data.R ?? "");
        setRi(data.Ri ?? "");
        setTipoIndice(data.tipoIndice ?? "primario");
        setNivelTipo(data.nivelTipo ?? "unNivel");
        setEstructuraDatos(data.estructuraDatos ?? null);
        setEstructuraIndex(data.estructuraIndex ?? null);
        setNivelesIndex(data.nivelesIndex ?? []);
        setResultado("✅ Archivo cargado.");
        requestAnimationFrame(() => recalcPaths());
      } catch (err) {
        alert("Error cargando archivo: " + err.message);
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  };

  const vaciar = () => {
    setB(""); setR(""); setRlen(""); setRi("");
    setTipoIndice("primario"); setNivelTipo("unNivel");
    setEstructuraDatos(null); setEstructuraIndex(null); setNivelesIndex([]);
    setArrowLines([]);
    indexBlockRefs.current = [];
    dataBlockRefs.current = [];
    nivelBlockRefs.current = [];
    setResultado("Estructuras vaciadas.");
  };

  // ---------- Cajón (visual) ----------
  const getVisibleRowsForBlock = (rows) => {
    if (!rows || rows <= 3) return Array.from({ length: Math.max(1, rows) }, (_, i) => i + 1);
    return [1, 2, "⋮", rows];
  };

  // Cajon ahora agrega data-id en la .cajon-bloque para selección fiable
  const Cajon = ({ label, rows, refAssign, small = false, role, parentIndex, dataId }) => {
    const visible = getVisibleRowsForBlock(rows);
    return (
      <div data-role={role ?? "generic"} data-parent={parentIndex ?? ""} style={{ display: "flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" }}>
        <div style={{ width: 56, textAlign: "right", fontWeight: 700 }}>{label}</div>

        <div
          ref={refAssign}
          className="cajon-bloque"
          data-id={dataId ?? ""}
          style={{
            width: small ? BLOCK_WIDTH * 0.8 : BLOCK_WIDTH,
            border: "2px solid #111",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#fff",
            boxShadow: "1px 2px 6px rgba(0,0,0,0.08)",
            zIndex: 2
          }}
        >
          {visible.map((v, i) => (
            <div
              key={i}
              style={{
                height: ROW_HEIGHT,
                borderBottom: i < visible.length - 1 ? "1px solid #111" : "none",
                display: "flex",
                alignItems: "center",
                paddingLeft: 8,
                fontSize: v === "⋮" ? 18 : 14
              }}
            >
              {v === "⋮" ? "⋮" : `Registro ${v}`}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", height: visible.length * ROW_HEIGHT, justifyContent: "space-between" }}>
          <div style={{ fontSize: 13 }}>1</div>
          <div style={{ fontSize: 13 }}>⋮</div>
          <div style={{ fontSize: 13 }}>{rows}</div>
        </div>
      </div>
    );
  };

  // ---------- asignadores refs (compatibilidad) ----------
  const assignIndexRef = (i) => (el) => { indexBlockRefs.current[i] = el; };
  const assignDataRef = (i) => (el) => { dataBlockRefs.current[i] = el; };
  const assignNivelRef = (nivel, i) => (el) => {
    if (!nivelBlockRefs.current[nivel]) nivelBlockRefs.current[nivel] = [];
    nivelBlockRefs.current[nivel][i] = el;
  };

  // ---------- Rutas / Flechas ----------
  const recalcPaths = () => {
    try {
      // calculamos coords respecto al viewport (getBoundingClientRect) porque el SVG es fixed
      const lines = [];

      // elemento DOM arrays
      const indexEls = Array.from(document.querySelectorAll('[data-role="index"] .cajon-bloque'));
      const dataEls = Array.from(document.querySelectorAll('[data-role="data"] .cajon-bloque'));

      // ---------- Índice -> Datos ----------
      if (estructuraIndex && estructuraDatos) {
        const idxCount = estructuraIndex.bIndex || (estructuraIndex.bloques && estructuraIndex.bloques.length) || 0;
        const datCount = estructuraDatos.cantBloques || 0;
        const idxPicks = pickBlocksToShow(idxCount);
        const datPicks = pickBlocksToShow(datCount);

        const visibleIndexEls = indexEls.slice(0, idxPicks.length);
        const visibleDataEls = dataEls.slice(0, datPicks.length);

        for (let i = 0; i < Math.min(visibleIndexEls.length, visibleDataEls.length); i++) {
          const leftEl = visibleIndexEls[i];
          const rightEl = visibleDataEls[i];
          if (!leftEl || !rightEl) continue;
          const r1 = leftEl.getBoundingClientRect();
          const r2 = rightEl.getBoundingClientRect();

          const x1 = r1.right;
          const y1 = r1.top + r1.height / 2;
          const x2 = r2.left;
          const y2 = r2.bottom - 6;
          const dx = Math.max(60, Math.abs(x2 - x1) / 2);

          lines.push({
            x1, y1, x2, y2,
            cp1x: x1 + dx, cp1y: y1,
            cp2x: x2 - dx, cp2y: y2,
            type: "index->data"
          });
        }
      }

      // ---------- Nivel 0 -> Índice (C) ----------
      // Si hay niveles y hay índice, mapeamos elementos visibles del nivel 0 con índice por posición
      const nivel0Els = Array.from(document.querySelectorAll('[data-role="nivel"][data-nivel="0"] .cajon-bloque'));
      if (nivel0Els.length > 0 && indexEls.length > 0 && estructuraIndex) {
        const lvl0Count = nivel0Els.length;
        const idxCount = indexEls.length;
        const lvl0Picks = pickBlocksToShow(lvl0Count);
        const idxPicks = pickBlocksToShow(idxCount);

        const visibleLvl0 = nivel0Els.slice(0, lvl0Picks.length);
        const visibleIdx = indexEls.slice(0, idxPicks.length);

        const count = Math.min(visibleLvl0.length, visibleIdx.length);
        for (let i = 0; i < count; i++) {
          const upEl = visibleLvl0[i];
          const idxEl = visibleIdx[i];
          if (!upEl || !idxEl) continue;
          const ru = upEl.getBoundingClientRect();
          const ri = idxEl.getBoundingClientRect();

          const x1 = ru.right;
          const y1 = ru.top + ru.height / 2;
          const x2 = ri.left;
          const y2 = ri.top + ri.height / 2;
          const dx = Math.max(40, Math.abs(x2 - x1) / 2);

          lines.push({
            x1, y1, x2, y2,
            cp1x: x1 + dx, cp1y: y1,
            cp2x: x2 - dx, cp2y: y2,
            type: "nivel0->index"
          });
        }
      }

      // ---------- Flechas entre niveles (nivel i -> i-1) ----------
      if (nivelesIndex && nivelesIndex.length > 1) {
        for (let lvl = 1; lvl < nivelesIndex.length; lvl++) {
          const upperEls = Array.from(document.querySelectorAll(`[data-role="nivel"][data-nivel="${lvl}"] .cajon-bloque`));
          const lowerEls = Array.from(document.querySelectorAll(`[data-role="nivel"][data-nivel="${lvl - 1}"] .cajon-bloque`));
          const n = Math.min(upperEls.length, lowerEls.length);
          for (let j = 0; j < n; j++) {
            const upEl = upperEls[j];
            const lowEl = lowerEls[j];
            if (!upEl || !lowEl) continue;
            const r1 = upEl.getBoundingClientRect();
            const r2 = lowEl.getBoundingClientRect();
            const x1 = r1.right;
            const y1 = r1.top + r1.height / 2;
            const x2 = r2.left;
            const y2 = r2.top + r2.height / 2;
            const dx = Math.max(40, Math.abs(x2 - x1) / 2);
            lines.push({
              x1, y1, x2, y2,
              cp1x: x1 + dx, cp1y: y1,
              cp2x: x2 - dx, cp2y: y2,
              type: "nivel->nivel"
            });
          }
        }
      }

      setArrowLines(lines);
    } catch (err) {
      // no romper
      setArrowLines([]);
    }
  };

  // recalcular en resize / scroll / container scroll / ResizeObserver / MutationObserver
  useEffect(() => {
    let rafId = null;
    const debounced = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(recalcPaths);
    };

    const onResize = () => {
      setSvgSize({ w: window.innerWidth, h: window.innerHeight });
      debounced();
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", debounced, { passive: true });
    window.addEventListener("orientationchange", debounced, { passive: true });
    window.addEventListener("visibilitychange", debounced);

    const cont = containerRef.current;
    if (cont) cont.addEventListener("scroll", debounced, { passive: true });

    // MutationObserver dentro del contenedor para detectar cambios en estructura
    let mo;
    try {
      mo = new MutationObserver(debounced);
      if (cont) mo.observe(cont, { childList: true, subtree: true, attributes: true });
    } catch (e) {
      // ok
    }

    // ResizeObserver por si cambian tamaños de bloques
    let ro;
    try {
      ro = new ResizeObserver(debounced);
      // observe all cajon-bloque currently present
      const observeAll = () => {
        const blocks = document.querySelectorAll(".cajon-bloque");
        blocks.forEach((b) => {
          try { ro.observe(b); } catch (e) {}
        });
      };
      observeAll();
      // re-observe al cambiar DOM
      if (mo) mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}

    // initial recalc
    requestAnimationFrame(recalcPaths);

    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", debounced);
      window.removeEventListener("orientationchange", debounced);
      window.removeEventListener("visibilitychange", debounced);
      if (cont) cont.removeEventListener("scroll", debounced);
      if (mo) mo.disconnect();
      if (ro) ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nivelesIndex, estructuraIndex, estructuraDatos]);

  // recalc cuando cambian las estructuras
  useLayoutEffect(() => {
    requestAnimationFrame(recalcPaths);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estructuraIndex, estructuraDatos, nivelesIndex]);

  // ---------- SVG layer ----------
  const ArrowSVGLayer = () => {
    // always render fixed svg so it doesn't mount/unmount (avoids flicker)
    return (
      <svg
        className="arrow-layer"
        width={svgSize.w}
        height={svgSize.h}
        viewBox={`0 0 ${svgSize.w} ${svgSize.h}`}
        preserveAspectRatio="xMinYMin meet"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          pointerEvents: "none",
          zIndex: 9999,
          overflow: "visible"
        }}
      >
        <defs>
          <marker id="mArrow" markerWidth="10" markerHeight="8" refX="10" refY="4" orient="auto">
            <path d="M0,0 L10,4 L0,8 z" fill="#1d6a96" />
          </marker>
        </defs>

        {arrowLines.map((p, i) => (
          <path
            key={i}
            d={`M ${p.x1} ${p.y1} C ${p.cp1x} ${p.cp1y}, ${p.cp2x} ${p.cp2y}, ${p.x2} ${p.y2}`}
            stroke="#1d6a96"
            strokeWidth={2.6}
            fill="none"
            markerEnd="url(#mArrow)"
            opacity={0.98}
          />
        ))}
      </svg>
    );
  };

  // ---------- Render niveles (sin cambios significativos) ----------
  const RenderNivelesCol = () => {
    if (!nivelesIndex || nivelesIndex.length === 0) return <div style={{ width: 12 }} />;
    return (
      <div style={{ display: "flex", flexDirection: "row", gap: 12, alignItems: "flex-start", paddingTop: 8 }}>
        {[...nivelesIndex].slice().reverse().map((niv, visualIdx) => {
          const realNivelIdx = nivelesIndex.length - 1 - visualIdx;
          return (
            <div
              key={realNivelIdx}
              data-role="nivel-column"
              style={{
                minWidth: 160,
                padding: 8,
                borderRadius: 8,
                background: "#fafafa",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                alignItems: "center"
              }}
            >
              <div style={{ fontWeight: 800, marginBottom: 6, textAlign: "center" }}>Nivel {realNivelIdx}</div>
              <div style={{ fontSize: 13, marginBottom: 6, textAlign: "center" }}>
                bNivel: {niv.bNivel} — brf: {niv.brfIndex} — accesos: {niv.accesos}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "center" }}>
                {(niv.bloques || []).map((b, i) => (
                  <div key={i} data-role="nivel" data-nivel={realNivelIdx} data-block-index={i}>
                    <Cajon
                      label={`${b.id}`}
                      rows={b.rows || niv.brfIndex || 1}
                      refAssign={assignNivelRef(realNivelIdx, i)}
                      small
                      role="nivel"
                      parentIndex={realNivelIdx}
                      dataId={b.id}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ---------- RENDER ----------
  const hasNiveles = nivelesIndex && nivelesIndex.length > 0;
  const gridTemplateColumns = hasNiveles ? "auto 1fr 1fr" : "1fr 1fr";

  return (
    <div ref={containerRef} className="contenedor-secuencial" style={{ position: "relative", paddingBottom: 80 }}>
      {/* SVG fijo */}
      <ArrowSVGLayer />

      <h3 style={{ textAlign: "center" }}>🔎 Simulador de Índices — {tipoIndice === "primario" ? "Primario" : "Secundario"}</h3>

      {/* Controles */}
      <div className="opciones" style={{ gap: 12, marginTop: 6 }}>
        <div className="campo">
          <label>B (bytes):</label>
          <input type="number" value={B} onChange={(e) => setB(e.target.value)} />
        </div>
        <div className="campo">
          <label>r (registros):</label>
          <input type="number" value={r} onChange={(e) => setR(e.target.value)} />
        </div>
        <div className="campo">
          <label>R (long reg):</label>
          <input type="number" value={R} onChange={(e) => setRlen(e.target.value)} />
        </div>
        <div className="campo">
          <label>Ri (long índice):</label>
          <input type="number" value={Ri} onChange={(e) => setRi(e.target.value)} />
        </div>
        <div className="campo">
          <label>Tipos índice:</label>
          <select value={nivelTipo} onChange={(e) => setNivelTipo(e.target.value)}>
            <option value="unNivel">Un nivel</option>
            <option value="multinivel">Multinivel</option>
          </select>
        </div>
      </div>

        <div className="campo">
          <label>Nivel:</label>
          <select value={tipoIndice} onChange={(e) => setTipoIndice(e.target.value)}>
            <option value="primario">Primario</option>
            <option value="secundario">Secundario</option>
          </select>
        </div>


      {/* Acciones */}
      <div style={{ marginTop: 10 }}>
        <button className="boton" onClick={generarEstructuras}>⚙️ Generar</button>
        <button className="boton" onClick={guardarArchivo} disabled={!estructuraDatos} style={{ marginLeft: 8 }}>💾 Guardar</button>

        <label className="boton" style={{ marginLeft: 8 }}>
          📂 Cargar
          <input type="file" accept=".json" onChange={cargarArchivo} style={{ display: "none" }} />
        </label>

        <button className="boton" style={{ marginLeft: 8 }} onClick={vaciar}>♻ Vaciar</button>
        <button className="boton" style={{ marginLeft: 8 }} onClick={() => onBack && onBack()}>⬅ Volver</button>
      </div>

      {resultado && <p className="resultado" style={{ marginTop: 8 }}>{resultado}</p>}

      {/* Vista principal: Niveles | Índice | Datos */}
      <div style={{ display: "grid", gridTemplateColumns: gridTemplateColumns, gap: 24, marginTop: 22, alignItems: "flex-start" }}>
        {hasNiveles ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", zIndex: 2 }}>
            <RenderNivelesCol />
          </div>
        ) : null}

        {/* Índice */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start", zIndex: 2 }}>
          {estructuraIndex ? (
            estructuraIndex.bloques.map((b, i) => (
              <div key={`idx-${i}`} data-role="index" data-i={i}>
                <Cajon
                  label={`B${b.id}`}
                  rows={b.rows || estructuraIndex.brfIndex || 1}
                  refAssign={assignIndexRef(i)}
                  role="index"
                  dataId={b.id}
                />
              </div>
            ))
          ) : (
            <div style={{ color: "#666" }}>Genera para ver índice</div>
          )}
          <div style={{ marginTop: 10, fontWeight: 700, fontSize: 16 }}>{tipoIndice === "primario" ? "Índice Primario" : "Índice Secundario"}</div>
        </div>

        {/* Datos */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start", zIndex: 2 }}>
          {estructuraDatos ? (
            estructuraDatos.bloques.map((b, i) => (
              <div key={`dat-${i}`} data-role="data" data-i={i}>
                <Cajon
                  label={`B${b.id}`}
                  rows={b.rows || estructuraDatos.brf || 1}
                  refAssign={assignDataRef(i)}
                  role="data"
                  dataId={b.id}
                />
              </div>
            ))
          ) : (
            <div style={{ color: "#666" }}>Genera para ver datos</div>
          )}
          <div style={{ marginTop: 10, fontWeight: 700, fontSize: 16 }}>Estructura de Datos</div>
        </div>
      </div>
    </div>
  );
}
