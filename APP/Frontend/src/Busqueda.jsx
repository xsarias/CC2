function Busqueda({ onSelect }) {
  return (
    <div className="busqueda-contenedor">
      <h2>Seleccionar un tipo de búsqueda</h2>

      {/* INTERNAS */}
      <div className="panel">
        <h3>Búsquedas Internas</h3>
        <div className="grupo-botones">
          <button onClick={() => onSelect("secuencial")} className="botones">Secuencial</button>
          <button onClick={() => onSelect("binaria")} className="botones">Binaria</button>
          <button onClick={() => onSelect("hash")} className="botones">Hash</button>
          <button onClick={() => onSelect("arbol_dig")} className="botones">Árboles Digitales</button>
          <button onClick={() => onSelect("residuo")} className="botones">Residuo</button>
          <button onClick={() => onSelect("multiples")} className="botones">Residuo Múltiples</button>
          <button onClick={() => onSelect("huffman")} className="botones">Árboles de Huffman</button>
        </div>
      </div>

      {/* EXTERNAS */}
      <div className="panel">
        <h3>Búsquedas Externas</h3>
        <div className="grupo-botones">
          <button onClick={() => onSelect("SecuencialEx")} className="botones">Secuencial</button>
          <button onClick={() => onSelect("BinariaEx")} className="botones">Binaria</button>
          <button onClick={() => onSelect("HashEx")} className="botones">Hash</button>
        </div>
      </div>

      {/* Volver */}
      <button className="botones" onClick={() => onSelect("home")}>
        ⬅ Volver
      </button>
    </div>
  );
}

export default Busqueda;
