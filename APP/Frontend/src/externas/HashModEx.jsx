import React, { useState, useEffect } from "react";
import "../App.css";
import "../internas/IngresarDatos.css";

export default function HashMod({ onBack }) {
    const [tamano, setTamano] = useState(16);
    const [tamanoClave, setTamanoClave] = useState(4);
    const [clave, setClave] = useState("");

    const [metodoColision, setMetodoColision] = useState("secundaria");

    const [areaPrincipal, setAreaPrincipal] = useState([]);
    const [areaSecundaria, setAreaSecundaria] = useState([]);
    const [overflow, setOverflow] = useState([]);

    const [bloqueActivo, setBloqueActivo] = useState(null);
    const [indiceLocalActivo, setIndiceLocalActivo] = useState(null);
    const [resultado, setResultado] = useState("");

    const raiz = Math.ceil(Math.sqrt(tamano));
    const registrosPorBloque = Math.ceil(tamano / raiz);

    // -------------------------------------------------------
    // GENERAR BLOQUES PRINCIPALES
    // -------------------------------------------------------
    const generarAreaPrincipal = () => {
        const bloques = [];

        for (let i = 0; i < raiz; i++) {
            const datos = [];
            for (let j = 0; j < registrosPorBloque; j++) {
                const posicionReal = i * registrosPorBloque + j + 1;
                if (posicionReal <= tamano) {
                    datos.push({ posicion: posicionReal, clave: "" });
                }
            }
            bloques.push({ id: i + 1, datos });
        }

        setAreaPrincipal(bloques);
    };

    useEffect(() => {
        generarAreaPrincipal();
        setAreaSecundaria(Array(raiz).fill(""));
        setOverflow([]);
    }, [tamano]);

    // -------------------------------------------------------
    // HASH MOD
    // -------------------------------------------------------
    const hash = (clave) => Number(clave) % tamano;

    // -------------------------------------------------------
    // INSERTAR
    // -------------------------------------------------------
    const insertar = async () => {
        if (!clave) return alert("Ingrese una clave.");
        if (!/^\d+$/.test(clave)) return alert("Clave numérica.");
        if (clave.length !== tamanoClave) return alert(`La clave debe tener ${tamanoClave} dígitos.`);

        const h = hash(clave);
        const bloqueIndex = Math.floor(h / registrosPorBloque);
        const posLocal = h % registrosPorBloque;

        // Animación
        setBloqueActivo(bloqueIndex);
        setIndiceLocalActivo(posLocal);
        await new Promise((res) => setTimeout(res, 400));

        // ¿Libre en principal?
        if (areaPrincipal[bloqueIndex].datos[posLocal]?.clave === "") {
            const nuevo = [...areaPrincipal];
            nuevo[bloqueIndex].datos[posLocal].clave = clave;
            setAreaPrincipal(nuevo);

            setResultado(`Insertada en B${bloqueIndex + 1}, posición ${h + 1}`);
            return;
        }

        // COLISIÓN - área secundaria
        if (metodoColision === "secundaria") {
            const nuevaSec = [...areaSecundaria];
            const idxLibre = nuevaSec.findIndex(x => x === "");

            if (idxLibre === -1) {
                setResultado("Área secundaria llena.");
                return;
            }

            nuevaSec[idxLibre] = clave;
            setAreaSecundaria(nuevaSec);
            setResultado(`Colisión → insertada en S${idxLibre + 1}`);
            return;
        }

        // COLISIÓN - overflow
        if (metodoColision === "bloques") {
            const nuevoOv = [...overflow, { clave }];
            setOverflow(nuevoOv);
            setResultado(`Colisión → insertada en Overflow O${nuevoOv.length}`);
            return;
        }
    };

    // -------------------------------------------------------
    // BUSCAR
    // -------------------------------------------------------
    const buscar = async () => {
        if (!clave) return alert("Ingrese clave.");

        const h = hash(clave);
        const bloqueIndex = Math.floor(h / registrosPorBloque);
        const posLocal = h % registrosPorBloque;

        // animación
        setBloqueActivo(bloqueIndex);
        setIndiceLocalActivo(posLocal);
        await new Promise(res => setTimeout(res, 400));

        // principal
        if (areaPrincipal[bloqueIndex].datos[posLocal]?.clave === clave) {
            setResultado(`Encontrada en B${bloqueIndex + 1}, posición ${h + 1}`);
            return;
        }

        // secundaria
        if (metodoColision === "secundaria") {
            const idx = areaSecundaria.indexOf(clave);
            if (idx !== -1) {
                setResultado(`Encontrada en S${idx + 1}`);
                return;
            }
        }

        // overflow
        if (metodoColision === "bloques") {
            const idx = overflow.findIndex((x) => x.clave === clave);
            if (idx !== -1) {
                setResultado(`Encontrada en Overflow O${idx + 1}`);
                return;
            }
        }

        setResultado("No encontrada.");
    };

    // -------------------------------------------------------
    // ELIMINAR
    // -------------------------------------------------------
    const eliminar = () => {
        if (!clave) return;

        const h = hash(clave);
        const bloqueIndex = Math.floor(h / registrosPorBloque);
        const posLocal = h % registrosPorBloque;

        // principal
        const nuevo = [...areaPrincipal];
        if (nuevo[bloqueIndex].datos[posLocal]?.clave === clave) {
            nuevo[bloqueIndex].datos[posLocal].clave = "";
            setAreaPrincipal(nuevo);
            setResultado("Eliminada del área principal.");
            return;
        }

        // secundaria
        const sec = [...areaSecundaria];
        const idx = sec.indexOf(clave);
        if (idx !== -1) {
            sec[idx] = "";
            setAreaSecundaria(sec);
            setResultado("Eliminada del área secundaria.");
            return;
        }

        // overflow
        const ov = [...overflow];
        const idxOv = ov.findIndex((x) => x.clave === clave);
        if (idxOv !== -1) {
            ov.splice(idxOv, 1);
            setOverflow(ov);
            setResultado("Eliminada del Overflow.");
            return;
        }

        setResultado("La clave no existe.");
    };

    // -------------------------------------------------------
    // RENDER BLOQUES (CON LOS MISMOS ESTILOS DE TU APP)
    // -------------------------------------------------------
    const renderBloques = () => (
        <div className="zonas">
            <div className="area-izquierda">
                <div className="bloques-container">
                    {areaPrincipal.map((bloque, i) => (
                        <div key={i} className="bloque">
                            <h4>B{i + 1}</h4>
                            <table>
                                <thead>
                                    <tr><th>#</th><th>Clave</th></tr>
                                </thead>
                                <tbody>
                                    {bloque.datos.map((celda, j) => (
                                        <tr key={j}
                                            className={
                                                (i === bloqueActivo && j === indiceLocalActivo)
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
                        </div>
                    ))}
                </div>
            </div>

            <div className="area-derecha">
                {metodoColision === "secundaria" && (
                    <div className="bloque">
                        <h4>Área Secundaria</h4>
                        <table>
                            <thead>
                                <tr><th>#</th><th>Clave</th></tr>
                            </thead>
                            <tbody>
                                {areaSecundaria.map((c, i) => (
                                    <tr key={i}><td>S{i + 1}</td><td>{c || "-"}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {metodoColision === "bloques" && (
                    <div className="bloque">
                        <h4>Overflow</h4>
                        <table>
                            <thead>
                                <tr><th>#</th><th>Clave</th></tr>
                            </thead>
                            <tbody>
                                {overflow.map((obj, i) => (
                                    <tr key={i}><td>O{i + 1}</td><td>{obj.clave}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    // -------------------------------------------------------
    return (
        <div className="contenedor-hash">
            <h3>Hash MOD con Bloques</h3>

            <div className="opciones">
                <div className="campo">
                    <label>Tamaño (n):</label>
                    <input type="number" min="4" value={tamano} onChange={e => setTamano(Number(e.target.value))} />
                </div>

                <div className="campo">
                    <label>Tamaño clave:</label>
                    <input type="number" min="1" value={tamanoClave} onChange={e => setTamanoClave(Number(e.target.value))} />
                </div>

                <div className="campo">
                    <label>Método de colisión:</label>
                    <select value={metodoColision} onChange={e => setMetodoColision(e.target.value)}>
                        <option value="secundaria">Área Secundaria</option>
                        <option value="bloques">Overflow</option>
                    </select>
                </div>
            </div>

            <div className="panel-controles">
                <label>Clave:</label>
                <input value={clave} onChange={e => setClave(e.target.value)} />

                <button onClick={insertar} className="boton_agregar">➕ Insertar</button>
                <button onClick={buscar} className="boton">🔍 Buscar</button>
                <button onClick={eliminar} className="boton eliminar">✖ Eliminar</button>
                <button
                    onClick={() => { generarAreaPrincipal(); setAreaSecundaria(Array(raiz).fill("")); setOverflow([]); }}
                    className="boton"
                >
                    ♻ Vaciar
                </button>
            </div>

            {resultado && <p className="resultado">{resultado}</p>}

            {renderBloques()}

            <button onClick={onBack} className="boton">⬅ Volver</button>
        </div>
    );
}
