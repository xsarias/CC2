import { useEffect, useState } from "react";
import axios from "axios";

function App() {
  const [message, setMessage] = useState("Cargando...");

  useEffect(() => {
    axios.get("http://127.0.0.1:8000/") // tu endpoint FastAPI
      .then((res) => {
        setMessage(res.data.message || "Respuesta recibida");
      })
      .catch((err) => {
        setMessage("Error al conectar con backend");
      });
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Frontend con Vite + React</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;
