import { useEffect, useState } from "react";
import axios from "axios";
import Busqueda from "./Busqueda";
import Secuencial from "./Secuencial";
import Binaria from "./Binaria";
import Hash from "./Hash";
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
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#292727ff",
        color: "white",
      }}
    >
      {/* Home */}
      {tab === "home" && (
        <>
          <h1 className="titulo">Ciencias de la Computación II</h1>
          <p>{message}</p>
          <div className="app-container">
            <button onClick={() => setTab("busqueda")}>Búsquedas</button>
            <button onClick={() => setTab("grafos")}>Grafos</button>
          </div>
        </>
      )}

      {/* Menú de algoritmos */}
      {tab === "busqueda" && <Busqueda onSelect={(alg) => setTab(alg)} />}

      {/* Pantallas específicas */}
      {tab === "secuencial" && (
        <Secuencial array={datos} onBack={() => setTab("busqueda")} />
      )}

      {tab === "binaria" && (
        <Binaria array={datos} onBack={() => setTab("busqueda")} />
      )}

      {tab === "hash" && (
        <Hash onBack={() => setTab("busqueda")} />
      )}

      {tab === "grafos" && <h2>Aquí irá la sección de grafos 🚀</h2>}
    </div>
  );
}

export default App;
