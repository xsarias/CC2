import { useState } from "react";
import HashModEx from "./HashModEx";
import HashCuadradoEx from "./HashCuadradoEx"
import HashTruncamientoEx from "./HashTruncEx"
import HashPlegamiento from "./HashPlegamiento";
import "../App.css";



function HashEx({ onBack }) {
    const [opcion, setOpcion] = useState(null);

    // volver al menú de hash
    const volverMenu = () => setOpcion(null);

    return (
        <div className="contenedor-hash">
            <h2>Búsquedas Hash</h2>

            {!opcion && (
                <div>
                    <p>Selecciona una función hash:</p>

                    <button onClick={() => setOpcion("mod")} className="botones">
                        Función HashMOD
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("cuadrado")} className="botones">
                        Función del HashCuadrado
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("truncamiento")} className="botones">
                        Función de HashTruncamiento
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("plegamiento")} className="botones">
                        Función de HashPlegamiento
                    </button>
                    <br></br>
                    <br></br>
                    <div style={{ marginTop: "15px" }}>
                        <button onClick={onBack} className="boton">⬅ Volver</button>
                    </div>
                </div>
            )}

            {opcion === "mod" && <HashModEx onBack={volverMenu} />}
            {opcion === "cuadrado" && <HashCuadradoEx onBack={volverMenu} />}
            {opcion === "truncamiento" && <HashTruncamientoEx onBack={volverMenu} />}
            {opcion === "plegamiento" && <HashPlegamiento onBack={volverMenu} />}
        </div>
    );
}

export default HashEx;
