import { useState } from "react";
import HashModEx from "./HashModEx";
/*import HashCuadradoEx from "./HashCuadradoEx";
import HashTruncamientoEx from "./HashTruncamientoEx";
import HashPlegamientoEx from "./HashPlegamientoEx";*/
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
                        Función MOD
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("")} className="botones">
                        Función del Cuadrado
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("")} className="botones">
                        Función de Truncamiento
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("")} className="botones">
                        Función de Plegamiento
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
            {opcion === "plegamiento" && <HashPlegamientoEx onBack={volverMenu} />}
        </div>
    );
}

export default HashEx;
