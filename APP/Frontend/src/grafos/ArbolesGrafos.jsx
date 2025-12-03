import React, { useState, useMemo, useRef, useEffect } from "react";
import "./OperacionesGrafos.css";

function ArbolesGrafos({ onBack, mode = 'graph', initialDirected = false, initialGraph = null, backLabel = null }) {
  const [fase, setFase] = useState("operaciones");
  const [numVertices, setNumVertices] = useState(6);
  const [tipoIdentificador, setTipoIdentificador] = useState("numerico"); // numerico | alfabetico
  const [metodoAsignacion, setMetodoAsignacion] = useState("automatico"); // automatico | manual
  const [vertices, setVertices] = useState([]); // {id,x,y,etiqueta}
  const [aristas, setAristas] = useState([]); // {id,origen,destino,peso}
  const [indiceActual, setIndiceActual] = useState(0);
  const [etiquetaActual, setEtiquetaActual] = useState("");
  const [primeraArista, setPrimeraArista] = useState(null);
  const [modalArista, setModalArista] = useState(null); // {origen,destino}
  const [pesoTemporal, setPesoTemporal] = useState(1);
  const [selectOrigen, setSelectOrigen] = useState(null);
  const [selectDestino, setSelectDestino] = useState(null);
  const [pesoManual, setPesoManual] = useState(1);
  
  const [deletingVertexMode, setDeletingVertexMode] = useState(false);
  const [deletingEdgeMode, setDeletingEdgeMode] = useState(false);
  const [esDirigido, setEsDirigido] = useState(!!initialDirected);
  const [grafoActual, setGrafoActual] = useState(1); // 1 o 2
  const [grafo1, setGrafo1] = useState(null); // {vertices, aristas}
  const [grafo2, setGrafo2] = useState(null);
  const [grafoNombre, setGrafoNombre] = useState("");
  const [crearDesdeOperacion, setCrearDesdeOperacion] = useState(false);
  const inputGrafoRef = useRef(null);
  const svgRef = useRef(null);
  const dragging = useRef(null);
  const [treeType, setTreeType] = useState('min'); // 'min' or 'max'
  const [tComplement, setTComplement] = useState(null); // { vertices, aristas }
  const [resultado, setResultado] = useState(null); // {vertices, aristas}
  // Results for both min and max spanning trees and related metadata
  const [minResultado, setMinResultado] = useState(null);
  const [maxResultado, setMaxResultado] = useState(null);
  const [minComplement, setMinComplement] = useState(null);
  const [maxComplement, setMaxComplement] = useState(null);
  const [minCenter, setMinCenter] = useState([]);
  const [maxCenter, setMaxCenter] = useState([]);
  const [minBicenterEdgeId, setMinBicenterEdgeId] = useState(null);
  const [maxBicenterEdgeId, setMaxBicenterEdgeId] = useState(null);
  // Metrics & table state
  const [distMatrix, setDistMatrix] = useState(null);
  const [pathMatrix, setPathMatrix] = useState(null);
  const [eccArray, setEccArray] = useState([]);
  const [sumDistances, setSumDistances] = useState([]);
  const [radiusVal, setRadiusVal] = useState(null);
  const [diameterVal, setDiameterVal] = useState(null);
  const [medianVerts, setMedianVerts] = useState([]);
  const [diameterPairs, setDiameterPairs] = useState([]);
  const [highlightMetric, setHighlightMetric] = useState('none'); // 'none'|'radius'|'diameter'|'median'

  useEffect(()=>{
    try{ console.log('ArbolesGrafos mounted, fase=', fase); }catch(e){}
  }, [fase]);

  // --- Creation and editing helpers (copied/adapted) ---
  const handleCrearVertices = () => {
    const n = Math.max(1, Math.min(12, parseInt(numVertices) || 1));
    try { console.log('handleCrearVertices called, n=', n, 'metodoAsignacion=', metodoAsignacion, 'tipoIdentificador=', tipoIdentificador); } catch(e){}
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
      nuevos.push({ id: i, x, y, etiqueta: metodoAsignacion === "manual" ? "" : null });
    }
    if (metodoAsignacion === "automatico") {
      const etiquetados = nuevos.map((v, i) => ({
        ...v,
        etiqueta: tipoIdentificador === "numerico" ? String(i + 1) : String.fromCharCode(65 + (i % 26)),
      }));
      setVertices(etiquetados);
      try { console.log('setVertices done, count=', etiquetados.length); } catch(e){}
      setFase("grafo");
    } else {
      setVertices(nuevos);
      try { console.log('setVertices (manual) done, count=', nuevos.length); } catch(e){}
      setFase("etiquetar");
    }
  };

  const handleConfirmarEtiquetas = () => {
    const etiquetas = vertices.map(v => (v.etiqueta || '').trim());
    if (etiquetas.some(e => e === "")) { alert("Todas las etiquetas deben estar completas"); return; }
    const uniqueLabels = new Set(etiquetas);
    if (uniqueLabels.size !== etiquetas.length) { alert("Las etiquetas deben ser únicas"); return; }
    if (tipoIdentificador === "numerico") {
      if (etiquetas.some(e => !/^[0-9]+$/.test(e))) { alert("Todas las etiquetas deben ser números"); return; }
    } else {
      if (etiquetas.some(e => !/^[A-Za-z]+$/.test(e))) { alert("Todas las etiquetas deben ser letras"); return; }
    }
    setFase("grafo");
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

  const handleEditarEtiquetaPrompt = (vertexId) => {
    const idx = vertices.findIndex(v => v.id === vertexId);
    if (idx === -1) return;
    const current = (vertices[idx].etiqueta || `V${vertexId}`);
    const respuesta = window.prompt(`Editar etiqueta del vértice:`, current);
    if (respuesta === null) return;
    const nuevo = String(respuesta).trim();
    if (nuevo === "") { alert("La etiqueta no puede quedar vacía"); return; }
    if (tipoIdentificador === "numerico") {
      if (!/^[0-9]+$/.test(nuevo)) { alert("Cuando el tipo es numérico, sólo se permiten números"); return; }
    } else if (tipoIdentificador === "alfabetico") {
      if (!/^[A-Za-z]+$/.test(nuevo)) { alert("Cuando el tipo es alfabético, sólo se permiten letras"); return; }
    }
    const dup = vertices.some((v, i) => i !== idx && String((v.etiqueta||"").trim()) === nuevo);
    if (dup) { alert("La etiqueta ya existe. Debe ser única"); return; }
    const newVerts = vertices.map((v, i) => (i === idx ? { ...v, etiqueta: nuevo } : v));
    setVertices(newVerts);
  };

  const handleInsertVertice = () => {
    const respuesta = window.prompt("Ingrese etiqueta para el nuevo vértice:", "");
    if (respuesta === null) return;
    const nuevo = String(respuesta).trim();
    if (nuevo === "") { alert("La etiqueta no puede quedar vacía"); return; }
    if (tipoIdentificador === 'numerico') {
      if (!/^[0-9]+$/.test(nuevo)) { alert('Cuando el tipo es numérico, sólo se permiten números'); return; }
    } else if (tipoIdentificador === 'alfabetico') {
      if (!/^[A-Za-z]+$/.test(nuevo)) { alert('Cuando el tipo es alfabético, sólo se permiten letras'); return; }
    }
    const dup = vertices.some((v) => String((v.etiqueta||"").trim()) === nuevo);
    if (dup) { alert("La etiqueta ya existe. Debe ser única"); return; }
    const findFreePosition = (existing, width = 520, height = 420, minDist = 50) => {
      const paddingX = 40; const paddingY = 60; const maxTries = 200;
      for (let t = 0; t < maxTries; t++) {
        const x = Math.round(paddingX + Math.random() * (width - 2 * paddingX));
        const y = Math.round(paddingY + Math.random() * (height - 2 * paddingY));
        let ok = true;
        for (const v of existing) {
          const dx = (v.x || 0) - x; const dy = (v.y || 0) - y;
          if (Math.hypot(dx, dy) < minDist) { ok = false; break; }
        }
        if (ok) return { x, y };
      }
      const cx = Math.round(width / 2); const cy = Math.round(height / 2);
      return { x: cx, y: cy };
    };
    const { x, y } = findFreePosition(vertices, 520, 420, 50);
    const newV = { id: Date.now() + Math.random(), x, y, etiqueta: nuevo };
    setVertices(prev => [...prev, newV]);
  };

  const handleVertexDeleteClick = (index) => {
    const v = vertices[index];
    const label = v ? (v.etiqueta || `V${v.id}`) : `V${index}`;
    const ok = window.confirm(`¿Eliminar vértice ${label}?`);
    if (!ok) { setDeletingVertexMode(false); return; }
    const idxToRemove = index;
    const newVertices = vertices.filter((_, i) => i !== idxToRemove);
    const mapping = {}; let newIdx = 0;
    for (let i = 0; i < vertices.length; i++) {
      if (i === idxToRemove) { mapping[i] = undefined; continue; }
      mapping[i] = newIdx++;
    }
    const newAristas = aristas.map(a => ({ ...a })).filter(a => mapping[a.origen] !== undefined && mapping[a.destino] !== undefined).map(a => ({ ...a, origen: mapping[a.origen], destino: mapping[a.destino] }));
    setVertices(newVertices);
    setAristas(newAristas);
    setMergeSelection([]);
    setMergingMode(false);
    setContractingMode(false);
    setDeletingVertexMode(false);
  };

  const handleEdgeDeleteClick = (edge) => {
    const a = edge;
    const l1 = (vertices[a.origen] && (vertices[a.origen].etiqueta || `V${vertices[a.origen].id}`)) || `V${a.origen}`;
    const l2 = (vertices[a.destino] && (vertices[a.destino].etiqueta || `V${vertices[a.destino].id}`)) || `V${a.destino}`;
    const label = a.origen === a.destino ? `${l1} (bucle)` : `${l1} ↔ ${l2}`;
    const ok = window.confirm(`¿Eliminar arista ${label}?`);
    if (!ok) { setDeletingEdgeMode(false); return; }
    setAristas(prev => prev.filter(x => x.id !== a.id));
    setDeletingEdgeMode(false);
  };

  const handleConfirmarArista = () => {
    if (!modalArista) return;
    let peso;
    const raw = pesoTemporal;
    if (raw === null || raw === undefined || String(raw).trim() === "") {
      peso = 1;
    } else if (/^\d+$/.test(String(raw).trim())) {
      peso = Math.max(1, parseInt(String(raw).trim()));
    } else {
      peso = String(raw).trim();
    }
    const nueva = { id: Date.now() + Math.random(), origen: modalArista.origen, destino: modalArista.destino, peso, dirigida: !!esDirigido };
    setAristas((prev) => [...prev, nueva]);
    setModalArista(null);
  };

  const gruposAristas = useMemo(() => {
    const map = new Map();
    for (const a of aristas) {
      const k1 = `${a.origen}-${a.destino}`;
      const k2 = `${a.destino}-${a.origen}`;
      const key = a.origen <= a.destino ? k1 : k2;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    return map;
  }, [aristas]);
  const handleVaciarGrafoGuardado = (n) => {
    const ok = window.confirm(`¿Vaciar el Grafo ${n} guardado? Esta acción eliminará el grafo ${n} de la memoria.`);
    if (!ok) return;
    if (n === 1) setGrafo1(null);
    if (n === 2) setGrafo2(null);
    // si el resultado depende de ambos, limpiarlo
    setResultado(null);
    alert(`Grafo ${n} eliminado de la memoria.`);
  };

  const handleVaciarGrafoActual = () => {
    const ok = window.confirm("¿Vaciar el grafo actual? Se perderán vértices y aristas.");
    if (!ok) return;
    setVertices([]);
    setAristas([]);
    setGrafoNombre("");
    setPrimeraArista(null);
    setModalArista(null);
    setResultado(null);
    alert("Grafo actual vaciado.");
  };

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

  const handleMouseDownVertex = (e, idx) => {
    e.stopPropagation();
    dragging.current = { idx, startX: e.clientX, startY: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const { idx, startX, startY } = dragging.current;
    const rect = svg.getBoundingClientRect();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    dragging.current.startX = e.clientX;
    dragging.current.startY = e.clientY;
    setVertices((prev) => prev.map((v, i) => {
      if (i !== idx) return v;
      let newX = v.x + dx;
      let newY = v.y + dy;
      const margin = 30;
      const minX = margin;
      const maxX = rect.width - margin;
      const minY = margin;
      const maxY = rect.height - margin;
      if (newX < minX) newX = minX;
      if (newX > maxX) newX = maxX;
      if (newY < minY) newY = minY;
      if (newY > maxY) newY = maxY;
      return { ...v, x: newX, y: newY };
    }));
  };

  const handleMouseUp = () => {
    dragging.current = null;
  };

  // Helper: point on circle border from center (cx,cy) towards (tx,ty)
  const pointOnCircle = (cx, cy, r, tx, ty) => {
    const dx = tx - cx;
    const dy = ty - cy;
    const d = Math.hypot(dx, dy) || 1;
    return { x: cx + (dx / d) * r, y: cy + (dy / d) * r };
  };

  // Helpers para tipos y combinación de pesos
  const detectEdgeWeightType = (es) => {
    if (!es || es.length === 0) return "none";
    let hasNum = false; let hasAlpha = false;
    for (const a of es) {
      const p = a.peso;
      if (p === null || p === undefined) continue;
      if (typeof p === 'number' || (typeof p === 'string' && /^\d+$/.test(p))) hasNum = true;
      if (typeof p === 'string' && /^[A-Za-z]+$/.test(p)) hasAlpha = true;
    }
    if (hasNum && !hasAlpha) return 'number';
    if (hasAlpha && !hasNum) return 'alpha';
    if (hasNum && hasAlpha) return 'mixed';
    return 'none';
  };

  const combineWeights = (w1, w2, mode = 'union') => {
    // Normalize numeric strings
    const isNum = (v) => (typeof v === 'number') || (typeof v === 'string' && /^\d+$/.test(v));
    const toNum = (v) => (typeof v === 'number' ? v : parseInt(v || 0));
    const isAlpha = (v) => typeof v === 'string' && /^[A-Za-z]+$/.test(v);

    if (isNum(w1) && isNum(w2)) {
      const n1 = toNum(w1); const n2 = toNum(w2);
      if (mode === 'union') return n1 + n2; // suma de ponderaciones en unión
      if (mode === 'intersect') return Math.min(n1, n2); // conservar lo mínimo en intersección
      return n1; // default take first
    }
    // Si son alfabéticos, combinar con '/'
    if (isAlpha(w1) && isAlpha(w2)) {
      if (mode === 'union' || mode === 'intersect') {
        if (w1 === w2) return w1;
        return `${w1}/${w2}`;
      }
      return w1;
    }
    // Si tipos mixtos, preferir el primero no nulo
    return (w1 !== undefined && w1 !== null) ? w1 : w2;
  };

  // Helpers para coerción de pesos según tipo de etiquetas de vértices
  const isLabelAlpha = (label) => typeof label === 'string' && /^[A-Za-z]+$/.test(label);
  const isLabelNumeric = (label) => typeof label === 'string' && /^\d+$/.test(label);

  const pairLabel = (a, b) => {
    if (isLabelNumeric(String(a)) && isLabelNumeric(String(b))) return `${a},${b}`;
    return `${a}${b}`;
  };

  const fmtValue = (v) => {
    if (v === null || v === undefined) return '∅';
    if (!isFinite(v)) return '∞';
    return v;
  };

  const letterToNumber = (s) => {
    if (!s) return 0;
    // single letter or sequence like 'A' -> 1, 'AA' -> 27 etc.
    s = String(s).toUpperCase();
    let n = 0;
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i) - 64; // A=1
      if (code >= 1 && code <= 26) {
        n = n * 26 + code;
      }
    }
    return n || 0;
  };

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

  const coerceEdgeWeightToNumeric = (peso) => {
    if (peso === null || peso === undefined) return 1;
    if (typeof peso === 'number') return peso;
    const str = String(peso);
    // composite like 'A/B' or 'A' or '3'
    if (/^\d+$/.test(str)) return parseInt(str);
    // if contains '/', split and sum letter values
    const parts = str.split('/');
    let total = 0;
    for (const p of parts) {
      const val = letterToNumber(p.trim());
      if (val) total += val;
      else if (/^\d+$/.test(p.trim())) total += parseInt(p.trim());
    }
    return total || 1;
  };

  const coerceEdgeWeightToAlpha = (peso) => {
    if (peso === null || peso === undefined) return 'A';
    if (typeof peso === 'string' && /^[A-Za-z/]+$/.test(peso)) return peso; // already letters or composite
    // number -> map to letters
    const n = typeof peso === 'number' ? Math.max(1, Math.floor(peso)) : (parseInt(String(peso)) || 1);
    return lettersFromNumber(n);
  };

  const getDefaultEdgeWeight = () => {
    // Default numeric weight is 1, but if vertex labels are numeric we want alphabetic default
    if (tipoIdentificador === 'numerico') return coerceEdgeWeightToAlpha(1);
    return 1;
  };

  const finalizeResultado = (vs, as) => {
    const vertices = vs || [];
    const aristas = as || [];
    // detect label type: if all labels alphabetic -> 'alpha', if all numeric -> 'numeric', else 'mixed'
    let hasAlpha = false; let hasNum = false;
    for (const v of vertices) {
      const lbl = v.etiqueta || String(v.id);
      if (/^[A-Za-z]+$/.test(lbl)) hasAlpha = true;
      if (/^\d+$/.test(lbl)) hasNum = true;
    }
    const labelType = (hasAlpha && !hasNum) ? 'alpha' : (hasNum && !hasAlpha) ? 'numeric' : 'mixed';

    const coercedAristas = aristas.map(a => ({ ...a }));
    // If vertices already have numeric x/y coordinates (were created by the user),
    // preserve that layout so the tree appears in the same positions as the original graph.
    const needsLayout = (vertices || []).some(v => typeof v.x !== 'number' || typeof v.y !== 'number');
    if (needsLayout) {
      layoutCircular(vertices, 520, 420);
    }
    setResultado({ vertices, aristas: coercedAristas });
  };

  // Disponibilidad de cada grafo (guardado o actual en memoria)
  const hasG1 = !!grafo1 || (grafoActual === 1 && vertices.length > 0);
  const hasG2 = !!grafo2 || (grafoActual === 2 && vertices.length > 0);

  // Render utilitario para grafo (solo visualización, sin interacción)
  const renderGraph = (vs = [], es = [], small = false, directed = false, options = {}) => {
    const map = new Map();
    for (const a of es) {
      const k1 = `${a.origen}-${a.destino}`;
      const k2 = `${a.destino}-${a.origen}`;
      const key = a.origen <= a.destino ? k1 : k2;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    const grupos = Array.from(map.entries());

    const width = small ? 320 : 520;
    const height = small ? 280 : 420;
    const paddingX = small ? 30 : 40;
    const topY = small ? 70 : 90;
    const bottomY = small ? (height - 70) : (height - 90);
    
    // Two-row layout for small graphs, but preserve explicit positions when present
    let layoutVs = vs;
    if (small && vs.length > 0) {
      const needsLayout = vs.some(v => typeof v.x !== 'number' || typeof v.y !== 'number');
      if (needsLayout) {
        layoutVs = vs.map((v, i) => {
          const cols = Math.ceil(vs.length / 2);
          const row = i < cols ? 0 : 1;
          const col = row === 0 ? i : i - cols;
          const spacingX = cols > 1 ? (width - 2 * paddingX) / (cols - 1) : 0;
          return {
            ...v,
            x: paddingX + col * spacingX,
            y: row === 0 ? topY : bottomY
          };
        });
      } else {
        // keep the provided coordinates but clone objects to avoid external mutation
        layoutVs = vs.map(v => ({ ...v }));
      }
    }

    const strokeColor = "#1d6a96";
    const bgColor = "#e7f0ee";
    const strokeWidth = 2;
    const highlightNodeColor = options.highlightNodeColor || '#d13b3b';
    const highlightEdgeColor = options.highlightEdgeColor || '#d13b3b';

    const markerId = `arrow-${small ? 'small' : 'big'}`;
    return (
      <svg ref={svgRef} width={width} height={height} style={{ border: "2px solid #1d6a96", borderRadius: "8px", backgroundColor: bgColor }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
        <defs>
          <marker id={markerId} viewBox="0 0 10 10" refX={small ? 7 : 12} refY="5" markerWidth={small ? 6 : 10} markerHeight={small ? 6 : 10} orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={strokeColor} />
          </marker>
          {/* even smaller marker for self-loops to keep arrowheads subtle */}
          <marker id={`${markerId}-loop`} viewBox="0 0 10 10" refX={small ? 4 : 4} refY="5" markerWidth={small ? 4 : 4} markerHeight={small ? 4 : 4} markerUnits="userSpaceOnUse" orient="auto-start-reverse">
            <path d="M 0 0 L 4 5 L 0 10 z" fill={strokeColor} />
          </marker>
        </defs>
                {grupos.map(([key, grupo]) => {
          const groupSize = grupo.length;
          const midIndex = (groupSize - 1) / 2;
          const ordered = grupo.map((a, i) => ({ a, i })).sort((p, q) => Math.abs(q.i - midIndex) - Math.abs(p.i - midIndex));
            return ordered.map(({ a: arista, i: idx }) => {
            const v1 = layoutVs[arista.origen];
            const v2 = layoutVs[arista.destino];
            if (!v1 || !v2) return null;

              const edgeHighlighted = options.highlightEdges && options.highlightEdges.has(arista.id);
              const edgeStrokeColor = edgeHighlighted ? highlightEdgeColor : strokeColor;

              if (v1.id === v2.id) {
                const x = v1.x;
                const y = v1.y;
                // enlarge self-loop to make it visible; spacing grows with index
                const rx = 46 + idx * 10;
                const ry = 42 + idx * 10;
                const offset = 52 + idx * 14;
                const path = `M ${x + 18} ${y} C ${x + offset} ${y - offset}, ${x + offset + rx} ${y + offset}, ${x + 18} ${y}`;
                const pesoX = x + offset + rx * 0.25;
                const pesoY = y - ry * 0.25;
                return (
                  <g key={arista.id} onClick={(e) => { if (deletingEdgeMode) { handleEdgeDeleteClick(arista); e.stopPropagation(); } }} style={{ cursor: deletingEdgeMode ? 'pointer' : 'default' }}>
                    <path d={path} stroke={bgColor} strokeWidth={strokeWidth + 6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <path d={path} stroke={edgeStrokeColor} strokeWidth={edgeHighlighted ? strokeWidth + 2 : strokeWidth + 1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" markerEnd={(directed || arista.dirigida) ? `url(#${markerId}-loop)` : undefined} />
                    <text x={pesoX} y={pesoY} fill="#283b42" fontSize="12" fontWeight="bold" textAnchor="middle" dy="0.3em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
                  </g>
                );
              }

            // compute endpoints on vertex circle borders so arrows touch node edges
            const R = 22; // vertex radius
            const p1 = pointOnCircle(v1.x, v1.y, R, v2.x, v2.y);
            const p2 = pointOnCircle(v2.x, v2.y, R, v1.x, v1.y);
            const x1 = p1.x; const y1 = p1.y;
            const x2 = p2.x; const y2 = p2.y;
            const mx = (x1 + x2) / 2; const my = (y1 + y2) / 2;
            const dx = x2 - x1; const dy = y2 - y1;
            const len = Math.hypot(dx, dy) || 1;
            const ux = -dy / len; const uy = dx / len;
            const baseSpacing = 20;
            let offset = (idx - midIndex) * baseSpacing;
            const collisionRadius = 28;
            let collision = false;
            for (const other of layoutVs) {
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
            // Si el offset es muy pequeño (línea prácticamente recta), desplazar la etiqueta
            const t = Math.abs(offset) <= 6 ? 0.33 : 0.5;
            const pesoX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
            const pesoY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
            return (
              <g key={arista.id}>
                <path d={path} stroke={bgColor} strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d={path} stroke={edgeStrokeColor} strokeWidth={edgeHighlighted ? strokeWidth + 2 : strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <text x={pesoX} y={pesoY} fill="#283b42" fontSize="12" fontWeight="bold" textAnchor="middle" dy="0.35em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
              </g>
            );
          });
        })}

        {layoutVs.map((v, idx) => {
          const nodeHighlighted = options.highlightNodes && (options.highlightNodes.has(v.id) || options.highlightNodes.has(String(v.etiqueta)));
          const fillColorNode = nodeHighlighted ? highlightNodeColor : "#1d6a96";
          return (
            <g key={`v-op-${v.id}`}>
              <circle cx={v.x} cy={v.y} r="22" fill={fillColorNode} stroke="#283b42" strokeWidth="2" onMouseDown={(e)=>handleMouseDownVertex(e, idx)} />
              <text x={v.x} y={v.y} textAnchor="middle" dy="0.3em" fill="white" fontSize="13" fontWeight="bold" pointerEvents="none">{v.etiqueta || `V${v.id}`}</text>
            </g>
          );
        })}
                {/* overlay small lines with markerEnd so arrowheads render above nodes (include self-loops) */}
        {es && es.length > 0 && es.map((a) => {
          const directedEdge = directed || a.dirigida;
          if (!directedEdge) return null;
          const sv = layoutVs[a.origen];
          const tv = layoutVs[a.destino];
          if (!sv || !tv) return null;
          // self-loop: place marker near the right-side of the node
          if (a.origen === a.destino) {
            const p2 = pointOnCircle(tv.x, tv.y, 22, tv.x + 1, tv.y);
            // push the start further back and slightly up so the arrowhead sits clearly outside the node
            const sx = p2.x - 14;
            const sy = p2.y - 6;
            return (<path key={`mk-${a.id}`} d={`M ${sx} ${sy} L ${p2.x} ${p2.y}`} stroke="transparent" fill="none" markerEnd={`url(#${markerId}-loop)`}/>);
          }
          // normal directed edge
          const p2 = pointOnCircle(tv.x, tv.y, 22, sv.x, sv.y);
          const dx = tv.x - sv.x; const dy = tv.y - sv.y;
          const len = Math.hypot(dx, dy) || 1;
          const sx = p2.x - (dx / len) * 8;
          const sy = p2.y - (dy / len) * 8;
          return (<path key={`mk-${a.id}`} d={`M ${sx} ${sy} L ${p2.x} ${p2.y}`} stroke="transparent" fill="none" markerEnd={`url(#${markerId})`} />);
        })}
      </svg>
    );
  };

  const layoutCircular = (nodes, width = 520, height = 420) => {
    if (!nodes || nodes.length === 0) return nodes;
    const cx = width / 2;
    const cy = height / 2;
    const margin = 80;
    const r = Math.max(60, Math.min(width, height) / 2 - margin);
    const n = nodes.length;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2; // start at top
      nodes[i].x = Math.round(cx + r * Math.cos(angle));
      nodes[i].y = Math.round(cy + r * Math.sin(angle));
    }
    return nodes;
  };

  // Compute a spanning tree (Kruskal) and the complement (edges not in the tree)
  const computeSpanningTree = (vs, asEdges, minimize = true) => {
    if (!vs || vs.length === 0) return { treeEdges: [], complementEdges: asEdges || [] };
    const edges = (asEdges || []).map((a) => ({ ...a, weightNum: coerceEdgeWeightToNumeric(a.peso) }));
    edges.sort((a, b) => (minimize ? a.weightNum - b.weightNum : b.weightNum - a.weightNum));
    const parent = Array.from({ length: vs.length }, (_, i) => i);
    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const union = (a, b) => {
      const ra = find(a);
      const rb = find(b);
      if (ra === rb) return false;
      parent[rb] = ra;
      return true;
    };
    const treeEdges = [];
    for (const e of edges) {
      if (typeof e.origen !== 'number' || typeof e.destino !== 'number') continue;
      if (e.origen < 0 || e.destino < 0 || e.origen >= vs.length || e.destino >= vs.length) continue;
      if (union(e.origen, e.destino)) {
        treeEdges.push(e);
        if (treeEdges.length >= Math.max(0, vs.length - 1)) break;
      }
    }
    const treeIds = new Set(treeEdges.map((x) => x.id));
    const complementEdges = (asEdges || []).filter((a) => !treeIds.has(a.id));
    return { treeEdges, complementEdges };
  };

  const visualizeTree = () => {
    // choose current graph (grafoActual) by default
    let vs = [];
    let es = [];
    if (grafoActual === 1) { vs = (grafo1 ? grafo1.vertices : vertices) || []; es = (grafo1 ? grafo1.aristas : aristas) || []; }
    else { vs = (grafo2 ? grafo2.vertices : vertices) || []; es = (grafo2 ? grafo2.aristas : aristas) || []; }
    if (!vs || vs.length === 0) { alert('El grafo seleccionado no tiene vértices'); return; }
    // Use deep copies so layoutCircular and other mutations do not affect the original graph
    const vsCopy = (vs || []).map(v => ({ ...(v || {}) }));
    const esCopy = (es || []).map(a => ({ ...(a || {}) }));
    const { treeEdges, complementEdges } = computeSpanningTree(vsCopy, esCopy, treeType === 'min');
    // prepare tree edges array suitable for finalizeResultado (new objects)
    const treeAs = treeEdges.map((e, i) => ({ id: `t-${i}-${e.id}`, origen: e.origen, destino: e.destino, peso: e.peso, dirigida: e.dirigida }));
    finalizeResultado(vsCopy, treeAs);
    setTComplement({ vertices: vsCopy.map(v => ({ ...v })), aristas: (complementEdges || []).map(a => ({ ...(a || {}) })) });
  };

  // Helper to return the currently active graph's vertices and aristas
  const getCurrentGraph = () => {
    if (grafoActual === 1) return { vs: (grafo1 ? grafo1.vertices : vertices) || [], es: (grafo1 ? grafo1.aristas : aristas) || [] };
    return { vs: (grafo2 ? grafo2.vertices : vertices) || [], es: (grafo2 ? grafo2.aristas : aristas) || [] };
  };

  // Compute centers (or bicenter) of a tree by iterative leaf removal
  const computeTreeCenter = (vs, asEdges) => {
    const n = (vs || []).length;
    if (n === 0) return { centers: [], bicenterEdgeId: null };
    const adj = Array.from({ length: n }, () => []);
    for (const e of (asEdges || [])) {
      if (typeof e.origen === 'number' && typeof e.destino === 'number') {
        adj[e.origen].push({ to: e.destino, id: e.id });
        adj[e.destino].push({ to: e.origen, id: e.id });
      }
    }
    const deg = adj.map(a => a.length);
    const removed = new Array(n).fill(false);
    let leaves = [];
    for (let i = 0; i < n; i++) if (deg[i] <= 1) leaves.push(i);
    let remaining = n;
    while (remaining > 2 && leaves.length > 0) {
      const nextLeaves = [];
      for (const leaf of leaves) {
        if (removed[leaf]) continue;
        removed[leaf] = true;
        remaining--;
        for (const nb of adj[leaf]) {
          if (removed[nb.to]) continue;
          deg[nb.to]--;
          if (deg[nb.to] === 1) nextLeaves.push(nb.to);
        }
      }
      leaves = nextLeaves;
    }
    const centers = [];
    for (let i = 0; i < n; i++) if (!removed[i]) centers.push(i);
    if (centers.length === 0) centers.push(...leaves);
    let bicenterEdgeId = null;
    if (centers.length === 2) {
      const [a, b] = centers;
      for (const e of (asEdges || [])) {
        if ((e.origen === a && e.destino === b) || (e.origen === b && e.destino === a)) { bicenterEdgeId = e.id; break; }
      }
    }
    return { centers, bicenterEdgeId };
  };

  // Generate both min and max spanning trees, complements and centers; center the tree layouts for small view
  const handleGenerarArboles = () => {
    const { vs, es } = getCurrentGraph();
    if (!vs || vs.length === 0) { alert('El grafo actual no tiene vértices'); return; }

    const vsCopyBase = (vs || []).map(v => ({ ...(v || {}) }));
    const esCopyBase = (es || []).map(a => ({ ...(a || {}) }));

    // Min tree
    const { treeEdges: minTreeEdges, complementEdges: minComplementEdges } = computeSpanningTree(vsCopyBase.map(v=>({...v})), esCopyBase.map(a=>({...a})), true);
    const minVs = vsCopyBase.map(v => ({ ...v }));
    const minAs = minTreeEdges.map((e, i) => ({ id: `min-t-${i}-${e.id}`, origen: e.origen, destino: e.destino, peso: e.peso, dirigida: e.dirigida }));
    
    setMinResultado({ vertices: minVs, aristas: minAs });
    setMinComplement({ vertices: vsCopyBase.map(v=>({...v})), aristas: (minComplementEdges||[]).map(a=>({...a})) });
    const minCenterRes = computeTreeCenter(minVs, minAs);
    setMinCenter(minCenterRes.centers || []);
    setMinBicenterEdgeId(minCenterRes.bicenterEdgeId ?? null);

    // Max tree
    const { treeEdges: maxTreeEdges, complementEdges: maxComplementEdges } = computeSpanningTree(vsCopyBase.map(v=>({...v})), esCopyBase.map(a=>({...a})), false);
    const maxVs = vsCopyBase.map(v => ({ ...v }));
    const maxAs = maxTreeEdges.map((e, i) => ({ id: `max-t-${i}-${e.id}`, origen: e.origen, destino: e.destino, peso: e.peso, dirigida: e.dirigida }));
    
    setMaxResultado({ vertices: maxVs, aristas: maxAs });
    setMaxComplement({ vertices: vsCopyBase.map(v=>({...v})), aristas: (maxComplementEdges||[]).map(a=>({...a})) });
    const maxCenterRes = computeTreeCenter(maxVs, maxAs);
    setMaxCenter(maxCenterRes.centers || []);
    setMaxBicenterEdgeId(maxCenterRes.bicenterEdgeId ?? null);

    // For backward compatibility keep resultado pointing to minResultado
    setResultado({ vertices: minVs, aristas: minAs });
    setTComplement({ vertices: minVs.map(v=>({...v})), aristas: (minComplementEdges||[]).map(a=>({...a})) });
  };

  // --- Utilities copied/adapted from OperacionesGrafosClean for file upload/export/edit actions ---
  const exportGrafoObject = (grafoObj) => {
    const grafoData = grafoObj || { nombre: grafoNombre, vertices, aristas };
    const dataStr = JSON.stringify(grafoData, null, 2);
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
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.vertices || !data.aristas) {
          alert("Formato de JSON inválido");
          return;
        }
        setNumVertices(data.numVertices || data.vertices.length);
        setTipoIdentificador(data.tipoIdentificador || "numerico");
        setMetodoAsignacion(data.metodoAsignacion || "automatico");
        const targetFromInput = event.target && event.target.dataset && event.target.dataset.target ? parseInt(event.target.dataset.target) : null;
        if (fase === "operaciones") {
          const target = targetFromInput || grafoActual || 1;
          const nombre = data.nombre || `Grafo ${target}`;
          const grafoData = { vertices: data.vertices, aristas: data.aristas, nombre };
          if (target === 1) setGrafo1(grafoData);
          else setGrafo2(grafoData);
          alert(`Grafo cargado en Grafo ${target}`);
          if (event.target && event.target.dataset) delete event.target.dataset.target;
          return;
        }
        setVertices(data.vertices);
        setAristas(data.aristas);
        setGrafoNombre(data.nombre || "");
        setFase("grafo");
        alert(`Grafo cargado en Grafo ${grafoActual}`);
      } catch (error) {
        alert("Error al cargar el archivo JSON");
      }
    };
    reader.readAsText(file);
  };

  const handleStartCreateGraph = (n) => {
    setGrafoActual(n);
    setVertices([]);
    setAristas([]);
    setGrafoNombre("");
    setCrearDesdeOperacion(true);
    setFase("crear");
  };

  const handleEditarGrafo = (n) => {
    setGrafoActual(n);
    const saved = n === 1 ? grafo1 : grafo2;
    if (saved) {
      setVertices(saved.vertices || []);
      setAristas(saved.aristas || []);
      setGrafoNombre(saved.nombre || `Grafo ${n}`);
    } else {
      setVertices([]);
      setAristas([]);
      setGrafoNombre(`Grafo ${n}`);
    }
    setCrearDesdeOperacion(true);
    setPrimeraArista(null);
    setFase("grafo");
  };

  const handleUploadTo = (n) => {
    setGrafoActual(n);
    if (inputGrafoRef.current) {
      try { inputGrafoRef.current.dataset.target = String(n); } catch (e) { }
      inputGrafoRef.current.click();
    }
  };

  const handleGuardarGrafo = () => {
    let nombre = (grafoNombre && grafoNombre.trim()) || "";
    if (!nombre) {
      const respuesta = window.prompt(`Ingrese nombre para el grafo ${grafoActual}:`, `Grafo ${grafoActual}`);
      if (respuesta === null) return;
      nombre = respuesta.trim() || `Grafo ${grafoActual}`;
      setGrafoNombre(nombre);
    }
    const grafoData = { vertices, aristas, nombre };
    if (grafoActual === 1) {
      setGrafo1(grafoData);
      alert(`Grafo 1 guardado correctamente como '${nombre}'`);
    } else {
      setGrafo2(grafoData);
      alert(`Grafo 2 guardado correctamente como '${nombre}'`);
    }
    const exportObj = {
      nombre: grafoData.nombre,
      numVertices: (grafoData.vertices || []).length,
      tipoIdentificador,
      metodoAsignacion,
      vertices: grafoData.vertices,
      aristas: grafoData.aristas
    };
    exportGrafoObject(exportObj);
    if (crearDesdeOperacion) {
      setCrearDesdeOperacion(false);
      setFase("operaciones");
    }
  };

  const persistCurrentToMemory = () => {
    const nombre = (grafoNombre && grafoNombre.trim()) || `Grafo ${grafoActual}`;
    const grafoData = { vertices, aristas, nombre };
    if (grafoActual === 1) {
      setGrafo1(grafoData);
    } else {
      setGrafo2(grafoData);
    }
  };

  // Al montar, recuperar grafos temporales desde localStorage si existen
  // No localStorage syncing: graphs are isolated per-component (in-memory) by design.

  // Precompute labels for T (vértices) and T (aristas) to avoid complex inline JSX expressions
  const tVerticesLabels = (function(){
    const vsSrc = resultado ? (resultado.vertices || []) : ((grafo1 ? grafo1.vertices : (grafoActual === 1 ? vertices : [])) || []);
    return (vsSrc || []).map(v => v?.etiqueta || `V${v?.id}`);
  })();

  const tAristasLabels = (function(){
    if (resultado && resultado.aristas) {
      return (resultado.aristas || []).map(a => {
        const verts = resultado.vertices || [];
        const v1 = verts[a.origen];
        const v2 = verts[a.destino];
        const l1 = v1 ? (v1.etiqueta || `V${v1.id}`) : `V${a.origen}`;
        const l2 = v2 ? (v2.etiqueta || `V${v2.id}`) : `V${a.destino}`;
        const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
        return `${pairLabel(l1,l2)}${peso}`;
      });
    }
    const asSrc = (grafo1 ? grafo1.aristas : (grafoActual === 1 ? aristas : [])) || [];
    const vsForAs = (grafo1 ? grafo1.vertices : (grafoActual === 1 ? vertices : [])) || [];
    return (asSrc || []).map(a => {
      const v1 = vsForAs[a.origen];
      const v2 = vsForAs[a.destino];
      const l1 = v1 ? (v1.etiqueta || `V${v1.id}`) : `V${a.origen}`;
      const l2 = v2 ? (v2.etiqueta || `V${v2.id}`) : `V${a.destino}`;
      const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
      return `${pairLabel(l1,l2)}${peso}`;
    });
  })();

  // Helper to format edge lists as sets with braces: {a b, b c, ...}
  const formatEdgeList = (vs = [], asList = []) => {
    if (!asList || asList.length === 0) return "{}";
    const strs = (asList || []).map(a => {
      const verts = vs || [];
      const v1 = verts[a.origen];
      const v2 = verts[a.destino];
      const l1 = v1 ? (v1.etiqueta || `V${v1.id}`) : `V${a.origen}`;
      const l2 = v2 ? (v2.etiqueta || `V${v2.id}`) : `V${a.destino}`;
      const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
      return `${pairLabel(l1,l2)}${peso}`;
    });
    return `{ ${strs.join(', ')} }`;
  };

  // Extract a small subgraph around the center nodes (within given depth)
  const extractCenterSubgraph = (vs = [], asList = [], centers = [], depth = 1) => {
    if (!vs || vs.length === 0 || !centers || centers.length === 0) return { vertices: [], aristas: [], centersMapped: [] };
    const n = vs.length;
    const adj = Array.from({ length: n }, () => []);
    for (const e of (asList || [])) {
      if (typeof e.origen === 'number' && typeof e.destino === 'number') {
        adj[e.origen].push(e.destino);
        adj[e.destino].push(e.origen);
      }
    }
    const include = new Set();
    const q = [];
    for (const c of centers) {
      if (c >= 0 && c < n && !include.has(c)) { include.add(c); q.push({ v: c, d: 0 }); }
    }
    while (q.length > 0) {
      const cur = q.shift();
      if (cur.d >= depth) continue;
      for (const nb of adj[cur.v]) {
        if (!include.has(nb)) { include.add(nb); q.push({ v: nb, d: cur.d + 1 }); }
      }
    }
    const idxMap = {};
    const newVs = [];
    let ni = 0;
    for (let i = 0; i < n; i++) {
      if (include.has(i)) {
        idxMap[i] = ni;
        // preserve coordinates and etiqueta but reassign id to local index
        const original = vs[i] || {};
        newVs.push({ id: ni, x: original.x, y: original.y, etiqueta: original.etiqueta });
        ni++;
      }
    }
    const newAs = [];
    for (const e of (asList || [])) {
      if (idxMap[e.origen] !== undefined && idxMap[e.destino] !== undefined) {
        newAs.push({ id: e.id, origen: idxMap[e.origen], destino: idxMap[e.destino], peso: e.peso, dirigida: e.dirigida });
      }
    }
    const centersMapped = (centers || []).map(c => (idxMap[c] !== undefined ? idxMap[c] : -1)).filter(x => x >= 0);
    return { vertices: newVs, aristas: newAs, centersMapped };
  };

  // Compute all-pairs shortest paths using Dijkstra (weights coerced to numeric)
  // Returns { dmat, paths } where paths[s][t] is an array of vertex indices from s->t (inclusive)
  const computeAllPairsPaths = (vs = [], asList = [], directed = false) => {
    const n = (vs || []).length;
    const INF = 1e12;
    const adj = Array.from({ length: n }, () => []);
    for (const e of (asList || [])) {
      if (typeof e.origen !== 'number' || typeof e.destino !== 'number') continue;
      const w = Math.max(0, coerceEdgeWeightToNumeric(e.peso) || 0);
      adj[e.origen].push({ to: e.destino, w });
      if (!directed) adj[e.destino].push({ to: e.origen, w });
    }
    const dmat = Array.from({ length: n }, () => Array.from({ length: n }, () => INF));
    const paths = Array.from({ length: n }, () => Array.from({ length: n }, () => []));
    for (let s = 0; s < n; s++) {
      const dist = Array.from({ length: n }, () => INF);
      const prev = Array.from({ length: n }, () => -1);
      const used = Array.from({ length: n }, () => false);
      dist[s] = 0;
      for (let iter = 0; iter < n; iter++) {
        let u = -1; let best = INF;
        for (let i = 0; i < n; i++) if (!used[i] && dist[i] < best) { best = dist[i]; u = i; }
        if (u === -1) break;
        used[u] = true;
        for (const nb of adj[u]) {
          if (dist[nb.to] > dist[u] + nb.w) { dist[nb.to] = dist[u] + nb.w; prev[nb.to] = u; }
        }
      }
      for (let t = 0; t < n; t++) {
        dmat[s][t] = dist[t];
        if (dist[t] < INF/2) {
          // reconstruct path s->t via prev
          const stack = [];
          let cur = t;
          while (cur !== -1) { stack.push(cur); if (cur === s) break; cur = prev[cur]; }
          if (stack[stack.length-1] !== s) {
            paths[s][t] = []; // unreachable
          } else {
            paths[s][t] = stack.reverse();
          }
        } else {
          paths[s][t] = [];
        }
      }
    }
    return { dmat, paths };
  };

  // Compute all-pairs shortest paths using Floyd-Warshall algorithm
  // Returns { dmat, next } where next[i][j] is the next node after i on a shortest path to j (or null if unreachable)
  const computeFloyd = (vs = [], asList = [], directed = false) => {
    const n = (vs || []).length;
    const INF = 1e12;
    const d = Array.from({ length: n }, () => Array.from({ length: n }, () => INF));
    const next = Array.from({ length: n }, () => Array.from({ length: n }, () => null));
    for (let i = 0; i < n; i++) { d[i][i] = 0; next[i][i] = i; }
    for (const e of (asList || [])) {
      if (typeof e.origen !== 'number' || typeof e.destino !== 'number') continue;
      const u = e.origen; const v = e.destino;
      const w = Math.max(0, coerceEdgeWeightToNumeric(e.peso) || 0);
      if (d[u][v] > w) {
        d[u][v] = w;
        next[u][v] = v;
      }
      if (!directed) {
        if (d[v][u] > w) {
          d[v][u] = w;
          next[v][u] = u;
        }
      }
    }
    // Floyd-Warshall
    for (let k = 0; k < n; k++) {
      for (let i = 0; i < n; i++) {
        if (d[i][k] >= INF/2) continue;
        for (let j = 0; j < n; j++) {
          if (d[k][j] >= INF/2) continue;
          const nd = d[i][k] + d[k][j];
          if (nd < d[i][j]) {
            d[i][j] = nd;
            next[i][j] = next[i][k];
          }
        }
      }
    }
    // Normalize unreachable large values to actual Infinity for clearer UI checks
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (d[i][j] >= INF/2) d[i][j] = Infinity;
    return { dmat: d, next };
  };

  const computeGraphMetrics = (vs = [], asList = [], directed = false) => {
    const n = (vs || []).length;
    if (n === 0) {
      setDistMatrix(null); setEccArray([]); setSumDistances([]); setRadiusVal(null); setDiameterVal(null); setMedianVerts([]); setDiameterPairs([]); return;
    }
    const { dmat, next } = computeFloyd(vs, asList, directed);
    // Reconstruct paths from next matrix
    const paths = Array.from({ length: n }, () => Array.from({ length: n }, () => []));
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (!isFinite(dmat[i][j])) { paths[i][j] = []; continue; }
        // build path i -> j
        const path = [];
        let u = i;
        path.push(u);
        while (u !== j) {
          u = next[u][j];
          if (u === null || u === undefined) { path.length = 0; break; }
          path.push(u);
          if (path.length > n + 5) { path.length = 0; break; }
        }
        paths[i][j] = path;
      }
    }

    const ecc = Array.from({ length: n }, () => 0);
    const sums = Array.from({ length: n }, () => 0);
    for (let i = 0; i < n; i++) {
      let maxd = 0; let s = 0; let unreachable = false;
      for (let j = 0; j < n; j++) {
        const dv = dmat[i][j];
        if (i === j) continue;
        if (!isFinite(dv)) { unreachable = true; s = Infinity; maxd = Infinity; break; }
        if (dv > maxd) maxd = dv;
        s += dv;
      }
      ecc[i] = unreachable ? Infinity : maxd;
      sums[i] = unreachable ? Infinity : s;
    }
    const finiteEcc = ecc.filter(v => isFinite(v));
    const radius = finiteEcc.length === 0 ? null : Math.min(...finiteEcc);
    const diameter = finiteEcc.length === 0 ? null : Math.max(...finiteEcc);
    // Median: consider only finite sums when finding the minimal sum
    const finiteSums = sums.filter(v => isFinite(v));
    const medMin = finiteSums.length === 0 ? Infinity : Math.min(...finiteSums);
    const medVerts = [];
    for (let i = 0; i < n; i++) if (isFinite(sums[i]) && Math.abs(sums[i] - medMin) < 1e-9) medVerts.push(i);
    const diamPairs = [];
    if (diameter !== null) {
      for (let i = 0; i < n; i++) for (let j = i+1; j < n; j++) {
        const dv = dmat[i][j]; if (!isFinite(dv)) continue; if (Math.abs(dv - diameter) < 1e-9) diamPairs.push([i,j]);
      }
    }
    setDistMatrix(dmat);
    setPathMatrix(paths);
    setEccArray(ecc);
    setSumDistances(sums);
    setRadiusVal(radius);
    setDiameterVal(diameter);
    setMedianVerts(medVerts);
    setDiameterPairs(diamPairs);
  };

  // Control visibility of computed views (metrics / trees)
  const [showMetrics, setShowMetrics] = useState(false);
  const [showTrees, setShowTrees] = useState(false);

  // Do not auto-compute metrics on every change; instead clear previous results
  // and wait for explicit user action (button clicks) to show metrics or trees.
  useEffect(() => {
    if (fase !== 'operaciones') return;
    const { vs, es } = getCurrentGraph();
    if (!vs || vs.length === 0) {
      setDistMatrix(null);
      setPathMatrix(null);
      setShowMetrics(false);
      setShowTrees(false);
      return;
    }
    // Reset displayed results when graph content changes
    setDistMatrix(null);
    setPathMatrix(null);
    setShowMetrics(false);
    setShowTrees(false);
    setHighlightMetric('none');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fase, grafo1, grafo2, grafoActual, vertices.length, aristas.length, esDirigido]);

  const [showDebug, setShowDebug] = useState(false);

  // current visible graph vertices helper for rendering labels in the metrics area
  const currentVsGlobal = (grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices)) || [];
  // Compute expansion distance between min and max trees (based on their edge label sets)
  const A_min_labels = minResultado && minResultado.aristas ? (minResultado.aristas.map(a => {
    const verts = minResultado.vertices || [];
    const v1 = verts[a.origen]; const v2 = verts[a.destino];
    const l1 = v1 ? (v1.etiqueta || `V${v1.id}`) : `V${a.origen}`;
    const l2 = v2 ? (v2.etiqueta || `V${v2.id}`) : `V${a.destino}`;
    const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
    return `${l1}${l2}${peso}`;
  })) : [];

  const A_max_labels = maxResultado && maxResultado.aristas ? (maxResultado.aristas.map(a => {
    const verts = maxResultado.vertices || [];
    const v1 = verts[a.origen]; const v2 = verts[a.destino];
    const l1 = v1 ? (v1.etiqueta || `V${v1.id}`) : `V${a.origen}`;
    const l2 = v2 ? (v2.etiqueta || `V${v2.id}`) : `V${a.destino}`;
    const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
    return `${l1}${l2}${peso}`;
  })) : [];

  const setAmin = new Set(A_min_labels || []);
  const setAmax = new Set(A_max_labels || []);
  const unionSet = new Set([...setAmin, ...setAmax]);
  const intersectionSet = new Set([...setAmin].filter(x => setAmax.has(x)));
  const expansionDistance = ((unionSet.size - intersectionSet.size) / 2);

  return (
    <div className="panel operaciones-grafos">
      {fase !== "operaciones" && (
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#d1e8f0", borderRadius: "8px", border: "2px solid #1d6a96", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#1d6a96", fontWeight: "bold" }}>Árboles como grafos</h3>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#283b42" }}>
            {grafo1 && "✓ Grafo 1 guardado"} {grafo1 && grafo2 && "•"} {grafo2 && "✓ Grafo 2 guardado"}
          </p>
        </div>
      )}
      {/* menu removed: operations is the initial view */}
      {fase === "crear" && (
        <div className="crear-card" style={{ maxWidth: 760, margin: '0 auto' }}>
          <div className="crear-header">Crear Grafo</div>
          <div style={{ padding: 8 }}>
            <div className="campo" style={{ width: "100%" }}>
              <label htmlFor="numVertices" style={{ color: "#1d6a96", fontWeight: "bold", textAlign: "left", display: "block" }}>Cantidad de vértices:</label>
              <input id="numVertices" type="number" value={numVertices} onChange={(e) => setNumVertices(Number(e.target.value))} min="1" max="12" placeholder="1-12" className="input-chico" style={{ color: "black", backgroundColor: "white", padding: "6px 8px", border: "1px solid #aaa", borderRadius: "6px" }} />
            </div>
            {/* Removed Centro/Bicentro display from crear view (not applicable while creating) */}
            <div style={{ height: "1px", background: "#c9d6db", margin: "8px 0" }} />

              <div className="campo" style={{ width: "100%" }}>
              <label style={{ fontWeight: "bold", color: "black", marginBottom: "8px", display: "block", textAlign: "center" }}>Tipo de etiqueta del vértice:</label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", cursor: "pointer", color: "black" }}>
                <input type="radio" name="tipoId" value="numerico" checked={tipoIdentificador === "numerico"} onChange={(e) => setTipoIdentificador(e.target.value)} style={{ cursor: "pointer" }} />
                Numérico (0, 1, 2...)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "black" }}>
                <input type="radio" name="tipoId" value="alfabetico" checked={tipoIdentificador === "alfabetico"} onChange={(e) => setTipoIdentificador(e.target.value)} style={{ cursor: "pointer" }} />
                Alfabético (A, B, C...)
              </label>
              {(fase === 'crear' || fase === 'etiquetar') && (
                <div style={{ marginTop: 8, color: '#7a9aa6', fontSize: '0.9rem' }}>
                  Nota: Para árboles ponderados se recomienda usar etiquetas alfabéticas, pero la opción numérica está disponible.
                </div>
              )}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#283b42', cursor: 'pointer' }} title="Alternar grafo dirigido/no dirigido">
                  <input type="checkbox" checked={esDirigido} onChange={() => setEsDirigido(prev=>!prev)} style={{ cursor: 'pointer' }} />
                  <span style={{ fontWeight: '600' }}>Grafo dirigido</span>
                </label>
              </div>
            </div>
            {/* Removed Centro/Bicentro display from crear view (not applicable while creating) */}
            <div style={{ height: "1px", background: "#c9d6db", margin: "8px 0" }} />

            <div className="campo" style={{ width: "100%" }}>
              <label style={{ fontWeight: "bold", color: "black", marginBottom: "8px", display: "block", textAlign: "center" }}>Método de asignación:</label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", cursor: "pointer", color: "black" }}>
                <input type="radio" name="metodo" value="automatico" checked={metodoAsignacion === "automatico"} onChange={(e) => setMetodoAsignacion(e.target.value)} style={{ cursor: "pointer" }} />
                Automático (generado por el sistema)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "black" }}>
                <input type="radio" name="metodo" value="manual" checked={metodoAsignacion === "manual"} onChange={(e) => setMetodoAsignacion(e.target.value)} style={{ cursor: "pointer" }} />
                Manual (ingresar etiquetas personalizadas)
              </label>
            </div>
            <div style={{ height: "1px", background: "#c9d6db", margin: "8px 0" }} />

            <div style={{ marginTop: 8 }}>
              <button onClick={handleCrearVertices} className="full-width-btn">Crear</button>
              <div style={{ height: 8 }} />
              <button onClick={() => { setCrearDesdeOperacion(false); if (crearDesdeOperacion) setFase("operaciones"); else onBack(); }} className="full-width-btn secondary">⬅ Volver</button>
            </div>
          </div>
        </div>
      )}


      {fase === "etiquetar" && (
        <div className="crear-card">
          <div className="crear-header">Asignar Etiquetas a los Vértices</div>
          <div style={{ padding: 12 }}>
            <p style={{ color: "#283b42", textAlign: "center", marginBottom: "10px" }}>Ingrese una etiqueta única para cada vértice:</p>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
              maxHeight: "400px",
              overflowY: "visible",
              padding: "10px"
            }}>
            {vertices.map((v, i) => (
              <div key={v.id} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label style={{ color: "#283b42", fontWeight: "bold", minWidth: "80px" }}>Vértice {i + 1}:</label>
                <input
                  type="text"
                  value={v.etiqueta}
                  onChange={(e) => {
                    const raw = e.target.value;
                    let val = raw;
                    if (tipoIdentificador === "numerico") val = String(raw).replace(/[^0-9]/g, "");
                    else val = String(raw).replace(/[^A-Za-z]/g, "");
                    const newVerts = [...vertices];
                    newVerts[i].etiqueta = val;
                    setVertices(newVerts);
                  }}
                  placeholder={tipoIdentificador === "numerico" ? "1" : "A"}
                  className="input-clave"
                  style={{ flex: 1, backgroundColor: 'white', color: 'black', padding: '6px 8px', border: '1px solid #aaa', borderRadius: '6px' }}
                />
              </div>
            ))}
          </div>
            <button onClick={handleConfirmarEtiquetas} className="full-width-btn" style={{ marginTop: "10px" }}>
              Continuar
            </button>
            <div style={{ height: 8 }} />
            <button onClick={() => { setCrearDesdeOperacion(false); if (crearDesdeOperacion) setFase("operaciones"); else onBack(); }} className="full-width-btn secondary" style={{ marginTop: "5px" }}>
              ⬅ Volver
            </button>
          </div>
        </div>
      )}

      {fase === "grafo" && (
        <div style={{ marginTop: "20px" }}>
          <div className="bloques-container" style={{ display: "flex", gap: "12px" }}>
            <div>
              <p style={{ color: "#1d6a96", fontWeight: "bold", marginBottom: "10px", textAlign: "left" }}>
                {primeraArista === null 
                  ? "Seleccione el par de vértices origen y destino para establecer una arista" 
                  : `Vértice ${vertices[primeraArista]?.etiqueta || `V${primeraArista}`} tendrá adyacencia con: seleccione el destino`}
              </p>
              <div style={{ position: "relative", maxHeight: "440px", overflowY: "visible", overflowX: "visible" }}>
                <svg ref={svgRef} width="520" height="420" style={{ border: "2px solid #1d6a96", borderRadius: "8px", backgroundColor: "#e7f0ee" }} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
                  <defs>
                                  <marker id="arrow-grafo" viewBox="0 0 10 10" refX="12" refY="5" markerWidth="10" markerHeight="10" orient="auto-start-reverse">
                                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#1d6a96" />
                                  </marker>
                                  {/* smaller, more subtle marker for self-loops */}
                                  <marker id="arrow-grafo-loop" viewBox="0 0 10 10" refX="4" refY="5" markerWidth="4" markerHeight="4" markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                                    <path d="M 0 0 L 4 5 L 0 10 z" fill="#1d6a96" />
                                  </marker>
                  </defs>
                  {Array.from(gruposAristas.entries()).map(([key, grupo]) => {
                    const groupSize = grupo.length;
                    const midIndex = (groupSize - 1) / 2;
                    const ordered = grupo.map((a, i) => ({ a, i })).sort((p, q) => Math.abs(q.i - midIndex) - Math.abs(p.i - midIndex));
                    return ordered.map(({ a: arista, i: idx }) => {
                      const v1 = vertices[arista.origen];
                      const v2 = vertices[arista.destino];
                      if (!v1 || !v2) return null;

                      const strokeColor = "#1d6a96";
                      const bgColor = "#e7f0ee";
                      const strokeWidth = 2;

                      if (v1.id === v2.id) {
                        const x = v1.x;
                        const y = v1.y;
                        // make the self-loop noticeably larger so it's visible
                        const rx = 52 + idx * 10;
                        const ry = 46 + idx * 10;
                        const offsetX = 56 + idx * 18;
                        const offsetY = 52 + idx * 18;
                        // start the loop a bit further from the node center
                        const path = `M ${x + 20} ${y} C ${x + offsetX} ${y - offsetY}, ${x + offsetX + rx} ${y + offsetY}, ${x + 20} ${y}`;
                        const pesoX = x + offsetX + rx * 0.3;
                        const pesoY = y - ry * 0.2;
                        const edgeStrokeColor = strokeColor;
                        // use same stroke width as other edges (no extra thick loop)
                        const edgeStrokeW = strokeWidth;
                        return (
                          <g key={arista.id} onClick={(e) => { if (deletingEdgeMode) { handleEdgeDeleteClick(arista); e.stopPropagation(); } }} style={{ cursor: deletingEdgeMode ? 'pointer' : 'default' }}>
                            <path d={path} stroke={bgColor} strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                            <path d={path} stroke={strokeColor} strokeWidth={edgeStrokeW} strokeLinecap="round" strokeLinejoin="round" fill="none" markerEnd={(esDirigido || arista.dirigida) ? `url(#arrow-grafo-loop)` : undefined} />
                            <text x={pesoX} y={pesoY} fill="#283b42" fontSize="12" fontWeight="bold" textAnchor="middle" dy="0.3em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
                          </g>
                        );
                      }

                      // compute endpoints on vertex circle borders so arrows touch node edges
                      const R = 22;
                      const p1 = pointOnCircle(v1.x, v1.y, R, v2.x, v2.y);
                      const p2 = pointOnCircle(v2.x, v2.y, R, v1.x, v1.y);
                      const x1 = p1.x;
                      const y1 = p1.y;
                      const x2 = p2.x;
                      const y2 = p2.y;
                      const mx = (x1 + x2) / 2;
                      const my = (y1 + y2) / 2;
                      const dx = x2 - x1;
                      const dy = y2 - y1;
                      const len = Math.hypot(dx, dy) || 1;
                      const ux = -dy / len;
                      const uy = dx / len;
                      const baseSpacing = 20;
                      let offset = (idx - midIndex) * baseSpacing;

                      const collisionRadius = 28;
                      let collision = false;
                      for (const other of vertices) {
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
                      // Si la arista está casi recta, movemos el texto hacia un tercio
                      const t = Math.abs(offset) <= 6 ? 0.33 : 0.5;
                      const pesoX = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
                      const pesoY = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;
                      const edgeStrokeColor = strokeColor;
                      const edgeStrokeW = strokeWidth;
                      return (
                        <g key={arista.id} onClick={(e) => { if (deletingEdgeMode) { handleEdgeDeleteClick(arista); e.stopPropagation(); } }} style={{ cursor: deletingEdgeMode ? 'pointer' : 'default' }}>
                          <path d={path} stroke={bgColor} strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          <path d={path} stroke={edgeStrokeColor} strokeWidth={edgeStrokeW} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                          <text x={pesoX} y={pesoY} fill="#283b42" fontSize="12" fontWeight="bold" textAnchor="middle" dy="0.35em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
                        </g>
                      );
                    });
                  })}

                  {vertices.map((v, idx) => (
                    <g key={`v-${v.id}`}>
                      {
                                  (() => {
                                    let fillColor = "#1d6a96";
                                    if (primeraArista === idx) fillColor = "#85b8cb";
                                      return (
                                      <circle cx={v.x} cy={v.y} r="22" fill={fillColor} stroke="#283b42" strokeWidth="2" style={{ cursor: "pointer", transition: "all 0.2s" }} onMouseDown={(e)=>handleMouseDownVertex(e, idx)} onClick={() => {
                                                  if (deletingVertexMode) { handleVertexDeleteClick(idx); }
                                                  else handleClickVertice(idx);
                                                }} onDoubleClick={() => handleEditarEtiquetaPrompt(v.id)} />
                                    );
                                  })()
                                }
                      <text x={v.x} y={v.y} textAnchor="middle" dy="0.3em" fill="white" fontSize="13" fontWeight="bold" pointerEvents="none">{v.etiqueta || `V${v.id}`}</text>
                    </g>
                  ))}
                  {/* overlay markers so arrowheads appear above the node circles (include self-loops) */}
                  {aristas && aristas.length > 0 && aristas.map((a) => {
                    const directedEdge = esDirigido || a.dirigida;
                    if (!directedEdge) return null;
                    const sv = vertices[a.origen];
                    const tv = vertices[a.destino];
                    if (!sv || !tv) return null;
                    if (a.origen === a.destino) {
                      // self-loop: place arrow near right side of the node, offset so it's visible
                      const p2 = pointOnCircle(tv.x, tv.y, 22, tv.x + 1, tv.y);
                      const sx = p2.x - 14;
                      const sy = p2.y - 6;
                      return (<path key={`mk-g-${a.id}`} d={`M ${sx} ${sy} L ${p2.x} ${p2.y}`} stroke="transparent" fill="none" markerEnd={`url(#arrow-grafo-loop)`}/>);
                    }
                    const p2 = pointOnCircle(tv.x, tv.y, 22, sv.x, sv.y);
                    const dx = tv.x - sv.x; const dy = tv.y - sv.y;
                    const len = Math.hypot(dx, dy) || 1;
                    const sx = p2.x - (dx / len) * 8;
                    const sy = p2.y - (dy / len) * 8;
                    return (<path key={`mk-g-${a.id}`} d={`M ${sx} ${sy} L ${p2.x} ${p2.y}`} stroke="transparent" fill="none" markerEnd={`url(#arrow-grafo)`}/>);
                  })}
                </svg>
              </div>
            </div>

            <div style={{ width: "260px" }}>
              
              <p style={{ color: "#283b42", fontWeight: "bold", marginBottom: "10px" }}>Aristas ({aristas.length}):</p>
              <div className="bloque" style={{ maxHeight: "320px", overflowY: "visible", backgroundColor: "#e7f0ee" }}>
                {aristas.length === 0 ? (
                  <p style={{ color: "#666", fontSize: "0.9rem" }}>Ninguna aún</p>
                ) : (
                  aristas.map((a) => {
                    const isLoop = a.origen === a.destino;
                    let label;
                    if (isLoop) {
                      label = `${vertices[a.origen]?.etiqueta || `V${a.origen}`} (bucle)`;
                    } else {
                      const from = vertices[a.origen]?.etiqueta || `V${a.origen}`;
                      const to = vertices[a.destino]?.etiqueta || `V${a.destino}`;
                      if (esDirigido || a.dirigida) label = `${from} → ${to}`;
                      else label = `${from} ↔ ${to}`;
                    }
                    const arrowIcon = isLoop ? '⟲' : ((esDirigido || a.dirigida) ? '→' : '↔');
                    return (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", marginBottom: "6px", backgroundColor: "#d1dddb", borderRadius: "6px", gap: "8px" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                          <span style={{ color: "#283b42", fontWeight: "bold" }}>{label}</span>
                        </div>
                        <input type="text" value={a.peso} onChange={(e) => {
                            const newPesoRaw = e.target.value;
                            setAristas((prev) => prev.map((ar) => (ar.id === a.id ? { ...ar, peso: newPesoRaw } : ar)));
                          }} style={{ width: "60px", padding: "2px 6px", textAlign: "center", fontSize: "0.85rem" }} />
                        <button onClick={() => handleEliminarArista(a.id)} className="boton">✕</button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '10px 0 12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'nowrap' }}>
              {/* Operaciones: Insertar vértice, Eliminar vértice, Eliminar arista (misma línea) */}
              <button className="boton" onClick={handleInsertVertice} style={{ padding: '6px 10px' }}>➕ Insertar vértice</button>
              <button className="boton" onClick={() => { setDeletingVertexMode(true); alert('Seleccione el vértice que desea eliminar y confirme.'); }} style={{ padding: '6px 10px' }} disabled={vertices.length===0}>🗑 Eliminar vértice</button>
              <button className="boton" onClick={() => { setDeletingEdgeMode(true); alert('Seleccione la arista que desea eliminar y confirme.'); }} style={{ padding: '6px 10px' }} disabled={aristas.length===0}>🗑 Eliminar arista</button>
            </div>
          </div>

          {/* línea separadora después de las operaciones clasificadas */}
          <div style={{ height: '1px', background: '#c9d6db', margin: '12px 0' }} />

          <div style={{ marginTop: "12px", maxWidth: "700px", margin: "12px auto 0" }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'stretch' }}>
              {/* Fila 1: label + input + botón Guardar */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <label style={{ fontWeight: 'bold', color: '#283b42', marginRight: '8px', flex: '0 0 auto' }}>Nombre grafo</label>
                <input
                  type="text"
                  placeholder={`Nombre del grafo ${grafoActual}`}
                  value={grafoNombre}
                  onChange={(e) => setGrafoNombre(e.target.value)}
                  style={{ padding: "8px", border: "2px solid #1d6a96", borderRadius: "6px", width: "160px", backgroundColor: 'white', flex: '0 0 160px' }}
                />
                <button onClick={handleGuardarGrafo} className="boton" style={{ padding: '8px 10px', minWidth: '90px' }}>
                  💾 Guardar
                </button>
              </div>

              {/* Fila 2: los otros tres botones centrados debajo */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                {((grafoActual === 1 && (grafo1 || vertices.length > 0)) || (grafoActual === 2 && (grafo2 || vertices.length > 0))) && (
                  <button onClick={() => { persistCurrentToMemory(); setFase("operaciones"); }} className="boton boton_agregar" style={{ padding: '8px 10px', minWidth: '170px' }}>
                    Ir a la construcción de árboles
                  </button>
                )}
                {((grafoActual === 1 && grafo1) || (grafoActual === 2 && grafo2)) && (
                  <button onClick={() => handleVaciarGrafoGuardado(grafoActual)} className="boton" style={{ padding: '8px 10px', minWidth: '140px' }}>
                  ✖️ Eliminar grafo guardado
                  </button>
                )}
                <button onClick={handleVaciarGrafoActual} className="boton" style={{ padding: '8px 10px', minWidth: '140px' }}>
                  ✖️ Eliminar grafo
                </button>
                <button onClick={() => { setFase("operaciones"); }} className="boton" style={{ padding: '8px 10px', minWidth: '90px' }}>
                  ⬅ Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {fase === "operaciones" && mode !== 'tree' && (
        <div style={{ marginTop: "10px" }}>
          <h3 style={{ color: "#1d6a96", textAlign: "center", marginBottom: "10px" }}>Árboles como Grafos</h3>
          {/* Hidden file input so Upload buttons in operations can trigger file selection */}
          <input ref={inputGrafoRef} type="file" accept=".json" onChange={handleCargarJSON} style={{ display: "none" }} />
          {/* top controls removed here; editing buttons will be placed directly under the graph title */}
          {/* Metrics table is rendered below the main graph now. */}
          <div style={{ display: "flex", flexDirection: "column", gap: "18px", alignItems: 'center' }}>
            {/* Main graph (full-width centered) */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", marginBottom: "6px", maxWidth: 1040 }}>
                  <p style={{ color: "#283b42", fontWeight: "bold", textAlign: "center", margin: 0 }}>Grafo (G)</p>
                </div>
                {/* Editing buttons directly under the title */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <button className="boton boton_agregar" style={{ padding: "6px 8px", fontSize: "0.95rem" }} onClick={() => handleStartCreateGraph(2)}>➕ Crear Grafo</button>
                    <button className="boton" style={{ padding: "6px 8px", fontSize: "0.95rem" }} onClick={() => handleUploadTo(2)}>📤 Subir</button>
                    <button className="boton boton_agregar" onClick={() => {
                      const source = (grafo2 ? grafo2 : (grafo1 ? grafo1 : { nombre: grafoNombre || 'Grafo-G', vertices, aristas }));
                      exportGrafoObject({ nombre: source.nombre || 'Grafo-G', numVertices: (source.vertices||[]).length, tipoIdentificador, metodoAsignacion, vertices: source.vertices, aristas: source.aristas });
                    }}>💾 Guardar Grafo</button>
                    {(grafo2 || grafo1 || vertices.length > 0) && (
                      <button className="boton" style={{ padding: '6px 8px', fontSize: '0.95rem' }} onClick={() => handleEditarGrafo(grafo2 ? 2 : (grafo1 ? 1 : grafoActual))}>✏️ Editar Grafo</button>
                    )}
                  </div>
                </div>
                <div style={{ maxWidth: 760, maxHeight: 520, overflow: 'visible', padding: 6 }}>
                  {renderGraph((grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices)), (grafo2 ? grafo2.aristas : (grafo1 ? grafo1.aristas : aristas)), false, esDirigido)}
                </div>
                <p style={{ color: "#283b42", marginTop: "6px", fontSize: "0.9rem", textAlign: 'center' }}>
                  <strong>G (vértices):</strong> {((grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices))||[]).map(v=>v.etiqueta||`V${v.id}`).join(", ")}<br/>
                  <strong>G (aristas):</strong> {(((grafo2 ? grafo2.aristas : (grafo1 ? grafo1.aristas : aristas))||[]).map(a=>{
                    const verts = (grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices)) || [];
                    const v1 = verts[a.origen];
                    const v2 = verts[a.destino];
                    const l1 = v1 ? (v1.etiqueta||`V${v1.id}`) : `V${a.origen}`;
                    const l2 = v2 ? (v2.etiqueta||`V${v2.id}`) : `V${a.destino}`;
                    const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
                    return `${pairLabel(l1,l2)}${peso}`;
                  })).join(", ") || "∅"}
                </p>
                {/* Generate trees and metrics buttons under the graph area */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 8 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <button className="boton boton_agregar" onClick={() => { handleGenerarArboles(); setShowTrees(true); setShowMetrics(false); }} title={"Generar árboles de expansión"}>Generar árboles de expansión</button>

                    <button className="boton" onClick={() => {
                      const { vs, es } = getCurrentGraph();
                      if (!vs || vs.length === 0) { alert('No hay vértices para calcular métricas'); return; }
                      computeGraphMetrics(vs, es, esDirigido);
                      setShowMetrics(true);
                      setShowTrees(false);
                      setHighlightMetric('none');
                    }}>Calcular métricas</button>
                  </div>
                </div>
                {showMetrics && distMatrix && pathMatrix && (
                  <div style={{ width: '100%', maxWidth: 1080, margin: '12px auto', overflowX: 'auto', background: '#fcfffe', padding: 8, borderRadius: 6, border: '1px solid #dfecec' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div style={{ textAlign: 'center' }}>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0b6a86' }}>Matriz de Floyd</div>
                                  <div style={{ fontSize: 12, color: '#4b6b70' }}>Matriz de Floyd</div>
                                </div>
                                <div style={{ marginLeft: 12, fontSize: 13, color: '#283b42' }}>
                                  <span style={{ fontWeight: 700 }}>Radio:</span> {radiusVal === null ? '∅' : (isFinite(radiusVal) ? radiusVal : '∞')} &nbsp; <span style={{ fontWeight: 700 }}>Centros:</span> {eccArray && radiusVal !== null ? eccArray.map((e, idx) => (isFinite(e) && Math.abs(e - radiusVal) < 1e-9 ? ((grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices))[idx]?.etiqueta || `V${idx}`) : null)).filter(x => x).join(', ') : '∅'}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                  <button className={`boton ${highlightMetric==='radius'?'boton_agregar':''}`} onClick={() => setHighlightMetric('radius')}>Radio</button>
                                  <button className={`boton ${highlightMetric==='diameter'?'boton_agregar':''}`} onClick={() => setHighlightMetric('diameter')}>Diámetro</button>
                                  <button className={`boton ${highlightMetric==='median'?'boton_agregar':''}`} onClick={() => setHighlightMetric('median')}>Mediana</button>
                      
                                </div>
                      </div>
                      <div style={{ width: 1 }} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                      {/* Explicit Floyd matrix view: rows and columns labeled with vertex etiquetas */}
                      {(() => {
                        const currentVs = (grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices)) || [];
                        if (!currentVs || currentVs.length === 0) return null;
                        return (
                          <div style={{ marginBottom: 12, overflowX: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ fontWeight: 700, color: '#0b6a86', marginBottom: 6 }}>Matriz de Floyd</div>
                            <div style={{ overflowX: 'auto', width: '100%', display: 'flex', justifyContent: 'center' }}>
                              <table style={{ borderCollapse: 'collapse', color: '#000', minWidth: 360, margin: '0 auto', display: 'inline-table' }}>
                                <thead>
                                  <tr>
                                    <th style={{ border: '1px solid #d6eaea', padding: '6px', background: '#eefaf9' }}></th>
                                    {currentVs.map((v, ci) => (
                                      <th key={`h-${ci}`} style={{ border: '1px solid #d6eaea', padding: '6px', background: '#eefaf9', textAlign: 'center' }}>{v?.etiqueta || `V${v?.id}`}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {distMatrix.map((row, i) => {
                                    const labelI = (currentVs[i] && (currentVs[i].etiqueta || `V${currentVs[i].id}`)) || `V${i}`;
                                      const rowIsRadius = (highlightMetric === 'radius' && radiusVal !== null && isFinite(eccArray[i]) && Math.abs(eccArray[i] - radiusVal) < 1e-9);
                                    const rowIsMedian = (highlightMetric === 'median' && medianVerts && medianVerts.length > 0 && medianVerts.includes(i));
                                    return (
                                      <tr key={`mrow-${i}`} style={{ textDecoration: rowIsRadius || rowIsMedian ? 'underline' : 'none', background: rowIsRadius || rowIsMedian ? '#f0fbfa' : 'transparent' }}>
                                        <th style={{ border: '1px solid #d6eaea', padding: '6px', background: '#eefaf9', textAlign: 'center' }}>{labelI}</th>
                                        {row.map((d, j) => {
                                          const cellIsDiameter = (diameterPairs && diameterPairs.some(p => (p[0] === i && p[1] === j) || (p[0] === j && p[1] === i)));
                                          const isEccCell = (isFinite(d) && isFinite(eccArray[i]) && Math.abs(d - eccArray[i]) < 1e-9);
                                          let cellBg = '#fff';
                                          if (!isFinite(d)) {
                                            cellBg = '#fff6f6';
                                          } else if (highlightMetric === 'diameter' && cellIsDiameter) {
                                            cellBg = '#ffd89f'; // vivid orange for diameter when selected
                                          } else if (highlightMetric === 'radius' && isEccCell && radiusVal !== null && isFinite(radiusVal) && Math.abs(eccArray[i] - radiusVal) < 1e-9) {
                                            cellBg = '#7ee4b8'; // vivid green only when radius selected and this row is a center
                                          }
                                          return (<td key={`m-${i}-${j}`} style={{ border: '1px solid #d6eaea', padding: '6px', textAlign: 'center', background: cellBg }}>{!isFinite(d) ? '∞' : d}</td>);
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })()}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                        {distMatrix.map((row, i) => {
                            const currentVs = (grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices)) || [];
                            const labelI = (currentVs[i] && (currentVs[i].etiqueta || `V${currentVs[i].id}`)) || `V${i}`;
                            const blockIsRadius = (highlightMetric === 'radius' && radiusVal !== null && isFinite(eccArray[i]) && Math.abs(eccArray[i] - radiusVal) < 1e-9);
                            const blockIsMedian = (highlightMetric === 'median' && medianVerts && medianVerts.includes(i));
                            return (
                            <div key={`block-${i}`} style={{ background: blockIsRadius || blockIsMedian ? '#f0fbfa' : '#fcfffe', padding: 8, borderRadius: 6, border: '1px solid #dfecec' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <div style={{ fontWeight: 700, color: '#0b6a86' }}>{labelI}</div>
                              </div>
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
                                  <thead>
                                    <tr>
                                      <th style={{ border: '1px solid #d6eaea', padding: '6px', background: '#eefaf9' }}>Distancia</th>
                                      <th style={{ border: '1px solid #d6eaea', padding: '6px', background: '#eefaf9' }}>Camino mínimo</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {row.map((d, j) => {
                                      if (i === j) return null;
                                      const labelJ = (currentVs[j] && (currentVs[j].etiqueta || `V${currentVs[j].id}`)) || `V${j}`;
                                      // For diameter highlighting in per-source tables: highlight the cell
                                      // that realizes the eccentricity of row i, but only when that
                                      // eccentricity equals the global diameter.
                                        const isEccCell = (isFinite(d) && isFinite(eccArray[i]) && Math.abs(d - eccArray[i]) < 1e-9);
                                        const cellIsDiameter = (highlightMetric === 'diameter' && isEccCell && diameterVal !== null && isFinite(diameterVal) && Math.abs(eccArray[i] - diameterVal) < 1e-9);
                                        let cellBg = '#fff';
                                        if (!isFinite(d)) {
                                          cellBg = '#fff6f6';
                                        } else if (highlightMetric === 'diameter' && cellIsDiameter) {
                                          // diameter selection has highest precedence for these highlighted cells
                                          cellBg = '#ffd89f';
                                        } else if (highlightMetric === 'radius' && isEccCell && radiusVal !== null && isFinite(radiusVal) && Math.abs(eccArray[i] - radiusVal) < 1e-9) {
                                          // when radius is selected, highlight rows/ells that match center
                                          cellBg = '#7ee4b8';
                                        } else if (highlightMetric === 'none' && isEccCell) {
                                          // default: always mark the eccentricity cell in each per-source table
                                          cellBg = '#e6f4ff';
                                        }
                                      return (
                                        <tr key={`r-${i}-${j}`}>
                                          <td style={{ border: '1px solid #d6eaea', padding: '6px', background: '#f7fffd' }}>{pairLabel(labelI, labelJ)}</td>
                                          <td style={{ border: '1px solid #d6eaea', padding: '6px', background: cellBg, textAlign: 'center' }}>{!isFinite(d) ? '∞' : d}</td>
                                        </tr>
                                      );
                                    })}
                                    {/* Suma row */}
                                    <tr key={`sum-${i}`}>
                                      <td style={{ border: '1px solid #d6eaea', padding: '6px', background: '#eefaf9', fontWeight: '700' }}>Suma</td>
                                      <td style={{ border: '1px solid #d6eaea', padding: '6px', background: (highlightMetric === 'median' && medianVerts && medianVerts.includes(i)) ? '#7ee4b8' : '#fff', textAlign: 'center', fontWeight: '700' }}>{fmtValue((sumDistances && sumDistances[i] !== undefined) ? sumDistances[i] : Infinity)}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                    {showDebug && (
                      <div style={{ marginTop: 8, background: '#fff7f0', padding: 8, borderRadius: 6, border: '1px solid #ffdca8', fontSize: '0.85rem', color: '#283b42' }}>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>Diagnóstico de métricas</div>
                        <div><strong>Vértices (etiquetas):</strong> {JSON.stringify(((grafo2 ? grafo2.vertices : (grafo1 ? grafo1.vertices : vertices))||[]).map(v => v?.etiqueta || `V${v?.id}`))}</div>
                        <div><strong>DistMatrix dims:</strong> {distMatrix ? `${distMatrix.length}×${(distMatrix[0]||[]).length}` : '∅'}</div>
                        <div><strong>eccArray:</strong> {JSON.stringify(eccArray)}</div>
                        <div><strong>sumDistances:</strong> {JSON.stringify(sumDistances)}</div>
                        <div><strong>radiusVal:</strong> {radiusVal === null ? '∅' : (isFinite(radiusVal) ? radiusVal : '∞')}</div>
                        <div><strong>diameterVal:</strong> {diameterVal === null ? '∅' : (isFinite(diameterVal) ? diameterVal : '∞')}</div>
                        <div><strong>medianVerts:</strong> {JSON.stringify(medianVerts)}</div>
                        <div><strong>diameterPairs:</strong> {JSON.stringify(diameterPairs)}</div>
                      </div>
                    )}
                    <div style={{ marginTop: 8, fontSize: '0.9rem', color: '#283b42' }}>
                      <strong>Nota:</strong> haga clic en los botones para resaltar la fila (Radio/Mediana) o las celdas (Diámetro).
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            {showTrees && (
              <>
                <div style={{ width: '100%', borderTop: '2px solid #c9d6db', marginTop: 6 }} />

                {/* Row for Tmin: tree, complement, metadata (branches/cords in brackets) */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 1080, width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: '0 0 520', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#1d6a96' }}>Tmin (Árbol de expansión mínima)</h4>
                  <div style={{ padding: 6 }}>
                    {minResultado ? renderGraph(minResultado.vertices, minResultado.aristas, false, esDirigido, { highlightNodes: new Set((minCenter||[]).map(i => (minResultado.vertices[i] && (minResultado.vertices[i].id || minResultado.vertices[i].etiqueta)) )), highlightEdges: new Set(minBicenterEdgeId ? [minBicenterEdgeId] : []) }) : <div style={{ width: 520, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #c9d6db', borderRadius: 8 }}>Presione «Generar árboles de expansión»</div>}
                  </div>
                </div>
                <div style={{ flex: '0 0 520', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 520', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#1d6a96' }}>Complemento de Tmin</div>
                    <div style={{ marginTop: 6 }}>{minComplement ? renderGraph(minComplement.vertices, minComplement.aristas, false, esDirigido) : <div style={{ width: 520, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>∅</div>}</div>
                  </div>
                  
                </div>
              </div>
            </div>

              {/* Lists for Tmin placed below the Tmin row to avoid overlapping the complement visualization */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <div style={{ maxWidth: 1080, width: '100%', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 60%', color: '#000', wordBreak: 'break-word' }}>
                  <strong>Ramas (Tmin):</strong>
                  <div style={{ marginTop: 6 }}>{minResultado && minResultado.aristas && minResultado.aristas.length ? formatEdgeList(minResultado.vertices, minResultado.aristas) : "{}"}</div>
                </div>
                <div style={{ flex: '1 1 35%', color: '#000', wordBreak: 'break-word' }}>
                  <strong>Cuerdas (complemento):</strong>
                  <div style={{ marginTop: 6 }}>{minComplement && minComplement.aristas && minComplement.aristas.length ? formatEdgeList(minComplement.vertices, minComplement.aristas) : "{}"}</div>
                </div>
              </div>
            </div>
              {/* Row for Tmax */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <div style={{ maxWidth: 1080, width: '100%', display: 'flex', gap: 12, alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div style={{ flex: '0 0 520', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, color: '#1d6a96' }}>Tmax (Árbol de expansión máxima)</h4>
                  <div style={{ padding: 6 }}>
                    {maxResultado ? renderGraph(maxResultado.vertices, maxResultado.aristas, false, esDirigido, { highlightNodes: new Set((maxCenter||[]).map(i => (maxResultado.vertices[i] && (maxResultado.vertices[i].id || maxResultado.vertices[i].etiqueta)) )), highlightEdges: new Set(maxBicenterEdgeId ? [maxBicenterEdgeId] : []) }) : <div style={{ width: 520, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #c9d6db', borderRadius: 8 }}>Presione «Generar árboles de expansión»</div>}
                  </div>
                </div>
                <div style={{ flex: '0 0 520', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ flex: '0 0 520', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ fontWeight: 'bold', color: '#1d6a96' }}>Complemento de Tmax</div>
                    <div style={{ marginTop: 6 }}>{maxComplement ? renderGraph(maxComplement.vertices, maxComplement.aristas, false, esDirigido) : <div style={{ width: 520, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8 }}>∅</div>}</div>
                  </div>
                  
                </div>
              </div>
            </div>
              {/* Lists for Tmax placed below the Tmax row to avoid overlapping the complement visualization */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 12 }}>
              <div style={{ maxWidth: 1040, width: '100%', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: '1 1 60%', color: '#000', wordBreak: 'break-word' }}>
                  <strong>Ramas (Tmax):</strong>
                  <div style={{ marginTop: 6 }}>{maxResultado && maxResultado.aristas && maxResultado.aristas.length ? formatEdgeList(maxResultado.vertices, maxResultado.aristas) : "{}"}</div>
                </div>
                <div style={{ flex: '1 1 35%', color: '#000', wordBreak: 'break-word' }}>
                  <strong>Cuerdas (complemento):</strong>
                  <div style={{ marginTop: 6 }}>{maxComplement && maxComplement.aristas && maxComplement.aristas.length ? formatEdgeList(maxComplement.vertices, maxComplement.aristas) : "{}"}</div>
                </div>
              </div>
            </div>

              {/* Árbol de expansión centrado (comparación entre Tmin y Tmax) */}
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: 14 }}>
              <div style={{ maxWidth: 1080, width: '100%', background: '#f1fbfb', padding: 12, borderRadius: 8, border: '1px solid #d6eaea' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0b6a86' }}>Árbol de expansión centrado</h4>
                <p style={{ margin: 0, color: '#283b42' }}><strong>Fórmula:</strong> distancia árbol expansión = (|A1 ∪ A2| - |A1 ∩ A2|) / 2</p>
                <div style={{ marginTop: 8, color: '#000' }}>
                  {/* Small visualizations for each center */}
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontWeight: '700', color: '#0b6a86' }}>Grafo Centro (Tmin)</div>
                      <div style={{ marginTop: 6, width: 520, height: 420 }}>{(() => {
                        if (!minResultado || !minResultado.vertices) return <div style={{ width: 520, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>∅</div>;
                        const sub = extractCenterSubgraph(minResultado.vertices, minResultado.aristas, minCenter || [], 0);
                        return (<div style={{ width: 520, height: 420 }}>{renderGraph(sub.vertices, sub.aristas, false, esDirigido, { highlightNodes: new Set(sub.centersMapped || []) })}</div>);
                      })()}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{ fontWeight: '700', color: '#0b6a86' }}>Grafo Centro (Tmax)</div>
                      <div style={{ marginTop: 6, width: 520, height: 420 }}>{(() => {
                        if (!maxResultado || !maxResultado.vertices) return <div style={{ width: 520, height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>∅</div>;
                        const sub = extractCenterSubgraph(maxResultado.vertices, maxResultado.aristas, maxCenter || [], 0);
                        return (<div style={{ width: 520, height: 420 }}>{renderGraph(sub.vertices, sub.aristas, false, esDirigido, { highlightNodes: new Set(sub.centersMapped || []) })}</div>);
                      })()}</div>
                    </div>
                  </div>
                  <div><strong>A_min:</strong> {formatEdgeList(minResultado ? minResultado.vertices : [], minResultado ? minResultado.aristas : [])}</div>
                  <div><strong>A_max:</strong> {formatEdgeList(maxResultado ? maxResultado.vertices : [], maxResultado ? maxResultado.aristas : [])}</div>
                  <div style={{ marginTop: 6 }}><strong>Centro/Bicentro (Tmin):</strong> {minResultado ? ((minCenter || []).length === 1 ? (minResultado.vertices[minCenter[0]]?.etiqueta || `V${minResultado.vertices[minCenter[0]]?.id}`) : (minCenter || []).length === 2 ? ((minResultado.vertices[minCenter[0]]?.etiqueta || `V${minResultado.vertices[minCenter[0]]?.id}`) + ' — ' + (minResultado.vertices[minCenter[1]]?.etiqueta || `V${minResultado.vertices[minCenter[1]]?.id}`)) : '∅') : '∅'}</div>
                  <div style={{ marginTop: 6 }}><strong>Centro/Bicentro (Tmax):</strong> {maxResultado ? ((maxCenter || []).length === 1 ? (maxResultado.vertices[maxCenter[0]]?.etiqueta || `V${maxResultado.vertices[maxCenter[0]]?.id}`) : (maxCenter || []).length === 2 ? ((maxResultado.vertices[maxCenter[0]]?.etiqueta || `V${maxResultado.vertices[maxCenter[0]]?.id}`) + ' — ' + (maxResultado.vertices[maxCenter[1]]?.etiqueta || `V${maxResultado.vertices[maxCenter[1]]?.id}`)) : '∅') : '∅'}</div>
                  <div style={{ marginTop: 6 }}><strong>|A1 ∪ A2|:</strong> {unionSet.size} &nbsp; <strong>|A1 ∩ A2|:</strong> {intersectionSet.size}</div>
                  <div style={{ marginTop: 6, fontWeight: '700' }}><strong>Distancia árbol expansión:</strong> {isNaN(expansionDistance) ? '∅' : expansionDistance}</div>
                </div>
              </div>
                </div>
              </>
            )}
          </div>
          <div style={{ marginTop: "12px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button className="boton volver" onClick={onBack}>⬅ Volver</button>
          </div>
        </div>
      )}

      {modalArista && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ backgroundColor: "#e7f0ee", padding: "25px", borderRadius: "12px", border: "3px solid #1d6a96", minWidth: "320px", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
            <h3 style={{ color: "#283b42", marginBottom: "15px", textAlign: "center" }}>Configurar Arista</h3>
            <p style={{ color: "#283b42", marginBottom: "10px", fontSize: "0.95rem" }}>
              <strong>Origen:</strong> {vertices[modalArista.origen]?.etiqueta || `V${modalArista.origen}`} → <strong>Destino:</strong> {vertices[modalArista.destino]?.etiqueta || `V${modalArista.destino}`}
            </p>
            <div style={{ marginTop: "15px" }}>
              <label htmlFor="pesoArista" style={{ color: "#283b42", fontWeight: "bold", display: "block", marginBottom: "8px" }}>Ponderación/Costo:</label>
              <input id="pesoArista" type="text" value={pesoTemporal} onChange={(e) => setPesoTemporal(e.target.value)} placeholder="Ej: 1, 5, A, B..." style={{ width: "100%", padding: "8px", fontSize: "1rem", borderRadius: "6px", border: "2px solid #1d6a96" }} onKeyPress={(e) => e.key === "Enter" && handleConfirmarArista()} autoFocus />
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", justifyContent: "center" }}>
              <button onClick={handleConfirmarArista} className="boton boton_agregar">Confirmar</button>
              <button onClick={() => setModalArista(null)} className="boton">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Removed generic fallback Volver button to avoid duplicates. Use view-specific back buttons instead. */}
    </div>
  );
}

export default ArbolesGrafos;
