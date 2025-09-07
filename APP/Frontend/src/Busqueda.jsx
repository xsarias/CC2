
function Busqueda({ onSelect }) {
  return (
    <div style={{ textAlign: "center" }}>
      <h2>🔍 Selecciona tipo de búsqueda</h2>

      <div style={{ marginBottom: "20px" }}>
        <h3>Internas</h3>
        <button onClick={() => onSelect("secuencial")} className="btn-chip azul">
          Secuencial
        </button>
        <button onClick={() => onSelect("binaria")} className="btn-chip naranja">
          Binaria
        </button>
        <button onClick={() => onSelect("hash")} className="btn-chip verde">
          Hash
        </button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <h3>Externas</h3>
        <button onClick={() => onSelect("externa1")} className="btn-chip gris">
          Externa 1
        </button>
        <button onClick={() => onSelect("externa2")} className="btn-chip gris">
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
