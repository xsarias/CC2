function Grafos({ onSelect }) {
  return (
    <div className="busqueda-contenedor">
      <h2>Seleccionar operación con grafos</h2>

      <div className="grupo-botones">
        <button onClick={() => onSelect("operaciones_grafos")} className="botones">Operaciones con Grafos</button>
        <button onClick={() => onSelect("arboles_grafos")} className="botones">Árboles como Grafos</button>
        <button onClick={() => onSelect("representacion_grafos")} className="botones">Representación de la Información con Grafos</button>
        
      </div>
       <br></br>
      {/* Volver */}
      <button className="botones" onClick={() => onSelect("home")}>
        ⬅ Volver
      </button>
    </div>
  );
}

export default Grafos;
