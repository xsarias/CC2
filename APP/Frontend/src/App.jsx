import { useEffect, useState } from "react";
import axios from "axios";
import Busqueda from "./Busqueda";
import Secuencial from "./Secuencial";
import Binaria from "./Binaria";
import Hash from "./Hash";
import "./App.css"
function App() {
  const [message, setMessage] = useState("Cargando...");
  const [tab, setTab] = useState("home");
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/")
      .then((res) => setMessage(res.data.message || "Respuesta recibida"))
      .catch(() => setMessage("Error al conectar con backend"));
  }, []);

  return (
    <div className="contenedor"
    >
      {/* Home */}
      {tab === "home" && (
        <>
          <h1 className="titulo">Ciencias de la Computación II</h1>
          <p className= "mensaje">{message}</p>
          <div className="app-container">
            <button onClick={() => setTab("busqueda")} className="botones">Búsquedas</button>
            <button onClick={() => setTab("grafos")} className="botones">Grafos</button>
          </div>
        </>
      )}

      {/* Menú de algoritmos */}
      {tab === "busqueda" && <Busqueda onSelect={(alg) => setTab(alg)} className="botones" />}

      {/* Pantallas específicas */}
      {tab === "secuencial" && (
        <Secuencial array={datos} onBack={() => setTab("busqueda")} className="botones" />
      )}

      {tab === "binaria" && (
        <Binaria array={datos} onBack={() => setTab("busqueda")} className="botones"  />
      )}

      {tab === "hash" && (
        <Hash onBack={() => setTab("busqueda")} />
      )}

      {tab === "grafos" && <h2>Aquí irá la sección de grafos 🚀</h2>}
    </div>
  );
}

export default App;
