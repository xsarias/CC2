function Busqueda({ onSelect }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h2>🔍 Selecciona tipo de búsqueda</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>Internas</h3>
        <button onClick={() => onSelect("secuencial")} className="botones">
          Secuencial
        </button>
        <button onClick={() => onSelect("binaria")} className="botones">
          Binaria
        </button>
        <button onClick={() => onSelect("hash")} className="botones">
          Hash
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Externas</h3>
        <button onClick={() => onSelect("externa1")} className="botones">
          Externa 1
        </button>
        <button onClick={() => onSelect("externa2")} className="botones">
          Externa 2
        </button>
      </div>

      <button onClick={() => onSelect("home")} style={{ marginTop: "20px" }}>
        ⬅ Volver
      </button>
    </div>
  );
}

export default Busqueda;
