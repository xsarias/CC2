import { useState } from "react";
import "./RepresentacionGrafos.css";

function RepresentacionGrafos({ onBack }) {
  const [representacion, setRepresentacion] = useState(null);

  return (
    <div className="representacion-grafos-contenedor">
      <h2>Representación de la Información con Grafos</h2>
      
      <div className="contenido">
        <p>Aquí irá la representación de la información con grafos (matriz de adyacencia, lista de adyacencia, etc.)</p>
      </div>
      <br></br>
      <button className="botones" onClick={onBack}>
        ⬅ Volver
      </button>
    </div>
  );
}

export default RepresentacionGrafos;
