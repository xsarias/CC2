import React, { useState, useEffect, useRef } from "react";
import "./OperacionesGrafos.css"; // opcional: reutiliza estilos del proyecto

/**
 * RepresentacionGrafos.jsx
 * Componente autónomo para crear/editar un grafo (dirigido / no dirigido).
 *
 * Características:
 * - Crear vértices (insertar con prompt).
 * - Crear aristas: seleccionar vértice origen, luego destino → modal para peso.
 * - Toggle Dirigido / No dirigido.
 * - Editar etiqueta (double click).
 * - Mover vértices (drag).
 * - Eliminar vértices y aristas.
 * - Exportar / Importar JSON.
 *
 * Basado en la implementación visual y funciones de OperacionesGrafosClean.jsx.
 */

function RepresentacionGrafos({ initialDirected = false, initialGraph = null, onBack = null }) {
  // estados principales
  const [vertices, setVertices] = useState([]); // {id,x,y,etiqueta}
  const [aristas, setAristas] = useState([]); // {id,origen,destino,peso,dirigida}
  const [tipoIdentificador, setTipoIdentificador] = useState("numerico"); // 'numerico'|'alfabetico'
  const [metodoAsignacion, setMetodoAsignacion] = useState("automatico"); // no obligatorio, pero incluido
  const [esDirigido, setEsDirigido] = useState(!!initialDirected);
  const [fase, setFase] = useState("crear");

  // Datos para crear grafo
  const [numVertices, setNumVertices] = useState(6)
  // crear arista por selección
  const [primeraArista, setPrimeraArista] = useState(null); // índice del vértice
  const [modalArista, setModalArista] = useState(null); // {origen,destino}
  const [pesoTemporal, setPesoTemporal] = useState(1);
  const crearDesdeOperacion = false;

  // drag
  const dragging = useRef(null);

  // refs para file input
  const inputFileRef = useRef(null);

  useEffect(() => {
    // si el padre pasa un grafo inicial, cargarlo
    if (initialGraph && typeof initialGraph === "object") {
      try {
        const vs = initialGraph.vertices || [];
        const as = initialGraph.aristas || [];
        setVertices(Array.isArray(vs) ? vs : []);
        setAristas(Array.isArray(as) ? as : []);
        // guess tipoIdentificador (simple)
        if (vs.every(v => /^[A-Za-z]+$/.test(v.etiqueta || ""))) setTipoIdentificador("alfabetico");
        else setTipoIdentificador("numerico");
      } catch (e) { }
    }
  }, [initialGraph]);

  // ---- Helpers (adaptadas del archivo original) ----

  const lettersFromNumber = (num) => {
    let n = Math.max(1, Math.floor(num));
    let s = "";
    while (n > 0) {
      const rem = (n - 1) % 26;
      s = String.fromCharCode(65 + rem) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };

  const coerceEdgeWeightToAlpha = (peso) => {
    if (peso === null || peso === undefined) return "A";
    if (typeof peso === "string" && /^[A-Za-z/]+$/.test(peso)) return peso;
    const n = typeof peso === "number" ? Math.max(1, Math.floor(peso)) : (parseInt(String(peso)) || 1);
    return lettersFromNumber(n);
  };

  const getDefaultEdgeWeight = () => {
    if (tipoIdentificador === "numerico") return coerceEdgeWeightToAlpha(1);
    return 1;
  };

  // distancia punto - segmento (útil para decisiones visuales)
  const distancePointToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    if (len2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  };

  // posicionamiento circular si queremos reorganizar
  const layoutCircular = (nodes, width = 520, height = 420) => {
    if (!nodes || nodes.length === 0) return nodes;
    const cx = width / 2;
    const cy = height / 2;
    const margin = 80;
    const r = Math.max(60, Math.min(width, height) / 2 - margin);
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      nodes[i].x = Math.round(cx + r * Math.cos(angle));
      nodes[i].y = Math.round(cy + r * Math.sin(angle));
    }
    return nodes;
  };

  // ----- Operaciones de vértices/aristas -----

  const insertarVerticesAutomatico = (n = 6) => {
    const width = 520;
    const height = 420;
    const paddingX = 40;
    const topY = 90;
    const bottomY = height - 90;
    const cols = Math.ceil(n / 2);
    const spacingX = (width - 2 * paddingX) / Math.max(1, cols - 1);
    const nuevos = [];
    for (let i = 0; i < n; i++) {
      const row = i < cols ? 0 : 1;
      const col = row === 0 ? i : i - cols;
      const x = paddingX + col * spacingX;
      const y = row === 0 ? topY : bottomY;
      nuevos.push({
        id: Date.now() + Math.random() + "-" + i,
        x,
        y,
        etiqueta: tipoIdentificador === "numerico" ? String(i + 1) : String.fromCharCode(65 + (i % 26)),
      });
    }
    setVertices(nuevos);
  };

  const handleInsertVertice = () => {
    const respuesta = window.prompt("Ingrese etiqueta para el nuevo vértice:", "");
    if (respuesta === null) return;
    const nuevo = String(respuesta).trim();
    if (nuevo === "") { alert("La etiqueta no puede quedar vacía"); return; }
    if (tipoIdentificador === "numerico" && !/^[0-9]+$/.test(nuevo)) { alert("Solo números permitidos"); return; }
    if (tipoIdentificador === "alfabetico" && !/^[A-Za-z]+$/.test(nuevo)) { alert("Solo letras permitidas"); return; }
    const dup = vertices.some(v => String((v.etiqueta || "").trim()) === nuevo);
    if (dup) { alert("La etiqueta ya existe. Debe ser única"); return; }
    // encontrar posición libre simple: al centro + pequeña variación
    const cx = 260 + Math.round((Math.random() - 0.5) * 80);
    const cy = 210 + Math.round((Math.random() - 0.5) * 80);
    const newV = { id: Date.now() + Math.random(), x: cx, y: cy, etiqueta: nuevo };
    setVertices(prev => [...prev, newV]);
  };
  const handleCrearVertices = () => {
    const n = parseInt(numVertices);
    if (isNaN(n) || n < 1 || n > 12) {
      alert("Ingrese una cantidad válida (1 a 12)");
      return;
    }

    // Reset
    setVertices([]);
    setAristas([]);

    // Crear vértices
    const nuevos = [];
    for (let i = 0; i < n; i++) {
      nuevos.push({
        id: Date.now() + Math.random(),
        x: 260 + Math.cos((2 * Math.PI * i) / n) * 120,
        y: 210 + Math.sin((2 * Math.PI * i) / n) * 120,
        etiqueta: "", // aún sin etiqueta (para fase "etiquetar")
      });
    }

    setVertices(nuevos);

    if (metodoAsignacion === "manual") {
      setFase("etiquetar");
    } else {
      // automático: asignar etiquetas directamente
      const etiquetados = nuevos.map((v, i) => ({
        ...v,
        etiqueta:
          tipoIdentificador === "numerico"
            ? String(i + 1)
            : String.fromCharCode(65 + i),
      }));

      setVertices(etiquetados);
      setFase("editor");
    }
  };
  const handleConfirmarEtiquetas = () => {
    const usados = new Set();

    for (let v of vertices) {
      if (!v.etiqueta.trim())
        return alert("Todos los vértices requieren etiqueta.");

      if (usados.has(v.etiqueta.trim()))
        return alert("Todas las etiquetas deben ser únicas.");

      usados.add(v.etiqueta.trim());
    }

    setFase("editor");
  };


  const handleEditarEtiquetaPrompt = (vertexId) => {
    const idx = vertices.findIndex(v => v.id === vertexId);
    if (idx === -1) return;
    const current = (vertices[idx].etiqueta || `V${vertexId}`);
    const respuesta = window.prompt(`Editar etiqueta del vértice:`, current);
    if (respuesta === null) return;
    const nuevo = String(respuesta).trim();
    if (nuevo === "") { alert("La etiqueta no puede quedar vacía"); return; }
    if (tipoIdentificador === "numerico" && !/^[0-9]+$/.test(nuevo)) { alert("Solo números permitidos"); return; }
    if (tipoIdentificador === "alfabetico" && !/^[A-Za-z]+$/.test(nuevo)) { alert("Solo letras permitidas"); return; }
    const dup = vertices.some((v, i) => i !== idx && String((v.etiqueta || "").trim()) === nuevo);
    if (dup) { alert("La etiqueta ya existe. Debe ser única"); return; }
    const newVerts = vertices.map((v, i) => (i === idx ? { ...v, etiqueta: nuevo } : v));
    setVertices(newVerts);
  };

  // eliminar vértice (y sus aristas incidentes)
  const handleEliminarVertice = (index) => {
    const v = vertices[index];
    const label = v ? (v.etiqueta || `V${v.id}`) : `V${index}`;
    const ok = window.confirm(`¿Eliminar vértice ${label}?`);
    if (!ok) return;
    const newVertices = vertices.filter((_, i) => i !== index);
    // remap aristas por índices (usamos indices del array: origen/destino)
    // Créer mapping del index antiguo al nuevo índice
    const mapping = {};
    let newIdx = 0;
    for (let i = 0; i < vertices.length; i++) {
      if (i === index) { mapping[i] = undefined; continue; }
      mapping[i] = newIdx++;
    }
    const newAristas = aristas.map(a => ({ ...a })).filter(a => mapping[a.origen] !== undefined && mapping[a.destino] !== undefined).map(a => ({ ...a, origen: mapping[a.origen], destino: mapping[a.destino] }));
    setVertices(newVertices);
    setAristas(newAristas);
  };

  const handleClickVertice = (index) => {
    if (primeraArista === null) {
      setPrimeraArista(index);
    } else {
      setModalArista({ origen: primeraArista, destino: index });
      setPesoTemporal(getDefaultEdgeWeight());
      setPrimeraArista(null);
    }
  };

  const handleConfirmarArista = () => {
    if (!modalArista) return;
    let peso;
    const raw = pesoTemporal;
    if (raw === null || raw === undefined || String(raw).trim() === "") peso = 1;
    else if (/^\d+$/.test(String(raw).trim())) peso = Math.max(1, parseInt(String(raw).trim()));
    else peso = String(raw).trim();
    if (tipoIdentificador === "numerico") peso = coerceEdgeWeightToAlpha(peso);
    const nueva = {
      id: Date.now() + Math.random(),
      origen: modalArista.origen,
      destino: modalArista.destino,
      peso,
      dirigida: !!esDirigido,
    };
    setAristas(prev => [...prev, nueva]);
    setModalArista(null);
  };

  const handleEliminarArista = (id) => {
    setAristas(prev => prev.filter(a => a.id !== id));
  };

  // arrastre de vértices (mouse)
  const handleMouseDownVertex = (e, idx) => {
    e.stopPropagation();
    dragging.current = { idx, startX: e.clientX, startY: e.clientY };
  };
  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const { idx, startX, startY } = dragging.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    dragging.current.startX = e.clientX;
    dragging.current.startY = e.clientY;
    setVertices(prev => prev.map((v, i) => (i === idx ? { ...v, x: v.x + dx, y: v.y + dy } : v)));
  };
  const handleMouseUp = () => {
    dragging.current = null;
  };

  // export / import JSON
  const exportGrafoObject = (grafoObj) => {
    const grafoData = grafoObj || { vertices, aristas };
    const dataStr = JSON.stringify({ nombre: grafoData.nombre || "grafo", vertices: grafoData.vertices || grafoData.vertices || vertices, aristas: grafoData.aristas || grafoData.aristas || aristas }, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const fname = (grafoData.nombre || `grafo`).replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-\.]/g, "");
    link.download = `${fname}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCargarJSON = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.vertices || !data.aristas) { alert("Formato de JSON inválido"); return; }
        setVertices(data.vertices || []);
        setAristas(data.aristas || []);
        // intentar inferir tipo
        if ((data.vertices || []).every(v => /^[A-Za-z]+$/.test(v.etiqueta || ""))) setTipoIdentificador("alfabetico");
        else setTipoIdentificador("numerico");
        alert("Grafo cargado correctamente.");
      } catch (err) {
        alert("Error al leer JSON");
      }
    };
    reader.readAsText(file);
    // limpiar input
    if (inputFileRef.current) inputFileRef.current.value = "";
  };

  // ---- Render helpers (adaptados de OperacionesGrafosClean.jsx) ----

  // render aristas y vértices con curvas y bucles
  const renderSVGGraph = (vs = vertices, es = aristas, width = 520, height = 420) => {
    // agrupar aristas por par (sin diferenciar dirección para el layout visual)
    const map = new Map();
    for (const a of es) {
      const k1 = `${a.origen}-${a.destino}`;
      const k2 = `${a.destino}-${a.origen}`;
      const key = a.origen <= a.destino ? k1 : k2;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    const grupos = Array.from(map.entries());
    const paddingX = 40;
    const topY = 90;
    const bottomY = height - 90;
    // layout simple: si no posiciones dadas y hay vertices, reaplicar circular
    if (vs.length > 0 && (vs.some(v => v.x === undefined || v.y === undefined))) {
      layoutCircular(vs, width, height);
    }
    const strokeColor = "#1d6a96";
    const bgColor = "#e7f0ee";
    const strokeWidth = 2;

    return (

      <svg
        width={width}
        height={height}
        style={{ border: "2px solid #1d6a96", borderRadius: "8px", backgroundColor: bgColor }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {grupos.map(([key, grupo]) => {
          const groupSize = grupo.length;
          const midIndex = (groupSize - 1) / 2;
          const ordered = grupo.map((a, i) => ({ a, i })).sort((p, q) => Math.abs(q.i - midIndex) - Math.abs(p.i - midIndex));
          return ordered.map(({ a: arista, i: idx }) => {
            const v1 = vs[arista.origen];
            const v2 = vs[arista.destino];
            if (!v1 || !v2) return null;
            // bucle
            if (v1.id === v2.id) {
              const x = v1.x;
              const y = v1.y;
              const rx = 26 + idx * 6;
              const ry = 26 + idx * 6;
              const offset = 26 + idx * 12;
              const path = `M ${x} ${y - ry} C ${x + offset} ${y - ry - offset}, ${x + rx + offset} ${y + ry - offset}, ${x} ${y + ry}`;
              const pesoX = x + rx + offset * 0.7;
              const pesoY = y - ry - offset * 0.5;
              return (
                <g key={arista.id}>
                  <path d={path} stroke={bgColor} strokeWidth={strokeWidth + 6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <path d={path} stroke={strokeColor} strokeWidth={strokeWidth + 1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <text x={pesoX} y={pesoY} fill="#283b42" fontSize="11" fontWeight="bold" textAnchor="middle" dy="0.3em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
                </g>
              );
            }
            // curva Q
            const x1 = v1.x; const y1 = v1.y;
            const x2 = v2.x; const y2 = v2.y;
            const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
            const dx = x2 - x1; const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const ux = -dy / len; const uy = dx / len;
            const baseSpacing = 20;
            let offset = (idx - midIndex) * baseSpacing;
            // evitar colisiones con nodos
            const collisionRadius = 28;
            let collision = false;
            for (const other of vs) {
              if (other.id === v1.id || other.id === v2.id) continue;
              const dist = distancePointToSegment(other.x, other.y, x1, y1, x2, y2);
              if (dist < collisionRadius) { collision = true; break; }
            }
            if (collision) {
              const direction = ux >= 0 ? 1 : -1;
              offset = direction * (baseSpacing * 1.8 + Math.sign(offset || 1) * baseSpacing);
            }
            const lengthScale = Math.max(1, len / 150);
            offset = offset * lengthScale;
            const cx = mx + ux * offset;
            const cy = my + uy * offset;
            const path = `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
            const t = Math.abs(offset) <= 6 ? 0.33 : 0.5;
            const pesoX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
            const pesoY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
            return (
              <g key={arista.id}>
                <path d={path} stroke={bgColor} strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d={path} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Si es dirigido, dibujar una pequeña flecha en el extremo */}
                {arista.dirigida && (() => {
                  // calcular punto cercano al destino para colocar la flecha
                  const tpos = 0.88;
                  const qx = (1 - tpos) * (1 - tpos) * x1 + 2 * (1 - tpos) * tpos * cx + tpos * tpos * x2;
                  const qy = (1 - tpos) * (1 - tpos) * y1 + 2 * (1 - tpos) * tpos * cy + tpos * tpos * y2;
                  // vector tangente aproximado
                  const ex = x2 - qx;
                  const ey = y2 - qy;
                  const elen = Math.hypot(ex, ey) || 1;
                  const ux2 = ex / elen; const uy2 = ey / elen;
                  const arrowSize = 8;
                  const ax1 = qx + (-ux2 * arrowSize - uy2 * arrowSize * 0.5);
                  const ay1 = qy + (-uy2 * arrowSize + ux2 * arrowSize * 0.5);
                  const ax2 = qx + (-ux2 * arrowSize + uy2 * arrowSize * 0.5);
                  const ay2 = qy + (-uy2 * arrowSize - ux2 * arrowSize * 0.5);
                  return <polygon points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`} fill={strokeColor} />;
                })()}
                <text x={pesoX} y={pesoY} fill="#283b42" fontSize="12" fontWeight="bold" textAnchor="middle" dy="0.35em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
              </g>
            );
          });
        })}

        {vs.map((v, idx) => (
          <g key={`v-${v.id}`}>
            <circle
              cx={v.x}
              cy={v.y}
              r="22"
              fill={primeraArista === idx ? "#85b8cb" : "#1d6a96"}
              stroke="#283b42"
              strokeWidth="2"
              style={{ cursor: "pointer", transition: "all 0.15s" }}
              onMouseDown={(e) => handleMouseDownVertex(e, idx)}
              onClick={(e) => { e.stopPropagation(); handleClickVertice(idx); }}
              onDoubleClick={(e) => { e.stopPropagation(); handleEditarEtiquetaPrompt(v.id); }}
            />
            <text x={v.x} y={v.y} textAnchor="middle" dy="0.3em" fill="white" fontSize="13" fontWeight="bold" pointerEvents="none">{v.etiqueta || `V${v.id}`}</text>
          </g>
        ))}
      </svg>
    );
  };

  // ---- UI principal ----
  // ---- UI principal ----
  if (fase === "crear") {
    return (
      <div className="operaciones-grafos panel">
        <div className="crear-card">
          <div className="crear-header">Crear Grafo</div>
          <div style={{ padding: 8 }}>
            {/* Cantidad */}
            <div className="campo">
              <label style={{ fontWeight: "bold" }}>Cantidad de vértices:</label>
              <input
                id="numVertices"
                type="number"
                value={numVertices}
                onChange={(e) => setNumVertices(e.target.value)}
                min="1"
                max="12"
                placeholder="1-12"
                className="input-chico"
                style={{
                  color: "black",
                  backgroundColor: "white",
                  padding: "6px 8px",
                  border: "1px solid #aaa",
                  borderRadius: "6px",
                }}
              />
            </div>

            <div style={{ height: "1px", background: "#c9d6db", margin: "8px 0" }} />

            {/* Tipo de etiqueta */}
            <div className="campo">
              <label style={{ fontWeight: "bold", color: "black", marginBottom: "8px", display: "block" }}>
                Tipo de etiqueta:
              </label>

              <label>
                <input
                  type="radio"
                  name="tipoId"
                  value="numerico"
                  checked={tipoIdentificador === "numerico"}
                  onChange={(e) => setTipoIdentificador(e.target.value)}
                />
                Numérico
              </label>

              <label>
                <input
                  type="radio"
                  name="tipoId"
                  value="alfabetico"
                  checked={tipoIdentificador === "alfabetico"}
                  onChange={(e) => setTipoIdentificador(e.target.value)}
                />
                Alfabético
              </label>
            </div>

            <div style={{ height: "1px", background: "#c9d6db", margin: "8px 0" }} />

            {/* Método */}
            <div className="campo">
              <label style={{ fontWeight: "bold", marginBottom: "8px", display: "block" }}>
                Método de asignación:
              </label>

              <label>
                <input
                  type="radio"
                  name="metodo"
                  value="automatico"
                  checked={metodoAsignacion === "automatico"}
                  onChange={(e) => setMetodoAsignacion(e.target.value)}
                />
                Automático
              </label>

              <label>
                <input
                  type="radio"
                  name="metodo"
                  value="manual"
                  checked={metodoAsignacion === "manual"}
                  onChange={(e) => setMetodoAsignacion(e.target.value)}
                />
                Manual
              </label>
            </div>

            <button onClick={handleCrearVertices} className="full-width-btn">
              Crear
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (fase === "etiquetar") {
    return (
      <div className="operaciones-grafos panel">
        <div className="crear-card">
          <div className="crear-header">Asignar Etiquetas a los Vértices</div>
          <div style={{ padding: 12 }}>
            <p>Ingrese una etiqueta única para cada vértice:</p>

            {vertices.map((v, i) => (
              <div key={v.id} style={{ marginBottom: "10px" }}>
                <label>Vértice {i + 1}:</label>
                <input
                  type="text"
                  value={v.etiqueta}
                  onChange={(e) => {
                    const nueva = [...vertices];
                    nueva[i].etiqueta = e.target.value;
                    setVertices(nueva);
                  }}
                  placeholder={tipoIdentificador === "numerico" ? "1" : "A"}
                  className="input-clave"
                />
              </div>
            ))}

            <button onClick={handleConfirmarEtiquetas} className="full-width-btn">
              Continuar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="operaciones-grafos panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <h3 style={{ margin: 0, color: "#1d6a96" }}>Representación de Grafos</h3>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input type="checkbox" checked={esDirigido} onChange={(e) => setEsDirigido(e.target.checked)} />
            Dirigido
          </label>
          <button className="boton" onClick={() => { insertarVerticesAutomatico(6); }}>Generar 6 vértices</button>
          <button className="boton" onClick={handleInsertVertice}>➕ Agregar vértice</button>
          <button className="boton" onClick={() => { if (vertices.length > 0 && window.confirm("Vaciar grafo actual?")) { setVertices([]); setAristas([]); } }}>Vaciar</button>
          <button className="boton" onClick={() => exportGrafoObject({ nombre: "grafo", vertices, aristas })}>📤 Exportar JSON</button>
          <button className="boton" onClick={() => inputFileRef.current && inputFileRef.current.click()}>📥 Importar JSON</button>
          {onBack && <button className="boton" onClick={onBack}>⬅ Volver</button>}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: "1 1 auto" }}>
          {renderSVGGraph()}
        </div>

        <div style={{ width: 320 }}>
          <div style={{ marginBottom: 8 }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#283b42" }}>Aristas ({aristas.length})</p>
            <div style={{ maxHeight: 300, overflowY: "auto", paddingTop: 8 }}>
              {aristas.length === 0 ? <p style={{ color: "#666" }}>Ninguna aún</p> : aristas.map(a => {
                const isLoop = a.origen === a.destino;
                const l1 = vertices[a.origen] ? (vertices[a.origen].etiqueta || `V${vertices[a.origen].id}`) : `V${a.origen}`;
                const l2 = vertices[a.destino] ? (vertices[a.destino].etiqueta || `V${vertices[a.destino].id}`) : `V${a.destino}`;
                const label = isLoop ? `${l1} (bucle)` : `${l1} ${a.dirigida ? "→" : "↔"} ${l2}`;
                return (
                  <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", background: "#dfeef1", borderRadius: 6, marginBottom: 6 }}>
                    <div style={{ flex: 1, fontWeight: "bold", color: "#283b42" }}>{label}</div>
                    <input value={a.peso} onChange={(e) => setAristas(prev => prev.map(ar => ar.id === a.id ? { ...ar, peso: e.target.value } : ar))} style={{ width: 64, padding: "4px 6px" }} />
                    <button className="boton" onClick={() => handleEliminarArista(a.id)}>✕</button>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <p style={{ margin: 0, fontWeight: "bold", color: "#283b42" }}>Vértices ({vertices.length})</p>
            <div style={{ maxHeight: 220, overflowY: "auto", paddingTop: 8 }}>
              {vertices.map((v, i) => (
                <div key={v.id} style={{ display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", background: "#eef6f8", borderRadius: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1 }}>{v.etiqueta || `V${v.id}`}</div>
                  <button className="boton" onClick={() => handleEditarEtiquetaPrompt(v.id)}>✏️</button>
                  <button className="boton" onClick={() => handleEliminarVertice(i)}>🗑</button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <small style={{ color: "#666" }}>
              Clic en un vértice → marcar origen. Luego clic en otro vértice → configurar arista.
              <br />
              Doble clic en vértice para editar etiqueta. Arrastra para mover.
            </small>
          </div>
        </div>
      </div>

      {/* modal para peso de arista */}
      {modalArista && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200 }}>
          <div style={{ backgroundColor: "#e7f0ee", padding: 20, borderRadius: 12, border: "3px solid #1d6a96", minWidth: 320 }}>
            <h4 style={{ marginTop: 0, color: "#283b42" }}>Configurar Arista</h4>
            <p style={{ margin: "6px 0 10px 0" }}>
              <strong>Origen:</strong> {vertices[modalArista.origen]?.etiqueta || `V${modalArista.origen}`} → <strong>Destino:</strong> {vertices[modalArista.destino]?.etiqueta || `V${modalArista.destino}`}
            </p>
            <div>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: 6 }}>Ponderación / Peso</label>
              <input type="text" autoFocus value={pesoTemporal} onChange={(e) => setPesoTemporal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleConfirmarArista()} style={{ width: "100%", padding: 8, borderRadius: 6, border: "2px solid #1d6a96" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
              <button className="boton boton_agregar" onClick={handleConfirmarArista}>Confirmar</button>
              <button className="boton" onClick={() => setModalArista(null)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <input type="file" ref={inputFileRef} style={{ display: "none" }} accept=".json,application/json" onChange={handleCargarJSON} />
    </div>
  );
}

export default RepresentacionGrafos;
