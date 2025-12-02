import { useState, useMemo, useRef, useEffect } from "react";
import "./OperacionesGrafos.css";

function OperacionesGrafos({ onBack, mode = 'graph', initialDirected = false, initialGraph = null, backLabel = null }) {
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
  const [mergingMode, setMergingMode] = useState(false);
  const [mergeSelection, setMergeSelection] = useState([]); // array of indices
  const [contractingMode, setContractingMode] = useState(false);
  const [deletingVertexMode, setDeletingVertexMode] = useState(false);
  const [deletingEdgeMode, setDeletingEdgeMode] = useState(false);
  const [esDirigido, setEsDirigido] = useState(!!initialDirected);
  const [grafoActual, setGrafoActual] = useState(1); // 1 o 2
  const [grafo1, setGrafo1] = useState(null); // {vertices, aristas}
  const [grafo2, setGrafo2] = useState(null);
  const [grafoNombre, setGrafoNombre] = useState("");
  const [crearDesdeOperacion, setCrearDesdeOperacion] = useState(false);
  const inputGrafoRef = useRef(null);
  const [operacion, setOperacion] = useState("");
  const [resultado, setResultado] = useState(null); // {vertices, aristas}

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

  const handleCrearVertices = () => {
    const n = Math.max(1, Math.min(12, parseInt(numVertices) || 1));
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
        etiqueta:
          tipoIdentificador === "numerico"
            ? String(i + 1)
            : String.fromCharCode(65 + (i % 26)),
      }));
      setVertices(etiquetados);
      setFase("grafo");
    } else {
      setVertices(nuevos);
      setFase("etiquetar");
    }
  };

  const handleConfirmarEtiquetas = () => {
    const etiquetas = vertices.map(v => v.etiqueta.trim());
    if (etiquetas.some(e => e === "")) {
      alert("Todas las etiquetas deben estar completas");
      return;
    }
    const uniqueLabels = new Set(etiquetas);
    if (uniqueLabels.size !== etiquetas.length) {
      alert("Las etiquetas deben ser \u00fanicas");
      return;
    }
    if (tipoIdentificador === "numerico") {
      if (etiquetas.some(e => !/^[0-9]+$/.test(e))) {
        alert("Todas las etiquetas deben ser n\u00fameros");
        return;
      }
    } else {
      if (etiquetas.some(e => !/^[A-Za-z]+$/.test(e))) {
        alert("Todas las etiquetas deben ser letras");
        return;
      }
    }
    setFase("grafo");
  };

  // handle click by vertex index (not by internal id) so edges reference array indices
  const handleClickVertice = (index) => {
    if (primeraArista === null) {
      setPrimeraArista(index);
    } else {
      setModalArista({ origen: primeraArista, destino: index });
      setPesoTemporal(getDefaultEdgeWeight());
      setPrimeraArista(null);
    }
  };

  // Editar etiqueta de un vértice (prompt simple). Valida unicidad y tipo según `tipoIdentificador`.
  const handleEditarEtiquetaPrompt = (vertexId) => {
    const idx = vertices.findIndex(v => v.id === vertexId);
    if (idx === -1) return;
    const current = (vertices[idx].etiqueta || `V${vertexId}`);
    const respuesta = window.prompt(`Editar etiqueta del vértice:`, current);
    if (respuesta === null) return; // cancel
    const nuevo = String(respuesta).trim();
    if (nuevo === "") { alert("La etiqueta no puede quedar vacía"); return; }
    // Tipo de validación
    if (tipoIdentificador === "numerico") {
      if (!/^[0-9]+$/.test(nuevo)) { alert("Cuando el tipo es numérico, sólo se permiten números"); return; }
    } else if (tipoIdentificador === "alfabetico") {
      if (!/^[A-Za-z]+$/.test(nuevo)) { alert("Cuando el tipo es alfabético, sólo se permiten letras"); return; }
    }
    // Unicidad
    const dup = vertices.some((v, i) => i !== idx && String((v.etiqueta||"").trim()) === nuevo);
    if (dup) { alert("La etiqueta ya existe. Debe ser única"); return; }
    const newVerts = vertices.map((v, i) => (i === idx ? { ...v, etiqueta: nuevo } : v));
    setVertices(newVerts);
  };

  // Insertar un nuevo vértice manualmente (prompt para etiqueta)
  const handleInsertVertice = () => {
    const respuesta = window.prompt("Ingrese etiqueta para el nuevo vértice:", "");
    if (respuesta === null) return;
    const nuevo = String(respuesta).trim();
    if (nuevo === "") { alert("La etiqueta no puede quedar vacía"); return; }
    if (tipoIdentificador === "numerico") {
      if (!/^[0-9]+$/.test(nuevo)) { alert("Cuando el tipo es numérico, sólo se permiten números"); return; }
    } else if (tipoIdentificador === "alfabetico") {
      if (!/^[A-Za-z]+$/.test(nuevo)) { alert("Cuando el tipo es alfabético, sólo se permiten letras"); return; }
    }
    const dup = vertices.some((v) => String((v.etiqueta||"").trim()) === nuevo);
    if (dup) { alert("La etiqueta ya existe. Debe ser única"); return; }
    // Buscar una posición libre que no colisione con vértices existentes
    const findFreePosition = (existing, width = 520, height = 420, minDist = 50) => {
      const paddingX = 40;
      const paddingY = 60;
      const maxTries = 200;
      for (let t = 0; t < maxTries; t++) {
        const x = Math.round(paddingX + Math.random() * (width - 2 * paddingX));
        const y = Math.round(paddingY + Math.random() * (height - 2 * paddingY));
        let ok = true;
        for (const v of existing) {
          const dx = (v.x || 0) - x;
          const dy = (v.y || 0) - y;
          if (Math.hypot(dx, dy) < minDist) { ok = false; break; }
        }
        if (ok) return { x, y };
      }
      // fallback: place in a simple spiral around center
      const cx = Math.round(width / 2);
      const cy = Math.round(height / 2);
      for (let r = 40; r < Math.max(width, height); r += 30) {
        for (let a = 0; a < 360; a += 30) {
          const rad = (a * Math.PI) / 180;
          const x = Math.round(cx + r * Math.cos(rad));
          const y = Math.round(cy + r * Math.sin(rad));
          let ok = true;
          for (const v of existing) {
            const dx = (v.x || 0) - x;
            const dy = (v.y || 0) - y;
            if (Math.hypot(dx, dy) < minDist) { ok = false; break; }
          }
          if (ok) return { x, y };
        }
      }
      return { x: cx, y: cy };
    };

    const { x, y } = findFreePosition(vertices, 520, 420, 50);
    const newV = { id: Date.now() + Math.random(), x, y, etiqueta: nuevo };
    setVertices(prev => [...prev, newV]);
  };

  const toggleSelectMerge = (index) => {
    setMergeSelection(prev => {
      const exists = prev.includes(index);
      if (exists) return prev.filter(i => i !== index);
      return [...prev, index];
    });
  };

  // click while in delete-vertex mode
  const handleVertexDeleteClick = (index) => {
    const v = vertices[index];
    const label = v ? (v.etiqueta || `V${v.id}`) : `V${index}`;
    const ok = window.confirm(`¿Eliminar vértice ${label}?`);
    if (!ok) { setDeletingVertexMode(false); return; }
    // perform deletion similar to previous logic
    const idxToRemove = index;
    const newVertices = vertices.filter((_, i) => i !== idxToRemove);
    const mapping = {};
    let newIdx = 0;
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

  // (Eliminaciones ahora dirigidas por los handlers de modo de eliminación)

  const cancelMerge = () => {
    setMergingMode(false);
    setMergeSelection([]);
  };

  const performMergeSelected = () => {
    if (!mergeSelection || mergeSelection.length < 2) { console.warn('Se requieren al menos dos vértices para fusionar'); return; }
    // default label: for numeric labels join with commas, otherwise concatenate
    const existingLabels = vertices.map(v => (v.etiqueta||`V${v.id}`));
    const selLabels = mergeSelection.map(i => (vertices[i].etiqueta||`V${vertices[i].id}`));
    const nuevo = tipoIdentificador === 'numerico' ? selLabels.join(',') : selLabels.join('');
    // Validate resulting etiqueta by type and uniqueness (allow labels that belong to merged vertices)
    if (nuevo === '') { console.warn('La etiqueta resultante no puede quedar vacía'); return; }
    if (tipoIdentificador === 'numerico') {
      // allow comma-separated numbers like "1,2,3"
      if (!/^[0-9]+(?:,[0-9]+)*$/.test(nuevo)) { console.warn('Cuando el tipo es numérico, la etiqueta resultante debe ser números separados por comas'); return; }
    } else if (tipoIdentificador === 'alfabetico') {
      if (!/^[A-Za-z]+$/.test(nuevo)) { console.warn('Cuando el tipo es alfabético, la etiqueta resultante debe ser alfabética'); return; }
    }
    const mergedSet = new Set(mergeSelection);
    const conflict = vertices.some((v, idx) => !mergedSet.has(idx) && String((v.etiqueta||'').trim()) === nuevo);
    if (conflict) { console.warn('La etiqueta resultante ya existe en otro vértice. Cancela la fusión.'); return; }

    // compute centroid
    let sumx = 0, sumy = 0;
    mergeSelection.forEach(i => { sumx += vertices[i].x || 0; sumy += vertices[i].y || 0; });
    const cx = Math.round(sumx / mergeSelection.length) || 260;
    const cy = Math.round(sumy / mergeSelection.length) || 210;

    // build new vertex list: keep those not merged, append merged vertex
    const kept = vertices.map((v, idx) => ({ ...v, __oldIndex: idx })).filter((v) => !mergedSet.has(v.__oldIndex));
    const mergedVertex = { id: Date.now() + Math.random(), x: cx, y: cy, etiqueta: nuevo };
    const newVertices = [...kept, mergedVertex];

    // create mapping from old index to new index
    const mapping = {};
    for (let i = 0; i < vertices.length; i++) {
      if (mergedSet.has(i)) {
        mapping[i] = newVertices.length - 1; // merged vertex index
      } else {
        // find its position in kept
        const pos = kept.findIndex(v => v.__oldIndex === i);
        mapping[i] = pos;
      }
    }

    // build new edges: redirect endpoints; internal edges between merged vertices become self-loops on the merged vertex; combine duplicates
    const edgeMap = new Map();
    for (const a of aristas) {
      const o = a.origen; const d = a.destino;
      const inO = mergedSet.has(o); const inD = mergedSet.has(d);
      const no = mapping[o]; const nd = mapping[d];
      if (no === undefined || nd === undefined) continue;
      const key = no === nd ? `${no}-${no}` : (no < nd ? `${no}-${nd}` : `${nd}-${no}`);
      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key);
        existing.peso = combineWeights(existing.peso, a.peso, 'union');
        edgeMap.set(key, existing);
      } else {
        edgeMap.set(key, { origen: no, destino: nd, peso: a.peso });
      }
    }

    const newAristas = [];
    for (const [k, v] of edgeMap.entries()) {
      newAristas.push({ id: `a-${Date.now()}-${Math.random()}`, origen: v.origen, destino: v.destino, peso: v.peso });
    }

    // cleanup helper property
    newVertices.forEach(v => { if (v.__oldIndex !== undefined) delete v.__oldIndex; });

    setVertices(newVertices);
    setAristas(newAristas);
    setMergingMode(false);
    setMergeSelection([]);
  };

  // Contracción de aristas: contrae la arista entre dos vértices seleccionados y une esos vértices
  // Uso: active la fusión (Iniciar fusión), seleccione exactamente 2 vértices conectados por una arista, y pulse este botón.
  const handleContractEdges = () => {
    if (!mergeSelection || mergeSelection.length !== 2) {
      alert('Para contraer una arista, seleccione exactamente dos vértices conectados por esa arista.');
      return;
    }
    const [i0, i1] = mergeSelection;
    if (i0 === i1) { alert('Seleccione dos vértices distintos'); return; }
    // comprobar que existe al menos una arista entre i0 e i1
    const connecting = aristas.filter(a => (a.origen === i0 && a.destino === i1) || (a.origen === i1 && a.destino === i0));
    if (!connecting || connecting.length === 0) {
      alert('No existe ninguna arista entre los dos vértices seleccionados');
      return;
    }

    // construir etiqueta resultante según tipo: numérico -> "x,y" ; alfabético -> concatenación "XY"
    const lbl0 = vertices[i0].etiqueta || `V${vertices[i0].id}`;
    const lbl1 = vertices[i1].etiqueta || `V${vertices[i1].id}`;
    let nuevo;
    if (tipoIdentificador === 'numerico') {
      nuevo = `${lbl0},${lbl1}`;
    } else {
      nuevo = `${lbl0}${lbl1}`;
    }
    // Validaciones
    if (nuevo === '') { alert('La etiqueta resultante no puede quedar vacía'); return; }
    if (tipoIdentificador === 'numerico' && !/^[0-9,]+$/.test(nuevo)) {
      alert('La etiqueta resultante no cumple el formato numérico esperado'); return;
    }
    if (tipoIdentificador === 'alfabetico' && !/^[A-Za-z]+$/.test(nuevo)) {
      alert('La etiqueta resultante no cumple el formato alfabético esperado'); return;
    }
    // evitar choque con etiquetas existentes fuera de la selección
    const mergedSet = new Set([i0, i1]);
    const conflict = vertices.some((v, idx) => !mergedSet.has(idx) && String((v.etiqueta||'').trim()) === nuevo);
    if (conflict) { alert('La etiqueta resultante ya existe en otro vértice. Cancela la contracción.'); return; }

    // centroid
    const cx = Math.round(((vertices[i0].x || 0) + (vertices[i1].x || 0)) / 2) || 260;
    const cy = Math.round(((vertices[i0].y || 0) + (vertices[i1].y || 0)) / 2) || 210;

    // build new vertex list: keep those not merged, append merged vertex
    const kept = vertices.map((v, idx) => ({ ...v, __oldIndex: idx })).filter((v) => !mergedSet.has(v.__oldIndex));
    const mergedVertex = { id: Date.now() + Math.random(), x: cx, y: cy, etiqueta: nuevo };
    const newVertices = [...kept, mergedVertex];

    // mapping old index -> new index
    const mapping = {};
    for (let i = 0; i < vertices.length; i++) {
      if (mergedSet.has(i)) mapping[i] = newVertices.length - 1;
      else {
        const pos = kept.findIndex(v => v.__oldIndex === i);
        mapping[i] = pos;
      }
    }

    // rebuild edges: redirect endpoints; DO NOT preserve internal edges between merged vertices (they are removed for contracción)
    const edgeMap = new Map();
    for (const a of aristas) {
      const o = a.origen; const d = a.destino;
      // skip edges that were strictly internal to the merged pair(s)
      if (mergedSet.has(o) && mergedSet.has(d)) {
        // omit this edge: contraction removes the connecting arista
        continue;
      }
      const no = mapping[o]; const nd = mapping[d];
      if (no === undefined || nd === undefined) continue;
      const key = no === nd ? `${no}-${no}` : (no < nd ? `${no}-${nd}` : `${nd}-${no}`);
      if (edgeMap.has(key)) {
        const existing = edgeMap.get(key);
        existing.peso = combineWeights(existing.peso, a.peso, 'union');
        edgeMap.set(key, existing);
      } else {
        edgeMap.set(key, { origen: no, destino: nd, peso: a.peso });
      }
    }

    const newAristas = [];
    for (const [k, v] of edgeMap.entries()) {
      newAristas.push({ id: `a-${Date.now()}-${Math.random()}`, origen: v.origen, destino: v.destino, peso: v.peso });
    }

    // cleanup
    newVertices.forEach(v => { if (v.__oldIndex !== undefined) delete v.__oldIndex; });

    setVertices(newVertices);
    setAristas(newAristas);
    setMergingMode(false);
    setContractingMode(false);
    setMergeSelection([]);
  };

  // Agregar arista manual seleccionando origen/destino y peso
  const handleAddAristaManual = () => {
    if (selectOrigen === null || selectDestino === null) { alert('Seleccione origen y destino'); return; }
    const o = parseInt(selectOrigen, 10);
    const d = parseInt(selectDestino, 10);
    if (isNaN(o) || isNaN(d) || o < 0 || d < 0 || o >= vertices.length || d >= vertices.length) { alert('Índices inválidos'); return; }
    let peso;
    const raw = pesoManual;
    if (raw === null || raw === undefined || String(raw).trim() === "") {
      peso = 1;
    } else if (/^\d+$/.test(String(raw).trim())) {
      peso = Math.max(1, parseInt(String(raw).trim()));
    } else {
      peso = String(raw).trim();
    }
    // If vertex labels are numeric, edge weights should be alphabetic
    if (tipoIdentificador === 'numerico') {
      peso = coerceEdgeWeightToAlpha(peso);
    }
    const nueva = { id: Date.now() + Math.random(), origen: o, destino: d, peso, dirigida: !!esDirigido };
    setAristas(prev => [...prev, nueva]);
    // reset selections
    setSelectOrigen(null); setSelectDestino(null); setPesoManual(getDefaultEdgeWeight());
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
    // If vertex labels are numeric, convert edge weight to alphabetic
    if (tipoIdentificador === 'numerico') {
      peso = coerceEdgeWeightToAlpha(peso);
    }
    const nueva = {
      id: Date.now() + Math.random(),
      origen: modalArista.origen,
      destino: modalArista.destino,
      peso,
      dirigida: !!esDirigido,
    };
    setAristas((prev) => [...prev, nueva]);
    setModalArista(null);
  };

  // keep manual peso default in sync when tipoIdentificador changes
  useEffect(() => {
    setPesoManual(getDefaultEdgeWeight());
    // also update modal default if modal is open
    if (modalArista) setPesoTemporal(getDefaultEdgeWeight());
    // if parent changed initialDirected, sync
    setEsDirigido(!!initialDirected);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipoIdentificador]);

  // If parent provided an initialGraph (e.g., opening from Arboles view), initialize states
  useEffect(() => {
    if (initialGraph && typeof initialGraph === 'object') {
      try {
        const vs = initialGraph.vertices || [];
        const as = initialGraph.aristas || [];
        setVertices(Array.isArray(vs) ? vs : []);
        setAristas(Array.isArray(as) ? as : []);
        setGrafoNombre(initialGraph.nombre || '');
        setFase('grafo');
      } catch (e) {
        // ignore malformed
      }
    }
  }, [initialGraph]);

  const handleEliminarArista = (id) => {
    setAristas((prev) => prev.filter((a) => a.id !== id));
  };

  const handleGuardarGrafo = () => {
    let nombre = (grafoNombre && grafoNombre.trim()) || "";
    if (!nombre) {
      const respuesta = window.prompt(`Ingrese nombre para el grafo ${grafoActual}:`, `Grafo ${grafoActual}`);
      if (respuesta === null) return; // usuario canceló
      nombre = respuesta.trim() || `Grafo ${grafoActual}`;
      setGrafoNombre(nombre);
    }
    const grafoData = { vertices, aristas, nombre };
    // persistir en memoria
    if (grafoActual === 1) {
      setGrafo1(grafoData);
      alert(`Grafo 1 guardado correctamente como '${nombre}'`);
    } else {
      setGrafo2(grafoData);
      alert(`Grafo 2 guardado correctamente como '${nombre}'`);
    }
    // Descargar JSON inmediatamente al guardar — usar mismo esquema que el botón Exportar
    const exportObj = {
      nombre: grafoData.nombre,
      numVertices: (grafoData.vertices || []).length,
      tipoIdentificador,
      metodoAsignacion,
      vertices: grafoData.vertices,
      aristas: grafoData.aristas
    };
    exportGrafoObject(exportObj);
    // If this creation started from operations, return to operations view
    if (crearDesdeOperacion) {
      setCrearDesdeOperacion(false);
      setFase("operaciones");
    }
  };

  const persistCurrentToMemory = () => {
    // Guarda el grafo actual en grafo1/grafo2 sin descargar ni pedir nombre
    const nombre = (grafoNombre && grafoNombre.trim()) || `Grafo ${grafoActual}`;
    const grafoData = { vertices, aristas, nombre };
    if (grafoActual === 1) {
      setGrafo1(grafoData);
    } else {
      setGrafo2(grafoData);
    }
  };

  const handleExportarJSON = () => {
    // prefer saved object if present
    const saved = grafoActual === 1 ? grafo1 : grafo2;
    const source = saved || { vertices, aristas, nombre: grafoNombre };
    exportGrafoObject({
      nombre: source.nombre || `grafo${grafoActual}`,
      numVertices: (source.vertices || []).length,
      tipoIdentificador,
      metodoAsignacion,
      vertices: source.vertices || [],
      aristas: source.aristas || []
    });
  };

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
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!data.vertices || !data.aristas) {
          alert("Formato de JSON inv\u00e1lido");
          return;
        }
        setNumVertices(data.numVertices || data.vertices.length);
        setTipoIdentificador(data.tipoIdentificador || "numerico");
        setMetodoAsignacion(data.metodoAsignacion || "automatico");
        // If loading from operations panel, persist directly into that slot.
        // Prefer explicit dataset.target set on the hidden input (safer than relying on state timing).
        const targetFromInput = event.target && event.target.dataset && event.target.dataset.target ? parseInt(event.target.dataset.target) : null;
        if (fase === "operaciones") {
          const target = targetFromInput || grafoActual || 1;
          const nombre = data.nombre || `Grafo ${target}`;
          const grafoData = { vertices: data.vertices, aristas: data.aristas, nombre };
          if (target === 1) setGrafo1(grafoData);
          else setGrafo2(grafoData);
          alert(`Grafo cargado en Grafo ${target}`);
          // clear dataset target
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
      try { inputGrafoRef.current.dataset.target = String(n); } catch (e) {}
      inputGrafoRef.current.click();
    }
  };

  const handleCrearOtroGrafo = () => {
    // Guardar en memoria sin forzar descarga
    persistCurrentToMemory();
    const nuevoNumero = grafoActual === 1 ? 2 : 1;
    setGrafoActual(nuevoNumero);
    setFase("crear");
    setVertices([]);
    setAristas([]);
    setPrimeraArista(null);
    setIndiceActual(0);
    setEtiquetaActual("");
    setGrafoNombre("");
  };

  const handleReiniciar = () => {
    setFase("menu");
    setVertices([]);
    setAristas([]);
    setPrimeraArista(null);
    setIndiceActual(0);
    setEtiquetaActual("");
    setGrafoNombre("");
  };

  const handleRealizarOperaciones = () => {
    // Persistir el grafo actual si aún no está guardado y pasar a vista de operaciones
    const current = { vertices, aristas };
    if (grafoActual === 1 && !grafo1 && vertices.length > 0) setGrafo1(current);
    if (grafoActual === 2 && !grafo2 && vertices.length > 0) setGrafo2(current);
    setFase("operaciones");
  };

  const handleVaciarGrafoActual = () => {
    const ok = window.confirm("¿Vaciar el grafo actual? Se perderán vértices y aristas.");
    if (!ok) return;
    setVertices([]);
    setAristas([]);
    setGrafoNombre("");
    setPrimeraArista(null);
    setModalArista(null);
    alert("Grafo actual vaciado.");
  };

  const handleVaciarGrafoGuardado = (n) => {
    const ok = window.confirm(`¿Vaciar el Grafo ${n} guardado? Esta acción eliminará el grafo ${n} de la memoria.`);
    if (!ok) return;
    if (n === 1) setGrafo1(null);
    if (n === 2) setGrafo2(null);
    // si el resultado depende de ambos, limpiarlo
    setResultado(null);
    alert(`Grafo ${n} eliminado de la memoria.`);
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
    for (const a of coercedAristas) {
      if (labelType === 'alpha') {
        // vertices are letters -> weights numeric
        a.peso = coerceEdgeWeightToNumeric(a.peso);
      } else if (labelType === 'numeric') {
        // vertices numeric -> weights letters
        a.peso = coerceEdgeWeightToAlpha(a.peso);
      } else {
        // mixed: leave as is
      }
    }
    layoutCircular(vertices, 520, 420);
    setResultado({ vertices, aristas: coercedAristas });
  };

  // Disponibilidad de cada grafo (guardado o actual en memoria)
  const hasG1 = !!grafo1 || (grafoActual === 1 && vertices.length > 0);
  const hasG2 = !!grafo2 || (grafoActual === 2 && vertices.length > 0);

  // Render utilitario para grafo (solo visualización, sin interacción)
  const renderGraph = (vs = [], es = [], small = false) => {
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
    
    // Two-row layout for small graphs
    let layoutVs = vs;
    if (small && vs.length > 0) {
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
    }

    const strokeColor = "#1d6a96";
    const bgColor = "#e7f0ee";
    const strokeWidth = 2;

    return (
      <svg width={width} height={height} style={{ border: "2px solid #1d6a96", borderRadius: "8px", backgroundColor: bgColor }}>
        {grupos.map(([key, grupo]) => {
          const groupSize = grupo.length;
          const midIndex = (groupSize - 1) / 2;
          const ordered = grupo.map((a, i) => ({ a, i })).sort((p, q) => Math.abs(q.i - midIndex) - Math.abs(p.i - midIndex));
          return ordered.map(({ a: arista, i: idx }) => {
            const v1 = layoutVs[arista.origen];
            const v2 = layoutVs[arista.destino];
            if (!v1 || !v2) return null;

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

            const x1 = v1.x; const y1 = v1.y;
            const x2 = v2.x; const y2 = v2.y;
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
                <path d={path} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <text x={pesoX} y={pesoY} fill="#283b42" fontSize="12" fontWeight="bold" textAnchor="middle" dy="0.35em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
              </g>
            );
          });
        })}

        {layoutVs.map((v) => (
          <g key={`v-op-${v.id}`}>
            <circle cx={v.x} cy={v.y} r="22" fill="#1d6a96" stroke="#283b42" strokeWidth="2" />
            <text x={v.x} y={v.y} textAnchor="middle" dy="0.3em" fill="white" fontSize="13" fontWeight="bold" pointerEvents="none">{v.etiqueta || `V${v.id}`}</text>
          </g>
        ))}
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

  return (
    <div className="panel operaciones-grafos">
      {fase !== "operaciones" && (
        <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#d1e8f0", borderRadius: "8px", border: "2px solid #1d6a96", textAlign: "center" }}>
          <h3 style={{ margin: 0, color: "#1d6a96", fontWeight: "bold" }}>Grafo {grafoActual}</h3>
          <p style={{ margin: "5px 0 0 0", fontSize: "0.9rem", color: "#283b42" }}>
            {grafo1 && "✓ Grafo 1 guardado"} {grafo1 && grafo2 && "•"} {grafo2 && "✓ Grafo 2 guardado"}
          </p>
        </div>
      )}
      {/* menu removed: operations is the initial view */}
      {fase === "crear" && (
        <div className="crear-card">
          <div className="crear-header">Crear Grafo</div>
          <div style={{ padding: 8 }}>
            <div className="campo" style={{ width: "100%" }}>
              <label htmlFor="numVertices" style={{ color: "black", fontWeight: "bold", textAlign: "left", display: "block" }}>Cantidad de vértices:</label>
              <input id="numVertices" type="number" value={numVertices} onChange={(e) => setNumVertices(e.target.value)} min="1" max="12" placeholder="1-12" className="input-chico" style={{ color: "black", backgroundColor: "white", padding: "6px 8px", border: "1px solid #aaa", borderRadius: "6px" }} />
            </div>
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
            </div>
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
              overflowY: "auto",
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
              <div style={{ position: "relative", maxHeight: "440px", overflowY: "auto", overflowX: "auto" }}>
                <svg width="520" height="420" style={{ border: "2px solid #1d6a96", borderRadius: "8px", backgroundColor: "#e7f0ee" }}>
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
                        const rx = 30 + idx * 8;
                        const ry = 30 + idx * 8;
                        const offsetX = 35 + idx * 15;
                        const offsetY = 35 + idx * 15;
                        const path = `M ${x + 15} ${y} C ${x + offsetX} ${y - offsetY}, ${x + offsetX} ${y + offsetY}, ${x + 15} ${y}`;
                        const pesoX = x + offsetX + 5;
                        const pesoY = y;
                        const edgeStrokeColor = strokeColor;
                        const edgeStrokeW = strokeWidth + 1.2;
                        return (
                                      <g key={arista.id} onClick={(e) => { if (deletingEdgeMode) { handleEdgeDeleteClick(arista); e.stopPropagation(); } }} style={{ cursor: deletingEdgeMode ? 'pointer' : 'default' }}>
                                        <path d={path} stroke={bgColor} strokeWidth={strokeWidth + 6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        <path d={path} stroke={strokeColor} strokeWidth={strokeWidth + 1.2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        <text x={pesoX} y={pesoY} fill="#283b42" fontSize="11" fontWeight="bold" textAnchor="middle" dy="0.3em" stroke="#e7f0ee" strokeWidth="3" paintOrder="stroke fill">{arista.peso}</text>
                                      </g>
                                    );
                      }

                      const x1 = v1.x;
                      const y1 = v1.y;
                      const x2 = v2.x;
                      const y2 = v2.y;
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
                          if ((mergingMode || contractingMode) && mergeSelection.includes(idx)) fillColor = "#f6c85f"; // selected for merge/contracción
                          else if (primeraArista === idx) fillColor = "#85b8cb";
                            return (
                            <circle cx={v.x} cy={v.y} r="22" fill={fillColor} stroke="#283b42" strokeWidth="2" style={{ cursor: "pointer", transition: "all 0.2s" }} onClick={() => {
                                      if (deletingVertexMode) { handleVertexDeleteClick(idx); }
                                      else if (mergingMode || contractingMode) toggleSelectMerge(idx);
                                      else handleClickVertice(idx);
                                    }} onDoubleClick={() => handleEditarEtiquetaPrompt(v.id)} />
                          );
                        })()
                      }
                      <text x={v.x} y={v.y} textAnchor="middle" dy="0.3em" fill="white" fontSize="13" fontWeight="bold" pointerEvents="none">{v.etiqueta || `V${v.id}`}</text>
                    </g>
                  ))}
                </svg>
              </div>
            </div>

            <div style={{ width: "260px" }}>
              
              <p style={{ color: "#283b42", fontWeight: "bold", marginBottom: "10px" }}>Aristas ({aristas.length}):</p>
              <div className="bloque" style={{ maxHeight: "320px", overflowY: "auto", backgroundColor: "#e7f0ee" }}>
                {aristas.length === 0 ? (
                  <p style={{ color: "#666", fontSize: "0.9rem" }}>Ninguna aún</p>
                ) : (
                  aristas.map((a) => {
                    const isLoop = a.origen === a.destino;
                    const label = isLoop
                      ? `${vertices[a.origen]?.etiqueta || `V${a.origen}`} (bucle)`
                      : `${vertices[a.origen]?.etiqueta || `V${a.origen}`} ↔ ${vertices[a.destino]?.etiqueta || `V${a.destino}`}`;
                    return (
                      <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", marginBottom: "6px", backgroundColor: "#d1dddb", borderRadius: "6px", gap: "8px" }}>
                        <span style={{ color: "#283b42", fontWeight: "bold", flex: "1" }}>{label}</span>
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Operaciones con Vértices */}
              <button className="boton" onClick={handleInsertVertice} style={{ padding: '6px 10px' }}>➕ Insertar vértice</button>
              <button className="boton" onClick={() => { setDeletingVertexMode(true); setMergeSelection([]); setMergingMode(false); setContractingMode(false); alert('Seleccione el vértice que desea eliminar y confirme.'); }} style={{ padding: '6px 10px' }} disabled={vertices.length===0}>🗑 Eliminar vértice</button>
              {mode !== 'tree' && (!mergingMode ? (
                <button className="boton" onClick={() => { setMergingMode(true); setMergeSelection([]); setContractingMode(false); alert('Modo fusión activado: seleccione los vértices a fusionar (clic sobre cada vértice). Luego pulse "Fusionar".'); }} style={{ padding: '6px 10px' }}>🔀 Fusión de vértices</button>
              ) : (
                <>
                  <button className="boton boton_agregar" onClick={performMergeSelected} disabled={mergeSelection.length < 2} style={{ padding: '6px 10px' }}>✅ Fusionar ({mergeSelection.length})</button>
                  <button className="boton" onClick={cancelMerge} style={{ padding: '6px 10px' }}>✖ Cancelar fusión</button>
                </>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
              {/* Operaciones con Aristas */}
              <button className="boton" onClick={() => { setDeletingEdgeMode(true); setMergeSelection([]); setMergingMode(false); setContractingMode(false); alert('Seleccione la arista que desea eliminar y confirme.'); }} style={{ padding: '6px 10px' }} disabled={aristas.length===0}>🗑 Eliminar arista</button>
              {mode !== 'tree' && (!contractingMode ? (
                <button className="boton" onClick={() => { setContractingMode(true); setMergingMode(false); setMergeSelection([]); alert('Modo contracción activado: seleccione DOS vértices conectados y pulse nuevamente el botón para aplicar la contracción.'); }} style={{ padding: '6px 10px' }}>🗜️ Contracción aristas</button>
              ) : (
                <>
                  <button className="boton boton_agregar" onClick={handleContractEdges} disabled={mergeSelection.length !== 2} style={{ padding: '6px 10px' }}>🗜️ Aplicar contracción ({mergeSelection.length}/2)</button>
                  <button className="boton" onClick={() => { setContractingMode(false); setMergeSelection([]); }} style={{ padding: '6px 10px' }}>✖ Cancelar contracción</button>
                </>
              ))}
            </div>

            {mergingMode && (
              <div style={{ marginTop: '8px', backgroundColor: '#f0f7fb', padding: '8px 12px', borderRadius: '6px', border: '1px solid #b9dce8', color: '#0f5671', fontSize: '0.9rem', maxWidth: '720px', textAlign: 'center' }}>
                Seleccione los vértices a fusionar (haga clic sobre cada vértice). Pulse <strong>Fusionar</strong> cuando termine. La etiqueta resultante será la concatenación de las etiquetas seleccionadas.
              </div>
            )}
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
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <h3 style={{ color: "#1d6a96", textAlign: "center", marginBottom: "10px" }}>Operaciones entre Grafos</h3>
          {/* Hidden file input so Upload buttons in operations can trigger file selection */}
          <input ref={inputGrafoRef} type="file" accept=".json" onChange={handleCargarJSON} style={{ display: "none" }} />
          <div className="panel-controles" style={{ display: "flex", flexDirection: "row", gap: "10px", alignItems: "center", maxWidth: "700px", margin: "0 auto 12px" }}>
            <label style={{ fontWeight: "bold", color: "#1d6a96", whiteSpace: "nowrap" }}>Seleccione la operación a realizar:</label>
            <select className="boton" style={{ padding: "8px", color: "#283b42", backgroundColor: "white", flex: 1 }} value={operacion} onChange={(e)=>setOperacion(e.target.value)}>
              <option value="" disabled>-- Seleccionar --</option>
              <option value="union">Unión</option>
              <option value="interseccion">Intersección</option>
              <option value="suma_anillo">Suma Anillo</option>
              <option value="suma">Suma</option>
              <option value="producto_cartesiano">Producto Cartesiano</option>
              <option value="producto_tensorial">Producto Tensorial</option>
              <option value="composicion">Composición entre grafos</option>
            </select>
            <button className="boton boton_agregar" disabled={!operacion || !hasG1 || !hasG2} title={(!hasG1 || !hasG2) ? "Necesita dos grafos para operar" : "Operar"} onClick={()=>{
              const vs1 = (grafo1 ? grafo1.vertices : (grafoActual === 1 ? vertices : []))||[];
              const vs2 = (grafo2 ? grafo2.vertices : (grafoActual === 2 ? vertices : []))||[];
              const as1 = (grafo1 ? grafo1.aristas : (grafoActual === 1 ? aristas : []))||[];
              const as2 = (grafo2 ? grafo2.aristas : (grafoActual === 2 ? aristas : []))||[];
              
              if (operacion === 'suma'){
                // Suma: unir todos los vértices; si tienen mismo nombre se vuelven uno; conectar todos de G1 con todos de G2
                const width = 520; const paddingX=40; const topY=90; const bottomY=330;
                const labelMap = {};
                const newV = [];
                const vMap = {};
                
                // Agregar vértices de G1
                vs1.forEach((v,i)=> {
                  const lbl = v.etiqueta||`V${v.id}`;
                  if(!labelMap[lbl]){
                    const vid = `v-${newV.length}`;
                    labelMap[lbl] = vid;
                    newV.push({id: vid, x: 0, y: 0, etiqueta: lbl});
                  }
                  vMap[`g1-${i}`] = labelMap[lbl];
                });
                // Agregar vértices de G2 (si no están)
                vs2.forEach((v,i)=> {
                  const lbl = v.etiqueta||`V${v.id}`;
                  if(!labelMap[lbl]){
                    const vid = `v-${newV.length}`;
                    labelMap[lbl] = vid;
                    newV.push({id: vid, x: 0, y: 0, etiqueta: lbl});
                  }
                  vMap[`g2-${i}`] = labelMap[lbl];
                });
                
                // Layout
                const cols = newV.length;
                const space = cols>1 ? (width-2*paddingX)/(cols-1) : 0;
                newV.forEach((v,i)=> { v.x = paddingX + i*space; v.y = 210; });
                
                // Conectar todos de G1 con todos de G2 (evitar duplicados y bucles si mismo vértice)
                const edgeSet = new Set();
                const newA = [];
                for(let i=0;i<vs1.length;i++){
                  for(let j=0;j<vs2.length;j++){
                    const v1id = vMap[`g1-${i}`];
                    const v2id = vMap[`g2-${j}`];
                    if(v1id === v2id) continue; // no bucles
                    const key = v1id < v2id ? `${v1id}-${v2id}` : `${v2id}-${v1id}`;
                    if(!edgeSet.has(key)){
                      edgeSet.add(key);
                      const idx1 = newV.findIndex(v=>v.id===v1id);
                      const idx2 = newV.findIndex(v=>v.id===v2id);
                      newA.push({id:`a-${newA.length}`, origen: idx1, destino: idx2, peso: getDefaultEdgeWeight()});
                    }
                  }
                }
                layoutCircular(newV, 520, 420);
                finalizeResultado(newV, newA);
              } else if (operacion === 'union'){
                // Unión: unir vértices (si mismo nombre→uno), unir todas aristas
                const width = 520; const paddingX=40; const topY=90; const bottomY=330;
                const labelMap = {};
                const newV = [];
                const vMap1 = {};
                const vMap2 = {};
                
                vs1.forEach((v,i)=> {
                  const lbl = v.etiqueta||`V${v.id}`;
                  if(!labelMap[lbl]){
                    const vid = `v-${newV.length}`;
                    labelMap[lbl] = vid;
                    newV.push({id: vid, x: 0, y: 0, etiqueta: lbl});
                  }
                  vMap1[i] = labelMap[lbl];
                });
                vs2.forEach((v,i)=> {
                  const lbl = v.etiqueta||`V${v.id}`;
                  if(!labelMap[lbl]){
                    const vid = `v-${newV.length}`;
                    labelMap[lbl] = vid;
                    newV.push({id: vid, x: 0, y: 0, etiqueta: lbl});
                  }
                  vMap2[i] = labelMap[lbl];
                });
                
                const cols = newV.length;
                const space = cols>1 ? (width-2*paddingX)/(cols-1) : 0;
                newV.forEach((v,i)=> { v.x = paddingX + i*space; v.y = 210; });
                
                const edgeSet = new Set();
                const newA = [];
                const edgeMap = new Map();
                as1.forEach(a=>{
                  const vid1 = vMap1[a.origen];
                  const vid2 = vMap1[a.destino];
                  if(!vid1 || !vid2) return;
                  const key = vid1===vid2 ? `${vid1}-${vid1}` : (vid1<vid2 ? `${vid1}-${vid2}` : `${vid2}-${vid1}`);
                  if(!edgeMap.has(key)) edgeMap.set(key, { origen: vid1, destino: vid2, peso: a.peso });
                });
                as2.forEach(a=>{
                  const vid1 = vMap2[a.origen];
                  const vid2 = vMap2[a.destino];
                  if(!vid1 || !vid2) return;
                  const key = vid1===vid2 ? `${vid1}-${vid1}` : (vid1<vid2 ? `${vid1}-${vid2}` : `${vid2}-${vid1}`);
                  if(edgeMap.has(key)){
                    // combinar pesos para la misma arista
                    const existing = edgeMap.get(key);
                    existing.peso = combineWeights(existing.peso, a.peso, 'union');
                    edgeMap.set(key, existing);
                  } else {
                    edgeMap.set(key, { origen: vid1, destino: vid2, peso: a.peso });
                  }
                });
                // Convert map to array
                const edgeKeys = Array.from(edgeMap.keys());
                edgeKeys.forEach((key)=>{
                  const item = edgeMap.get(key);
                  const idx1 = newV.findIndex(v=>v.id===item.origen);
                  const idx2 = newV.findIndex(v=>v.id===item.destino);
                  if(idx1!==-1 && idx2!==-1) newA.push({id:`a-${newA.length}`, origen: idx1, destino: idx2, peso:item.peso||1});
                });
                layoutCircular(newV, 520, 420);
                finalizeResultado(newV, newA);
              } else if (operacion === 'interseccion'){
                // Intersección: vértices con mismo nombre en ambos grafos, aristas que estén en ambos
                const width = 320; const paddingX=30;
                const labels1 = new Set(vs1.map(v=>v.etiqueta||`V${v.id}`));
                const labels2 = new Set(vs2.map(v=>v.etiqueta||`V${v.id}`));
                const commonLabels = [...labels1].filter(l=>labels2.has(l));
                
                if(commonLabels.length === 0) {
                  finalizeResultado([], []);
                  return;
                }
                
                const labelMap = {};
                const newV = [];
                commonLabels.forEach((lbl,i)=>{
                  const vid = `v-${i}`;
                  labelMap[lbl] = vid;
                  newV.push({id: vid, x: 0, y: 140, etiqueta: lbl});
                });
                const cols = Math.ceil(newV.length / 2);
                const row1 = newV.slice(0, cols);
                const row2 = newV.slice(cols);
                const space1 = row1.length>1 ? (width-2*paddingX)/(row1.length-1) : 0;
                const space2 = row2.length>1 ? (width-2*paddingX)/(row2.length-1) : 0;
                row1.forEach((v,i)=> { v.x = paddingX + i*space1; v.y = 70; });
                row2.forEach((v,i)=> { v.x = paddingX + i*space2; v.y = 210; });
                
                // Map original indices to common labels
                const vMap1 = {};
                const vMap2 = {};
                vs1.forEach((v,i)=>{ const lbl=v.etiqueta||`V${v.id}`; if(labelMap[lbl]) vMap1[i]=labelMap[lbl]; });
                vs2.forEach((v,i)=>{ const lbl=v.etiqueta||`V${v.id}`; if(labelMap[lbl]) vMap2[i]=labelMap[lbl]; });
                
                // Aristas comunes: mapear claves a pesos por grafo y combinar
                const edgeMap1 = new Map();
                as1.forEach(a=>{
                  const v1 = vMap1[a.origen];
                  const v2 = vMap1[a.destino];
                  if(v1 && v2){
                    const key = v1===v2 ? `${v1}-${v1}` : (v1<v2 ? `${v1}-${v2}` : `${v2}-${v1}`);
                    if(!edgeMap1.has(key)) edgeMap1.set(key, a.peso);
                  }
                });
                const edgeMap2 = new Map();
                as2.forEach(a=>{
                  const v1 = vMap2[a.origen];
                  const v2 = vMap2[a.destino];
                  if(v1 && v2){
                    const key = v1===v2 ? `${v1}-${v1}` : (v1<v2 ? `${v1}-${v2}` : `${v2}-${v1}`);
                    if(!edgeMap2.has(key)) edgeMap2.set(key, a.peso);
                  }
                });
                const commonKeys = [...edgeMap1.keys()].filter(k=>edgeMap2.has(k));
                const newA = [];
                commonKeys.forEach(k=>{
                  const [v1,v2] = k.split('-');
                  const idx1 = newV.findIndex(v=>v.id===v1);
                  const idx2 = newV.findIndex(v=>v.id===v2);
                  if(idx1!==-1 && idx2!==-1){
                    const w1 = edgeMap1.get(k);
                    const w2 = edgeMap2.get(k);
                    const peso = combineWeights(w1, w2, 'intersect');
                    newA.push({id:`a-${newA.length}`, origen:idx1, destino:idx2, peso:peso});
                  }
                });
                layoutCircular(newV, 520, 420);
                finalizeResultado(newV, newA);
              } else if (operacion === 'suma_anillo'){
                // Suma anillo: aristas de la unión menos las de la intersección (diferencia simétrica)
                const makeKey = (l1, l2) => (l1 === l2 ? `${l1}-${l1}` : (l1 < l2 ? `${l1}-${l2}` : `${l2}-${l1}`));
                const edges1 = new Map();
                as1.forEach(a=>{
                  const l1 = vs1[a.origen]?.etiqueta || `V${vs1[a.origen]?.id}`;
                  const l2 = vs1[a.destino]?.etiqueta || `V${vs1[a.destino]?.id}`;
                  const k = makeKey(l1, l2);
                  edges1.set(k, a.peso);
                });
                const edges2 = new Map();
                as2.forEach(a=>{
                  const l1 = vs2[a.origen]?.etiqueta || `V${vs2[a.origen]?.id}`;
                  const l2 = vs2[a.destino]?.etiqueta || `V${vs2[a.destino]?.id}`;
                  const k = makeKey(l1, l2);
                  edges2.set(k, a.peso);
                });

                const keys1 = Array.from(edges1.keys());
                const keys2 = Array.from(edges2.keys());
                const unionKeys = new Set([...keys1, ...keys2]);
                const intersectKeys = new Set(keys1.filter(k=> edges2.has(k)));
                const resultKeys = Array.from(unionKeys).filter(k=> !intersectKeys.has(k));

                // Build vertex union (todos los vértices de ambos grafos, sin duplicados), manteniendo orden
                const allLabelsOrdered = [];
                vs1.forEach(v=> allLabelsOrdered.push(v.etiqueta||`V${v.id}`));
                vs2.forEach(v=> allLabelsOrdered.push(v.etiqueta||`V${v.id}`));
                const unionLabels = Array.from(new Set(allLabelsOrdered));
                const newV = unionLabels.map((lbl,i)=>({ id: `v-${i}`, x:0, y:0, etiqueta: lbl }));

                // Si no hay aristas en la diferencia, mostramos todos los vértices pero sin aristas
                if(resultKeys.length === 0){
                  layoutCircular(newV, 520, 420);
                  finalizeResultado(newV, []);
                  return;
                }

                // Mapear label -> índice en newV
                const labelIndex = {};
                newV.forEach((v,i)=> { labelIndex[v.etiqueta] = i; });

                const newA = [];
                resultKeys.forEach(k=>{
                  const [l1,l2] = k.split('-');
                  const peso = edges1.has(k) ? edges1.get(k) : edges2.get(k);
                  const idx1 = labelIndex[l1];
                  const idx2 = labelIndex[l2];
                  if(idx1 !== undefined && idx2 !== undefined) newA.push({id:`a-${newA.length}`, origen: idx1, destino: idx2, peso: peso});
                });
                layoutCircular(newV, 520, 420);
                finalizeResultado(newV, newA);
              } else if (operacion === 'producto_cartesiano'){
                // Producto cartesiano G x H: V = V(G) x V(H)
                // (g1,h1) ~ (g2,h2) if (g1==g2 and (h1,h2) in E(H)) or (h1==h2 and (g1,g2) in E(G))
                const makeKey = (l1, l2) => (l1 === l2 ? `${l1}-${l1}` : (l1 < l2 ? `${l1}-${l2}` : `${l2}-${l1}`));
                const edgeMapG = new Map();
                as1.forEach(a=>{
                  const l1 = vs1[a.origen]?.etiqueta || `V${vs1[a.origen]?.id}`;
                  const l2 = vs1[a.destino]?.etiqueta || `V${vs1[a.destino]?.id}`;
                  edgeMapG.set(makeKey(l1,l2), a.peso);
                });
                const edgeMapH = new Map();
                as2.forEach(a=>{
                  const l1 = vs2[a.origen]?.etiqueta || `V${vs2[a.origen]?.id}`;
                  const l2 = vs2[a.destino]?.etiqueta || `V${vs2[a.destino]?.id}`;
                  edgeMapH.set(makeKey(l1,l2), a.peso);
                });

                const newV = [];
                for (let i=0;i<vs1.length;i++){
                  for (let j=0;j<vs2.length;j++){
                    const lbl1 = vs1[i].etiqueta||`V${vs1[i].id}`;
                    const lbl2 = vs2[j].etiqueta||`V${vs2[j].id}`;
                    newV.push({ id: `v-${i}-${j}`, x:0, y:0, etiqueta: `${lbl1}${lbl2}`});
                  }
                }
                const labelIndex = {};
                newV.forEach((v, idx)=> labelIndex[v.etiqueta]=idx);
                const newA = [];
                // iterate pairs of product vertices
                for (let i1=0;i1<vs1.length;i1++){
                  for (let j1=0;j1<vs2.length;j1++){
                    for (let i2=0;i2<vs1.length;i2++){
                      for (let j2=0;j2<vs2.length;j2++){
                        if (i1===i2 && j1===j2) continue;
                        const lblA1 = vs1[i1].etiqueta||`V${vs1[i1].id}`;
                        const lblA2 = vs1[i2].etiqueta||`V${vs1[i2].id}`;
                        const lblB1 = vs2[j1].etiqueta||`V${vs2[j1].id}`;
                        const lblB2 = vs2[j2].etiqueta||`V${vs2[j2].id}`;
                        let shouldAdd = false; let peso = undefined;
                        if (lblA1 === lblA2) {
                          // check edge in H between lblB1-lblB2
                          const k = makeKey(lblB1, lblB2);
                          if (edgeMapH.has(k)) { shouldAdd = true; peso = edgeMapH.get(k); }
                        }
                        if (lblB1 === lblB2) {
                          const k = makeKey(lblA1, lblA2);
                          if (edgeMapG.has(k)) { shouldAdd = true; peso = edgeMapG.get(k); }
                        }
                        if (shouldAdd) {
                          const id1 = labelIndex[`${lblA1}${lblB1}`];
                          const id2 = labelIndex[`${lblA2}${lblB2}`];
                          if (id1!==undefined && id2!==undefined) newA.push({ id:`a-${newA.length}`, origen:id1, destino:id2, peso });
                        }
                      }
                    }
                  }
                }
                layoutCircular(newV, 520, 420);
                finalizeResultado(newV, newA);
              } else if (operacion === 'producto_tensorial'){
                // Producto tensorial (Kronecker): V = V(G) x V(H)
                // (g1,h1) ~ (g2,h2) iff (g1,g2) in E(G) and (h1,h2) in E(H)
                const makeKey = (l1, l2) => (l1 === l2 ? `${l1}-${l1}` : (l1 < l2 ? `${l1}-${l2}` : `${l2}-${l1}`));
                const edgeMapG = new Map();
                as1.forEach(a=>{
                  const l1 = vs1[a.origen]?.etiqueta || `V${vs1[a.origen]?.id}`;
                  const l2 = vs1[a.destino]?.etiqueta || `V${vs1[a.destino]?.id}`;
                  edgeMapG.set(makeKey(l1,l2), a.peso);
                });
                const edgeMapH = new Map();
                as2.forEach(a=>{
                  const l1 = vs2[a.origen]?.etiqueta || `V${vs2[a.origen]?.id}`;
                  const l2 = vs2[a.destino]?.etiqueta || `V${vs2[a.destino]?.id}`;
                  edgeMapH.set(makeKey(l1,l2), a.peso);
                });
                const newV = [];
                for (let i=0;i<vs1.length;i++) for (let j=0;j<vs2.length;j++){
                  const lbl1 = vs1[i].etiqueta||`V${vs1[i].id}`;
                  const lbl2 = vs2[j].etiqueta||`V${vs2[j].id}`;
                  newV.push({ id: `v-${i}-${j}`, x:0, y:0, etiqueta: `${lbl1}${lbl2}`});
                }
                const labelIndex = {};
                newV.forEach((v, idx)=> labelIndex[v.etiqueta]=idx);
                const newA = [];
                for (let i1=0;i1<vs1.length;i1++){
                  for (let j1=0;j1<vs2.length;j1++){
                    for (let i2=0;i2<vs1.length;i2++){
                      for (let j2=0;j2<vs2.length;j2++){
                        if (i1===i2 && j1===j2) continue;
                        const aGk = makeKey(vs1[i1].etiqueta||`V${vs1[i1].id}`, vs1[i2].etiqueta||`V${vs1[i2].id}`);
                        const aHk = makeKey(vs2[j1].etiqueta||`V${vs2[j1].id}`, vs2[j2].etiqueta||`V${vs2[j2].id}`);
                        if (edgeMapG.has(aGk) && edgeMapH.has(aHk)){
                          const peso = combineWeights(edgeMapG.get(aGk), edgeMapH.get(aHk), 'union');
                          const id1 = labelIndex[`${(vs1[i1].etiqueta||`V${vs1[i1].id}`)+(vs2[j1].etiqueta||`V${vs2[j1].id}`)}`];
                          const id2 = labelIndex[`${(vs1[i2].etiqueta||`V${vs1[i2].id}`)+(vs2[j2].etiqueta||`V${vs2[j2].id}`)}`];
                          if (id1!==undefined && id2!==undefined) newA.push({ id:`a-${newA.length}`, origen:id1, destino:id2, peso });
                        }
                      }
                    }
                  }
                }
                layoutCircular(newV, 520, 420);
                finalizeResultado(newV, newA);
              } else if (operacion === 'composicion'){
                // Composición (lexicográfico) G[H]: V = V(G) x V(H)
                // (g1,h1) ~ (g2,h2) if (g1,g2) in E(G) OR (g1==g2 and (h1,h2) in E(H))
                const makeKey = (l1, l2) => (l1 === l2 ? `${l1}-${l1}` : (l1 < l2 ? `${l1}-${l2}` : `${l2}-${l1}`));
                const edgeMapG = new Map();
                as1.forEach(a=>{
                  const l1 = vs1[a.origen]?.etiqueta || `V${vs1[a.origen]?.id}`;
                  const l2 = vs1[a.destino]?.etiqueta || `V${vs1[a.destino]?.id}`;
                  edgeMapG.set(makeKey(l1,l2), a.peso);
                });
                const edgeMapH = new Map();
                as2.forEach(a=>{
                  const l1 = vs2[a.origen]?.etiqueta || `V${vs2[a.origen]?.id}`;
                  const l2 = vs2[a.destino]?.etiqueta || `V${vs2[a.destino]?.id}`;
                  edgeMapH.set(makeKey(l1,l2), a.peso);
                });
                const newV = [];
                for (let i=0;i<vs1.length;i++) for (let j=0;j<vs2.length;j++){
                  const lbl1 = vs1[i].etiqueta||`V${vs1[i].id}`;
                  const lbl2 = vs2[j].etiqueta||`V${vs2[j].id}`;
                  newV.push({ id: `v-${i}-${j}`, x:0, y:0, etiqueta: `${lbl1}${lbl2}`});
                }
                const labelIndex = {};
                newV.forEach((v, idx)=> labelIndex[v.etiqueta]=idx);
                const newA = [];
                for (let i1=0;i1<vs1.length;i1++){
                  for (let j1=0;j1<vs2.length;j1++){
                    for (let i2=0;i2<vs1.length;i2++){
                      for (let j2=0;j2<vs2.length;j2++){
                        if (i1===i2 && j1===j2) continue;
                        const lblG1 = vs1[i1].etiqueta||`V${vs1[i1].id}`;
                        const lblG2 = vs1[i2].etiqueta||`V${vs1[i2].id}`;
                        const lblH1 = vs2[j1].etiqueta||`V${vs2[j1].id}`;
                        const lblH2 = vs2[j2].etiqueta||`V${vs2[j2].id}`;
                        let shouldAdd = false; let peso = undefined;
                        const kG = makeKey(lblG1, lblG2);
                        if (edgeMapG.has(kG)) { shouldAdd = true; peso = edgeMapG.get(kG); }
                        else if (lblG1 === lblG2) {
                          const kH = makeKey(lblH1, lblH2);
                          if (edgeMapH.has(kH)) { shouldAdd = true; peso = edgeMapH.get(kH); }
                        }
                        if (shouldAdd) {
                          const id1 = labelIndex[`${lblG1}${lblH1}`];
                          const id2 = labelIndex[`${lblG2}${lblH2}`];
                          if (id1!==undefined && id2!==undefined) newA.push({ id:`a-${newA.length}`, origen:id1, destino:id2, peso });
                        }
                      }
                    }
                  }
                }
                layoutCircular(newV, 520, 420);
                finalizeResultado(newV, newA);
              } else {
                setResultado(null);
              }
            }}>Operar</button>
          </div>
          <div style={{ display: "flex", gap: "24px", justifyContent: "center", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <p style={{ color: "#283b42", fontWeight: "bold", textAlign: "center", margin: 0 }}>Grafo 1</p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {!grafo1 && (
                      <button className="boton boton_agregar" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleStartCreateGraph(1)}>➕ Crear</button>
                    )}
                    {grafo1 && (
                      <button className="boton" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleEditarGrafo(1)}>✏️ Editar</button>
                    )}
                    <button className="boton" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleUploadTo(1)}>📤 Subir</button>
                    {grafo1 && (
                      <button className="boton" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleVaciarGrafoGuardado(1)}>🗑 Eliminar</button>
                    )}
                  </div>
                </div>
                {renderGraph((grafo1 ? grafo1.vertices : []), (grafo1 ? grafo1.aristas : []), true)}
                <p style={{ color: "#283b42", marginTop: "6px", fontSize: "0.9rem" }}>
                  <strong>S1:</strong> {((grafo1 ? grafo1.vertices : [])||[]).map(v=>v.etiqueta||`V${v.id}`).join(", ")}<br/>
                  <strong>A1:</strong> {(((grafo1 ? grafo1.aristas : [])||[]).map(a=>{
                    const verts = (grafo1 ? grafo1.vertices : []) || [];
                    const v1 = verts[a.origen];
                    const v2 = verts[a.destino];
                    const l1 = v1 ? (v1.etiqueta||`V${v1.id}`) : `V${a.origen}`;
                    const l2 = v2 ? (v2.etiqueta||`V${v2.id}`) : `V${a.destino}`;
                    const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
                    return `${l1}${l2}${peso}`;
                  })).join(", ") || "∅"}
                </p>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                  <p style={{ color: "#283b42", fontWeight: "bold", textAlign: "center", margin: 0 }}>Grafo 2</p>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {!grafo2 && (
                      <button className="boton boton_agregar" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleStartCreateGraph(2)}>➕ Crear</button>
                    )}
                    {grafo2 && (
                      <button className="boton" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleEditarGrafo(2)}>✏️ Editar</button>
                    )}
                    <button className="boton" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleUploadTo(2)}>📤 Subir</button>
                    {grafo2 && (
                      <button className="boton" style={{ padding: "6px 8px", fontSize: "0.85rem" }} onClick={() => handleVaciarGrafoGuardado(2)}>🗑 Eliminar</button>
                    )}
                  </div>
                </div>
                {renderGraph((grafo2 ? grafo2.vertices : []), (grafo2 ? grafo2.aristas : []), true)}
                <p style={{ color: "#283b42", marginTop: "6px", fontSize: "0.9rem" }}>
                  <strong>S2:</strong> {((grafo2 ? grafo2.vertices : [])||[]).map(v=>v.etiqueta||`V${v.id}`).join(", ")}<br/>
                  <strong>A2:</strong> {(((grafo2 ? grafo2.aristas : [])||[]).map(a=>{
                    const verts = (grafo2 ? grafo2.vertices : []) || [];
                    const v1 = verts[a.origen];
                    const v2 = verts[a.destino];
                    const l1 = v1 ? (v1.etiqueta||`V${v1.id}`) : `V${a.origen}`;
                    const l2 = v2 ? (v2.etiqueta||`V${v2.id}`) : `V${a.destino}`;
                    const peso = a.peso !== undefined && a.peso !== null ? `:${a.peso}` : '';
                    return `${l1}${l2}${peso}`;
                  })).join(", ") || "∅"}
                </p>
              </div>
            </div>
            <div style={{ 
              width: "2px", 
              backgroundColor: "#1d6a96", 
              alignSelf: "stretch",
              minHeight: "600px"
            }} />
            <div style={{ display: "flex", alignItems: "center" }}>
              <div>
                <p style={{ color: "#283b42", fontWeight: "bold", textAlign: "center", marginBottom: "6px" }}>Grafo 3 - Resultado</p>
                {resultado ? (
                  <div>
                    {renderGraph(resultado.vertices, resultado.aristas, false)}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
                      <button className="boton boton_agregar" onClick={() => {
                        // export resultado
                        const source = { nombre: resultado.nombre || 'Grafo3', vertices: resultado.vertices || [], aristas: resultado.aristas || [] };
                        exportGrafoObject({ nombre: source.nombre, numVertices: (source.vertices||[]).length, tipoIdentificador, metodoAsignacion, vertices: source.vertices, aristas: source.aristas });
                      }}>💾 Guardar Resultado</button>
                    </div>
                    <p style={{ color: "#283b42", marginTop: "8px", fontSize: "0.95rem" }}>
                      <strong>S3:</strong> {((resultado.vertices||[]).map(v=>v.etiqueta||`V${v.id}`)).join(', ') || '∅'}<br/>
                      <strong>A3:</strong> {((resultado.aristas||[]).map(a=>{
                        const verts = resultado.vertices || [];
                        const v1 = verts[a.origen];
                        const v2 = verts[a.destino];
                        const l1 = v1 ? (v1.etiqueta||`V${v1.id}`) : `V${a.origen}`;
                        const l2 = v2 ? (v2.etiqueta||`V${v2.id}`) : `V${a.destino}`;
                        return `${l1}${l2}${a.peso !== undefined && a.peso !== null ? `:${a.peso}` : ''}`;
                      })).join(', ') || '∅'}
                    </p>
                  </div>
                ) : (
                  <div style={{ width: 520, height: 420, border: "2px solid #1d6a96", borderRadius: "8px", backgroundColor: "#e7f0ee", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ color: "#999", fontSize: "0.95rem" }}>Seleccione una operación</p>
                  </div>
                )}
              </div>
            </div>
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

export default OperacionesGrafos;
