import { useState } from "react";
import HashMod from "./HashMod";
import HashCuadrado from "./HashCuadrado";
import HashTruncamiento from "./HashTruncamiento";
//import HashPlegamiento from "./HashPlegamiento";

function Hash({ onBack }) {
    const [opcion, setOpcion] = useState(null);

    // volver al menú de hash
    const volverMenu = () => setOpcion(null);

    return (
        <div className="contenedor">
            <h2>🔎 Búsquedas Hash</h2>

            {!opcion && (
                <div>
                    <p>Selecciona una función hash:</p>

                    <button onClick={() => setOpcion("mod")} className="boton">
                        ➗ Función MOD
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("cuadrado")} className="boton">
                        🟦 Función del Cuadrado
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("truncamiento")} className="boton">
                        ✂️ Función de Truncamiento
                    </button>
                    <br></br>
                    <br></br>
                    <button onClick={() => setOpcion("plegamiento")} className="boton">
                        📐 Función de Plegamiento
                    </button>
                    <br></br>
                    <br></br>
                    <div style={{ marginTop: "15px" }}>
                        <button onClick={onBack} className="boton">⬅ Volver</button>
                    </div>
                </div>
            )}

            {opcion === "mod" && <HashMod onBack={volverMenu} />}
            {opcion === "cuadrado" && <HashCuadrado onBack={volverMenu} />}
            {opcion === "truncamiento" && <HashTruncamiento onBack={volverMenu} />}
            {opcion === "plegamiento" && <HashPlegamiento onBack={volverMenu} />}
        </div>
    );
}

export default Hash;
