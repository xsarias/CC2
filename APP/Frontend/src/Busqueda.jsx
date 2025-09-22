function Busqueda({ onSelect }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h2>🔍 Selecciona tipo de búsqueda</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>Internas</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => onSelect("secuencial")} className="botones">
            Secuencial
          </button>
          <button onClick={() => onSelect("binaria")} className="botones">
            Binaria
          </button>
          <button onClick={() => onSelect("hash")} className="botones">
            Hash
          </button>
          <button onClick={() => onSelect("arbol_dig")} className="botones">
            Árboles Digitales
          </button>
        </div>

        <div style={{ marginTop: "10px", display: "flex", flexWrap: "wrap", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => onSelect("residuo")} className="botones">
            Búsquedas por Residuo
          </button>
          <button onClick={() => onSelect("multiples")} className="botones">
            Búsquedas Múltiples
          </button>
          <button onClick={() => onSelect("huffman")} className="botones">
            Árboles de Huffman
          </button>
        </div>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Externas</h3>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => onSelect("externa1")} className="botones">
            Externa 1
          </button>
          <button onClick={() => onSelect("externa2")} className="botones">
            Externa 2
          </button>
        </div>
      </div>

      <button onClick={() => onSelect("home")} style={{ marginTop: "20px" }}>
        ⬅ Volver
      </button>
    </div>
  );
}

export default Busqueda;
