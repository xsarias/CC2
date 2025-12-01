import React, { useState, useEffect } from "react";
import "../App.css";
import "../internas/IngresarDatos.css";

export default function BinariaEx({ onDataChange, onBack }) {
    const [registros, setRegistros] = useState([]);
    const [clave, setClave] = useState("");
    const [tamano, setTamano] = useState(16);
    const [tamanoClave, setTamanoClave] = useState(4);
    const [bloques, setBloques] = useState([]);
    const [resultado, setResultado] = useState("");
    const [ultimoInsertado, setUltimoInsertado] = useState(null);
    const [bloqueActivo, setBloqueActivo] = useState(null);
    const [indiceActivo, setIndiceActivo] = useState(null);
    const limitesBloques = React.useMemo(() => {
        const raiz = Math.ceil(Math.sqrt(tamano));
        const regsPorBloque = Math.ceil(tamano / raiz);
        const limites = [];

        for (let i = 1; i <= raiz; i++) {
            limites.push(i * regsPorBloque);
        }

        return limites;
    }, [tamano]);


    // --- Genera los bloques dinámicamente ---
    useEffect(() => {
        generarBloques();
    }, [tamano, registros]);

    const generarBloques = () => {
        const raiz = Math.ceil(Math.sqrt(tamano));
        const regsPorBloque = Math.ceil(tamano / raiz);

        const nuevosBloques = [];
        let ri = 0; // índice de registros ordenados

        for (let b = 0; b < raiz; b++) {
            const datos = [];
            const inicio = b * regsPorBloque + 1;
            const fin = Math.min((b + 1) * regsPorBloque, tamano);

            // Insertar todos los registros que existan dentro de este bloque
            for (let pos = inicio; pos <= fin && ri < registros.length; pos++) {
                datos.push({ posicion: pos, clave: registros[ri] });
                ri++;
            }

            // Ahora control visual:
            if (datos.length === 0) {
                // Bloque vacío → mostrar solo la última posición
                datos.push({ posicion: fin, clave: "" });

            } else if (datos.length < (fin - inicio + 1)) {
                // Hay registros pero el bloque aún no está lleno → mostrar la siguiente posición vacía
                const siguientePos = inicio + datos.length;
                datos.push({ posicion: siguientePos, clave: "" });
            }

            nuevosBloques.push({ id: b + 1, datos });
        }

        setBloques(nuevosBloques);
    };



    // --- Insertar ordenadamente ---
    const insertar = () => {
        if (!clave) return alert("Ingrese una clave numérica.");
        if (!/^\d+$/.test(clave)) return alert("La clave debe ser numérica.");
        if (clave.length !== tamanoClave)
            return alert(`La clave debe tener ${tamanoClave} dígitos.`);
        if (registros.includes(clave)) return alert("La clave ya existe.");

        const nuevos = [...registros, clave].sort((a, b) => Number(a) - Number(b));
        setRegistros(nuevos);
        setClave("");
        setResultado(`✅ Clave ${clave} insertada correctamente.`);
        setUltimoInsertado(clave);
        setTimeout(() => setUltimoInsertado(null), 1000);
        if (onDataChange) onDataChange(nuevos);
    };

    // --- Búsqueda binaria ---
    const buscarBinaria = (arr, claveBuscada) => {
        let inicio = 0;
        let fin = arr.length - 1;
        while (inicio <= fin) {
            const medio = Math.floor((inicio + fin) / 2);
            const valorMedio = Number(arr[medio]);
            const valorClave = Number(claveBuscada);

            if (valorMedio === valorClave) return medio;
            if (valorMedio < valorClave) inicio = medio + 1;
            else fin = medio - 1;
        }
        return -1;
    };

    const buscar = async () => {
        if (!clave) return alert("Ingrese una clave a buscar.");
        if (!registros.length) return alert("No hay registros cargados.");

        const claveNum = Number(clave);
        const raiz = Math.ceil(Math.sqrt(tamano));
        const regsPorBloque = Math.ceil(tamano / raiz);

        let izquierda = 0;
        let derecha = raiz - 1;

        // helper: encuentra el índice del bloque no vacío más cercano a `idx`
        const encontrarBloqueNoVacioCercano = (idx) => {
            // si el propio tiene datos, devolverlo
            if ((bloques[idx]?.datos || []).some(d => d.clave && d.clave !== "")) return idx;

            for (let offset = 1; offset <= Math.max(idx, raiz - 1 - idx); offset++) {
                const iz = idx - offset;
                const dr = idx + offset;

                // preferencia por la izquierda si ambos existen
                if (iz >= 0 && (bloques[iz]?.datos || []).some(d => d.clave && d.clave !== "")) return iz;
                if (dr <= raiz - 1 && (bloques[dr]?.datos || []).some(d => d.clave && d.clave !== "")) return dr;
            }
            return null; // todos vacíos
        };

        while (izquierda <= derecha) {
            const medio = Math.floor((izquierda + derecha) / 2);

            // buscamos el bloque no vacío más cercano al medio
            let bloqueParaExaminar = encontrarBloqueNoVacioCercano(medio);

            // si no hay ningún bloque con datos -> terminar
            if (bloqueParaExaminar === null) {
                setResultado(`❌ Clave ${clave} no encontrada.`);
                setBloqueActivo(null);
                setIndiceActivo(null);
                return;
            }

            // animación: marcar bloque que vamos a examinar
            setBloqueActivo(bloqueParaExaminar);
            setIndiceActivo(null);
            await new Promise(res => setTimeout(res, 500));

            // extraer claves reales del bloque actual (orden natural por construcción)
            const clavesBloque = (bloques[bloqueParaExaminar].datos || [])
                .map(d => d.clave)
                .filter(c => c !== "" && c !== undefined && c !== null)
                .map(Number);

            if (clavesBloque.length === 0) {
                // improbable porque ya buscó no-vacio; por seguridad saltamos
                if (bloqueParaExaminar <= medio) izquierda = medio + 1;
                else derecha = medio - 1;
                continue;
            }

            // --- BÚSQUEDA BINARIA INTERNA EN EL BLOQUE ---
            let l = 0;
            let r = clavesBloque.length - 1;
            let encontradoInterno = false;

            while (l <= r) {
                const m = Math.floor((l + r) / 2);

                // resaltar la posición visual correspondiente (posicion - 1 es índice global)
                const celda = bloques[bloqueParaExaminar].datos[m];
                if (celda && celda.posicion != null) {
                    setIndiceActivo(celda.posicion - 1);
                } else {
                    setIndiceActivo(null);
                }
                // animación de comparación
                await new Promise(res => setTimeout(res, 500));

                const valor = clavesBloque[m];

                if (valor === claveNum) {
                    // posición visual dentro de la tabla
                    const posicionReal = bloques[bloqueParaExaminar].datos[m].posicion;
                    setResultado(`✅ Clave ${clave} encontrada:
➡ Bloque: B${bloqueParaExaminar + 1}
➡ Posición: ${posicionReal}`);
                    // dejar resalte un momento y limpiar
                    setBloqueActivo(bloqueParaExaminar);
                    setIndiceActivo(bloques[bloqueParaExaminar].datos[m].posicion - 1);
                    await new Promise(res => setTimeout(res, 600));
                    setBloqueActivo(null);
                    setIndiceActivo(null);
                    return;
                }

                if (valor < claveNum) l = m + 1;
                else r = m - 1;
            }

            // no se encontró dentro del bloque: decidir siguiente bloque según límites reales
            const primero = clavesBloque[0];
            const ultimo = clavesBloque[clavesBloque.length - 1];

            if (claveNum < primero) {
                // la clave está antes de este bloque → descartamos bloques >= bloqueParaExaminar
                derecha = bloqueParaExaminar - 1;
            } else if (claveNum > ultimo) {
                // la clave está después → descartamos bloques <= bloqueParaExaminar
                izquierda = bloqueParaExaminar + 1;
            } else {
                // si está entre primero y ultimo pero no se halló (caso raro) → terminar diciendo no existe
                setResultado(`❌ Clave ${clave} no encontrada (dentro del rango de B${bloqueParaExaminar + 1} pero no existe).`);
                setBloqueActivo(null);
                setIndiceActivo(null);
                return;
            }

            // pequeña pausa antes de la siguiente iteración para que se note el movimiento
            await new Promise(res => setTimeout(res, 200));
        }

        // si terminamos el ciclo, no encontrada
        setResultado(`❌ Clave ${clave} no encontrada.`);
        setBloqueActivo(null);
        setIndiceActivo(null);
    };





    // --- Eliminar ---
    const eliminar = () => {
        if (!clave) return alert("Ingrese una clave a eliminar.");
        const nuevos = registros.filter((x) => x !== clave);
        if (nuevos.length === registros.length) return alert("La clave no existe.");
        setRegistros(nuevos);
        setResultado(`🗑 Clave ${clave} eliminada.`);
        setClave("");
    };

    // --- Vaciar ---
    const vaciar = () => {
        setRegistros([]);
        setResultado("Tabla vaciada.");
    };

    // --- Guardar / Cargar ---
    const guardarArchivo = () => {
        const nombre = prompt("Nombre del archivo (sin extensión):");
        if (!nombre) return;
        const data = { tamano, tamanoClave, registros };
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
                setTamano(Number(data.tamano) || 16);
                setTamanoClave(Number(data.tamanoClave) || 4);
                setRegistros(data.registros || []);
            } catch {
                alert("Archivo inválido.");
            }
        };
        reader.readAsText(f);
        e.target.value = "";
    };

    // --- Renderizado de los bloques ---
    const renderBloques = () => (
        <div className="bloques-container">
            {bloques.map((bloque) => (
                <div key={bloque.id} className="bloque">
                    <h4>B{bloque.id}</h4>
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Clave</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bloque.datos.map((celda, i) => (
                                <tr
                                    key={i}
                                    className={
                                        (bloque.id - 1 === bloqueActivo && celda.posicion - 1 === indiceActivo)
                                            ? "resaltado"
                                            : (celda.clave === ultimoInsertado ? "nueva-fila" : "")
                                    }
                                >

                                    <td>{celda.posicion || "-"}</td>
                                    <td>{celda.clave || "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );



    return (
        <div className="contenedor-hash">
            <h3>Búsqueda Binaria Externa</h3>

            <div className="opciones">
                <div className="campo">
                    <label>Número total de registros (n):</label>
                    <input
                        type="number"
                        min="4"
                        value={tamano}
                        onChange={(e) => setTamano(Number(e.target.value))}
                    />
                </div>

                <div className="campo">
                    <label>Tamaño de la clave (dígitos):</label>
                    <input
                        type="number"
                        min="1"
                        value={tamanoClave}
                        onChange={(e) => setTamanoClave(Number(e.target.value))}
                    />
                </div>
            </div>

            <div className="panel-controles">
                <label>Clave:</label>
                <input
                    type="text"
                    value={clave}
                    onChange={(e) => setClave(e.target.value)}
                    placeholder={`Ej: ${"1".repeat(tamanoClave || 4)}`}
                />
                <button onClick={insertar} className="boton_agregar">➕ Insertar</button>
                <button onClick={buscar} className="boton">🔍 Buscar</button>
                <button onClick={eliminar} className="boton eliminar">✖️ Eliminar</button>
                <button onClick={vaciar} className="boton">♻ Vaciar</button>
            </div>

            {resultado && <p className="resultado">{resultado}</p>}

            {renderBloques()}

            <div className="botones-archivo">
                <br></br>
                <button onClick={guardarArchivo} className="boton">💾 Guardar</button>
                <label className="boton">
                    📂 Cargar
                    <input
                        type="file"
                        accept=".json"
                        onChange={cargarArchivo}
                        style={{ display: "none" }}
                    />
                </label>
                <button onClick={() => onBack && onBack()} className="boton">⬅ Volver</button>
            </div>
        </div>
    );
}
