// src/externas/HashMod.jsx
import React, { useState, useEffect } from "react";
import "../App.css";
import "../internas/IngresarDatos.css";

export default function HashMod({ onBack }) {
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
  const [cargandoArchivo, setCargandoArchivo] = useState(false);
  const [archivoCargado, setArchivoCargado] = useState(false);

  

  const raiz = Math.ceil(Math.sqrt(tamano));
  const registrosPorBloque = Math.ceil(tamano / raiz);

  // -----------------------------------------------------
  // Generación de área principal
  // -----------------------------------------------------
  const generarAreaPrincipal = () => {
    const bloques = [];
    for (let i = 0; i < raiz; i++) {
      const datos = [];
      for (let j = 0; j < registrosPorBloque; j++) {
        const posReal = i * registrosPorBloque + j + 1;
        if (posReal <= tamano) datos.push({ posicion: posReal, clave: "" });
      }
      bloques.push({ id: i + 1, datos });
    }
    setAreaPrincipal(bloques);
  };

  // -----------------------------------------------------
  // Efecto al cambiar parámetros
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
  // HASH MOD
  // -----------------------------------------------------
  const hash = (c) => Number(c) % tamano;

  // -----------------------------------------------------
  // Insertar
  // -----------------------------------------------------
  const insertar = async () => {
    if (!clave) return alert("Ingrese una clave.");
    if (!/^\d+$/.test(clave)) return alert("Clave numérica.");
    if (String(clave).length !== tamanoClave)
      return alert(`La clave debe tener ${tamanoClave} dígitos.`);
    // --------------------------------------------
    // 🔥 Verificar si la clave YA existe en TODO
    // --------------------------------------------

    // Área principal
    for (const bloque of areaPrincipal) {
      for (const cel of bloque.datos) {
        if (cel.clave === clave) {
          alert("La clave ya existe en el área principal.");
          return;
        }
      }
    }

    // Área secundaria
    if (areaSecundaria.includes(clave)) {
      alert("La clave ya existe en el área secundaria.");
      return;
    }

    // Cubetas
    if (metodoColision === "cubetas") {
      for (const cubeta of cubetas) {
        if (cubeta && cubeta.includes(clave)) {
          alert("La clave ya existe en la cubeta.");
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

    // copia
    const principalCopia = [...areaPrincipal];

    // insertar en área principal si está vacío
    if (principalCopia[bloqueIndex].datos[posLocal].clave === "") {
      principalCopia[bloqueIndex].datos[posLocal].clave = clave;
      setAreaPrincipal(principalCopia);
      setResultado(`Insertada en B${bloqueIndex + 1}, posición ${h + 1}`);
      return;
    }

    // secundaria
    if (metodoColision === "secundaria") {
      const sec = [...areaSecundaria];
      if (sec.includes(clave)) {
        setResultado("La clave ya existe.");
        return;
      }
      sec.push(clave);
      setAreaSecundaria(sec);
      setResultado(`Colisión → enviada a Área Secundaria`);
      return;
    }

    // cubetas
    if (metodoColision === "cubetas") {
      const nuevas = [...cubetas];
      if (!nuevas[bloqueIndex]) nuevas[bloqueIndex] = [];

      if (nuevas[bloqueIndex].includes(clave)) {
        setResultado("La clave ya está en la cubeta.");
        return;
      }

      nuevas[bloqueIndex].push(clave);
      setCubetas(nuevas);
      setResultado(`Colisión → insertada en Cubeta de B${bloqueIndex + 1}`);
      return;
    }
  };

  // -----------------------------------------------------
  // Buscar
  // -----------------------------------------------------
  const buscar = async () => {
    if (!clave) return alert("Ingrese clave.");

    const h = hash(clave);
    const bloqueIndex = Math.floor(h / registrosPorBloque);
    const posLocal = h % registrosPorBloque;

    // 🔥 LIMPIAR TODO ANTES DE ANIMAR
    setBloqueActivo(null);
    setIndiceLocalActivo(null);
    setCubetaIndiceActivo(null);

    await new Promise((r) => setTimeout(r, 50)); // Pequeño delay para refrescar UI

    // Animación inicial en área principal
    setBloqueActivo(bloqueIndex);
    setIndiceLocalActivo(posLocal);

    setTimeout(() => {
      setBloqueActivo(null);
      setIndiceLocalActivo(null);
    }, 600);

    await new Promise((r) => setTimeout(r, 300));

    // Buscar en área principal
    if (areaPrincipal[bloqueIndex]?.datos[posLocal]?.clave === clave) {
      setResultado(`Encontrada en B${bloqueIndex + 1}, posición ${h + 1}`);
      return;
    }

    // Buscar en secundaria
    if (metodoColision === "secundaria") {
      const idxSec = areaSecundaria.indexOf(clave);
      if (idxSec !== -1) {

        // 🔥 Resaltar en secundaria
        setSecundariaIndiceActivo(idxSec);

        setTimeout(() => {
          setSecundariaIndiceActivo(null);
        }, 600);

        setResultado(`Encontrada en Área Secundaria (S${idxSec + 1})`);
        return;
      }
    }

    // Buscar en cubetas
    if (metodoColision === "cubetas") {
      const cubeta = cubetas[bloqueIndex];

      if (Array.isArray(cubeta)) {
        const idxCub = cubeta.indexOf(clave);

        if (idxCub !== -1) {
          // 🔥 RESALTAR SOLO LA POSICIÓN DE CUBETA
          setCubetaIndiceActivo(idxCub);

          setTimeout(() => {
            setCubetaIndiceActivo(null);
          }, 600);

          setResultado(
            `Encontrada en Colisión de B${bloqueIndex + 1}, posición ${idxCub + 1}`
          );
          return;
        }
      }
    }

    setResultado("No encontrada.");
  };


  // -----------------------------------------------------
  // Eliminar
  // -----------------------------------------------------
  const eliminar = () => {
    if (!clave) return;

    const h = hash(clave);
    const bloqueIndex = Math.floor(h / registrosPorBloque);
    const posLocal = h % registrosPorBloque;

    const copia = [...areaPrincipal];
    if (copia[bloqueIndex]?.datos[posLocal].clave === clave) {
      copia[bloqueIndex].datos[posLocal].clave = "";
      setAreaPrincipal(copia);
      setResultado("Eliminada del área principal.");
      return;
    }

    const sec = [...areaSecundaria];
    const idxS = sec.indexOf(clave);
    if (idxS !== -1) {
      sec.splice(idxS, 1);
      setAreaSecundaria(sec);
      setResultado("Eliminada del área secundaria.");
      return;
    }

    if (metodoColision === "cubetas") {
      const cub = [...cubetas];
      const idxC = cub[bloqueIndex]?.indexOf(clave);
      if (idxC !== -1) {
        cub[bloqueIndex].splice(idxC, 1);
        setCubetas(cub);
        setResultado("Eliminada de la cubeta.");
        return;
      }
    }

    setResultado("La clave no existe.");
    setCubetaIndiceActivo(null);
  };

  // -----------------------------------------------------
  // FILTRAR CELDAS DEL BLOQUE
  // -----------------------------------------------------
  const filtrarCeldas = (datos) => {
    const primera = 0;
    const ultima = datos.length - 1;
    const ocupadas = datos
      .map((d, i) => (d.clave !== "" ? i : null))
      .filter(i => i !== null);

    const indices = [...new Set([primera, ultima, ...ocupadas])]
      .sort((a, b) => a - b);

    return indices.map(i => datos[i]);
  };

  // -----------------------------------------------------
  // FILTRAR CUBETAS
  // -----------------------------------------------------
  const filtrarCubetas = (arr) => {
    if (!Array.isArray(arr) || arr.length === 0) return [];

    const primera = 0;
    const ultima = arr.length - 1;
    const ocupadas = arr
      .map((c, i) => (c.length > 0 ? i : null))
      .filter(i => i !== null);

    const indices = [...new Set([primera, ultima, ...ocupadas])]
      .sort((a, b) => a - b);

    return indices.map(i => ({ index: i, valores: arr[i] }));
  };

  // -----------------------------------------------------
  // Mostrar solo bloques necesarios:
  // Primer bloque, último bloque o bloque con datos
  // -----------------------------------------------------
  const debeMostrarBloque = (i) => {
    const cub = filtrarCubetas(cubetas).find(c => c.index === i);
    const datosOcupados = areaPrincipal[i].datos.some(d => d.clave !== "");
    return i === 0 || i === areaPrincipal.length - 1 || datosOcupados || cub;
  };

  // -----------------------------------------------------
  // Render
  // -----------------------------------------------------
  const parametrosCompletos =
    tamano > 0 &&
    tamanoClave > 0 &&
    metodoColision !== "" &&
    !isNaN(tamano) &&
    !isNaN(tamanoClave);
  // ---------- GUARDAR ----------
  const guardarArchivo = () => {
    const nombre = prompt("Nombre del archivo (sin extensión):");
    if (!nombre) return;

    // Preparamos un objeto sencillo y serializable que contiene todo lo importante
    const data = {
      tamano,
      tamanoClave,
      metodoColision,
      areaPrincipal,
      cubetas,
      areaSecundaria,
      // opcional: resultado, timestamps, etc.
      fecha: new Date().toISOString()
    };

    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });

      // crear link invisible y forzar descarga
      const a = document.createElement("a");
      const url = URL.createObjectURL(blob);
      a.href = url;
      a.download = `${nombre}.json`;

      // algunos navegadores requieren que el link esté en el DOM
      document.body.appendChild(a);
      a.click();
      a.remove();

      // liberar URL
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      setResultado("📁 Archivo preparado para descarga.");
    } catch (err) {
      console.error(err);
      alert("Error al crear el archivo.");
    }
  };

  // ---------- CARGAR ----------
  const cargarArchivo = (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
  
    // 🔥 MUY IMPORTANTE: bloquear el useEffect
    setCargandoArchivo(true);
  
    const lector = new FileReader();
    lector.onload = (evento) => {
      try {
        const data = JSON.parse(evento.target.result);
  
        setTamano(data.tamano ?? 0);
        setTamanoClave(data.tamanoClave ?? 0);
        setMetodoColision(data.metodoColision ?? "secundaria");
  
        setAreaPrincipal(data.areaPrincipal ?? []);
        setCubetas(data.cubetas ?? []);
        setAreaSecundaria(data.areaSecundaria ?? []);
  
        setResultado("📂 Archivo cargado correctamente.");
      } catch (err) {
        alert("Error al cargar archivo.");
      } finally {
        setCargandoArchivo(false); // 🔥 liberar bloqueo
        e.target.value = "";
        setArchivoInputKey(Date.now());
      }
    };
  
    lector.readAsText(archivo);
  };
  

  return (
    <div className="contenedor-hash contenedor-secuencial">
      <h3>Hash MOD — Mejorado Completo</h3>

      {/* Parámetros */}
      <div className="opciones">
        <div className="campo">
          <label>Tamaño (n):</label>
          <input
            type="number"
            min="4"
            value={tamano}
            onChange={e => setTamano(Number(e.target.value) || 0)}
          />
        </div>

        <div className="campo">
          <label>Tamaño clave:</label>
          <input
            type="number"
            min="1"
            value={tamanoClave}
            onChange={e => setTamanoClave(Number(e.target.value) || 0)}
          />
        </div>

        <div className="campo">
          <label>Método:</label>
          <select
            value={metodoColision}
            onChange={e => setMetodoColision(e.target.value)}
          >
            <option >Seleccionar Método</option>
            <option value="secundaria">Área Secundaria</option>
            <option value="cubetas">Cubetas por Bloque</option>
          </select>
        </div>
      </div>

      {/* Controles */}
      {parametrosCompletos && (
        <div className="panel-controles">
          <label>Clave:</label>
          <input value={clave} onChange={e => setClave(e.target.value)} />

          <button onClick={insertar} className="botonr"> ➕ Insertar</button>
          <button onClick={buscar} className="boton"> 🔍 Buscar</button>
          <button onClick={eliminar} className="boton"> ✖️  Eliminar</button>

          <button
            onClick={() => {
              generarAreaPrincipal();
              setAreaSecundaria([]);
              setTamano("");
              setTamanoClave("");
              setMetodoColision("");
              setCubetas(metodoColision === "cubetas"
                ? Array(raiz).fill(null).map(() => [])
                : []);
              setResultado("");
            }}
            className="boton"
          >
            ♻ Vaciar
          </button>
        </div>
      )}

      {resultado && <p className="resultado">{resultado}</p>}

      {/* ZONAS */}
      {parametrosCompletos ? (
        <div className="zonas">
          <div className="area-izquierda scroll-horizontal">
            <div className="bloques-container bloques-horizontal">

              {areaPrincipal.map((bq, i) => {
                if (!debeMostrarBloque(i)) return null;

                const cubetaFiltrada = filtrarCubetas(cubetas).find(c => c.index === i);

                return (
                  <div key={i} className="bloque">
                    <h4 className="titulo-bloque">B{i + 1}</h4>

                    <table className="tabla-bloque">
                      <thead>
                        <tr><th>#</th><th>Clave</th></tr>
                      </thead>
                      <tbody>
                        {filtrarCeldas(bq.datos).map((celda, j) => (
                          <tr
                            key={j}
                            className={
                              i === bloqueActivo &&
                                celda.posicion - 1 === i * registrosPorBloque + indiceLocalActivo
                                ? "resaltado"
                                : ""
                            }
                          >
                            <td>{celda.posicion}</td>
                            <td>{celda.clave || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Cubetas */}
                    {metodoColision === "cubetas" && (
                      <div style={{ marginTop: 10 }}>
                        <div className="titulo-bloque" style={{ fontSize: 13 }}>
                          Colisión B{i + 1}
                        </div>

                        <table className="tabla-bloque">
                          <thead><tr><th>#</th><th>Clave</th></tr></thead>
                          <tbody>
                            {cubetaFiltrada && cubetaFiltrada.valores.length > 0 ? (
                              cubetaFiltrada.valores.map((c, k) => (
                                <tr
                                  key={k}
                                  className={k === cubetaIndiceActivo ? "resaltado" : ""}
                                >
                                  <td>{k + 1}</td>
                                  <td>{c}</td>
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
                  {areaSecundaria.length === 0 ? (
                    <tr><td colSpan="2">Vacía</td></tr>
                  ) : (
                    areaSecundaria.map((c, i) => (
                      <tr
                        key={i}
                        className={secundariaIndiceActivo === i ? "resaltado" : ""}
                      >
                        <td>S{i + 1}</td>
                        <td>{c}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <p style={{ marginTop: 20, fontStyle: "italic" }}>
          Configure los parámetros para mostrar la estructura.
        </p>
      )}
      <div className="panel-archivos" style={{ marginTop: 15 }}>
        <button className="boton" onClick={guardarArchivo}>💾 Guardar</button>

        <label className="boton">
          📂 Cargar
          <input
            type="file"
            key={archivoInputKey}
            accept=".json"
            onChange={cargarArchivo}
            style={{ display: "none" }}
          />
        </label>
      </div>


      <div style={{ marginTop: 12 }}>
        <button onClick={onBack} className="boton"> ⬅ Volver</button>
      </div>
    </div>
  );
}
