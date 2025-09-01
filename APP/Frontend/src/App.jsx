import { useEffect, useState } from "react";
import axios from "axios";
import Busqueda from "./Busqueda";
import IngresarDatos from "./IngresarDatos";

function App() {
  const [message, setMessage] = useState("Cargando...");
  const [tab, setTab] = useState("datos");
  const [datos, setDatos] = useState([]); // array global

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
      <h1>Estructuras de datos</h1>
      <p>{message}</p>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setTab("datos")}
          style={{
            backgroundColor: "#4e127bff",
            color: "white",
            padding: "8px 16px",
            marginRight: "10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "0.3s",
          }}
        >
          Ingresar Datos
        </button>

        <button
          onClick={() => setTab("busqueda")}
          style={{
            backgroundColor: "#4e127bff",
            color: "white",
            padding: "8px 16px",
            marginRight: "10px",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            transition: "0.3s",
          }}
        >
          Búsqueda
        </button>
      </div>


      {tab === "datos" && (
        <IngresarDatos onDataChange={(arr) => setDatos(arr)} />
      )}
      {tab === "busqueda" && (
        <Busqueda array={datos} />
      )}
    </div>
  );
}

export default App;
