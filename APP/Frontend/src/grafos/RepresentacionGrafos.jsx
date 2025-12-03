import React, { useState, useEffect, useRef } from "react";
import "./OperacionesGrafos.css";

function RepresentacionGrafos({ initialDirected = false, initialGraph = null, onBack = null }) {
  const [fase, setFase] = useState("config"); // "config" -> "etiquetar" -> "editor"

  const [numVertices, setNumVertices] = useState(6);
  const [tipoIdentificador, setTipoIdentificador] = useState("alfabetico");
  const [esDirigido, setEsDirigido] = useState(!!initialDirected);

  const [vertices, setVertices] = useState([]); // {id,x,y,etiqueta}
  const [aristas, setAristas] = useState([]);   // {id,origen,destino,peso,dirigida}

  const [primeraArista, setPrimeraArista] = useState(null);
  const [modalArista, setModalArista] = useState(null);
  const [pesoTemporal, setPesoTemporal] = useState(1);

  const [menuMatricesAbierto, setMenuMatricesAbierto] = useState(false);
  const [matrizVisible, setMatrizVisible] = useState("ninguna");
  const [matrizDatos, setMatrizDatos] = useState([]);
  const [matrizTitulo, setMatrizTitulo] = useState("");
  const [matrizFilaHeaders, setMatrizFilaHeaders] = useState([]);
  const [matrizColHeaders, setMatrizColHeaders] = useState([]);
  const [mostrarArbol, setMostrarArbol] = useState(false);
  const [ramas, setRamas] = useState([]);   // aristas del árbol
  const [cuerdas, setCuerdas] = useState([]); // aristas fuera del árbol


  const dragging = useRef(null);
  const svgRef = useRef(null);
  const inputFileRef = useRef(null);

  useEffect(() => {
    if (initialGraph && typeof initialGraph === "object") {
      try {
        const vs = initialGraph.vertices || [];
        const as = initialGraph.aristas || [];
        setVertices(Array.isArray(vs) ? vs : []);
        setAristas(Array.isArray(as) ? as : []);
        if (vs.every(v => /^[A-Za-z]+$/.test(v.etiqueta || ""))) setTipoIdentificador("alfabetico");
        else setTipoIdentificador("numerico");
        setFase("editor");
        setEsDirigido(!!initialDirected);
      } catch (e) { }
    }
  }, [initialGraph, initialDirected]);

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
    const n =
      typeof peso === "number"
        ? Math.max(1, Math.floor(peso))
        : parseInt(String(peso)) || 1;
    return lettersFromNumber(n);
  };

  const getDefaultEdgeWeight = () => {
    if (tipoIdentificador === "numerico") return coerceEdgeWeightToAlpha(1);
    return 1;
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

  const handleCrearDesdeConfig = () => {
    const n = parseInt(numVertices);
    if (isNaN(n) || n < 1 || n > 12) {
      alert("Ingrese una cantidad válida de vértices (1 a 12)");
      return;
    }
    const nuevos = [];
    for (let i = 0; i < n; i++) {
      nuevos.push({
        id: Date.now() + Math.random() + "-" + i,
        x: 0,
        y: 0,
        etiqueta:
          tipoIdentificador === "numerico"
            ? String(i + 1)
            : String.fromCharCode(65 + i),
      });
    }
    layoutCircular(nuevos, 520, 420);
    setVertices(nuevos);
    setAristas([]);
    setFase("etiquetar");
  };

  const handleConfirmarEtiquetas = () => {
    const usados = new Set();
    for (let v of vertices) {
      const et = String(v.etiqueta || "").trim();
      if (!et) {
        alert("Todos los vértices requieren etiqueta.");
        return;
      }
      if (tipoIdentificador === "numerico" && !/^[0-9]+$/.test(et)) {
        alert("Con tipo numérico solo se permiten dígitos.");
        return;
      }
      if (tipoIdentificador === "alfabetico" && !/^[A-Za-z]+$/.test(et)) {
        alert("Con tipo alfabético solo se permiten letras.");
        return;
      }
      if (usados.has(et)) {
        alert("Todas las etiquetas deben ser únicas.");
        return;
      }
      usados.add(et);
    }
    setFase("editor");
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
    else if (/^\d+$/.test(String(raw).trim()))
      peso = Math.max(1, parseInt(String(raw).trim()));
    else peso = String(raw).trim();
    if (tipoIdentificador === "numerico") peso = coerceEdgeWeightToAlpha(peso);
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

    setVertices((prev) =>
      prev.map((v, i) => {
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
      })
    );
  };

  const handleMouseUp = () => {
    dragging.current = null;
  };

  const exportGrafoObject = () => {
    const grafoData = {
      nombre: "grafo",
      vertices,
      aristas,
      dirigido: esDirigido,
      tipoIdentificador,
    };
    const dataStr = JSON.stringify(grafoData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "grafo.json";
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
          alert("Formato de JSON inválido");
          return;
        }
        setVertices(data.vertices || []);
        setAristas(data.aristas || []);
        setEsDirigido(!!data.dirigido);
        if ((data.vertices || []).every((v) => /^[A-Za-z]+$/.test(v.etiqueta || "")))
          setTipoIdentificador("alfabetico");
        else setTipoIdentificador("numerico");
        setFase("editor");
        alert("Grafo cargado correctamente.");
      } catch (err) {
        alert("Error al leer JSON");
      }
    };
    reader.readAsText(file);
    if (inputFileRef.current) inputFileRef.current.value = "";
  };

  const obtenerMatrizAdyacencia = () => {
    const n = vertices.length;
    const matriz = Array(n)
      .fill()
      .map(() => Array(n).fill(0));

    aristas.forEach((a) => {
      const i = a.origen;
      const j = a.destino;
      if (esDirigido) {
        matriz[i][j] = 1;
        matriz[j][i] = -1;
      } else {
        matriz[i][j] = 1;
        if (i !== j) matriz[j][i] = 1;
      }
    });

    const headers = vertices.map(
      (v, idx) => v.etiqueta || `V${idx + 1}`
    );

    return { headers, matriz };
  };


  const obtenerMatrizIncidencia = () => {
    const n = vertices.length;
    const m = aristas.length;
    const matriz = Array(n)
      .fill()
      .map(() => Array(m).fill(0));

    aristas.forEach((a, idx) => {
      const i = a.origen;
      const j = a.destino;
      if (esDirigido) {
        matriz[i][idx] = -1;
        matriz[j][idx] = 1;
      } else {
        if (i === j) matriz[i][idx] = 2;
        else {
          matriz[i][idx] = 1;
          matriz[j][idx] = 1;
        }
      }
    });

    // encabezados de filas: vértices
    const filaHeaders = vertices.map(
      (v, idx) => v.etiqueta || `V${idx + 1}`
    );
    // encabezados de columnas: aristas
    const colHeaders = aristas.map((a, idx) => {
      const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
      const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
      return `e${idx + 1}: ${l1}→${l2}`;
    });

    return { filaHeaders, colHeaders, matriz };
  };
  const obtenerMatrizAdyacenciaAristas = () => {
    const m = aristas.length;
    const matriz = Array(m)
      .fill()
      .map(() => Array(m).fill(0));

    for (let i = 0; i < m; i++) {
      const ai = aristas[i];
      const vi = [ai.origen, ai.destino];
      for (let j = 0; j < m; j++) {
        if (i === j) continue;
        const aj = aristas[j];
        const vj = [aj.origen, aj.destino];
        // comparten al menos un vértice
        const comparten =
          vi.includes(aj.origen) || vi.includes(aj.destino) ||
          vj.includes(ai.origen) || vj.includes(ai.destino);
        if (comparten) matriz[i][j] = 1;
      }
    }

    const headers = aristas.map((a, idx) => {
      const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
      const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
      return `e${idx + 1}: ${l1}-${l2}`;
    });

    return { headers, matriz };
  };

  const getNumericWeight = (peso) => {
    if (typeof peso === "number") return peso;
    const s = String(peso || "").trim();
    if (/^\d+$/.test(s)) return parseInt(s, 10);
    // si es letra A,B,... toma su índice
    const c = s.toUpperCase().charCodeAt(0);
    if (c >= 65 && c <= 90) return c - 64;
    return 1;
  };
  const calcularArbolMinimo = () => {
    const n = vertices.length;
    const m = aristas.length;
    if (n === 0 || m === 0) return { ramas: [], cuerdas: [] };

    // union-find
    const parent = Array(n)
      .fill(0)
      .map((_, i) => i);

    const find = (x) => (parent[x] === x ? x : (parent[x] = find(parent[x])));
    const union = (a, b) => {
      const ra = find(a);
      const rb = find(b);
      if (ra !== rb) parent[rb] = ra;
    };

    const edges = aristas.map((a, idx) => ({
      idx,
      origen: a.origen,
      destino: a.destino,
      peso: getNumericWeight(a.peso),
    }));

    edges.sort((e1, e2) => e1.peso - e2.peso);

    const ramasIdx = [];
    for (const e of edges) {
      if (find(e.origen) !== find(e.destino)) {
        union(e.origen, e.destino);
        ramasIdx.push(e.idx);
      }
    }

    const ramas = ramasIdx.map((i) => aristas[i]);
    const cuerdas = aristas.filter((_, i) => !ramasIdx.includes(i));

    return { ramas, cuerdas, ramasIdx };
  };
  const construirGrafoDeRamas = (ramasLocales) => {
    const adj = new Map();
    ramasLocales.forEach((a, idx) => {
      const u = a.origen;
      const v = a.destino;
      if (!adj.has(u)) adj.set(u, []);
      if (!adj.has(v)) adj.set(v, []);
      adj.get(u).push({ vecino: v, edgeIndex: idx });
      adj.get(v).push({ vecino: u, edgeIndex: idx });
    });
    return adj;
  };

  const encontrarCaminoEnArbol = (ramasLocales, origen, destino) => {
    const adj = construirGrafoDeRamas(ramasLocales);
    const stack = [{ v: origen, parentEdge: -1 }];
    const visited = new Set([origen]);
    const parent = new Map(); // v -> { prev, edgeIndex }

    while (stack.length > 0) {
      const { v } = stack.pop();
      if (v === destino) break;
      const vecinos = adj.get(v) || [];
      for (const { vecino, edgeIndex } of vecinos) {
        if (!visited.has(vecino)) {
          visited.add(vecino);
          parent.set(vecino, { prev: v, edgeIndex });
          stack.push({ v: vecino, parentEdge: edgeIndex });
        }
      }
    }

    if (!parent.has(destino) && origen !== destino) return [];

    // reconstruir camino como índices de ramasLocales
    const pathEdges = [];
    let cur = destino;
    while (cur !== origen) {
      const info = parent.get(cur);
      if (!info) break;
      pathEdges.push(info.edgeIndex);
      cur = info.prev;
    }
    return pathEdges.reverse();
  };
  const obtenerMatrizCircuitosFundamentales = (ramasLocales, cuerdasLocales) => {
    const m = aristas.length;
    const numCuerdas = cuerdasLocales.length;
    const matriz = Array(numCuerdas)
      .fill()
      .map(() => Array(m).fill(0));

    // mapa arista global -> índice
    const edgeIndexMap = new Map();
    aristas.forEach((a, idx) => edgeIndexMap.set(a.id, idx));

    cuerdasLocales.forEach((cuerda, i) => {
      const { origen, destino } = cuerda;
      // camino en el árbol entre origen y destino
      const pathRamasIdx = encontrarCaminoEnArbol(ramasLocales, origen, destino);

      // marcar la cuerda en la matriz
      const idxGlobalCuerda = edgeIndexMap.get(cuerda.id);
      if (idxGlobalCuerda != null) matriz[i][idxGlobalCuerda] = 1;

      // marcar las ramas del camino
      pathRamasIdx.forEach((idxRamaLocal) => {
        const rama = ramasLocales[idxRamaLocal];
        const idxGlobalRama = edgeIndexMap.get(rama.id);
        if (idxGlobalRama != null) matriz[i][idxGlobalRama] = 1;
      });
    });

    return matriz;
  };
  const obtenerMatrizCortesFundamentales = (ramasLocales, cuerdasLocales) => {
    const m = aristas.length;
    const numRamas = ramasLocales.length;
    const matriz = Array(numRamas)
      .fill()
      .map(() => Array(m).fill(0));

    const edgeIndexMap = new Map();
    aristas.forEach((a, idx) => edgeIndexMap.set(a.id, idx));

    // construir grafo completo del árbol para reusar
    const adjTree = construirGrafoDeRamas(ramasLocales);

    ramasLocales.forEach((rama, i) => {
      const { origen, destino } = rama;

      // quitar temporalmente la rama en el árbol
      const adj = new Map();
      for (const [v, lista] of adjTree.entries()) {
        adj.set(
          v,
          lista.filter(
            (e) =>
              !(
                (v === origen && e.vecino === destino) ||
                (v === destino && e.vecino === origen)
              )
          )
        );
      }

      // componente 1: vértices alcanzables desde 'origen'
      const comp1 = new Set();
      const stack = [origen];
      comp1.add(origen);
      while (stack.length > 0) {
        const v = stack.pop();
        const vecinos = adj.get(v) || [];
        for (const { vecino } of vecinos) {
          if (!comp1.has(vecino)) {
            comp1.add(vecino);
            stack.push(vecino);
          }
        }
      }

      // cualquier arista que conecta comp1 con su complemento pertenece al corte
      aristas.forEach((a, idxGlobal) => {
        const u = a.origen;
        const v = a.destino;
        const en1 = comp1.has(u);
        const en2 = comp1.has(v);
        if (en1 !== en2) {
          matriz[i][idxGlobal] = 1;
        }
      });
    });

    return matriz;
  };





  const mostrarMatrizSimple = (titulo, matriz) => {
    if (!matriz || matriz.length === 0) {
      alert(`${titulo}\n\nNo hay datos.`);
      return;
    }
    let txt = `${titulo}\n\n`;
    matriz.forEach((fila, i) => {
      txt += `${i + 1}: ${fila.join(" ")}\n`;
    });
    alert(txt);
  };

  const handleMenuOpcion = (opcion) => {
    setMenuMatricesAbierto(false);
    setMatrizFilaHeaders([]);
    setMatrizColHeaders([]);
    // al inicio de handleMenuOpcion:
    setMostrarArbol(false);

    if (vertices.length === 0) {
      alert("Primero construya el grafo.");
      return;
    }

    let matriz = null;
    let titulo = "";

    // por defecto, sin headers

    switch (opcion) {
      case "adyacenciaVertices": {
        const { headers, matriz: mat } = obtenerMatrizAdyacencia();
        matriz = mat;
        titulo = "Matriz de adyacencia por vértices";
        setMatrizFilaHeaders(headers); // filas = vértices
        setMatrizColHeaders(headers);  // columnas = vértices
        break;
      }
      case "incidencia": {
        const { filaHeaders, colHeaders, matriz: mat } = obtenerMatrizIncidencia();
        matriz = mat;
        titulo = "Matriz de incidencia (filas: vértices, columnas: aristas)";
        setMatrizFilaHeaders(filaHeaders);
        setMatrizColHeaders(colHeaders);
        break;
      }

      case "adyacenciaAristas": {
        const { headers, matriz: mat } = obtenerMatrizAdyacenciaAristas();
        matriz = mat;
        titulo = "Matriz de adyacencia (aristas)";
        setMatrizFilaHeaders(headers);
        setMatrizColHeaders(headers);

        break;
      }

      case "matrizCircuitos": {
        if (esDirigido) {
          alert("La matriz de circuitos se define sobre el grafo no dirigido.");
          return;
        }
        const { ramas, cuerdas } = calcularArbolMinimo();
        setRamas(ramas);
        setCuerdas(cuerdas);

        const matrizCF = obtenerMatrizCircuitosFundamentales(ramas, cuerdas);
        matriz = matrizCF;
        titulo = "Matriz de circuitos (filas: circuitos, columnas: aristas)";

        // una fila por circuito (una por cuerda)
        setMatrizFilaHeaders(
          cuerdas.map((_, i) => `C${i + 1}`)
        );
        setMatrizColHeaders(
          aristas.map((a, idx) => {
            const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
            const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
            return `e${idx + 1}: ${l1}-${l2}`;
          })
        );
        break;
      }

      case "circuitosFundamentales": {
        if (esDirigido) {
          alert("Los circuitos fundamentales se definen sobre el grafo no dirigido.");
          return;
        }
        const { ramas, cuerdas } = calcularArbolMinimo();
        setRamas(ramas);
        setCuerdas(cuerdas);
        setMostrarArbol(true); // mostrar árbol + cuerdas

        const matrizCF = obtenerMatrizCircuitosFundamentales(ramas, cuerdas);
        matriz = matrizCF;
        titulo = "Matriz de circuitos fundamentales (filas: circuitos, columnas: aristas)";
        setMatrizFilaHeaders(cuerdas.map((_, i) => `CF${i + 1}`));
        setMatrizColHeaders(
          aristas.map((a, idx) => {
            const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
            const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
            return `e${idx + 1}: ${l1}-${l2}`;
          })
        );
        break;
      }


      case "conjuntosCorte": {
        if (esDirigido) {
          alert("La matriz de conjuntos de corte se define sobre el grafo no dirigido.");
          return;
        }
        const { ramas, cuerdas } = calcularArbolMinimo();
        setRamas(ramas);
        setCuerdas(cuerdas);

        const matrizKF = obtenerMatrizCortesFundamentales(ramas, cuerdas);
        matriz = matrizKF;
        titulo = "Matriz de conjuntos de corte (filas: cortes, columnas: aristas)";

        // una fila por corte (una por rama)
        setMatrizFilaHeaders(
          ramas.map((_, i) => `K${i + 1}`)
        );
        setMatrizColHeaders(
          aristas.map((a, idx) => {
            const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
            const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
            return `e${idx + 1}: ${l1}-${l2}`;
          })
        );
        break;
      }

      case "conjuntosCorteFundamentales": {
        if (esDirigido) {
          alert("Los cortes fundamentales se definen sobre el grafo no dirigido.");
          return;
        }
        const { ramas, cuerdas } = calcularArbolMinimo();
        setRamas(ramas);
        setCuerdas(cuerdas);
        setMostrarArbol(true); // mostrar árbol + cuerdas

        const matrizKF = obtenerMatrizCortesFundamentales(ramas, cuerdas);
        matriz = matrizKF;
        titulo = "Matriz de cortes fundamentales (filas: cortes, columnas: aristas)";
        setMatrizFilaHeaders(ramas.map((_, i) => `KF${i + 1}`));
        setMatrizColHeaders(
          aristas.map((a, idx) => {
            const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
            const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
            return `e${idx + 1}: ${l1}-${l2}`;
          })
        );
        break;
      }

        break;
      default:
        break;
    }

    if (matriz) {
      setMatrizDatos(matriz);
      setMatrizTitulo(titulo);
      setMatrizVisible(opcion);
    }

  };

  const renderSVGGraph = (vs = vertices, es = aristas, width = 520, height = 420) => {
    const map = new Map();
    const idsRamas = new Set(ramas.map((a) => a.id));
    for (const a of es) {
      const k1 = `${a.origen}-${a.destino}`;
      const k2 = `${a.destino}-${a.origen}`;
      const key = a.origen <= a.destino ? k1 : k2;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    }
    const grupos = Array.from(map.entries());
    const strokeColor = "#1d6a96";
    const bgColor = "#e7f0ee";
    const strokeWidth = 3;

    return (
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          border: "2px solid #1d6a96",
          borderRadius: "8px",
          backgroundColor: bgColor,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {grupos.map(([key, grupo]) => {
          const groupSize = grupo.length;
          const midIndex = (groupSize - 1) / 2;
          const ordered = grupo
            .map((a, i) => ({ a, i }))
            .sort((p, q) => Math.abs(q.i - midIndex) - Math.abs(p.i - midIndex));
          return ordered.map(({ a: arista, i: idx }) => {
            const v1 = vs[arista.origen];
            const v2 = vs[arista.destino];
            if (!v1 || !v2) return null;
            const esRama = idsRamas.has(arista.id);
            const strokeColor = esRama ? "#1d6a96" : "#c0392b";
            const strokeWidth = esRama ? 4 : 2;

            // bucles
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
                  <path
                    d={path}
                    stroke={strokeColor}
                    strokeWidth={4}
                    fill="none"
                  />
                  <text
                    x={pesoX}
                    y={pesoY}
                    fill="#000"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                    dy="0.8em"
                  >
                    {arista.peso}
                  </text>
                </g>
              );
            }

            // ... después del bloque de bucles

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
            for (const other of vs) {
              if (other.id === v1.id || other.id === v2.id) continue;
              const dist = distancePointToSegment(
                other.x,
                other.y,
                x1,
                y1,
                x2,
                y2
              );
              if (dist < collisionRadius) {
                collision = true;
                break;
              }
            }
            if (collision) {
              const direction = ux >= 0 ? 1 : -1;
              offset =
                direction *
                (baseSpacing * 1.8 + Math.sign(offset || 1) * baseSpacing);
            }
            const lengthScale = Math.max(1, len / 150);
            offset = offset * lengthScale;

            const cx = mx + ux * offset;
            const cy = my + uy * offset;
            const t = 0.5;

            const pesoX =
              (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2;
            const pesoY =
              (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2;

            // NUEVO return para arista normal
            return (
              <g key={arista.id}>
                {(() => {
                  // cortamos un hueco alrededor del peso
                  const tPeso = t;
                  const deltaT = 0.06; // tamaño del hueco

                  const t1 = Math.max(0, tPeso - deltaT);
                  const t2 = Math.min(1, tPeso + deltaT);

                  const quadPoint = (tt) => {
                    const x =
                      (1 - tt) * (1 - tt) * x1 +
                      2 * (1 - tt) * tt * cx +
                      tt * tt * x2;
                    const y =
                      (1 - tt) * (1 - tt) * y1 +
                      2 * (1 - tt) * tt * cy +
                      tt * tt * y2;
                    return { x, y };
                  };

                  const pStart = quadPoint(0);
                  const pBefore = quadPoint(t1);
                  const pAfter = quadPoint(t2);
                  const pEnd = quadPoint(1);

                  const path1 = `M ${pStart.x} ${pStart.y} Q ${cx} ${cy} ${pBefore.x} ${pBefore.y}`;
                  const path2 = `M ${pAfter.x} ${pAfter.y} Q ${cx} ${cy} ${pEnd.x} ${pEnd.y}`;

                  return (
                    <>
                      <path
                        d={path1}
                        stroke={strokeColor}
                        strokeWidth={4}   // grosor tramo 1
                        fill="none"
                      />
                      <path
                        d={path2}
                        stroke={strokeColor}
                        strokeWidth={4}   // grosor tramo 2
                        fill="none"
                      />
                    </>
                  );
                })()}

                {arista.dirigida &&
                  (() => {
                    // flecha al final
                    const vx = x2 - x1;
                    const vy = y2 - y1;
                    const vlen = Math.hypot(vx, vy) || 1;
                    const ux2 = vx / vlen;
                    const uy2 = vy / vlen;

                    const arrowSize = 9;
                    const bx = x2 - ux2 * 22;
                    const by = y2 - uy2 * 22;

                    const ax1 =
                      bx + (-ux2 * arrowSize - uy2 * arrowSize * 0.6);
                    const ay1 =
                      by + (-uy2 * arrowSize + ux2 * arrowSize * 0.6);
                    const ax2 =
                      bx + (-ux2 * arrowSize + uy2 * arrowSize * 0.6);
                    const ay2 =
                      by + (-uy2 * arrowSize - ux2 * arrowSize * 0.6);

                    return (
                      <polygon
                        points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`}
                        fill={strokeColor}
                      />
                    );
                  })()}

                <text
                  x={pesoX}
                  y={pesoY}
                  fill="#000"
                  fontSize="12"
                  fontWeight="bold"
                  textAnchor="middle"
                  dy="0.35em"
                >
                  {arista.peso}
                </text>
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
              strokeWidth="3"
              style={{ cursor: "pointer", transition: "all 0.15s" }}
              onMouseDown={(e) => handleMouseDownVertex(e, idx)}
              onClick={(e) => {
                e.stopPropagation();
                handleClickVertice(idx);
              }}
            />
            <text
              x={v.x}
              y={v.y}
              textAnchor="middle"
              dy="0.3em"
              fill="white"
              fontSize="13"
              fontWeight="bold"
              pointerEvents="none"
            >
              {v.etiqueta || `V${idx + 1}`}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  if (fase === "config") {
    return (
      <div className="operaciones-grafos panel">
        <div className="crear-card">
          <div className="crear-header">Configurar Grafo</div>
          <div style={{ padding: 12 }}>
            <div className="campo">
              <label style={{ fontWeight: "bold" }}>Cantidad de vértices:</label>
              <input
                type="number"
                value={numVertices}
                onChange={(e) => setNumVertices(e.target.value)}
                min="1"
                max="12"
                className="input-chico"
              />
            </div>

            <div style={{ height: 1, background: "#c9d6db", margin: "8px 0" }} />

            <div className="campo">
              <label style={{ fontWeight: "bold", display: "block" }}>
                Tipo de etiqueta:
              </label>
              <label>
                <input
                  type="radio"
                  name="tipoId"
                  value="numerico"
                  checked={tipoIdentificador === "numerico"}
                  onChange={(e) => setTipoIdentificador(e.target.value)}
                />{" "}
                Numérico
              </label>
              <label>
                <input
                  type="radio"
                  name="tipoId"
                  value="alfabetico"
                  checked={tipoIdentificador === "alfabetico"}
                  onChange={(e) => setTipoIdentificador(e.target.value)}
                />{" "}
                Alfabético
              </label>
            </div>

            <div style={{ height: 1, background: "#c9d6db", margin: "8px 0" }} />

            <div className="campo">
              <label style={{ fontWeight: "bold", display: "block" }}>
                Tipo de grafo:
              </label>
              <label>
                <input
                  type="radio"
                  name="dirigido"
                  value="no"
                  checked={!esDirigido}
                  onChange={() => setEsDirigido(false)}
                />{" "}
                No dirigido
              </label>
              <label>
                <input
                  type="radio"
                  name="dirigido"
                  value="si"
                  checked={esDirigido}
                  onChange={() => setEsDirigido(true)}
                />{" "}
                Dirigido
              </label>
            </div>

            <button onClick={handleCrearDesdeConfig} className="full-width-btn">
              Continuar
            </button>

            {onBack && (
              <button
                onClick={onBack}
                className="full-width-btn secondary"
                style={{ marginTop: 6 }}
              >
                Volver
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (fase === "etiquetar") {
    return (
      <div className="operaciones-grafos panel">
        <div className="crear-card">
          <div className="crear-header">Asignar etiquetas a Vértices</div>
          <div style={{ padding: 12 }}>
            <p style={{ marginBottom: 10 }}>
              Ingrese una etiqueta única para cada vértice:
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 12,
                maxHeight: 320,
                overflowY: "auto",
              }}
            >
              {vertices.map((v, i) => (
                <div
                  key={v.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <label style={{ minWidth: 60, fontWeight: "bold" }}>
                    V{i + 1}:
                  </label>
                  <input
                    type="text"
                    value={v.etiqueta}
                    onChange={(e) => {
                      const nueva = [...vertices];
                      nueva[i] = { ...nueva[i], etiqueta: e.target.value };
                      setVertices(nueva);
                    }}
                    className="input-clave"
                    placeholder={tipoIdentificador === "numerico" ? "1" : "A"}
                    style={{ flex: 1 }}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handleConfirmarEtiquetas}
              className="full-width-btn"
              style={{ marginTop: 10 }}
            >
              Ir al editor
            </button>

            <button
              onClick={() => setFase("config")}
              className="full-width-btn secondary"
              style={{ marginTop: 6 }}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FASE EDITOR
  return (
    <div className="operaciones-grafos panel">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, color: "#1d6a96" }}>Editor de Grafo</h3>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={esDirigido}
              onChange={(e) => setEsDirigido(e.target.checked)}
            />
            Dirigido
          </label>

          <button className="boton" onClick={() => setFase("config")}>
            Nuevo Grafo
          </button>

          {/* Menú de matrices */}
          <div style={{ position: "relative" }}>
            <button
              className="boton boton_agregar"
              onClick={() => setMenuMatricesAbierto((v) => !v)}
            >
              Matrices ▼
            </button>
            {menuMatricesAbierto && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  marginTop: 4,
                  background: "#e7f0ee",
                  borderRadius: 8,
                  border: "2px solid #1d6a96",
                  minWidth: 260,
                  boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
                  zIndex: 1000,
                }}
              >
                <button
                  className="boton"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => handleMenuOpcion("incidencia")}
                >
                  Matriz de incidencia
                </button>
                <button
                  className="boton"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => handleMenuOpcion("adyacenciaVertices")}
                >
                  Matriz de adyacencia (vértices)
                </button>
                <button
                  className="boton"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => handleMenuOpcion("adyacenciaAristas")}
                >
                  Matriz de adyacencia (aristas)
                </button>
                <button
                  className="boton"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => handleMenuOpcion("matrizCircuitos")}
                >
                  Matriz de circuitos
                </button>
                <button
                  className="boton"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => handleMenuOpcion("circuitosFundamentales")}
                >
                  Circuitos fundamentales
                </button>
                <button
                  className="boton"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() => handleMenuOpcion("conjuntosCorte")}
                >
                  Conjuntos de corte
                </button>
                <button
                  className="boton"
                  style={{ width: "100%", textAlign: "left" }}
                  onClick={() =>
                    handleMenuOpcion("conjuntosCorteFundamentales")
                  }
                >
                  Conjuntos de cortes fundamentales
                </button>
              </div>
            )}
          </div>

          <button className="boton" onClick={exportGrafoObject}>
            📤 Exportar JSON
          </button>
          <button
            className="boton"
            onClick={() => inputFileRef.current && inputFileRef.current.click()}
          >
            📥 Importar JSON
          </button>

          {onBack && (
            <button className="boton" onClick={onBack}>
              ⬅ Volver
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: "1 1 auto" }}>
          {mostrarArbol
            ? renderSVGGraph(vertices, [...ramas, ...cuerdas])
            : renderSVGGraph()}

        </div>
        {mostrarArbol && (ramas.length > 0 || cuerdas.length > 0) && (
          <div
            style={{
              marginTop: 8,
              padding: 8,
              borderRadius: 6,
              background: "#f2f8fa",
              border: "1px solid rgba(34,93,110,0.25)",
              fontSize: 12,
              color: "#123d4a",
            }}
          >
            <div style={{ marginBottom: 4, fontWeight: "bold" }}>
              Árbol y complemento:
            </div>
            <div>
              <strong>Ramas (árbol):</strong>{" "}
              {ramas.length === 0
                ? "ninguna"
                : ramas
                  .map((a, idx) => {
                    const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
                    const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
                    return `e${idx + 1}: ${l1}-${l2}`;
                  })
                  .join(", ")}
            </div>
            <div style={{ marginTop: 4 }}>
              <strong>Cuerdas (complemento):</strong>{" "}
              {cuerdas.length === 0
                ? "ninguna"
                : cuerdas
                  .map((a, idx) => {
                    const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
                    const l2 = vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
                    return `e${idx + 1}: ${l1}-${l2}`;
                  })
                  .join(", ")}
            </div>
          </div>
        )}


        <div style={{ width: 320 }} className="editor-sidebar">
          <div style={{ marginBottom: 8 }}>
            <p
              style={{
                margin: 0,
                fontWeight: "bold",
                color: "#283b42",
              }}
            >
              Aristas ({aristas.length})
            </p>
            <div
              className="bloque"
              style={{
                maxHeight: 240,
                overflowY: "auto",
                paddingTop: 8,
                borderRadius: 6,
              }}
            >
              {aristas.length === 0 ? (
                <p style={{ color: "#666", margin: 8 }}>Ninguna aún</p>
              ) : (
                aristas.map((a) => {
                  const isLoop = a.origen === a.destino;
                  const l1 = vertices[a.origen]?.etiqueta || `V${a.origen + 1}`;
                  const l2 =
                    vertices[a.destino]?.etiqueta || `V${a.destino + 1}`;
                  const label = isLoop
                    ? `${l1} (bucle)`
                    : `${l1} ${a.dirigida ? "→" : "↔"} ${l2}`;
                  return (
                    <div
                      key={a.id}
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                        padding: "6px 8px",
                        background: "#dfeef1",
                        borderRadius: 6,
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          fontWeight: "bold",
                          color: "#283b42",
                        }}
                      >
                        {label}
                      </div>
                      <span>{a.peso}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            <p
              style={{
                margin: 0,
                fontWeight: "bold",
                color: "#283b42",
              }}
            >
              Vértices ({vertices.length})
            </p>
            <div
              className="bloque"
              style={{
                maxHeight: 220,
                overflowY: "auto",
                paddingTop: 8,
                borderRadius: 6,
              }}
            >
              {vertices.map((v, i) => (
                <div
                  key={v.id}
                  style={{
                    padding: "6px 8px",
                    background: "#eef6f8",
                    borderRadius: 6,
                    marginBottom: 6,
                    display: "flex",
                    justifyContent: "space-between",
                  }}
                >
                  <span>
                    V{i + 1}: {v.etiqueta}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <small style={{ color: "#666" }}>
              Clic en un vértice → origen. Luego clic en otro vértice → arista.
              <br />
              Arrastra los vértices dentro del recuadro para reposicionarlos.
            </small>
          </div>
        </div>
      </div>
      {matrizVisible !== "ninguna" && matrizDatos.length > 0 && (
        <div
          className="panel-matriz"
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background: "#eaf4f6",
            border: "1px solid rgba(34,93,110,0.25)",
          }}
        >
          <h4
            style={{
              margin: "0 0 8px 0",
              color: "#1d6a96",
              fontWeight: "bold",
            }}
          >
            {matrizTitulo}
          </h4>
          <div style={{ overflowX: "auto" }}>
            <table
              className="tabla-matriz"
              style={{
                borderCollapse: "collapse",
                width: "100%",
                minWidth: 260,
                background: "#f7fbfc",
              }}
            >
              {matrizColHeaders && matrizColHeaders.length > 0 && (
                <thead>
                  <tr>
                    <th
                      style={{
                        border: "1px solid rgba(34,93,110,0.35)",
                        padding: "4px 8px",
                        textAlign: "center",
                        fontSize: 12,
                        background: "#dfeef1",
                        color: "#123d4a",
                      }}
                    >
                      {/* esquina: filas / columnas */}
                    </th>
                    {matrizColHeaders.map((h, idx) => (
                      <th
                        key={idx}
                        style={{
                          border: "1px solid rgba(34,93,110,0.35)",
                          padding: "4px 8px",
                          textAlign: "center",
                          fontSize: 12,
                          background: "#dfeef1",
                          color: "#123d4a",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {matrizDatos.map((fila, i) => (
                  <tr key={i}>
                    {matrizFilaHeaders && matrizFilaHeaders.length > 0 && (
                      <td
                        style={{
                          border: "1px solid rgba(34,93,110,0.35)",
                          padding: "4px 8px",
                          textAlign: "center",
                          fontSize: 12,
                          background: "#e9f3f5",
                          color: "#123d4a",
                          fontWeight: "bold",
                        }}
                      >
                        {matrizFilaHeaders[i]}
                      </td>
                    )}
                    {fila.map((valor, j) => (
                      <td
                        key={j}
                        style={{
                          border: "1px solid rgba(34,93,110,0.35)",
                          padding: "4px 8px",
                          textAlign: "center",
                          fontSize: 12,
                          color: "#123d4a",
                        }}
                      >
                        {valor}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

          </div>


        </div>)}


      {modalArista && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
          }}
        >
          <div className="modal-arista" style={{ padding: 20, minWidth: 320 }}>
            <h4 style={{ marginTop: 0, color: "#283b42" }}>Configurar arista</h4>
            <p style={{ margin: "6px 0 10px 0" }}>
              <strong>Origen:</strong>{" "}
              {vertices[modalArista.origen]?.etiqueta ||
                `V${modalArista.origen + 1}`}{" "}
              → <strong>Destino:</strong>{" "}
              {vertices[modalArista.destino]?.etiqueta ||
                `V${modalArista.destino + 1}`}
            </p>
            <div>
              <label
                style={{
                  fontWeight: "bold",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Peso
              </label>
              <input
                type="text"
                autoFocus
                value={pesoTemporal}
                onChange={(e) => setPesoTemporal(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleConfirmarArista()}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 6,
                  border: "2px solid #1d6a96",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
                justifyContent: "center",
                marginTop: 14,
              }}
            >
              <button
                className="boton boton_agregar"
                onClick={handleConfirmarArista}
              >
                Confirmar
              </button>
              <button className="boton" onClick={() => setModalArista(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        type="file"
        ref={inputFileRef}
        style={{ display: "none" }}
        accept=".json,application/json"
        onChange={handleCargarJSON}
      />
    </div>
  );
}

export default RepresentacionGrafos;

